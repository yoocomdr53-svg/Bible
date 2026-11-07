import React, { useState } from 'react';
import {
  LogOut,
  Search,
  BookOpen,
  BarChart2,
  CheckSquare,
  Mic,
  Home,
  Settings,
  ChevronRight,
  Flame,
  X,
} from 'lucide-react';
import { ActiveTab, ActiveModal, User, BibleVerse, ReadingDayPlan, UserRecording } from '../types';
import { TODAY_VERSE, POPULAR_VERSES } from '../data/bibleData';
import { BibleReaderView } from './BibleReaderView';
import { StatsView } from './StatsView';
import { ChallengeView } from './ChallengeView';
import { SettingsView } from './SettingsView';

interface BibleDashboardProps {
  user: User;
  onLogout: () => void;
  openModal: (modal: ActiveModal) => void;
  onOpenVerseCard: (verse: BibleVerse) => void;
  onOpenRecorder: (verse: BibleVerse) => void;
  readingPlans: ReadingDayPlan[];
  onTogglePlan: (day: number) => void;
  recordings: UserRecording[];
  onDeleteRecording: (id: string) => void;
}

export const BibleDashboard: React.FC<BibleDashboardProps> = ({
  user,
  onLogout,
  openModal,
  onOpenVerseCard,
  onOpenRecorder,
  readingPlans,
  onTogglePlan,
  recordings,
  onDeleteRecording,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigateToPortion = (portion: string) => {
    setActiveTab('bible');
  };

  return (
    <div
      id="dashboardView"
      className="w-full h-full bg-white flex flex-col relative overflow-hidden select-none z-20 text-slate-800"
    >
      {/* Top App Header (Brand Logo, Search, User Avatar) */}
      {activeTab !== 'bible' && (
        <header className="flex-shrink-0 bg-white border-b border-slate-100 z-30 px-4 pt-2.5 pb-2 flex items-center justify-between">
          {/* Brand: 수퍼바이블 */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            {/* Super Bible emblem */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-blue-600"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path className="text-amber-500 stroke-amber-500" d="M12 2v8m-4-4h8" strokeWidth="2.5" />
                <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 9 9" stroke="#1d4ed8" strokeWidth="2" />
                <path d="M3 20c3.5-2 6-2 9 0 3-2 5.5-2 9 0" stroke="#1d4ed8" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="text-[19px] font-black tracking-tight text-[#0083e3]">수퍼바이블</span>
          </button>

          {/* Header Action Icons */}
          <div className="flex items-center gap-2.5">
            {/* Back to ERP / Logout */}
            <button
              id="logoutBackBtn"
              type="button"
              onClick={onLogout}
              title="로그아웃 (ERP 로그인으로 돌아가기)"
              className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5 stroke-slate-700" />
            </button>

            {/* Search Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="성경 구절 및 묵상 검색"
              className="p-1.5 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5 stroke-slate-800" />
            </button>

            {/* User Profile Avatar with Google Badge */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              aria-label="내 계정 설정"
              className="relative flex items-center justify-center p-0.5 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-r from-red-500 via-amber-500 to-blue-500 shadow-xs">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <span className="text-xs font-black text-[#0083e3]">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-600 rounded-full border-2 border-white" />
            </button>
          </div>
        </header>
      )}

      {/* Main Tab Content */}
      {activeTab === 'home' && (
        <main className="flex-1 overflow-y-auto smooth-scroll no-scrollbar bg-[#f8fafc] pb-24">
          {/* User Greeting Banner */}
          <section className="bg-gradient-to-r from-blue-50 via-white to-indigo-50/60 px-4 py-3 border-b border-blue-100/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#0083e3] font-bold text-sm border border-blue-200 shadow-inner">
                    {user.avatarText}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                      <path
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        fill="#EA4335"
                      />
                    </svg>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                    <span className="inline-block bg-blue-100 text-[#0083e3] text-[10px] font-bold px-1.5 py-0.2 rounded">
                      Google 연동
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate" id="dashboardUserEmail">
                    {user.email}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    클라우드 자동 동기화됨 · 방금 동기화
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                aria-label="계정 설정"
                className="p-1 text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 text-slate-400 hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </section>

          {/* Cards & Content Area */}
          <div className="px-4 py-3 space-y-3.5">
            {/* Top Sponsor Card: 갑자기 날아든 폭탄 */}
            <section className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-soft">
              <div className="px-3.5 py-2.5 flex items-center justify-between bg-white relative">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-10 rounded bg-slate-200 flex-shrink-0 overflow-hidden relative flex items-center justify-center border border-slate-200">
                    <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14.5px] font-black text-slate-900 tracking-tight leading-tight">
                        갑자기 날아든 <span className="text-red-600">폭탄</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">무너져버린 40년의 시골교회</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openModal('sponsor')}
                  className="bg-red-700 hover:bg-red-800 text-white px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 shadow-xs flex-shrink-0 active:scale-95 transition cursor-pointer"
                >
                  <span>후원하기</span>
                  <span>→</span>
                </button>
              </div>
            </section>

            {/* Core Feature Grid (4 items) */}
            <section className="grid grid-cols-4 gap-2.5">
              {/* 1. 성경 */}
              <button
                type="button"
                onClick={() => setActiveTab('bible')}
                className="bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-soft border border-slate-100 hover:border-blue-200 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0083e3] mb-2">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-700">성경</span>
              </button>

              {/* 2. 통계 */}
              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className="bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-soft border border-slate-100 hover:border-blue-200 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0083e3] mb-2">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-700">통계</span>
              </button>

              {/* 3. 도전일독 */}
              <button
                type="button"
                onClick={() => setActiveTab('challenge')}
                className="bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-soft border border-slate-100 hover:border-blue-200 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0083e3] mb-2">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-700">도전일독</span>
              </button>

              {/* 4. 낭독녹음 */}
              <button
                type="button"
                onClick={() => onOpenRecorder(TODAY_VERSE)}
                className="bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-soft border border-slate-100 hover:border-blue-200 active:scale-95 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0083e3] mb-2">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-700">낭독녹음</span>
              </button>
            </section>

            {/* Streak Card */}
            <section className="bg-white rounded-2xl p-4 shadow-soft border border-blue-100/70">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-[#0083e3] flex items-center justify-center">
                    <Flame className="w-4 h-4 text-[#0083e3]" />
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {user.name} 성도님의 말씀 동행
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#0083e3] bg-blue-50 px-2 py-0.5 rounded-full">
                  연속 {user.consecutiveDays}일 묵상 달성 🔥
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 text-center">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-medium">신약 통독</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{user.ntProgress}%</p>
                  <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-[#0083e3] h-full rounded-full"
                      style={{ width: `${user.ntProgress}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-medium">오늘 읽은 말씀</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {user.todayVersesRead}
                    <span className="text-xs font-semibold text-slate-600">장</span>
                  </p>
                  <span className="text-[9px] text-emerald-600 font-bold mt-1 block">목표 달성</span>
                </div>

                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-500 font-medium">나의 녹음 낭독</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {recordings.length}
                    <span className="text-xs font-semibold text-slate-600">편</span>
                  </p>
                  <span className="text-[9px] text-[#0083e3] font-bold mt-1 block">
                    클라우드 백업됨
                  </span>
                </div>
              </div>
            </section>

            {/* Daily Verse Section */}
            <section className="bg-white rounded-2xl p-5 shadow-soft border border-slate-100">
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-white bg-[#0083e3] px-1.5 py-0.2 rounded">
                      맞춤 말씀
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {user.name} 성도님을 위한
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                      오늘의 말씀
                    </h2>
                    <span className="text-sm font-semibold text-[#0083e3]">
                      약 {TODAY_VERSE.chapter}:{TODAY_VERSE.verse}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenVerseCard(TODAY_VERSE)}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>💌 말씀카드</span>
                  <span>&gt;</span>
                </button>
              </div>

              <blockquote className="text-[15.5px] leading-[1.65] font-normal text-slate-800 tracking-normal border-l-2 border-[#0083e3] pl-3 py-0.5">
                {TODAY_VERSE.text}
              </blockquote>
            </section>

            {/* Sponsor Support Banner */}
            <section className="rounded-2xl p-4 bg-gradient-to-r from-[#ffe17d] via-[#fcd34d] to-[#fbbf24] shadow-soft relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-1 max-w-[210px]">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      수퍼바이블 제작동참하기
                    </h3>
                  </div>
                  <p className="text-[11px] font-medium text-slate-800 leading-snug">
                    성경보급과 복음전파는 우리의 소명입니다!
                  </p>
                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={() => openModal('sponsor')}
                      className="inline-block bg-[#ef4444] hover:bg-red-600 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      후원하기
                    </button>
                  </div>
                </div>

                <div className="relative flex-shrink-0 w-20 h-24 flex items-center justify-center">
                  <div className="w-16 h-20 bg-amber-900 rounded-md shadow-lg transform rotate-6 flex items-center justify-center border-l-4 border-amber-950">
                    <svg
                      className="w-7 h-7 text-amber-200"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 4v16m-5-11h10" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </section>

            {/* Extra Grace & Meditation Feed */}
            <section className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                  오늘의 은혜와 묵상
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('bible')}
                  className="text-[11px] text-blue-600 font-semibold cursor-pointer"
                >
                  더보기
                </button>
              </div>

              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                <div
                  onClick={() => setActiveTab('bible')}
                  className="flex-shrink-0 w-[240px] bg-white p-3.5 rounded-xl border border-slate-100 shadow-soft flex items-center gap-2.5 cursor-pointer hover:border-blue-300 transition"
                >
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">
                    N
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      오늘의 묵상
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      더 크신 하나님의 계획을 신뢰하며...
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('bible')}
                  className="flex-shrink-0 w-[240px] bg-white p-3.5 rounded-xl border border-slate-100 shadow-soft flex items-center gap-2.5 cursor-pointer hover:border-blue-300 transition"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0">
                    E
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      영어 성경 낭독
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      Journal of Faith: Psalms 23
                    </span>
                  </div>
                </div>
              </div>

              {/* Mission report banner */}
              <div className="w-full bg-slate-800 text-white p-3.5 rounded-xl shadow-soft flex items-center justify-between mt-3 bg-cover bg-center">
                <div className="space-y-0.5">
                  <span className="text-[10px] bg-amber-500/30 text-amber-300 font-semibold px-2 py-0.5 rounded">
                    선교 보고
                  </span>
                  <p className="text-xs font-bold pt-1">
                    몽골 참사랑교회 재건과 선교를 위한 기도
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openModal('sponsor')}
                  className="text-xs text-amber-300 font-bold underline flex-shrink-0 ml-2 cursor-pointer"
                >
                  소식보기
                </button>
              </div>
            </section>
          </div>
        </main>
      )}

      {activeTab === 'bible' && (
        <BibleReaderView
          onOpenVerseCard={onOpenVerseCard}
          onOpenRecorder={onOpenRecorder}
        />
      )}

      {activeTab === 'stats' && (
        <StatsView
          user={user}
          recordings={recordings}
          onDeleteRecording={onDeleteRecording}
        />
      )}

      {activeTab === 'challenge' && (
        <ChallengeView
          plans={readingPlans}
          onTogglePlan={onTogglePlan}
          onNavigateToBible={navigateToPortion}
        />
      )}

      {activeTab === 'settings' && <SettingsView user={user} onLogout={onLogout} />}

      {/* Floating Microphone Button with Badge 'N' */}
      {activeTab !== 'bible' && (
        <aside className="absolute right-5 bottom-[70px] z-40">
          <div className="relative">
            <button
              type="button"
              onClick={() => onOpenRecorder(TODAY_VERSE)}
              aria-label="빠른 음성 낭독녹음 시작"
              className="w-13 h-13 p-3.5 rounded-full bg-[#0083e3] hover:bg-blue-600 active:scale-90 text-white shadow-xl flex items-center justify-center transition-all cursor-pointer"
            >
              <Mic className="w-6 h-6" />
            </button>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
              N
            </span>
          </div>
        </aside>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="flex-shrink-0 bg-white border-t border-slate-200/90 z-30 px-2 py-1.5 flex items-center justify-around">
        {/* Tab 1: 홈 */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-3 transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#0083e3]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] font-bold mt-1">홈</span>
        </button>

        {/* Tab 2: 성경 */}
        <button
          type="button"
          onClick={() => setActiveTab('bible')}
          className={`flex flex-col items-center justify-center py-1 px-3 transition-colors cursor-pointer ${
            activeTab === 'bible' ? 'text-[#0083e3]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1">성경</span>
        </button>

        {/* Tab 3: 통계 */}
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center py-1 px-3 transition-colors cursor-pointer ${
            activeTab === 'stats' ? 'text-[#0083e3]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1">통계</span>
        </button>

        {/* Tab 4: 도전!일독 */}
        <button
          type="button"
          onClick={() => setActiveTab('challenge')}
          className={`flex flex-col items-center justify-center py-1 px-3 transition-colors cursor-pointer ${
            activeTab === 'challenge' ? 'text-[#0083e3]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1 whitespace-nowrap">도전!일독</span>
        </button>

        {/* Tab 5: 설정 */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-3 transition-colors cursor-pointer ${
            activeTab === 'settings' ? 'text-[#0083e3]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1">설정</span>
        </button>
      </nav>

      {/* Global Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="성경 본문 구절, 단어 검색 (예: 사랑, 빛, 시편)"
                autoFocus
                className="flex-1 text-sm focus:outline-none text-slate-800"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 max-h-[300px] overflow-y-auto space-y-2">
              <p className="text-[11px] text-slate-400 font-semibold px-1">추천 말씀 검색어</p>
              {POPULAR_VERSES.map((v, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSearchOpen(false);
                    setActiveTab('bible');
                  }}
                  className="p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 cursor-pointer transition text-left"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-blue-600 mb-0.5">
                    <span>
                      {v.book} {v.chapter}:{v.verse}
                    </span>
                    <span className="text-[10px] text-slate-400">{v.translation}</span>
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-2">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
