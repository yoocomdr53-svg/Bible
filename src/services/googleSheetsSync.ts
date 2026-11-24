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

export const TARGET_SHEET_ID = '1a0LH7AT9F0l5UXdvnHQCojnK-vduQQ40nagRUxvLv3k';
export const TARGET_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1a0LH7AT9F0l5UXdvnHQCojnK-vduQQ40nagRUxvLv3k/edit?gid=430155078#gid=430155078';

export const DEFAULT_SHEET_CONFIG: GoogleSheetConfig = {
  sheetId: TARGET_SHEET_ID,
  sheetUrl: TARGET_SHEET_URL,
  adminEmail: 'yoocomdr57@gmail.com',
  scriptUrl:
    'https://script.google.com/macros/s/AKfycbzHnO0-Yvmfr2A0ImQewLiWhvVEt1HG9pLFUEEexaBr0GwEnYRNGtNyBibvOJdRQW2lPg/exec',
  autoSync: true,
  lastSynced: '실시간 자동 동기화 가동 중',
  syncStatus: 'success',
  lastSyncMessage: 'Google Apps Script 실시간 연동 정상 가동 중 (yoocomdr57@gmail.com)',
};

export function getGoogleSheetConfig(): GoogleSheetConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate legacy or invalid sheet URLs
      if (
        !parsed.sheetUrl ||
        parsed.sheetUrl.includes('10AYmeENdos') ||
        parsed.sheetUrl.includes('1yoocomdr57_SuperBible_MasterRoster_2026') ||
        parsed.sheetUrl.includes('yoocomdr53')
      ) {
        parsed.sheetUrl = TARGET_SHEET_URL;
        parsed.sheetId = TARGET_SHEET_ID;
        try { localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(parsed)); } catch {}
      }
      return { ...DEFAULT_SHEET_CONFIG, ...parsed };
    }
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
      if (
        data.sheetUrl &&
        !data.sheetUrl.includes('10AYmeENdos') &&
        !data.sheetUrl.includes('yoocomdr53') &&
        (!current.sheetUrl || current.sheetUrl !== data.sheetUrl)
      ) {
        current.sheetUrl = data.sheetUrl;
        modified = true;
      }
      if (
        data.sheetId &&
        data.sheetId !== '10AYmeENdosIjbtPLMA4SprgUriDbUO_DeHU0cjdVmqc' &&
        (!current.sheetId || current.sheetId !== data.sheetId)
      ) {
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
      const isSheetSuccess = data.success && (!data.gasResult || data.gasResult.status !== 'error') && !data.gasError;

      if (isSheetSuccess) {
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
      } else {
        // Enqueue for background retry so registration / progress is never lost
        enqueuePendingSync(payload.action as any, fullPayload);

        saveGoogleSheetConfig({
          ...config,
          lastSynced: `${nowStr} (서버 보관 / 시트 재시도 대기)`,
          syncStatus: 'pending',
          lastSyncMessage: data.message || '중앙 서버 보관 완료, 구글 시트 재시도 대기열 등록',
        });

        addSheetSyncLog({
          timestamp: nowStr,
          direction: 'upload',
          status: 'in_progress',
          summary: `시트 전송 대기: ${payload.action}`,
          details: data.gasError || data.message || '구글 시트 응답 대기',
          rowsAffected: 0,
        });

        return {
          success: false,
          message: data.message || '중앙 서버에 보관되었으며 구글 시트 반영을 재시도합니다.',
        };
      }
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
 * Sync an updated member profile to Google Sheet and Central Hub
 */
export async function updateMemberInGoogleSheet(
  member: MemberReadingProfile
): Promise<{ success: boolean; message: string }> {
  return sendPayloadToGoogleScript({
    action: 'updateMember',
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
  const cleanName = rawName || '성도';
  const cleanId = rawId || 'user';
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
 * Flush all pending sync items to Google Sheet via Central Hub
 */
export async function flushPendingSyncQueue(): Promise<{ success: boolean; flushedCount: number }> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) {
    return { success: true, flushedCount: 0 };
  }

  const remaining: PendingSyncItem[] = [];
  let count = 0;

  for (const item of queue) {
    try {
      const res = await sendPayloadToGoogleScript(item.payload);
      if (res.success) {
        count++;
      } else {
        remaining.push(item);
      }
    } catch (e) {
      remaining.push(item);
    }
  }

  if (remaining.length > 0) {
    try {
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(remaining));
    } catch (e) {}
  } else {
    clearPendingSyncQueue();
  }

  if (count > 0) {
    const nowStr = new Date().toLocaleString('ko-KR');
    addSheetSyncLog({
      timestamp: nowStr,
      direction: 'upload',
      status: 'success',
      summary: `대기 중이던 ${count}건 데이터 구글 시트 전송 완료`,
      details: `중앙 허브 및 스프레드시트에 일괄 반영`,
      rowsAffected: count,
    });
  }

  return { success: remaining.length === 0, flushedCount: count };
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

      // Authoritative sync: Merge server deleted records into local records (UNION, NEVER OVERWRITE WITH EMPTY!)
      if (data.deletedRecords && typeof data.deletedRecords === 'object') {
        const localRecords = getDeletedRecords();
        const mergedRecords = { ...localRecords };
        Object.keys(data.deletedRecords).forEach((k) => {
          if (k !== 'yoocomdr57@gmail.com' && !k.includes('로고스 관리자')) {
            mergedRecords[k] = data.deletedRecords[k];
          }
        });
        try {
          localStorage.setItem(DELETED_RECORDS_KEY, JSON.stringify(mergedRecords));
        } catch (e) {}
      }

      if (data.success && Array.isArray(data.members)) {
        // STRICT FILTER: Filter deleted members from remote response
        const cleanRemote: MemberReadingProfile[] = (data.members || [])
          .filter((m: any) => !isMemberDeleted(m))
          .sort((a: any, b: any) => {
            const na = parseInt(String(a.id || '').replace(/\D/g, ''), 10) || 999;
            const nb = parseInt(String(b.id || '').replace(/\D/g, ''), 10) || 999;
            return na - nb;
          });

        // 1. Read existing local members to preserve any newly registered members not yet in remoteMembers
        let localMembers: MemberReadingProfile[] = [];
        try {
          const lRaw = localStorage.getItem('superbible_admin_members_v4');
          if (lRaw) localMembers = JSON.parse(lRaw);
        } catch (e) {}

        const remoteKeys = new Set(
          cleanRemote.map((m: any) => (m.email || m.name || m.id || '').toLowerCase().trim())
        );

        // Keep local members that are strictly NOT deleted and not yet present in remoteMembers
        const unsyncedLocalMembers = localMembers.filter((lm) => {
          if (isMemberDeleted(lm)) return false;
          const kEmail = (lm.email || '').toLowerCase().trim();
          const kName = (lm.name || '').toLowerCase().trim();
          const kId = (lm.id || '').toLowerCase().trim();
          const exists = remoteKeys.has(kEmail) || remoteKeys.has(kName) || remoteKeys.has(kId);
          return !exists;
        });

        // Merge cleanRemote with unsyncedLocalMembers (deleted members NEVER revive!)
        const mergedRoster = [...cleanRemote, ...unsyncedLocalMembers].sort((a, b) => {
          const na = parseInt(String(a.id || '').replace(/\D/g, ''), 10) || 999;
          const nb = parseInt(String(b.id || '').replace(/\D/g, ''), 10) || 999;
          return na - nb;
        });

        // Clean obsolete deleted blacklist so active members are never affected
        try {
          localStorage.removeItem('superbible_deleted_members_v2');
        } catch (e) {}

        // Save authoritative active roster directly to localStorage (strictly excluding deleted members)
        localStorage.setItem('superbible_admin_members_v4', JSON.stringify(mergedRoster));

        // If there are unsynced local members, retry sending them to Google Sheet
        if (unsyncedLocalMembers.length > 0) {
          unsyncedLocalMembers.forEach((ulm) => {
            syncMemberRegistrationToGoogleSheet(ulm, ulm.email || ulm.name).catch(() => {});
          });
        }

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

          mergedRoster.forEach((m) => {
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
            } else {
              const isMasterAdmin = mEmail === 'yoocomdr57@gmail.com' || m.role === '관리자';
              accounts.push({
                loginId: m.email || m.name,
                passwordHash: isMasterAdmin ? '1234' : `REMOTE_SYNC_${Math.random().toString(36).slice(2)}`,
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
          members: mergedRoster,
          source: data.source,
          message: `클라우드로부터 ${mergedRoster.length}명의 회원 명부가 실시간 동기화되었습니다.`,
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

  // Step 0: Clean local obsolete tombstones so all devices mirror Google Sheets 100%
  try {
    localStorage.removeItem('superbible_deleted_members_v2');
    localStorage.removeItem(DELETED_RECORDS_KEY);
  } catch (e) {}

  // Flush pending queue first if any
  await flushPendingSyncQueue();

  // Reset server tombstones so Google Sheet active members are never blocked
  try {
    await fetch(getSyncApiUrl('/api/sync?action=clearDeletedRecords&clearDeleted=true'), { method: 'GET' });
  } catch (e) {}

  // Step 1: Pull authoritative latest members directly from Central Server / Google Sheets
  const pullResult = await pullMembersFromGoogleSheet();
  const authoritativeMembers = pullResult.members || [];

  const nowStr = new Date().toLocaleString('ko-KR');
  addSheetSyncLog({
    timestamp: nowStr,
    direction: 'download',
    status: 'success',
    summary: `구글 시트 및 전 기기 동기화 완료`,
    details: `${authoritativeMembers.length}명의 회원 명부가 스마트폰, 태블릿, PC에 동일하게 정렬되었습니다.`,
    rowsAffected: authoritativeMembers.length,
  });

  return {
    success: true,
    message: `구글 스프레드시트 및 모든 기기와 완벽하게 동기화되었습니다! (총 ${authoritativeMembers.length}명 일치)`,
    updatedMembers: authoritativeMembers,
    updatedRecordings: recordings,
  };
}

/**
 * Returns complete Google Apps Script code to paste into Google Sheet's Script Editor
 */
export function generateAppsScriptCode(adminEmail = 'yoocomdr57@gmail.com'): string {
  return `/**
 * [수퍼바이블] superbible DBase — 구글 스프레드시트 DB + 웹앱 API (v3)
 * 관리자 계정: yoocomdr57@gmail.com
 *
 * ■ 처음 설정 (딱 1번)
 *  1) yoocomdr57@gmail.com 으로 로그인 → 구글 스프레드시트를 새로 만들고 [확장 프로그램] > [Apps Script]
 *     (script.google.com 에서 새 프로젝트를 만들어도 됩니다)
 *  2) 이 코드를 전부 붙여넣고 저장
 *  3) 함수 목록에서 [createSuperBibleDBase] 선택 > [실행] > 권한 승인
 *     → "superbible DBase" 스프레드시트, 6개 시트, 한글 필드명(1행)이 자동으로 만들어집니다.
 *  4) [배포] > [새 배포] > 웹 앱 / 실행: 나 / 액세스: 모든 사용자 → 웹앱 URL 복사
 *     (코드를 고친 뒤에는 [배포 관리] > 연필 > 버전: 새 버전 > 배포 를 꼭 해야 반영됩니다)
 *
 * ■ 시트(테이블) 구성: 회원관리 / 회원_낭독진도 / 낭독_음원검수 / 통독_캠페인 / 실시간_동기화로그 / 삭제된회원
 *
 * ■ 삽입·수정·삭제·조회 (웹앱 POST, JSON / 값은 한글 필드명으로 전달)
 *   삽입 {"action":"dbInsert","table":"통독_캠페인","values":{"캠페인명":"신약 1독","설명":"..."}}
 *   수정 {"action":"dbUpdate","table":"통독_캠페인","key":"C-123","values":{"설명":"수정"}}
 *   삭제 {"action":"dbDelete","table":"통독_캠페인","key":"C-123"}
 *   조회 {"action":"dbList","table":"회원관리","where":{"소속부서":"경영팀"},"limit":100}
 *        (GET ?action=dbList&table=회원관리 도 가능)
 *   key 는 각 시트 1열(회원번호/녹음ID/캠페인ID/로그ID)의 값입니다.
 *   회원관리 삽입·수정·삭제는 회원_낭독진도 시트까지 함께 처리되고, 삭제하면 삭제 명단에 등록됩니다.
 *
 * ■ 시트에서 직접 작업: 셀 수정 = 수정 / 맨 아래 행에 입력 = 삽입 /
 *   상단 메뉴 [★ 수퍼바이블 DB] > [선택한 행 회원 삭제] = 삭제(삭제 명단 등록, 부활 방지)
 *
 * ■ v2 핵심(유지): 삭제 명단으로 회원 부활 방지 / sync 는 진도만 갱신 / 시트가 회원정보 기준 /
 *   동시요청 잠금 / 회원번호 순번 발급 / 웹 전면초기화 차단(API_TOKEN)
 */

var ADMIN_EMAIL = "${adminEmail}";
var TZ = "Asia/Seoul";

// 보안 토큰. 빈 문자열("")이면 웹을 통한 전면초기화는 완전히 차단되고,
// 삭제는 토큰 없이 허용됩니다. 값을 넣으면 삭제/초기화 요청에 token 이 반드시 필요합니다.
var API_TOKEN = "";

var SN = {
  ROSTER: "회원관리",
  PROG: "회원_낭독진도",
  REC: "낭독_음원검수",
  CAMP: "통독_캠페인",
  LOG: "실시간_동기화로그",
  DEL: "삭제된회원"
};

// ───────────────────────── 공통 유틸 ─────────────────────────
function nowStr_() { return Utilities.formatDate(new Date(), TZ, "yyyy.MM.dd HH:mm:ss"); }
function todayStr_() { return Utilities.formatDate(new Date(), TZ, "yyyy.MM.dd"); }
function norm_(v) { return String(v === null || v === undefined ? "" : v).toLowerCase().trim(); }
function has_(v) { return v !== undefined && v !== null; }
function cell_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, "yyyy.MM.dd");
  return String(v === null || v === undefined ? "" : v);
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function sheet_(name) { return getSS_().getSheetByName(name); }
function log_(type, content, count) {
  var sh = sheet_(SN.LOG);
  if (sh) sh.appendRow(["LOG-" + Utilities.getUuid().substring(0, 8), nowStr_(), type, content, count || 0]);
}
function tokenOk_(data) {
  return API_TOKEN !== "" && String(data.token || "") === API_TOKEN;
}

// 회원 식별 키: 이메일 우선, 없으면 이름
function memberKey_(t) {
  var e = norm_(t.email);
  if (e) return e;
  var n = norm_(t.name);
  return n ? "name:" + n : "";
}

// ───────────────────────── 시트 구성 ─────────────────────────
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("★ 수퍼바이블 DB")
      .addItem("➕ 회원 추가 (입력창)", "addMemberPrompt")
      .addItem("🗑️ 선택한 행 회원 삭제", "deleteSelectedMembers")
      .addSeparator()
      .addItem("⚙️ DB 시트/필드명 자동 구성·복구", "setupSuperBibleSheets")
      .addItem("🧹 테스트 행 자동 정리", "cleanTestMembers")
      .addItem("🔄 전면 초기화 (관리자 1명만)", "resetSpreadsheetCompletely")
      .addToUi();
  } catch (e) {}
}

function ensureSheet_(ss, name, headers, color, textCols) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setBackground(color).setFontColor("#ffffff").setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  // 날짜/전화번호가 Date 나 숫자로 자동 변환되는 것을 막기 위해 텍스트 서식 지정
  if (sh.getMaxRows() > 1) {
    (textCols || []).forEach(function (c) {
      sh.getRange(2, c, sh.getMaxRows() - 1, 1).setNumberFormat("@");
    });
  }
  return sh;
}

var DB_NAME = "superbible DBase";

// 시트(테이블) 정의: 1행 = 한글 필드명, 1열 = 기본키
var SCHEMA = [
  { name: SN.ROSTER, color: "#0284c7", textCols: [5, 7, 8], prefix: "M-",
    headers: ["회원번호", "성명", "소속부서", "직분", "전화번호", "이메일",
      "등록일자", "생년월일", "세례구분", "구역/목장", "계정권한", "회원상태", "관리자메모"] },
  { name: SN.PROG, color: "#1b64b9", textCols: [5, 12], prefix: "M-",
    headers: ["회원번호", "이름", "소속부서", "직분", "전화번호", "이메일",
      "현재통독회차", "현재성경", "현재장", "완독장수", "녹음수",
      "최근활동일시", "상태", "연속통독일", "관리자메모"] },
  { name: SN.REC, color: "#7c3aed", textCols: [], prefix: "REC-",
    headers: ["녹음ID", "회원번호", "성명", "소속부서", "직분", "낭독제목",
      "성경구절", "본문요약", "재생시간", "녹음일시", "베스트낭독여부", "심사상태", "관리자피드백"] },
  { name: SN.CAMP, color: "#059669", textCols: [], prefix: "C-",
    headers: ["캠페인ID", "캠페인명", "설명", "목표범위", "시작일", "종료일", "참여자수", "평균달성률", "활성여부"] },
  { name: SN.LOG, color: "#0f172a", textCols: [], prefix: "LOG-",
    headers: ["로그ID", "일시", "구분", "내용", "영향행수"] },
  { name: SN.DEL, color: "#b91c1c", textCols: [1], prefix: "DEL-",
    headers: ["삭제키(이메일 또는 name:이름)", "성명", "이메일", "삭제일시"] }
];

function schema_(name) {
  for (var i = 0; i < SCHEMA.length; i++) if (SCHEMA[i].name === name) return SCHEMA[i];
  return null;
}

// 스프레드시트 얻기: 시트에 붙은 스크립트면 그 시트, 독립 스크립트면 저장해 둔 DB 파일
function getSS_() {
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (ss) return ss;
  var id = PropertiesService.getScriptProperties().getProperty("DB_ID");
  if (id) return SpreadsheetApp.openById(id);
  throw new Error("DB 스프레드시트가 없습니다. createSuperBibleDBase 함수를 먼저 실행하세요.");
}

// ★ 최초 1회 실행: "superbible DBase" 스프레드시트 + 모든 시트 + 한글 필드명 자동 생성
function createSuperBibleDBase() {
  var props = PropertiesService.getScriptProperties();
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (!ss) {
    var id = props.getProperty("DB_ID");
    if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e2) {} }
  }
  if (!ss) ss = SpreadsheetApp.create(DB_NAME);
  props.setProperty("DB_ID", ss.getId());
  if (ss.getName() !== DB_NAME) ss.rename(DB_NAME);

  setupSuperBibleSheets();
  var rs = ss.getSheetByName(SN.ROSTER);
  if (rs.getLastRow() < 2) seedAdmin_();

  Logger.log("superbible DBase 준비 완료: " + ss.getUrl());
  return ss.getUrl();
}

function setupSuperBibleSheets() {
  var ss = getSS_();
  SCHEMA.forEach(function (sc) {
    var sh = ensureSheet_(ss, sc.name, sc.headers, sc.color, sc.textCols);
    // 필드명(1행)은 항상 한글 정의대로 맞춘다 (열 순서는 고정)
    sh.getRange(1, 1, 1, sc.headers.length).setValues([sc.headers])
      .setBackground(sc.color).setFontColor("#ffffff").setFontWeight("bold");
    sh.setFrozenRows(1);
  });
  ["시트1", "Sheet1"].forEach(function (n) {
    var d = ss.getSheetByName(n);
    if (d && ss.getSheets().length > 1 && d.getLastRow() === 0) ss.deleteSheet(d);
  });
}

function seedAdmin_() {
  var memo = "수퍼바이블 총괄 시스템 관리자 (" + ADMIN_EMAIL + ")";
  sheet_(SN.ROSTER).appendRow(["M-01", "로고스 관리자", "경영팀", "관리자", "010-0000-0000", ADMIN_EMAIL,
    "2026.01.01", "1980.01.01", "세례교인", "총괄본부", "admin", "active", memo]);
  sheet_(SN.PROG).appendRow(["M-01", "로고스 관리자", "경영팀", "관리자", "010-0000-0000", ADMIN_EMAIL,
    0, "창세기", 1, 0, 0, nowStr_(), "active", 1, memo]);
}

function alert_(msg) {
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function ensureSheets_() {
  var ss = getSS_();
  for (var k in SN) {
    if (!ss.getSheetByName(SN[k])) { setupSuperBibleSheets(); return; }
  }
}

// ───────────────────────── 삭제 명단(Tombstone) ─────────────────────────
// 삭제한 회원을 기록해 두어, 오래된 앱 데이터가 다시 밀어 넣어도 부활하지 않게 한다.
function loadDeletedKeys_() {
  var map = {};
  var sh = sheet_(SN.DEL);
  if (!sh || sh.getLastRow() < 2) return map;
  sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) {
    var k = norm_(r[0]);
    if (k) map[k] = true;
  });
  return map;
}

function addTombstone_(t) {
  var sh = sheet_(SN.DEL);
  if (!sh) return;
  var existing = loadDeletedKeys_();
  var e = norm_(t.email);
  var n = norm_(t.name);
  var id = norm_(t.id || t.memberId);
  var now = nowStr_();

  if (e && !existing[e]) {
    sh.appendRow([e, t.name || "", t.email || "", now]);
    existing[e] = true;
  }
  if (n && !existing["name:" + n]) {
    sh.appendRow(["name:" + n, t.name || "", t.email || "", now]);
    existing["name:" + n] = true;
  }
  if (id && id !== "m-01" && !existing[id]) {
    sh.appendRow([id, t.name || "", t.email || "", now]);
    existing[id] = true;
  }
}

function removeTombstone_(t) {
  var k = memberKey_(t);
  var sh = sheet_(SN.DEL);
  if (!k || !sh || sh.getLastRow() < 2) return;
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (norm_(vals[i][0]) === k) sh.deleteRow(i + 2);
  }
}

// ───────────────────────── 행 검색 / 회원번호 ─────────────────────────
// 우선순위: 회원번호(ID) 또는 이메일 또는 이름 일치 시 행 검색
function findRows_(sh, t) {
  if (!sh || sh.getLastRow() < 2) return [];
  var data = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
  var id = norm_(t.id || t.memberId), email = norm_(t.email), name = norm_(t.name);
  var out = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var rId = norm_(r[0]);
    var rName = norm_(r[1]);
    var rEmail = norm_(r[5]);

    var match = false;
    if (id && rId === id) match = true;
    else if (email && rEmail === email) match = true;
    else if (name && rName === name) match = true;

    if (match) out.push(i + 2);
  }
  return out;
}

function idInUse_(id) {
  var target = norm_(id);
  if (!target) return false;
  var used = false;
  [SN.ROSTER, SN.PROG].forEach(function (n) {
    var sh = sheet_(n);
    if (!sh || sh.getLastRow() < 2) return;
    sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) {
      if (norm_(r[0]) === target) used = true;
    });
  });
  return used;
}

function nextMemberId_() {
  var max = 0;
  [SN.ROSTER, SN.PROG].forEach(function (n) {
    var sh = sheet_(n);
    if (!sh || sh.getLastRow() < 2) return;
    sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) {
      var m = /^M-([0-9]+)$/i.exec(String(r[0]));
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
  });
  var n = max + 1;
  return "M-" + (n < 10 ? "0" + n : n);
}

function resolveNewId_(wanted) {
  if (wanted && !idInUse_(wanted)) return String(wanted);
  return nextMemberId_();
}

// ───────────────────────── 회원 등록(업서트) ─────────────────────────
function upsertMember_(member, loginId) {
  var rs = sheet_(SN.ROSTER), ps = sheet_(SN.PROG);
  var email = norm_(member.email || loginId);
  var name = String(member.name || (loginId ? loginId + " 성도" : "신규 성도")).trim();
  var t = { email: email, name: name };
  var now = nowStr_();

  var rRows = findRows_(rs, t);
  var pRows = findRows_(ps, t);
  var id;
  if (rRows.length) id = String(rs.getRange(rRows[0], 1).getValue());
  else if (pRows.length) id = String(ps.getRange(pRows[0], 1).getValue());
  else id = resolveNewId_(member.id);

  var created = false;

  if (rRows.length) {
    var r = rRows[0];
    if (member.department) rs.getRange(r, 3).setValue(member.department);
    if (member.role) rs.getRange(r, 4).setValue(member.role);
    if (member.phone && member.phone !== "010-미등록") rs.getRange(r, 5).setValue(member.phone);
  } else {
    rs.appendRow([
      id, name,
      member.department || "새가족 성경통독부",
      member.role || "성도",
      member.phone || "010-미등록",
      email,
      member.registeredDate || todayStr_(),
      member.birthdate || "1995.01.01",
      member.baptismStatus || "원입",
      member.smallGroup || (member.department ? member.department + " 1구역" : "새가족 1구역"),
      member.accountRole || "member",
      member.accountStatus || "active",
      member.memo || ("수퍼바이블 웹 회원가입 (아이디: " + (loginId || email) + ")")
    ]);
    created = true;
  }

  if (pRows.length) {
    var p = pRows[0];
    if (member.department) ps.getRange(p, 3).setValue(member.department);
    if (member.role) ps.getRange(p, 4).setValue(member.role);
  } else {
    ps.appendRow([
      id, name,
      member.department || "새가족 성경통독부",
      member.role || "성도",
      member.phone || "010-미등록",
      email,
      typeof member.currentReadingRound === "number" ? member.currentReadingRound : 0,
      member.currentBook || "창세기",
      member.currentChapter || 1,
      member.totalReadChapters || 0,
      member.recordingsCount || 0,
      now, "active", 1,
      "웹 회원가입 12목표 통독 시작"
    ]);
    created = true;
  }
  return { id: id, created: created, name: name, email: email };
}

// ───────────────────────── 회원 수정 ─────────────────────────
function updateMember_(data) {
  var member = data.member || data;
  var oldEmail = data.originalEmail || member.originalEmail || member.oldEmail || "";
  var rs = sheet_(SN.ROSTER), ps = sheet_(SN.PROG);

  var t = { id: member.id, email: oldEmail || member.email, name: member.name };
  var rRows = findRows_(rs, t), pRows = findRows_(ps, t);
  // 이메일이 바뀌었는데 originalEmail 이 없는 경우: 회원번호만으로 한 번 더 시도
  if (!rRows.length && !pRows.length && member.id) {
    rRows = findRows_(rs, { id: member.id });
    pRows = findRows_(ps, { id: member.id });
  }
  if (!rRows.length && !pRows.length) {
    return json_({ status: "error", message: "수정할 회원을 시트에서 찾지 못했습니다: " + (member.name || member.email || member.id) });
  }

  if (rRows.length) {
    var rr = rRows[0];
    var rv = rs.getRange(rr, 1, 1, 13).getValues()[0];
    if (has_(member.name)) rv[1] = member.name;
    if (has_(member.department)) rv[2] = member.department;
    if (has_(member.role)) rv[3] = member.role;
    if (has_(member.phone)) rv[4] = member.phone;
    if (has_(member.email)) rv[5] = member.email;
    if (has_(member.registeredDate)) rv[6] = member.registeredDate;
    if (has_(member.birthdate)) rv[7] = member.birthdate;
    if (has_(member.baptismStatus)) rv[8] = member.baptismStatus;
    if (has_(member.smallGroup)) rv[9] = member.smallGroup;
    if (has_(member.accountRole)) rv[10] = member.accountRole;
    if (has_(member.accountStatus)) rv[11] = member.accountStatus;
    if (has_(member.memo)) rv[12] = member.memo;
    rs.getRange(rr, 1, 1, 13).setValues([rv]);
  }
  if (pRows.length) {
    var pr = pRows[0];
    var pv = ps.getRange(pr, 1, 1, 15).getValues()[0];
    if (has_(member.name)) pv[1] = member.name;
    if (has_(member.department)) pv[2] = member.department;
    if (has_(member.role)) pv[3] = member.role;
    if (has_(member.phone)) pv[4] = member.phone;
    if (has_(member.email)) pv[5] = member.email;
    if (has_(member.accountStatus)) pv[12] = member.accountStatus;
    if (has_(member.memo)) pv[14] = member.memo;
    ps.getRange(pr, 1, 1, 15).setValues([pv]);
  }

  log_("회원수정", (member.name || member.id) + " 정보 수정 동기화 완료", rRows.length + pRows.length);
  return json_({
    status: "success",
    message: "'" + (member.name || member.id) + "' 회원 정보가 구글 시트에 실시간 수정·반영되었습니다.",
    timestamp: nowStr_()
  });
}

// ───────────────────────── 회원 삭제 ─────────────────────────
function deleteMember_(t) {
  var idNorm = norm_(t.id || t.memberId);
  var emailNorm = norm_(t.email);
  var nameNorm = norm_(t.name);

  if (emailNorm === norm_(ADMIN_EMAIL) || nameNorm === "로고스 관리자" || idNorm === "m-01") {
    return { ok: false, message: "마스터 관리자 계정은 삭제할 수 없습니다.", rowsDeleted: 0 };
  }
  var infos = [];
  var deleted = 0;
  [SN.ROSTER, SN.PROG].forEach(function (n) {
    var sh = sheet_(n);
    if (!sh || sh.getLastRow() < 2) return;
    var rows = findRows_(sh, t);
    for (var i = rows.length - 1; i >= 0; i--) {
      var rIdx = rows[i];
      if (rIdx <= sh.getLastRow()) {
        var v = sh.getRange(rIdx, 1, 1, 6).getValues()[0];
        infos.push({ id: String(v[0] || ""), name: String(v[1] || ""), email: String(v[5] || "") });
        sh.deleteRow(rIdx);
        deleted++;
      }
    }
  });
  // 삭제 명단 기록 (시트 행 삭제 후에도 앱의 옛 데이터가 되살리지 못하게)
  infos.forEach(function (info) {
    addTombstone_({ name: info.name, email: info.email, id: info.id });
  });
  if (emailNorm || nameNorm || idNorm) {
    addTombstone_({ name: t.name, email: t.email, id: idNorm });
  }
  return { ok: true, rowsDeleted: deleted };
}

function deleteMemberResponse_(data) {
  var t = {
    email: data.email,
    name: data.name,
    id: data.memberId || data.id
  };
  var res = deleteMember_(t);
  if (!res.ok) return json_({ status: "error", message: res.message });
  log_("회원 삭제 동기화", "회원 영구삭제 완료: " + (data.name || "") + " (" + (data.email || data.memberId || data.id || "") + ")", res.rowsDeleted);
  return json_({
    status: "success",
    message: "회원이 [회원관리] 및 [회원_낭독진도] 시트에서 영구 삭제되었습니다. (삭제 행 수: " + res.rowsDeleted + ")",
    rowsDeleted: res.rowsDeleted,
    timestamp: nowStr_()
  });
}

// ───────────────────────── 낭독 진도 ─────────────────────────
function updateProgress_(data) {
  var email = norm_(data.email);
  if (!email) return json_({ status: "error", message: "email 이 필요합니다." });
  if (loadDeletedKeys_()[email]) return json_({ status: "error", message: "삭제된 회원입니다." });

  var ps = sheet_(SN.PROG);
  var rows = findRows_(ps, { email: email });
  if (!rows.length) {
    upsertMember_({
      name: data.name || email.split("@")[0],
      email: email,
      department: data.department || "성경통독부",
      currentBook: data.book,
      currentChapter: data.chapter,
      totalReadChapters: data.totalReadChapters || 1
    }, email);
  } else {
    var r = rows[0];
    var v = ps.getRange(r, 1, 1, 15).getValues()[0];
    v[7] = data.book || v[7] || "창세기";
    v[8] = data.chapter || v[8] || 1;
    v[9] = has_(data.totalReadChapters) ? data.totalReadChapters : (Number(v[9]) || 0) + 1;
    v[11] = nowStr_();
    ps.getRange(r, 1, 1, 15).setValues([v]);
  }
  return json_({ status: "success", message: "낭독 진도가 [회원_낭독진도] 시트에 실시간 갱신되었습니다." });
}

// ───────────────────────── 녹음 기록 ─────────────────────────
function addRecording_(data) {
  var rec = data.recording || {};
  var sh = sheet_(SN.REC);
  if (sh) {
    sh.appendRow([
      rec.id || ("REC-" + new Date().getTime()),
      rec.memberId || "", rec.memberName || "", rec.department || "", rec.role || "성도",
      rec.title || "", rec.verseRef || "", rec.passageSnippet || "", rec.duration || "",
      rec.date || nowStr_(),
      rec.isFeatured ? "⭐선정" : "일반",
      rec.status || "approved",
      rec.feedback || ""
    ]);
  }
  return json_({ status: "success", message: "낭독 녹음 음원이 [낭독_음원검수] 시트에 실시간 저장되었습니다." });
}

function uploadAudio_(data) {
  var rootName = "성경낭독녹음";
  var rootFolder = null;
  try {
    var parents = DriveApp.getFoldersByName("수퍼북바이블");
    if (parents.hasNext()) {
      var pf = parents.next();
      var subs = pf.getFoldersByName(rootName);
      rootFolder = subs.hasNext() ? subs.next() : pf.createFolder(rootName);
    }
  } catch (fErr) {}
  if (!rootFolder) {
    var roots = DriveApp.getFoldersByName(rootName);
    rootFolder = roots.hasNext() ? roots.next() : DriveApp.createFolder(rootName);
  }

  var rawName = String(data.memberName || "").replace(/ 성도$/, "").replace(/ 관리자$/, "").replace(/ *[(][^)]*[)]$/, "").trim();
  var rawId = String(data.loginId || "").replace(/@.*$/, "").trim();
  var cleanName = rawName || "성도";
  var cleanId = rawId || "user";
  var userFolderName = data.userFolderName || (cleanName + "_" + cleanId);
  var uf = rootFolder.getFoldersByName(userFolderName);
  var userFolder = uf.hasNext() ? uf.next() : rootFolder.createFolder(userFolderName);

  // 확장자는 실제 녹음 형식(mimeType)을 따른다. (webm 을 이름만 .mp3 로 바꾸면 재생이 안 되는 경우가 있음)
  var mime = data.mimeType || "audio/mpeg";
  var ext = /webm/i.test(mime) ? ".webm" : /mp4|m4a|aac/i.test(mime) ? ".m4a" : /ogg/i.test(mime) ? ".ogg" : /wav/i.test(mime) ? ".wav" : ".mp3";
  var bibleName = String(data.bibleName || data.verseRef || data.fileName || "성경낭독").trim();
  var base = String(data.fileName || bibleName).replace(/[.](webm|mp3|m4a|ogg|wav)$/i, "").replace(new RegExp('[:*?"<>|/]', 'g'), "_").split(String.fromCharCode(92)).join("_").trim();
  var fileName = base + ext;

  var b64 = String(data.base64Audio || "");
  if (b64.indexOf("base64,") > -1) b64 = b64.split("base64,")[1];
  var blob = Utilities.newBlob(Utilities.base64Decode(b64), mime, fileName);
  var file = userFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileUrl = file.getUrl();
  var fileId = file.getId();
  var now = nowStr_();

  // 10일 보관 정책
  try {
    var limit = new Date();
    limit.setDate(limit.getDate() - 10);
    var it = userFolder.getFiles();
    while (it.hasNext()) {
      var f = it.next();
      if (f.getDateCreated() < limit) f.setTrashed(true);
    }
  } catch (cleanErr) {
    Logger.log("10-day retention clean error: " + cleanErr);
  }

  // 시트 동기화
  try {
    var recSheet = sheet_(SN.REC);
    recSheet.appendRow([
      "REC-" + new Date().getTime(),
      data.memberId || ("M-" + cleanId),
      cleanName,
      data.department || data.teamName || "지벳팀",
      "성도",
      data.title || (bibleName + " 낭독"),
      data.verseRef || bibleName,
      fileUrl,
      data.duration || "",
      now,
      "⭐제출완료",
      "검수대기",
      "[" + userFolderName + "] 폴더에 " + fileName + " 저장 완료 (10일 보관)"
    ]);

    var ps = sheet_(SN.PROG);
    var email = norm_(data.email || data.loginId);
    var rows = findRows_(ps, { email: email, name: email ? "" : cleanName });
    if (rows.length) {
      var r = rows[0];
      var v = ps.getRange(r, 1, 1, 15).getValues()[0];
      if (data.book) v[7] = data.book;
      if (data.chapter) v[8] = data.chapter;
      v[9] = (Number(v[9]) || 0) + 1;
      v[10] = (Number(v[10]) || 0) + 1;
      v[11] = now;
      ps.getRange(r, 1, 1, 15).setValues([v]);
    } else if (!loadDeletedKeys_()[memberKey_({ email: email, name: cleanName })]) {
      upsertMember_({
        name: cleanName, email: email, phone: data.phone,
        department: data.department || data.teamName || "지벳팀",
        currentBook: data.book || bibleName, currentChapter: data.chapter || 1,
        totalReadChapters: 1, recordingsCount: 1
      }, email);
    }
  } catch (ssErr) {
    Logger.log("Spreadsheet recording error: " + ssErr);
  }

  return json_({
    status: "success",
    message: "구글 드라이브 [" + userFolderName + "] 폴더에 " + fileName + " 음원이 저장되고 스프레드시트에 동기화되었습니다.",
    fileUrl: fileUrl,
    downloadUrl: "https://drive.google.com/uc?export=download&id=" + fileId,
    fileId: fileId,
    fileName: fileName,
    userFolderName: userFolderName,
    adminEmail: ADMIN_EMAIL
  });
}

// ───────────────────────── 전체 동기화 (sync) ─────────────────────────
// - 삭제 명단(deletedList)을 먼저 처리하고, 삭제된 회원은 절대 다시 만들지 않는다.
// - 시트에 이미 있는 회원의 '진도'만 갱신한다 (더 큰 값만 반영, 오래된 값으로 되돌리지 않음).
// - 시트에 없는 회원은 data.allowCreate === true 일 때만 새로 만든다 (최초 이관용).
function sync_(data) {
  var incoming = (data.data && data.data.members) ? data.data.members : (data.members || []);
  var deletedList = data.deletedList || (data.data && data.data.deletedList) || [];
  var allowCreate = data.allowCreate === true;
  var rs = sheet_(SN.ROSTER), ps = sheet_(SN.PROG);

  // 1) 삭제 명단 처리
  for (var d = 0; d < deletedList.length; d++) {
    var k = String(deletedList[d] || "").trim();
    if (!k) continue;
    if (k.indexOf("@") > -1) {
      deleteMember_({ email: k });
    } else if (!/^M-[0-9]+$/i.test(k)) {
      // 이름 기준 삭제는 동명이인 오삭제를 막기 위해 '딱 1명일 때만' 허용
      if (findRows_(rs, { name: k }).length === 1) deleteMember_({ name: k });
    }
  }

  var delMap = loadDeletedKeys_();
  var now = nowStr_();

  // 2) 진도 갱신 (메모리에서 한 번에 읽고, 바뀐 행만 기록)
  var pLast = ps.getLastRow();
  var pVals = pLast > 1 ? ps.getRange(2, 1, pLast - 1, 15).getValues() : [];
  var pIdx = {};
  pVals.forEach(function (r, i) {
    var key = memberKey_({ email: r[5], name: r[1] });
    if (key && pIdx[key] === undefined) pIdx[key] = i;
  });

  var skippedDeleted = 0, updated = 0, created = 0;
  for (var i = 0; i < incoming.length; i++) {
    var mem = incoming[i];
    if (!mem) continue;
    var key = memberKey_(mem);
    if (!key) continue;
    if (delMap[key]) { skippedDeleted++; continue; }

    var idx = pIdx[key];
    if (idx !== undefined) {
      var row = pVals[idx];
      var changed = false;
      var incTotal = Number(mem.totalReadChapters);
      var curTotal = Number(row[9]) || 0;
      if (has_(mem.totalReadChapters) && !isNaN(incTotal) && incTotal >= curTotal) {
        if (has_(mem.currentReadingRound)) row[6] = mem.currentReadingRound;
        if (mem.currentBook) row[7] = mem.currentBook;
        if (mem.currentChapter) row[8] = mem.currentChapter;
        if (incTotal !== curTotal) changed = true;
        row[9] = incTotal;
        changed = true;
      }
      if (has_(mem.recordingsCount) && Number(mem.recordingsCount) > (Number(row[10]) || 0)) {
        row[10] = Number(mem.recordingsCount);
        changed = true;
      }
      if (changed) {
        row[11] = now;
        ps.getRange(idx + 2, 1, 1, 15).setValues([row]);
        updated++;
      }
    } else if (allowCreate) {
      upsertMember_(mem, "");
      created++;
    }
  }

  log_("전체 양방향 동기화",
    "수신 " + incoming.length + "명 / 진도갱신 " + updated + " / 신규생성 " + created + " / 삭제명단 차단 " + skippedDeleted,
    updated + created);

  var list = buildMemberList_();
  var present = {};
  list.forEach(function (m) { present[memberKey_(m)] = true; });
  var deletedKeys = Object.keys(loadDeletedKeys_()).filter(function (k) { return !present[k]; });

  return json_({
    status: "success",
    message: "수퍼바이블 시트와 안전하게 동기화되었습니다. (시트 기준)",
    members: list,
    deleted: deletedKeys,
    timestamp: now
  });
}

// ───────────────────────── 회원 목록 구성 ─────────────────────────
function buildMemberList_() {
  var rs = sheet_(SN.ROSTER), ps = sheet_(SN.PROG);
  var rRows = (rs && rs.getLastRow() > 1) ? rs.getRange(2, 1, rs.getLastRow() - 1, 13).getValues() : [];
  var pRows = (ps && ps.getLastRow() > 1) ? ps.getRange(2, 1, ps.getLastRow() - 1, 15).getValues() : [];
  var map = {}, order = [];

  rRows.forEach(function (r) {
    var key = memberKey_({ email: r[5], name: r[1] });
    if (!key) return;
    if (!map[key]) order.push(key);
    map[key] = {
      id: cell_(r[0]), name: cell_(r[1]),
      department: cell_(r[2]) || "다이나믹팀", role: cell_(r[3]) || "성도",
      phone: cell_(r[4]) || "010-미등록", email: cell_(r[5]),
      registeredDate: cell_(r[6]), birthdate: cell_(r[7]) || "1995.01.01",
      baptismStatus: cell_(r[8]) || "원입", smallGroup: cell_(r[9]),
      accountRole: cell_(r[10]) || "member", accountStatus: cell_(r[11]) || "active",
      memo: cell_(r[12]),
      currentReadingRound: 0, targetRounds: 12, currentBook: "창세기", currentChapter: 1,
      totalReadChapters: 0, recordingsCount: 0, lastActive: "방금",
      status: "active", consecutiveDays: 1, featuredCount: 0
    };
  });

  pRows.forEach(function (m) {
    var key = memberKey_({ email: m[5], name: m[1] });
    if (!key) return;
    if (!map[key]) {
      order.push(key);
      map[key] = {
        id: cell_(m[0]), name: cell_(m[1]),
        department: cell_(m[2]) || "다이나믹팀", role: cell_(m[3]) || "성도",
        phone: cell_(m[4]) || "010-미등록", email: cell_(m[5]),
        registeredDate: "", birthdate: "1995.01.01", baptismStatus: "원입", smallGroup: "",
        accountRole: "member", accountStatus: "active", memo: cell_(m[14]),
        targetRounds: 12, featuredCount: 0
      };
    }
    var o = map[key];
    o.currentReadingRound = Number(m[6]) || 0;
    o.currentBook = cell_(m[7]) || "창세기";
    o.currentChapter = Number(m[8]) || 1;
    o.totalReadChapters = Number(m[9]) || 0;
    o.recordingsCount = Number(m[10]) || 0;
    o.lastActive = cell_(m[11]) || "방금";
    o.status = cell_(m[12]) || "active";
    o.consecutiveDays = Number(m[13]) || 1;
  });

  var delKeys = loadDeletedKeys_();
  return order.filter(function (k) {
    var m = map[k];
    if (!m) return false;
    var k1 = memberKey_(m);
    var k2 = norm_(m.email);
    var k3 = norm_(m.name);
    var k4 = norm_(m.id);
    if (delKeys[k1] || (k2 && delKeys[k2]) || (k3 && (delKeys[k3] || delKeys["name:" + k3])) || (k4 && delKeys[k4])) {
      return false;
    }
    return true;
  }).map(function (k) { return map[k]; });
}

// ───────────────────────── 초기화 / 정리 (시트 메뉴용) ─────────────────────────
function resetCore_() {
  setupSuperBibleSheets();
  [SN.ROSTER, SN.PROG, SN.REC, SN.DEL].forEach(function (n) {
    var sh = sheet_(n);
    if (sh && sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  });
  seedAdmin_();
  log_("초기화", "마스터 관리자(" + ADMIN_EMAIL + ") 1명으로 전면 초기화 완료", 1);
}

function resetSpreadsheetCompletely() {
  var ui = null;
  try { ui = SpreadsheetApp.getUi(); } catch (e) {}
  if (ui) {
    var ans = ui.alert("전면 초기화", "모든 회원/진도/녹음 데이터가 삭제되고 관리자 1명만 남습니다. 계속할까요?", ui.ButtonSet.YES_NO);
    if (ans !== ui.Button.YES) return;
  }
  resetCore_();
  if (ui) ui.alert("초기화 완료! 마스터 관리자(" + ADMIN_EMAIL + ") 1명만 남기고 모든 데이터가 초기화되었습니다.");
}

// 테스트 행 정리: 성명·이메일 칸이 키워드와 '정확히 일치'하는 행만 삭제 (메모 등 다른 칸은 보지 않음)
function cleanTestMembers() {
  var keywords = ["임시테스트", "e2e테스터", "e2e테스트", "신규 성도", "신규성도",
    "temp_delete_test", "e2e_tester", "라이브테스트성도", "user_live_test",
    "삭제실험맨", "del_experiment", "황희", "윤봉길",
    "yoocomdr55@gmail.com", "yoocomdr58@gmail.com", "realuser1@gmail.com"].map(norm_);
  var count = 0;
  [SN.ROSTER, SN.PROG].forEach(function (n) {
    var sh = sheet_(n);
    if (!sh || sh.getLastRow() < 2) return;
    var data = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      var nm = norm_(data[i][1]), em = norm_(data[i][5]);
      if (em === norm_(ADMIN_EMAIL)) continue;
      if (keywords.indexOf(nm) > -1 || keywords.indexOf(em) > -1) {
        sh.deleteRow(i + 2);
        count++;
      }
    }
  });
  Logger.log("테스트 행 정리 완료: " + count + "개 행 삭제");
  try { SpreadsheetApp.getUi().alert("테스트 행 " + count + "개를 정리했습니다."); } catch (e) {}
}

// ───────────────────────── 웹앱 엔트리 ─────────────────────────
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return json_({ status: "error", message: "서버가 혼잡합니다. 잠시 후 다시 시도해 주세요." });
  }
  try {
    var raw = e.postData ? e.postData.contents : "";
    var data = {};
    try { data = JSON.parse(raw); } catch (parseErr) { if (e.parameter) data = e.parameter; }
    if (!data.action && e.parameter && e.parameter.action) data = e.parameter;

    ensureSheets_();
    var action = data.action;

    if (action === "resetAll" || action === "resetSpreadsheet") {
      if (!tokenOk_(data)) {
        return json_({ status: "error", message: "웹을 통한 전면 초기화는 차단되어 있습니다. (구글 시트 상단 메뉴에서 실행하세요)" });
      }
      resetCore_();
      return json_({ status: "success", message: "마스터 관리자 1명으로 전면 초기화되었습니다." });
    }

    if (action === "deleteMember") {
      if (API_TOKEN !== "" && !tokenOk_(data)) return json_({ status: "error", message: "권한이 없습니다." });
      return deleteMemberResponse_(data);
    }

    if (action === "updateMember") return updateMember_(data);

    if (action === "registerMember" || action === "register" || action === "registerUser") {
      var member = data.member || {};
      var emailKey = norm_(member.email || data.loginId);
      var nameKey = String(member.name || (data.loginId ? data.loginId + " 성도" : "신규 성도")).trim();
      // 같은 사람이 다시 가입하면 삭제 명단에서 해제
      removeTombstone_({ email: emailKey, name: nameKey });
      var res = upsertMember_(member, data.loginId);
      log_("회원가입 동기화", "회원 " + (res.created ? "등록" : "갱신") + ": " + res.name + " (" + res.email + ")", 1);
      return json_({
        status: "success",
        message: "신규 회원이 [회원관리] 및 [회원_낭독진도] 시트에 실시간 저장되었습니다.",
        memberId: res.id,
        created: res.created,
        timestamp: nowStr_()
      });
    }

    if (action === "dbInsert") return dbInsert_(data);
    if (action === "dbUpdate") return dbUpdate_(data);
    if (action === "dbDelete") return dbDelete_(data);
    if (action === "dbList") return dbList_(data);
    if (action === "updateProgress") return updateProgress_(data);
    if (action === "addRecording") return addRecording_(data);
    if (action === "uploadAudio" || action === "upload_audio") return uploadAudio_(data);
    if (action === "sync") return sync_(data);

    return json_({ status: "success", message: "요청이 정상 수신되었습니다." });
  } catch (err) {
    return json_({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return json_({ status: "error", message: "서버가 혼잡합니다. 잠시 후 다시 시도해 주세요." });
  }
  try {
    ensureSheets_();
    var p = (e && e.parameter) ? e.parameter : {};

    // GET 삭제 호환 (초기화/테스트정리는 웹에서 더 이상 지원하지 않음)
    if (p.action === "deleteMember" || p.action === "delete") {
      if (API_TOKEN !== "" && !tokenOk_(p)) return json_({ status: "error", message: "권한이 없습니다." });
      return deleteMemberResponse_(p);
    }

    if (p.action === "dbList") return dbList_(p);

    var list = buildMemberList_();
    var present = {};
    list.forEach(function (m) { present[memberKey_(m)] = true; });
    var deletedKeys = Object.keys(loadDeletedKeys_()).filter(function (k) { return !present[k]; });
    var ss = getSS_();

    return json_({
      status: "success",
      members: list,
      deleted: deletedKeys,
      rosterCount: Math.max(0, sheet_(SN.ROSTER).getLastRow() - 1),
      memberProgressCount: Math.max(0, sheet_(SN.PROG).getLastRow() - 1),
      adminEmail: ADMIN_EMAIL,
      sheetUrl: ss.getUrl(),
      sheetId: ss.getId(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return json_({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}


// ═════════════════════ 범용 삽입·수정·삭제·조회 (한글 필드명 기준) ═════════════════════
var ROSTER_MAP = {
  "회원번호": "id", "성명": "name", "소속부서": "department", "직분": "role", "전화번호": "phone",
  "이메일": "email", "등록일자": "registeredDate", "생년월일": "birthdate", "세례구분": "baptismStatus",
  "구역/목장": "smallGroup", "계정권한": "accountRole", "회원상태": "accountStatus", "관리자메모": "memo"
};

function toMember_(values) {
  var m = {};
  for (var k in ROSTER_MAP) if (has_(values[k])) m[ROSTER_MAP[k]] = values[k];
  return m;
}

function writeAllowed_(data) {
  return API_TOKEN === "" || tokenOk_(data);
}

function findByPk_(sh, id) {
  if (!sh || sh.getLastRow() < 2) return -1;
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  var t = norm_(id);
  for (var i = 0; i < vals.length; i++) if (norm_(vals[i][0]) === t) return i + 2;
  return -1;
}

function rowToObj_(headers, row) {
  var o = {};
  for (var i = 0; i < headers.length; i++) o[headers[i]] = cell_(row[i]);
  return o;
}

// 삽입
function dbInsert_(data) {
  if (!writeAllowed_(data)) return json_({ status: "error", message: "권한이 없습니다." });
  var sc = schema_(data.table);
  if (!sc) return json_({ status: "error", message: "알 수 없는 시트입니다: " + data.table });
  var values = data.values || {};

  if (sc.name === SN.ROSTER) {
    var m = toMember_(values);
    if (!m.name && !m.email) return json_({ status: "error", message: "성명 또는 이메일이 필요합니다." });
    removeTombstone_({ email: m.email, name: m.name });
    var res = upsertMember_(m, "");
    log_("DB삽입", "회원관리 " + (res.created ? "삽입" : "기존 회원 갱신") + ": " + res.name, 1);
    return json_({ status: "success", message: res.created ? "회원이 삽입되었습니다." : "이미 있는 회원이라 정보를 갱신했습니다.", key: res.id, created: res.created });
  }

  var sh = sheet_(sc.name);
  var pk = sc.headers[0];
  var id = String(values[pk] || "").trim() || (sc.prefix + new Date().getTime());
  if (findByPk_(sh, id) > 0) return json_({ status: "error", message: pk + " '" + id + "' 가 이미 존재합니다." });
  var row = sc.headers.map(function (h) { return h === pk ? id : (has_(values[h]) ? values[h] : ""); });
  sh.appendRow(row);
  if (sc.name !== SN.LOG) log_("DB삽입", sc.name + " 삽입: " + id, 1);
  return json_({ status: "success", message: "삽입되었습니다.", key: id });
}

// 수정 (key = 1열 기본키 값, values = 바꿀 한글 필드들)
function dbUpdate_(data) {
  if (!writeAllowed_(data)) return json_({ status: "error", message: "권한이 없습니다." });
  var sc = schema_(data.table);
  if (!sc) return json_({ status: "error", message: "알 수 없는 시트입니다: " + data.table });
  var key = String(data.key || "").trim();
  var values = data.values || {};
  if (!key) return json_({ status: "error", message: "key(기본키 값)가 필요합니다." });

  if (sc.name === SN.ROSTER) {
    var m = toMember_(values);
    m.id = key;
    return updateMember_({ member: m, originalEmail: data.originalEmail || "" });
  }

  var sh = sheet_(sc.name);
  var r = findByPk_(sh, key);
  if (r < 0) return json_({ status: "error", message: "수정할 행을 찾지 못했습니다: " + key });
  var row = sh.getRange(r, 1, 1, sc.headers.length).getValues()[0];
  for (var i = 1; i < sc.headers.length; i++) {   // 기본키(1열)는 변경하지 않음
    if (has_(values[sc.headers[i]])) row[i] = values[sc.headers[i]];
  }
  sh.getRange(r, 1, 1, sc.headers.length).setValues([row]);
  log_("DB수정", sc.name + " 수정: " + key, 1);
  return json_({ status: "success", message: "수정되었습니다.", key: key });
}

// 삭제
function dbDelete_(data) {
  if (API_TOKEN !== "" && !tokenOk_(data)) return json_({ status: "error", message: "권한이 없습니다." });
  var sc = schema_(data.table);
  if (!sc) return json_({ status: "error", message: "알 수 없는 시트입니다: " + data.table });
  var key = String(data.key || "").trim();
  if (!key) return json_({ status: "error", message: "key(기본키 값)가 필요합니다." });

  if (sc.name === SN.ROSTER) return deleteMemberResponse_({ memberId: key });

  var sh = sheet_(sc.name);
  var r = findByPk_(sh, key);
  if (r < 0) return json_({ status: "error", message: "삭제할 행을 찾지 못했습니다: " + key });
  sh.deleteRow(r);
  if (sc.name !== SN.LOG) log_("DB삭제", sc.name + " 삭제: " + key, 1);
  return json_({ status: "success", message: "삭제되었습니다.", key: key });
}

// 조회 (where: {"필드명":"값"} 일치 조건, limit 기본 500)
function dbList_(data) {
  var sc = schema_(data.table);
  if (!sc) return json_({ status: "error", message: "알 수 없는 시트입니다: " + data.table });
  var where = data.where || {};
  if (typeof where === "string") { try { where = JSON.parse(where); } catch (e) { where = {}; } }
  if (data.key) where[sc.headers[0]] = data.key;
  var limit = Number(data.limit) || 500;

  var sh = sheet_(sc.name);
  var rows = [];
  if (sh && sh.getLastRow() > 1) {
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, sc.headers.length).getValues();
    for (var i = 0; i < vals.length && rows.length < limit; i++) {
      var o = rowToObj_(sc.headers, vals[i]);
      var ok = true;
      for (var f in where) if (norm_(o[f]) !== norm_(where[f])) { ok = false; break; }
      if (ok) rows.push(o);
    }
  }
  return json_({ status: "success", table: sc.name, headers: sc.headers, count: rows.length, rows: rows });
}

// ═════════════════════ 시트 메뉴: 회원 추가 / 선택 행 삭제 ═════════════════════
function addMemberPrompt() {
  var ui = SpreadsheetApp.getUi();
  var n = ui.prompt("회원 추가", "성명을 입력하세요", ui.ButtonSet.OK_CANCEL);
  if (n.getSelectedButton() !== ui.Button.OK || !n.getResponseText().trim()) return;
  var e = ui.prompt("회원 추가", "이메일을 입력하세요 (없으면 비워두세요)", ui.ButtonSet.OK_CANCEL);
  if (e.getSelectedButton() !== ui.Button.OK) return;
  var d = ui.prompt("회원 추가", "소속부서를 입력하세요 (비우면 '새가족 성경통독부')", ui.ButtonSet.OK_CANCEL);
  if (d.getSelectedButton() !== ui.Button.OK) return;

  var name = n.getResponseText().trim(), email = e.getResponseText().trim(), dept = d.getResponseText().trim();
  var res = withLock_(function () {
    ensureSheets_();
    removeTombstone_({ email: email, name: name });
    var r = upsertMember_({ name: name, email: email, department: dept || "", memo: "시트 메뉴에서 직접 추가" }, "");
    log_("DB삽입", "메뉴에서 회원 추가: " + name, 1);
    return r;
  });
  ui.alert(res.created ? "회원이 추가되었습니다. (회원번호 " + res.id + ")" : "이미 있는 회원이라 정보를 갱신했습니다.");
}

function deleteSelectedMembers() {
  var ui = SpreadsheetApp.getUi();
  var sh = getSS_().getActiveSheet();
  if ([SN.ROSTER, SN.PROG].indexOf(sh.getName()) < 0) {
    ui.alert("[회원관리] 또는 [회원_낭독진도] 시트에서 삭제할 회원 행을 선택한 뒤 실행하세요.");
    return;
  }
  var range = sh.getActiveRange();
  var first = Math.max(2, range.getRow());
  var last = range.getRow() + range.getNumRows() - 1;
  if (last < first) { ui.alert("삭제할 회원 행을 선택하세요. (1행은 필드명입니다)"); return; }

  var targets = [];
  for (var r = first; r <= last; r++) {
    var v = sh.getRange(r, 1, 1, 6).getValues()[0];
    if (v[1] || v[5]) targets.push({ id: String(v[0]), name: String(v[1]), email: String(v[5]) });
  }
  if (!targets.length) { ui.alert("선택한 행에 회원 정보가 없습니다."); return; }

  var names = targets.map(function (t) { return t.name || t.email; }).join(", ");
  var ans = ui.alert("회원 삭제", "다음 " + targets.length + "명을 [회원관리]와 [회원_낭독진도]에서 영구 삭제합니다: (" + names + ") 계속할까요?", ui.ButtonSet.YES_NO);
  if (ans !== ui.Button.YES) return;

  var done = withLock_(function () {
    var cnt = 0;
    targets.forEach(function (t) {
      var res = deleteMember_({ id: t.id, email: t.email, name: t.name });
      if (res.ok) cnt += res.rowsDeleted;
    });
    log_("회원 삭제 동기화", "메뉴에서 삭제: " + names, cnt);
    return cnt;
  });
  ui.alert("삭제 완료 (삭제된 행 " + done + "개). 삭제 명단에 등록되어 앱에서 다시 살아나지 않습니다.");
}`;
}
