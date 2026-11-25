import { MemberReadingProfile, MemberRecordingItem, ReadingCampaign } from '../data/adminData';
import { getDeletedRecords, DELETED_RECORDS_KEY } from './authService';
import APPS_SCRIPT_SOURCE from '../../SuperBible_AppsScript_Code.gs?raw';

/**
 * 수퍼바이블 ↔ 구글 스프레드시트(superbible DBase) 동기화 서비스 (v4)
 *
 * 원칙
 *  1) 회원 목록의 기준은 오직 구글 시트다. 앱은 시트에서 받은 목록을 그대로 쓴다. (회원번호도 시트 것 그대로)
 *  2) 회원은 이메일로 구분한다. 이름이 같다고 같은 사람으로 보지 않는다.
 *  3) 전송 실패(네트워크·시간초과)만 대기열에 넣어 다시 보낸다. 시트가 "거절"한 요청은 다시 보내지 않는다.
 *  4) 가입 요청에는 requestedAt(만든 시각)을 붙여, 삭제 이후에 도착한 "오래된 가입 요청" 이 회원을 되살리지 못하게 한다.
 */

export interface GoogleSheetConfig {
  sheetId: string;
  sheetUrl: string;
  adminEmail: string;
  scriptUrl: string;
  autoSync: boolean;
  lastSynced: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error' | 'pending';
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
  action: string;
  payload: any;
  createdAt: string;
}

const CONFIG_STORAGE_KEY = 'superbible_googlesheet_config_v2';
const LOGS_STORAGE_KEY = 'superbible_googlesheet_logs_v2';
const PENDING_QUEUE_KEY = 'superbible_pending_sheet_sync_v2';
const ADMIN_MEMBERS_STORAGE_KEY = 'superbible_admin_members_v4';
const REGISTRY_STORAGE_KEY = 'superbible_user_registry_v2';
const MASTER_ADMIN_EMAIL = 'yoocomdr57@gmail.com';

/**
 * 중앙 동기화 허브(/api/sync) 주소. 안드로이드 앱·로컬 개발 환경에서는 배포된 Vercel 주소를 쓴다.
 */
export function getSyncApiUrl(endpoint: string = '/api/sync'): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
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

// ▼▼▼ 새 웹앱 URL 로 바꿀 곳 (Vercel 환경변수 GOOGLE_SCRIPT_URL 을 설정하면 그 값이 우선 적용됩니다) ▼▼▼
export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzHnO0-Yvmfr2A0ImQewLiWhvVEt1HG9pLFUEEexaBr0GwEnYRNGtNyBibvOJdRQW2lPg/exec';
export const TARGET_SHEET_ID = '1a0LH7AT9F0l5UXdvnHQCojnK-vduQQ40nagRUxvLv3k';
export const TARGET_SHEET_URL = `https://docs.google.com/spreadsheets/d/${TARGET_SHEET_ID}/edit`;
// ▲▲▲▲▲▲

export const DEFAULT_SHEET_CONFIG: GoogleSheetConfig = {
  sheetId: TARGET_SHEET_ID,
  sheetUrl: TARGET_SHEET_URL,
  adminEmail: MASTER_ADMIN_EMAIL,
  scriptUrl: DEFAULT_SCRIPT_URL,
  autoSync: true,
  lastSynced: null,
  syncStatus: 'idle',
  lastSyncMessage: '구글 시트(superbible DBase) 연동 대기',
};

export function getGoogleSheetConfig(): GoogleSheetConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.sheetUrl || parsed.sheetUrl.includes('10AYmeENdos') || parsed.sheetUrl.includes('yoocomdr53')) {
        parsed.sheetUrl = TARGET_SHEET_URL;
        parsed.sheetId = TARGET_SHEET_ID;
      }
      if (!parsed.scriptUrl || !String(parsed.scriptUrl).startsWith('https://script.google')) {
        parsed.scriptUrl = DEFAULT_SCRIPT_URL;
      }
      return { ...DEFAULT_SHEET_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load Google Sheet config', e);
  }
  return { ...DEFAULT_SHEET_CONFIG };
}

/** 이 기기에 설정 저장 (서버에는 저장되지 않음 — 모든 기기 공통 URL 은 Vercel 환경변수로) */
export function saveGoogleSheetConfig(config: GoogleSheetConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Google Sheet config', e);
  }
}

