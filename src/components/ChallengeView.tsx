import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Check,
  BellOff,
  Info,
  X,
  Trophy,
  Award,
  Sparkles,
  Crown,
  Medal,
  Flame,
  Star,
  Lock,
} from 'lucide-react';
import {
  BIBLE_BOOKS,
  getCompletedVerses,
  getCompletedChapters,
  isChapterFullyRead,
  getChapterVerseCount,
  toggleChapterDirect,
  resetAllReadingProgress,
} from '../data/bibleData';
import { ReadingDayPlan, User } from '../types';

export const READINGS_COUNT_KEY = 'superbible_completed_readings_count';

export interface ReadingBadge {
  level: number;
  name: string;
  subtitle: string;
  desc: string;
  icon: string;
  tag: string;
}

export const READING_BADGES_12: ReadingBadge[] = [
  { level: 1, name: '1독 첫걸음', subtitle: '말씀과의 첫 걸음', desc: '말씀의 바다로 내딛은 거룩한 첫 발걸음', icon: '🌱', tag: '첫걸음' },
  { level: 2, name: '2독 성실', subtitle: '날마다 주와 동행', desc: '날마다 말씀과 동행하는 성실함과 은혜', icon: '🌿', tag: '성실' },
  { level: 3, name: '3독 등불', subtitle: '내 발의 등이요', desc: '주의 말씀은 내 발의 등이요 내 길에 빛이니이다', icon: '🕯️', tag: '등불' },
  { level: 4, name: '4독 단비', subtitle: '은혜의 단비', desc: '갈급한 영혼을 흠뻑 적시는 시원한 말씀의 단비', icon: '💧', tag: '은혜' },
  { level: 5, name: '5독 방패', subtitle: '진리의 방패', desc: '진리의 말씀으로 무장한 굳건하고 단단한 방패', icon: '🛡️', tag: '진리' },
  { level: 6, name: '6독 반환점', subtitle: '빛나는 결실', desc: '12목표의 절반을 돌파한 빛나는 끈기와 결실', icon: '⭐', tag: '반환점' },
  { level: 7, name: '7독 순종', subtitle: '완전한 순종', desc: '주의 계명을 사모하며 온전함으로 나아가는 순종', icon: '✨', tag: '순종' },
  { level: 8, name: '8독 비상', subtitle: '독수리의 비상', desc: '새 힘을 얻어 독수리 날개 치며 솟아오르는 믿음', icon: '🕊️', tag: '비상' },
  { level: 9, name: '9독 열매', subtitle: '성령의 아홉 열매', desc: '사랑과 희락과 화평, 성령의 풍성하고 아름다운 열매', icon: '🍇', tag: '열매' },
  { level: 10, name: '10독 거장', subtitle: '믿음의 거장', desc: '반석 위에 집을 지은 지혜로운 믿음의 거장', icon: '🏅', tag: '거장' },
  { level: 11, name: '11독 소망', subtitle: '영원한 소망', desc: '하늘에 예비된 영원한 영광을 바라보는 소망', icon: '💎', tag: '소망' },
  { level: 12, name: '12독 영광의 면류관', subtitle: '통독 12목표 완수!', desc: '대장정의 완수! 의의 재판장이 예비하신 영광의 면류관', icon: '👑', tag: '12목표 완수' },
];

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
  onOpenAdminManagement?: () => void;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  user,
  plans,
  onNavigateToBible,
  initialSubScreen = 'main',
  initialBook = '창세기',
  onSubScreenChange,
  onBackToHome,
  onOpenAdminManagement,
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

  // Filter for '읽기 계획 현황': 'all' (전체) | 'done' (완독) | 'reading' (읽는 중) | 'unread' (미완료)
  const [statusChapterFilter, setStatusChapterFilter] = useState<'all' | 'done' | 'reading' | 'unread'>('all');
  const [showBookSelectorModal, setShowBookSelectorModal] = useState<boolean>(false);

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

  // Completed verses and chapters tracking from unified storage
  const [completedVerses, setCompletedVerses] = useState<Set<string>>(() => getCompletedVerses());
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(() => getCompletedChapters());

  useEffect(() => {
    const handleVerseChanged = () => {
      setCompletedVerses(getCompletedVerses());
      setCompletedChapters(getCompletedChapters());
    };
    window.addEventListener('superbible_verse_read_changed', handleVerseChanged);
    return () => {
      window.removeEventListener('superbible_verse_read_changed', handleVerseChanged);
    };
  }, []);

  // State for reading plan screen
  const [planTab, setPlanTab] = useState<'plan' | 'attendance'>('plan');
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // 1. Total Bible Chapters: 1,189장 (성경 66권 전체) & 12독 목표 (14,268장)
  const TOTAL_CHAPTERS = 1189;
  const targetGoalReads = 12; // 12독 목표 기준
  const TOTAL_GOAL12_CHAPTERS = TOTAL_CHAPTERS * targetGoalReads; // 14,268장

  // 66권 전체 1,189장 중 현재 일독 진행 중 완독한 장 수
  const totalReadChAll = React.useMemo(() => {
    let count = 0;
    for (const b of BIBLE_BOOKS) {
      for (let ch = 1; ch <= b.chaptersCount; ch++) {
        if (isChapterFullyRead(b.name, ch, completedVerses)) {
          count++;
        }
      }
    }
    return count;
  }, [completedVerses, completedChapters]);

  // 첫 번째 미완독 장 찾기 (일독 이어읽기)
  const nextUnreadChapter = React.useMemo(() => {
    for (const b of BIBLE_BOOKS) {
      for (let ch = 1; ch <= b.chaptersCount; ch++) {
        if (!isChapterFullyRead(b.name, ch, completedVerses)) {
          return { book: b.name, chapter: ch };
        }
      }
    }
    return { book: '창세기', chapter: 1 };
  }, [completedVerses, completedChapters]);

  // 일독 진행률 (1,189장 기준, 1,189장 완독 시 100%)
  const singleReadPercent = React.useMemo(() => {
    if (totalReadChAll >= TOTAL_CHAPTERS) return 100;
    if (totalReadChAll <= 0) return 0;
    const raw = (totalReadChAll / TOTAL_CHAPTERS) * 100;
    return raw < 10 ? Number(raw.toFixed(1)) : Math.round(raw);
  }, [totalReadChAll]);

  // Matrix 진행률도 일독 진행률과 100% 일치
  const matrixProgressPercent = singleReadPercent;

  // 상세 진도표 2가지 메뉴 모드: 'single' (일독상세표) vs 'goal' (목표상세표)
  const [progressDetailMode, setProgressDetailMode] = useState<'single' | 'goal'>('single');

  // Completed Bible Readings count (통독 수) - 1독 완료 시마다 배지 1개씩 추가, 12독 목표 달성 시 축하 모달 표시
  const [completedReadingsCount, setCompletedReadingsCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(READINGS_COUNT_KEY);
      return raw !== null ? Math.max(0, parseInt(raw, 10)) : 0;
    } catch {
      return 0;
    }
  });

  // 12독 목표 기준 전체 누적 읽은 장 수 (총 14,268장)
  const totalCumChAll = Math.min(
    TOTAL_GOAL12_CHAPTERS,
    completedReadingsCount * TOTAL_CHAPTERS + totalReadChAll
  );

  // 12독 목표 진행률 (14,268장 기준, 14,268장 완독 시 100%)
  const goal12ProgressPercent = React.useMemo(() => {
    if (totalCumChAll >= TOTAL_GOAL12_CHAPTERS) return 100;
    if (totalCumChAll <= 0) return 0;
    const raw = (totalCumChAll / TOTAL_GOAL12_CHAPTERS) * 100;
    return raw < 10 ? Number(raw.toFixed(1)) : Math.round(raw);
  }, [totalCumChAll]);

  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  const updateReadingsCount = (updater: (prev: number) => number) => {
    setCompletedReadingsCount((prev) => {
      const next = Math.max(0, updater(prev));
      try {
        localStorage.setItem(READINGS_COUNT_KEY, next.toString());
      } catch (e) {
        console.error(e);
      }
      if (next >= 12 && prev < 12) {
        setShowCelebrationModal(true);
      }
      return next;
    });
  };

  // Modals for Reading Badges and 12-Goal Celebration
  const renderModals = () => (
    <>
      {/* 1. 통독 12목표 달성 축하 모달 */}
      {showCelebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-amber-400 text-center animate-in zoom-in-95 duration-200">
            {/* 상단 화려한 황금 리본 배너 */}
            <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 py-6 px-4 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-25 flex justify-around items-center select-none text-2xl">
                <span>✨</span><span>🌟</span><span>⭐</span><span>✨</span><span>🎉</span>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner border border-white/40 mb-2 animate-bounce">
                  🏆
                </div>
                <span className="inline-block bg-white/30 text-yellow-50 text-[11px] font-black px-3 py-0.5 rounded-full mb-1 tracking-wider uppercase">
                  Goal Accomplished
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm">
                  축하합니다!
                </h2>
                <p className="text-sm sm:text-base font-extrabold text-yellow-100 mt-0.5">
                  통독 12목표에 달성했습니다! 👑
                </p>
              </div>
            </div>

            {/* 축하 본문 */}
            <div className="p-5 space-y-4">
              <p className="text-xs sm:text-sm text-slate-700 font-bold leading-relaxed">
                살아계신 하나님의 말씀을 주야로 묵상하며<br />
                <span className="text-amber-600 font-black">12번의 성경 통독 목표</span>를 온전히 이루셨습니다!
              </p>

              {/* 말씀 구절 카드 (디모데후서 4:7-8) */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-left shadow-2xs">
                <p className="text-xs text-amber-950 font-bold leading-relaxed italic">
                  “내가 선한 싸움을 싸우고 나의 달려갈 길을 마치고 믿음을 지켰으니 이제 후로는 나를 위하여 의의 면류관이 예비되었으므로 주 곧 의로우신 재판장이 그 날에 내게 주실 것이며”
                </p>
                <p className="text-[11px] text-amber-700 font-extrabold text-right mt-1.5">
                  — 디모데후서 4:7-8 —
                </p>
              </div>

              {/* 12개 통독 배지 미니 요약 */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2 px-1">
                  <span>획득한 12개 통독 배지</span>
                  <span className="text-amber-600 font-black">12 / 12 완료</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {READING_BADGES_12.map((b) => (
                    <div
                      key={b.level}
                      className="flex flex-col items-center bg-white rounded-xl p-1.5 border border-amber-200 shadow-2xs"
                      title={`${b.level}독: ${b.name}`}
                    >
                      <span className="text-xl">{b.icon}</span>
                      <span className="text-[9px] font-black text-amber-700 mt-0.5">{b.level}독</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 버튼 액션 */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCelebrationModal(false);
                    setShowBadgeModal(true);
                  }}
                  className="flex-1 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-black text-xs sm:text-sm border border-amber-300 transition active:scale-95 cursor-pointer"
                >
                  배지 모음 확인하기
                </button>
                <button
                  type="button"
                  onClick={() => setShowCelebrationModal(false)}
                  className="flex-1 py-3 rounded-xl bg-[#1b64b9] hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
                >
                  확인 (닫기)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 성경 통독 배지 모음함 모달 */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 text-slate-800">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1b64b9] to-[#0284c7] px-4 sm:px-5 py-3.5 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-300" />
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  총통독 현황 및 12목표 배지함
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBadgeModal(false)}
                className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer text-white"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Status Card */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-4 border border-blue-100 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-500">목표: 총통독 12목표 달성</span>
                    <p className="text-lg font-black text-slate-900">
                      총통독 달성: <span className="text-[#1b64b9]">{completedReadingsCount}독</span>
                      <span className="text-xs text-slate-400 font-bold ml-1">/ 12독</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-100 text-[#1b64b9]">
                      {Math.min(100, Math.round((completedReadingsCount / 12) * 100))}% 달성
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (completedReadingsCount / 12) * 100)}%` }}
                  />
                </div>

                <p className="text-xs font-semibold text-slate-600">
                  {completedReadingsCount >= 12 ? (
                    <span className="text-amber-700 font-bold">
                      🎉 통독 12목표를 모두 달성하셨습니다! 의의 면류관을 받으셨습니다!
                    </span>
                  ) : (
                    <span>
                      12목표까지 앞으로 <strong className="text-[#1b64b9] font-bold">{12 - completedReadingsCount}번</strong>의 통독이 남았습니다. 힘내세요!
                    </span>
                  )}
                </p>
              </div>

              {/* 12 Badges Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-2.5 uppercase tracking-wider">
                  총통독 12목표 배지 (일독할 때마다 활성화)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {READING_BADGES_12.map((badge) => {
                    const isEarned = completedReadingsCount >= badge.level;
                    return (
                      <div
                        key={badge.level}
                        className={`rounded-2xl p-3 border transition-all text-left relative overflow-hidden flex flex-col justify-between ${
                          isEarned
                            ? 'bg-gradient-to-br from-amber-50 via-yellow-50/70 to-white border-amber-300 shadow-xs'
                            : 'bg-slate-50/80 border-slate-200/80 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-2xl">{badge.icon}</span>
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                              isEarned
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {isEarned ? '✓ 획득' : '🔒 대기'}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-black text-slate-900">{badge.name}</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 line-clamp-1 mt-0.5">
                            {badge.subtitle}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                            {badge.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Management Tools (사용자 설정 / 테스트 도구) */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-2">통독 기록 간편 설정</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => updateReadingsCount((c) => c + 1)}
                    className="py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1b64b9] font-black text-xs border border-blue-200 flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <span>+ 1독 완료</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReadingsCount((c) => Math.max(0, c - 1))}
                    className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                  >
                    <span>- 1독 취소</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateReadingsCount(() => 12);
                      setShowCelebrationModal(true);
                    }}
                    className="py-2 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-black text-xs border border-amber-300 flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer col-span-2 sm:col-span-1"
                  >
                    <span>🎉 12독 달성</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('통독 수 기록을 0으로 초기화하시겠습니까?')) {
                        updateReadingsCount(() => 0);
                      }
                    }}
                    className="py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer col-span-2 sm:col-span-1"
                  >
                    <span>초기화</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowBadgeModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs transition active:scale-95 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Toggle chapter in Matrix
  const toggleChapter = (bookName: string, ch: number) => {
    toggleChapterDirect(bookName, ch);
    setCompletedVerses(getCompletedVerses());
    setCompletedChapters(getCompletedChapters());
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
  const currentBookIdx = BIBLE_BOOKS.findIndex((b) => b.name === selectedStatusBook);

  // Statistics & chapter status list for '읽기 계획 현황'
  const statusBookStats = React.useMemo(() => {
    const total = currentStatusBookObj.chaptersCount || 50;
    let doneCount = 0;
    let readingCount = 0;
    let unreadCount = 0;

    const list: {
      ch: number;
      status: 'done' | 'reading' | 'unread';
      readVerses: number;
      totalVerses: number;
    }[] = [];

    for (let ch = 1; ch <= total; ch++) {
      const isDone = isChapterFullyRead(selectedStatusBook, ch, completedVerses);
      const readVerses = getChapterReadVersesCount(selectedStatusBook, ch);
      const totalVerses = getChapterVerseCount(selectedStatusBook, ch);

      if (isDone) {
        doneCount++;
        list.push({ ch, status: 'done', readVerses: totalVerses, totalVerses });
      } else if (readVerses > 0) {
        readingCount++;
        list.push({ ch, status: 'reading', readVerses, totalVerses });
      } else {
        unreadCount++;
        list.push({ ch, status: 'unread', readVerses: 0, totalVerses });
      }
    }

    const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    return { total, doneCount, readingCount, unreadCount, percent, list };
  }, [selectedStatusBook, currentStatusBookObj, completedVerses, completedChapters]);

  // Filtered chapters according to statusChapterFilter
  const filteredStatusChapters = React.useMemo(() => {
    if (statusChapterFilter === 'all') return statusBookStats.list;
    return statusBookStats.list.filter((item) => item.status === statusChapterFilter);
  }, [statusBookStats, statusChapterFilter]);

  // Smart Resume in '읽기 계획 현황'
  const smartStatusResume = React.useMemo(() => {
    const inProgress = statusBookStats.list.find((c) => c.status === 'reading');
    if (inProgress) {
      return {
        ch: inProgress.ch,
        title: `${selectedStatusBook} ${inProgress.ch}장`,
        desc: `📖 ${inProgress.readVerses}/${inProgress.totalVerses}절 읽는 중 (이어서 읽기)`,
        actionText: '이어서 읽기 >',
      };
    }
    const firstUnread = statusBookStats.list.find((c) => c.status === 'unread');
    if (firstUnread) {
      return {
        ch: firstUnread.ch,
        title: `${selectedStatusBook} ${firstUnread.ch}장`,
        desc: '⚡ 다음 읽을 말씀',
        actionText: '읽기 시작 >',
      };
    }
    return {
      ch: 1,
      title: `${selectedStatusBook} ${statusBookStats.total}장 전장 완독 달성! 🎉`,
      desc: '축하합니다! 완독을 완료하셨습니다.',
      actionText: '다시 읽기 >',
    };
  }, [selectedStatusBook, statusBookStats]);

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

        {/* 2. Dark Sub-Bar (관리자 모드[관리자만 노출], BIBLEONLINE 3.0, 앱 설치, 🔄, 심) */}
        <div className="bg-[#1e2026] text-white px-3 sm:px-4 py-2 flex items-center justify-between text-xs flex-shrink-0 border-b border-slate-700/50 z-30">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenAdminManagement) {
                    onOpenAdminManagement();
                  } else {
                    alert('관리자 성경관리 프로그램을 엽니다.');
                  }
                }}
                className="border border-amber-400/80 rounded-md px-2 py-0.5 text-amber-300 font-bold text-[11px] flex items-center gap-1 flex-shrink-0 hover:bg-amber-400/20 active:scale-95 transition cursor-pointer"
                title="관리자 성경관리 프로그램 열기"
              >
                <span>👑</span>
                <span>관리자 모드</span>
              </button>
            )}
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

        {/* 3. Section Header: Back button + 상세 진도표 + 데이터 아카이브 (총통독 메뉴 삭제, 스마트폰 가로 한 줄 정렬) */}
        <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between bg-white border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackFromTotalProgress}
              className="p-1 -ml-1 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
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
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
                상세 진도표
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('데이터 아카이브: 과거 통독 기록')}
            className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer whitespace-nowrap"
          >
            <span>🗄</span>
            <span>데이터 아카이브</span>
          </button>
        </div>

        {/* 4. 2-Tab Menu: 일독상세표 vs 목표상세표 (12독) - 스마트폰 맞춤 가로 정렬 */}
        <div className="px-3 sm:px-4 pt-2.5 pb-2 bg-white flex-shrink-0">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs sm:text-sm font-black">
            <button
              type="button"
              onClick={() => setProgressDetailMode('single')}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                progressDetailMode === 'single'
                  ? 'bg-white text-[#1b64b9] shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>📖</span>
              <span className="whitespace-nowrap">일독상세표</span>
            </button>
            <button
              type="button"
              onClick={() => setProgressDetailMode('goal')}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                progressDetailMode === 'goal'
                  ? 'bg-white text-[#1b64b9] shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>🎯</span>
              <span className="whitespace-nowrap">목표상세표 ({targetGoalReads}독)</span>
            </button>
          </div>
        </div>

        {/* 5. Sub-bar: 구약 / 신약 + 해당 상세표 전용 통독 초기화 버튼 (가로 정렬) */}
        <div className="px-3 sm:px-4 py-2 flex items-center justify-between bg-white border-b border-slate-100 flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <button
              type="button"
              onClick={() => setSelectedTestament('OT')}
              className={`text-xs sm:text-sm font-black transition cursor-pointer pb-0.5 ${
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
              className={`text-xs sm:text-sm font-black transition cursor-pointer pb-0.5 ${
                selectedTestament === 'NT'
                  ? 'text-slate-900 border-b-2 border-[#1b64b9]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              신약 성경 (27권)
            </button>
          </div>

          {progressDetailMode === 'single' ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('현재 1독 진행 중인 모든 장의 읽기 완료 기록을 초기화하시겠습니까?')) {
                  resetAllReadingProgress();
                }
              }}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer whitespace-nowrap flex-shrink-0"
              title="현재 1독 읽기 기록 초기화"
            >
              <span>🔄</span>
              <span>일독 초기화</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('12목표 누적 통독 기록을 0으로 초기화하시겠습니까?')) {
                  updateReadingsCount(() => 0);
                }
              }}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer whitespace-nowrap flex-shrink-0"
              title="12목표 통독 기록 초기화"
            >
              <span>🔄</span>
              <span>목표 초기화</span>
            </button>
          )}
        </div>

        {/* 6. Summary Banner: 일독 진도 vs 12독 목표 진도 */}
        <div className="px-3 sm:px-4 py-1.5 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 flex-shrink-0">
          <div className="flex items-center gap-1 font-bold text-slate-600 truncate">
            {progressDetailMode === 'single' ? (
              <>
                <span className="text-[#10b981]">●</span>
                <span className="whitespace-nowrap">
                  일독 진도: 총 1,189장 중 <strong className="text-emerald-600 font-black">{totalReadChAll}장</strong> 완독 ({singleReadPercent}%)
                </span>
              </>
            ) : (
              <>
                <span className="text-[#1b64b9]">●</span>
                <span className="whitespace-nowrap">
                  12독 목표: 총 14,268장 중 <strong className="text-[#1b64b9] font-black">{totalCumChAll.toLocaleString()}장</strong> 완독 ({goal12ProgressPercent}%)
                </span>
              </>
            )}
          </div>
          <span className="text-slate-400 font-medium whitespace-nowrap hidden sm:inline">
            책 클릭 시 해당 성경으로 바로 이동
          </span>
        </div>

        {/* 7. Cards Grid (일독상세표: 50장 기준 | 목표상세표: 12독 기준 창세기 600장) */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 pb-24 bg-[#f8fafc]">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {displayedBooks.map((book) => {
              let readCount = 0;
              for (let ch = 1; ch <= book.chaptersCount; ch++) {
                if (isChapterFullyRead(book.name, ch, completedVerses)) {
                  readCount++;
                }
              }

              if (progressDetailMode === 'single') {
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
              } else {
                // 목표상세표: 12독 목표 기준 (예: 창세기 50장 * 12 = 600장)
                const targetChapters = book.chaptersCount * targetGoalReads;
                const cumRead = Math.min(
                  targetChapters,
                  completedReadingsCount * book.chaptersCount + readCount
                );
                const goalPercent = Math.min(100, Math.round((cumRead / targetChapters) * 100));
                const bookDoneRounds = completedReadingsCount + (readCount === book.chaptersCount ? 1 : 0);

                return (
                  <div
                    key={book.id}
                    onClick={() => openChapterGrid('total-progress', book.name)}
                    className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all text-left cursor-pointer group active:scale-98 flex flex-col justify-between min-h-[72px]"
                    title={`${book.name} 12목표 누적 진도 확인 (${cumRead}/${targetChapters}장)`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#1b64b9] transition-colors">
                        {book.name}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-700">
                        <strong className="text-[#1b64b9] font-black">{cumRead}</strong>/{targetChapters}장
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-1">
                      <span>{Math.min(targetGoalReads, bookDoneRounds)}/{targetGoalReads}회 완독</span>
                      <span className="text-[#1b64b9] font-bold">{goalPercent}%</span>
                    </div>

                    <div className="w-full bg-slate-100 h-1.5 sm:h-2 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-gradient-to-r from-[#1b64b9] to-blue-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${goalPercent}%` }}
                      />
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
        {renderModals()}
      </div>
    );
  }

  // ==========================================
  // SCREEN B: 읽기 계획 현황 (1번 인터랙티브 필터 탭 & 스마트 진도표 적용)
  // ==========================================
  if (subScreen === 'chapter-grid') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] relative overflow-hidden select-none text-slate-800">
        {/* Top Header (Deep Blue #1b64b9) */}
        <header className="bg-[#1b64b9] text-white px-3 py-3 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          <button
            type="button"
            onClick={handleBackFromChapterGrid}
            className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="뒤로 가기"
          >
            <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
          </button>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex-1 text-center -ml-2">
            읽기 계획 현황
          </h1>
          <button
            type="button"
            onClick={() => setShowBookSelectorModal(true)}
            className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 flex-shrink-0"
            title="66권 성경 선택"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">성경 변경</span>
          </button>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 smooth-scroll">
          {/* Main White Card (성경 선택, 진도율, 필터 탭, 챕터 그리드) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 max-w-md mx-auto">
            {/* 1. 성경 책 전환 바 및 진도율 요약 */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                disabled={currentBookIdx <= 0}
                onClick={() => {
                  if (currentBookIdx > 0) {
                    setSelectedStatusBook(BIBLE_BOOKS[currentBookIdx - 1].name);
                    setStatusChapterFilter('all');
                  }
                }}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-25 disabled:pointer-events-none text-slate-700 transition cursor-pointer active:scale-95"
                title="이전 성경으로 이동"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div
                onClick={() => setShowBookSelectorModal(true)}
                className="text-center cursor-pointer group hover:opacity-90 transition px-2 py-1 rounded-xl hover:bg-slate-50"
                title="클릭하여 다른 성경책 선택"
              >
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center justify-center gap-1.5">
                  <span>{selectedStatusBook}</span>
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-[#1b64b9] transition-colors">
                    ▼
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#1b64b9] font-black border border-blue-200/60 ml-1">
                    {currentStatusBookObj.testament === 'OT' ? '구약' : '신약'} {currentStatusBookObj.chaptersCount}장
                  </span>
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  완독 진도: <strong className="text-[#05c46b] font-black">{statusBookStats.doneCount}</strong> / {statusBookStats.total}장 ({statusBookStats.percent}%)
                </p>
              </div>

              <button
                type="button"
                disabled={currentBookIdx >= BIBLE_BOOKS.length - 1}
                onClick={() => {
                  if (currentBookIdx < BIBLE_BOOKS.length - 1) {
                    setSelectedStatusBook(BIBLE_BOOKS[currentBookIdx + 1].name);
                    setStatusChapterFilter('all');
                  }
                }}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-25 disabled:pointer-events-none text-slate-700 transition cursor-pointer active:scale-95"
                title="다음 성경으로 이동"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* 2. 권별 진도율 프로그레스 바 */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
              <div
                className="bg-[#05c46b] h-full rounded-full transition-all duration-300"
                style={{ width: `${statusBookStats.percent}%` }}
              />
            </div>

            {/* 3. [1번 핵심] 선택형 필터 탭 (전체 | 완독 | 읽는 중 | 미완료) */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusChapterFilter('all')}
                className={`py-2 px-1 rounded-xl transition cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                  statusChapterFilter === 'all'
                    ? 'bg-white text-slate-900 font-black shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>전체</span>
                <span className="text-[11px] font-black text-slate-800">{statusBookStats.total}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusChapterFilter('done')}
                className={`py-2 px-1 rounded-xl transition cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                  statusChapterFilter === 'done'
                    ? 'bg-[#05c46b] text-white font-black shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#05c46b] inline-block" />
                  완독
                </span>
                <span className={`text-[11px] font-black ${statusChapterFilter === 'done' ? 'text-white' : 'text-emerald-600'}`}>
                  {statusBookStats.doneCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusChapterFilter('reading')}
                className={`py-2 px-1 rounded-xl transition cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                  statusChapterFilter === 'reading'
                    ? 'bg-[#f59f00] text-white font-black shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fcc419] inline-block" />
                  읽는 중
                </span>
                <span className={`text-[11px] font-black ${statusChapterFilter === 'reading' ? 'text-white' : 'text-amber-600'}`}>
                  {statusBookStats.readingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusChapterFilter('unread')}
                className={`py-2 px-1 rounded-xl transition cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                  statusChapterFilter === 'unread'
                    ? 'bg-slate-700 text-white font-black shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full border border-slate-400 bg-white inline-block" />
                  미완료
                </span>
                <span className={`text-[11px] font-black ${statusChapterFilter === 'unread' ? 'text-white' : 'text-slate-500'}`}>
                  {statusBookStats.unreadCount}
                </span>
              </button>
            </div>

            {/* 4. 6-Column Chapter Number Circle Grid */}
            {filteredStatusChapters.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <p className="text-xs sm:text-sm font-bold">
                  {statusChapterFilter === 'done' && '아직 완독한 장이 없습니다.'}
                  {statusChapterFilter === 'reading' && '현재 읽는 중인 장이 없습니다.'}
                  {statusChapterFilter === 'unread' && '모든 장을 완독하셨습니다! 🎉'}
                </p>
                <button
                  type="button"
                  onClick={() => setStatusChapterFilter('all')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  전체 보기로 돌아가기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2.5 sm:gap-3 justify-items-center py-2">
                {filteredStatusChapters.map((item) => {
                  const isDone = item.status === 'done';
                  const isReading = item.status === 'reading';

                  return (
                    <button
                      key={item.ch}
                      type="button"
                      onClick={() => {
                        onNavigateToBible(selectedStatusBook, item.ch, 1);
                      }}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex flex-col items-center justify-center text-sm sm:text-base font-extrabold transition-all cursor-pointer active:scale-90 relative ${
                        isDone
                          ? 'bg-[#05c46b] text-white font-black shadow-xs ring-2 ring-emerald-300'
                          : isReading
                          ? 'bg-[#fff9db] border-2 border-[#fcc419] text-slate-900 font-black shadow-2xs'
                          : 'bg-[#f1f4f9] hover:bg-slate-200 text-slate-800 font-bold'
                      }`}
                      title={`${selectedStatusBook} ${item.ch}장 본문 이동 (${
                        isDone ? '완독' : isReading ? `${item.readVerses}/${item.totalVerses}절 읽는 중` : '미완료'
                      })`}
                    >
                      <span className={isReading ? 'text-xs sm:text-sm font-black -mt-0.5' : ''}>
                        {item.ch}
                      </span>
                      {isReading && (
                        <span className="text-[9px] font-black text-amber-700 leading-none">
                          {item.readVerses}절
                        </span>
                      )}
                      {isDone && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#059669] text-white flex items-center justify-center text-[8px] font-black shadow-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 5. Read Verses Legend (하단 범례 - 클릭 시 해당 필터로 즉시 전환) */}
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-bold">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStatusChapterFilter('done')}
                  className="flex items-center gap-1.5 hover:opacity-80 cursor-pointer"
                  title="완독된 장만 필터링"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#05c46b] inline-block" />
                  <span className={statusChapterFilter === 'done' ? 'text-emerald-700 font-black' : 'text-slate-700'}>
                    완독
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusChapterFilter('reading')}
                  className="flex items-center gap-1.5 hover:opacity-80 cursor-pointer"
                  title="읽는 중인 장만 필터링"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fcc419] inline-block" />
                  <span className={statusChapterFilter === 'reading' ? 'text-amber-700 font-black' : 'text-slate-700'}>
                    읽는 중
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusChapterFilter('unread')}
                  className="flex items-center gap-1.5 hover:opacity-80 cursor-pointer"
                  title="미완료 장만 필터링"
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-white inline-block" />
                  <span className={statusChapterFilter === 'unread' ? 'text-slate-900 font-black' : 'text-slate-700'}>
                    미완료
                  </span>
                </button>
              </div>

              <span className="text-[11px] font-black text-[#1b64b9]">
                장 터치 시 본문 이동
              </span>
            </div>
          </div>

          {/* 6. Bottom Card: 스마트 맞춤 이어읽기 (읽는 중 우선, 다음 미완료 장 안내) */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between mt-3.5 max-w-md mx-auto">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-slate-500">
                {smartStatusResume.desc}
              </p>
              <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5 truncate">
                {smartStatusResume.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToBible(selectedStatusBook, smartStatusResume.ch, 1)}
              className="px-4 py-2.5 bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer flex-shrink-0"
            >
              {smartStatusResume.actionText}
            </button>
          </div>
        </div>

        {/* 7. Quick Book Selector Modal (66권 선택 팝업) */}
        {showBookSelectorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 w-full max-w-md max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-[#1b64b9]" />
                  <h3 className="text-base font-black text-slate-900">성경 선택 (66권)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookSelectorModal(false)}
                  className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
                <div>
                  <h4 className="text-xs font-black text-[#1b64b9] mb-2 px-1 flex items-center justify-between">
                    <span>구약 (39권)</span>
                    <span className="text-[10px] text-slate-400 font-semibold">창세기 ~ 말라기</span>
                  </h4>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BIBLE_BOOKS.filter((b) => b.testament === 'OT').map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedStatusBook(b.name);
                          setStatusChapterFilter('all');
                          setShowBookSelectorModal(false);
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer truncate ${
                          selectedStatusBook === b.name
                            ? 'bg-[#1b64b9] text-white font-black shadow-xs ring-2 ring-blue-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                        title={`${b.name} (${b.chaptersCount}장)`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-emerald-700 mb-2 px-1 flex items-center justify-between">
                    <span>신약 (27권)</span>
                    <span className="text-[10px] text-slate-400 font-semibold">마태복음 ~ 요한계시록</span>
                  </h4>
                  <div className="grid grid-cols-4 gap-1.5">
                    {BIBLE_BOOKS.filter((b) => b.testament === 'NT').map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedStatusBook(b.name);
                          setStatusChapterFilter('all');
                          setShowBookSelectorModal(false);
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer truncate ${
                          selectedStatusBook === b.name
                            ? 'bg-[#1b64b9] text-white font-black shadow-xs ring-2 ring-blue-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                        title={`${b.name} (${b.chaptersCount}장)`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderModals()}
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
                    const isRead = completedChapters.has(`${book.name}-${ch}`) || isChapterFullyRead(book.name, ch, completedVerses);
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
                <span className="truncate">{user?.name || '성도'} - 개역개정 | 구약/신약</span>
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
              <span>일독 진행률</span>
              <span className="font-mono text-white">
                <span className="text-amber-300 font-bold">{totalReadChAll}</span> / {TOTAL_CHAPTERS.toLocaleString()}장
              </span>
            </div>
          </div>
        </div>
        {renderModals()}
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

                    {user?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowManageMenu(false);
                          if (onOpenAdminManagement) {
                            onOpenAdminManagement();
                          }
                        }}
                        className="w-full px-4 py-2 text-left text-xs sm:text-sm font-black hover:bg-amber-50 text-amber-900 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                      >
                        👑 관리자 성경관리
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 pb-20">
          {/* Main Plan Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100">
            {/* 12 Readings Completed Celebration Banner */}
            {completedReadingsCount >= 12 && (
              <div
                onClick={() => setShowCelebrationModal(true)}
                className="mb-3.5 p-3 sm:p-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-white rounded-2xl shadow-md flex items-center justify-between cursor-pointer hover:brightness-105 active:scale-98 transition animate-pulse"
                title="통독 12목표 달성 축하 메시지 보기"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl flex-shrink-0 backdrop-blur-xs">
                    🏆
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black bg-white/25 px-2 py-0.5 rounded-full text-yellow-50">
                        목표 달성!
                      </span>
                      <span className="text-xs font-bold text-yellow-100">통독 12목표 완수</span>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-white mt-0.5 tracking-tight">
                      축하합니다! 12독 목표를 모두 달성하셨습니다! 👑
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black bg-white text-amber-700 px-2.5 py-1 rounded-xl shadow-xs flex-shrink-0 ml-1">
                  축하보기 &gt;
                </span>
              </div>
            )}

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
                <p className="text-xs text-slate-400 font-bold mb-1">12독 진행률</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">
                  {goal12ProgressPercent}%
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {totalCumChAll.toLocaleString()} / 14,268장
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">현재 일독 진도</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">{singleReadPercent}%</p>
                <p className="text-[10px] text-slate-400 font-medium">{totalReadChAll} / 1,189장</p>
              </div>
              <div
                className="cursor-pointer group hover:bg-blue-50/60 rounded-xl py-0.5 transition"
                onClick={() => setShowBadgeModal(true)}
                title="총통독 현황 및 12목표 배지함 열기"
              >
                <p className="text-xs text-slate-400 group-hover:text-blue-600 font-bold mb-1 flex items-center justify-center gap-0.5 transition">
                  <span className="font-extrabold text-slate-700 group-hover:text-[#1b64b9]">총통독</span>
                  <span>&gt;</span>
                </p>
                <p className="text-xl sm:text-2xl font-black text-[#1b64b9] flex items-center justify-center gap-0.5">
                  {completedReadingsCount >= 12 && <span className="text-base">👑</span>}
                  <span>{completedReadingsCount}독</span>
                  <span className="text-xs text-slate-400 font-bold ml-0.5">/ 12독</span>
                </p>
              </div>
            </div>

            <div className="pt-4 pb-1">
              <div className="relative w-full h-8 flex items-center">
                <div
                  className="absolute bottom-1 transition-all duration-300"
                  style={{
                    left: `${Math.max(2, Math.min(96, goal12ProgressPercent))}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <span
                    className="text-2xl select-none inline-block transition-transform"
                    style={{ transform: 'scaleX(-1)' }}
                    role="img"
                    aria-label="runner"
                    title={`12독 성경통독 진행률 ${goal12ProgressPercent}% (${totalCumChAll.toLocaleString()}/14,268장)`}
                  >
                    🏃
                  </span>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                  style={{ width: `${goal12ProgressPercent}%` }}
                />
              </div>
            </div>

            {/* 1) 1독(1,189장) 완독 시 +1독 기록 안내 */}
            {totalReadChAll >= 1189 && (
              <div className="mt-3.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 text-xs sm:text-sm font-bold">
                  <span>🎉</span>
                  <span>성경 66권 1,189장 일독을 완수하셨습니다!</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateReadingsCount((c) => c + 1);
                    alert(`축하합니다! 총 통독 수가 ${completedReadingsCount + 1}독으로 기록되었습니다.`);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-lg shadow-xs transition cursor-pointer flex-shrink-0 ml-2"
                >
                  +1독 완독 기록
                </button>
              </div>
            )}

            {/* 2) 12독(14,268장) 전체 완수 시 축하 */}
            {totalCumChAll >= 14268 && (
              <div className="mt-3.5 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2 text-amber-900 text-xs sm:text-sm font-extrabold">
                  <span>👑</span>
                  <span>대단하십니다! 통독 12목표(14,268장)를 100% 완수하셨습니다!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCelebrationModal(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black rounded-lg shadow-xs transition cursor-pointer flex-shrink-0 ml-2"
                >
                  축하보기
                </button>
              </div>
            )}

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
                      const isDone = isChapterFullyRead('창세기', ch, completedVerses);
                      const readCount = getChapterReadVersesCount('창세기', ch);
                      const isReading = !isDone && readCount > 0;

                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => onNavigateToBible('창세기', ch, 1)}
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-base font-extrabold transition cursor-pointer active:scale-90 relative ${
                            isDone
                              ? 'bg-[#05c46b] text-white font-black shadow-xs ring-2 ring-emerald-300'
                              : isReading
                              ? 'bg-[#fff9db] border-2 border-[#fcc419] text-slate-800 font-black shadow-2xs'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 shadow-2xs'
                          }`}
                          title={`창세기 ${ch}장 본문으로 이동 (${isDone ? '완독' : isReading ? `${readCount}절 읽는 중` : '미완료'})`}
                        >
                          <span>{ch}</span>
                          {isDone && (
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
        {renderModals()}
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
        {/* Card 1: 로고스 관리자 (일독 1,189장 과정 및 진행률) */}
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
              {user?.name || '로고스 관리자'}
            </h2>

            <p className="text-sm font-extrabold text-[#0284c7] text-center mt-1">
              {singleReadPercent}% 진행 중
            </p>
            <p className="text-[11px] font-bold text-slate-500 text-center mt-0.5">
              1독: {totalReadChAll}장 / 1,189장 완독
            </p>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-3">
              <div
                className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                style={{ width: `${singleReadPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToBible(nextUnreadChapter.book, nextUnreadChapter.chapter, 1)}
              className="w-full py-2.5 rounded-xl bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition shadow-sm cursor-pointer"
              title={`${nextUnreadChapter.book} ${nextUnreadChapter.chapter}장 이어읽기`}
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

        {/* Card 2: 통독12목표 (총 12독 14,268장 과정 및 진행률) */}
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

            <p className="text-sm font-extrabold text-[#0284c7] text-center mt-1 flex items-center justify-center gap-1.5 flex-wrap">
              <span>{goal12ProgressPercent}% 진행 중</span>
              <button
                type="button"
                onClick={() => setShowBadgeModal(true)}
                className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black cursor-pointer hover:bg-blue-100 transition active:scale-95"
                title="총통독 현황 및 12목표 배지함 열기"
              >
                {completedReadingsCount >= 12
                  ? '👑 총통독: 12독 완수!'
                  : `총통독: ${completedReadingsCount}독 / 12독`}
              </button>
            </p>
            <p className="text-[11px] font-bold text-slate-500 text-center mt-0.5">
              12독: {totalCumChAll.toLocaleString()}장 / 14,268장 완독
            </p>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-3">
              <div
                className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                style={{ width: `${goal12ProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => openChapterGrid('main', nextUnreadChapter.book)}
              className="w-full py-2.5 rounded-xl bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition shadow-sm cursor-pointer"
              title={`${nextUnreadChapter.book} 읽기 계획 현황 열기`}
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
      {renderModals()}
    </div>
  );
};
