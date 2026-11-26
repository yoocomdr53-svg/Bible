import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { MemberReadingProfile } from '../data/adminData';
import { REV_SECTIONS, RevMemberRow, RevPeriod, fetchRevelationAdminRows } from '../services/revelationService';

interface Props {
  members: MemberReadingProfile[];
}

function pctColor(p: number): string {
  if (p >= 100) return 'text-emerald-600';
  if (p >= 60) return 'text-[#0083e3]';
  if (p >= 30) return 'text-amber-600';
  return 'text-rose-500';
}

const Cell: React.FC<{ read: number; goal: number; percent: number }> = ({ read, goal, percent }) => (
  <td className="px-2 py-2 text-center whitespace-nowrap">
    <div className={`text-xs font-black ${pctColor(percent)}`}>{percent}%</div>
    <div className="text-[10px] text-slate-400">
      {read}/{goal}장
    </div>
  </td>
);

export const RevelationAdminPanel: React.FC<Props> = ({ members }) => {
  const [rows, setRows] = useState<RevMemberRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<'all' | 'A' | 'B'>('all');
  const [sortBy, setSortBy] = useState<RevPeriod>('month');
  const [loadedAt, setLoadedAt] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchRevelationAdminRows();
    if (res.success) {
      setRows(res.rows);
      setLoadedAt(new Date().toLocaleTimeString('ko-KR'));
    } else {
      setError(res.message || '구글 시트에서 계시록 기록을 불러오지 못했습니다.');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // 현재 회원 명부에 있는 사람만 (삭제된 회원 제외) + 회원번호·이름은 명부 기준
  const view = useMemo(() => {
    const byEmail = new Map<string, MemberReadingProfile>(members.map((m) => [(m.email || "").toLowerCase().trim(), m] as [string, MemberReadingProfile]));
    return rows
      .filter((r) => byEmail.has(r.email))
      .map((r) => {
        const m = byEmail.get(r.email)!;
        return { ...r, name: m.name || r.name, memberId: m.id || r.memberId, department: m.department };
      })
      .filter((r) => sectionFilter === 'all' || r.settings.section === sectionFilter)
      .sort((a, b) => b[sortBy].percent - a[sortBy].percent || a.name.localeCompare(b.name));
  }, [rows, members, sectionFilter, sortBy]);

  const avg = (p: RevPeriod) => (view.length ? Math.round(view.reduce((s, r) => s + r[p].percent, 0) / view.length) : 0);
  const countA = view.filter((r) => r.settings.section === 'A').length;
  const countB = view.filter((r) => r.settings.section === 'B').length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-black text-slate-800">📕 계시록 낭독 현황</h3>
            <p className="text-[11px] text-slate-500">
              구글 시트 [계시록_낭독기록] 기준 · 목표 대비 달성률 (하루 목표 × 기간 일수)
              {loadedAt && ` · ${loadedAt} 기준`}
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['day', 'week', 'month'] as RevPeriod[]).map((p) => (
            <div key={p} className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-[11px] text-slate-500">{p === 'day' ? '오늘' : p === 'week' ? '이번 주' : '이번 달'} 평균</div>
              <div className={`text-lg font-black ${pctColor(avg(p))}`}>{avg(p)}%</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500">구간</span>
          {([
            ['all', `전체 (${countA + countB})`],
            ['A', `${REV_SECTIONS.A.label} (${countA})`],
            ['B', `${REV_SECTIONS.B.label} (${countB})`],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSectionFilter(id)}
              className={`px-2.5 py-1 rounded-lg font-bold border ${
                sectionFilter === id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto text-slate-500">정렬</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as RevPeriod)}
            className="border border-slate-200 rounded-lg px-2 py-1 text-xs"
          >
            <option value="day">오늘 달성률</option>
            <option value="week">이번 주 달성률</option>
            <option value="month">이번 달 달성률</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs">
          {error}
          <div className="text-[11px] text-rose-500 mt-1">
            구글 Apps Script 가 최신(v4.1 이상)인지 확인하세요. [계시록_낭독기록] 시트가 필요합니다.
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-2 py-2 text-left">회원</th>
              <th className="px-2 py-2">구간</th>
              <th className="px-2 py-2">일목표</th>
              <th className="px-2 py-2">오늘</th>
              <th className="px-2 py-2">이번 주</th>
              <th className="px-2 py-2">이번 달</th>
              <th className="px-2 py-2">최근 낭독</th>
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={r.email} className="border-t border-slate-100">
                <td className="px-2 py-2">
                  <div className="font-bold text-slate-800">{r.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {r.memberId} · {(r as any).department}
                  </div>
                </td>
                <td className="px-2 py-2 text-center whitespace-nowrap">{REV_SECTIONS[r.settings.section].label}</td>
                <td className="px-2 py-2 text-center">{r.settings.dailyGoal}장</td>
                <Cell {...r.day} />
                <Cell {...r.week} />
                <Cell {...r.month} />
                <td className="px-2 py-2 text-center text-[11px] text-slate-500 whitespace-nowrap">{r.lastDate || '-'}</td>
              </tr>
            ))}
            {!loading && view.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  아직 계시록 낭독 기록이 없습니다. 성도들이 홈 화면 [계시록 낭독관리]에서 낭독하면 여기에 나타납니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
