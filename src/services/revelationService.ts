/**
 * 계시록 낭독관리
 *  - 구간: 1–11장(전반부) / 12–22장(후반부) 중 선택
 *  - 목표: 하루 N장 → 주간 목표 = N×7, 월간 목표 = N×(그 달 일수)
 *  - 진행률 = 기간 안에 낭독한 장 수 ÷ 기간 목표 (최대 100%)
 *  - 기록: 이 기기(사용자별) + 구글 시트 [계시록_낭독기록] (관리자 화면에서 전체 회원 현황 조회)
 */
import { getUserScopeKey, getTodayDateString } from '../data/bibleData';
import { sendPayloadToGoogleScript } from './googleSheetsSync';

export const REV_BOOK = '요한계시록';
export const REV_SHEET = '계시록_낭독기록';

export type RevSectionId = 'A' | 'B';
export const REV_SECTIONS: Record<RevSectionId, { id: RevSectionId; label: string; title: string; start: number; end: number }> = {
  A: { id: 'A', label: '1–11장', title: '전반부', start: 1, end: 11 },
  B: { id: 'B', label: '12–22장', title: '후반부', start: 12, end: 22 },
};
export const REV_DAILY_GOAL_OPTIONS = [1, 2, 3, 11];

export type RevPeriod = 'day' | 'week' | 'month';
export const REV_PERIOD_LABEL: Record<RevPeriod, string> = { day: '오늘', week: '이번 주', month: '이번 달' };

export interface RevSettings {
  section: RevSectionId;
  dailyGoal: number;
}
export interface RevLogEntry {
  d: string; // YYYY-MM-DD (기기 시간 기준)
  ch: number;
  t: number;
  src?: 'rec' | 'check'; // rec = 낭독 녹음, check = 녹음 없이 직접 체크
}
export interface RevPeriodStats {
  period: RevPeriod;
  from: string;
  to: string;
  read: number; // 기간 안 낭독 장 수 (같은 날 같은 장은 1번)
  goal: number;
  percent: number;
  goalSoFar: number; // 오늘까지 따라왔어야 할 장 수
  chapters: number[]; // 기간 안에 낭독한 서로 다른 장
}

const SETTINGS_KEY = 'superbible_revelation_settings_v1';
const LOG_KEY = 'superbible_revelation_log_v1';
export const REV_CHANGED_EVENT = 'superbible_revelation_changed';

// ───────────── 날짜 도우미 ─────────────
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function periodRange(period: RevPeriod, base: Date = new Date()): { from: Date; to: Date; days: number; elapsed: number } {
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  if (period === 'day') return { from: today, to: today, days: 1, elapsed: 1 };
  if (period === 'week') {
    const dow = (today.getDay() + 6) % 7; // 월요일 시작
    const from = new Date(today);
    from.setDate(today.getDate() - dow);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return { from, to, days: 7, elapsed: dow + 1 };
  }
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { from, to, days: to.getDate(), elapsed: today.getDate() };
}

// ───────────── 설정 ─────────────
export function getRevSettings(email?: string): RevSettings {
  try {
    const raw = localStorage.getItem(getUserScopeKey(SETTINGS_KEY, email));
    if (raw) {
      const p = JSON.parse(raw);
      return {
        section: p.section === 'B' ? 'B' : 'A',
        dailyGoal: 1, // 하루 목표는 1장 고정 (v2.6.8)
      };
    }
  } catch {}
  return { section: 'A', dailyGoal: 1 };
}
export function saveRevSettings(s: RevSettings, email?: string): void {
  try {
    localStorage.setItem(getUserScopeKey(SETTINGS_KEY, email), JSON.stringify({ ...s, dailyGoal: 1 }));
    window.dispatchEvent(new CustomEvent(REV_CHANGED_EVENT));
  } catch {}
}

// ───────────── 기록 ─────────────
export function getRevLog(email?: string): RevLogEntry[] {
  try {
    const raw = localStorage.getItem(getUserScopeKey(LOG_KEY, email));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((e) => e && e.d && e.ch >= 1 && e.ch <= 22) : [];
  } catch {
    return [];
  }
}
function saveRevLog(log: RevLogEntry[], email?: string): void {
  try {
    localStorage.setItem(getUserScopeKey(LOG_KEY, email), JSON.stringify(log.slice(-3000)));
  } catch {}
}

function currentSession(): { id?: string; name?: string; email?: string } | null {
  try {
    const raw = localStorage.getItem('superbible_auth_session_v3');
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.user || p || null;
  } catch {
    return null;
  }
}

function memberIdForEmail(email?: string): string {
  try {
    const list = JSON.parse(localStorage.getItem('superbible_admin_members_v4') || '[]');
    const e = (email || '').toLowerCase().trim();
    const m = list.find((x: any) => String(x.email || '').toLowerCase().trim() === e);
    return m?.id || '';
  } catch {
    return '';
  }
}

function currentEmail(): string {
  return (currentSession()?.email || '').toLowerCase().trim();
}

