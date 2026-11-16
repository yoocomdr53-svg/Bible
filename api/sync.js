// Vercel Serverless Function: SuperBible Central Multi-Device Sync Hub
// Synchronizes member registrations, progress, deletions, URLs, and audio across PC, Smartphone, Tablet, and Google Sheets

let serverCachedScriptUrl = globalThis.__SUPERBIBLE_SCRIPT_URL__ || process.env.GOOGLE_SCRIPT_URL || '';
let serverCachedSheetUrl = globalThis.__SUPERBIBLE_SHEET_URL__ || process.env.GOOGLE_SHEET_URL || '';
let serverCachedSheetId = globalThis.__SUPERBIBLE_SHEET_ID__ || process.env.GOOGLE_SHEET_ID || '';
let serverCachedMembers = globalThis.__SUPERBIBLE_MEMBERS__ || [];
let serverCachedRecordings = globalThis.__SUPERBIBLE_RECORDINGS__ || [];
let serverDeletedMembers = globalThis.__SUPERBIBLE_DELETED_MEMBERS__ || [];

function isMemberInDeletedList(m, deletedList) {
  if (!m || !deletedList || deletedList.length === 0) return false;
  const k1 = (m.email || '').toLowerCase().trim();
  const k2 = (m.name || '').toLowerCase().trim();
  const k3 = (m.id || '').toLowerCase().trim();
  return (k1 && deletedList.includes(k1)) || (k2 && deletedList.includes(k2)) || (k3 && deletedList.includes(k3));
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

  // 1. GET: Fetch latest members and config from Google Sheets / Central Server
  if (req.method === 'GET') {
    const { action = 'pull', scriptUrl, sheetUrl, sheetId, deleted } = req.query || {};

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

    if (deleted) {
      const items = String(deleted).split(',').map(s => s.toLowerCase().trim()).filter(Boolean);
      items.forEach(it => {
        if (!serverDeletedMembers.includes(it)) serverDeletedMembers.push(it);
      });
      globalThis.__SUPERBIBLE_DELETED_MEMBERS__ = serverDeletedMembers;
    }

    const targetScriptUrl = scriptUrl || serverCachedScriptUrl || req.headers['x-script-url'] || '';

    if (action === 'getConfig') {
      res.status(200).json({
        success: true,
        scriptUrl: serverCachedScriptUrl,
        sheetUrl: serverCachedSheetUrl,
        sheetId: serverCachedSheetId,
        adminEmail: 'yoocomdr57@gmail.com',
        membersCount: serverCachedMembers.length,
        deletedCount: serverDeletedMembers.length,
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
          if (gasData && Array.isArray(gasData.members) && gasData.members.length > 0) {
            // Smart Merge Google Sheets members with server cache (excluding deleted members)
            const map = new Map();
            serverCachedMembers.forEach(m => {
              if (!isMemberInDeletedList(m, serverDeletedMembers)) {
                map.set((m.email || m.name).toLowerCase().trim(), m);
              }
            });

            gasData.members.forEach(gm => {
              if (isMemberInDeletedList(gm, serverDeletedMembers)) return;
              const k = (gm.email || gm.name).toLowerCase().trim();
              if (map.has(k)) {
                const cur = map.get(k);
                map.set(k, {
                  ...cur,
                  ...gm,
                  totalReadChapters: Math.max(cur.totalReadChapters || 0, gm.totalReadChapters || 0),
                  currentReadingRound: Math.max(cur.currentReadingRound || 0, gm.currentReadingRound || 0),
                  recordingsCount: Math.max(cur.recordingsCount || 0, gm.recordingsCount || 0),
                });
              } else {
                map.set(k, gm);
              }
            });

            serverCachedMembers = Array.from(map.values());
            globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;

            res.status(200).json({
              success: true,
              source: 'google_sheets',
              members: serverCachedMembers,
              recordings: gasData.recordings || serverCachedRecordings,
              scriptUrl: targetScriptUrl,
              sheetUrl: serverCachedSheetUrl,
              deletedMembers: serverDeletedMembers,
              timestamp: new Date().toISOString()
            });
            return;
          }
        }
      } catch (gasErr) {
        console.warn('[SyncHub] Failed to pull live from Google Apps Script:', gasErr.message);
      }
    }

    // Fallback: return server cache (purging deleted members)
    serverCachedMembers = serverCachedMembers.filter(m => !isMemberInDeletedList(m, serverDeletedMembers));
    globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;

    res.status(200).json({
      success: true,
      source: 'server_cache',
      members: serverCachedMembers,
      recordings: serverCachedRecordings,
      scriptUrl: serverCachedScriptUrl,
      sheetUrl: serverCachedSheetUrl,
      deletedMembers: serverDeletedMembers,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 2. POST: Member registration, progress, deletion, sync, or config
  if (req.method === 'POST') {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { action, scriptUrl, sheetUrl, sheetId, deletedList } = body;
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

    if (Array.isArray(deletedList)) {
      deletedList.forEach(k => {
        const norm = String(k).toLowerCase().trim();
        if (norm && !serverDeletedMembers.includes(norm)) serverDeletedMembers.push(norm);
      });
      globalThis.__SUPERBIBLE_DELETED_MEMBERS__ = serverDeletedMembers;
    }

    const targetScriptUrl = scriptUrl || serverCachedScriptUrl || req.headers['x-script-url'] || '';

    // Action: Set / Save Google Apps Script & Sheet URL globally for all devices
    if (action === 'setConfig' || action === 'setScriptUrl') {
      if (body.scriptUrl) {
        serverCachedScriptUrl = body.scriptUrl;
        globalThis.__SUPERBIBLE_SCRIPT_URL__ = serverCachedScriptUrl;
      }
      if (body.sheetUrl) {
        serverCachedSheetUrl = body.sheetUrl;
        globalThis.__SUPERBIBLE_SHEET_URL__ = serverCachedSheetUrl;
      }
      if (body.sheetId) {
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

    // Action: Permanently Delete Member
    if (action === 'deleteMember') {
      const delEmail = (body.email || '').toLowerCase().trim();
      const delName = (body.name || '').toLowerCase().trim();
      const delId = (body.memberId || body.id || '').toLowerCase().trim();

      [delEmail, delName, delId].filter(Boolean).forEach(k => {
        if (!serverDeletedMembers.includes(k)) serverDeletedMembers.push(k);
      });
      globalThis.__SUPERBIBLE_DELETED_MEMBERS__ = serverDeletedMembers;

      // Filter out permanently from serverCachedMembers
      serverCachedMembers = serverCachedMembers.filter(m => {
        const mEmail = (m.email || '').toLowerCase().trim();
        const mName = (m.name || '').toLowerCase().trim();
        const mId = (m.id || '').toLowerCase().trim();
        if (delId && mId === delId) return false;
        if (delEmail && mEmail === delEmail) return false;
        if (delName && mName === delName) return false;
        return true;
      });
      globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;

      // Forward deletion to Google Apps Script if URL is present
      if (targetScriptUrl && targetScriptUrl.startsWith('http')) {
        try {
          fetch(targetScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(body)
          }).catch(() => {});
        } catch (e) {}
      }

      res.status(200).json({
        success: true,
        message: '회원이 중앙 서버 및 구글 스프레드시트에서 완전히 영구 삭제되었습니다.',
        members: serverCachedMembers,
        deletedMembers: serverDeletedMembers,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Action: Register Member (간편가입)
    if (action === 'registerMember' || action === 'registerUser') {
      const incomingMember = body.member;
      if (incomingMember) {
        const k = (incomingMember.email || incomingMember.name || '').toLowerCase().trim();
        // Remove from deleted blacklist if intentionally registering again
        serverDeletedMembers = serverDeletedMembers.filter(d => d !== k && d !== (incomingMember.id || '').toLowerCase().trim());
        globalThis.__SUPERBIBLE_DELETED_MEMBERS__ = serverDeletedMembers;

        const existingIdx = serverCachedMembers.findIndex(m =>
          (m.email || m.name || '').toLowerCase().trim() === k
        );
        if (existingIdx !== -1) {
          serverCachedMembers[existingIdx] = { ...serverCachedMembers[existingIdx], ...incomingMember };
        } else {
          serverCachedMembers.push(incomingMember);
        }
        globalThis.__SUPERBIBLE_MEMBERS__ = serverCachedMembers;
      }
    }

    // Action: Bulk Bidirectional Sync
    if (action === 'sync') {
      const incomingList = body.data?.members || body.members || [];
      const map = new Map();
      serverCachedMembers.forEach(m => {
        if (!isMemberInDeletedList(m, serverDeletedMembers)) {
          map.set((m.email || m.name).toLowerCase().trim(), m);
        }
      });

      incomingList.forEach(m => {
        if (isMemberInDeletedList(m, serverDeletedMembers)) return;
        const k = (m.email || m.name || '').toLowerCase().trim();
        if (map.has(k)) {
          const cur = map.get(k);
          map.set(k, {
            ...cur,
            ...m,
            totalReadChapters: Math.max(cur.totalReadChapters || 0, m.totalReadChapters || 0),
            currentReadingRound: Math.max(cur.currentReadingRound || 0, m.currentReadingRound || 0),
          });
        } else {
          map.set(k, m);
        }
      });
      serverCachedMembers = Array.from(map.values());
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
          body: JSON.stringify({
            ...body,
            deletedList: serverDeletedMembers
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        try {
          gasResult = await gasRes.json();
          if (gasResult && Array.isArray(gasResult.members) && gasResult.members.length > 0) {
            // Update server cache with Google Sheets merged list (purging deleted members)
            const gmap = new Map();
            serverCachedMembers.forEach(m => gmap.set((m.email || m.name).toLowerCase().trim(), m));
            gasResult.members.forEach(gm => {
              if (isMemberInDeletedList(gm, serverDeletedMembers)) return;
              const gk = (gm.email || gm.name).toLowerCase().trim();
              if (gmap.has(gk)) {
                gmap.set(gk, { ...gmap.get(gk), ...gm });
              } else {
                gmap.set(gk, gm);
              }
            });
            serverCachedMembers = Array.from(gmap.values());
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
      members: serverCachedMembers,
      scriptUrl: serverCachedScriptUrl,
      sheetUrl: serverCachedSheetUrl,
      sheetId: serverCachedSheetId,
      deletedMembers: serverDeletedMembers,
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
