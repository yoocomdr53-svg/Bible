import React, { useState } from 'react';
import { CheckCircle2, Circle, Calendar, BookmarkCheck, ArrowRight } from 'lucide-react';
import { ReadingDayPlan } from '../types';

interface ChallengeViewProps {
  plans: ReadingDayPlan[];
  onTogglePlan: (day: number) => void;
  onNavigateToBible: (portion: string) => void;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  plans,
  onTogglePlan,
  onNavigateToBible,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(256);

  const completedCount = plans.filter((p) => p.completed).length;
  const totalCount = plans.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="flex-1 overflow-y-auto smooth-scroll no-scrollbar bg-[#f8fafc] pb-24 text-slate-800 p-4 space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-4 text-white shadow-soft">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
              365일 성경 일독 프로젝트
            </span>
            <h2 className="text-lg font-black tracking-tight">도전! 성경 1독</h2>
            <p className="text-xs text-blue-100">
              하루 3~4장으로 1년 만에 성경 66권을 완독합니다.
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black">{progressPercent}%</span>
            <p className="text-[10px] text-blue-200">
              {completedCount} / {totalCount}일차 달성
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-blue-900/40 h-2 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-amber-300 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Today's Highlighted Task */}
      <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-soft">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700">오늘(Day 256)의 통독 분량</span>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            야고보서 5장 - 벧전 1장
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          "주의 강림하시기까지 길이 참으라 보라 농부가 땅에서 나는 귀한 열매를 바라고 길이 참아 이른 비와 늦은 비를 기다리나니" (약 5:7)
        </p>
        <button
          onClick={() => onNavigateToBible('야고보서 5')}
          className="mt-3 w-full h-10 bg-[#0083e3] hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
        >
          <span>오늘 분량 성경 읽으러 가기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Checklist by Day */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft space-y-2.5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>이번 주 통독 체크리스트</span>
          </h3>
          <span className="text-[11px] text-slate-400">클릭하여 읽음 완료 표시</span>
        </div>

        <div className="space-y-2">
          {plans.map((p) => {
            const isToday = p.day === 256;
            return (
              <div
                key={p.day}
                onClick={() => onTogglePlan(p.day)}
                className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  p.completed
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : isToday
                    ? 'bg-blue-50/60 border-blue-300 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="cursor-pointer focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePlan(p.day);
                    }}
                  >
                    {p.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">
                        Day {p.day} ({p.date})
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.2 rounded">
                          TODAY
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{p.verseRange}</p>
                    {p.memo && (
                      <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                        ✍️ {p.memo}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToBible(p.portion);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-white/80 border border-blue-200 shadow-2xs"
                >
                  읽기
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
