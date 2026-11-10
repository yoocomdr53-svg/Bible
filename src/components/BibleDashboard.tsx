import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  Volume2,
  Music,
  RefreshCw,
  X,
} from 'lucide-react';
import { ActiveTab, ActiveModal, User, BibleVerse, ReadingDayPlan, UserRecording } from '../types';
import {
  TODAY_VERSE,
  POPULAR_VERSES,
  DAILY_GRACE_VERSES,
  getAutoDailyVerse,
  getBibleAbbreviation,
  getCurrentReadingLocation,
  saveCurrentReadingLocation,
} from '../data/bibleData';
import { BibleReaderView } from './BibleReaderView';
import { StatsView } from './StatsView';
import { ChallengeView } from './ChallengeView';
import { SettingsView } from './SettingsView';
import { BibleSelectorView } from './BibleSelectorView';
import { AdminBibleManagementView } from './AdminBibleManagementView';
import { HymnView } from './HymnView';
import { AppInstallModal } from './AppInstallModal';
import { APP_NAME, APP_VERSION } from '../version';

interface BibleDashboardProps {
  user: User;
  onLogout: () => void;
  onToggleRole?: () => void;
  openModal: (modal: ActiveModal) => void;
  onOpenVerseCard: (verse: BibleVerse) => void;
  onOpenRecorder: (verse: BibleVerse) => void;
  readingPlans: ReadingDayPlan[];
  onTogglePlan: (day: number) => void;
  recordings: UserRecording[];
  onDeleteRecording: (id: string) => void;
  onOpenInstall?: () => void;
}

