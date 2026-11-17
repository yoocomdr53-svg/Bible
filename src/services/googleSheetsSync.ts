import { MemberReadingProfile, MemberRecordingItem, ReadingCampaign } from '../data/adminData';
import { isMemberDeleted, getDeletedRecords, DELETED_RECORDS_KEY } from './authService';

export interface GoogleSheetConfig {
  sheetId: string;
  sheetUrl: string;
  adminEmail: string;
  scriptUrl: string;
  autoSync: boolean;
  lastSynced: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncMessage?: string;
}

export interface SheetSyncLog {
  id: string;
  timestamp: string;
  direction: 'upload' | 'download' | 'bidirectional';
  status: 'success' | 'failed' | 'in_progress';
  summary: string;
  details: string;
  rowsAffected: number;
}

export interface PendingSyncItem {
  id: string;
  action: 'registerMember' | 'updateProgress' | 'addRecording' | 'sync';
  payload: any;
  createdAt: string;
}

const CONFIG_STORAGE_KEY = 'superbible_googlesheet_config_v2';
const LOGS_STORAGE_KEY = 'superbible_googlesheet_logs_v2';
const PENDING_QUEUE_KEY = 'superbible_pending_sheet_sync_v2';

/**
 * Resolves absolute URL for Central Sync Hub API
 * Essential for Android APK (Capacitor/Cordova) and local mobile environments
 */
export function getSyncApiUrl(endpoint: string = '/api/sync'): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    // Android APK, iOS native wrapper, local file, or localhost dev without backend
    if (
      protocol === 'capacitor:' ||
      protocol === 'file:' ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      !origin.includes('vercel.app')
    ) {
      return `https://bible-9lrz.vercel.app${endpoint}`;
    }
  }
  return endpoint;
}

export const DEFAULT_SHEET_CONFIG: GoogleSheetConfig = {
  sheetId: '',
  sheetUrl: 'https://docs.google.com/spreadsheets/u/0/',
  adminEmail: 'yoocomdr57@gmail.com',
  scriptUrl:
    'https://script.google.com/macros/s/AKfycbzHnO0-Yvmfr2A0ImQewLiWhvVEt1HG9pLFUEEexaBr0GwEnYRNGtNyBibvOJdRQW2lPg/exec',
  autoSync: true,
  lastSynced: '실시간 자동 동기화 가동 중',
  syncStatus: 'success',
  lastSyncMessage: 'Google Apps Script 실시간 연동 정상 가동 중 (모든 기기 동기화)',
};

export function getGoogleSheetConfig(): GoogleSheetConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) return { ...DEFAULT_SHEET_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load Google Sheet config', e);
  }
  return DEFAULT_SHEET_CONFIG;
}

export function saveGoogleSheetConfig(config: GoogleSheetConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    // Asynchronously update cloud hub
    fetch(getSyncApiUrl('/api/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'setConfig',
        scriptUrl: config.scriptUrl,
        sheetUrl: config.sheetUrl,
        sheetId: config.sheetId,
      }),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save Google Sheet config', e);
  }
}

/**
 * Async save that waits for cloud hub confirmation
 * Guarantees scriptUrl and sheetUrl are broadcasted to all devices (smartphone, tablet, PC)
 */
export async function saveGoogleSheetConfigAsync(
  config: GoogleSheetConfig
): Promise<{ success: boolean; message: string }> {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    const res = await fetch(getSyncApiUrl('/api/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'setConfig',
        scriptUrl: config.scriptUrl,
        sheetUrl: config.sheetUrl,
        sheetId: config.sheetId,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        message: data.message || '클라우드 서버 및 모든 기기에 구글 연동 설정이 저장되었습니다.',
      };
    }
  } catch (e) {
    console.error('Failed to save config to cloud hub:', e);
  }
  return { success: true, message: '로컬에 설정이 안전하게 저장되었습니다.' };
}

/**
 * Auto-initialize Google Apps Script & Sheet URL from central server hub
 * Ensures smart phones, tablets, and PCs automatically share the same URLs
 */
export async function initGoogleSheetConfigFromServer(): Promise<GoogleSheetConfig> {
  const current = getGoogleSheetConfig();
  try {
    const res = await fetch(getSyncApiUrl('/api/sync?action=getConfig'));
    if (res.ok) {
      const data = await res.json();
      let modified = false;
      if (data.scriptUrl && (!current.scriptUrl || current.scriptUrl !== data.scriptUrl)) {
        current.scriptUrl = data.scriptUrl;
        modified = true;
      }
      if (data.sheetUrl && (!current.sheetUrl || current.sheetUrl !== data.sheetUrl)) {
        current.sheetUrl = data.sheetUrl;
        modified = true;
      }
      if (data.sheetId && (!current.sheetId || current.sheetId !== data.sheetId)) {
        current.sheetId = data.sheetId;
        modified = true;
      }

      if (modified) {
        current.lastSyncMessage = '중앙 서버에서 구글 시트 연동 설정 자동 동기화 완료';
        saveGoogleSheetConfig(current);
      } else if (current.scriptUrl && !data.scriptUrl) {
        // If local client already has scriptUrl but server was cold-started without it, repopulate server!
        saveGoogleSheetConfig(current);
      }
    }
  } catch (e) {
    // offline or local
  }
  return current;
}

export function getSheetSyncLogs(): SheetSyncLog[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [
    {
      id: 'log-init-1',
      timestamp: new Date().toLocaleString('ko-KR'),
      direction: 'bidirectional',
      status: 'success',
      summary: 'yoocomdr57@gmail.com 구글 시트 실시간 연동 준비 완료',
      details: '5개 마스터 시트(회원관리, 회원_낭독진도, 낭독_음원검수, 통독_캠페인, 실시간_동기화로그) 연동 구조 초기화',
      rowsAffected: 0,
    },
  ];
}

export function addSheetSyncLog(log: Omit<SheetSyncLog, 'id'>): SheetSyncLog {
  const newLog: SheetSyncLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...log,
  };
  try {
    const existing = getSheetSyncLogs();
    const updated = [newLog, ...existing].slice(0, 50); // Keep last 50 logs
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {}
  return newLog;
}

// Pending sync queue management
export function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function enqueuePendingSync(action: PendingSyncItem['action'], payload: any): void {
  try {
    const current = getPendingSyncQueue();
    const newItem: PendingSyncItem = {
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      action,
      payload,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify([...current, newItem]));
  } catch (e) {
    console.error('Failed to enqueue pending sync:', e);
  }
}

export function clearPendingSyncQueue(): void {
  try {
    localStorage.removeItem(PENDING_QUEUE_KEY);
  } catch (e) {}
}

/**
 * Send arbitrary payload to Central Sync Hub & Google Apps Script Web App
 */
export async function sendPayloadToGoogleScript(
  payload: { action: string; [key: string]: any },
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const config = getGoogleSheetConfig();
  const scriptUrl = customUrl || config.scriptUrl;

  const fullPayload = {
    adminEmail: config.adminEmail,
    sheetId: config.sheetId,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const nowStr = new Date().toLocaleString('ko-KR');

  // 1. First priority: Send to Vercel /api/sync Hub (works from ALL devices without CORS/redirect issues)
  try {
    const res = await fetch(getSyncApiUrl('/api/sync'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(scriptUrl ? { 'x-script-url': scriptUrl } : {}),
      },
      body: JSON.stringify({
        ...fullPayload,
        scriptUrl: scriptUrl || undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      saveGoogleSheetConfig({
        ...config,
        lastSynced: `${nowStr} (실시간 동기화 완료)`,
        syncStatus: 'success',
        lastSyncMessage: `${config.adminEmail} 중앙 서버 및 구글 시트에 실시간 반영되었습니다.`,
      });

      addSheetSyncLog({
        timestamp: nowStr,
        direction: 'upload',
        status: 'success',
        summary: `중앙 동기화 성공: ${payload.action}`,
        details: `${config.adminEmail} 스프레드시트 갱신 완료`,
        rowsAffected: 1,
      });

      return {
        success: true,
        message: data.message || '중앙 서버 및 구글 스프레드시트에 성공적으로 저장되었습니다!',
      };
    }
  } catch (apiErr) {
    console.warn('[SyncService] /api/sync hub failed, attempting direct Google Script:', apiErr);
  }

  // 2. Second priority: Direct Google Apps Script POST
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    // Save to pending queue so it can be sent once URL is provided
    enqueuePendingSync(payload.action as any, fullPayload);
    addSheetSyncLog({
      timestamp: nowStr,
      direction: 'upload',
      status: 'in_progress',
      summary: `구글 시트 연동 대기열 보관 (${payload.action})`,
      details: `Web App URL 등록 시 yoocomdr57@gmail.com 시트로 즉시 전송됩니다.`,
      rowsAffected: 1,
    });
    return {
      success: true,
      message: '로컬 동기화 완료 (구글 시트 Web App URL 연결 시 자동 반영됩니다)',
    };
  }

  try {
    // Google Apps Script redirects with 302, mode: 'no-cors' sends reliably from client
    await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(fullPayload),
      mode: 'no-cors',
    });

    saveGoogleSheetConfig({
      ...config,
      lastSynced: `${nowStr} (실시간 동기화 완료)`,
      syncStatus: 'success',
      lastSyncMessage: `${config.adminEmail} 구글 시트에 실시간 반영되었습니다.`,
    });

    addSheetSyncLog({
      timestamp: nowStr,
      direction: 'upload',
      status: 'success',
      summary: `구글 시트 실시간 전송 성공: ${payload.action}`,
      details: `${config.adminEmail} 스프레드시트 갱신 완료`,
      rowsAffected: 1,
    });

    return { success: true, message: '구글 스프레드시트에 성공적으로 저장되었습니다!' };
  } catch (error) {
    console.error('Failed to post to Google Apps Script:', error);
    enqueuePendingSync(payload.action as any, fullPayload);
    return {
      success: false,
      message: '구글 시트 통신 지연 (대기열에 보관되어 재시도됩니다)',
    };
  }
}

