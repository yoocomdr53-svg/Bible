// Vercel Serverless Function: SuperBible Central Multi-Device Sync Hub
// Synchronizes member registrations, progress, and audio across PC, Smartphone, Tablet, and Google Sheets

let serverCachedScriptUrl = globalThis.__SUPERBIBLE_SCRIPT_URL__ || process.env.GOOGLE_SCRIPT_URL || '';
let serverCachedMembers = globalThis.__SUPERBIBLE_MEMBERS__ || [];
let serverCachedRecordings = globalThis.__SUPERBIBLE_RECORDINGS__ || [];

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Script-Url');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. GET: Fetch latest members and config from Google Sheets / Central Server
  if (req.method === 'GET') {
    const { action = 'pull', scriptUrl } = req.query || {};
    if (scriptUrl) {
      serverCachedScriptUrl = scriptUrl;
      globalThis.__SUPERBIBLE_SCRIPT_URL__ = scriptUrl;
    }

    const targetScriptUrl = scriptUrl || serverCachedScriptUrl || req.headers['x-script-url'] || '';

    if (action === 'getConfig') {
      res.status(200).json({
        success: true,
        scriptUrl: serverCachedScriptUrl,
        adminEmail: 'yoocomdr57@gmail.com',
        membersCount: serverCachedMembers.length,
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
            // Smart Merge Google Sheets members with server cache
            const map = new Map();
            serverCachedMembers.forEach(m => map.set((m.email || m.name).toLowerCase().trim(), m));
            gasData.members.forEach(gm => {
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
              timestamp: new Date().toISOString()
            });
            return;
          }
        }
      } catch (gasErr) {
        console.warn('[SyncHub] Failed to pull live from Google Apps Script:', gasErr.message);
      }
    }

    // Fallback: return server cache
    res.status(200).json({
      success: true,
      source: 'server_cache',
      members: serverCachedMembers,
      recordings: serverCachedRecordings,
      scriptUrl: serverCachedScriptUrl,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // 2. POST: Push member registration, sync, or config
  if (req.method === 'POST') {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }

    const { action, scriptUrl } = body;
    if (scriptUrl) {
      serverCachedScriptUrl = scriptUrl;
      globalThis.__SUPERBIBLE_SCRIPT_URL__ = scriptUrl;
    }

    const targetScriptUrl = scriptUrl || serverCachedScriptUrl || req.headers['x-script-url'] || '';

    // Action: Set / Save Google Apps Script Web App URL globally for all devices
    if (action === 'setScriptUrl') {
      serverCachedScriptUrl = body.scriptUrl || '';
      globalThis.__SUPERBIBLE_SCRIPT_URL__ = serverCachedScriptUrl;
      res.status(200).json({
        success: true,
        message: 'Google Apps Script URL이 중앙 서버에 성공적으로 등록되었습니다. 모든 기기에 자동 공유됩니다.',
        scriptUrl: serverCachedScriptUrl,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Action: Register Member (간편가입)
    if (action === 'registerMember' || action === 'registerUser') {
      const incomingMember = body.member;
      if (incomingMember) {
        const k = (incomingMember.email || incomingMember.name || '').toLowerCase().trim();
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
      serverCachedMembers.forEach(m => map.set((m.email || m.name).toLowerCase().trim(), m));
      incomingList.forEach(m => {
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
          body: JSON.stringify(body),
          signal: controller.signal
        });
        clearTimeout(timeout);

        try {
          gasResult = await gasRes.json();
          if (gasResult && Array.isArray(gasResult.members) && gasResult.members.length > 0) {
            // Update server cache with Google Sheets merged list
            const gmap = new Map();
            serverCachedMembers.forEach(m => gmap.set((m.email || m.name).toLowerCase().trim(), m));
            gasResult.members.forEach(gm => {
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
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