export async function saveGoogleSheetConfigAsync(
  config: GoogleSheetConfig
): Promise<{ success: boolean; message: string }> {
  saveGoogleSheetConfig(config);
  return {
    success: true,
    message:
      '이 기기에 웹앱 URL 이 저장되었습니다. 모든 기기에 적용하려면 Vercel 환경변수 GOOGLE_SCRIPT_URL 에도 같은 URL 을 넣어 주세요.',
  };
}

/**
 * 서버(Vercel 환경변수)에 웹앱 URL 이 설정돼 있으면 모든 기기가 그 URL 을 쓰도록 맞춘다.
 */
export async function initGoogleSheetConfigFromServer(): Promise<GoogleSheetConfig> {
  const current = getGoogleSheetConfig();
  try {
    const res = await fetch(getSyncApiUrl('/api/sync?action=getConfig'));
    if (res.ok) {
      const data = await res.json();
      let modified = false;
      if (data.scriptUrlFromEnv && data.scriptUrl && data.scriptUrl !== current.scriptUrl) {
        current.scriptUrl = data.scriptUrl;
        modified = true;
      }
      if (data.sheetUrl && data.sheetUrl !== current.sheetUrl) {
        current.sheetUrl = data.sheetUrl;
        modified = true;
      }
      if (data.sheetId && data.sheetId !== current.sheetId) {
        current.sheetId = data.sheetId;
        modified = true;
      }
      if (modified) saveGoogleSheetConfig(current);
    }
  } catch (e) {
    // offline
  }
  return current;
}

export function getSheetSyncLogs(): SheetSyncLog[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function addSheetSyncLog(log: Omit<SheetSyncLog, 'id'>): SheetSyncLog {
  const newLog: SheetSyncLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...log,
  };
  try {
    const existing = getSheetSyncLogs();
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify([newLog, ...existing].slice(0, 50)));
  } catch (e) {}
  return newLog;
}

// ───────────── 재전송 대기열 ─────────────
export function getPendingSyncQueue(): PendingSyncItem[] {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function savePendingSyncQueue(items: PendingSyncItem[]): void {
  try {
    if (items.length) localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(items.slice(-100)));
    else localStorage.removeItem(PENDING_QUEUE_KEY);
  } catch (e) {}
}

export function enqueuePendingSync(action: string, payload: any): void {
  const current = getPendingSyncQueue();
  // 같은 요청(같은 action + 같은 requestedAt)은 한 번만
  if (payload?.requestedAt && current.some((i) => i.action === action && i.payload?.requestedAt === payload.requestedAt)) {
    return;
  }
  current.push({
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    action,
    payload,
    createdAt: new Date().toISOString(),
  });
  savePendingSyncQueue(current);
}

export function clearPendingSyncQueue(): void {
  savePendingSyncQueue([]);
}

/** 특정 회원(이메일)과 관련된 대기 요청을 모두 지운다 — 삭제한 회원이 대기열 때문에 되살아나는 것을 막음 */
export function removePendingSyncForEmail(email?: string): void {
  const e = (email || '').toLowerCase().trim();
  if (!e) return;
  const remaining = getPendingSyncQueue().filter((i) => {
    if (i.action === 'deleteMember') return true;
    const p = i.payload || {};
    const pe = String(p.member?.email || p.email || '').toLowerCase().trim();
    const pl = String(p.loginId || '').toLowerCase().trim();
    return pe !== e && pl !== e;
  });
  savePendingSyncQueue(remaining);
}

function isRetryableMessage(msg?: string): boolean {
  return /시간 초과|통신 실패|혼잡|HTML|fetch|network|Failed/i.test(String(msg || ''));
}

export interface SheetResult {
  success: boolean;
  message: string;
  retryable?: boolean;
  data?: any; // 구글 웹앱 응답 (memberId 등)
}

/**
 * 중앙 허브(/api/sync)를 거쳐 구글 웹앱으로 요청을 보낸다.
 * 네트워크·시간초과 실패만 대기열에 넣는다.
 */