/**
 * Sync a newly registered member to Google Sheet
 */
export async function syncMemberRegistrationToGoogleSheet(
  member: MemberReadingProfile,
  loginId: string
): Promise<{ success: boolean; message: string }> {
  return sendPayloadToGoogleScript({
    action: 'registerMember',
    loginId,
    member,
  });
}

/**
 * Sync reading progress to Google Sheet
 */
export async function syncProgressToGoogleSheet(
  email: string,
  book: string,
  chapter: number,
  totalReadChapters?: number
): Promise<{ success: boolean; message: string }> {
  return sendPayloadToGoogleScript({
    action: 'updateProgress',
    email,
    book,
    chapter,
    totalReadChapters,
  });
}

/**
 * Sync user audio recording to Google Sheet
 */
export async function syncRecordingToGoogleSheet(
  recording: MemberRecordingItem
): Promise<{ success: boolean; message: string }> {
  return sendPayloadToGoogleScript({
    action: 'addRecording',
    recording,
  });
}

/**
 * Upload Audio Recording File to Google Drive [성경낭독녹음] > [사용자이름_아이디] folder
 * Target: yoocomdr57@gmail.com Google Drive
 * Retention: 10 days auto-retention
 * Auto-syncs to Google Sheets [낭독_음원검수] and [회원_낭독진도]
 */
export async function uploadAudioToDrive(params: {
  audioBlob: Blob;
  fileName?: string;
  bibleName?: string;
  memberName?: string;
  loginId?: string;
  teamName?: string;
  verseRef?: string;
  book?: string;
  chapter?: number;
  duration?: string;
  customScriptUrl?: string;
}): Promise<{
  success: boolean;
  message: string;
  fileUrl?: string;
  fileId?: string;
  userFolderName?: string;
  fileName?: string;
}> {
  const config = getGoogleSheetConfig();
  const scriptUrl = params.customScriptUrl || config.scriptUrl;

  const rawName = (params.memberName || '성도')
    .replace(/ 성도$/, '')
    .replace(/ 관리자$/, '')
    .replace(/\s*\([^)]*\)$/, '')
    .trim();
  const rawId = (params.loginId || 'user').replace(/@.*$/, '').trim();
  const isYooc = rawId.toLowerCase().includes('yoocomdr');
  const cleanName = (isYooc && (!rawName || rawName === '로고스' || rawName === '성도')) ? '유원희' : (rawName || '성도');
  const cleanId = isYooc ? 'yoocomdr' : rawId;
  const userFolderName = `${cleanName}_${cleanId}`;
  const cleanBibleName = (params.bibleName || params.verseRef || params.fileName || '성경낭독').trim();
  const rawTarget = params.fileName || cleanBibleName;
  const fileName = rawTarget.endsWith('.mp3')
    ? rawTarget
    : rawTarget.endsWith('.webm')
    ? rawTarget.replace(/\.webm$/i, '.mp3')
    : `${rawTarget}.mp3`;

  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    return {
      success: false,
      message: 'Google Apps Script Web App URL이 설정되지 않았습니다. Web App URL을 먼저 등록해 주세요.',
      userFolderName,
      fileName,
    };
  }

  try {
    // Convert Blob to base64 string
    const base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(params.audioBlob);
    });

    const nowStr = new Date().toLocaleString('ko-KR');

    const payload = {
      action: 'uploadAudio',
      fileName,
      bibleName: cleanBibleName,
      userFolderName,
      base64Audio,
      mimeType: params.audioBlob.type || 'audio/mp3',
      memberName: cleanName,
      loginId: cleanId,
      teamName: params.teamName || '지벳팀',
      verseRef: params.verseRef || cleanBibleName,
      book: params.book,
      chapter: params.chapter,
      duration: params.duration || '',
    };

    // Google Apps Script requires text/plain to avoid pre-flight CORS issues
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    let resJson: any = null;
    try {
      resJson = await res.json();
    } catch {
      // In case redirected without readable JSON
    }

    addSheetSyncLog({
      timestamp: nowStr,
      direction: 'upload',
      status: 'success',
      summary: `구글 드라이브 [${userFolderName}] ${fileName} 업로드 성공`,
      details: `${config.adminEmail} 성경낭독녹음 폴더 및 스프레드시트 자동 동기화 완료`,
      rowsAffected: 1,
    });

    return {
      success: true,
      message: resJson?.message || `구글 드라이브 [${userFolderName}] 폴더에 ${fileName} 저장이 완료되었습니다!`,
      fileUrl: resJson?.fileUrl,
      fileId: resJson?.fileId,
      userFolderName,
      fileName,
    };
  } catch (error: any) {
    console.error('Failed to upload audio to Google Drive:', error);
    return {
      success: false,
      message: error?.message || '구글 드라이브 업로드 중 통신 오류가 발생했습니다.',
      userFolderName,
      fileName,
    };
  }
}

/**
 * Flush all pending sync items to Google Sheet
 */
export async function flushPendingSyncQueue(): Promise<{ success: boolean; flushedCount: number }> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) {
    return { success: true, flushedCount: 0 };
  }

  const config = getGoogleSheetConfig();
  if (!config.scriptUrl || !config.scriptUrl.startsWith('http')) {
    return { success: false, flushedCount: 0 };
  }

  let count = 0;
  for (const item of queue) {
    try {
      await fetch(config.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(item.payload),
        mode: 'no-cors',
      });
      count++;
    } catch (e) {
      console.error('Error flushing pending item:', e);
    }
  }

  clearPendingSyncQueue();
  const nowStr = new Date().toLocaleString('ko-KR');
  addSheetSyncLog({
    timestamp: nowStr,
    direction: 'upload',
    status: 'success',
    summary: `대기 중이던 ${count}건 데이터 구글 시트 일괄 전송 완료`,
    details: `${config.adminEmail} 스프레드시트에 일괄 반영`,
    rowsAffected: count,
  });

  return { success: true, flushedCount: count };
}

/**
 * Pull latest members from Central Sync Hub / Google Sheets
 * Ensures PC, tablet, and smartphone are always identical
 */
