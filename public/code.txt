/**
 * [수퍼바이블] superbible DBase — 구글 스프레드시트 DB + 웹앱 API (v4)
 * 관리자 계정: yoocomdr57@gmail.com
 *
 * ■ 처음 설정 (딱 1번)
 *  1) yoocomdr57@gmail.com 으로 로그인 → "superbible DBase" 스프레드시트 열기 → [확장 프로그램] > [Apps Script]
 *     (스프레드시트가 없으면 script.google.com 에서 새 프로젝트를 만들어도 됩니다)
 *  2) 기존 코드를 전부 지우고 이 코드를 붙여넣고 저장
 *  3) 함수 목록에서 [createSuperBibleDBase] 선택 > [실행] > 권한 승인
 *     → 시트 6개와 한글 필드명이 자동으로 만들어지고, v3 의 잘못된 삭제기록(이름·회원번호)이 정리됩니다.
 *  4) [배포] > [배포 관리] > 연필 > 버전: "새 버전" > 배포  (URL 이 그대로 유지됩니다)
 *     처음 배포라면 [배포] > [새 배포] > 웹 앱 / 실행: 나 / 액세스: 모든 사용자 → 웹앱 URL 복사
 *  5) 웹앱 URL 을 Vercel 환경변수 GOOGLE_SCRIPT_URL 에 넣고 Redeploy (안내문 참고)
 *
 * ■ v4 에서 바뀐 핵심 규칙
 *  - 회원은 "이메일" 로만 구분합니다. 이름이 같아도 다른 사람입니다. (이름으로 찾거나 지우지 않음)
 *  - 회원번호(M-xx)는 시트가 발급하고, 앱은 그 번호를 그대로 씁니다.
 *  - 시트에 있는 행 = 회원 목록. 삭제 명단은 "삭제 이전에 보내진 오래된 가입/진도 요청" 만 막습니다.
 *  - 다시 가입하면(삭제 이후 시각의 요청) 삭제 명단에서 자동으로 풀립니다.
 *
 * ■ 시트(테이블): 회원관리 / 회원_낭독진도 / 낭독_음원검수 / 통독_캠페인 / 실시간_동기화로그 / 삭제된회원 /
 *                 계시록_낭독기록 (v4.1: 앱 홈의 [계시록 낭독관리] 기록, 관리자 [계시록 낭독] 탭에서 조회)
 *
 * ■ 웹앱 API (POST, JSON 본문)
 *   가입   {"action":"registerMember","member":{...},"loginId":"...","requestedAt":1730000000000}
 *   수정   {"action":"updateMember","member":{"id":"M-03",...},"originalEmail":"old@x.com"}
 *   삭제   {"action":"deleteMember","id":"M-03","email":"a@x.com"}
 *   진도   {"action":"updateProgress","email":"a@x.com","book":"창세기","chapter":3,"totalReadChapters":12}
 *   범용   dbInsert / dbUpdate / dbDelete / dbList (한글 필드명, 아래 범용 API 참고)
 *   조회   GET  (회원 목록)  /  GET ?action=ping (버전 확인)
 */

var VERSION = "v4.1";
var ADMIN_EMAIL = "yoocomdr57@gmail.com";
var TZ = "Asia/Seoul";

// 보안 토큰. 빈 문자열("")이면 웹을 통한 전면초기화는 차단되고, 삭제/수정은 토큰 없이 허용됩니다.
// 값을 넣으면 삭제/수정/초기화 요청에 token 이 반드시 필요합니다 (앱 쪽에도 같은 값을 넣어야 함).
var API_TOKEN = "";

var SN = {
  ROSTER: "회원관리",
  PROG: "회원_낭독진도",
  REC: "낭독_음원검수",
  CAMP: "통독_캠페인",
  LOG: "실시간_동기화로그",
  DEL: "삭제된회원",
  REV: "계시록_낭독기록"
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
  try {
    var sh = sheet_(SN.LOG);
    if (sh) sh.appendRow(["LOG-" + Utilities.getUuid().substring(0, 8), nowStr_(), type, content, count || 0]);
  } catch (e) {}
}
function tokenOk_(data) {
  return API_TOKEN !== "" && String(data.token || "") === API_TOKEN;
}
function writeAllowed_(data) {
  return API_TOKEN === "" || tokenOk_(data);
}
function isAdminEmail_(email) { return norm_(email) === norm_(ADMIN_EMAIL); }

// "yyyy.MM.dd HH:mm:ss" → ms (실패 시 0)
function parseKstMs_(s) {
  var m = String(s || "").match(/(\d{4})\.(\d{1,2})\.(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (!m) return 0;
  var iso = m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2) + "T" +
    ("0" + (m[4] || "0")).slice(-2) + ":" + ("0" + (m[5] || "0")).slice(-2) + ":" + ("0" + (m[6] || "0")).slice(-2) + "+09:00";
  var t = Date.parse(iso);
  return isNaN(t) ? 0 : t;
}

// 요청이 만들어진 시각(ms). 오래된 대기열 요청인지 판단할 때 씀.
function requestTime_(data) {
  var n = Number(data.requestedAt);
  if (n > 0) return n;
  var t = Date.parse(String(data.timestamp || ""));
  if (!isNaN(t) && t > 0) return t;
  return new Date().getTime();
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
      .addItem("🧽 삭제 명단 비우기 (모두 재가입 허용)", "clearTombstones")
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
  { name: SN.DEL, color: "#b91c1c", textCols: [1, 4], prefix: "DEL-",
    headers: ["삭제키(이메일)", "성명", "이메일", "삭제일시", "삭제시각(ms)"] },
  { name: SN.REV, color: "#4f46e5", textCols: [7], prefix: "RV-",
    headers: ["기록ID", "회원번호", "성명", "이메일", "구간", "장", "낭독일자", "일목표", "기록일시"] }
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

// ★ 최초 1회 실행: "superbible DBase" 스프레드시트 + 모든 시트 + 한글 필드명 자동 생성 (v3 → v4 정리 포함)
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

  Logger.log("superbible DBase (" + VERSION + ") 준비 완료: " + ss.getUrl());
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
    if (d && ss.getSheets().length > 1 && d.getLastRow() <= 1) ss.deleteSheet(d);
  });
  migrateTombstonesV4_();
}

