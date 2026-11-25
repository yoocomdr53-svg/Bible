// Vercel Serverless Function: SuperBible 동기화 허브 (v4)
//
// 역할: 앱(PC·폰·태블릿) ↔ 구글 Apps Script 웹앱(superbible DBase) 사이의 "중계"만 합니다.
//  - 회원 목록의 기준은 오직 구글 시트입니다. 이 허브는 회원을 숨기거나, 회원번호를 다시 매기거나,
//    자체 삭제 기록을 보관하지 않습니다. (예전 버전의 이 동작들이 삭제·수정 오류와 "부활"의 원인이었습니다)
//  - 웹앱 URL 우선순위: Vercel 환경변수 GOOGLE_SCRIPT_URL → 앱이 보낸 scriptUrl → 기본값
//
// ※ 웹앱 URL 을 바꾸면 Vercel > Settings > Environment Variables 의 GOOGLE_SCRIPT_URL 을 고치고 Redeploy 하세요.

export const config = { maxDuration: 30 };

const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzHnO0-Yvmfr2A0ImQewLiWhvVEt1HG9pLFUEEexaBr0GwEnYRNGtNyBibvOJdRQW2lPg/exec';
const ADMIN_EMAIL = 'yoocomdr57@gmail.com';

// 관리자 지정 차단 목록 (서버 메모리 — 서버가 재시작되면 비워집니다. 핵심 기능 아님)
let adminBlacklist = globalThis.__SUPERBIBLE_ADMIN_BLACKLIST__ || [];

function resolveScriptUrl(req, body) {
  const candidates = [
    process.env.GOOGLE_SCRIPT_URL,
    body && body.scriptUrl,
    req.headers['x-script-url'],
    req.query && req.query.scriptUrl,
    DEFAULT_SCRIPT_URL,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && /^https:\/\/script\.google(usercontent)?\.com\//.test(c.trim())) return c.trim();
  }
  return DEFAULT_SCRIPT_URL;
}

async function callGas(url, { method = 'GET', body, timeoutMs = 25000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'text/plain;charset=utf-8' } : { Accept: 'application/json' },
      body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
      redirect: 'follow',
      signal: controller.signal,
    });
    const text = (await res.text()) || '';
    const trimmed = text.trim();
    if (trimmed.startsWith('<')) {
      return {
        ok: false,
        data: {
          status: 'error',
          message:
            '구글 웹앱이 JSON 대신 HTML 페이지를 돌려줬습니다. Apps Script 배포가 "실행: 나 / 액세스: 모든 사용자" 인지, URL 이 /exec 로 끝나는지 확인하세요.',
        },
      };
    }
    try {
      const data = JSON.parse(trimmed);
      return { ok: data && data.status !== 'error', data };
    } catch {
      return { ok: false, data: { status: 'error', message: '구글 웹앱 응답을 읽지 못했습니다: ' + trimmed.slice(0, 120) } };
    }
  } catch (err) {
    const message = err && err.name === 'AbortError' ? '구글 웹앱 응답 시간 초과' : `구글 웹앱 통신 실패: ${err && err.message}`;
    return { ok: false, data: { status: 'error', message } };
  } finally {
    clearTimeout(timer);
  }
}