function sheetRow(chapter: number, d: string, when: Date) {
  const session = currentSession();
  const settings = getRevSettings();
  const email = currentEmail();
  return {
    회원번호: memberIdForEmail(email),
    성명: session?.name || '',
    이메일: email,
    구간: REV_SECTIONS[settings.section].label,
    장: chapter,
    낭독일자: d,
    일목표: settings.dailyGoal,
    기록일시: when.toLocaleString('ko-KR'),
  };
}

/** 구글 시트 [계시록_낭독기록] 에 여러 줄 추가 (실패하면 자동 재전송 대기열) */
function pushRowsToSheet(rows: any[]): void {
  if (!rows.length || !currentEmail()) return;
  sendPayloadToGoogleScript({ action: 'revAdd', rows }).catch(() => {});
}

/** 구글 시트에서 이 회원의 기록 삭제 (from/to/chapter 비우면 전체) */
function deleteFromSheet(opts: { from?: string; to?: string; chapter?: number; chapters?: number[] }): void {
  const email = currentEmail();
  if (!email) return;
  sendPayloadToGoogleScript({ action: 'revReset', email, ...opts }).catch(() => {});
}

/**
 * 계시록 장을 낭독했을 때 호출 (녹음 저장 시 자동). 같은 날 같은 장은 한 번만 기록한다.
 * @returns 새로 기록됐으면 true
 */
export function recordRevelationReading(chapter: number, when: Date = new Date(), src: 'rec' | 'check' = 'rec'): boolean {
  if (!(chapter >= 1 && chapter <= 22)) return false;
  const d = toDateStr(when);
  const log = getRevLog();
  if (log.some((e) => e.d === d && e.ch === chapter)) return false;
  log.push({ d, ch: chapter, t: when.getTime(), src });
  saveRevLog(log);
  window.dispatchEvent(new CustomEvent(REV_CHANGED_EVENT));
  pushRowsToSheet([sheetRow(chapter, d, when)]);
  return true;
}

/** 특정 날짜에 그 장을 읽었는지 */
export function isRevChapterRead(chapter: number, dateStr: string, email?: string): boolean {
  return getRevLog(email).some((e) => e.d === dateStr && e.ch === chapter);
}

/**
 * 녹음 없이 직접 체크 / 해제 (여러 장 한 번에 가능)
 * @param dateStr YYYY-MM-DD (오늘 또는 어제 등)
 */
export function setRevChaptersChecked(chapters: number[], dateStr: string, checked: boolean): number {
  const log = getRevLog();
  const changed: number[] = [];
  if (checked) {
    chapters.forEach((ch) => {
      if (ch < 1 || ch > 22 || log.some((e) => e.d === dateStr && e.ch === ch)) return;
      log.push({ d: dateStr, ch, t: Date.now(), src: 'check' });
      changed.push(ch);
    });
    if (changed.length) pushRowsToSheet(changed.map((ch) => sheetRow(ch, dateStr, new Date())));
  } else {
    const set = new Set(chapters);
    for (let i = log.length - 1; i >= 0; i--) {
      if (log[i].d === dateStr && set.has(log[i].ch)) {
        changed.push(log[i].ch);
        log.splice(i, 1);
      }
    }
    if (changed.length) deleteFromSheet({ from: dateStr, to: dateStr, chapters: changed });
  }
  if (changed.length) {
    saveRevLog(log);
    window.dispatchEvent(new CustomEvent(REV_CHANGED_EVENT));
  }
  return changed.length;
}

export type RevResetScope = 'day' | 'week' | 'month' | 'all';
export const REV_RESET_LABEL: Record<RevResetScope, string> = {
  day: '오늘 기록',
  week: '이번 주 기록',
  month: '이번 달 기록',
  all: '전체 기록',
};

/** 기록 초기화 (이 기기 + 구글 시트) — 지운 개수 반환 */
export function resetRevelation(scope: RevResetScope): number {
  const log = getRevLog();
  let keep: RevLogEntry[];
  if (scope === 'all') {
    keep = [];
    deleteFromSheet({});
  } else {
    const { from, to } = periodRange(scope);
    const f = toDateStr(from), t = toDateStr(to);
    keep = log.filter((e) => e.d < f || e.d > t);
    deleteFromSheet({ from: f, to: t });
  }
  const removed = log.length - keep.length;
  saveRevLog(keep);
  window.dispatchEvent(new CustomEvent(REV_CHANGED_EVENT));
  return removed;
}

/** 구간을 처음 상태(1–11장)로 */
export function resetRevSettings(email?: string): void {
  saveRevSettings({ section: 'A', dailyGoal: 1 }, email);
}