// v3 삭제 명단 정리: "name:이름" / "m-05" 같은 키는 다른 회원까지 숨기는 원인이었으므로 삭제,
// 이메일 키만 남기고 삭제시각(ms) 칸을 채운다.
function migrateTombstonesV4_() {
  var sh = sheet_(SN.DEL);
  if (!sh || sh.getLastRow() < 2) return;
  var n = sh.getLastRow() - 1;
  var vals = sh.getRange(2, 1, n, 5).getValues();
  var keep = [], seen = {};
  vals.forEach(function (r) {
    var k = norm_(r[0]);
    if (!k || k.indexOf("@") < 0 || k.indexOf("name:") === 0) return; // 이메일이 아닌 키는 버림
    if (isAdminEmail_(k) || seen[k]) return;
    seen[k] = true;
    var ms = Number(r[4]) || parseKstMs_(cell_(r[3])) || new Date().getTime();
    keep.push([k, r[1], r[2] || k, cell_(r[3]) || nowStr_(), ms]);
  });
  sh.getRange(2, 1, n, 5).clearContent();
  if (n > keep.length) sh.deleteRows(2 + keep.length, n - keep.length);
  if (keep.length) sh.getRange(2, 1, keep.length, 5).setValues(keep);
}

function seedAdmin_() {
  var memo = "수퍼바이블 총괄 시스템 관리자 (" + ADMIN_EMAIL + ")";
  sheet_(SN.ROSTER).appendRow(["M-01", "로고스 관리자", "경영팀", "관리자", "010-0000-0000", ADMIN_EMAIL,
    "2026.01.01", "1980.01.01", "세례교인", "총괄본부", "admin", "active", memo]);
  sheet_(SN.PROG).appendRow(["M-01", "로고스 관리자", "경영팀", "관리자", "010-0000-0000", ADMIN_EMAIL,
    0, "창세기", 1, 0, 0, nowStr_(), "active", 1, memo]);
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

// ───────────────────────── 삭제 명단 (이메일 + 삭제시각) ─────────────────────────
// { "a@x.com": 1730000000000, ... }
function loadDeletedMap_() {
  var map = {};
  var sh = sheet_(SN.DEL);
  if (!sh || sh.getLastRow() < 2) return map;
  sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues().forEach(function (r) {
    var k = norm_(r[0]);
    if (!k) return;
    var ms = Number(r[4]) || parseKstMs_(cell_(r[3])) || 1;
    if (!map[k] || map[k] < ms) map[k] = ms;
  });
  return map;
}

function addTombstone_(email, name) {
  var e = norm_(email);
  if (!e || isAdminEmail_(e)) return;
  var sh = sheet_(SN.DEL);
  if (!sh) return;
  removeTombstone_(e);
  sh.appendRow([e, name || "", e, nowStr_(), new Date().getTime()]);
}

function removeTombstone_(email) {
  var e = norm_(email);
  var sh = sheet_(SN.DEL);
  if (!e || !sh || sh.getLastRow() < 2) return;
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (norm_(vals[i][0]) === e) sh.deleteRow(i + 2);
  }
}

// 요청이 삭제보다 먼저 만들어진 "오래된 요청" 이면 true
function isStaleForDeleted_(email, reqTime) {
  var e = norm_(email);
  if (!e) return false;
  var del = loadDeletedMap_()[e];
  return !!del && reqTime <= del;
}

function clearTombstones() {
  var sh = sheet_(SN.DEL);
  if (sh && sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  log_("삭제명단", "삭제 명단 전체 비움", 0);
  try { SpreadsheetApp.getUi().alert("삭제 명단을 비웠습니다."); } catch (e) {}
}

// ───────────────────────── 행 검색 / 회원번호 ─────────────────────────
// 이메일(6열)이 같은 모든 행
function rowsByEmail_(sh, email) {
  var e = norm_(email), out = [];
  if (!e || !sh || sh.getLastRow() < 2) return out;
  var vals = sh.getRange(2, 6, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (norm_(vals[i][0]) === e) out.push(i + 2);
  return out;
}

// 회원번호(1열)가 같은 모든 행
function rowsById_(sh, id) {
  var t = norm_(id), out = [];
  if (!t || !sh || sh.getLastRow() < 2) return out;
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (norm_(vals[i][0]) === t) out.push(i + 2);
  return out;
}

// 이름(2열)이 같은 행 (이메일이 없는 예외 상황에서만 사용)
function rowsByName_(sh, name) {
  var t = norm_(name), out = [];
  if (!t || !sh || sh.getLastRow() < 2) return out;
  var vals = sh.getRange(2, 2, sh.getLastRow() - 1, 5).getValues();
  for (var i = 0; i < vals.length; i++) if (norm_(vals[i][0]) === t) out.push(i + 2);
  return out;
}

function idInUse_(id) {
  var target = norm_(id);
  if (!target) return false;
  return rowsById_(sheet_(SN.ROSTER), target).length > 0 || rowsById_(sheet_(SN.PROG), target).length > 0;
}

function nextMemberId_() {
  var max = 0;
  [SN.ROSTER, SN.PROG].forEach(function (n) {
    var sh = sheet_(n);
    if (!sh || sh.getLastRow() < 2) return;
    sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) {
      var val = String(r[0] || "").trim();
      if (val.toUpperCase().indexOf("M-") === 0) {
        var num = parseInt(val.substring(2), 10);
        if (!isNaN(num) && num > max) max = num;
      }
    });
  });
  var n = max + 1;
  return "M-" + (n < 10 ? "0" + n : n);
}

