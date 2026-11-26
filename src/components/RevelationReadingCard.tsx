import React, { useEffect, useState } from 'react';
import { X, Mic, ChevronRight, Flame, Target } from 'lucide-react';
import {
  REV_SECTIONS,
  REV_DAILY_GOAL_OPTIONS,
  REV_PERIOD_LABEL,
  REV_CHANGED_EVENT,
  RevPeriodStats,
  RevSectionId,
  getMyRevStats,
  saveRevSettings,
  nextChapter,
} from '../services/revelationService';

interface Props {
  userEmail?: string;
  /** 해당 장을 낭독(녹음) 화면으로 연다 */
  onReadChapter: (chapter: number) => void;
}

function barColor(p: number): string {
  if (p >= 100) return 'bg-emerald-500';
  if (p >= 60) return 'bg-[#0083e3]';
  if (p >= 30) return 'bg-amber-500';
  return 'bg-rose-400';
}

const ProgressRow: React.FC<{ s: RevPeriodStats; compact?: boolean }> = ({ s, compact }) => {
  const behind = s.period !== 'day' && s.read < s.goalSoFar;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className={`font-bold text-slate-700 ${compact ? 'text-[11px]' : 'text-xs'}`}>{REV_PERIOD_LABEL[s.period]}</span>
        <span className={`text-slate-500 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          <b className="text-slate-800">{s.read}</b> / {s.goal}장 · <b className="text-slate-800">{s.percent}%</b>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor(s.percent)}`} style={{ width: `${s.percent}%` }} />
      </div>
      {!compact && s.period !== 'day' && (
        <p className={`text-[10px] ${behind ? 'text-rose-500' : 'text-emerald-600'}`}>
          오늘까지 목표 {s.goalSoFar}장 {behind ? `· ${s.goalSoFar - s.read}장 부족` : '· 잘 따라가고 있어요'}
        </p>
      )}
    </div>
  );
};

export const RevelationReadingCard: React.FC<Props> = ({ userEmail, onReadChapter }) => {
  const [stats, setStats] = useState(() => getMyRevStats(userEmail));
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setStats(getMyRevStats(userEmail));
    refresh();
    window.addEventListener(REV_CHANGED_EVENT, refresh);
    window.addEventListener('superbible_today_read_changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener(REV_CHANGED_EVENT, refresh);
      window.removeEventListener('superbible_today_read_changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [userEmail]);

  const sec = REV_SECTIONS[stats.settings.section];
  const next = nextChapter(userEmail);

  const setSection = (id: RevSectionId) => saveRevSettings({ ...stats.settings, section: id }, userEmail);
  const setGoal = (g: number) => saveRevSettings({ ...stats.settings, dailyGoal: g }, userEmail);

  return (
    <>
      {/* ── 홈 카드 ── */}
      <section
        className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft border border-slate-100 space-y-3 cursor-pointer hover:border-blue-200 transition"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black">계</span>
            <div>
              <h3 className="text-sm font-black text-slate-800 leading-tight">계시록 낭독관리</h3>
              <p className="text-[11px] text-slate-500">
                {sec.label} ({sec.title}) · 하루 {stats.settings.dailyGoal}장 목표
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            {stats.streak > 0 && (
              <span className="flex items-center gap-0.5 text-orange-500 font-bold mr-1">
                <Flame className="w-3.5 h-3.5" />
                {stats.streak}일
              </span>
            )}
            자세히
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2">
          <ProgressRow s={stats.day} compact />
          <ProgressRow s={stats.week} compact />
          <ProgressRow s={stats.month} compact />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReadChapter(next);
          }}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
        >
          <Mic className="w-4 h-4" />
          계시록 {next}장 낭독하기
        </button>
      </section>

      {/* ── 상세 화면 ── */}
      {open && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div
            className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-800">📕 계시록 낭독관리</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100" aria-label="닫기">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* 구간 선택 */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600">낭독 구간</p>
              <div className="grid grid-cols-2 gap-2">
                {(['A', 'B'] as RevSectionId[]).map((id) => {
                  const s = REV_SECTIONS[id];
                  const on = stats.settings.section === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSection(id)}
                      className={`rounded-2xl border-2 py-3 text-center transition ${
                        on ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-black">{s.label}</div>
                      <div className="text-[11px]">{s.title}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 하루 목표 */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> 하루 목표
              </p>
              <div className="flex gap-2">
                {REV_DAILY_GOAL_OPTIONS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold border transition ${
                      stats.settings.dailyGoal === g ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {g === 11 ? '11장(1회독)' : `${g}장`}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                주간 목표 {stats.week.goal}장 · 월간 목표 {stats.month.goal}장 (하루 목표 × 일수)
              </p>
            </div>

            {/* 진행률 */}
            <div className="space-y-3 bg-slate-50 rounded-2xl p-4">
              <ProgressRow s={stats.day} />
              <ProgressRow s={stats.week} />
              <ProgressRow s={stats.month} />
            </div>

            {/* 장별 현황 (이번 달) */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600">
                {sec.label} 장별 현황 <span className="font-normal text-slate-400">(이번 달 낭독한 장 · 눌러서 낭독)</span>
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {Array.from({ length: sec.end - sec.start + 1 }, (_, i) => sec.start + i).map((ch) => {
                  const today = stats.day.chapters.includes(ch);
                  const month = stats.month.chapters.includes(ch);
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onReadChapter(ch);
                      }}
                      className={`aspect-square rounded-xl text-xs font-bold border transition ${
                        today
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : month
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                      } ${ch === next ? 'ring-2 ring-indigo-400' : ''}`}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />오늘</span>
                <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded bg-indigo-100 border border-indigo-200 inline-block" />이번 달</span>
                <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded ring-2 ring-indigo-400 inline-block" />다음 장</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReadChapter(next);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              <Mic className="w-4 h-4" /> 계시록 {next}장 낭독하기
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              낭독 녹음을 저장하면 자동으로 기록됩니다 (같은 날 같은 장은 1번으로 계산)
            </p>
          </div>
        </div>
      )}
    </>
  );
};
