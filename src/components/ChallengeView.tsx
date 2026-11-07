import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Check,
  BellOff,
  Info,
  X,
  Share2,
  Plus,
} from 'lucide-react';
import { BIBLE_BOOKS } from '../data/bibleData';
import { ReadingDayPlan, User } from '../types';

interface ChallengeViewProps {
  user?: User;
  plans: ReadingDayPlan[];
  onTogglePlan: (day: number) => void;
  onNavigateToBible: (book: string, chapter?: number) => void;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  user,
  plans,
  onTogglePlan,
  onNavigateToBible,
}) => {
  // Sub-screens: 'main' (Image 0) | 'matrix' (Image 1) | 'plan' (Image 2)
  const [subScreen, setSubScreen] = useState<'main' | 'matrix' | 'plan'>('main');

  // Completed chapters set in Matrix (Default: 26 chapters = 2% of 1,189, matching screenshot)
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // 창세기 1~21장 (21 chapters)
    for (let i = 1; i <= 21; i++) {
      initial.add(`창세기-${i}`);
    }
    // 출애굽기 13~17장 (5 chapters, exactly highlighted in user screenshot!)
    for (let i = 13; i <= 17; i++) {
      initial.add(`출애굽기-${i}`);
    }
    return initial; // total 26 chapters!
  });

  // State for reading plan screen (Image 2)
  const [planTab, setPlanTab] = useState<'plan' | 'attendance'>('plan');
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Total Bible Chapters: 1,189
  const TOTAL_CHAPTERS = 1189;
  const readChaptersCount = completedChapters.size;
  const matrixProgressPercent = Math.round((readChaptersCount / TOTAL_CHAPTERS) * 100);

  // Toggle chapter in Matrix
  const toggleChapter = (bookName: string, ch: number) => {
    const key = `${bookName}-${ch}`;
    setCompletedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Display user name matching Image 0
  const greetingName = user?.name || 'wounhee“pollRuy”Ruy';

  // ==========================================
  // SCREEN 2: 일독 진행표 (Image 1)
  // ==========================================
  if (subScreen === 'matrix') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f8fafc] relative overflow-hidden select-none text-slate-800">
        {/* Top Header (Deep Blue #1b64b9) */}
        <header className="bg-[#1b64b9] text-white px-3 py-2.5 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubScreen('main')}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="뒤로 가기"
            >
              <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-1.5 cursor-pointer">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">일독 진행표</h1>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                ▽
              </span>
            </div>
          </div>
          <div className="w-6" />
        </header>

        {/* 66 Books Chapter Matrix List */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-4 pb-28 bg-white">
          {BIBLE_BOOKS.map((book) => {
            const chapters = Array.from({ length: book.chaptersCount }, (_, i) => i + 1);

            return (
              <div
                key={book.id}
                className="flex items-start border-b border-slate-100 pb-3.5 pt-1"
              >
                {/* Left Column: Book Name & 본문보기 > button */}
                <div className="w-20 sm:w-24 flex-shrink-0 pr-2 pt-0.5">
                  <h3 className="text-[15px] sm:text-base font-black text-[#1b64b9] leading-tight">
                    {book.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigateToBible(book.name, 1)}
                    className="mt-1.5 px-2 py-0.5 rounded-md bg-slate-500 hover:bg-slate-600 text-white text-[10px] font-bold tracking-tight flex items-center gap-0.5 transition cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <span>본문보기</span>
                    <span>&gt;</span>
                  </button>
                </div>

                {/* Right Column: 10-Column Chapter Number Grid */}
                <div className="flex-1 grid grid-cols-10 gap-1 sm:gap-1.5 justify-items-center">
                  {chapters.map((ch) => {
                    const isRead = completedChapters.has(`${book.name}-${ch}`);
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleChapter(book.name, ch)}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-90 ${
                          isRead
                            ? 'bg-[#f59e0b] text-slate-950 font-black shadow-xs'
                            : 'text-slate-800 hover:bg-slate-100'
                        }`}
                        title={`${book.name} ${ch}장 (터치하여 읽음/미완료 토글)`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Sticky Floating Status Bar (Dark Charcoal, matching screenshot) */}
        <div className="absolute left-3 right-3 bottom-3 z-30">
          <div className="bg-[#2c333e] text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-slate-700/60 backdrop-blur-md">
            {/* Top row: Plan title & percentage */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold pb-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="truncate">채은성 - 개역개정 | 구약/신약</span>
                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] flex-shrink-0">
                  ▽
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-amber-300 ml-2">
                {matrixProgressPercent}%
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden my-1">
              <div
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, matrixProgressPercent)}%` }}
              />
            </div>

            {/* Bottom row: 진행률 & chapters count */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-300 pt-1 font-semibold">
              <span>진행률</span>
              <span className="font-mono text-white">
                <span className="text-amber-300 font-bold">{readChaptersCount}</span> / {TOTAL_CHAPTERS.toLocaleString()}장
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 3: 읽기 계획표 (Image 2)
  // ==========================================
  if (subScreen === 'plan') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] relative overflow-hidden select-none text-slate-800">
        {/* Top Header (Deep Blue #1b64b9) */}
        <header className="bg-[#1b64b9] text-white px-3 py-2.5 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubScreen('main')}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="뒤로 가기"
            >
              <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">읽기 계획표</h1>
          </div>

          {/* Right: Notification Mute icon | 관리 */}
          <div className="flex items-center gap-2 text-white text-xs font-bold">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title={isMuted ? '알림 켜기' : '알림 끄기'}
            >
              <BellOff className="w-5 h-5 text-white" />
            </button>
            <span className="text-white/40">|</span>
            <button
              type="button"
              onClick={() => alert('읽기 계획표 관리 메뉴')}
              className="hover:underline cursor-pointer"
            >
              관리
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 pb-20">
          {/* Main Plan Card (통독12목표) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100">
            {/* Card Header: Open Book icon + Title & Date Range */}
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-slate-800" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                통독12목표
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-semibold mb-4 ml-7">
              2026.01.01 ~ 2026.03.01
            </p>

            {/* 3 Stats Columns */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 py-1 text-center">
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">진행률</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">0%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">연속읽기</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">0일</p>
              </div>
              <div className="cursor-pointer" onClick={() => alert('획득한 성경 통독 배지 목록')}>
                <p className="text-xs text-slate-400 font-bold mb-1 flex items-center justify-center gap-0.5">
                  <span>배지</span>
                  <span>&gt;</span>
                </p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">0개</p>
              </div>
            </div>

            {/* Cute Runner Illustration above progress bar */}
            <div className="pt-4 pb-1">
              <div className="relative w-full h-8 flex items-center">
                {/* Runner Icon */}
                <div
                  className="absolute bottom-1.5 transition-all duration-300"
                  style={{ left: '15%' }}
                >
                  <span className="text-2xl select-none" role="img" aria-label="runner">
                    🏃
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                  style={{ width: '15%' }}
                />
              </div>
            </div>

            {/* 이번주 읽기 현황 Section */}
            <div className="pt-5 border-t border-slate-100 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-800 cursor-pointer">
                  <span>📅 이번주 읽기 현황</span>
                  <span>&gt;</span>
                </div>
                <Info className="w-4 h-4 text-blue-500 cursor-pointer" />
              </div>

              {/* Day of Week Circles (일 월 화 수 목 금 토) */}
              <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => {
                  const isToday = idx === 6; // Saturday
                  return (
                    <div
                      key={day}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isToday
                          ? 'bg-blue-50 text-[#1b64b9] border border-blue-200'
                          : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabs: 읽기계획 | 출석 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button
                type="button"
                onClick={() => setPlanTab('plan')}
                className={`flex-1 py-3 text-center text-sm font-black transition cursor-pointer ${
                  planTab === 'plan'
                    ? 'text-[#1b64b9] border-b-2 border-[#1b64b9]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                읽기계획
              </button>
              <button
                type="button"
                onClick={() => setPlanTab('attendance')}
                className={`flex-1 py-3 text-center text-sm font-black transition cursor-pointer ${
                  planTab === 'attendance'
                    ? 'text-[#1b64b9] border-b-2 border-[#1b64b9]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                출석
              </button>
            </div>

            {/* Tab 1: 읽기계획 List */}
            {planTab === 'plan' && (
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1 cursor-pointer">
                  <span>읽기 현황 &gt;</span>
                  <span className="text-[11px] text-blue-600">오늘 통독 분량</span>
                </div>

                <div className="space-y-2">
                  {plans.map((p) => (
                    <div
                      key={p.day}
                      className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 flex items-center justify-between transition bg-slate-50/60"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1b64b9]">Day {p.day}</span>
                          <span className="text-xs font-semibold text-slate-800">{p.portion}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.verseRange}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateToBible('창세기', 1)}
                        className="px-3 py-1 rounded-lg bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        읽기
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: 출석 현황 */}
            {planTab === 'attendance' && (
              <div className="p-6 text-center text-slate-500 text-xs">
                <p className="font-bold text-slate-800 text-sm mb-1">성경 통독 출석부</p>
                <p>매일 성경 말씀을 낭독하고 출석 도장을 모아보세요.</p>
                <div className="mt-4 p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-800 text-xs font-semibold">
                  이번 달 총 출석일수: 14일 달성 🔥
                </div>
              </div>
            )}
          </div>

          {/* Bottom Update Notice Banner */}
          {showNotificationBanner && (
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center justify-between text-xs text-slate-700">
              <span className="font-semibold truncate">
                [업데이트 안내] 더 편리해진 ‘도전!일독’을 만나보세요
              </span>
              <button
                type="button"
                onClick={() => setShowNotificationBanner(false)}
                className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 1: 도전!일독 메인 화면 (Image 0)
  // ==========================================
  return (
    <div className="flex-1 overflow-y-auto smooth-scroll no-scrollbar bg-[#f4f7fb] pb-24 text-slate-800 p-4 space-y-4 select-none">
      {/* 1. Top Greeting Header */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1b64b9] tracking-tight">
            {greetingName}님,
          </h1>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 tracking-tight">
            말씀으로 하루를 채우세요.
          </p>
        </div>

        {/* User Profile Avatar Icon */}
        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
          <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>

      {/* 2. Dashed Action Buttons: + 읽기표 새로 만들기 | + 계획표 새로 만들기 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setSubScreen('matrix')}
          className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white/60 hover:bg-white rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1b64b9] transition-all cursor-pointer text-center shadow-2xs active:scale-98"
        >
          + 읽기표 새로 만들기
        </button>
        <button
          type="button"
          onClick={() => setSubScreen('plan')}
          className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white/60 hover:bg-white rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1b64b9] transition-all cursor-pointer text-center shadow-2xs active:scale-98"
        >
          + 계획표 새로 만들기
        </button>
      </div>

      {/* 3. Two Side-by-Side Cards: 내 전체 읽기표 (Left) vs 내 전체 계획표 (Right) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* CARD 1: 내 전체 읽기표 (Left Card) */}
        <div className="bg-white rounded-[26px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            {/* Top link pill: 내 전체 읽기표 > */}
            <div className="flex justify-center mb-3">
              <button
                type="button"
                onClick={() => setSubScreen('matrix')}
                className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100/80 text-[#1b64b9] text-xs font-bold transition cursor-pointer"
              >
                내 전체 읽기표 &gt;
              </button>
            </div>

            {/* Icon: Open Book with Checkmark */}
            <div className="flex justify-center my-3">
              <div className="w-16 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-[#1b64b9] shadow-inner relative">
                <BookOpen className="w-9 h-9 stroke-[1.8]" />
                <span className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              </div>
            </div>

            {/* Title: 채은성 */}
            <h2 className="text-base sm:text-lg font-black text-slate-900 text-center tracking-tight">
              채은성
            </h2>

            {/* Progress: 2% 진행 중 */}
            <p className="text-sm font-extrabold text-[#0284c7] text-center mt-1">
              {matrixProgressPercent}% 진행 중
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-3">
              <div
                className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, matrixProgressPercent)}%` }}
              />
            </div>
          </div>

          {/* Action Buttons: 읽기 시작 / 읽기표 보기 */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToBible('출애굽기', 18)}
              className="w-full py-2.5 rounded-xl bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition shadow-sm cursor-pointer"
            >
              읽기 시작
            </button>
            <button
              type="button"
              onClick={() => setSubScreen('matrix')}
              className="w-full py-2.5 rounded-xl border border-[#1b64b9] hover:bg-blue-50 active:scale-95 text-[#1b64b9] font-extrabold text-xs sm:text-sm transition cursor-pointer"
            >
              읽기표 보기
            </button>
          </div>
        </div>

        {/* CARD 2: 내 전체 계획표 (Right Card) */}
        <div className="bg-white rounded-[26px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            {/* Top link pill: 내 전체 계획표 > */}
            <div className="flex justify-center mb-3">
              <button
                type="button"
                onClick={() => setSubScreen('plan')}
                className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100/80 text-[#1b64b9] text-xs font-bold transition cursor-pointer"
              >
                내 전체 계획표 &gt;
              </button>
            </div>

            {/* Icon: Calendar with Checkmark */}
            <div className="flex justify-center my-3">
              <div className="w-16 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-[#1b64b9] shadow-inner relative">
                <Calendar className="w-9 h-9 stroke-[1.8]" />
                <span className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              </div>
            </div>

            {/* Title: 통독12목표 */}
            <h2 className="text-base sm:text-lg font-black text-slate-900 text-center tracking-tight">
              통독12목표
            </h2>

            {/* Progress: 0% 진행 중 */}
            <p className="text-sm font-extrabold text-[#0284c7] text-center mt-1">
              0% 진행 중
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-3">
              <div
                className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                style={{ width: '0%' }}
              />
            </div>
          </div>

          {/* Action Buttons: 오늘 읽기 / 계획표 보기 */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToBible('야고보서', 1)}
              className="w-full py-2.5 rounded-xl bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition shadow-sm cursor-pointer"
            >
              오늘 읽기
            </button>
            <button
              type="button"
              onClick={() => setSubScreen('plan')}
              className="w-full py-2.5 rounded-xl border border-[#1b64b9] hover:bg-blue-50 active:scale-95 text-[#1b64b9] font-extrabold text-xs sm:text-sm transition cursor-pointer"
            >
              계획표 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