// ───────────────────────── 회원 등록(업서트) ─────────────────────────
// 같은 이메일이 있으면 그 회원 정보를 갱신, 없으면 새 회원번호로 추가. 이름으로는 절대 합치지 않음.
function upsertMember_(member, loginId) {
  var rs = sheet_(SN.ROSTER), ps = sheet_(SN.PROG);
  var email = norm_(member.email || (String(loginId || "").indexOf("@") > -1 ? loginId : ""));
  if (!email && loginId) email = norm_(loginId) + "@superbible.kr";
  var name = String(member.name || (loginId ? String(loginId).split("@")[0] + " 성도" : "신규 성도")).trim();
  var now = nowStr_();

  var rRows = email ? rowsByEmail_(rs, email) : [];
  var pRows = email ? rowsByEmail_(ps, email) : [];
  var id;
  if (rRows.length) id = String(rs.getRange(rRows[0], 1).getValue());
  else if (pRows.length) id = String(ps.getRange(pRows[0], 1).getValue());
  else id = nextMemberId_(); // 회원번호는 항상 시트가 발급

  var created = false;
  if (rRows.length) {
    var r = rRows[0];
    if (member.name) rs.getRange(r, 2).setValue(member.name);
    if (member.department) rs.getRange(r, 3).setValue(member.department);
    if (member.role) rs.getRange(r, 4).setValue(member.role);
    if (member.phone && member.phone !== "010-미등록") rs.getRange(r, 5).setValue(member.phone);
  } else {
    rs.appendRow([
      id, name,
      member.department || "다이나믹팀",
      member.role || "성도",
      member.phone || "010-미등록",
      email,
      member.registeredDate || todayStr_(),
      member.birthdate || "1995.01.01",
      member.baptismStatus || "원입",
      member.smallGroup || ((member.department || "다이나믹팀") + " 1구역"),
      member.accountRole || "member",
      member.accountStatus || "active",
      member.memo || ("수퍼바이블 웹 회원가입 (아이디: " + (loginId || email) + ")")
    ]);
    created = true;
  }

  if (pRows.length) {
    var p = pRows[0];
    if (member.name) ps.getRange(p, 2).setValue(member.name);
    if (member.department) ps.getRange(p, 3).setValue(member.department);
    if (member.role) ps.getRange(p, 4).setValue(member.role);
  } else {
    ps.appendRow([
      id, name,
      member.department || "다이나믹팀",
      member.role || "성도",
      member.phone || "010-미등록",
      email,
      Number(member.currentReadingRound) || 0,
      member.currentBook || "창세기",
      Number(member.currentChapter) || 1,
      Number(member.totalReadChapters) || 0,
      Number(member.recordingsCount) || 0,
      now, "active", 1,
      "웹 회원가입 12독 통독 시작"
    ]);
    created = true;
  }
  return { id: id, created: created, name: name, email: email };
}

function registerMember_(data) {
  var member = data.member || {};
  var email = norm_(member.email || (String(data.loginId || "").indexOf("@") > -1 ? data.loginId : ""));
  if (!email && data.loginId) email = norm_(data.loginId) + "@superbible.kr";
  if (!email && !member.name) return json_({ status: "error", message: "이메일(아이디) 또는 성명이 필요합니다." });

  // 삭제 이전에 만들어진 오래된 가입 요청(앱 대기열에 남아 있던 것)은 무시 → 삭제 회원 부활 방지
  if (isStaleForDeleted_(email, requestTime_(data))) {
    log_("회원가입 무시", "삭제 이전의 오래된 가입 요청: " + email, 0);
    return json_({ status: "success", skipped: true, message: "삭제된 회원의 오래된 가입 요청이라 반영하지 않았습니다.", timestamp: nowStr_() });
  }
  // 삭제 이후의 새 가입 → 삭제 명단에서 해제
  removeTombstone_(email);
  member.email = email;
  var res = upsertMember_(member, data.loginId);
  log_("회원가입 동기화", "회원 " + (res.created ? "등록" : "갱신") + ": " + res.name + " (" + res.email + ") " + res.id, 1);
  return json_({
    status: "success",
    message: res.created ? "신규 회원이 [회원관리] 및 [회원_낭독진도] 시트에 저장되었습니다." : "이미 있는 회원(이메일)이라 정보를 갱신했습니다.",
    memberId: res.id,
    email: res.email,
    created: res.created,
    timestamp: nowStr_()
  });
}