export async function sendPayloadToGoogleScript(
  payload: { action: string; [key: string]: any },
  customUrl?: string,
  options: { enqueueOnFail?: boolean } = {}
): Promise<SheetResult> {
  const enqueueOnFail = options.enqueueOnFail !== false;
  const config = getGoogleSheetConfig();
  const scriptUrl = customUrl || config.scriptUrl;
  const fullPayload = {
    timestamp: new Date().toISOString(),
    requestedAt: Date.now(),
    ...payload,
  };
  const nowStr = new Date().toLocaleString('ko-KR');

  let result: SheetResult;
  try {
    const res = await fetch(getSyncApiUrl('/api/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fullPayload, scriptUrl }),
    });
    if (!res.ok) throw new Error(`허브 응답 오류 HTTP ${res.status}`);
    const data = await res.json();
    if (data.success) {
      result = { success: true, message: data.message || '구글 시트에 반영되었습니다.', data: data.gasResult };
    } else {
      const msg = data.gasError || data.message || '구글 시트 반영 실패';
      result = { success: false, message: msg, retryable: isRetryableMessage(msg), data: data.gasResult };
    }
  } catch (err: any) {
    result = { success: false, message: `동기화 서버 통신 실패: ${err?.message || err}`, retryable: true };
  }

  if (result.success) {
    saveGoogleSheetConfig({
      ...config,
      lastSynced: nowStr,
      syncStatus: 'success',
      lastSyncMessage: `구글 시트 반영 완료 (${payload.action})`,
    });
  } else {
    if (result.retryable && enqueueOnFail) enqueuePendingSync(payload.action, fullPayload);
    saveGoogleSheetConfig({
      ...config,
      lastSynced: nowStr,
      syncStatus: result.retryable ? 'pending' : 'error',
      lastSyncMessage: result.message,
    });
  }
  addSheetSyncLog({
    timestamp: nowStr,
    direction: 'upload',
    status: result.success ? 'success' : result.retryable ? 'in_progress' : 'failed',
    summary: `${result.success ? '시트 반영 성공' : result.retryable ? '재전송 대기' : '시트 반영 실패'}: ${payload.action}`,
    details: result.message,
    rowsAffected: result.success ? 1 : 0,
  });
  return result;
}

export async function syncMemberRegistrationToGoogleSheet(
  member: MemberReadingProfile,
  loginId: string
): Promise<SheetResult> {
  return sendPayloadToGoogleScript({ action: 'registerMember', loginId, member, requestedAt: Date.now() });
}

export async function updateMemberInGoogleSheet(
  member: MemberReadingProfile,
  originalEmail?: string
): Promise<SheetResult> {
  return sendPayloadToGoogleScript({ action: 'updateMember', member, originalEmail: originalEmail || member.email });
}

export async function syncProgressToGoogleSheet(
  email: string,
  book: string,
  chapter: number,
  totalReadChapters?: number
): Promise<SheetResult> {
  return sendPayloadToGoogleScript({ action: 'updateProgress', email, book, chapter, totalReadChapters });
}

export async function syncRecordingToGoogleSheet(recording: MemberRecordingItem): Promise<SheetResult> {
  return sendPayloadToGoogleScript({ action: 'addRecording', recording });
}

/**
 * 녹음 파일을 구글 드라이브 [성경낭독녹음] > [이름_아이디] 폴더에 업로드 (10일 보관)
 */
