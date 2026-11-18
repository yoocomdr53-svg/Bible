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
  Share2,
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
  initialTab?: ActiveTab;
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
  initialTab,
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
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab || 'home');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
          {/* Brand: SuperBible Ver with High Quality App Icon */}
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none text-left"
          >
            <img
              src="/icon-192.png"
              alt="SuperBible"
              className="w-8 h-8 rounded-xl shadow-xs object-cover border border-blue-100 flex-shrink-0"
            />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[18px] sm:text-[19px] font-black tracking-tight text-[#0083e3]">
                {APP_NAME}
              </span>
              <span className="text-[10px] font-extrabold text-blue-500/85 mt-0.5 tracking-wide">
                {APP_VERSION}
              </span>
            </div>
          </button>

          {/* Header Action Icons */}
          <div className="flex items-center gap-2">
            {/* Back to ERP / Logout */}
            <button
              id="logoutBackBtn"
              type="button"
              onClick={() => {
                if (window.confirm('SuperBible 앱에서 나가시겠습니까? (로그아웃)')) {
                  onLogout();
                }
              }}
              title="앱에서 나가기 (로그아웃)"
              className="p-1.5 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
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
          <div className="px-4 py-3.5 space-y-4">
            {/* 1. Spiritual Greeting Banner */}
            <section className="bg-gradient-to-br from-[#0b2b4f] via-[#103e6d] to-[#1b64b9] rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden border border-blue-900/40">
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                    오늘의 성경 통독
                  </span>
                  <span className="text-xs text-blue-200 font-medium">
                    {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                  말씀으로 시작하는 은혜의 하루
                </h1>
                <p className="text-xs sm:text-[13px] text-blue-100/90 leading-relaxed max-w-xl">
                  {(user.name || '성도').replace(/\s*\([^)]*@?[^)]*\)$/, '').trim()} 성도님, 오늘도 주님의 거룩한 말씀 안에서 평안과 새 힘을 얻으시기를 축복합니다.
                </p>
              </div>
            </section>

            {/* 2. Daily Verse Section (오늘의 은혜의 말씀 - 영적 중심) */}
            <section className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft border border-slate-100 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-white bg-[#0083e3] px-2 py-0.5 rounded-full shadow-2xs">
                      매일 은혜의 말씀
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      오늘 나에게 주시는 생명의 양식
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

                <button
                  type="button"
                  onClick={handleCycleTodayVerse}
                  className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-[#0083e3] rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 border border-sky-100 shadow-2xs"
                  title="다른 은혜의 말씀으로 교체"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>다른 말씀</span>
                </button>
              </div>

              <blockquote className="text-[15.5px] leading-[1.7] font-medium text-slate-800 tracking-normal border-l-4 border-[#0083e3] pl-4 py-2 bg-slate-50/70 rounded-r-2xl">
                "{todayVerse.text}"
              </blockquote>

              {/* 3 Quick Action Buttons for Today's Verse */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigateToPortion(todayVerse.book, todayVerse.chapter, todayVerse.verse)}
                  className="py-2 px-2 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 text-[#0083e3] font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-blue-100"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>본문 읽기</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenRecorder(todayVerse)}
                  className="py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-emerald-100"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>낭독 녹음</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenVerseCard(todayVerse)}
                  className="py-2 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-amber-200/70"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>말씀 카드</span>
                </button>
              </div>
            </section>

            {/* 3. Daily 12-Round Reading Plan Card (거룩한 통독 대장정) */}
            <section className="bg-gradient-to-br from-white via-sky-50/40 to-blue-50/50 rounded-3xl p-4 sm:p-5 shadow-soft border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                    2026 전교인 성경 12독 대장정
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    오늘의 추천 통독: 창세기 1 ~ 5장
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigateToPortion('창세기', 1)}
                  className="bg-[#0083e3] hover:bg-blue-600 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <span>지금 읽기</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Summary Bar */}
              <div className="space-y-1.5 bg-white p-3 rounded-2xl border border-blue-100/60 shadow-2xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">나의 성경 통독 현황</span>
                  <span className="font-extrabold text-[#0083e3]">
                    {Math.floor(((user.totalReadChapters || 0) / 1189) * 100)}% 달성 ({user.totalReadChapters || 0} / 1,189장)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-[#0083e3] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, ((user.totalReadChapters || 0) / 1189) * 100))}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 flex items-center justify-between pt-0.5">
                  <span>🎯 목표: 1년 12회 완독</span>
                  <span className="text-[#0083e3] font-bold">현재 {user.currentReadingRound || 0}독 진행 중</span>
                </p>
              </div>
            </section>

            {/* 4. Core 4 Features Navigation Grid (핵심 4대 기능 퀵 액세스) */}
            <section className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                주요 성경 및 찬양 기능
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1) 성경 66권 전체 읽기 */}
                <button
                  type="button"
                  onClick={handleOpenBibleSelector}
                  className="bg-white hover:bg-blue-50/50 p-3.5 rounded-2xl border border-slate-200/80 shadow-soft text-left transition active:scale-[0.98] cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0083e3] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0083e3] transition-colors">
                    성경 읽기 (66권)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    구약 39권 · 신약 27권 전체
                  </p>
                </button>

                {/* 2) 말씀 낭독 & 음원 녹음실 */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenInRecordingMode(true);
                    setBibleSubView('reader');
                    setActiveTab('bible');
                  }}
                  className="bg-white hover:bg-emerald-50/50 p-3.5 rounded-2xl border border-slate-200/80 shadow-soft text-left transition active:scale-[0.98] cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Mic className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    말씀 낭독 & 녹음실
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    내 목소리로 녹음하고 저장
                  </p>
                </button>

                {/* 3) 새찬송가 645장 전곡 */}
                <button
                  type="button"
                  onClick={() => {
                    pushHistory({ tab: activeTab });
                    setActiveTab('hymn');
                  }}
                  className="bg-white hover:bg-amber-50/50 p-3.5 rounded-2xl border border-slate-200/80 shadow-soft text-left transition active:scale-[0.98] cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <Music className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                    새찬송가 (645장)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    전곡 음원 스트리밍 & 가사
                  </p>
                </button>

                {/* 4) 1년 12독 통독 대장정 */}
                <button
                  type="button"
                  onClick={() => {
                    pushHistory({ tab: activeTab });
                    setActiveTab('challenge');
                  }}
                  className="bg-white hover:bg-purple-50/50 p-3.5 rounded-2xl border border-slate-200/80 shadow-soft text-left transition active:scale-[0.98] cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                    12독 통독 대장정
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    전교인 통독 현황 및 진도표
                  </p>
                </button>
              </div>
            </section>

            {/* 5. Grace & Daily Meditation Article (따뜻하고 은혜로운 묵상과 기도) */}
            <section className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft border border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0083e3]" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  오늘의 묵상과 평안의 기도
                </h3>
              </div>

              <div className="space-y-2 text-slate-700 text-xs sm:text-[13px] leading-relaxed bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                <p className="font-semibold text-slate-800">
                  🌱 <strong>말씀 묵상: 주님 안에서 누리는 참된 쉼</strong>
                </p>
                <p className="text-slate-600">
                  지치고 분주한 일상 속에서도 주님은 언제나 우리의 피난처가 되십니다.
                  내 힘으로 짊어지려 했던 무거운 짐을 주님의 십자가 앞에 내려놓으십시오.
                  살아 역사하시는 생명의 말씀이 오늘 당신의 영혼을 새롭게 회복시키실 것입니다.
                </p>
                <div className="pt-1.5 border-t border-slate-200/60">
                  <p className="font-semibold text-slate-800">
                    🙏 <strong>오늘의 기도</strong>
                  </p>
                  <p className="text-slate-600 italic">
                    "주님, 제 삶의 모든 순간마다 말씀이 길이 되게 하옵소서. 낙심하거나 염려하지 않고, 
                    선하신 주님의 인도하심을 온전히 신뢰하며 찬양하게 하옵소서. 예수님의 이름으로 기도드립니다. 아멘."
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Mobile App Installation & Quick Guidance */}
            <section
              onClick={() => (onOpenInstall ? onOpenInstall() : setShowInstallModal(true))}
              className="bg-gradient-to-r from-blue-600 via-[#0083e3] to-sky-500 rounded-2xl p-3.5 text-white shadow-soft flex items-center justify-between gap-3 cursor-pointer hover:shadow-md transition active:scale-[0.99] border border-blue-400/30"
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

            {/* 7. Admin Management Banner (관리자 로그인 시에만 노출) */}
            {user.role === 'admin' && (
              <section
                onClick={() => {
                  pushHistory({ tab: activeTab });
                  setActiveTab('admin');
                }}
                className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-2xl p-3.5 text-white shadow-md border border-slate-700/70 cursor-pointer active:scale-98 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-base shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                    👑
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-white truncate">관리자 성경관리 모드</span>
                      <span className="text-[10px] bg-blue-600 text-blue-100 font-bold px-1.5 py-0.2 rounded-full flex-shrink-0">
                        관리자 전용
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                      회원 명부 실시간 관리 · 낭독 음원 검수 · 구글 시트 연동
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition flex-shrink-0 ml-2" />
              </section>
            )}

            {/* 8. User Profile & Cloud Sync Card */}
            <section className="bg-gradient-to-r from-blue-50 via-white to-indigo-50/60 p-3.5 rounded-2xl border border-blue-100 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#0083e3] font-bold text-sm border border-blue-200 shadow-inner">
                      {user.avatarText}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-extrabold text-slate-900 leading-snug">
                        {(user.name || '성도').replace(/\s*\([^)]*@?[^)]*\)$/, '').trim()}
                      </span>
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0">
                          👑 관리자
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-blue-100 text-[#0083e3] text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                          성도
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user.email}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping flex-shrink-0" />
                      실시간 클라우드 동기화 완료
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('SuperBible 앱에서 나가시겠습니까? (로그아웃)')) {
                        onLogout();
                      }
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="앱에서 나가기 (로그아웃)"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-500" />
                    <span>나가기</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    aria-label="계정 설정"
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-400 hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
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
        user.role === 'admin' ? (
          <SettingsView
            user={user}
            onLogout={onLogout}
            onToggleRole={onToggleRole}
            onBackToHome={() => setActiveTab('home')}
            onOpenAdmin={() => {
              pushHistory({ tab: 'settings' });
              setActiveTab('admin');
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#f8fafc]">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl mb-3 shadow-inner">
              🔒
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">관리자 전용 설정입니다</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs leading-relaxed">
              시스템 및 계정 설정 화면은 관리자(Admin) 권한을 가진 계정으로만 접근하실 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="px-4 py-2 bg-[#0083e3] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition"
            >
              홈 화면으로 돌아가기
            </button>
          </div>
        )
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