// ───────────── 통계 ─────────────
export function computePeriodStats(
  entries: { d: string; ch: number }[],
  settings: RevSettings,
  period: RevPeriod,
  base: Date = new Date()
): RevPeriodStats {
  const sec = REV_SECTIONS[settings.section];
  const { from, to, days, elapsed } = periodRange(period, base);
  const fromS = toDateStr(from);
  const toS = toDateStr(to);
  const seen = new Set<string>();
  const chapters = new Set<number>();
  entries.forEach((e) => {
    if (e.d < fromS || e.d > toS) return;
    if (e.ch < sec.start || e.ch > sec.end) return;
    const k = `${e.d}#${e.ch}`;
    if (seen.has(k)) return;
    seen.add(k);
    chapters.add(e.ch);
  });
  const read = seen.size;
  const goal = settings.dailyGoal * days;
  return {
    period,
    from: fromS,
    to: toS,
    read,
    goal,
    percent: goal ? Math.min(100, Math.round((read / goal) * 100)) : 0,
    goalSoFar: settings.dailyGoal * elapsed,
    chapters: Array.from(chapters).sort((a, b) => a - b),
  };
}

export function getMyRevStats(email?: string) {
  const settings = getRevSettings(email);
  const log = getRevLog(email);
  return {
    settings,
    day: computePeriodStats(log, settings, 'day'),
    week: computePeriodStats(log, settings, 'week'),
    month: computePeriodStats(log, settings, 'month'),
    lastChapter: lastChapterInSection(log, settings.section),
    streak: currentStreak(log, settings.section),
  };
}

/** 선택 구간에서 가장 최근에 낭독한 장 */
function lastChapterInSection(log: RevLogEntry[], section: RevSectionId): number | null {
  const sec = REV_SECTIONS[section];
  const inSec = log.filter((e) => e.ch >= sec.start && e.ch <= sec.end).sort((a, b) => a.t - b.t);
  return inSec.length ? inSec[inSec.length - 1].ch : null;
}

/** 다음에 낭독할 장 (마지막 장 다음, 구간 끝이면 처음으로) */
export function nextChapter(email?: string): number {
  const s = getRevSettings(email);
  const sec = REV_SECTIONS[s.section];
  const last = lastChapterInSection(getRevLog(email), s.section);
  if (!last || last >= sec.end) return sec.start;
  return last + 1;
}

/** 오늘(또는 어제)부터 거꾸로 이어진 낭독 연속일 */
function currentStreak(log: RevLogEntry[], section: RevSectionId): number {
  const sec = REV_SECTIONS[section];
  const days = new Set(log.filter((e) => e.ch >= sec.start && e.ch <= sec.end).map((e) => e.d));
  const cur = new Date();
  if (!days.has(toDateStr(cur))) cur.setDate(cur.getDate() - 1);
  let n = 0;
  while (days.has(toDateStr(cur))) {
    n++;
    cur.setDate(cur.getDate() - 1);
  }
  return n;
}

// ───────────── 관리자: 시트 기록으로 회원별 현황 ─────────────
export interface RevMemberRow {
  email: string;
  name: string;
  memberId: string;
  settings: RevSettings;
  day: RevPeriodStats;
  week: RevPeriodStats;
  month: RevPeriodStats;
  lastDate: string;
}

export async function fetchRevelationAdminRows(): Promise<{ success: boolean; rows: RevMemberRow[]; message?: string }> {
  const res = await sendPayloadToGoogleScript(
    { action: 'dbList', table: REV_SHEET, limit: 20000 },
    undefined,
    { enqueueOnFail: false }
  );
  if (!res.success || !Array.isArray(res.data?.rows)) {
    return { success: false, rows: [], message: res.message };
  }
  const byEmail = new Map<string, { name: string; memberId: string; entries: { d: string; ch: number; t: number; sec: string; goal: number }[] }>();
  res.data.rows.forEach((r: any) => {
    const email = String(r['이메일'] || '').toLowerCase().trim();
    const ch = Number(r['장']);
    const d = String(r['낭독일자'] || '').slice(0, 10).replace(/\./g, '-');
    if (!email || !(ch >= 1 && ch <= 22) || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    const g = byEmail.get(email) || { name: r['성명'] || '', memberId: r['회원번호'] || '', entries: [] };
    g.name = r['성명'] || g.name;
    g.memberId = r['회원번호'] || g.memberId;
    g.entries.push({ d, ch, t: parseDateStr(d).getTime(), sec: String(r['구간'] || ''), goal: Number(r['일목표']) || 1 });
    byEmail.set(email, g);
  });
  const rows: RevMemberRow[] = [];
  byEmail.forEach((g, email) => {
    const latest = g.entries[g.entries.length - 1]; // 시트에 쌓인 순서상 마지막 = 가장 최근 설정
    const settings: RevSettings = {
      section: latest.sec.startsWith('12') ? 'B' : 'A',
      dailyGoal: latest.goal,
    };
    rows.push({
      email,
      name: g.name,
      memberId: g.memberId,
      settings,
      day: computePeriodStats(g.entries, settings, 'day'),
      week: computePeriodStats(g.entries, settings, 'week'),
      month: computePeriodStats(g.entries, settings, 'month'),
      lastDate: g.entries.map((e) => e.d).sort().pop() || '',
    });
  });
  rows.sort((a, b) => b.month.percent - a.month.percent || a.name.localeCompare(b.name));
  return { success: true, rows };
}

export { getTodayDateString };