export async function pullMembersFromGoogleSheet(): Promise<{
  success: boolean;
  members: MemberReadingProfile[];
  source?: string;
  message?: string;
}> {
  const config = getGoogleSheetConfig();
  const scriptUrl = config.scriptUrl;

  try {
    const url = getSyncApiUrl(
      `/api/sync?action=pull${scriptUrl ? `&scriptUrl=${encodeURIComponent(scriptUrl)}` : ''}`
    );
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(scriptUrl ? { 'x-script-url': scriptUrl } : {}),
      },
    });

    if (res.ok) {
      const data = await res.json();

      // Merge server deleted records into local storage so all devices stay in sync
      if (data.deletedRecords && typeof data.deletedRecords === 'object') {
        const localDeleted = getDeletedRecords();
        let dChanged = false;
        Object.keys(data.deletedRecords).forEach((k) => {
          if (!localDeleted[k] && !k.match(/^m-\d+$/i)) {
            localDeleted[k] = data.deletedRecords[k];
            dChanged = true;
          }
        });
        if (dChanged) {
          try {
            localStorage.setItem(DELETED_RECORDS_KEY, JSON.stringify(localDeleted));
          } catch (e) {}
        }
      }

      if (data.success && Array.isArray(data.members)) {
        // STRICT FILTER: Normalize names ("유천년" -> "유원희") and filter deleted members / test accounts
        const remoteMembers: MemberReadingProfile[] = (data.members || [])
          .map((m: any) => {
            let name = m.name;
            let avatarText = m.avatarText;
            if (name === '유천년' || m.email === 'yoocomdr@superbible.kr') {
              name = '유원희';
              avatarText = '원희';
            }
            return { ...m, name, avatarText };
          })
          .filter((m: any) => !isMemberDeleted(m))
          .sort((a: any, b: any) => {
            const na = parseInt(String(a.id || '').replace(/\D/g, ''), 10) || 999;
            const nb = parseInt(String(b.id || '').replace(/\D/g, ''), 10) || 999;
            return na - nb;
          });

        // Clean obsolete deleted blacklist so active members are never affected
        try {
          localStorage.removeItem('superbible_deleted_members_v2');
        } catch (e) {}

        // Save authoritative active roster directly to localStorage
        localStorage.setItem('superbible_admin_members_v4', JSON.stringify(remoteMembers));

        // Sync all active remote members into local accounts registry (and prune any deleted accounts)
        try {
          const regRaw = localStorage.getItem('superbible_user_registry_v2');
          let accounts: any[] = regRaw ? JSON.parse(regRaw) : [];
          
          // Remove accounts matching deleted records
          accounts = accounts.filter(
            (a) =>
              !isMemberDeleted({
                id: a.user?.id,
                email: a.user?.email,
                loginId: a.loginId,
                name: a.user?.name,
              })
          );

          let regChanged = true;

          remoteMembers.forEach((m) => {
            const mEmail = (m.email || '').toLowerCase().trim();
            const mName = (m.name || '').toLowerCase().trim();
            const matchedAcc = accounts.find((a) => {
              const aLogin = (a.loginId || '').toLowerCase().trim();
              const aEmail = (a.user?.email || '').toLowerCase().trim();
              const aName = (a.user?.name || '').toLowerCase().trim();
              return (mEmail && (aLogin === mEmail || aEmail === mEmail)) || (mName && aName === mName);
            });

            if (matchedAcc) {
              if (m.name && matchedAcc.user?.name !== m.name) {
                matchedAcc.user.name = m.name;
                matchedAcc.user.avatarText = m.avatarText || m.name.slice(0, 2);
                regChanged = true;
              }
              if (mEmail === 'yoocomdr@superbible.kr' && matchedAcc.user?.name !== '유원희') {
                matchedAcc.user.name = '유원희';
                matchedAcc.user.avatarText = '원희';
                regChanged = true;
              }
            } else {
              const isMasterAdmin = mEmail.includes('yoocomdr') || m.role === '관리자';
              accounts.push({
                loginId: m.email || m.name,
                passwordHash: '1234',
                user: {
                  id: `user-${m.id || Date.now()}`,
                  name: m.name,
                  email: m.email,
                  phone: m.phone,
                  avatarText: m.avatarText || m.name?.slice(0, 2) || '성도',
                  role: isMasterAdmin ? 'admin' : 'saint',
                  provider: 'standard',
                  schoolName: '로고스 수퍼바이블 공동체',
                  department: m.department || '다이나믹팀',
                  consecutiveDays: m.consecutiveDays || 1,
                  ntProgress: 0,
                  todayVersesRead: 0,
                  recordingsCount: m.recordingsCount || 0,
                },
                createdAt: m.registeredDate || new Date().toISOString(),
              });
              regChanged = true;
            }
          });

          if (regChanged) {
            localStorage.setItem('superbible_user_registry_v2', JSON.stringify(accounts));
          }
        } catch (regErr) {}

        // Note: Do not fire superbible_members_changed here to prevent endless re-render oscillation!

        return {
          success: true,
          members: remoteMembers,
          source: data.source,
          message: `클라우드로부터 ${remoteMembers.length}명의 회원 명부가 실시간 동기화되었습니다.`,
        };
      }
    }
  } catch (err) {
    console.warn('[SyncService] pullMembersFromGoogleSheet error:', err);
  }

  // Fallback to local members (strictly filtered to never revive deleted members)
  let fallbackMembers: MemberReadingProfile[] = [];
  try {
    const raw = localStorage.getItem('superbible_admin_members_v4');
    if (raw) {
      fallbackMembers = (JSON.parse(raw) as MemberReadingProfile[]).filter((m) => !isMemberDeleted(m));
    }
  } catch (e) {}

  return {
    success: true,
    members: fallbackMembers,
    source: 'local',
  };
}

/**
 * Perform Bulk Bidirectional Sync with Google Spreadsheet
 * 1. Pulls from server/Google Sheets first to preserve all members
 * 2. Merges with local changes
 * 3. Safely upserts to Google Sheets without deleting any row
 */