// ───────────────────────── 회원 수정 ─────────────────────────
// 찾는 순서: originalEmail(바꾸기 전 이메일) → 회원번호 → 이메일
function locateMember_(member, originalEmail) {
  var rs = sheet_(SN.ROSTER), ps = sheet_(SN.PROG);
  var tries = [];
  if (originalEmail) tries.push({ by: "email", v: originalEmail });
  if (member.id) tries.push({ by: "id", v: member.id });
  if (member.email) tries.push({ by: "email", v: member.email });
  for (var i = 0; i < tries.length; i++) {
    var t = tries[i];
    var r = t.by === "email" ? rowsByEmail_(rs, t.v) : rowsById_(rs, t.v);
    var p = t.by === "email" ? rowsByEmail_(ps, t.v) : rowsById_(ps, t.v);
    if (r.length || p.length) {
      // 회원관리 행의 이메일로 진도 행을 다시 맞춘다 (회원번호가 어긋난 경우 대비)
      if (r.length && !p.length) {
        var em = rs.getRange(r[0], 6).getValue();
        p = rowsByEmail_(ps, em);
      }
      return { r: r.length ? r[0] : 0, p: p.length ? p[0] : 0 };
    }
  }
  return { r: 0, p: 0 };
}

function updateMember_(data) {
  var member = data.member || data;
  var originalEmail = data.originalEmail || member.originalEmail || member.oldEmail || "";
  var rs = sheet_(SN.ROSTER), ps = sheet_(SN.PROG);
  var loc = locateMember_(member, originalEmail);
  if (!loc.r && !loc.p) {
    return json_({ status: "error", message: "수정할 회원을 시트에서 찾지 못했습니다: " + (member.name || member.email || member.id) });
  }

  // 이메일을 다른 회원이 이미 쓰고 있으면 거부
  if (has_(member.email) && member.email) {
    var newEmail = norm_(member.email);
    var curEmail = norm_(loc.r ? rs.getRange(loc.r, 6).getValue() : ps.getRange(loc.p, 6).getValue());
    if (newEmail !== curEmail) {
      var clash = rowsByEmail_(rs, newEmail).filter(function (x) { return x !== loc.r; });
      if (clash.length) return json_({ status: "error", message: "이미 다른 회원이 사용 중인 이메일입니다: " + newEmail });
      removeTombstone_(newEmail);
    }
    member.email = newEmail;
  }

  if (loc.r) {
    var rv = rs.getRange(loc.r, 1, 1, 13).getValues()[0];
    if (has_(member.name)) rv[1] = member.name;
    if (has_(member.department)) rv[2] = member.department;
    if (has_(member.role)) rv[3] = member.role;
    if (has_(member.phone)) rv[4] = member.phone;
    if (has_(member.email) && member.email) rv[5] = member.email;
    if (has_(member.registeredDate)) rv[6] = member.registeredDate;
    if (has_(member.birthdate)) rv[7] = member.birthdate;
    if (has_(member.baptismStatus)) rv[8] = member.baptismStatus;
    if (has_(member.smallGroup)) rv[9] = member.smallGroup;
    if (has_(member.accountRole)) rv[10] = member.accountRole;
    if (has_(member.accountStatus)) rv[11] = member.accountStatus;
    if (has_(member.memo)) rv[12] = member.memo;
    rs.getRange(loc.r, 1, 1, 13).setValues([rv]);
  }
  if (loc.p) {
    var pv = ps.getRange(loc.p, 1, 1, 15).getValues()[0];
    if (loc.r) pv[0] = rs.getRange(loc.r, 1).getValue(); // 회원번호 일치
    if (has_(member.name)) pv[1] = member.name;
    if (has_(member.department)) pv[2] = member.department;
    if (has_(member.role)) pv[3] = member.role;
    if (has_(member.phone)) pv[4] = member.phone;
    if (has_(member.email) && member.email) pv[5] = member.email;
    if (has_(member.memo)) pv[14] = member.memo;
    ps.getRange(loc.p, 1, 1, 15).setValues([pv]);
  }

  var id = loc.r ? String(rs.getRange(loc.r, 1).getValue()) : String(ps.getRange(loc.p, 1).getValue());
  log_("회원수정", (member.name || id) + " (" + id + ") 정보 수정", (loc.r ? 1 : 0) + (loc.p ? 1 : 0));
  return json_({
    status: "success",
    message: "'" + (member.name || id) + "' 회원 정보가 구글 시트에 수정·반영되었습니다.",
    memberId: id,
    timestamp: nowStr_()
  });
}

// ───────────────────────── 회원 삭제 ─────────────────────────
// t = { id, email, name }  — 이메일로 찾고, 없으면 회원번호로 찾는다. 이름만으로는 1명일 때만 삭제.
function deleteMember_(t) {
  var rs = sheet_(SN.ROSTER), ps = sheet_(SN.PROG);
  var email = norm_(t.email);
  var id = norm_(t.id || t.memberId);

  // 회원번호만 왔으면 회원관리 시트에서 이메일을 알아낸다
  if (!email && id) {
    var byId = rowsById_(rs, id);
    if (!byId.length) byId = rowsById_(ps, id);
    if (byId.length === 1) {
      var src = rowsById_(rs, id).length ? rs : ps;
      email = norm_(src.getRange(byId[0], 6).getValue());
    }
  }
  // 이름만 왔으면 동명이인 오삭제 방지를 위해 딱 1명일 때만
  if (!email && !id && t.name) {
    var byName = rowsByName_(rs, t.name);
    if (byName.length === 1) email = norm_(rs.getRange(byName[0], 6).getValue());
    else return { ok: false, message: "이름만으로는 삭제할 수 없습니다(동명이인 " + byName.length + "명). 이메일이나 회원번호를 주세요.", rowsDeleted: 0 };
  }

  if (isAdminEmail_(email) || id === "m-01") {
    return { ok: false, message: "마스터 관리자 계정은 삭제할 수 없습니다.", rowsDeleted: 0 };
  }
  if (!email && !id) return { ok: false, message: "삭제할 회원의 이메일 또는 회원번호가 필요합니다.", rowsDeleted: 0 };

  var deleted = 0, name = "";
  [rs, ps].forEach(function (sh) {
    var rows = email ? rowsByEmail_(sh, email) : rowsById_(sh, id);
    for (var i = rows.length - 1; i >= 0; i--) {
      if (!name) name = String(sh.getRange(rows[i], 2).getValue() || "");
      sh.deleteRow(rows[i]);
      deleted++;
    }
  });
  if (email) addTombstone_(email, name || t.name || "");
  return { ok: true, rowsDeleted: deleted, email: email };
}

