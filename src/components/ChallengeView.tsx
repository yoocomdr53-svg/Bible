import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  BookOpen,
  Calendar,
  Check,
  BellOff,
  Info,
  X,
} from 'lucide-react';
import { BIBLE_BOOKS, getCompletedVerses, getChapterVerseCount } from '../data/bibleData';
import { ReadingDayPlan, User } from '../types';

interface ChallengeViewProps {
  user?: User;
  plans: ReadingDayPlan[];
  onTogglePlan: (day: number) => void;
  onNavigateToBible: (book: string, chapter?: number, verse?: number) => void;
  initialSubScreen?: 'main' | 'matrix' | 'plan' | 'create-plan' | 'edit-plan' | 'total-progress' | 'chapter-grid';
  initialBook?: string;
  onSubScreenChange?: (
    screen: 'main' | 'matrix' | 'plan' | 'create-plan' | 'edit-plan' | 'total-progress' | 'chapter-grid',
    book: string
  ) => void;
  onBackToHome?: () => void;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  user,
  plans,
  onNavigateToBible,
  initialSubScreen = 'main',
  initialBook = '창세기',
  onSubScreenChange,
  onBackToHome,
}) => {
  // Sub-screens:
  // 'main': 도전!일독 메인 화면
  // 'matrix': 일독 진행표 (66권 매트릭스)
  // 'plan': 읽기 계획표 (통독12목표 - 1번 이미지 화면)
  // 'create-plan': 읽기 계획 만들기 (이미지 0 & 1 통합 화면)
  // 'edit-plan': 계획표 수정 (이미지 2/3)
  // 'total-progress': 통독 분량 전체보기 - 상세 진도표 (사용자 요청 업로드 이미지 화면)
  // 'chapter-grid': 읽기 계획 현황 (4번 이미지 화면 - 6열 50개 챕터 번호 그리드 화면)
  const [subScreen, setSubScreen] = useState<
    'main' | 'matrix' | 'plan' | 'create-plan' | 'edit-plan' | 'total-progress' | 'chapter-grid'
  >(initialSubScreen);

  // Selected book for '읽기 계획 현황' 6-column chapter grid screen (Default: 창세기)
  const [selectedStatusBook, setSelectedStatusBook] = useState(initialBook);

  // Source tracking so back buttons go to the exact screen they came from
  const [chapterGridSource, setChapterGridSource] = useState<'plan' | 'total-progress' | 'main'>('plan');
  const [totalProgressSource, setTotalProgressSource] = useState<'plan' | 'main'>('plan');

  // Update notice banner toggle on plan screen (matching Image 1)
  const [showUpdateNotice, setShowUpdateNotice] = useState(true);

  // Sync with prop changes (e.g. when user taps '도전!일독' at bottom navigation bar)
  useEffect(() => {
    if (initialSubScreen) {
      setSubScreen(initialSubScreen);
    }
  }, [initialSubScreen]);

  useEffect(() => {
    if (initialBook) {
      setSelectedStatusBook(initialBook);
    }
  }, [initialBook]);

  // Deterministic back navigation handlers (Never loop, always succeed)
  const handleBackFromChapterGrid = () => {
    setSubScreen(chapterGridSource);
    if (onSubScreenChange) {
      onSubScreenChange(chapterGridSource, selectedStatusBook);
    }
  };

  const handleBackFromTotalProgress = () => {
    setSubScreen(totalProgressSource);
    if (onSubScreenChange) {
      onSubScreenChange(totalProgressSource, selectedStatusBook);
    }
  };

  const handleBackFromPlan = () => {
    setSubScreen('main');
    if (onSubScreenChange) {
      onSubScreenChange('main', selectedStatusBook);
    }
  };

  const handleBackFromMatrix = () => {
    setSubScreen('main');
    if (onSubScreenChange) {
      onSubScreenChange('main', selectedStatusBook);
    }
  };

  const handleBackFromCreatePlan = () => {
    setSubScreen('main');
    if (onSubScreenChange) {
      onSubScreenChange('main', selectedStatusBook);
    }
  };

  const handleBackFromEditPlan = () => {
    setSubScreen('plan');
    if (onSubScreenChange) {
      onSubScreenChange('plan', selectedStatusBook);
    }
  };

  // Screen transition helpers
  const openChapterGrid = (from: 'plan' | 'total-progress' | 'main', bookName?: string) => {
    setChapterGridSource(from);
    if (bookName) {
      setSelectedStatusBook(bookName);
    }
    setSubScreen('chapter-grid');
    if (onSubScreenChange) {
      onSubScreenChange('chapter-grid', bookName || selectedStatusBook);
    }
  };

  const openTotalProgress = (from: 'plan' | 'main') => {
    setTotalProgressSource(from);
    setSubScreen('total-progress');
    if (onSubScreenChange) {
      onSubScreenChange('total-progress', selectedStatusBook);
    }
  };

  const openPlan = () => {
    setSubScreen('plan');
    if (onSubScreenChange) {
      onSubScreenChange('plan', selectedStatusBook);
    }
  };

  const openMatrix = () => {
    setSubScreen('matrix');
    if (onSubScreenChange) {
      onSubScreenChange('matrix', selectedStatusBook);
    }
  };

  const openCreatePlan = () => {
    setSubScreen('create-plan');
    if (onSubScreenChange) {
      onSubScreenChange('create-plan', selectedStatusBook);
    }
  };

  const openEditPlan = () => {
    setSubScreen('edit-plan');
    if (onSubScreenChange) {
      onSubScreenChange('edit-plan', selectedStatusBook);
    }
  };

  // Testament filter for '통독 분량 전체보기' screen ('OT' = 구약 39권 | 'NT' = 신약 27권)
  const [selectedTestament, setSelectedTestament] = useState<'OT' | 'NT'>('OT');

  // Plan Details state (editable via '계획표 수정')
  const [planTitle, setPlanTitle] = useState('통독12목표');
  const [planStartDate, setPlanStartDate] = useState('2026.01.01');
  const [planEndDate] = useState('2026.03.01');
  const [planPortion, setPlanPortion] = useState('구약/신약');
  const [planTranslation, setPlanTranslation] = useState('개역개정');
  const [planChapters, setPlanChapters] = useState('20장씩');
  const [planPush, setPlanPush] = useState(false);

  // Edit Plan temporary form state
  const [editTitle, setEditTitle] = useState(planTitle);
  const [editStartDate, setEditStartDate] = useState(planStartDate);
  const [editPortion, setEditPortion] = useState(planPortion);
  const [editTranslation, setEditTranslation] = useState(planTranslation);
  const [editChapters, setEditChapters] = useState(planChapters);
  const [editPush, setEditPush] = useState(planPush);

  // Manage menu dropdown state
  const [showManageMenu, setShowManageMenu] = useState(false);

  // Create Plan form state
  const [participationType, setParticipationType] = useState<'alone' | 'family' | 'church'>('alone');
  const [selectedTranslation, setSelectedTranslation] = useState('개역개정');
  const [readingScope, setReadingScope] = useState<'all' | 'ot' | 'nt' | 'custom'>('all');
  const [readingMethod, setReadingMethod] = useState<'read' | 'record'>('read');

  // Completed verses tracking
  const [completedVerses, setCompletedVerses] = useState<Set<string>>(() => getCompletedVerses());

  useEffect(() => {
    const handleVerseChanged = () => {
      setCompletedVerses(getCompletedVerses());
    };
    window.addEventListener('superbible_verse_read_changed', handleVerseChanged);
    return () => {
      window.removeEventListener('superbible_verse_read_changed', handleVerseChanged);
    };
  }, []);

  // Completed chapters set in Matrix (Default: 창세기 50/50장, 출애굽기 40/40장 완독 상태로 초기화)
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (let i = 1; i <= 50; i++) {
      initial.add(`창세기-${i}`);
    }
    for (let i = 1; i <= 40; i++) {
      initial.add(`출애굽기-${i}`);
    }
    return initial;
  });

  // State for reading plan screen
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

  // Get completed verses count for a specific book and chapter
  const getChapterReadVersesCount = (book: string, chapter: number): number => {
    let count = 0;
    const total = getChapterVerseCount(book, chapter);
    for (let v = 1; v <= total; v++) {
      if (completedVerses.has(`${book}-${chapter}-${v}`)) {
        count++;
      }
    }
    return count;
  };

  // Display user name matching screenshot
  const greetingName = user?.name || 'wounhee“pollRuy”Ruy';

  // Filter books for '통독 분량 전체보기' screen
  const displayedBooks = BIBLE_BOOKS.filter((b) => b.testament === selectedTestament);

  // Metadata for current book in '읽기 계획 현황'
  const currentStatusBookObj =
    BIBLE_BOOKS.find((b) => b.name === selectedStatusBook) || BIBLE_BOOKS[0];
  const totalStatusChapters = currentStatusBookObj.chaptersCount || 50;

  // ==========================================
  // SCREEN A: 통독 분량 전체보기 - 상세 진도표 (사용자 업로드 이미지 화면)
  // ==========================================
  if (subScreen === 'total-progress') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f8fafc] relative overflow-hidden select-none text-slate-800">
        {/* 1. Top Bar (수퍼바이블 + 앱 설치 + 아이콘들) */}
        <div className="bg-white px-3 sm:px-4 py-2 border-b border-slate-100 flex items-center justify-between flex-shrink-0 z-30">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-rose-50 flex items-center justify-center text-rose-500">
              <svg className="w-5 h-5 fill-rose-500" viewBox="0 0 24 24">
                <path d="M12 2L2 9h3v11h14V9h3L12 2zm0 3.5L17 9H7l5-3.5zM7 11h3v7H7v-7zm7 0h3v7h-3v-7z" />
              </svg>
            </div>
            <span className="text-[17px] font-black tracking-tight text-[#0284c7]">수퍼바이블</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert('수퍼바이블 모바일 웹앱 설치 안내')}
              className="bg-[#fef3c7] hover:bg-[#fde68a] border border-amber-300 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs transition cursor-pointer"
            >
              <span>📱</span>
              <span>앱 설치</span>
            </button>
            <button
              type="button"
              onClick={() => alert('사용자 정보')}
              className="p-1 text-slate-700 hover:text-slate-900 cursor-pointer"
              title="사용자"
            >
              <svg className="w-5 h-5 fill-slate-700" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => alert('화면 설정')}
              className="p-1 text-slate-700 hover:text-slate-900 cursor-pointer"
              title="설정"
            >
              <svg className="w-5 h-5 fill-slate-700" viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.485.485 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>
            <div className="w-7 h-7 rounded-full bg-[#1b64b9] text-white flex items-center justify-center text-xs font-black shadow-xs">
              유
            </div>
          </div>
        </div>

        {/* 2. Dark Sub-Bar (관리자 모드, BIBLEONLINE 3.0, 앱 설치, 🔄, 심) */}
        <div className="bg-[#1e2026] text-white px-3 sm:px-4 py-2 flex items-center justify-between text-xs flex-shrink-0 border-b border-slate-700/50 z-30">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="border border-amber-400/80 rounded-md px-2 py-0.5 text-amber-300 font-bold text-[11px] flex items-center gap-1 flex-shrink-0">
              <span>👑</span>
              <span>관리자 모드</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-400 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>BIBLEONLINE 3.0</span>
            </div>
            <div className="text-amber-300 text-[11px] font-bold flex items-center gap-1 flex-shrink-0">
              <span>📱</span>
              <span>앱 설치</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button
              type="button"
              onClick={() => alert('데이터 동기화 완료')}
              className="p-1 text-slate-300 hover:text-white transition cursor-pointer"
              title="동기화"
            >
              <svg className="w-4 h-4 fill-none stroke-currentColor stroke-2" viewBox="0 0 24 24">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="w-5 h-5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[10px] font-black">
              심
            </div>
          </div>
        </div>

        {/* 3. Section Header: 📊 상세 진도표 | 현재 1독 | 🗄 데이터 아카이브 */}
        <div className="px-3 sm:px-4 pt-3.5 pb-2 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackFromTotalProgress}
              className="p-1 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="뒤로 가기"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-1.5">
              <div className="flex items-end gap-0.5 h-4">
                <div className="w-1 h-3 bg-purple-500 rounded-xs" />
                <div className="w-1 h-4 bg-blue-500 rounded-xs" />
                <div className="w-1 h-2 bg-teal-400 rounded-xs" />
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                상세 진도표
              </h1>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] text-xs font-black">
              현재 1독
            </span>
          </div>

          <button
            type="button"
            onClick={() => alert('데이터 아카이브: 과거 통독 기록')}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer"
          >
            <span>🗄</span>
            <span>데이터 아카이브</span>
          </button>
        </div>

        {/* 4. Subtitle: 구약 성경 (39권) / 신약 성경 (27권) | 책 클릭 시 해당 성경으로 바로 이동 */}
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTestament('OT')}
              className={`text-sm sm:text-base font-black transition cursor-pointer pb-0.5 ${
                selectedTestament === 'OT'
                  ? 'text-slate-900 border-b-2 border-[#1b64b9]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              구약 성경 (39권)
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setSelectedTestament('NT')}
              className={`text-sm sm:text-base font-black transition cursor-pointer pb-0.5 ${
                selectedTestament === 'NT'
                  ? 'text-slate-900 border-b-2 border-[#1b64b9]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              신약 성경 (27권)
            </button>
          </div>

          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
            책 클릭 시 해당 성경으로 바로 이동
          </span>
        </div>

        {/* 5. 2-Column Cards Grid (책 목록 및 50/50장, 40/40장 녹색 진행바) */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 pb-24 bg-[#f8fafc]">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {displayedBooks.map((book) => {
              let readCount = 0;
              for (let ch = 1; ch <= book.chaptersCount; ch++) {
                if (completedChapters.has(`${book.name}-${ch}`)) {
                  readCount++;
                }
              }
              const progressPercent = Math.round((readCount / book.chaptersCount) * 100);

              return (
                <div
                  key={book.id}
                  onClick={() => openChapterGrid('total-progress', book.name)}
                  className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all text-left cursor-pointer group active:scale-98 flex flex-col justify-between min-h-[64px]"
                  title={`${book.name} 터치 시 읽기 계획 현황(장별 그리드) 열기`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#1b64b9] transition-colors">
                      {book.name}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        readCount > 0 ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {readCount}/{book.chaptersCount}장
                    </span>
                  </div>

                  {readCount > 0 && (
                    <div className="w-full bg-slate-100 h-1.5 sm:h-2 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-[#10b981] h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN B: 읽기 계획 현황 (4번 이미지 화면과 100% 동일하게 구현)
  // ==========================================
  if (subScreen === 'chapter-grid') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] relative overflow-hidden select-none text-slate-800">
        {/* Top Header (Deep Blue #1b64b9 - 4번 이미지) */}
        <header className="bg-[#1b64b9] text-white px-3 py-3 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          <button
            type="button"
            onClick={handleBackFromChapterGrid}
            className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="뒤로 가기"
          >
            <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
          </button>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex-1 text-center -ml-6">
            읽기 계획 현황
          </h1>
          <div className="w-6" />
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 smooth-scroll">
          {/* Main White Card (4번 이미지 메인 그리드) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 max-w-md mx-auto">
            {/* 6-Column Chapter Number Circle Grid (1..50 - 4번 이미지와 100% 동일) */}
            <div className="grid grid-cols-6 gap-2.5 sm:gap-3 justify-items-center py-2">
              {Array.from({ length: 50 }, (_, i) => i + 1).map((ch) => {
                // 4번 이미지: 1~21절은 완독(에메랄드 녹색 + 체크 배지), 22~50절은 미완료(연회색 원형)
                const isRead = ch <= 21;

                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => {
                      onNavigateToBible(selectedStatusBook, ch, 1);
                    }}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-extrabold transition-all cursor-pointer active:scale-90 relative ${
                      isRead
                        ? 'bg-[#05c46b] text-white font-black shadow-xs'
                        : 'bg-[#f1f4f9] hover:bg-slate-200 text-slate-800 font-bold'
                    }`}
                    title={`${selectedStatusBook} ${ch}장 본문 이동`}
                  >
                    <span>{ch}</span>
                    {isRead && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#059669] text-white flex items-center justify-center text-[8px] font-black shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Read Verses Legend (4번 이미지 하단 범례) */}
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-bold">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#05c46b] inline-block" />
                  <span className="text-slate-700">완독</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fcc419] inline-block" />
                  <span className="text-slate-700">읽는 중</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-white inline-block" />
                  <span className="text-slate-700">미완료</span>
                </div>
              </div>

              <span className="text-xs font-black text-[#1b64b9]">
                장 터치 시 본문 이동
              </span>
            </div>
          </div>

          {/* Bottom Card: 현재 통독 진행 / 창세기 1장 말씀 읽기 / 읽기 이동 > (4번 이미지 하단 카드) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between mt-3.5 max-w-md mx-auto">
            <div>
              <p className="text-xs font-bold text-slate-500">현재 통독 진행</p>
              <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                {selectedStatusBook} 1장 말씀 읽기
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToBible(selectedStatusBook, 1, 1)}
              className="px-4 py-2.5 bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
            >
              읽기 이동 &gt;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 4: 읽기 계획 만들기 (이미지 0 & 1 통합 화면)
  // ==========================================
  if (subScreen === 'create-plan') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] relative overflow-hidden select-none text-slate-800">
        <header className="bg-[#1b64b9] text-white px-4 pt-3 pb-3.5 shadow-md z-30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackFromCreatePlan}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="뒤로 가기"
            >
              <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex-1 text-center -ml-6">
              읽기 계획 만들기
            </h1>
            <div className="w-6" />
          </div>
          <p className="text-center text-xs sm:text-sm text-blue-100 font-medium mt-1">
            읽을 성경과 방식을 선택해 주세요.
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-6">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
            <h2 className="text-base font-black text-slate-900">참여 유형</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 justify-items-center">
              <button
                type="button"
                onClick={() => setParticipationType('alone')}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center relative transition-all ${
                    participationType === 'alone'
                      ? 'bg-[#dbeafe] ring-2 ring-[#1b64b9]'
                      : 'bg-slate-100 hover:bg-slate-200/60'
                  }`}
                >
                  <svg
                    className={`w-10 h-10 ${
                      participationType === 'alone' ? 'fill-[#1b64b9]' : 'fill-slate-400'
                    }`}
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="7" r="4" />
                    <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
                  </svg>
                  {participationType === 'alone' && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1b64b9] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2.5 font-bold ${
                    participationType === 'alone' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  혼자 읽기
                </span>
              </button>

              <button
                type="button"
                onClick={() => setParticipationType('family')}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center relative transition-all ${
                    participationType === 'family'
                      ? 'bg-[#dbeafe] ring-2 ring-[#1b64b9]'
                      : 'bg-slate-100 hover:bg-slate-200/60'
                  }`}
                >
                  <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none">
                    <circle cx="17" cy="14" r="5" fill="#14b8a6" />
                    <path d="M10 32v-5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5" fill="#14b8a6" />
                    <circle cx="31" cy="14" r="5" fill="#0284c7" />
                    <path d="M24 32v-5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5" fill="#0284c7" />
                    <circle cx="24" cy="22" r="4" fill="#f59e0b" />
                    <path d="M19 35v-4a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4" fill="#f59e0b" />
                  </svg>
                  {participationType === 'family' && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1b64b9] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2.5 font-bold text-center ${
                    participationType === 'family' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  가족과 함께 읽기
                </span>
              </button>

              <button
                type="button"
                onClick={() => setParticipationType('church')}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center relative transition-all ${
                    participationType === 'church'
                      ? 'bg-[#dbeafe] ring-2 ring-[#1b64b9]'
                      : 'bg-slate-100 hover:bg-slate-200/60'
                  }`}
                >
                  <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none">
                    <path d="M18 7v10M14 11h8" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M13 18l5-6 5 6v14h-10V18z" fill="#0284c7" />
                    <path d="M23 23h15v9H23v-9z" fill="#0284c7" />
                    <path d="M21 23l4-5h15l-4 5H21z" fill="#14b8a6" />
                    <path d="M16 32v-6a2 2 0 0 1 4 0v6" fill="#f8fafc" />
                  </svg>
                  {participationType === 'church' && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1b64b9] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2.5 font-bold ${
                    participationType === 'church' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  교회/그룹
                </span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-slate-900">성경 번역본 선택</h2>
              <span className="w-4 h-4 rounded-full bg-[#1b64b9] text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            </div>
            <div className="relative">
              <select
                value={selectedTranslation}
                onChange={(e) => setSelectedTranslation(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold text-sm appearance-none focus:outline-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="개역개정">개역개정</option>
                <option value="개역한글">개역한글</option>
                <option value="새번역">새번역</option>
                <option value="공동번역">공동번역</option>
                <option value="NIV">NIV (English)</option>
                <option value="ESV">ESV (English)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700 text-xs">
                ▼
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-3">
            <h2 className="text-base font-black text-slate-900">읽을 범위</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'all', label: '성경 전체' },
                { id: 'ot', label: '구약' },
                { id: 'nt', label: '신약' },
              ].map((item) => {
                const isSelected = readingScope === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReadingScope(item.id as 'all' | 'ot' | 'nt' | 'custom')}
                    className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-extrabold text-center relative transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#dbeafe] text-slate-900 border-2 border-blue-400 shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#1b64b9] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                    {item.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setReadingScope('custom')}
              className={`w-32 py-3 px-2 rounded-xl text-xs sm:text-sm font-extrabold text-center relative transition cursor-pointer ${
                readingScope === 'custom'
                  ? 'bg-[#dbeafe] text-slate-900 border-2 border-blue-400 shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {readingScope === 'custom' && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#1b64b9] text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
              권 별 선택
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
            <h2 className="text-base font-black text-slate-900">방법 선택</h2>
            <div className="grid grid-cols-2 gap-4 justify-items-center">
              <button
                type="button"
                onClick={() => setReadingMethod('read')}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center relative transition-all ${
                    readingMethod === 'read'
                      ? 'bg-[#dbeafe] ring-2 ring-[#1b64b9]'
                      : 'bg-slate-100 hover:bg-slate-200/60'
                  }`}
                >
                  <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
                    <path
                      d="M10 24a14 14 0 0 1 28 0"
                      stroke="#0ea5e9"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <rect x="8" y="22" width="5" height="9" rx="2.5" fill="#0284c7" />
                    <rect x="35" y="22" width="5" height="9" rx="2.5" fill="#0284c7" />
                    <path d="M14 31l10-4 10 4v4l-10-4-10 4v-4z" fill="#0284c7" />
                    <path
                      d="M14 31l10 4 10-4"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  {readingMethod === 'read' && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1b64b9] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2.5 font-bold ${
                    readingMethod === 'read' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  읽거나 듣기
                </span>
              </button>

              <button
                type="button"
                onClick={() => setReadingMethod('record')}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center relative transition-all ${
                    readingMethod === 'record'
                      ? 'bg-[#dbeafe] ring-2 ring-[#1b64b9]'
                      : 'bg-slate-100 hover:bg-slate-200/60'
                  }`}
                >
                  <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
                    <rect x="19" y="10" width="10" height="18" rx="5" fill="#14b8a6" />
                    <path
                      d="M14 23a10 10 0 0 0 20 0"
                      stroke="#0284c7"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M24 33v6M18 39h12"
                      stroke="#0284c7"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  {readingMethod === 'record' && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1b64b9] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2.5 font-bold ${
                    readingMethod === 'record' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  녹음
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 bg-white border-t border-slate-200 shadow-lg flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setPlanTranslation(selectedTranslation);
              if (readingScope === 'ot') {
                setPlanPortion('구약');
              } else if (readingScope === 'nt') {
                setPlanPortion('신약');
              } else if (readingScope === 'all') {
                setPlanPortion('구약/신약');
              } else {
                setPlanPortion('권 별 선택');
              }
              setSubScreen('plan');
            }}
            className="w-full py-3.5 bg-[#1b64b9] hover:bg-blue-700 text-white font-extrabold text-base rounded-xl transition cursor-pointer shadow-md active:scale-98"
          >
            다음
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 5: 계획표 수정 (이미지 2/3 화면)
  // ==========================================
  if (subScreen === 'edit-plan') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] relative overflow-hidden select-none text-slate-800">
        <header className="bg-[#1b64b9] text-white px-3 py-3 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          <button
            type="button"
            onClick={handleBackFromEditPlan}
            className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="뒤로 가기"
          >
            <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
          </button>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex-1 text-center -ml-6">
            계획표 수정
          </h1>
          <div className="w-6" />
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <label className="w-16 sm:w-20 text-sm font-extrabold text-[#1b64b9] flex-shrink-0">
                제목
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-blue-500 focus:border-blue-500"
                placeholder="통독12목표"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-16 sm:w-20 text-sm font-extrabold text-[#1b64b9] flex-shrink-0">
                시작일
              </label>
              <input
                type="text"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-blue-500 focus:border-blue-500"
                placeholder="2026.01.01"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-16 sm:w-20 text-sm font-extrabold text-[#1b64b9] flex-shrink-0">
                분량
              </label>
              <div className="flex-1 px-3.5 py-2.5 bg-[#f3f5f9] border border-slate-200 rounded-lg text-sm font-bold text-slate-900">
                {editPortion}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-16 sm:w-20 text-sm font-extrabold text-[#1b64b9] flex-shrink-0">
                번역본
              </label>
              <input
                type="text"
                value={editTranslation}
                onChange={(e) => setEditTranslation(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-blue-500 focus:border-blue-500"
                placeholder="개역개정"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-16 sm:w-20 text-sm font-extrabold text-[#1b64b9] flex-shrink-0 leading-tight">
                장수<br />변경
              </label>
              <input
                type="text"
                value={editChapters}
                onChange={(e) => setEditChapters(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-blue-500 focus:border-blue-500"
                placeholder="20장씩"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-extrabold text-slate-800">
                읽기 계획 푸시 알림
              </span>
              <button
                type="button"
                onClick={() => setEditPush(!editPush)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  editPush ? 'bg-[#1b64b9]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs ${
                    editPush ? 'left-[26px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex border-t border-slate-200 z-30 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSubScreen('plan')}
            className="flex-1 py-3.5 bg-[#94a3b8] hover:bg-[#8392a0] text-white font-black text-sm sm:text-base text-center transition cursor-pointer active:brightness-95"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              setPlanTitle(editTitle);
              setPlanStartDate(editStartDate);
              setPlanPortion(editPortion);
              setPlanTranslation(editTranslation);
              setPlanChapters(editChapters);
              setPlanPush(editPush);
              setSubScreen('plan');
            }}
            className="flex-1 py-3.5 bg-[#1b64b9] hover:bg-blue-700 text-white font-black text-sm sm:text-base text-center transition cursor-pointer active:brightness-95"
          >
            수정
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 2: 일독 진행표 (66권 매트릭스)
  // ==========================================
  if (subScreen === 'matrix') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f8fafc] relative overflow-hidden select-none text-slate-800">
        <header className="bg-[#1b64b9] text-white px-3 py-2.5 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackFromMatrix}
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

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-4 pb-28 bg-white">
          {BIBLE_BOOKS.map((book) => {
            const chapters = Array.from({ length: book.chaptersCount }, (_, i) => i + 1);

            return (
              <div
                key={book.id}
                className="flex items-start border-b border-slate-100 pb-3.5 pt-1"
              >
                <div className="w-20 sm:w-24 flex-shrink-0 pr-2 pt-0.5">
                  <h3 className="text-[15px] sm:text-base font-black text-[#1b64b9] leading-tight">
                    {book.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigateToBible(book.name, 1, 1)}
                    className="mt-1.5 px-2 py-0.5 rounded-md bg-slate-500 hover:bg-slate-600 text-white text-[10px] font-bold tracking-tight flex items-center gap-0.5 transition cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <span>본문보기</span>
                    <span>&gt;</span>
                  </button>
                </div>

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
                        title={`${book.name} ${ch}장`}
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

        <div className="absolute left-3 right-3 bottom-3 z-30">
          <div className="bg-[#2c333e] text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-slate-700/60 backdrop-blur-md">
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

            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden my-1">
              <div
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, matrixProgressPercent)}%` }}
              />
            </div>

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
        <header className="bg-[#1b64b9] text-white px-3 py-2.5 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackFromPlan}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="뒤로 가기"
            >
              <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">읽기 계획표</h1>
          </div>

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

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowManageMenu(!showManageMenu)}
                className="hover:underline cursor-pointer py-1 px-1.5 rounded hover:bg-white/10"
              >
                관리
              </button>

              {showManageMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/20"
                    onClick={() => setShowManageMenu(false)}
                  />

                  <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowManageMenu(false);
                        alert('읽기 계획표 설정: 목표 기간 및 알림 주기를 관리할 수 있습니다.');
                      }}
                      className="w-full px-4 py-2 text-left text-xs sm:text-sm font-bold hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700"
                    >
                      설정
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowManageMenu(false);
                        setEditTitle(planTitle);
                        setEditStartDate(planStartDate);
                        setEditPortion(planPortion);
                        setEditTranslation(planTranslation);
                        setEditChapters(planChapters);
                        setEditPush(planPush);
                        setSubScreen('edit-plan');
                      }}
                      className="w-full px-4 py-2 text-left text-xs sm:text-sm font-bold hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700 border-t border-slate-100"
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowManageMenu(false);
                        if (confirm('현재 읽기 계획표를 삭제하시겠습니까?')) {
                          setPlanTitle('새로운 계획표');
                          setSubScreen('main');
                        }
                      }}
                      className="w-full px-4 py-2 text-left text-xs sm:text-sm font-bold hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 pb-20">
          {/* Main Plan Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-slate-800" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {planTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-semibold mb-4 ml-7">
              {planStartDate} ~ {planEndDate}
            </p>

            <div className="grid grid-cols-3 divide-x divide-slate-100 py-1 text-center">
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">진행률</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">
                  {matrixProgressPercent}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">연속읽기</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">2일</p>
              </div>
              <div className="cursor-pointer" onClick={() => alert('획득한 성경 통독 배지 목록')}>
                <p className="text-xs text-slate-400 font-bold mb-1 flex items-center justify-center gap-0.5">
                  <span>배지</span>
                  <span>&gt;</span>
                </p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">2개</p>
              </div>
            </div>

            <div className="pt-4 pb-1">
              <div className="relative w-full h-8 flex items-center">
                <div
                  className="absolute bottom-1.5 transition-all duration-300"
                  style={{ left: `${Math.max(8, Math.min(90, matrixProgressPercent))}%` }}
                >
                  <span className="text-2xl select-none" role="img" aria-label="runner">
                    🏃
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(5, matrixProgressPercent)}%` }}
                />
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-800 cursor-pointer">
                  <span>📅 이번주 읽기 현황</span>
                  <span>&gt;</span>
                </div>
                <Info className="w-4 h-4 text-blue-500 cursor-pointer" />
              </div>

              <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => {
                  const isToday = idx === 6;
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

            {/* Tab 1: 읽기계획 - 1번 이미지 화면과 100% 동일하게 구현 */}
            {planTab === 'plan' && (
              <div className="p-4 space-y-3.5">
                {/* Header: 통독 계획 현황 > & 통독 분량 전체보기 버튼 */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900 text-sm">통독 계획 현황</span>
                    <span className="text-slate-400 font-bold">&gt;</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openTotalProgress('plan')}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1b64b9] rounded-xl text-xs font-black flex items-center gap-1 transition cursor-pointer border border-blue-200 shadow-2xs active:scale-95"
                  >
                    <span>통독 분량 전체보기</span>
                    <span>&gt;</span>
                  </button>
                </div>

                {/* 1번 이미지 메인 카드: 창세기 (총 50장) | 터치 시 해당 장으로 이동 */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-[#1b64b9]">창세기</span>
                      <span className="text-xs text-slate-400 font-medium">(총 50장)</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-blue-600">
                      터치 시 해당 장으로 이동
                    </span>
                  </div>

                  {/* 6열 50개 전체 장 원형 번호 그리드 (창세기 1~50장 전체 표시) */}
                  <div className="grid grid-cols-6 gap-2.5 sm:gap-3 justify-items-center py-1">
                    {Array.from({ length: 50 }, (_, i) => i + 1).map((ch) => {
                      const isCh1 = ch === 1;
                      const isCh2 = ch === 2;

                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => onNavigateToBible('창세기', ch, 1)}
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-extrabold transition cursor-pointer active:scale-90 relative ${
                            isCh1
                              ? 'bg-[#05c46b] text-white font-black shadow-xs ring-2 ring-emerald-300'
                              : isCh2
                              ? 'bg-[#fff9db] border-2 border-[#fcc419] text-slate-800 font-black shadow-2xs'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 shadow-2xs'
                          }`}
                          title={`창세기 ${ch}장 본문으로 이동`}
                        >
                          <span>{ch}</span>
                          {isCh1 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#059669] text-white flex items-center justify-center text-[8px] font-black shadow-xs">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1번 이미지 하단 업데이트 안내 배너 */}
                {showUpdateNotice && (
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs flex items-center justify-between text-xs text-slate-700 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">[업데이트 안내]</span>
                      <span>더 편리해진 '도전!일독'을 만나보세요</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUpdateNotice(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="닫기"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 66권 전체 진도표 링크 버튼 */}
                <button
                  type="button"
                  onClick={() => openTotalProgress('plan')}
                  className="w-full py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 text-xs sm:text-sm font-black transition border border-slate-200/90 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📊 구약 39권 · 신약 27권 전체 진도표 보기</span>
                  <span>&gt;</span>
                </button>
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
      <div className="flex items-center justify-between pt-1 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1b64b9] tracking-tight">
            {greetingName}님,
          </h1>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 tracking-tight">
            말씀으로 하루를 채우세요.
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
          <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={openMatrix}
          className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white/60 hover:bg-white rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1b64b9] transition-all cursor-pointer text-center shadow-2xs active:scale-98"
        >
          + 읽기표 새로 만들기
        </button>
        <button
          type="button"
          onClick={openCreatePlan}
          className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white/60 hover:bg-white rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1b64b9] transition-all cursor-pointer text-center shadow-2xs active:scale-98"
        >
          + 계획표 새로 만들기
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-white rounded-[26px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-center mb-3">
              <button
                type="button"
                onClick={openMatrix}
                className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100/80 text-[#1b64b9] text-xs font-bold transition cursor-pointer"
              >
                내 전체 읽기표 &gt;
              </button>
            </div>

            <div className="flex justify-center my-3">
              <div className="w-16 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-[#1b64b9] shadow-inner relative">
                <BookOpen className="w-9 h-9 stroke-[1.8]" />
                <span className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900 text-center tracking-tight">
              채은성
            </h2>

            <p className="text-sm font-extrabold text-[#0284c7] text-center mt-1">
              {matrixProgressPercent}% 진행 중
            </p>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-3">
              <div
                className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, matrixProgressPercent)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToBible('출애굽기', 18, 1)}
              className="w-full py-2.5 rounded-xl bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition shadow-sm cursor-pointer"
            >
              읽기 시작
            </button>
            <button
              type="button"
              onClick={openMatrix}
              className="w-full py-2.5 rounded-xl border border-[#1b64b9] hover:bg-blue-50 active:scale-95 text-[#1b64b9] font-extrabold text-xs sm:text-sm transition cursor-pointer"
            >
              읽기표 보기
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[26px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-center mb-3">
              <button
                type="button"
                onClick={openPlan}
                className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100/80 text-[#1b64b9] text-xs font-bold transition cursor-pointer"
              >
                내 전체 계획표 &gt;
              </button>
            </div>

            <div className="flex justify-center my-3">
              <div className="w-16 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-[#1b64b9] shadow-inner relative">
                <Calendar className="w-9 h-9 stroke-[1.8]" />
                <span className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-black text-slate-900 text-center tracking-tight">
              {planTitle}
            </h2>

            <p className="text-sm font-extrabold text-[#0284c7] text-center mt-1">
              {matrixProgressPercent}% 진행 중
            </p>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-3">
              <div
                className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, matrixProgressPercent)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => openChapterGrid('main', '창세기')}
              className="w-full py-2.5 rounded-xl bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition shadow-sm cursor-pointer"
            >
              오늘 읽기
            </button>
            <button
              type="button"
              onClick={openPlan}
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