export const BibleDashboard: React.FC<BibleDashboardProps> = ({
  user,
  onLogout,
  onToggleRole,
  openModal,
  onOpenVerseCard,
  onOpenRecorder,
  readingPlans,
  onTogglePlan,
  recordings,
  onDeleteRecording,
  onOpenInstall,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 'selector' = 3-step selection screen (성경 -> 장 -> 절)
  // 'reader' = scripture verse reading screen
  const [bibleSubView, setBibleSubView] = useState<'selector' | 'reader'>('selector');
  const [bibleSelectorStep, setBibleSelectorStep] = useState<'book' | 'chapter' | 'verse'>('book');
  const [openInRecordingMode, setOpenInRecordingMode] = useState(false);
  const [readerLocation, setReaderLocation] = useState<{
    book: string;
    chapter: number;
    verse: number;
  }>(() => {
    const loc = getCurrentReadingLocation();
    return {
      book: loc.book || '출애굽기',
      chapter: loc.chapter || 24,
      verse: 1,
    };
  });

  // Today's Verse (오늘의 말씀 - 날짜별 자동 수정/갱신 및 순환 관리)
  const [todayVerse, setTodayVerse] = useState<BibleVerse>(() => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const saved = localStorage.getItem('superbible_today_verse_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr && parsed.verse) {
          return parsed.verse;
        }
      }
    } catch (e) {}
    return getAutoDailyVerse();
  });

  // 매일 자정 또는 날짜 변경 시 오늘의 말씀 자동 갱신
  useEffect(() => {
    const updateAutoDailyVerse = () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      try {
        const saved = localStorage.getItem('superbible_today_verse_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.date === todayStr && parsed.verse) {
            setTodayVerse(parsed.verse);
            return;
          }
        }
      } catch (e) {}
      setTodayVerse(getAutoDailyVerse());
    };

    updateAutoDailyVerse();
    const interval = setInterval(updateAutoDailyVerse, 60000); // 1분마다 자정 전환 체크
    return () => clearInterval(interval);
  }, []);

  // 다른 은혜의 말씀으로 교체 (자동 추천 목록 순환)
  const handleCycleTodayVerse = () => {
    const currentIndex = DAILY_GRACE_VERSES.findIndex(
      (v) => v.book === todayVerse.book && v.chapter === todayVerse.chapter && v.verse === todayVerse.verse
    );
    const nextIndex = (currentIndex + 1) % DAILY_GRACE_VERSES.length;
    const nextVerse = DAILY_GRACE_VERSES[nextIndex];
    setTodayVerse(nextVerse);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem('superbible_today_verse_v1', JSON.stringify({ date: todayStr, verse: nextVerse }));
    } catch (e) {}
  };

  // ChallengeView initial screen & book state
  const [challengeInitialSubScreen, setChallengeInitialSubScreen] = useState<
    'main' | 'matrix' | 'plan' | 'create-plan' | 'edit-plan' | 'total-progress' | 'chapter-grid'
  >('main');
  const [challengeSelectedBook, setChallengeSelectedBook] = useState('창세기');
  // Key to force remount/reset of ChallengeView when tapping bottom tab or home button
  const [challengeKey, setChallengeKey] = useState(0);

  // Navigation history stack for global back navigation
  const [navHistory, setNavHistory] = useState<
    {
      tab: ActiveTab;
      bibleSubView?: 'selector' | 'reader';
      challengeSubScreen?: 'main' | 'matrix' | 'plan' | 'create-plan' | 'edit-plan' | 'total-progress' | 'chapter-grid';
      challengeBook?: string;
    }[]
  >([]);

  const pushHistory = (entry: {
    tab: ActiveTab;
    bibleSubView?: 'selector' | 'reader';
    challengeSubScreen?: 'main' | 'matrix' | 'plan' | 'create-plan' | 'edit-plan' | 'total-progress' | 'chapter-grid';
    challengeBook?: string;
  }) => {
    setNavHistory((prev) => [...prev, entry]);
  };

  const handleBackFromReader = () => {
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory((p) => p.slice(0, -1));
      setActiveTab(prev.tab);
      if (prev.tab === 'challenge') {
        setChallengeInitialSubScreen(prev.challengeSubScreen || 'chapter-grid');
        if (prev.challengeBook) {
          setChallengeSelectedBook(prev.challengeBook);
        }
      } else if (prev.tab === 'bible') {
        setBibleSubView('selector');
      }
    } else {
      // If no history, default back to challenge main
      setChallengeInitialSubScreen('main');
      setActiveTab('challenge');
    }
  };

  // Tapping "도전!일독" (from Home icon OR bottom nav bar)
  // ALWAYS resets directly to the root 도전!일독 main screen (Image 0/3)
  const handleOpenChallenge = () => {
    setChallengeInitialSubScreen('main');
    setChallengeKey((k) => k + 1);
    setActiveTab('challenge');
  };

  // Tapping "성경" (from Home icon OR bottom nav bar)
  // IMMEDIATELY opens the 3-step selection screen (성경화면 -> 장화면 -> 절화면)
  const handleOpenBibleSelector = () => {
    if (activeTab !== 'bible') {
      pushHistory({
        tab: activeTab,
        challengeSubScreen: challengeInitialSubScreen,
        challengeBook: challengeSelectedBook,
      });
    }
    setOpenInRecordingMode(false);
    setBibleSubView('selector');
    setBibleSelectorStep('book');
    setActiveTab('bible');
  };

  const navigateToPortion = (portion: string, chapter?: number, verse?: number) => {
    const book = portion.split(' ')[0] || '출애굽기';
    const ch = chapter || Number(portion.split(' ')[1]) || 1;
    const v = verse || 1;
    saveCurrentReadingLocation(book, ch);
    pushHistory({
      tab: activeTab,
      bibleSubView,
      challengeSubScreen: challengeInitialSubScreen,
      challengeBook: challengeSelectedBook,
    });
    setReaderLocation({ book, chapter: ch, verse: v });
    setActiveTab('bible');
    setBibleSubView('reader');
  };

  return (
    <div
      id="dashboardView"
      className="w-full h-full bg-white flex flex-col relative overflow-hidden select-none z-20 text-slate-800"
    >
      {/* Top App Header (Brand Logo, Search, User Avatar) */}
      {activeTab !== 'bible' && activeTab !== 'admin' && activeTab !== 'hymn' && (
        <header className="flex-shrink-0 bg-white border-b border-slate-100 z-30 px-3.5 sm:px-4 pt-2.5 pb-2 flex items-center justify-between">
          {/* Brand: SuperBible Ver 0.3 with High Quality App Icon */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <img
              src="/icon-192.png"
              alt="SuperBible"
              className="w-8 h-8 rounded-xl shadow-xs object-cover border border-blue-100"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-[19px] font-black tracking-tight text-[#0083e3]">{APP_NAME}</span>
              <span className="text-[10px] font-extrabold bg-blue-50 text-[#0083e3] px-1.5 py-0.5 rounded-full border border-blue-200/80">
                {APP_VERSION}
              </span>
            </div>
          </button>

          {/* Header Action Icons */}
          <div className="flex items-center gap-2">
            {/* App Install Button (Android APK / Tablet / PWA) */}
            <button
              type="button"
              onClick={() => (onOpenInstall ? onOpenInstall() : setShowInstallModal(true))}
              className="bg-[#fef3c7] hover:bg-[#fde68a] active:scale-95 border border-amber-300 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs transition cursor-pointer"
              title="SuperBible 모바일 / 태블릿 앱 설치 (APK / PWA)"
            >
              <span>📱</span>
              <span>앱 설치</span>
            </button>

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

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-extrabold text-slate-900 leading-snug">
                      {(user.name || '성도').replace(/\s*\([^)]*@?[^)]*\)$/, '').trim()}
                    </span>
                    <span className="inline-flex items-center bg-blue-100 text-[#0083e3] text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                      Google 연동
                    </span>
                    {user.role === 'admin' && (
                      <span className="inline-flex items-center bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0">
                        👑 관리자
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5" id="dashboardUserEmail">
                    {user.email}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping flex-shrink-0" />
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
            {/* Admin Management Quick Banner: 👑 관리자 성경관리 (관리자 접속 시에만 노출) */}
            {user.role === 'admin' && (
              <section
                onClick={() => {
                  pushHistory({ tab: activeTab });
                  setActiveTab('admin');
                }}
                className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-2xl p-3 sm:p-3.5 text-white shadow-md border border-slate-700/70 cursor-pointer active:scale-98 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                    👑
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-white truncate">관리자 성경관리</span>
                      <span className="text-[10px] bg-blue-600 text-blue-100 font-bold px-1.5 py-0.2 rounded-full flex-shrink-0">
                        관리자 전용
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                      회원 낭독 현황 · 음원 검수 · 12목표 체계적 관리
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition flex-shrink-0 ml-2" />
              </section>
            )}

            {/* Dedicated Mobile & Tablet App Install Banner on Home */}
            <section
              onClick={() => (onOpenInstall ? onOpenInstall() : setShowInstallModal(true))}
              className="bg-gradient-to-r from-blue-600 via-[#0083e3] to-sky-500 rounded-2xl p-3 sm:p-3.5 text-white shadow-soft flex items-center justify-between gap-3 cursor-pointer hover:shadow-md transition active:scale-[0.99] border border-blue-400/30"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                  📲
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black bg-amber-300 text-slate-950 px-1.5 py-0.5 rounded-md shadow-2xs">
                      스마트폰·태블릿
                    </span>
                    <span className="text-xs font-bold text-blue-100">SuperBible 전용 앱 설치</span>
                  </div>
                  <p className="text-[12px] font-bold text-white truncate mt-0.5">
                    홈 화면에 바로가기 추가 및 APK 파일 설치하기
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0 bg-white hover:bg-slate-50 text-[#0083e3] text-xs font-black px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1">
                <span>앱설치</span>
                <span>→</span>
              </div>
            </section>

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

            {/* 통계자료 전체 화면 (중복 5개 메뉴 및 스트릭 카드 자리에 전면 이동) */}
            <StatsView
              user={user}
              recordings={recordings}
              onDeleteRecording={onDeleteRecording}
              onNavigateToRecord={() => {
                setOpenInRecordingMode(true);
                setBibleSubView('reader');
                setActiveTab('bible');
              }}
              isEmbedded={true}
            />

            {/* Daily Verse Section (오늘의 말씀 - 날짜별 365일 자동 갱신 및 순환 교체) */}
            <section className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-white bg-[#0083e3] px-2 py-0.5 rounded-full shadow-2xs">
                      매일 자동 갱신
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {user.name} 성도님을 위한 오늘의 은혜
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                      오늘의 말씀
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigateToPortion(todayVerse.book, todayVerse.chapter, todayVerse.verse)}
                      className="text-sm font-black text-[#0083e3] hover:underline cursor-pointer flex items-center gap-1 transition"
                      title={`${todayVerse.book} ${todayVerse.chapter}장으로 이동`}
                    >
                      <span>{getBibleAbbreviation(todayVerse.book)} {todayVerse.chapter}:{todayVerse.verse}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCycleTodayVerse}
                    className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#0083e3] rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 border border-sky-100"
                    title="다른 은혜의 말씀으로 자동 교체"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">다른 말씀</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenVerseCard(todayVerse)}
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 border border-red-100"
                  >
                    <span>💌 말씀카드</span>
                  </button>
                </div>
              </div>

              <blockquote className="text-[15.5px] leading-[1.65] font-normal text-slate-800 tracking-normal border-l-3 border-[#0083e3] pl-3.5 py-1 bg-slate-50/50 rounded-r-xl">
                {todayVerse.text}
              </blockquote>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <span>📅</span>
                  <span>{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} 말씀</span>
                </span>
                <button
                  type="button"
                  onClick={() => navigateToPortion(todayVerse.book, todayVerse.chapter, todayVerse.verse)}
                  className="text-xs text-[#0083e3] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>본문 읽기 ({todayVerse.book} {todayVerse.chapter}장) &gt;</span>
                </button>
              </div>
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
                      SuperBible 제작동참하기
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
        bibleSubView === 'selector' ? (
          <BibleSelectorView
            initialBook={readerLocation.book}
            initialChapter={readerLocation.chapter}
            initialVerse={readerLocation.verse}
            initialStep={bibleSelectorStep}
            onClose={() => setActiveTab('home')}
            onSelectVerse={(book, chapter, verse) => {
              setReaderLocation({ book, chapter, verse });
              setBibleSubView('reader');
            }}
            onGoToReading={(book, chapter, verse) => {
              setReaderLocation({ book, chapter, verse });
              setBibleSubView('reader');
            }}
          />
        ) : (
          <BibleReaderView
            initialBook={readerLocation.book}
            initialChapter={readerLocation.chapter}
            initialVerse={readerLocation.verse}
            initialRecordingMode={openInRecordingMode}
            onBack={handleBackFromReader}
            onBackToHome={() => setActiveTab('home')}
            onGoToChallenge={() => setActiveTab('challenge')}
            onBackToSelector={() => {
              setBibleSelectorStep('book');
              setBibleSubView('selector');
            }}
            onOpenVerseCard={onOpenVerseCard}
            onOpenRecorder={onOpenRecorder}
          />
        )
      )}

      {activeTab === 'hymn' && (
        <HymnView
          onBackToHome={() => setActiveTab('home')}
          onNavigateToBible={(book, chapter, verse) => {
            setReaderLocation({ book, chapter: chapter || 1, verse: verse || 1 });
            setBibleSubView('reader');
            setActiveTab('bible');
          }}
        />
      )}

      {activeTab === 'stats' && (
        <StatsView
          user={user}
          recordings={recordings}
          onDeleteRecording={onDeleteRecording}
          onNavigateToRecord={() => {
            setOpenInRecordingMode(true);
            setBibleSubView('reader');
            setActiveTab('bible');
          }}
        />
      )}

      {activeTab === 'challenge' && (
        <ChallengeView
          key={challengeKey}
          user={user}
          plans={readingPlans}
          onTogglePlan={onTogglePlan}
          onNavigateToBible={navigateToPortion}
          initialSubScreen={challengeInitialSubScreen}
          initialBook={challengeSelectedBook}
          onSubScreenChange={(screen, book) => {
            setChallengeInitialSubScreen(screen);
            if (book) setChallengeSelectedBook(book);
          }}
          onBackToHome={() => setActiveTab('home')}
          onOpenAdminManagement={() => {
            pushHistory({
              tab: 'challenge',
              challengeSubScreen: challengeInitialSubScreen,
              challengeBook: challengeSelectedBook,
            });
            setActiveTab('admin');
          }}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsView
          user={user}
          onLogout={onLogout}
          onToggleRole={onToggleRole}
          onOpenAdmin={() => {
            pushHistory({ tab: 'settings' });
            setActiveTab('admin');
          }}
        />
      )}

      {/* Admin Bible & Recitation Management View (관리자 전용 접근 보호) */}
      {activeTab === 'admin' && (
        user.role === 'admin' ? (
          <AdminBibleManagementView
            user={user}
            onBack={() => {
              if (navHistory.length > 0) {
                const prev = navHistory[navHistory.length - 1];
                setNavHistory((p) => p.slice(0, -1));
                setActiveTab(prev.tab);
                if (prev.challengeSubScreen) {
                  setChallengeInitialSubScreen(prev.challengeSubScreen);
                }
                if (prev.challengeBook) {
                  setChallengeSelectedBook(prev.challengeBook);
                }
              } else {
                setActiveTab('home');
              }
            }}
            onNavigateToBible={navigateToPortion}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#f8fafc]">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-3xl mb-3 shadow-inner">
              🔒
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">관리자 전용 메뉴입니다</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs leading-relaxed">
              성경낭독 관리는 교회 관리자 및 목회자 계정으로 접속했을 때만 열람하실 수 있습니다.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                홈으로 돌아가기
              </button>
              {onToggleRole && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleRole();
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
                >
                  👑 관리자 권한으로 전환
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* Floating Microphone Button with Badge 'N' */}
      {activeTab !== 'bible' && activeTab !== 'admin' && activeTab !== 'hymn' && (
        <aside className="absolute right-5 bottom-[70px] z-40">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenInRecordingMode(true);
                setBibleSubView('reader');
                setActiveTab('bible');
              }}
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

      {/* Bottom Navigation Bar (홈 | 성경 | 찬송 | 도전!일독 | 설정 - Exact match to user screenshot) */}
      {activeTab !== 'admin' && (
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

        {/* Tab 2: 성경 (누르면 성경화면 -> 장화면 -> 절화면 3단계 즉시 시작) */}
        <button
          type="button"
          onClick={handleOpenBibleSelector}
          className={`flex flex-col items-center justify-center py-1 px-3 transition-colors cursor-pointer ${
            activeTab === 'bible' ? 'text-[#0083e3]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1">성경</span>
        </button>

        {/* Tab 3: 찬송 */}
        <button
          type="button"
          onClick={() => setActiveTab('hymn')}
          className={`flex flex-col items-center justify-center py-1 px-3 transition-colors cursor-pointer ${
            activeTab === 'hymn' ? 'text-[#0083e3]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Music className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1 whitespace-nowrap">찬송</span>
        </button>

        {/* Tab 4: 도전!일독 */}
        <button
          type="button"
          onClick={handleOpenChallenge}
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
      )}

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

      {/* SuperBible App Installation & APK Modal */}
      <AppInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