function deleteMemberResponse_(data) {
  var res = deleteMember_({ email: data.email, name: data.name, id: data.memberId || data.id });
  if (!res.ok) return json_({ status: "error", message: res.message });
  log_("회원 삭제", "회원 삭제: " + (data.name || "") + " (" + (res.email || data.memberId || data.id || "") + ")", res.rowsDeleted);
  return json_({
    status: "success",
    message: res.rowsDeleted > 0
      ? "회원이 [회원관리] 및 [회원_낭독진도] 시트에서 삭제되었습니다. (삭제 행 수: " + res.rowsDeleted + ")"
      : "시트에 해당 회원 행이 없어 삭제 명단에만 등록했습니다.",
    rowsDeleted: res.rowsDeleted,
    email: res.email,
    timestamp: nowStr_()
  });
}

// ───────────────────────── 낭독 진도 ─────────────────────────
function updateProgress_(data) {
  var email = norm_(data.email);
  if (!email) return json_({ status: "error", message: "email 이 필요합니다." });
  if (isStaleForDeleted_(email, requestTime_(data))) return json_({ status: "success", skipped: true, message: "삭제된 회원입니다." });

  var ps = sheet_(SN.PROG);
  var rows = rowsByEmail_(ps, email);
  if (!rows.length) {
    if (loadDeletedMap_()[email]) return json_({ status: "success", skipped: true, message: "삭제된 회원입니다." });
    upsertMember_({
      name: data.name || email.split("@")[0],
      email: email,
      department: data.department || "다이나믹팀",
      currentBook: data.book,
      currentChapter: data.chapter,
      totalReadChapters: data.totalReadChapters || 1
    }, email);
  } else {
    var r = rows[0];
    var v = ps.getRange(r, 1, 1, 15).getValues()[0];
    v[7] = data.book || v[7] || "창세기";
    v[8] = data.chapter || v[8] || 1;
    var cur = Number(v[9]) || 0;
    v[9] = has_(data.totalReadChapters) ? Math.max(cur, Number(data.totalReadChapters) || 0) : cur + 1;
    v[6] = Math.floor(v[9] / 1189);
    v[11] = nowStr_();
    ps.getRange(r, 1, 1, 15).setValues([v]);
  }
  return json_({ status: "success", message: "낭독 진도가 [회원_낭독진도] 시트에 갱신되었습니다." });
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
  return json_({ status: "success", message: "낭독 녹음 기록이 [낭독_음원검수] 시트에 저장되었습니다." });
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

  var rawName = String(data.memberName || "").trim();
  while (rawName.slice(-3) === " 성도") rawName = rawName.slice(0, -3).trim();
  while (rawName.slice(-4) === " 관리자") rawName = rawName.slice(0, -4).trim();
  var openP = rawName.lastIndexOf("(");
  var closeP = rawName.lastIndexOf(")");
  if (openP > -1 && closeP > openP) {
    rawName = (rawName.substring(0, openP) + rawName.substring(closeP + 1)).trim();
  }
  var rawId = String(data.loginId || "").trim();
  var atPos = rawId.indexOf("@");
  if (atPos > -1) rawId = rawId.substring(0, atPos).trim();

  var cleanName = rawName || "성도";
  var cleanId = rawId || "user";
  var userFolderName = data.userFolderName || (cleanName + "_" + cleanId);
  var uf = rootFolder.getFoldersByName(userFolderName);
  var userFolder = uf.hasNext() ? uf.next() : rootFolder.createFolder(userFolderName);

  var mime = String(data.mimeType || "audio/mpeg").toLowerCase();
  var ext = ".mp3";
  if (mime.indexOf("webm") > -1) ext = ".webm";
  else if (mime.indexOf("mp4") > -1 || mime.indexOf("m4a") > -1 || mime.indexOf("aac") > -1) ext = ".m4a";
  else if (mime.indexOf("ogg") > -1) ext = ".ogg";
  else if (mime.indexOf("wav") > -1) ext = ".wav";

  var bibleName = String(data.bibleName || data.verseRef || data.fileName || "성경낭독").trim();
  var base = String(data.fileName || bibleName).trim();
  var knownExts = [".webm", ".mp3", ".m4a", ".ogg", ".wav"];
  for (var kExt = 0; kExt < knownExts.length; kExt++) {
    var kx = knownExts[kExt];
    if (base.toLowerCase().slice(-kx.length) === kx) {
      base = base.slice(0, -kx.length).trim();
      break;
    }
  }
  var badChars = [":", "*", "?", '"', "<", ">", "|", "/", String.fromCharCode(92)];
  for (var bIdx = 0; bIdx < badChars.length; bIdx++) {
    base = base.split(badChars[bIdx]).join("_");
  }
  base = base.trim();
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

  // 시트 동기화 (이메일 기준)
  try {
    var email = norm_(data.email || (String(data.loginId || "").indexOf("@") > -1 ? data.loginId : ""));
    var ps = sheet_(SN.PROG);
    var rows = email ? rowsByEmail_(ps, email) : rowsByName_(ps, cleanName);
    var memberId = data.memberId || (rows.length === 1 ? String(ps.getRange(rows[0], 1).getValue()) : "");

    sheet_(SN.REC).appendRow([
      "REC-" + new Date().getTime(),
      memberId,
      cleanName,
      data.department || data.teamName || "",
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

    if (rows.length === 1) {
      var r = rows[0];
      var v = ps.getRange(r, 1, 1, 15).getValues()[0];
      if (data.book) v[7] = data.book;
      if (data.chapter) v[8] = data.chapter;
      v[10] = (Number(v[10]) || 0) + 1;
      v[11] = now;
      ps.getRange(r, 1, 1, 15).setValues([v]);
    }
  } catch (ssErr) {
    Logger.log("Spreadsheet recording error: " + ssErr);
  }

  return json_({
    status: "success",
    message: "구글 드라이브 [" + userFolderName + "] 폴더에 " + fileName + " 음원이 저장되고 스프레드시트에 기록되었습니다.",
    fileUrl: fileUrl,
    downloadUrl: "https://drive.google.com/uc?export=download&id=" + fileId,
    fileId: fileId,
    fileName: fileName,
    userFolderName: userFolderName,
    adminEmail: ADMIN_EMAIL
  });
}

// ───────────────────────── 전체 동기화 (sync) ─────────────────────────
// - deletedList: 이메일만 처리 (이름으로는 지우지 않음)
// - 시트에 이미 있는 회원의 '진도'만 갱신 (더 큰 값만 반영). 회원 정보는 시트가 기준.
// - 시트에 없는 회원은 allowCreate === true 일 때만 새로 만든다 (최초 이관용).
function sync_(data) {
  var incoming = (data.data && data.data.members) ? data.data.members : (data.members || []);
  var deletedList = data.deletedList || (data.data && data.data.deletedList) || [];
  var allowCreate = data.allowCreate === true;
  var ps = sheet_(SN.PROG);

  for (var d = 0; d < deletedList.length; d++) {
    var k = String(deletedList[d] || "").trim();
    if (k.indexOf("@") > -1) deleteMember_({ email: k });
  }

  var delMap = loadDeletedMap_();
  var now = nowStr_();
  var pLast = ps.getLastRow();
  var pVals = pLast > 1 ? ps.getRange(2, 1, pLast - 1, 15).getValues() : [];
  var pIdx = {};
  pVals.forEach(function (r, i) {
    var key = norm_(r[5]);
    if (key && pIdx[key] === undefined) pIdx[key] = i;
  });

  var skippedDeleted = 0, updated = 0, created = 0;
  for (var i = 0; i < incoming.length; i++) {
    var mem = incoming[i];
    if (!mem) continue;
    var key = norm_(mem.email);
    if (!key) continue;
    var idx = pIdx[key];
    if (idx !== undefined) {
      var row = pVals[idx];
      var changed = false;
      var incTotal = Number(mem.totalReadChapters);
      var curTotal = Number(row[9]) || 0;
      if (has_(mem.totalReadChapters) && !isNaN(incTotal) && incTotal > curTotal) {
        if (mem.currentBook) row[7] = mem.currentBook;
        if (mem.currentChapter) row[8] = mem.currentChapter;
        row[9] = incTotal;
        row[6] = Math.floor(incTotal / 1189);
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
    } else if (delMap[key]) {
      skippedDeleted++;
    } else if (allowCreate) {
      upsertMember_(mem, "");
      created++;
    }
  }

  log_("전체 동기화", "수신 " + incoming.length + "명 / 진도갱신 " + updated + " / 신규생성 " + created + " / 삭제회원 무시 " + skippedDeleted, updated + created);
  return json_(memberListPayload_({ message: "수퍼바이블 시트와 동기화되었습니다. (시트 기준)" }));
}

// ───────────────────────── 회원 목록 구성 ─────────────────────────
// 시트에 있는 행이 곧 회원 목록이다. (삭제 명단으로 숨기지 않음)
function buildMemberList_() {
  var rs = sheet_(SN.ROSTER), ps = sheet_(SN.PROG);
  var rRows = (rs && rs.getLastRow() > 1) ? rs.getRange(2, 1, rs.getLastRow() - 1, 13).getValues() : [];
  var pRows = (ps && ps.getLastRow() > 1) ? ps.getRange(2, 1, ps.getLastRow() - 1, 15).getValues() : [];
  var map = {}, order = [];

  function keyOf(id, email) {
    var e = norm_(email);
    if (e) return e;
    var i = norm_(id);
    return i ? "id:" + i : "";
  }

  rRows.forEach(function (r) {
    var key = keyOf(r[0], r[5]);
    if (!key || map[key]) return;
    order.push(key);
    var name = cell_(r[1]);
    var admin = isAdminEmail_(r[5]);
    map[key] = {
      id: cell_(r[0]), name: name,
      department: cell_(r[2]) || "다이나믹팀", role: cell_(r[3]) || "성도",
      phone: cell_(r[4]) || "010-미등록", email: norm_(r[5]),
      registeredDate: cell_(r[6]), birthdate: cell_(r[7]) || "1995.01.01",
      baptismStatus: cell_(r[8]) || "원입", smallGroup: cell_(r[9]),
      accountRole: cell_(r[10]) || (admin ? "admin" : "member"), accountStatus: cell_(r[11]) || "active",
      memo: cell_(r[12]),
      avatarColor: admin ? "bg-amber-500" : "bg-blue-500",
      avatarText: admin ? "관리" : (name || "성도").slice(0, 2),
      currentReadingRound: 0, targetRounds: 12, currentBook: "창세기", currentChapter: 1,
      totalReadChapters: 0, recordingsCount: 0, lastActive: "-",
      status: "active", consecutiveDays: 1, featuredCount: 0
    };
  });

  pRows.forEach(function (m) {
    var key = keyOf(m[0], m[5]);
    if (!key) return;
    if (!map[key]) {
      order.push(key);
      var name = cell_(m[1]);
      map[key] = {
        id: cell_(m[0]), name: name,
        department: cell_(m[2]) || "다이나믹팀", role: cell_(m[3]) || "성도",
        phone: cell_(m[4]) || "010-미등록", email: norm_(m[5]),
        registeredDate: "", birthdate: "1995.01.01", baptismStatus: "원입", smallGroup: "",
        accountRole: "member", accountStatus: "active", memo: cell_(m[14]),
        avatarColor: "bg-blue-500", avatarText: (name || "성도").slice(0, 2),
        targetRounds: 12, featuredCount: 0
      };
    }
    var o = map[key];
    o.currentReadingRound = Number(m[6]) || 0;
    o.currentBook = cell_(m[7]) || "창세기";
    o.currentChapter = Number(m[8]) || 1;
    o.totalReadChapters = Number(m[9]) || 0;
    o.recordingsCount = Number(m[10]) || 0;
    o.lastActive = cell_(m[11]) || "-";
    var st = cell_(m[12]);
    o.status = (st === "excellent" || st === "warning" || st === "completed") ? st : "active";
    o.consecutiveDays = Number(m[13]) || 1;
  });

  return order.map(function (k) { return map[k]; });
}

function memberListPayload_(extra) {
  var ss = getSS_();
  var delMap = loadDeletedMap_();
  var out = {
    status: "success",
    version: VERSION,
    members: buildMemberList_(),
    deleted: Object.keys(delMap),      // 삭제 명단(이메일)
    deletedAt: delMap,                 // { 이메일: 삭제시각 ms }
    rosterCount: Math.max(0, sheet_(SN.ROSTER).getLastRow() - 1),
    memberProgressCount: Math.max(0, sheet_(SN.PROG).getLastRow() - 1),
    adminEmail: ADMIN_EMAIL,
    sheetUrl: ss.getUrl(),
    sheetId: ss.getId(),
    timestamp: new Date().toISOString()
  };
  for (var k in (extra || {})) out[k] = extra[k];
  return out;
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

// 테스트 행 정리: 성명·이메일 칸이 키워드와 '정확히 일치'하는 행만 삭제
function cleanTestMembers() {
  var keywords = ["임시테스트", "e2e테스터", "e2e테스트", "신규 성도", "신규성도",
    "temp_delete_test", "e2e_tester", "라이브테스트성도", "user_live_test",
    "삭제실험맨", "del_experiment",
    "yoocomdr55@gmail.com", "yoocomdr58@gmail.com", "realuser1@gmail.com"].map(norm_);
  var count = 0;
  [SN.ROSTER, SN.PROG].forEach(function (n) {
    var sh = sheet_(n);
    if (!sh || sh.getLastRow() < 2) return;
    var data = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      var nm = norm_(data[i][1]), em = norm_(data[i][5]);
      if (isAdminEmail_(em)) continue;
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
function parseBody_(e) {
  var data = {};
  var raw = (e && e.postData) ? e.postData.contents : "";
  if (raw) { try { data = JSON.parse(raw); } catch (parseErr) { data = {}; } }
  if (!data.action && e && e.parameter && e.parameter.action) data = e.parameter;
  return data || {};
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return json_({ status: "error", message: "서버가 혼잡합니다. 잠시 후 다시 시도해 주세요." });
  }
  try {
    var data = parseBody_(e);
    ensureSheets_();
    var action = data.action;

    if (action === "ping") return json_({ status: "success", version: VERSION, timestamp: nowStr_() });

    if (action === "resetAll" || action === "resetSpreadsheet") {
      if (!tokenOk_(data)) {
        return json_({ status: "error", message: "웹을 통한 전면 초기화는 차단되어 있습니다. (구글 시트 상단 메뉴에서 실행하세요)" });
      }
      resetCore_();
      return json_({ status: "success", message: "마스터 관리자 1명으로 전면 초기화되었습니다." });
    }

    if (action === "deleteMember") {
      if (!writeAllowed_(data)) return json_({ status: "error", message: "권한이 없습니다." });
      return deleteMemberResponse_(data);
    }
    if (action === "updateMember") {
      if (!writeAllowed_(data)) return json_({ status: "error", message: "권한이 없습니다." });
      return updateMember_(data);
    }
    if (action === "registerMember" || action === "register" || action === "registerUser") return registerMember_(data);

    if (action === "dbInsert") return dbInsert_(data);
    if (action === "dbUpdate") return dbUpdate_(data);
    if (action === "dbDelete") return dbDelete_(data);
    if (action === "dbList") return dbList_(data);
    if (action === "updateProgress") return updateProgress_(data);
    if (action === "addRecording") return addRecording_(data);
    if (action === "uploadAudio" || action === "upload_audio") return uploadAudio_(data);
    if (action === "sync") return sync_(data);
    if (action === "list" || action === "pull") return json_(memberListPayload_());

    return json_({ status: "error", message: "알 수 없는 요청(action)입니다: " + action });
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
    if (p.action === "ping") return json_({ status: "success", version: VERSION, timestamp: nowStr_() });
    if (p.action === "deleteMember" || p.action === "delete") {
      if (!writeAllowed_(p)) return json_({ status: "error", message: "권한이 없습니다." });
      return deleteMemberResponse_(p);
    }
    if (p.action === "dbList") return dbList_(p);
    return json_(memberListPayload_());
  } catch (err) {
    return json_({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}


// ═════════════════════ 범용 삽입·수정·삭제·조회 (한글 필드명 기준) ═════════════════════
//   삽입 {"action":"dbInsert","table":"통독_캠페인","values":{"캠페인명":"신약 1독","설명":"..."}}
//   수정 {"action":"dbUpdate","table":"통독_캠페인","key":"C-123","values":{"설명":"수정"}}
//   삭제 {"action":"dbDelete","table":"통독_캠페인","key":"C-123"}
//   조회 {"action":"dbList","table":"회원관리","where":{"소속부서":"경영팀"},"limit":100}
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

function findByPk_(sh, id) {
  var rows = rowsById_(sh, id);
  return rows.length ? rows[0] : -1;
}

function rowToObj_(headers, row) {
  var o = {};
  for (var i = 0; i < headers.length; i++) o[headers[i]] = cell_(row[i]);
  return o;
}

function dbInsert_(data) {
  if (!writeAllowed_(data)) return json_({ status: "error", message: "권한이 없습니다." });
  var sc = schema_(data.table);
  if (!sc) return json_({ status: "error", message: "알 수 없는 시트입니다: " + data.table });
  var values = data.values || {};

  if (sc.name === SN.ROSTER) {
    var m = toMember_(values);
    if (!m.email) return json_({ status: "error", message: "회원 삽입에는 이메일이 필요합니다. (회원은 이메일로 구분합니다)" });
    removeTombstone_(m.email);
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
  for (var i = 1; i < sc.headers.length; i++) {
    if (has_(values[sc.headers[i]])) row[i] = values[sc.headers[i]];
  }
  sh.getRange(r, 1, 1, sc.headers.length).setValues([row]);
  log_("DB수정", sc.name + " 수정: " + key, 1);
  return json_({ status: "success", message: "수정되었습니다.", key: key });
}

function dbDelete_(data) {
  if (!writeAllowed_(data)) return json_({ status: "error", message: "권한이 없습니다." });
  var sc = schema_(data.table);
  if (!sc) return json_({ status: "error", message: "알 수 없는 시트입니다: " + data.table });
  var key = String(data.key || "").trim();
  if (!key) return json_({ status: "error", message: "key(기본키 값)가 필요합니다." });

  if (sc.name === SN.ROSTER || sc.name === SN.PROG) return deleteMemberResponse_({ memberId: key });

  var sh = sheet_(sc.name);
  var r = findByPk_(sh, key);
  if (r < 0) return json_({ status: "error", message: "삭제할 행을 찾지 못했습니다: " + key });
  sh.deleteRow(r);
  if (sc.name !== SN.LOG) log_("DB삭제", sc.name + " 삭제: " + key, 1);
  return json_({ status: "success", message: "삭제되었습니다.", key: key });
}

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
  var e = ui.prompt("회원 추가", "이메일(로그인 아이디)을 입력하세요 — 회원은 이메일로 구분합니다", ui.ButtonSet.OK_CANCEL);
  if (e.getSelectedButton() !== ui.Button.OK || !e.getResponseText().trim()) return;
  var d = ui.prompt("회원 추가", "소속부서를 입력하세요 (비우면 '다이나믹팀')", ui.ButtonSet.OK_CANCEL);
  if (d.getSelectedButton() !== ui.Button.OK) return;

  var name = n.getResponseText().trim(), email = e.getResponseText().trim(), dept = d.getResponseText().trim();
  var res = withLock_(function () {
    ensureSheets_();
    removeTombstone_(email);
    var r = upsertMember_({ name: name, email: email, department: dept || "", memo: "시트 메뉴에서 직접 추가" }, "");
    log_("DB삽입", "메뉴에서 회원 추가: " + name, 1);
    return r;
  });
  ui.alert(res.created ? "회원이 추가되었습니다. (회원번호 " + res.id + ")" : "이미 있는 회원(이메일)이라 정보를 갱신했습니다.");
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
    if (v[0] || v[5]) targets.push({ id: String(v[0]), name: String(v[1]), email: String(v[5]) });
  }
  if (!targets.length) { ui.alert("선택한 행에 회원 정보가 없습니다."); return; }

  var names = targets.map(function (t) { return t.name || t.email; }).join(", ");
  var ans = ui.alert("회원 삭제", "다음 " + targets.length + "명을 [회원관리]와 [회원_낭독진도]에서 삭제합니다: (" + names + ") 계속할까요?", ui.ButtonSet.YES_NO);
  if (ans !== ui.Button.YES) return;

  var done = withLock_(function () {
    var cnt = 0;
    targets.forEach(function (t) {
      var res = deleteMember_({ id: t.email ? "" : t.id, email: t.email });
      if (res.ok) cnt += res.rowsDeleted;
    });
    log_("회원 삭제", "메뉴에서 삭제: " + names, cnt);
    return cnt;
  });
  ui.alert("삭제 완료 (삭제된 행 " + done + "개).");
}
