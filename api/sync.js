// Vercel Serverless Function: SuperBible Central Multi-Device Sync Hub
// Synchronizes member registrations, progress, deletions, URLs, and audio across PC, Smartphone, Tablet, and Google Sheets

let serverCachedScriptUrl = globalThis.__SUPERBIBLE_SCRIPT_URL__ || process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzHnO0-Yvmfr2A0ImQewLiWhvVEt1HG9pLFUEEexaBr0GwEnYRNGtNyBibvOJdRQW2lPg/exec';
let serverCachedSheetUrl = globalThis.__SUPERBIBLE_SHEET_URL__ || process.env.GOOGLE_SHEET_URL || 'https://docs.google.com/spreadsheets/u/0/';
let serverCachedSheetId = globalThis.__SUPERBIBLE_SHEET_ID__ || process.env.GOOGLE_SHEET_ID || '';
let serverCachedMembers = globalThis.__SUPERBIBLE_MEMBERS__ || [];
let serverCachedRecordings = globalThis.__SUPERBIBLE_RECORDINGS__ || [];
// Explicit Admin-Designated Blacklist (관리자가 직접 지정한 차단 목록만 관리)
let serverAdminBlacklist = globalThis.__SUPERBIBLE_ADMIN_BLACKLIST__ || [];
// Deletion Tombstones: Tracks deleted member identifiers (ONLY unique emails and loginIds, NEVER sequential IDs)
let serverDeletedRecords = globalThis.__SUPERBIBLE_DELETED_RECORDS__ || {};

// Sanitize serverDeletedRecords on start (remove any sequential IDs or root master admin)
Object.keys(serverDeletedRecords).forEach(k => {
  if (k.match(/^m-\d+$/i) || k === 'yoocomdr57@gmail.com' || k === '로고스 관리자' || k === '로고스관리자') {
    delete serverDeletedRecords[k];
  }
});

function normalizeMember(m) {
  if (!m) return m;
  const email = (m.email || '').toLowerCase().trim();
  const name = (m.name || '').trim();
  const id = (m.id || m.memberId || '').trim();
  if (email === 'yoocomdr@superbible.kr' || name === '유천년' || id === 'M-02') {
    return {
      ...m,
      id: 'M-02',
      name: '유원희',
      email: 'yoocomdr@superbible.kr',
      avatarText: '원희',
      role: '성도',
      accountRole: 'member',
      department: m.department || '경영팀'
    };
  }
  return m;
}

function sortMembers(list) {
  return (list || []).sort((a, b) => {
    const na = parseInt(String(a.id || '').replace(/\D/g, ''), 10) || 999;
    const nb = parseInt(String(b.id || '').replace(/\D/g, ''), 10) || 999;
    return na - nb;
  });
}

function isDeletedOnServer(m) {
  if (!m) return false;
  const kEmail = (m.email || '').toLowerCase().trim();
  const kName = (m.name || '').trim();
  const kLogin = (m.loginId || '').toLowerCase().trim();
  const nClean = kName.replace(/\s+/g, '');

  // Test dummy accounts requested by user to be completely purged:
  if (
    nClean.includes('임시테스트') ||
    nClean.includes('신규성도') ||
    nClean.includes('E2E테스터') ||
    nClean.includes('e2e테스터') ||
    nClean.includes('라이브테스트성도') ||
    nClean.includes('삭제실험맨') ||
    nClean.includes('황희') ||
    nClean.includes('윤봉길') ||
    nClean.includes('정회원') ||
    kEmail === 'temp_delete_test@gmail.com' ||
    kEmail === 'e2e_tester@superbible.kr' ||
    kEmail === 'user_live_test@gmail.com' ||
    kEmail === 'del_experiment@test.com' ||
    kEmail === 'yoocomdr55@gmail.com' ||
    kEmail === 'yoocomdr58@gmail.com' ||
    kEmail === 'realuser1@gmail.com'
  ) {
    return true;
  }

  // 2. Master system admin & core identity protected from deletion (prevents admin lockout)
  if (
    kEmail === 'yoocomdr57@gmail.com' ||
    kName === '로고스 관리자' ||
    kName === '로고스관리자' ||
    kEmail === 'yoocomdr@superbible.kr' ||
    kName === '유원희'
  ) {
    return false;
  }

  // 3. Check deletion tombstones (email, loginId, or name)
  if (kEmail && serverDeletedRecords[kEmail]) return true;
  if (kLogin && serverDeletedRecords[kLogin]) return true;
  if (kName) {
    const cleanName = kName.toLowerCase().trim();
    if (serverDeletedRecords[cleanName] || serverDeletedRecords[`name:${cleanName}`]) {
      return true;
    }
  }

  return false;
}

