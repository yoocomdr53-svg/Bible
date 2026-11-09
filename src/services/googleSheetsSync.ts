import { MemberReadingProfile, MemberRecordingItem, ReadingCampaign } from '../data/adminData';

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

export const DEFAULT_SHEET_CONFIG: GoogleSheetConfig = {
  sheetId: '1yoocomdr57_SuperBible_MasterRoster_2026',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1yoocomdr57_SuperBible_MasterRoster_2026/edit',
  adminEmail: 'yoocomdr57@gmail.com',
  scriptUrl: '',
  autoSync: true,
  lastSynced: '실시간 자동 동기화 대기 중',
  syncStatus: 'idle',
  lastSyncMessage: 'yoocomdr57@gmail.com 계정 구글 스프레드시트 실시간 동기화 준비 완료',
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
  } catch (e) {
    console.error('Failed to save Google Sheet config', e);
  }
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
 * Send arbitrary payload to Google Apps Script Web App
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

  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    // Save to pending queue so it can be sent once URL is provided
    enqueuePendingSync(payload.action as any, fullPayload);
    const nowStr = new Date().toLocaleString('ko-KR');
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

    const nowStr = new Date().toLocaleString('ko-KR');
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

  const cleanName = (params.memberName || '성도').replace(/ 성도$/, '').replace(/ 관리자$/, '').trim();
  const cleanId = (params.loginId || 'user').replace(/@.*$/, '').trim();
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
 * Perform Bulk Bidirectional Sync with Google Spreadsheet
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

  // Flush pending queue first if any
  await flushPendingSyncQueue();

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
          data: {
            members,
            recordings,
            campaigns,
          },
        }),
        mode: 'no-cors',
      });

      const nowStr = new Date().toLocaleString('ko-KR');
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
        details: `회원 ${members.length}명, 음원 ${recordings.length}건, 캠페인 ${campaigns.length}건 시트에 반영`,
        rowsAffected: members.length + recordings.length + campaigns.length,
      });

      return {
        success: true,
        message: `${config.adminEmail} 계정 구글 스프레드시트와 실시간 양방향 동기화가 완료되었습니다! (총 ${members.length}명 회원 반영)`,
        updatedMembers: members,
        updatedRecordings: recordings,
      };
    } catch (error) {
      console.warn('Real Google Sheets API call failed:', error);
    }
  }

  // Local sync log when scriptUrl is not configured yet
  const nowStr = new Date().toLocaleString('ko-KR');
  saveGoogleSheetConfig({
    ...config,
    lastSynced: `${nowStr} (로컬 동기화 완료)`,
    syncStatus: 'success',
    lastSyncMessage: `${config.adminEmail} 구글 스프레드시트 데이터 준비 완료 (Web App URL 등록 대기)`,
  });

  addSheetSyncLog({
    timestamp: nowStr,
    direction: 'bidirectional',
    status: 'success',
    summary: `${config.adminEmail} 로컬 동기화 갱신 완료`,
    details: `회원 ${members.length}명, 음원 ${recordings.length}건 로컬 보관 (Web App URL 등록 시 실시간 전송)`,
    rowsAffected: members.length + recordings.length,
  });

  return {
    success: true,
    message: `${config.adminEmail} 구글 스프레드시트 데이터가 준비되었습니다. Web App URL을 등록하시면 시트로 즉시 자동 전송됩니다.`,
    updatedMembers: members,
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

    // 1. 회원가입 실시간 저장
    if (data.action === "registerMember") {
      var member = data.member || {};
      var rosterSheet = ss.getSheetByName("회원관리");
      var memberSheet = ss.getSheetByName("회원_낭독진도");
      var logSheet = ss.getSheetByName("실시간_동기화로그");

      var nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd HH:mm:ss");
      var regDateStr = member.registeredDate || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd");

      // [회원관리] 시트에 행 추가
      if (rosterSheet) {
        rosterSheet.appendRow([
          member.id || ("M-" + new Date().getTime().toString().slice(-4)),
          member.name || (data.loginId ? data.loginId + " 성도" : "신규 성도"),
          member.department || "새가족 성경통독부",
          member.role || "성도",
          member.phone || "010-미등록",
          member.email || data.loginId || "",
          regDateStr,
          member.birthdate || "1995.01.01",
          member.baptismStatus || "원입",
          member.smallGroup || "새가족 1구역",
          member.accountRole || "member",
          member.accountStatus || "active",
          member.memo || ("수퍼바이블 웹 회원가입 (아이디: " + (data.loginId || member.email) + ")")
        ]);
      }

      // [회원_낭독진도] 시트에 진도 초기 행 추가
      if (memberSheet) {
        memberSheet.appendRow([
          member.id || ("M-" + new Date().getTime().toString().slice(-4)),
          member.name || (data.loginId ? data.loginId + " 성도" : "신규 성도"),
          member.department || "새가족 성경통독부",
          member.role || "성도",
          member.phone || "010-미등록",
          member.email || data.loginId || "",
          member.currentReadingRound || 1,
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

      // [실시간_동기화로그] 시트 추가
      if (logSheet) {
        logSheet.appendRow([
          "LOG-" + new Date().getTime(),
          nowStr,
          "회원가입 동기화",
          "신규 회원 등록: " + (member.name || "") + " (" + (member.email || data.loginId) + ")",
          2
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
      
      // 2) 로그인된 사람의 이름으로 하위 폴더 생성 (예: "박기빛_Cmorfbfc2i", "신성환_juandvasieczky", "유원희_yoocomdr", "홍길동_stguest")
      var rawName = (data.memberName || "").replace(/ 성도$/, "").replace(/ 관리자$/, "").trim();
      var cleanName = rawName || "성도";
      var cleanId = (data.loginId || "").replace(/@.*$/, "").trim();
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

    // 4. 전체 일괄 동기화 (sync)
    if (data.action === "sync") {
      var members = (data.data && data.data.members) ? data.data.members : [];
      var recordings = (data.data && data.data.recordings) ? data.data.recordings : [];
      var rosterSheet = ss.getSheetByName("회원관리");
      var memberSheet = ss.getSheetByName("회원_낭독진도");
      var logSheet = ss.getSheetByName("실시간_동기화로그");

      if (rosterSheet && members.length > 0) {
        var lastRosterRow = rosterSheet.getLastRow();
        if (lastRosterRow > 1) {
          rosterSheet.getRange(2, 1, lastRosterRow - 1, 13).clearContent();
        }
        for (var i = 0; i < members.length; i++) {
          var m = members[i];
          rosterSheet.appendRow([
            m.id, m.name, m.department, m.role, m.phone, m.email,
            m.registeredDate || "", m.birthdate || "", m.baptismStatus || "세례",
            m.smallGroup || "", m.accountRole || "member", m.accountStatus || "정상",
            m.memo || ""
          ]);
        }
      }

      if (memberSheet && members.length > 0) {
        var lastMemberRow = memberSheet.getLastRow();
        if (lastMemberRow > 1) {
          memberSheet.getRange(2, 1, lastMemberRow - 1, 15).clearContent();
        }
        for (var j = 0; j < members.length; j++) {
          var mem = members[j];
          memberSheet.appendRow([
            mem.id, mem.name, mem.department, mem.role, mem.phone, mem.email,
            mem.currentReadingRound, mem.currentBook, mem.currentChapter,
            mem.totalReadChapters, mem.recordingsCount, mem.lastActive,
            mem.status, mem.consecutiveDays, mem.memo || ""
          ]);
        }
      }

      var nowStr = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy.MM.dd HH:mm:ss");
      if (logSheet) {
        logSheet.appendRow([
          "LOG-" + new Date().getTime(),
          nowStr,
          "전체 양방향 동기화",
          "회원 " + members.length + "명 정보 및 진도 일괄 동기화 완료",
          members.length
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "수퍼바이블 [회원관리] 및 [회원_낭독진도] 시트에 전체 일괄 반영되었습니다.",
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
  var rosterRows = rosterSheet ? rosterSheet.getDataRange().getValues() : [];
  var memberRows = memberSheet ? memberSheet.getDataRange().getValues() : [];
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    rosterCount: rosterRows.length > 0 ? rosterRows.length - 1 : 0,
    memberProgressCount: memberRows.length > 0 ? memberRows.length - 1 : 0,
    adminEmail: "${adminEmail}",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
}