function sheetIdFromUrl(url) {
  const m = String(url || '').match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Script-Url, X-Requested-With');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const query = req.query || {};
  const action = (req.method === 'GET' ? query.action : body.action) || (req.method === 'GET' ? 'pull' : '');
  const scriptUrl = resolveScriptUrl(req, body);

  // ── 설정 조회: 모든 기기가 같은 웹앱 URL 을 쓰도록 알려줌
  if (action === 'getConfig') {
    res.status(200).json({
      success: true,
      scriptUrl,
      scriptUrlFromEnv: Boolean(process.env.GOOGLE_SCRIPT_URL),
      sheetUrl: process.env.GOOGLE_SHEET_URL || '',
      sheetId: process.env.GOOGLE_SHEET_ID || sheetIdFromUrl(process.env.GOOGLE_SHEET_URL),
      adminEmail: ADMIN_EMAIL,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // ── 예전 버전 호환용 (서버는 더 이상 설정/삭제기록을 보관하지 않음)
  if (action === 'setConfig' || action === 'setScriptUrl') {
    res.status(200).json({
      success: true,
      message: process.env.GOOGLE_SCRIPT_URL
        ? '서버는 Vercel 환경변수 GOOGLE_SCRIPT_URL 을 사용합니다.'
        : '이 기기에 저장되었습니다. 모든 기기에 적용하려면 Vercel 환경변수 GOOGLE_SCRIPT_URL 을 설정하세요.',
      scriptUrl,
    });
    return;
  }
  if (action === 'clearDeletedRecords' || action === 'clearAllDeleted' || action === 'clearCache') {
    res.status(200).json({ success: true, message: '서버에는 보관 중인 삭제기록/캐시가 없습니다. (구글 시트가 기준)' });
    return;
  }

  // ── 관리자 차단 목록 (메모리)
  if (action === 'getBlacklist') {
    res.status(200).json({ success: true, blacklist: adminBlacklist });
    return;
  }
  if (action === 'addBlacklist') {
    const target = String(body.target || '').toLowerCase().trim();
    if (target) {
      adminBlacklist = adminBlacklist.filter((i) => i.target !== target);
      adminBlacklist.push({
        id: body.id || `bl-${Date.now()}`,
        target,
        targetName: body.targetName || '',
        reason: body.reason || '관리자 수동 차단',
        createdAt: new Date().toISOString(),
        createdBy: body.createdBy || '로고스 관리자',
      });
      globalThis.__SUPERBIBLE_ADMIN_BLACKLIST__ = adminBlacklist;
    }
    res.status(200).json({ success: true, message: '차단 목록에 등록되었습니다.', blacklist: adminBlacklist });
    return;
  }
  if (action === 'removeBlacklist') {
    const target = String(body.target || '').toLowerCase().trim();
    const id = String(body.id || '').trim();
    adminBlacklist = adminBlacklist.filter((i) => !(id && i.id === id) && !(target && i.target === target));
    globalThis.__SUPERBIBLE_ADMIN_BLACKLIST__ = adminBlacklist;
    res.status(200).json({ success: true, message: '차단이 해제되었습니다.', blacklist: adminBlacklist });
    return;
  }
  if (action === 'clearBlacklist' || action === 'clearAllBlacklist') {
    adminBlacklist = [];
    globalThis.__SUPERBIBLE_ADMIN_BLACKLIST__ = [];
    res.status(200).json({ success: true, message: '차단 목록을 비웠습니다.', blacklist: [] });
    return;
  }

  // ── 회원 목록 가져오기 (GET)
  if (req.method === 'GET') {
    const { ok, data } = await callGas(scriptUrl, { method: 'GET' });
    if (!ok || !Array.isArray(data.members)) {
      res.status(200).json({
        success: false,
        source: 'error',
        message: (data && data.message) || '구글 시트에서 회원 목록을 가져오지 못했습니다.',
        scriptUrl,
      });
      return;
    }
    res.status(200).json({
      success: true,
      source: 'google_sheets',
      version: data.version || '',
      members: data.members, // 회원번호·순서 모두 시트 그대로
      deleted: data.deleted || [],
      deletedAt: data.deletedAt || {},
      blacklist: adminBlacklist,
      scriptUrl,
      sheetUrl: data.sheetUrl || '',
      sheetId: data.sheetId || '',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // ── 그 외 모든 POST 요청: 구글 웹앱으로 그대로 전달 (가입/수정/삭제/진도/녹음/sync/db*)
  if (req.method === 'POST') {
    if (!action) {
      res.status(400).json({ success: false, message: 'action 이 없습니다.' });
      return;
    }
    // scriptUrl 같은 허브 전용 값은 빼고 전달
    const { scriptUrl: _omit, ...forward } = body;
    const { ok, data } = await callGas(scriptUrl, { method: 'POST', body: forward });
    res.status(200).json({
      success: ok,
      sheetSyncSuccess: ok,
      message: (data && data.message) || (ok ? '구글 시트에 반영되었습니다.' : '구글 시트 반영 실패'),
      gasResult: data,
      gasError: ok ? null : (data && data.message) || '구글 시트 반영 실패',
      scriptUrl,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(405).json({ error: 'Method Not Allowed' });
}