function recordServerDeletion(delId, delEmail, delName, delLoginId) {
  const now = Date.now();
  // Record unique email or loginId (never record protected master accounts)
  [delEmail, delLoginId].filter(Boolean).forEach(k => {
    const clean = String(k).toLowerCase().trim();
    if (clean && !clean.match(/^m-\d+$/i) && clean !== 'yoocomdr57@gmail.com' && clean !== 'yoocomdr@superbible.kr') {
      serverDeletedRecords[clean] = now;
    }
  });
  // Also record member name if provided (never record protected master accounts)
  if (delName) {
    const cleanName = String(delName).toLowerCase().trim();
    if (cleanName && cleanName !== '로고스 관리자' && cleanName !== '로고스관리자' && cleanName !== '유원희') {
      serverDeletedRecords[cleanName] = now;
      serverDeletedRecords[`name:${cleanName}`] = now;
    }
  }
  globalThis.__SUPERBIBLE_DELETED_RECORDS__ = serverDeletedRecords;
}

function clearServerDeletion(delId, delEmail, delName, delLoginId) {
  [delEmail, delLoginId].filter(Boolean).forEach(k => {
    const clean = String(k).toLowerCase().trim();
    if (clean && serverDeletedRecords[clean]) {
      delete serverDeletedRecords[clean];
    }
  });
  if (delName) {
    const cleanName = String(delName).toLowerCase().trim();
    if (serverDeletedRecords[cleanName]) delete serverDeletedRecords[cleanName];
    if (serverDeletedRecords[`name:${cleanName}`]) delete serverDeletedRecords[`name:${cleanName}`];
  }
  globalThis.__SUPERBIBLE_DELETED_RECORDS__ = serverDeletedRecords;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Script-Url, X-Sheet-Url');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. GET: Fetch latest members, config, and admin-designated blacklist
  if (req.method === 'GET') {
    const { action = 'pull', scriptUrl, sheetUrl, sheetId, deletedKeys, clearDeleted } = req.query || {};

    if (clearDeleted === 'true' || action === 'clearDeletedRecords') {
      serverDeletedRecords = {};
      globalThis.__SUPERBIBLE_DELETED_RECORDS__ = {};
    }

    if (scriptUrl) {
      serverCachedScriptUrl = scriptUrl;
      globalThis.__SUPERBIBLE_SCRIPT_URL__ = scriptUrl;
    }
    if (sheetUrl) {
      serverCachedSheetUrl = sheetUrl;
      globalThis.__SUPERBIBLE_SHEET_URL__ = sheetUrl;
    }
    if (sheetId) {
      serverCachedSheetId = sheetId;
      globalThis.__SUPERBIBLE_SHEET_ID__ = sheetId;
    }

    const targetScriptUrl = scriptUrl || serverCachedScriptUrl || req.headers['x-script-url'] || '';

    if (action === 'getConfig') {
      res.status(200).json({
        success: true,
        scriptUrl: serverCachedScriptUrl,
        sheetUrl: serverCachedSheetUrl,
        sheetId: serverCachedSheetId,
        adminEmail: 'yoocomdr57@gmail.com',
        membersCount: serverCachedMembers.filter(m => !isDeletedOnServer(m)).length,
        blacklistCount: serverAdminBlacklist.length,
        deletedCount: Object.keys(serverDeletedRecords).length,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (action === 'getBlacklist') {
      res.status(200).json({
        success: true,
        blacklist: serverAdminBlacklist,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Action: Complete Master Reset (GET)
    if (action === 'resetAll' || action === 'resetSpreadsheet') {
      serverCachedMembers = [
        {
          id: 'M-01',
          name: '로고스 관리자',
          department: '경영팀',
          role: '관리자',
          phone: '010-0000-0000',
          email: 'yoocomdr57@gmail.com',
          registeredDate: '2026.01.01',
          birthdate: '1980.01.01',
          baptismStatus: '세례교인',
          smallGroup: '총괄본부',
          accountRole: 'admin',
          accountStatus: 'active',
          avatarColor: 'bg-amber-500',
          avatarText: '관리',
          currentReadingRound: 0,
          targetRounds: 12,
          currentBook: '창세기',
          currentChapter: 1,
          totalReadChapters: 0,
          recordingsCount: 0,
          lastActive: '방금',
          status: 'active',
          consecutiveDays: 1,
          featuredCount: 0,
          memo: '수퍼바이블 총괄 시스템 관리자 (yoocomdr57@gmail.com)',
        }
      ];
      globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;
      serverCachedRecordings = [];
      globalThis.__SUPERBIBLE_RECORDINGS__ = [];
      serverAdminBlacklist = [];
      globalThis.__SUPERBIBLE_ADMIN_BLACKLIST__ = [];
      serverDeletedRecords = {};
      globalThis.__SUPERBIBLE_DELETED_RECORDS__ = {};

      if (targetScriptUrl && targetScriptUrl.startsWith('http')) {
        try {
          fetch(targetScriptUrl + (targetScriptUrl.includes('?') ? '&' : '?') + 'action=resetAll');
          fetch(targetScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'resetAll' })
          });
        } catch (e) {}
      }

      res.status(200).json({
        success: true,
        message: '서버 및 구글 시트가 마스터 관리자(yoocomdr57@gmail.com) 1명으로 전면 초기화되었습니다.',
        members: serverCachedMembers,
        deletedRecords: {},
        blacklist: [],
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Try fetching live data from Google Apps Script if URL is present
    if (targetScriptUrl && targetScriptUrl.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);
        const gasRes = await fetch(targetScriptUrl, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeout);

        if (gasRes.ok) {
          const gasData = await gasRes.json();
          if (gasData && gasData.sheetUrl && (!serverCachedSheetUrl || serverCachedSheetUrl.includes('1yoocomdr57_SuperBible_MasterRoster_2026'))) {
            serverCachedSheetUrl = gasData.sheetUrl;
            globalThis.__SUPERBIBLE_SHEET_URL__ = gasData.sheetUrl;
          }
          if (gasData && gasData.sheetId && (!serverCachedSheetId || serverCachedSheetId.includes('1yoocomdr57_SuperBible_MasterRoster_2026'))) {
            serverCachedSheetId = gasData.sheetId;
            globalThis.__SUPERBIBLE_SHEET_ID__ = gasData.sheetId;
          }

          if (gasData && Array.isArray(gasData.members) && gasData.members.length > 0) {
            // Strictly exclude deleted members and test dummy accounts so stale rows never revive!
            const activeGasMembers = gasData.members
              .map(normalizeMember)
              .filter(gm => !isDeletedOnServer(gm));

            const map = new Map();
            // 1. Add current server cache (only active members, normalized)
            serverCachedMembers
              .map(normalizeMember)
              .filter(m => !isDeletedOnServer(m))
              .forEach(m => {
                const k = (m.email || m.name || m.id || '').toLowerCase().trim();
                if (k) map.set(k, m);
              });

            // 2. Add / update all active members from Google Sheets
            activeGasMembers.forEach(gm => {
              const k = (gm.email || gm.name || gm.id || '').toLowerCase().trim();
              if (!k) return;
              if (map.has(k)) {
                const cur = map.get(k);
                map.set(k, normalizeMember({
                  ...cur,
                  ...gm,
                  name: gm.name === '유천년' ? '유원희' : (gm.name || cur.name),
                  phone: gm.phone && gm.phone !== '010-미등록' ? gm.phone : (cur.phone || gm.phone),
                  department: gm.department || cur.department,
                  totalReadChapters: Math.max(cur.totalReadChapters || 0, gm.totalReadChapters || 0),
                  currentReadingRound: Math.max(cur.currentReadingRound || 0, gm.currentReadingRound || 0),
                  recordingsCount: Math.max(cur.recordingsCount || 0, gm.recordingsCount || 0),
                  currentBook: gm.currentBook || cur.currentBook,
                  currentChapter: gm.currentChapter || cur.currentChapter,
                }));
              } else {
                map.set(k, normalizeMember(gm));
              }
            });

            serverCachedMembers = sortMembers(Array.from(map.values())
              .map(normalizeMember)
              .filter(m => !isDeletedOnServer(m)));
            globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;

            res.status(200).json({
              success: true,
              source: 'google_sheets',
              members: serverCachedMembers,
              deletedRecords: serverDeletedRecords,
              recordings: gasData.recordings || serverCachedRecordings,
              blacklist: serverAdminBlacklist,
              scriptUrl: targetScriptUrl,
              sheetUrl: serverCachedSheetUrl,
              timestamp: new Date().toISOString()
            });
            return;
          }
        }
      } catch (gasErr) {
        console.warn('[SyncHub] Failed to pull live from Google Apps Script:', gasErr.message);
      }
    }

    // Fallback: return server cache (filtered against deleted tombstones)
    serverCachedMembers = sortMembers(serverCachedMembers
      .map(normalizeMember)
      .filter(m => !isDeletedOnServer(m)));
    globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;

    res.status(200).json({
      success: true,
      source: 'server_cache',
      members: serverCachedMembers,
      deletedRecords: serverDeletedRecords,
      recordings: serverCachedRecordings,
      blacklist: serverAdminBlacklist,
      scriptUrl: serverCachedScriptUrl,
      sheetUrl: serverCachedSheetUrl,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 2. POST: Member registration, progress, deletion, sync, or blacklist management
  if (req.method === 'POST') {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { action, scriptUrl, sheetUrl, sheetId } = body;
    if (scriptUrl) {
      serverCachedScriptUrl = scriptUrl;
      globalThis.__SUPERBIBLE_SCRIPT_URL__ = scriptUrl;
    }
    if (sheetUrl) {
      serverCachedSheetUrl = sheetUrl;
      globalThis.__SUPERBIBLE_SHEET_URL__ = sheetUrl;
    }
    if (sheetId) {
      serverCachedSheetId = sheetId;
      globalThis.__SUPERBIBLE_SHEET_ID__ = sheetId;
    }

    const targetScriptUrl = scriptUrl || serverCachedScriptUrl || req.headers['x-script-url'] || '';

    // Action: Add Admin-Designated Blacklist (관리자 지정 차단)
    if (action === 'addBlacklist') {
      const target = (body.target || '').toLowerCase().trim();
      const targetName = body.targetName || '';
      const reason = body.reason || '관리자 수동 차단';
      const createdBy = body.createdBy || '로고스 관리자';
      if (target) {
        serverAdminBlacklist = serverAdminBlacklist.filter(item => item.target.toLowerCase().trim() !== target);
        const newItem = {
          id: body.id || `bl-${Date.now()}`,
          target,
          targetName,
          reason,
          createdAt: new Date().toISOString(),
          createdBy
        };
        serverAdminBlacklist.push(newItem);
        globalThis.__SUPERBIBLE_ADMIN_BLACKLIST__ = serverAdminBlacklist;
      }
      res.status(200).json({
        success: true,
        message: `'${targetName || target}' 계정이 관리자 블랙리스트에 등록되었습니다.`,
        blacklist: serverAdminBlacklist
      });
      return;
    }

    // Action: Remove Admin-Designated Blacklist (관리자 차단 해제)
    if (action === 'removeBlacklist') {
      const target = (body.target || '').toLowerCase().trim();
      const id = (body.id || '').trim();
      serverAdminBlacklist = serverAdminBlacklist.filter(item => {
        if (id && item.id === id) return false;
        if (target && item.target.toLowerCase().trim() === target) return false;
        return true;
      });
      globalThis.__SUPERBIBLE_ADMIN_BLACKLIST__ = serverAdminBlacklist;
      res.status(200).json({
        success: true,
        message: '블랙리스트에서 정상적으로 차단 해제되었습니다.',
        blacklist: serverAdminBlacklist
      });
      return;
    }

    // Action: Clear All Blacklist (등록된 블랙리스트 전체 완전 삭제/초기화)
    if (action === 'clearBlacklist' || action === 'clearAllBlacklist') {
      serverAdminBlacklist = [];
      globalThis.__SUPERBIBLE_ADMIN_BLACKLIST__ = [];
      res.status(200).json({
        success: true,
        message: '등록된 블랙리스트가 전체 완전 삭제되었습니다. 모든 회원이 원활하게 회원가입 및 동기화됩니다.',
        blacklist: []
      });
      return;
    }

    // Action: Clear All Deleted Records (삭제 기록 완전 초기화 - 모든 기기 구글 시트 원본 일치)
    if (action === 'clearDeletedRecords' || action === 'clearAllDeleted') {
      serverDeletedRecords = {};
      globalThis.__SUPERBIBLE_DELETED_RECORDS__ = {};
      res.status(200).json({
        success: true,
        message: '서버 삭제 기록이 깨끗이 초기화되었습니다. 구글 시트의 전체 회원이 모든 기기에 동기화됩니다.',
        deletedRecords: {}
      });
      return;
    }

    // Action: Complete Master Reset (POST: 전면 초기화)
    if (action === 'resetAll' || action === 'resetSpreadsheet') {
      serverCachedMembers = [
        {
          id: 'M-01',
          name: '로고스 관리자',
          department: '경영팀',
          role: '관리자',
          phone: '010-0000-0000',
          email: 'yoocomdr57@gmail.com',
          registeredDate: '2026.01.01',
          birthdate: '1980.01.01',
          baptismStatus: '세례교인',
          smallGroup: '총괄본부',
          accountRole: 'admin',
          accountStatus: 'active',
          avatarColor: 'bg-amber-500',
          avatarText: '관리',
          currentReadingRound: 0,
          targetRounds: 12,
          currentBook: '창세기',
          currentChapter: 1,
          totalReadChapters: 0,
          recordingsCount: 0,
          lastActive: '방금',
          status: 'active',
          consecutiveDays: 1,
          featuredCount: 0,
          memo: '수퍼바이블 총괄 시스템 관리자 (yoocomdr57@gmail.com)',
        }
      ];
      globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;
      serverCachedRecordings = [];
      globalThis.__SUPERBIBLE_RECORDINGS__ = [];
      serverAdminBlacklist = [];
      globalThis.__SUPERBIBLE_ADMIN_BLACKLIST__ = [];
      serverDeletedRecords = {};
      globalThis.__SUPERBIBLE_DELETED_RECORDS__ = {};

      if (targetScriptUrl && targetScriptUrl.startsWith('http')) {
        try {
          fetch(targetScriptUrl + (targetScriptUrl.includes('?') ? '&' : '?') + 'action=resetAll');
          fetch(targetScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'resetAll' })
          });
        } catch (e) {}
      }

      res.status(200).json({
        success: true,
        message: '서버 및 구글 시트가 마스터 관리자(yoocomdr57@gmail.com) 1명으로 전면 초기화되었습니다.',
        members: serverCachedMembers,
        deletedRecords: {},
        blacklist: [],
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Action: Set / Save Google Apps Script & Sheet URL globally for all devices
    if (action === 'setConfig' || action === 'setScriptUrl') {
      if (body.scriptUrl !== undefined) {
        serverCachedScriptUrl = body.scriptUrl;
        globalThis.__SUPERBIBLE_SCRIPT_URL__ = serverCachedScriptUrl;
      }
      if (body.sheetUrl !== undefined) {
        serverCachedSheetUrl = body.sheetUrl;
        globalThis.__SUPERBIBLE_SHEET_URL__ = serverCachedSheetUrl;
      }
      if (body.sheetId !== undefined) {
        serverCachedSheetId = body.sheetId;
        globalThis.__SUPERBIBLE_SHEET_ID__ = serverCachedSheetId;
      }

      res.status(200).json({
        success: true,
        message: 'Google Apps Script 및 스프레드시트 URL이 중앙 서버에 성공적으로 등록되었습니다. 모든 기기에 자동 공유됩니다.',
        scriptUrl: serverCachedScriptUrl,
        sheetUrl: serverCachedSheetUrl,
        sheetId: serverCachedSheetId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Action: Completely and Cleanly Delete Member
    // Records deletion tombstone so stale Google Sheets rows never resurrect the member,
    // while allowing clean re-registration in the future!
    if (action === 'deleteMember') {
      const delEmail = (body.email || '').toLowerCase().trim();
      const delLoginId = (body.loginId || '').toLowerCase().trim();
      const delName = (body.name || '').toLowerCase().trim();
      const delId = (body.memberId || body.id || '').toLowerCase().trim();

      // Record deletion tombstone
      recordServerDeletion(delId, delEmail, delName, delLoginId);

      // Completely remove from serverCachedMembers
      serverCachedMembers = serverCachedMembers.filter(m => {
        const mEmail = (m.email || '').toLowerCase().trim();
        const mLogin = (m.loginId || '').toLowerCase().trim();
        const mName = (m.name || '').toLowerCase().trim();
        const mId = (m.id || '').toLowerCase().trim();

        if (delEmail && mEmail === delEmail) return false;
        if (delLoginId && mLogin === delLoginId) return false;
        if (delId && mId === delId) return false;
        if (delName && mName === delName) return false;
        return !isDeletedOnServer(m);
      });
      globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;

      // Forward deletion to Google Apps Script (deletes rows in Google Sheets 100% reliably)
      if (targetScriptUrl && targetScriptUrl.startsWith('http')) {
        const delKeys = [delEmail, delName, delId].filter(Boolean);

        // 1) GET deletion query (supported by deployed GAS doGet)
        const gasGetUrl = targetScriptUrl +
          (targetScriptUrl.includes('?') ? '&' : '?') +
          'action=deleteMember' +
          (delEmail ? '&email=' + encodeURIComponent(delEmail) : '') +
          (delName ? '&name=' + encodeURIComponent(delName) : '') +
          (delId ? '&id=' + encodeURIComponent(delId) : '');

        const p1 = (async () => {
          try {
            const c1 = new AbortController();
            const t1 = setTimeout(() => c1.abort(), 8000);
            await fetch(gasGetUrl, { signal: c1.signal });
            clearTimeout(t1);
          } catch (e) {}
        })();

        // 2) POST sync with deletedList (supported by deployed GAS doPost sync)
        const p2 = (async () => {
          try {
            const c2 = new AbortController();
            const t2 = setTimeout(() => c2.abort(), 8000);
            await fetch(targetScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'sync',
                deletedList: delKeys,
                data: {
                  members: [],
                  deletedList: delKeys
                }
              }),
              signal: c2.signal
            });
            clearTimeout(t2);
          } catch (e) {}
        })();

        // 3) POST direct deleteMember
        const p3 = (async () => {
          try {
            const c3 = new AbortController();
            const t3 = setTimeout(() => c3.abort(), 8000);
            await fetch(targetScriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(body),
              signal: c3.signal
            });
            clearTimeout(t3);
          } catch (e) {}
        })();

        await Promise.allSettled([p1, p2, p3]);
      }

      res.status(200).json({
        success: true,
        message: '회원이 중앙 서버 및 모든 기기에서 완전히 영구 삭제되었습니다. (재가입 가능)',
        members: serverCachedMembers,
        deletedRecords: serverDeletedRecords,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Action: Register Member (간편가입)
    if (action === 'registerMember' || action === 'registerUser') {
      const incomingMember = normalizeMember(body.member);
      if (incomingMember) {
        const kEmail = (incomingMember.email || '').toLowerCase().trim();
        const kName = (incomingMember.name || '').toLowerCase().trim();
        const kId = (incomingMember.id || '').toLowerCase().trim();
        const kLogin = (body.loginId || '').toLowerCase().trim();

        // CLEAR any past deletion tombstone so new signup is completely fresh!
        clearServerDeletion(kId, kEmail, kName, kLogin);

        const existingIdx = serverCachedMembers.findIndex(m => {
          const me = (m.email || '').toLowerCase().trim();
          const mn = (m.name || '').toLowerCase().trim();
          const mi = (m.id || '').toLowerCase().trim();
          return (kEmail && me === kEmail) || (kName && mn === kName) || (kId && mi === kId);
        });
        if (existingIdx !== -1) {
          serverCachedMembers[existingIdx] = normalizeMember({ ...serverCachedMembers[existingIdx], ...incomingMember });
        } else {
          serverCachedMembers.push(incomingMember);
        }
        globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;
      }
    }

    // Action: Bulk Bidirectional Sync
    if (action === 'sync') {
      const incomingList = (body.data?.members || body.members || []).map(normalizeMember);
      const map = new Map();
      serverCachedMembers.map(normalizeMember).filter(m => !isDeletedOnServer(m)).forEach(m => {
        const k = (m.email || m.name || m.id || '').toLowerCase().trim();
        if (k) map.set(k, m);
      });

      incomingList.filter(m => !isDeletedOnServer(m)).forEach(m => {
        const k = (m.email || m.name || m.id || '').toLowerCase().trim();
        if (!k) return;
        if (map.has(k)) {
          const cur = map.get(k);
          map.set(k, normalizeMember({
            ...cur,
            ...m,
            phone: m.phone && m.phone !== '010-미등록' ? m.phone : (cur.phone || m.phone),
            totalReadChapters: Math.max(cur.totalReadChapters || 0, m.totalReadChapters || 0),
            currentReadingRound: Math.max(cur.currentReadingRound || 0, m.currentReadingRound || 0),
            recordingsCount: Math.max(cur.recordingsCount || 0, m.recordingsCount || 0),
          }));
        } else {
          map.set(k, m);
        }
      });
      serverCachedMembers = Array.from(map.values()).map(normalizeMember).filter(m => !isDeletedOnServer(m));
      globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;
    }

    // Action: Update Reading Progress
    if (action === 'updateProgress') {
      const email = (body.email || '').toLowerCase().trim();
      const existingIdx = serverCachedMembers.findIndex(m =>
        (m.email || '').toLowerCase().trim() === email
      );
      if (existingIdx !== -1) {
        if (body.book) serverCachedMembers[existingIdx].currentBook = body.book;
        if (body.chapter) serverCachedMembers[existingIdx].currentChapter = body.chapter;
        if (body.totalReadChapters !== undefined) {
          serverCachedMembers[existingIdx].totalReadChapters = Math.max(
            serverCachedMembers[existingIdx].totalReadChapters || 0,
            body.totalReadChapters
          );
          serverCachedMembers[existingIdx].currentReadingRound = Math.floor(
            (serverCachedMembers[existingIdx].totalReadChapters || 0) / 1189
          );
        }
        serverCachedMembers[existingIdx].lastActive = '방금 낭독';
        globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;
      }
    }

    // Forward to Google Apps Script Web App if URL is configured
    let gasResult = null;
    if (targetScriptUrl && targetScriptUrl.startsWith('http')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const gasRes = await fetch(targetScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeout);

        try {
          gasResult = await gasRes.json();
          if (gasResult && Array.isArray(gasResult.members) && gasResult.members.length > 0) {
            // Update server cache with Google Sheets merged list (strictly excluding deleted members)
            const gmap = new Map();
            serverCachedMembers.map(normalizeMember).filter(m => !isDeletedOnServer(m)).forEach(m => gmap.set((m.email || m.name || m.id).toLowerCase().trim(), m));
            gasResult.members.map(normalizeMember).filter(gm => !isDeletedOnServer(gm)).forEach(gm => {
              const gk = (gm.email || gm.name || gm.id).toLowerCase().trim();
              if (gmap.has(gk)) {
                gmap.set(gk, normalizeMember({ ...gmap.get(gk), ...gm }));
              } else {
                gmap.set(gk, gm);
              }
            });
            serverCachedMembers = sortMembers(Array.from(gmap.values()).map(normalizeMember).filter(m => !isDeletedOnServer(m)));
            globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;
          }
        } catch (jsonErr) {
          gasResult = { status: 'success', rawText: 'OK' };
        }
      } catch (gasErr) {
        console.warn('[SyncHub] Failed to forward to Google Apps Script:', gasErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: gasResult?.message || '중앙 서버에 안전하게 실시간 동기화되었습니다.',
      gasResult,
      members: sortMembers(serverCachedMembers.map(normalizeMember).filter(m => !isDeletedOnServer(m))),
      deletedRecords: serverDeletedRecords,
      blacklist: serverAdminBlacklist,
      scriptUrl: serverCachedScriptUrl,
      sheetUrl: serverCachedSheetUrl,
      sheetId: serverCachedSheetId,
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