export async function uploadAudioToDrive(params: {
  audioBlob: Blob;
  fileName?: string;
  bibleName?: string;
  memberName?: string;
  loginId?: string;
  email?: string;
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
    return { success: false, message: 'Google Apps Script 웹앱 URL 이 설정되지 않았습니다.', userFolderName, fileName };
  }

  try {
    const base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(params.audioBlob);
    });

    const payload = {
      action: 'uploadAudio',
      fileName,
      bibleName: cleanBibleName,
      userFolderName,
      base64Audio,
      mimeType: params.audioBlob.type || 'audio/mp3',
      memberName: cleanName,
      loginId: params.loginId || cleanId,
      email: params.email || (params.loginId && params.loginId.includes('@') ? params.loginId : ''),
      teamName: params.teamName || '',
      verseRef: params.verseRef || cleanBibleName,
      book: params.book,
      chapter: params.chapter,
      duration: params.duration || '',
    };

    // 녹음 파일은 용량이 커서 허브(Vercel, 4.5MB 제한)를 거치지 않고 구글 웹앱으로 직접 보낸다.
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    let resJson: any = null;
    try {
      resJson = await res.json();
    } catch {}
    if (resJson && resJson.status === 'error') throw new Error(resJson.message);

    addSheetSyncLog({
      timestamp: new Date().toLocaleString('ko-KR'),
      direction: 'upload',
      status: 'success',
      summary: `구글 드라이브 [${userFolderName}] ${fileName} 업로드`,
      details: resJson?.message || '업로드 요청 완료',
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
 * 대기열 재전송. 네트워크 문제로 실패한 것만 남기고, 시트가 거절한 요청은 버린다.
 */
let flushing = false;
export async function flushPendingSyncQueue(): Promise<{ success: boolean; flushedCount: number }> {
  if (flushing) return { success: true, flushedCount: 0 };
  const queue = getPendingSyncQueue();
  if (queue.length === 0) return { success: true, flushedCount: 0 };
  flushing = true;
  const remaining: PendingSyncItem[] = [];
  let count = 0;
  try {
    for (const item of queue) {
      if (!item?.payload?.action) continue;
      const res = await sendPayloadToGoogleScript(item.payload, undefined, { enqueueOnFail: false });
      if (res.success) count++;
      else if (res.retryable) remaining.push(item);
    }
  } finally {
    // 보내는 동안 새로 들어온 항목은 유지
    const latest = getPendingSyncQueue();
    const sentIds = new Set(queue.map((q) => q.id));
    savePendingSyncQueue([...remaining, ...latest.filter((i) => !sentIds.has(i.id))]);
    flushing = false;
  }
  return { success: remaining.length === 0, flushedCount: count };
}

/** 대기열에 아직 남아 있는 "가입 요청" 의 이메일 목록 */
function pendingRegistrationEmails(): Set<string> {
  const s = new Set<string>();
  getPendingSyncQueue().forEach((i) => {
    if (i.action === 'registerMember' || i.payload?.action === 'registerMember') {
      const e = String(i.payload?.member?.email || '').toLowerCase().trim();
      if (e) s.add(e);
    }
  });
  return s;
}

/**
 * 구글 시트에서 회원 목록을 받아 이 기기의 명부를 "그대로" 교체한다.
 *  - 회원번호·순서는 시트 그대로 (다시 매기지 않음)
 *  - 아직 시트에 도착하지 않은 이 기기의 가입 요청(대기열)만 임시로 함께 보여줌
 *  - 시트의 삭제 명단(이메일)에 있는 계정은 이 기기의 로그인 목록에서도 제거
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
    const res = await fetch(
      getSyncApiUrl(`/api/sync?action=pull${scriptUrl ? `&scriptUrl=${encodeURIComponent(scriptUrl)}` : ''}`),
      { method: 'GET', headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.members)) {
        const sheetMembers: MemberReadingProfile[] = data.members;
        const deletedAt: Record<string, number> = data.deletedAt || {};
        const sheetEmails = new Set(sheetMembers.map((m) => (m.email || '').toLowerCase().trim()).filter(Boolean));

        // 1) 이 기기에서 방금 삭제했는데 시트 반영이 아직인 회원은 잠시 숨김 (로컬 삭제기록, 2분 유효)
        const localDeleted = getDeletedRecords();
        const recentCut = Date.now() - 2 * 60 * 1000;
        const recentLocal: Record<string, number> = {};
        Object.keys(localDeleted).forEach((k) => {
          if (localDeleted[k] > recentCut) recentLocal[k] = localDeleted[k];
        });
        let roster = sheetMembers.filter((m) => !recentLocal[(m.email || '').toLowerCase().trim()]);

        // 2) 아직 시트에 도착하지 않은 이 기기의 가입 요청은 함께 표시
        const pendingEmails = pendingRegistrationEmails();
        if (pendingEmails.size) {
          try {
            const localRoster: MemberReadingProfile[] = JSON.parse(localStorage.getItem(ADMIN_MEMBERS_STORAGE_KEY) || '[]');
            localRoster.forEach((m) => {
              const e = (m.email || '').toLowerCase().trim();
              if (e && pendingEmails.has(e) && !sheetEmails.has(e)) roster.push(m);
            });
          } catch {}
        }

        localStorage.setItem(ADMIN_MEMBERS_STORAGE_KEY, JSON.stringify(roster));
        // 로컬 삭제기록 = 시트 삭제명단 + 최근 2분 로컬 삭제
        try {
          localStorage.setItem(DELETED_RECORDS_KEY, JSON.stringify({ ...deletedAt, ...recentLocal }));
          localStorage.removeItem('superbible_deleted_members_v2');
        } catch {}

        // 3) 로그인 계정 목록 정리
        try {
          let accounts: any[] = JSON.parse(localStorage.getItem(REGISTRY_STORAGE_KEY) || '[]');
          // 시트에서 삭제된 이메일 계정 제거 (단, 삭제 이후 이 기기에서 새로 가입한 계정은 유지)
          accounts = accounts.filter((a) => {
            const keys = [a.user?.email, a.loginId].map((x) => String(x || '').toLowerCase().trim());
            const created = Date.parse(a.createdAt || '') || 0;
            return !keys.some((k) => k && k !== MASTER_ADMIN_EMAIL && deletedAt[k] && deletedAt[k] >= created && !sheetEmails.has(k));
          });
          // 시트에 있는 회원은 다른 기기에서도 보이도록 계정 자리를 만들어 둠 (비밀번호는 본인 기기에만)
          sheetMembers.forEach((m) => {
            const e = (m.email || '').toLowerCase().trim();
            if (!e) return;
            const acc = accounts.find(
              (a) => String(a.user?.email || '').toLowerCase().trim() === e || String(a.loginId || '').toLowerCase().trim() === e
            );
            if (acc) {
              if (m.name && acc.user) acc.user.name = m.name;
              if (m.department && acc.user) acc.user.department = m.department;
              return;
            }
            const isAdmin = e === MASTER_ADMIN_EMAIL;
            accounts.push({
              loginId: m.email,
              passwordHash: isAdmin ? 'admin1234' : `REMOTE_SYNC_${Math.random().toString(36).slice(2)}`,
              user: {
                id: `user-${m.id || Date.now()}`,
                name: m.name,
                email: m.email,
                phone: m.phone,
                avatarText: m.avatarText || m.name?.slice(0, 2) || '성도',
                role: isAdmin || m.accountRole === 'admin' ? 'admin' : 'saint',
                provider: 'standard',
                schoolName: '로고스 수퍼바이블 공동체',
                department: m.department || '다이나믹팀',
                consecutiveDays: m.consecutiveDays || 1,
                ntProgress: 0,
                todayVersesRead: 0,
                recordingsCount: m.recordingsCount || 0,
              },
              createdAt: new Date(0).toISOString(),
            });
          });
          localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(accounts));
        } catch {}

        // 시트 주소 자동 반영 (시트 열기 버튼이 실제 superbible DBase 를 열도록)
        if (data.sheetUrl && data.sheetUrl !== config.sheetUrl) {
          saveGoogleSheetConfig({ ...getGoogleSheetConfig(), sheetUrl: data.sheetUrl, sheetId: data.sheetId || config.sheetId });
        }

        return {
          success: true,
          members: roster,
          source: data.source,
          message: `구글 시트에서 ${roster.length}명의 회원 명부를 받았습니다.`,
        };
      }
      // 허브는 응답했지만 시트를 읽지 못함
      return { success: false, members: readLocalRoster(), source: 'local', message: data.message };
    }
  } catch (err) {
    console.warn('[SyncService] pullMembersFromGoogleSheet error:', err);
  }
  return { success: false, members: readLocalRoster(), source: 'local', message: '동기화 서버에 연결하지 못했습니다.' };
}

function readLocalRoster(): MemberReadingProfile[] {
  try {
    const raw = localStorage.getItem(ADMIN_MEMBERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

/**
 * [동기화] 버튼: 대기열을 먼저 보내고, 시트의 최신 명부를 받아온다. (삭제기록을 지우지 않음)
 */
export async function syncBidirectionalWithGoogleSheets(
  _members: MemberReadingProfile[],
  recordings: MemberRecordingItem[],
  _campaigns: ReadingCampaign[],
  _customScriptUrl?: string
): Promise<{
  success: boolean;
  message: string;
  updatedMembers?: MemberReadingProfile[];
  updatedRecordings?: MemberRecordingItem[];
}> {
  const flushed = await flushPendingSyncQueue();
  const pull = await pullMembersFromGoogleSheet();
  const nowStr = new Date().toLocaleString('ko-KR');
  addSheetSyncLog({
    timestamp: nowStr,
    direction: 'bidirectional',
    status: pull.success ? 'success' : 'failed',
    summary: pull.success ? '구글 시트 동기화 완료' : '구글 시트 동기화 실패',
    details: pull.success
      ? `시트 기준 ${pull.members.length}명 / 대기열 전송 ${flushed.flushedCount}건`
      : pull.message || '시트를 읽지 못했습니다.',
    rowsAffected: pull.members.length,
  });
  return {
    success: pull.success,
    message: pull.success
      ? `구글 시트와 동기화되었습니다. (시트 기준 ${pull.members.length}명${flushed.flushedCount ? `, 대기열 ${flushed.flushedCount}건 전송` : ''})`
      : `구글 시트 동기화 실패: ${pull.message || '웹앱 URL·배포 설정을 확인하세요.'}`,
    updatedMembers: pull.success ? pull.members : undefined,
    updatedRecordings: recordings,
  };
}

/**
 * 구글 Apps Script 코드 (저장소의 SuperBible_AppsScript_Code.gs 파일 내용 그대로)
 */
export function generateAppsScriptCode(_adminEmail = MASTER_ADMIN_EMAIL): string {
  return APPS_SCRIPT_SOURCE;
}