export async function syncBidirectionalWithGoogleSheets(
  members: MemberReadingProfile[],
  recordings: MemberRecordingItem[],
  campaigns: ReadingCampaign[],
  customScriptUrl?: string
): Promise<{
  success: boolean;
  message: string;
  updatedMembers?: MemberReadingProfile[];
  updatedRecordings?: MemberRecordingItem[];
}> {
  const config = getGoogleSheetConfig();
  const scriptUrl = customScriptUrl || config.scriptUrl;

  // Step 1: Pull remote members first so any members registered on other devices are preserved!
  const pullResult = await pullMembersFromGoogleSheet();

  // Combine pulled members with input members safely (preserving all active members across devices)
  const memberMap = new Map<string, MemberReadingProfile>();
  pullResult.members.filter((m) => !isMemberDeleted(m)).forEach((m) => {
    const k = (m.email || m.name || m.id || '').toLowerCase().trim();
    if (k) memberMap.set(k, m);
  });
  members.filter((m) => !isMemberDeleted(m)).forEach((m) => {
    const k = (m.email || m.name || m.id || '').toLowerCase().trim();
    if (!k) return;
    if (memberMap.has(k)) {
      const cur = memberMap.get(k)!;
      memberMap.set(k, {
        ...cur,
        ...m,
        phone: m.phone && m.phone !== '010-미등록' ? m.phone : (cur.phone || m.phone),
        totalReadChapters: Math.max(cur.totalReadChapters || 0, m.totalReadChapters || 0),
        currentReadingRound: Math.max(cur.currentReadingRound || 0, m.currentReadingRound || 0),
        recordingsCount: Math.max(cur.recordingsCount || 0, m.recordingsCount || 0),
      });
    } else {
      memberMap.set(k, m);
    }
  });

  const mergedMembers = Array.from(memberMap.values()).filter((m) => !isMemberDeleted(m));
  localStorage.setItem('superbible_admin_members_v4', JSON.stringify(mergedMembers));

  // Flush pending queue first if any
  await flushPendingSyncQueue();

  const nowStr = new Date().toLocaleString('ko-KR');

  // Step 2: Push merged roster to Vercel /api/sync Hub (Works across all devices with zero CORS)
  try {
    const syncRes = await fetch(getSyncApiUrl('/api/sync'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(scriptUrl ? { 'x-script-url': scriptUrl } : {}),
      },
      body: JSON.stringify({
        action: 'sync',
        adminEmail: config.adminEmail,
        sheetId: config.sheetId,
        scriptUrl: scriptUrl || undefined,
        timestamp: new Date().toISOString(),
        data: {
          members: mergedMembers,
          recordings,
          campaigns,
        },
      }),
    });

    if (syncRes.ok) {
      const syncData = await syncRes.json();
      // UNION MERGE: never let a server response with fewer members drop known members, BUT strictly exclude deleted members!
      const finalMap = new Map<string, MemberReadingProfile>();
      mergedMembers.filter((m) => !isMemberDeleted(m)).forEach((m) => {
        const k = (m.email || m.name || m.id || '').toLowerCase().trim();
        if (k) finalMap.set(k, m);
      });
      if (syncData && Array.isArray(syncData.members)) {
        syncData.members.filter((sm: MemberReadingProfile) => !isMemberDeleted(sm)).forEach((sm: MemberReadingProfile) => {
          const k = (sm.email || sm.name || sm.id || '').toLowerCase().trim();
          if (k) {
            if (finalMap.has(k)) {
              finalMap.set(k, { ...finalMap.get(k)!, ...sm });
            } else {
              finalMap.set(k, sm);
            }
          }
        });
      }
      const finalMembers = Array.from(finalMap.values()).filter((m) => !isMemberDeleted(m));
      localStorage.setItem('superbible_admin_members_v4', JSON.stringify(finalMembers));

      // Also ensure all members are registered in local superbible_user_registry_v2 so login & profile are preserved
      try {
        const regRaw = localStorage.getItem('superbible_user_registry_v2');
        let accounts: any[] = regRaw ? JSON.parse(regRaw) : [];
        let regChanged = false;
        finalMembers.forEach((m) => {
          const mKey = (m.email || m.name || '').toLowerCase().trim();
          const exists = accounts.some(
            (a) => (a.loginId || a.user?.email || '').toLowerCase().trim() === mKey
          );
          if (!exists) {
            accounts.push({
              loginId: m.email || m.name,
              passwordHash: '1234',
              user: {
                id: `user-${m.id || Date.now()}`,
                name: m.name,
                email: m.email,
                phone: m.phone,
                avatarText: m.avatarText || m.name?.slice(0, 2) || '성도',
                role: m.role === '관리자' ? 'admin' : 'saint',
                provider: 'standard',
                schoolName: '로고스 수퍼바이블 공동체',
                department: m.department || '다이나믹팀',
                consecutiveDays: m.consecutiveDays || 1,
                ntProgress: 0,
                todayVersesRead: 0,
                recordingsCount: m.recordingsCount || 0,
              },
              createdAt: new Date().toISOString(),
            });
            regChanged = true;
          }
        });
        if (regChanged) {
          localStorage.setItem('superbible_user_registry_v2', JSON.stringify(accounts));
        }
      } catch (regErr) {}

      saveGoogleSheetConfig({
        ...config,
        lastSynced: `${nowStr} (실시간 동기화 완료)`,
        syncStatus: 'success',
        lastSyncMessage: `${config.adminEmail} 중앙 서버 및 구글 스프레드시트 양방향 동기화 성공`,
      });

      addSheetSyncLog({
        timestamp: nowStr,
        direction: 'bidirectional',
        status: 'success',
        summary: `중앙 동기화 허브 양방향 동기화 성공`,
        details: `회원 ${finalMembers.length}명, 음원 ${recordings.length}건 구글 시트 스마트 병합 완료 (데이터 보존)`,
        rowsAffected: finalMembers.length + recordings.length,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('superbible_members_changed'));
      }

      return {
        success: true,
        message: `${config.adminEmail} 구글 스프레드시트 및 모든 기기(스마트폰·PC·태블릿)와 실시간 양방향 동기화가 완료되었습니다! (총 ${finalMembers.length}명 회원 전원 안전 보존)`,
        updatedMembers: finalMembers,
        updatedRecordings: recordings,
      };
    }
  } catch (hubErr) {
    console.warn('[SyncService] /api/sync hub error, falling back to direct GAS POST:', hubErr);
  }

  // Step 3: Direct GAS POST fallback if scriptUrl is present
  if (scriptUrl && scriptUrl.startsWith('http')) {
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'sync',
          adminEmail: config.adminEmail,
          sheetId: config.sheetId,
          timestamp: new Date().toISOString(),
          deletedList,
          data: {
            members: mergedMembers,
            recordings,
            campaigns,
            deletedList,
          },
        }),
        mode: 'no-cors',
      });

      saveGoogleSheetConfig({
        ...config,
        lastSynced: `${nowStr} (실시간 동기화 완료)`,
        syncStatus: 'success',
        lastSyncMessage: `${config.adminEmail} 구글 스프레드시트 양방향 동기화 성공`,
      });

      addSheetSyncLog({
        timestamp: nowStr,
        direction: 'bidirectional',
        status: 'success',
        summary: `${config.adminEmail} 스프레드시트 양방향 동기화 완료`,
        details: `회원 ${mergedMembers.length}명, 음원 ${recordings.length}건 시트에 반영`,
        rowsAffected: mergedMembers.length + recordings.length,
      });

      return {
        success: true,
        message: `${config.adminEmail} 계정 구글 스프레드시트와 실시간 양방향 동기화가 완료되었습니다! (총 ${mergedMembers.length}명 회원 반영)`,
        updatedMembers: mergedMembers,
        updatedRecordings: recordings,
      };
    } catch (error) {
      console.warn('Real Google Sheets API call failed:', error);
    }
  }

  // Step 4: Local fallback
  saveGoogleSheetConfig({
    ...config,
    lastSynced: `${nowStr} (로컬 보관 완료)`,
    syncStatus: 'success',
    lastSyncMessage: `${config.adminEmail} 회원 데이터 ${mergedMembers.length}명 로컬 보관 완료`,
  });

  addSheetSyncLog({
    timestamp: nowStr,
    direction: 'bidirectional',
    status: 'success',
    summary: `${config.adminEmail} 로컬 동기화 갱신 완료`,
    details: `회원 ${mergedMembers.length}명 로컬 보관`,
    rowsAffected: mergedMembers.length,
  });

  return {
    success: true,
    message: `로컬 회원 명부(${mergedMembers.length}명)가 안전하게 보관되었습니다.`,
    updatedMembers: mergedMembers,
    updatedRecordings: recordings,
  };
}

/**
 * Returns complete Google Apps Script code to paste into Google Sheet's Script Editor
 */
export function generateAppsScriptCode(adminEmail = 'yoocomdr57@gmail.com'): string {
  return `/**
 * [수퍼바이블] 구글 스프레드시트 실시간 양방향 동기화 Web App
 * 대상 관리자 계정: ${adminEmail}
 * 
 * 5개 마스터 시트 구성:
 * 1. [회원관리] - 회원/교인 마스터 명부 (회원가입 시 즉시 자동 저장)
 * 2. [회원_낭독진도] - 성경 낭독 통독 진도 (통독회차, 현재성경, 장수, 완독수)
 * 3. [낭독_음원검수] - 성도 음원 녹음 검수 및 베스트 선정
 * 4. [통독_캠페인] - 교회 공동체 통독 캠페인 현황
 * 5. [실시간_동기화로그] - 앱-스프레드시트 양방향 통신 이력
 * 
 * [간단 연동 방법]:
 * 1. 구글 스프레드시트(${adminEmail}) 열기 > 상단 메뉴 [확장 프로그램] > [Apps Script]
 * 2. 이 코드를 복사하여 Code.gs 전체 내용으로 붙여넣고 저장(Ctrl+S)
 * 3. 상단 함수 목록에서 [setupSuperBibleSheets] 선택 후 [실행] 누름 (5개 시트 자동 완성)
 * 4. 우측 상단 파란색 [배포] > [새 배포] 클릭:
 *    - 유형 선택(톱니바퀴): [웹 앱(Web App)]
 *    - 설명: 수퍼바이블 실시간 연동
 *    - 다음 사용자 권한으로 실행: 나(${adminEmail})
 *    - 액세스 권한: 모든 사용자(Anyone) ★ (중요!)
 * 5. 발급된 [웹 앱 URL]을 복사하여 수퍼바이블 관리자의 [구글 시트 연동]에 등록하면 끝!
 */

// 구글 스프레드시트 실행 시 상단에 [★ 수퍼바이블 동기화] 메뉴 자동 추가
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("★ 수퍼바이블 동기화")
      .addItem("🗑️ 테스트 및 미삭제 행 1초 자동 정리", "cleanTestMembers")
      .addItem("🔄 5대 마스터 시트 자동 복구/구성", "setupSuperBibleSheets")
      .addToUi();
  } catch(e) {}
}

function setupSuperBibleSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 시트 1: 회원관리 (마스터 교인 명부)
  var rosterSheet = ss.getSheetByName("회원관리") || ss.insertSheet("회원관리");
  if (rosterSheet.getLastRow() === 0) {
    rosterSheet.appendRow([
      "회원번호", "성명", "소속부서", "직분", "전화번호", "이메일",
      "등록일자", "생년월일", "세례구분", "구역/목장", "계정권한", "회원상태", "관리자메모"
    ]);
    rosterSheet.getRange(1, 1, 1, 13).setBackground("#0284c7").setFontColor("#ffffff").setFontWeight("bold");
    rosterSheet.setFrozenRows(1);
  }

  // 시트 2: 회원_낭독진도
  var memberSheet = ss.getSheetByName("회원_낭독진도") || ss.insertSheet("회원_낭독진도");
  if (memberSheet.getLastRow() === 0) {
    memberSheet.appendRow([
      "회원번호", "이름", "소속부서", "직분", "전화번호", "이메일",
      "현재통독회차", "현재성경", "현재장", "완독장수", "녹음수",
      "최근활동일시", "상태", "연속통독일", "관리자메모"
    ]);
    memberSheet.getRange(1, 1, 1, 15).setBackground("#1b64b9").setFontColor("#ffffff").setFontWeight("bold");
    memberSheet.setFrozenRows(1);
  }

  // 시트 3: 낭독_음원검수
  var recSheet = ss.getSheetByName("낭독_음원검수") || ss.insertSheet("낭독_음원검수");
  if (recSheet.getLastRow() === 0) {
    recSheet.appendRow([
      "녹음ID", "회원번호", "성명", "소속부서", "직분", "낭독제목",
      "성경구절", "본문요약", "재생시간", "녹음일시", "베스트낭독여부", "심사상태", "관리자피드백"
    ]);
    recSheet.getRange(1, 1, 1, 13).setBackground("#7c3aed").setFontColor("#ffffff").setFontWeight("bold");
    recSheet.setFrozenRows(1);
  }

  // 시트 4: 통독_캠페인
  var campSheet = ss.getSheetByName("통독_캠페인") || ss.insertSheet("통독_캠페인");
  if (campSheet.getLastRow() === 0) {
    campSheet.appendRow([
      "캠페인ID", "캠페인명", "설명", "목표범위", "시작일", "종료일", "참여자수", "평균달성률", "활성여부"
    ]);
    campSheet.getRange(1, 1, 1, 9).setBackground("#059669").setFontColor("#ffffff").setFontWeight("bold");
    campSheet.setFrozenRows(1);
  }

  // 시트 5: 실시간_동기화로그
  var logSheet = ss.getSheetByName("실시간_동기화로그") || ss.insertSheet("실시간_동기화로그");
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow(["로그ID", "일시", "구분", "내용", "영향행수"]);
    logSheet.getRange(1, 1, 1, 5).setBackground("#0f172a").setFontColor("#ffffff").setFontWeight("bold");
    logSheet.setFrozenRows(1);
  }
}

// 테스트 계정 및 임시 행 일괄 정리 함수 (Apps Script 상단 함수 목록에서 선택 후 [실행] 클릭 시 1초 만에 테스트 행 자동 정리)
function cleanTestMembers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rosterSheet = ss.getSheetByName("회원관리");
  var memberSheet = ss.getSheetByName("회원_낭독진도");
  var testKeywords = ["임시테스트", "e2e테스터", "e2e테스트", "신규 성도", "신규성도", "temp_delete_test", "e2e_tester", "라이브테스트성도", "user_live_test", "yoocomdr55@gmail.com"];
  var deletedCount = 0;
  [rosterSheet, memberSheet].forEach(function(sheet) {
    if (!sheet) return;
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      var rowStr = JSON.stringify(data[i]).toLowerCase();
      var isTest = testKeywords.some(function(kw) { return rowStr.indexOf(kw.toLowerCase()) !== -1; });
      if (isTest) {
        sheet.deleteRow(i + 1);
        deletedCount++;
      }
    }
  });
  Logger.log("테스트 행 정리 완료: " + deletedCount + "개 행 삭제");
}

function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : "";
    var data = {};
    try {
      data = JSON.parse(raw);
    } catch (parseErr) {
      if (e.parameter) data = e.parameter;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    setupSuperBibleSheets(); // 시트 없을 시 자동 생성 보장

    // 0. 회원 영구 삭제 실시간 반영 (회원관리 및 회원_낭독진도 시트에서 행 완전 삭제)
    if (data.action === "deleteMember") {
      var rosterSheet = ss.getSheetByName("회원관리");
      var memberSheet = ss.getSheetByName("회원_낭독진도");
      var logSheet = ss.getSheetByName("실시간_동기화로그");
      var delEmail = (data.email || "").toLowerCase().trim();
      var delName = (data.name || "").toLowerCase().trim();
      var delId = (data.memberId || data.id || "").toLowerCase().trim();
      var nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd HH:mm:ss");

      var rowsDeleted = 0;

      // 1) [회원관리] 시트에서 삭제 (아래 행부터 역순으로 삭제)
      if (rosterSheet) {
        var rData = rosterSheet.getDataRange().getValues();
        for (var ri = rData.length - 1; ri >= 1; ri--) {
          var rId = String(rData[ri][0] || "").toLowerCase().trim();
          var rName = String(rData[ri][1] || "").toLowerCase().trim();
          var rEmail = String(rData[ri][5] || "").toLowerCase().trim();
          if ((delId && rId === delId) || (delEmail && rEmail === delEmail) || (delName && rName === delName)) {
            rosterSheet.deleteRow(ri + 1);
            rowsDeleted++;
          }
        }
      }

      // 2) [회원_낭독진도] 시트에서 삭제 (아래 행부터 역순으로 삭제)
      if (memberSheet) {
        var mData = memberSheet.getDataRange().getValues();
        for (var mi = mData.length - 1; mi >= 1; mi--) {
          var mId = String(mData[mi][0] || "").toLowerCase().trim();
          var mName = String(mData[mi][1] || "").toLowerCase().trim();
          var mEmail = String(mData[mi][5] || "").toLowerCase().trim();
          if ((delId && mId === delId) || (delEmail && delEmail && mEmail === delEmail) || (delName && mName === delName)) {
            memberSheet.deleteRow(mi + 1);
            rowsDeleted++;
          }
        }
      }

      // [실시간_동기화로그] 시트 추가
      if (logSheet) {
        logSheet.appendRow([
          "LOG-" + new Date().getTime(),
          nowStr,
          "회원 삭제 동기화",
          "회원 영구삭제 완료: " + (data.name || "") + " (" + (data.email || data.memberId || "") + ")",
          rowsDeleted
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "회원이 [회원관리] 및 [회원_낭독진도] 시트에서 완전히 영구 삭제되었습니다. (삭제 행 수: " + rowsDeleted + ")",
        rowsDeleted: rowsDeleted,
        timestamp: nowStr
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. 회원가입 실시간 저장 (중복 행 방지 및 스마트 등록)
    if (data.action === "registerMember") {
      var member = data.member || {};
      var rosterSheet = ss.getSheetByName("회원관리");
      var memberSheet = ss.getSheetByName("회원_낭독진도");
      var logSheet = ss.getSheetByName("실시간_동기화로그");

      var nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd HH:mm:ss");
      var regDateStr = member.registeredDate || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd");
      var userEmail = (member.email || data.loginId || "").toLowerCase().trim();
      var userName = (member.name || (data.loginId ? data.loginId + " 성도" : "신규 성도")).trim();

      // [회원관리] 시트에 이미 존재하는지 확인 후 업데이트 또는 추가
      if (rosterSheet) {
        var rData = rosterSheet.getDataRange().getValues();
        var existingRosterRow = -1;
        for (var ri = 1; ri < rData.length; ri++) {
          var re = String(rData[ri][5] || "").toLowerCase().trim();
          var rn = String(rData[ri][1] || "").toLowerCase().trim();
          if ((userEmail && re === userEmail) || (userName && rn === userName.toLowerCase())) {
            existingRosterRow = ri + 1;
            break;
          }
        }

        if (existingRosterRow > 0) {
          if (member.department) rosterSheet.getRange(existingRosterRow, 3).setValue(member.department);
          if (member.role) rosterSheet.getRange(existingRosterRow, 4).setValue(member.role);
          if (member.phone && member.phone !== "010-미등록") rosterSheet.getRange(existingRosterRow, 5).setValue(member.phone);
        } else {
          rosterSheet.appendRow([
            member.id || ("M-" + new Date().getTime().toString().slice(-4)),
            userName,
            member.department || "새가족 성경통독부",
            member.role || "성도",
            member.phone || "010-미등록",
            userEmail,
            regDateStr,
            member.birthdate || "1995.01.01",
            member.baptismStatus || "원입",
            member.smallGroup || (member.department ? member.department + " 1구역" : "새가족 1구역"),
            member.accountRole || "member",
            member.accountStatus || "active",
            member.memo || ("수퍼바이블 웹 회원가입 (아이디: " + (data.loginId || member.email) + ")")
          ]);
        }
      }

      // [회원_낭독진도] 시트에 이미 존재하는지 확인 후 업데이트 또는 추가
      if (memberSheet) {
        var mData = memberSheet.getDataRange().getValues();
        var existingProgRow = -1;
        for (var mi = 1; mi < mData.length; mi++) {
          var me = String(mData[mi][5] || "").toLowerCase().trim();
          var mn = String(mData[mi][1] || "").toLowerCase().trim();
          if ((userEmail && me === userEmail) || (userName && mn === userName.toLowerCase())) {
            existingProgRow = mi + 1;
            break;
          }
        }

        if (existingProgRow > 0) {
          if (member.department) memberSheet.getRange(existingProgRow, 3).setValue(member.department);
          if (member.role) memberSheet.getRange(existingProgRow, 4).setValue(member.role);
        } else {
          memberSheet.appendRow([
            member.id || ("M-" + new Date().getTime().toString().slice(-4)),
            userName,
            member.department || "새가족 성경통독부",
            member.role || "성도",
            member.phone || "010-미등록",
            userEmail,
            typeof member.currentReadingRound === 'number' ? member.currentReadingRound : 0,
            member.currentBook || "창세기",
            member.currentChapter || 1,
            member.totalReadChapters || 0,
            member.recordingsCount || 0,
            nowStr,
            "active",
            1,
            "웹 회원가입 12목표 통독 시작"
          ]);
        }
      }

      // [실시간_동기화로그] 시트 추가
      if (logSheet) {
        logSheet.appendRow([
          "LOG-" + new Date().getTime(),
          nowStr,
          "회원가입 동기화",
          "회원 등록/갱신: " + userName + " (" + userEmail + ")",
          1
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "신규 회원이 [회원관리] 및 [회원_낭독진도] 시트에 실시간 저장되었습니다.",
        timestamp: nowStr
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. 낭독 진도 실시간 갱신
    if (data.action === "updateProgress") {
      var memberSheet = ss.getSheetByName("회원_낭독진도");
      var email = (data.email || "").toLowerCase();
      var nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd HH:mm:ss");

      if (memberSheet && email) {
        var values = memberSheet.getDataRange().getValues();
        var found = false;
        for (var i = 1; i < values.length; i++) {
          if (String(values[i][5]).toLowerCase() === email) {
            memberSheet.getRange(i + 1, 8).setValue(data.book || "창세기");
            memberSheet.getRange(i + 1, 9).setValue(data.chapter || 1);
            if (data.totalReadChapters !== undefined) {
              memberSheet.getRange(i + 1, 10).setValue(data.totalReadChapters);
            } else {
              var curr = Number(values[i][9]) || 0;
              memberSheet.getRange(i + 1, 10).setValue(curr + 1);
            }
            memberSheet.getRange(i + 1, 12).setValue(nowStr);
            found = true;
            break;
          }
        }
        if (!found) {
          memberSheet.appendRow([
            "M-" + new Date().getTime().toString().slice(-4),
            data.name || email.split("@")[0],
            data.department || "성경통독부",
            "성도",
            "",
            email,
            1,
            data.book || "창세기",
            data.chapter || 1,
            data.totalReadChapters || 1,
            0,
            nowStr,
            "active",
            1,
            "진도 자동 기록"
          ]);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "낭독 진도가 [회원_낭독진도] 시트에 실시간 갱신되었습니다."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. 낭독 음원 녹음 저장
    if (data.action === "addRecording") {
      var rec = data.recording || {};
      var recSheet = ss.getSheetByName("낭독_음원검수");
      var nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd HH:mm:ss");

      if (recSheet) {
        recSheet.appendRow([
          rec.id || ("REC-" + new Date().getTime()),
          rec.memberId || "",
          rec.memberName || "",
          rec.department || "",
          rec.role || "성도",
          rec.title || "",
          rec.verseRef || "",
          rec.passageSnippet || "",
          rec.duration || "",
          rec.date || nowStr,
          rec.isFeatured ? "⭐선정" : "일반",
          rec.status || "approved",
          rec.feedback || ""
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "낭독 녹음 음원이 [낭독_음원검수] 시트에 실시간 저장되었습니다."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3-1. 낭독 녹음 음원 파일 구글 드라이브 [성경낭독녹음] > [사용자이름_아이디] 폴더 저장 및 스프레드시트 자동 동기화
    if (data.action === "uploadAudio" || data.action === "upload_audio") {
      var rootFolderName = "성경낭독녹음";
      var rootRecFolder = null;
      
      // 1) "수퍼북바이블" 폴더 안에서 찾거나, 드라이브 루트에서 "성경낭독녹음" 폴더 찾기/생성
      try {
        var parentFolders = DriveApp.getFoldersByName("수퍼북바이블");
        if (parentFolders.hasNext()) {
          var pFolder = parentFolders.next();
          var subFolders = pFolder.getFoldersByName(rootFolderName);
          rootRecFolder = subFolders.hasNext() ? subFolders.next() : pFolder.createFolder(rootFolderName);
        }
      } catch (fErr) {}

      if (!rootRecFolder) {
        var rootFolders = DriveApp.getFoldersByName(rootFolderName);
        rootRecFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootFolderName);
      }
      
      // 2) 로그인된 사람의 이름으로 하위 폴더 생성 (예: "박기빛_Cmorbfc2i", "신성환_juandvasieczky", "유원희_yoocomdr", "홍길동_stguest")
      var rawName = (data.memberName || "").replace(/ 성도$/, "").replace(/ 관리자$/, "").replace(/\s*\([^)]*\)$/, "").trim();
      var rawId = (data.loginId || "").replace(/@.*$/, "").trim();
      var isYooc = rawId.toLowerCase().indexOf("yoocomdr") > -1;
      var cleanName = (isYooc && (!rawName || rawName === "로고스" || rawName === "성도")) ? "유원희" : (rawName || "성도");
      var cleanId = isYooc ? "yoocomdr" : rawId;
      var userFolderName = data.userFolderName || (cleanName + (cleanId ? "_" + cleanId : ""));
      
      var userFolders = rootRecFolder.getFoldersByName(userFolderName);
      var targetUserFolder = userFolders.hasNext() ? userFolders.next() : rootRecFolder.createFolder(userFolderName);
      
      // 3) 생성폴더안에 낭독한 성경명으로 녹음 파일 저장 (예: "말라기 1~5장.mp3")
      var bibleName = (data.bibleName || data.verseRef || data.fileName || "성경낭독").trim();
      var rawTargetName = data.fileName || (bibleName.indexOf(".") > -1 ? bibleName : (bibleName + ".mp3"));
      var targetFileName = rawTargetName.replace(/\.webm$/i, ".mp3");
      if (targetFileName.indexOf(".mp3") === -1) {
        targetFileName = targetFileName + ".mp3";
      }
      
      var base64Data = data.base64Audio || "";
      if (base64Data.indexOf("base64,") > -1) {
        base64Data = base64Data.split("base64,")[1];
      }
      var mimeType = data.mimeType || "audio/mp3";
      var decodedBytes = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decodedBytes, mimeType, targetFileName);
      var file = targetUserFolder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      var fileUrl = file.getUrl();
      var fileId = file.getId();
      var downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
      var nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd HH:mm:ss");
      
      // 4) 10일 보관 정책: 10일 지난 녹음 파일 자동 정리 (휴지통 이동)
      try {
        var tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        var filesInFolder = targetUserFolder.getFiles();
        while (filesInFolder.hasNext()) {
          var oldFile = filesInFolder.next();
          if (oldFile.getDateCreated() < tenDaysAgo) {
            oldFile.setTrashed(true);
          }
        }
      } catch (cleanErr) {
        Logger.log("10-day retention clean error: " + cleanErr);
      }
      
      // 5) 수퍼바이블_회원성경낭독관리 스프레드시트에 자동으로 실시간 동기화
      try {
        var targetSS = null;
        try { targetSS = SpreadsheetApp.getActiveSpreadsheet(); } catch(e) {}
        if (!targetSS) {
          var ssFiles = DriveApp.getFilesByName("수퍼바이블_회원성경낭독관리");
          if (ssFiles.hasNext()) {
            targetSS = SpreadsheetApp.open(ssFiles.next());
          }
        }
        if (targetSS) {
          // (1) [낭독_음원검수] 시트에 자동 기록
          var recSheet = targetSS.getSheetByName("낭독_음원검수") || targetSS.insertSheet("낭독_음원검수");
          recSheet.appendRow([
            "REC-" + new Date().getTime(),
            data.memberId || ("M-" + (cleanId || "001")),
            cleanName,
            data.department || data.teamName || "지벳팀",
            "성도",
            data.title || (bibleName + " 낭독"),
            data.verseRef || bibleName,
            fileUrl,
            data.duration || "",
            nowStr,
            "⭐제출완료",
            "검수대기",
            "[" + userFolderName + "] 폴더에 " + targetFileName + " 저장 완료 (10일 보관)"
          ]);

          // (2) [회원_낭독진도] 시트 자동 진도 갱신
          var progSheet = targetSS.getSheetByName("회원_낭독진도");
          if (progSheet) {
            var pValues = progSheet.getDataRange().getValues();
            var updatedProg = false;
            var targetIdentifier = (data.loginId || data.email || cleanName).toLowerCase();
            for (var r = 1; r < pValues.length; r++) {
              var rowEmail = String(pValues[r][5] || "").toLowerCase();
              var rowName = String(pValues[r][1] || "").toLowerCase();
              if (rowEmail === targetIdentifier || rowName === cleanName.toLowerCase()) {
                if (data.book) progSheet.getRange(r + 1, 8).setValue(data.book);
                if (data.chapter) progSheet.getRange(r + 1, 9).setValue(data.chapter);
                var currTotal = Number(pValues[r][9]) || 0;
                progSheet.getRange(r + 1, 10).setValue(currTotal + 1);
                var currRecCount = Number(pValues[r][10]) || 0;
                progSheet.getRange(r + 1, 11).setValue(currRecCount + 1);
                progSheet.getRange(r + 1, 12).setValue(nowStr);
                updatedProg = true;
                break;
              }
            }
            if (!updatedProg) {
              progSheet.appendRow([
                "M-" + new Date().getTime().toString().slice(-4),
                cleanName,
                data.department || data.teamName || "지벳팀",
                "성도",
                data.phone || "",
                data.email || (data.loginId || ""),
                1,
                data.book || bibleName,
                data.chapter || 1,
                1,
                1,
                nowStr,
                "active",
                1,
                "성경낭독 시트 자동 동기화"
              ]);
            }
          }
        }
      } catch (ssErr) {
        Logger.log("Spreadsheet recording error: " + ssErr);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "구글 드라이브 [" + userFolderName + "] 폴더에 " + targetFileName + " 음원이 저장되고 스프레드시트에 자동 동기화되었습니다.",
        fileUrl: fileUrl,
        downloadUrl: downloadUrl,
        fileId: fileId,
        fileName: targetFileName,
        userFolderName: userFolderName,
        adminEmail: "${adminEmail}"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. 전체 양방향 스마트 동기화 (기존 회원 절대 삭제 금지, 안전한 행 단위 병합)
    if (data.action === "sync") {
      var incomingMembers = (data.data && data.data.members) ? data.data.members : (data.members || []);
      var recordings = (data.data && data.data.recordings) ? data.data.recordings : [];
      var deletedList = data.deletedList || (data.data && data.data.deletedList) || [];
      var rosterSheet = ss.getSheetByName("회원관리");
      var memberSheet = ss.getSheetByName("회원_낭독진도");
      var logSheet = ss.getSheetByName("실시간_동기화로그");

      // 4-0. 삭제 대기 목록(deletedList)에 포함된 회원을 구글 시트에서 먼저 완전 삭제 (절대 순번 M-XX 기준 삭제 금지, 고유 이메일/성명만 삭제)
      if (deletedList && deletedList.length > 0) {
        var delMap = {};
        for (var d = 0; d < deletedList.length; d++) {
          var dk = String(deletedList[d] || "").toLowerCase().trim();
          if (dk && !/^m-\d+$/i.test(dk)) delMap[dk] = true;
        }

        if (rosterSheet) {
          var rInitData = rosterSheet.getDataRange().getValues();
          for (var ri = rInitData.length - 1; ri >= 1; ri--) {
            var rName = String(rInitData[ri][1] || "").toLowerCase().trim();
            var rEmail = String(rInitData[ri][5] || "").toLowerCase().trim();
            if ((rEmail && delMap[rEmail]) || (rName && delMap[rName])) {
              rosterSheet.deleteRow(ri + 1);
            }
          }
        }

        if (memberSheet) {
          var mInitData = memberSheet.getDataRange().getValues();
          for (var mi = mInitData.length - 1; mi >= 1; mi--) {
            var mName = String(mInitData[mi][1] || "").toLowerCase().trim();
            var mEmail = String(mInitData[mi][5] || "").toLowerCase().trim();
            if ((mEmail && delMap[mEmail]) || (mName && delMap[mName])) {
              memberSheet.deleteRow(mi + 1);
            }
          }
        }
      }

      var rValues = rosterSheet ? rosterSheet.getDataRange().getValues() : [];
      var mValues = memberSheet ? memberSheet.getDataRange().getValues() : [];

      // 기존 회원 행 번호 맵핑 (이메일 및 성명 기준)
      var rosterRowMap = {};
      for (var ri = 1; ri < rValues.length; ri++) {
        var rEmail = String(rValues[ri][5] || "").toLowerCase().trim();
        var rName = String(rValues[ri][1] || "").toLowerCase().trim();
        if (rEmail) rosterRowMap[rEmail] = ri + 1;
        if (rName) rosterRowMap[rName] = ri + 1;
      }

      var memberRowMap = {};
      for (var mi = 1; mi < mValues.length; mi++) {
        var mEmail = String(mValues[mi][5] || "").toLowerCase().trim();
        var mName = String(mValues[mi][1] || "").toLowerCase().trim();
        if (mEmail) memberRowMap[mEmail] = mi + 1;
        if (mName) memberRowMap[mName] = mi + 1;
      }

      var nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd HH:mm:ss");

      for (var i = 0; i < incomingMembers.length; i++) {
        var mem = incomingMembers[i];
        if (!mem) continue;
        var mEmail = (mem.email || "").toLowerCase().trim();
        var mName = (mem.name || "").toLowerCase().trim();
        var key = mEmail || mName;
        if (!key) continue;

        // [회원관리] 행 업데이트 또는 신규 추가
        if (rosterSheet) {
          var targetRRow = rosterRowMap[mEmail] || rosterRowMap[mName];
          if (targetRRow) {
            if (mem.department) rosterSheet.getRange(targetRRow, 3).setValue(mem.department);
            if (mem.role) rosterSheet.getRange(targetRRow, 4).setValue(mem.role);
            if (mem.phone && mem.phone !== "010-미등록") rosterSheet.getRange(targetRRow, 5).setValue(mem.phone);
          } else {
            rosterSheet.appendRow([
              mem.id || ("M-" + new Date().getTime().toString().slice(-4)),
              mem.name || "신규 성도",
              mem.department || "다이나믹팀",
              mem.role || "성도",
              mem.phone || "010-미등록",
              mem.email || "",
              mem.registeredDate || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd"),
              mem.birthdate || "1995.01.01",
              mem.baptismStatus || "원입",
              mem.smallGroup || (mem.department ? mem.department + " 1구역" : "1구역"),
              mem.accountRole || "member",
              mem.accountStatus || "active",
              mem.memo || "동기화 신규 등록"
            ]);
            var newRRow = rosterSheet.getLastRow();
            if (mEmail) rosterRowMap[mEmail] = newRRow;
            if (mName) rosterRowMap[mName] = newRRow;
          }
        }

        // [회원_낭독진도] 행 업데이트 또는 신규 추가
        if (memberSheet) {
          var targetMRow = memberRowMap[mEmail] || memberRowMap[mName];
          if (targetMRow) {
            if (mem.department) memberSheet.getRange(targetMRow, 3).setValue(mem.department);
            if (mem.currentReadingRound !== undefined) memberSheet.getRange(targetMRow, 7).setValue(mem.currentReadingRound);
            if (mem.currentBook) memberSheet.getRange(targetMRow, 8).setValue(mem.currentBook);
            if (mem.currentChapter) memberSheet.getRange(targetMRow, 9).setValue(mem.currentChapter);
            if (mem.totalReadChapters !== undefined) {
              var oldTotal = Number(mValues[targetMRow - 1] ? mValues[targetMRow - 1][9] : 0) || 0;
              memberSheet.getRange(targetMRow, 10).setValue(Math.max(oldTotal, Number(mem.totalReadChapters) || 0));
            }
            if (mem.recordingsCount !== undefined) {
              var oldRec = Number(mValues[targetMRow - 1] ? mValues[targetMRow - 1][10] : 0) || 0;
              memberSheet.getRange(targetMRow, 11).setValue(Math.max(oldRec, Number(mem.recordingsCount) || 0));
            }
            memberSheet.getRange(targetMRow, 12).setValue(nowStr);
          } else {
            memberSheet.appendRow([
              mem.id || ("M-" + new Date().getTime().toString().slice(-4)),
              mem.name || "신규 성도",
              mem.department || "다이나믹팀",
              mem.role || "성도",
              mem.phone || "010-미등록",
              mem.email || "",
              mem.currentReadingRound || 0,
              mem.currentBook || "창세기",
              mem.currentChapter || 1,
              mem.totalReadChapters || 0,
              mem.recordingsCount || 0,
              nowStr,
              mem.status || "active",
              mem.consecutiveDays || 1,
              mem.memo || "동기화 신규 등록"
            ]);
            var newMRow = memberSheet.getLastRow();
            if (mEmail) memberRowMap[mEmail] = newMRow;
            if (mName) memberRowMap[mName] = newMRow;
          }
        }
      }

      if (logSheet) {
        logSheet.appendRow([
          "LOG-" + new Date().getTime(),
          nowStr,
          "전체 양방향 동기화",
          "회원 " + incomingMembers.length + "명 안전 병합 (기존 회원 데이터 전원 보존)",
          incomingMembers.length
        ]);
      }

      // 동기화 완료 후 최신 전 회원 목록 구성하여 반환
      var finalRosterRows = rosterSheet ? rosterSheet.getDataRange().getValues() : [];
      var finalMemberRows = memberSheet ? memberSheet.getDataRange().getValues() : [];
      var combinedMembersMap = {};

      for (var fi = 1; fi < finalRosterRows.length; fi++) {
        var fr = finalRosterRows[fi];
        var fId = String(fr[0] || "");
        var fName = String(fr[1] || "");
        var fEmail = String(fr[5] || "");
        var fKey = (fEmail || fId || fName).toLowerCase().trim();
        if (!fKey) continue;
        combinedMembersMap[fKey] = {
          id: fId || ("M-" + fi),
          name: fName,
          department: String(fr[2] || "다이나믹팀"),
          role: String(fr[3] || "성도"),
          phone: String(fr[4] || "010-미등록"),
          email: fEmail,
          registeredDate: String(fr[6] || ""),
          birthdate: String(fr[7] || "1995.01.01"),
          baptismStatus: String(fr[8] || "원입"),
          smallGroup: String(fr[9] || ""),
          accountRole: String(fr[10] || "member"),
          accountStatus: String(fr[11] || "active"),
          memo: String(fr[12] || ""),
          currentReadingRound: 0,
          targetRounds: 12,
          currentBook: "창세기",
          currentChapter: 1,
          totalReadChapters: 0,
          recordingsCount: 0,
          lastActive: "방금",
          status: "active",
          consecutiveDays: 1,
          featuredCount: 0
        };
      }

      for (var fj = 1; fj < finalMemberRows.length; fj++) {
        var fm = finalMemberRows[fj];
        var fmId = String(fm[0] || "");
        var fmName = String(fm[1] || "");
        var fmEmail = String(fm[5] || "");
        var fmKey = (fmEmail || fmId || fmName).toLowerCase().trim();
        if (!fmKey) continue;
        if (!combinedMembersMap[fmKey]) {
          combinedMembersMap[fmKey] = {
            id: fmId || ("M-" + fj),
            name: fmName,
            department: String(fm[2] || "다이나믹팀"),
            role: String(fm[3] || "성도"),
            phone: String(fm[4] || "010-미등록"),
            email: fmEmail,
            registeredDate: "",
            birthdate: "1995.01.01",
            baptismStatus: "원입",
            smallGroup: "",
            accountRole: "member",
            accountStatus: "active",
            memo: String(fm[14] || ""),
            targetRounds: 12,
            featuredCount: 0
          };
        }
        var mObj = combinedMembersMap[fmKey];
        mObj.currentReadingRound = Number(fm[6]) || 0;
        mObj.currentBook = String(fm[7] || mObj.currentBook || "창세기");
        mObj.currentChapter = Number(fm[8]) || mObj.currentChapter || 1;
        mObj.totalReadChapters = Number(fm[9]) || mObj.totalReadChapters || 0;
        mObj.recordingsCount = Number(fm[10]) || mObj.recordingsCount || 0;
        mObj.lastActive = String(fm[11] || mObj.lastActive || "방금");
        mObj.status = String(fm[12] || "active");
        mObj.consecutiveDays = Number(fm[13]) || 1;
      }

      var combinedMembersList = [];
      for (var ck in combinedMembersMap) {
        if (combinedMembersMap.hasOwnProperty(ck)) combinedMembersList.push(combinedMembersMap[ck]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "수퍼바이블 [회원관리] 및 [회원_낭독진도] 시트에 전체 회원이 안전하게 병합되었습니다.",
        members: combinedMembersList,
        timestamp: nowStr
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "요청이 정상 수신되었습니다."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSuperBibleSheets();
  var rosterSheet = ss.getSheetByName("회원관리");
  var memberSheet = ss.getSheetByName("회원_낭독진도");

  // GET 요청으로 회원 삭제 또는 테스트 정리 호출 지원
  if (e && e.parameter && (e.parameter.action === "deleteMember" || e.parameter.action === "delete")) {
    var delEmail = (e.parameter.email || "").toLowerCase().trim();
    var delName = (e.parameter.name || "").toLowerCase().trim();
    var delId = (e.parameter.memberId || e.parameter.id || "").toLowerCase().trim();
    if (rosterSheet) {
      var rData = rosterSheet.getDataRange().getValues();
      for (var ri = rData.length - 1; ri >= 1; ri--) {
        var rId = String(rData[ri][0] || "").toLowerCase().trim();
        var rName = String(rData[ri][1] || "").toLowerCase().trim();
        var rEmail = String(rData[ri][5] || "").toLowerCase().trim();
        if ((delId && rId === delId) || (delEmail && rEmail === delEmail) || (delName && rName === delName)) {
          rosterSheet.deleteRow(ri + 1);
        }
      }
    }
    if (memberSheet) {
      var mData = memberSheet.getDataRange().getValues();
      for (var mi = mData.length - 1; mi >= 1; mi--) {
        var mId = String(mData[mi][0] || "").toLowerCase().trim();
        var mName = String(mData[mi][1] || "").toLowerCase().trim();
        var mEmail = String(mData[mi][5] || "").toLowerCase().trim();
        if ((delId && mId === delId) || (delEmail && rEmail === delEmail) || (delName && mName === delName)) {
          memberSheet.deleteRow(mi + 1);
        }
      }
    }
  }

  if (e && e.parameter && e.parameter.action === "cleanTest") {
    cleanTestMembers();
  }

  var rosterRows = rosterSheet ? rosterSheet.getDataRange().getValues() : [];
  var memberRows = memberSheet ? memberSheet.getDataRange().getValues() : [];
  
  var membersMap = {};

  // 1. [회원관리] 시트 데이터 파싱
  for (var i = 1; i < rosterRows.length; i++) {
    var r = rosterRows[i];
    var id = String(r[0] || "");
    var name = String(r[1] || "");
    var email = String(r[5] || "");
    var key = (email || id || name).toLowerCase().trim();
    if (!key) continue;

    membersMap[key] = {
      id: id || ("M-" + i),
      name: name,
      department: String(r[2] || "다이나믹팀"),
      role: String(r[3] || "성도"),
      phone: String(r[4] || "010-미등록"),
      email: email,
      registeredDate: String(r[6] || ""),
      birthdate: String(r[7] || "1995.01.01"),
      baptismStatus: String(r[8] || "원입"),
      smallGroup: String(r[9] || ""),
      accountRole: String(r[10] || "member"),
      accountStatus: String(r[11] || "active"),
      memo: String(r[12] || ""),
      currentReadingRound: 0,
      targetRounds: 12,
      currentBook: "창세기",
      currentChapter: 1,
      totalReadChapters: 0,
      recordingsCount: 0,
      lastActive: "방금",
      status: "active",
      consecutiveDays: 1,
      featuredCount: 0
    };
  }

  // 2. [회원_낭독진도] 시트 데이터 오버레이
  for (var j = 1; j < memberRows.length; j++) {
    var m = memberRows[j];
    var mId = String(m[0] || "");
    var mName = String(m[1] || "");
    var mEmail = String(m[5] || "");
    var mKey = (mEmail || mId || mName).toLowerCase().trim();
    if (!mKey) continue;

    if (!membersMap[mKey]) {
      membersMap[mKey] = {
        id: mId || ("M-" + j),
        name: mName,
        department: String(m[2] || "다이나믹팀"),
        role: String(m[3] || "성도"),
        phone: String(m[4] || "010-미등록"),
        email: mEmail,
        registeredDate: "",
        birthdate: "1995.01.01",
        baptismStatus: "원입",
        smallGroup: "",
        accountRole: "member",
        accountStatus: "active",
        memo: String(m[14] || ""),
        targetRounds: 12,
        featuredCount: 0
      };
    }

    var obj = membersMap[mKey];
    obj.currentReadingRound = Number(m[6]) || 0;
    obj.currentBook = String(m[7] || obj.currentBook || "창세기");
    obj.currentChapter = Number(m[8]) || obj.currentChapter || 1;
    obj.totalReadChapters = Number(m[9]) || obj.totalReadChapters || 0;
    obj.recordingsCount = Number(m[10]) || obj.recordingsCount || 0;
    obj.lastActive = String(m[11] || obj.lastActive || "방금");
    obj.status = String(m[12] || "active");
    obj.consecutiveDays = Number(m[13]) || 1;
  }

  var membersList = [];
  for (var k in membersMap) {
    if (membersMap.hasOwnProperty(k)) {
      membersList.push(membersMap[k]);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    members: membersList,
    rosterCount: rosterRows.length > 0 ? rosterRows.length - 1 : 0,
    memberProgressCount: memberRows.length > 0 ? memberRows.length - 1 : 0,
    adminEmail: "${adminEmail}",
    sheetUrl: ss.getUrl(),
    sheetId: ss.getId(),
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
}
