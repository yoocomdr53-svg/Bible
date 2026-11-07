import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  Search,
  Volume2,
  VolumeX,
  ArrowDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  X,
  Sun,
  Moon,
  Mic,
  Share2,
  Check,
} from 'lucide-react';
import {
  BIBLE_BOOKS,
  SAMPLE_VERSES_CHAPTER,
  getChapterVerseCount,
  getCompletedVerses,
  toggleVerseCompleted,
  markChapterVersesCompleted,
} from '../data/bibleData';
import { BibleVerse } from '../types';
import { BibleSelectorModal } from './BibleSelectorModal';

interface BibleReaderViewProps {
  onOpenVerseCard: (verse: BibleVerse) => void;
  onOpenRecorder: (verse: BibleVerse) => void;
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
  initialRecordingMode?: boolean;
  onBackToHome?: () => void;
  onBackToSelector?: () => void;
}

export const BibleReaderView: React.FC<BibleReaderViewProps> = ({
  onOpenVerseCard,
  onOpenRecorder,
  initialBook = '창세기',
  initialChapter = 1,
  initialVerse = 1,
  initialRecordingMode = false,
  onBackToHome,
  onBackToSelector,
}) => {
  const [selectedBook, setSelectedBook] = useState(initialBook);
  const [selectedChapter, setSelectedChapter] = useState(initialChapter);
  const [selectedVerse, setSelectedVerse] = useState(initialVerse);
  const [selectedTranslation, setSelectedTranslation] = useState<'개역개정' | '개역한글' | '쉬운성경' | 'NIV'>('개역개정');

  // Screen display settings (matching user uploaded screenshot)
  const [fontFamily, setFontFamily] = useState<'기본' | '나눔고딕' | '나눔명조'>('기본');
  const [isBold, setIsBold] = useState(false);
  const [fontSizePt, setFontSizePt] = useState(17);
  const [scrollSpeed, setScrollSpeed] = useState(13);
  const [isInverted, setIsInverted] = useState(false);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(186); // 03:06
  const [voiceType, setVoiceType] = useState('남성(중저음)');

  // Bible Reading Recording Mode (성경낭독녹음 모드 - matching user uploaded screenshot)
  const [isRecordingMode, setIsRecordingMode] = useState(initialRecordingMode);
  const [activeRecordVerse, setActiveRecordVerse] = useState<number>(initialVerse || 1);
  const [isRecordingNow, setIsRecordingNow] = useState(false);
  const [recordDurationSec, setRecordDurationSec] = useState(0);
  const [isContinuousRecording, setIsContinuousRecording] = useState(true);
  const [recordedVerses, setRecordedVerses] = useState<number[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  // UI Modals
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [selectorInitialStep, setSelectorInitialStep] = useState<'book' | 'chapter' | 'verse'>('book');
  const [showTransModal, setShowTransModal] = useState(false);
  const [showScreenSettings, setShowScreenSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedVerses, setHighlightedVerses] = useState<number[]>([]);

  // 성경 읽기 완료된 절 관리 상태
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

  const contentRef = useRef<HTMLDivElement>(null);

  // Sync with prop changes
  useEffect(() => {
    setSelectedBook(initialBook);
    setSelectedChapter(initialChapter);
    setSelectedVerse(initialVerse);
    setActiveRecordVerse(initialVerse || 1);
  }, [initialBook, initialChapter, initialVerse]);

  // Generate or fetch verses (defined BEFORE any derived counts to prevent temporal dead zone ReferenceError!)
  const key = `${selectedBook}-${selectedChapter}`;
  const verses = React.useMemo(() => {
    if (SAMPLE_VERSES_CHAPTER[key]) {
      return SAMPLE_VERSES_CHAPTER[key];
    }
    const count = getChapterVerseCount(selectedBook, selectedChapter);
    const generated = [];
    for (let i = 1; i <= count; i++) {
      generated.push({
        verse: i,
        text: `${selectedBook} ${selectedChapter}장 ${i}절 말씀입니다. 주의 말씀은 내 발에 등이요 내 길에 빛이니이다. 여호와는 나의 목자시니 내게 부족함이 없으리로다.`,
      });
    }
    return generated;
  }, [key, selectedBook, selectedChapter]);

  const handleToggleVerseRead = (v: number) => {
    toggleVerseCompleted(selectedBook, selectedChapter, v);
    setCompletedVerses(getCompletedVerses());
  };

  const handleCompleteAllChapterVerses = () => {
    markChapterVersesCompleted(selectedBook, selectedChapter, verses.length);
    setCompletedVerses(getCompletedVerses());
  };

  const chapterReadVersesCount = verses.filter((v) =>
    completedVerses.has(`${selectedBook}-${selectedChapter}-${v.verse}`)
  ).length;

  // Auto-scroll to selected verse and highlight
  useEffect(() => {
    if (selectedVerse && !isRecordingMode) {
      setHighlightedVerses([selectedVerse]);
      const timer = setTimeout(() => {
        const el = document.getElementById(`verse-row-${selectedVerse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedBook, selectedChapter, selectedVerse, isRecordingMode]);

  // Scroll to active recording verse in recording mode
  useEffect(() => {
    if (isRecordingMode && activeRecordVerse) {
      const el = document.getElementById(`record-verse-row-${activeRecordVerse}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [isRecordingMode, activeRecordVerse]);

  // Audio speech synthesis simulation
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Recording timer simulation
  useEffect(() => {
    let interval: any;
    if (isRecordingNow) {
      interval = setInterval(() => {
        setRecordDurationSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecordingNow]);

  const togglePlay = () => {
    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        const textToRead = verses.map((v) => `${v.verse}절. ${v.text}`).join(' ');
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'ko-KR';
        utterance.rate = voiceType.includes('중저음') ? 0.9 : 1.0;
        utterance.pitch = voiceType.includes('중저음') ? 0.8 : 1.0;
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatHMS = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter((prev) => prev - 1);
      setSelectedVerse(1);
      setActiveRecordVerse(1);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleNextChapter = () => {
    const currentBookObj = BIBLE_BOOKS.find((b) => b.name === selectedBook);
    const maxCh = currentBookObj ? currentBookObj.chaptersCount : 50;
    if (selectedChapter < maxCh) {
      setSelectedChapter((prev) => prev + 1);
      setSelectedVerse(1);
      setActiveRecordVerse(1);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleScrollDown = () => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: scrollSpeed * 22, behavior: 'smooth' });
    }
  };

  const handleOpenSelector = (step: 'book' | 'chapter' | 'verse' = 'book') => {
    setSelectorInitialStep(step);
    setShowSelectorModal(true);
  };

  const handleSelectLocation = (book: string, chapter: number, verse: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setSelectedVerse(verse);
    setActiveRecordVerse(verse);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Recording controls
  const handleToggleRecord = () => {
    if (isRecordingNow) {
      // Stop recording
      setIsRecordingNow(false);
      if (!recordedVerses.includes(activeRecordVerse)) {
        setRecordedVerses((prev) => [...prev, activeRecordVerse]);
      }
      // If continuous recording, advance to next verse
      if (isContinuousRecording && activeRecordVerse < verses.length) {
        setActiveRecordVerse((prev) => prev + 1);
      }
    } else {
      // Start recording
      setIsRecordingNow(true);
    }
  };

  const handleCompleteRecording = () => {
    setIsRecordingNow(false);
    alert(`${selectedBook} ${selectedChapter}장 낭독 녹음이 안전하게 저장되었습니다.`);
    setIsRecordingMode(false);
  };

  const filteredVerses = searchQuery.trim()
    ? verses.filter((v) => v.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : verses;

  // ==========================================
  // MODE 1: 성경 낭독 녹음 화면 (Matching User Uploaded Image)
  // ==========================================
  if (isRecordingMode) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden select-none text-slate-800">
        {/* 1. Header (Dark Sage / Olive Green #496557) */}
        <header className="bg-[#496557] text-white px-3 py-2 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          {/* Left: Book & Chapter and Translation */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenSelector('book')}
              className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded-lg transition cursor-pointer"
            >
              <span className="text-[15px] sm:text-base font-extrabold whitespace-nowrap">
                {selectedBook} {selectedChapter}장
              </span>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                ▽
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowTransModal(true)}
              className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded-lg transition cursor-pointer"
            >
              <span className="text-[13px] sm:text-sm font-bold whitespace-nowrap">
                {selectedTranslation}
              </span>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                ▽
              </span>
            </button>
          </div>

          {/* Right: A 글자 and ✕ Close button */}
          <div className="flex items-center gap-3 text-white">
            <button
              type="button"
              onClick={() => setShowScreenSettings(true)}
              className="flex flex-col items-center justify-center hover:bg-white/15 px-1.5 py-0.5 rounded-lg transition cursor-pointer"
              title="글자 크기 및 화면 설정"
            >
              <span className="text-base font-serif font-black leading-none">A</span>
              <span className="text-[9px] font-medium leading-none mt-0.5">글자</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRecordingNow(false);
                setIsRecordingMode(false);
              }}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="녹음 모드 종료"
            >
              <X className="w-6 h-6 stroke-[2.2]" />
            </button>
          </div>
        </header>

        {/* 2. Top Notice Banner: "성경낭독녹음 기능을 이용하고 계십니다" */}
        <div className="bg-[#f8faf9] border-b border-slate-200/90 px-4 py-2 flex items-center gap-2.5 z-20 flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-[#8c6d58] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            성경낭독녹음 기능을 이용하고 계십니다
          </span>
        </div>

        {/* 3. Sub-toolbar: < > | 녹음현황·공유 ➦ | 연속 녹음 ON */}
        <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-xs flex-shrink-0 z-20">
          {/* Left Chevrons: navigate active recording verse */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveRecordVerse((prev) => Math.max(1, prev - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
              title="이전 절 선택"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveRecordVerse((prev) => Math.min(verses.length, prev + 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
              title="다음 절 선택"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Center: 녹음현황·공유 ➦ */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition shadow-2xs cursor-pointer"
          >
            <span>녹음현황·공유</span>
            <span className="text-[13px]">➦</span>
          </button>

          {/* Right: 연속 녹음 ON/OFF */}
          <button
            type="button"
            onClick={() => setIsContinuousRecording(!isContinuousRecording)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-[11px] transition shadow-2xs cursor-pointer"
          >
            <span>연속 녹음</span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full text-white ${
                isContinuousRecording ? 'bg-[#dc2626]' : 'bg-slate-400'
              }`}
            >
              {isContinuousRecording ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* 4. Verse List Body with Selection Radio Circles */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 smooth-scroll bg-white"
          style={{
            fontFamily:
              fontFamily === '나눔고딕'
                ? "'Nanum Gothic', sans-serif"
                : fontFamily === '나눔명조'
                ? "'Nanum Myeongjo', serif"
                : "'Noto Sans KR', sans-serif",
          }}
        >
          <div className="max-w-2xl mx-auto space-y-3.5">
            {verses.map((v) => {
              const isSelected = activeRecordVerse === v.verse;
              const isRecorded = recordedVerses.includes(v.verse);

              return (
                <div
                  id={`record-verse-row-${v.verse}`}
                  key={v.verse}
                  onClick={() => setActiveRecordVerse(v.verse)}
                  className={`flex items-start gap-3 py-2 px-3 rounded-xl transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 border border-emerald-300 shadow-xs'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Selection Radio Circle */}
                  <div className="pt-1 flex-shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[#496557] bg-[#496557]'
                          : isRecorded
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-300 bg-slate-100'
                      }`}
                    >
                      {isSelected ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      ) : isRecorded ? (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      ) : null}
                    </div>
                  </div>

                  {/* Verse Number */}
                  <span className="text-[15px] sm:text-base font-black text-slate-900 select-none min-w-[16px] pt-0.5">
                    {v.verse}
                  </span>

                  {/* Verse Text */}
                  <p
                    className="flex-1 text-slate-800 tracking-tight"
                    style={{
                      fontSize: `${fontSizePt}px`,
                      lineHeight: `${fontSizePt * 1.8}px`,
                      fontWeight: isBold ? 700 : 400,
                    }}
                  >
                    {v.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Audio Recording Bottom Control Bar (Matching User Screenshot) */}
        <div className="bg-[#fcfdfc] border-t border-slate-200 px-4 pt-2.5 pb-3 z-20 flex-shrink-0 shadow-lg">
          {/* Progress Timeline with Timestamps 00:00:00 */}
          <div className="space-y-1">
            <div className="relative w-full flex items-center">
              <input
                type="range"
                min={0}
                max={Math.max(60, recordDurationSec + 30)}
                value={recordDurationSec}
                onChange={() => {}}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
              <span>{formatHMS(recordDurationSec)}</span>
              <span>{formatHMS(0)}</span>
            </div>
          </div>

          {/* Floating Tooltip: "녹음 버튼을 누르시면 N절이 녹음됩니다" */}
          <div className="flex justify-center my-2">
            <div
              className={`text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md transition-all ${
                isRecordingNow ? 'bg-red-600 animate-pulse' : 'bg-[#4a5568]'
              }`}
            >
              {isRecordingNow
                ? `🔴 ${activeRecordVerse}절 낭독 녹음 중입니다... (터치 시 정지)`
                : `녹음 버튼을 누르시면 ${activeRecordVerse}절이 녹음됩니다`}
            </div>
          </div>

          {/* 3 Main Action Buttons: 전체 재생 | 🎙 (Microphone) | 완료 */}
          <div className="flex items-center justify-around px-4 pt-1">
            {/* 1. 전체 재생 Button */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={togglePlay}
                className="w-12 h-12 rounded-full border-2 border-slate-600 bg-white hover:bg-slate-50 active:scale-95 flex items-center justify-center text-slate-800 shadow-sm transition cursor-pointer"
                title="전체 재생"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-slate-800" /> : <Play className="w-5 h-5 fill-slate-800 ml-0.5" />}
              </button>
              <span className="text-[11px] font-bold text-slate-800 mt-1">전체 재생</span>
            </div>

            {/* 2. Main Red Microphone Circle Button */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleToggleRecord}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all cursor-pointer active:scale-90 ${
                  isRecordingNow
                    ? 'bg-red-600 ring-4 ring-red-300 animate-pulse scale-105'
                    : 'bg-[#ef4444] hover:bg-red-600 ring-4 ring-red-100'
                }`}
                title={isRecordingNow ? '녹음 정지' : '녹음 시작'}
              >
                <Mic className="w-8 h-8 stroke-[2.2]" />
              </button>
            </div>

            {/* 3. 완료 Button */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleCompleteRecording}
                className="w-12 h-12 rounded-full bg-[#786455] hover:bg-[#685548] active:scale-95 text-white flex items-center justify-center shadow-sm transition cursor-pointer"
                title="완료 및 저장"
              >
                <Check className="w-6 h-6 stroke-[2.5]" />
              </button>
              <span className="text-[11px] font-bold text-slate-800 mt-1">완료</span>
            </div>
          </div>
        </div>

        {/* Share & Recording Status Modal */}
        {showShareModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowShareModal(false);
            }}
          >
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0284c7] flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">녹음 현황 및 공유</h3>
              <p className="text-xs text-slate-600 mb-3">
                {selectedBook} {selectedChapter}장 총 {verses.length}절 중{' '}
                <span className="font-bold text-[#0284c7]">{recordedVerses.length}개 구절</span>이 녹음되었습니다.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border text-xs text-slate-700 text-left mb-4 space-y-1">
                <p>• 녹음된 구절: {recordedVerses.length > 0 ? recordedVerses.join(', ') + '절' : '아직 녹음된 구절이 없습니다.'}</p>
                <p>• 저장 위치: 수퍼바이블 클라우드 성도 저장소</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    alert('낭독 오디오 공유 링크가 복사되었습니다!');
                    setShowShareModal(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#0284c7] text-white text-xs font-bold hover:bg-blue-600 transition"
                >
                  공유 링크 복사
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screen Settings Modal can be opened via 'A 글자' in header */}
        {showScreenSettings && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowScreenSettings(false);
            }}
          >
            <div className="w-full max-w-lg mx-auto flex justify-end px-5 pb-2">
              <button
                type="button"
                onClick={() => setShowScreenSettings(false)}
                className="text-white hover:text-slate-200 p-1 cursor-pointer transition active:scale-90"
                title="닫기"
              >
                <X className="w-8 h-8 stroke-[2.2]" />
              </button>
            </div>
            <div className="w-full max-w-lg mx-auto bg-white rounded-t-[28px] p-6 sm:p-7 shadow-2xl space-y-6 text-slate-900 animate-in slide-in-from-bottom duration-200 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-slate-900">폰트변경</span>
                <div className="flex items-center text-[15px]">
                  <button
                    type="button"
                    onClick={() => setFontFamily('기본')}
                    className={`cursor-pointer transition-colors ${
                      fontFamily === '기본' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                    }`}
                  >
                    기본
                  </button>
                  <span className="text-slate-300 mx-2.5 font-light">|</span>
                  <button
                    type="button"
                    onClick={() => setFontFamily('나눔고딕')}
                    className={`cursor-pointer transition-colors ${
                      fontFamily === '나눔고딕' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                    }`}
                  >
                    나눔고딕
                  </button>
                  <span className="text-slate-300 mx-2.5 font-light">|</span>
                  <button
                    type="button"
                    onClick={() => setFontFamily('나눔명조')}
                    className={`cursor-pointer transition-colors ${
                      fontFamily === '나눔명조' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                    }`}
                  >
                    나눔명조
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-slate-900">폰트굵기</span>
                <button
                  type="button"
                  onClick={() => setIsBold(!isBold)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                    isBold ? 'bg-[#0284c7]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                      isBold ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-slate-900">글자크기</span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFontSizePt((prev) => Math.max(12, prev - 1))}
                    className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                  >
                    －
                  </button>
                  <div className="w-28 sm:w-36 flex items-center">
                    <input
                      type="range"
                      min={12}
                      max={26}
                      value={fontSizePt}
                      onChange={(e) => setFontSizePt(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFontSizePt((prev) => Math.min(26, prev + 1))}
                    className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                  >
                    ＋
                  </button>
                  <span className="text-[15px] font-bold text-slate-900 min-w-[38px] text-right">
                    {fontSizePt}pt
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // MODE 2: 일반 성경 본문 화면 (Normal Reader Mode)
  // ==========================================
  return (
    <div
      className={`flex-1 flex flex-col h-full relative overflow-hidden select-none transition-colors duration-200 ${
        isInverted ? 'bg-[#111827] text-slate-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* 1. TOP HEADER (Deep Blue Bar #1b64b9) */}
      <header className="bg-[#1b64b9] text-white px-3 py-2 flex items-center justify-between shadow-md z-30 flex-shrink-0">
        {/* Left: Back button & Dropdowns */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Back Button -> Back to Selector or Home */}
          <button
            type="button"
            onClick={() => {
              if (onBackToSelector) {
                onBackToSelector();
              } else if (onBackToHome) {
                onBackToHome();
              } else {
                handlePrevChapter();
              }
            }}
            title="뒤로 가기"
            className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Book & Chapter Button */}
          <button
            type="button"
            onClick={() => {
              if (onBackToSelector) {
                onBackToSelector();
              } else {
                handleOpenSelector('book');
              }
            }}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 active:scale-95 px-2.5 py-1 rounded-full border border-white/20 transition cursor-pointer"
          >
            <span className="text-[13px] sm:text-sm font-bold whitespace-nowrap">
              {selectedBook} {selectedChapter}장
            </span>
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              ▼
            </span>
          </button>

          {/* Translation Button */}
          <button
            type="button"
            onClick={() => setShowTransModal(true)}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 active:scale-95 px-2.5 py-1 rounded-full border border-white/20 transition cursor-pointer"
          >
            <span className="text-[13px] sm:text-sm font-bold whitespace-nowrap">
              {selectedTranslation}
            </span>
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              ▼
            </span>
          </button>
        </div>

        {/* Right Action Icons: Only 화면설정 & 검색 (원문업로드 removed) */}
        <div className="flex items-center gap-1 sm:gap-2 text-white">
          {/* 화면설정 */}
          <button
            type="button"
            onClick={() => setShowScreenSettings(true)}
            className="flex flex-col items-center justify-center px-1.5 py-0.5 hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="화면 설정"
          >
            <Monitor className="w-4 h-4 text-white" />
            <span className="text-[9px] font-medium leading-tight mt-0.5 text-center">화면설정</span>
          </button>

          {/* 검색 */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="flex flex-col items-center justify-center px-1.5 py-0.5 hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="본문 검색"
          >
            <Search className="w-4 h-4 text-white" />
            <span className="text-[9px] font-medium leading-tight mt-0.5 text-center">검색</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-TOOLBAR (Controls & Badges) */}
      <div
        className={`border-b px-3 py-1.5 flex items-center justify-between text-xs flex-shrink-0 z-20 ${
          isInverted ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        {/* Left Quick Navigation Icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevChapter}
            title="이전장"
            className={`w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer ${
              isInverted ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextChapter}
            title="다음장"
            className={`w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer ${
              isInverted ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? '음성 중지' : '음성 듣기'}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer transition ${
              isPlaying
                ? 'bg-blue-600 text-white border-blue-600'
                : isInverted
                ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleScrollDown}
            title="아래로 스크롤"
            className={`w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer ${
              isInverted ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Center & Right Badges */}
        <div className="flex items-center gap-1.5">
          {/* 선교 헌금 Badge */}
          <button
            type="button"
            onClick={() => setShowOfferingModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 hover:bg-red-100/80 border border-red-200/80 text-red-600 font-bold text-[11px] transition cursor-pointer"
          >
            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
            <span>선교 헌금 &gt;</span>
          </button>

          {/* 남성(중저음) Voice Badge */}
          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border font-bold text-[11px] transition cursor-pointer ${
              isInverted ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <span>👦</span>
            <span>{voiceType}</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      {showSearch && (
        <div
          className={`border-b px-4 py-2 flex items-center gap-2 animate-in slide-in-from-top duration-150 z-20 ${
            isInverted ? 'bg-slate-900 border-slate-800' : 'bg-blue-50/70 border-blue-200'
          }`}
        >
          <Search className="w-4 h-4 text-blue-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="본문 구절 검색 (예: 하나님, 궁창, 빛)"
            className={`flex-1 border rounded-lg px-2.5 py-1 text-xs focus:outline-none ${
              isInverted ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-blue-200 text-slate-900'
            }`}
            autoFocus
          />
          <button type="button" onClick={() => setShowSearch(false)} className="text-slate-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. BIBLE VERSES BODY */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 smooth-scroll"
        style={{
          fontFamily:
            fontFamily === '나눔고딕'
              ? "'Nanum Gothic', sans-serif"
              : fontFamily === '나눔명조'
              ? "'Nanum Myeongjo', serif"
              : "'Noto Sans KR', sans-serif",
        }}
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Section banner */}
          {selectedBook === '창세기' && selectedChapter === 1 && (
            <div className="pt-2 pb-1">
              <button
                type="button"
                className="bg-[#3b747c] hover:bg-[#32636a] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs transition cursor-pointer"
              >
                창세기 이해하기
              </button>
              <h3 className={`text-base sm:text-lg font-extrabold mt-3 mb-1 ${isInverted ? 'text-blue-400' : 'text-[#1b64b9]'}`}>
                천지 창조
              </h3>
            </div>
          )}
          {selectedBook === '창세기' && selectedChapter === 2 && (
            <div className="pt-2 pb-1">
              <button
                type="button"
                className="bg-[#3b747c] hover:bg-[#32636a] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs transition cursor-pointer"
              >
                창세기 이해하기
              </button>
              <h3 className={`text-base sm:text-lg font-extrabold mt-3 mb-1 ${isInverted ? 'text-blue-400' : 'text-[#1b64b9]'}`}>
                안식일과 에덴 동산
              </h3>
            </div>
          )}

          {/* 성경 읽기 완료 현황 및 전체 완독 버튼 */}
          <div className="flex items-center justify-between p-2.5 sm:p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl text-xs font-bold shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                ✓
              </span>
              <span className="text-emerald-950 font-black">
                {selectedBook} {selectedChapter}장 읽기 완료:{' '}
                <strong className="text-emerald-600 font-black">{chapterReadVersesCount}</strong> / {verses.length}절
              </span>
            </div>
            <button
              type="button"
              onClick={handleCompleteAllChapterVerses}
              className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer shadow-xs active:scale-95 ${
                chapterReadVersesCount === verses.length
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {chapterReadVersesCount === verses.length ? '전체 완독됨 ✓' : '이 장 전체 완독 ✓'}
            </button>
          </div>

          {filteredVerses.map((v) => {
            const isHighlighted = highlightedVerses.includes(v.verse);
            const isRead = completedVerses.has(`${selectedBook}-${selectedChapter}-${v.verse}`);
            return (
              <div
                id={`verse-row-${v.verse}`}
                key={v.verse}
                onClick={() => {
                  setHighlightedVerses((prev) =>
                    prev.includes(v.verse) ? prev.filter((n) => n !== v.verse) : [...prev, v.verse]
                  );
                }}
                className={`flex items-start gap-3 py-2 px-2.5 rounded-xl transition cursor-pointer ${
                  isHighlighted
                    ? isInverted
                      ? 'bg-amber-950/60 border border-amber-500/80 shadow-xs'
                      : 'bg-amber-100/80 border-2 border-amber-400 shadow-sm'
                    : isRead
                    ? isInverted
                      ? 'bg-emerald-950/30 border border-emerald-800/50'
                      : 'bg-emerald-50/40 border border-emerald-200/70'
                    : isInverted
                    ? 'hover:bg-slate-800/60'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* 읽기 완료 체크 버튼 */}
                <div className="pt-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVerseRead(v.verse);
                    }}
                    title={isRead ? '읽기 완료 취소' : '읽기 완료로 표시'}
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isRead
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : isInverted
                        ? 'border border-slate-600 hover:border-emerald-400 bg-slate-800'
                        : 'border border-slate-300 hover:border-emerald-500 bg-white'
                    }`}
                  >
                    {isRead ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    )}
                  </button>
                </div>

                {/* Verse Number */}
                <span
                  className={`text-base sm:text-lg font-black select-none min-w-[20px] pt-0.5 ${
                    isRead
                      ? 'text-emerald-600'
                      : isInverted
                      ? 'text-amber-400'
                      : 'text-slate-900'
                  }`}
                >
                  {v.verse}
                </span>

                {/* Verse Text with dynamic font size, weight, and family */}
                <p
                  className={`flex-1 tracking-tight ${isInverted ? 'text-slate-100' : 'text-slate-800'}`}
                  style={{
                    fontSize: `${fontSizePt}px`,
                    lineHeight: `${fontSizePt * 1.8}px`,
                    fontWeight: isBold ? 700 : 400,
                  }}
                >
                  {v.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CHAPTER NAVIGATION ROW (Right above audio player) */}
      <div
        className={`border-t px-4 py-2 flex items-center justify-between z-20 flex-shrink-0 ${
          isInverted ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
        }`}
      >
        {/* 이전장 */}
        <button
          type="button"
          onClick={handlePrevChapter}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          &lt; 이전장
        </button>

        {/* 창세기 1장 ∨ (Click opens 3-step selector) */}
        <button
          type="button"
          onClick={() => {
            if (onBackToSelector) {
              onBackToSelector();
            } else {
              handleOpenSelector('chapter');
            }
          }}
          className={`flex items-center gap-1 text-sm font-extrabold hover:underline cursor-pointer ${
            isInverted ? 'text-blue-400' : 'text-[#1b64b9]'
          }`}
        >
          <span>{selectedBook} {selectedChapter}장</span>
          <span className="text-xs">∨</span>
        </button>

        {/* 다음장 > */}
        <button
          type="button"
          onClick={handleNextChapter}
          className="bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer"
        >
          <span>다음장</span>
          <span>&gt;</span>
        </button>
      </div>

      {/* 5. AUDIO PLAYER (Sticky Bottom Bar) */}
      <div
        className={`border-t px-4 py-2.5 z-20 flex-shrink-0 shadow-lg ${
          isInverted ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-[#f8fafc] border-slate-200 text-slate-800'
        }`}
      >
        {/* Timestamp & Reader Voice Badge */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-xs text-slate-500">{formatTime(currentTime)}</span>

          <div
            className={`px-3 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${
              isInverted ? 'bg-slate-800 text-blue-300 border-slate-700' : 'bg-blue-50 text-blue-700 border-blue-100/80'
            }`}
          >
            낭독: {voiceType}
          </div>

          <span className="font-mono text-xs text-slate-500">{formatTime(duration)}</span>
        </div>

        {/* Progress Timeline Slider */}
        <div className="relative w-full my-2 flex items-center">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#1b64b9]"
          />
        </div>

        {/* Bottom Audio Controls */}
        <div className="flex items-center justify-between pt-1">
          {/* Audio Playback Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentTime(Math.max(0, currentTime - 15))}
              className="p-1 text-slate-600 hover:text-black cursor-pointer"
              title="15초 전으로"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause Main Circle */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md transition cursor-pointer"
              title={isPlaying ? '일시 정지' : '재생'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => setCurrentTime(Math.min(duration, currentTime + 15))}
              className="p-1 text-slate-600 hover:text-black cursor-pointer"
              title="15초 후로"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Buttons: 녹음 & 음원 설정 */}
          <div className="flex items-center gap-2">
            {/* 녹음 버튼 -> Activates the new full Recording Mode Screen from uploaded image! */}
            <button
              type="button"
              onClick={() => {
                setActiveRecordVerse(selectedVerse || 1);
                setIsRecordingMode(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-2xs cursor-pointer ${
                isInverted ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span>녹음</span>
            </button>

            {/* 음원 설정 버튼 */}
            <button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-2xs cursor-pointer ${
                isInverted ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              음원 설정
            </button>
          </div>
        </div>
      </div>

      {/* 6. FULL 3-STEP BIBLE SELECTOR MODAL (Fallback) */}
      <BibleSelectorModal
        isOpen={showSelectorModal}
        initialBook={selectedBook}
        initialChapter={selectedChapter}
        initialVerse={selectedVerse}
        initialStep={selectorInitialStep}
        onClose={() => setShowSelectorModal(false)}
        onSelectLocation={handleSelectLocation}
      />

      {/* 7. 화면설정 Bottom Sheet (Exact Match to User Uploaded Screenshot) */}
      {showScreenSettings && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowScreenSettings(false);
          }}
        >
          {/* Close 'X' Button on top-right above sheet */}
          <div className="w-full max-w-lg mx-auto flex justify-end px-5 pb-2">
            <button
              type="button"
              onClick={() => setShowScreenSettings(false)}
              className="text-white hover:text-slate-200 p-1 cursor-pointer transition active:scale-90"
              title="닫기"
            >
              <X className="w-8 h-8 stroke-[2.2]" />
            </button>
          </div>

          {/* Bottom Sheet Card */}
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-[28px] p-6 sm:p-7 shadow-2xl space-y-6 text-slate-900 animate-in slide-in-from-bottom duration-200 border-t border-slate-100">
            {/* 1. 폰트변경 */}
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-slate-900">폰트변경</span>
              <div className="flex items-center text-[15px]">
                <button
                  type="button"
                  onClick={() => setFontFamily('기본')}
                  className={`cursor-pointer transition-colors ${
                    fontFamily === '기본' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                  }`}
                >
                  기본
                </button>
                <span className="text-slate-300 mx-2.5 font-light">|</span>
                <button
                  type="button"
                  onClick={() => setFontFamily('나눔고딕')}
                  className={`cursor-pointer transition-colors ${
                    fontFamily === '나눔고딕' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                  }`}
                >
                  나눔고딕
                </button>
                <span className="text-slate-300 mx-2.5 font-light">|</span>
                <button
                  type="button"
                  onClick={() => setFontFamily('나눔명조')}
                  className={`cursor-pointer transition-colors ${
                    fontFamily === '나눔명조' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                  }`}
                >
                  나눔명조
                </button>
              </div>
            </div>

            {/* 2. 폰트굵기 */}
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-slate-900">폰트굵기</span>
              <button
                type="button"
                onClick={() => setIsBold(!isBold)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                  isBold ? 'bg-[#0284c7]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                    isBold ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 3. 글자크기 */}
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-slate-900">글자크기</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setFontSizePt((prev) => Math.max(12, prev - 1))}
                  className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                >
                  －
                </button>
                <div className="w-28 sm:w-36 flex items-center">
                  <input
                    type="range"
                    min={12}
                    max={26}
                    value={fontSizePt}
                    onChange={(e) => setFontSizePt(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFontSizePt((prev) => Math.min(26, prev + 1))}
                  className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                >
                  ＋
                </button>
                <span className="text-[15px] font-bold text-slate-900 min-w-[38px] text-right">
                  {fontSizePt}pt
                </span>
              </div>
            </div>

            {/* 4. 스크롤 속도 */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[15px] font-bold text-slate-900 leading-tight">스크롤</span>
                  <span className="text-[15px] font-bold text-slate-900 leading-tight">속도</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setScrollSpeed((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                  >
                    －
                  </button>
                  <div className="w-28 sm:w-36 flex items-center">
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={scrollSpeed}
                      onChange={(e) => setScrollSpeed(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setScrollSpeed((prev) => Math.min(30, prev + 1))}
                    className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                  >
                    ＋
                  </button>
                  <span className="text-[15px] font-bold text-slate-900 min-w-[38px] text-right">
                    {scrollSpeed}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                (숫자가 클수록 스크롤 속도가 빨라집니다)
              </p>
            </div>

            {/* 5. 화면 색반전 */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[15px] font-bold text-slate-900">화면 색반전</span>
              <div className="flex items-center gap-3">
                {/* Light Mode Button (Sun) */}
                <button
                  type="button"
                  onClick={() => setIsInverted(false)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    !isInverted
                      ? 'bg-[#0284c7] text-white shadow-md ring-2 ring-blue-300 scale-105'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                  title="주간 모드 (밝은 화면)"
                >
                  <Sun className="w-6 h-6 fill-amber-300 text-amber-300" />
                </button>

                {/* Dark Mode Button (Moon) */}
                <button
                  type="button"
                  onClick={() => setIsInverted(true)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isInverted
                      ? 'bg-slate-900 text-amber-300 shadow-md ring-2 ring-amber-400 scale-105'
                      : 'bg-slate-100 text-amber-500 hover:bg-slate-200'
                  }`}
                  title="야간 모드 (색반전 어두운 화면)"
                >
                  <Moon className="w-6 h-6 fill-amber-300 text-amber-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Translation Picker */}
      {showTransModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTransModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl border">
            <h3 className="font-extrabold text-slate-900 pb-3 border-b">역본 선택</h3>
            <div className="space-y-2 py-3">
              {(['개역개정', '개역한글', '쉬운성경', 'NIV'] as const).map((trans) => (
                <button
                  key={trans}
                  type="button"
                  onClick={() => {
                    setSelectedTranslation(trans);
                    setShowTransModal(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-bold border flex items-center justify-between ${
                    selectedTranslation === trans
                      ? 'bg-[#1b64b9] text-white border-[#1b64b9]'
                      : 'hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span>{trans}</span>
                  {selectedTranslation === trans && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Voice Selector */}
      {showVoiceModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVoiceModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl border">
            <h3 className="font-extrabold text-slate-900 pb-3 border-b">낭독 음원 선택</h3>
            <div className="space-y-2 py-3">
              {['남성(중저음)', '여성(맑은음)', 'AI 청년 목소리', '드라마 입체 낭독'].map((voice) => (
                <button
                  key={voice}
                  type="button"
                  onClick={() => {
                    setVoiceType(voice);
                    setShowVoiceModal(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-bold border flex items-center justify-between ${
                    voiceType === voice
                      ? 'bg-[#1b64b9] text-white border-[#1b64b9]'
                      : 'hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span>{voice}</span>
                  {voiceType === voice && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 선교 헌금 Modal */}
      {showOfferingModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOfferingModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 fill-red-500" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">수퍼바이블 사역 선교 헌금</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              전 세계 성도들의 말씀 통독과 음성 녹음 사역을 후원해 주셔서 감사합니다.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border text-xs text-slate-700 text-left mb-4">
              <p className="font-bold text-slate-900">후원 계좌 안내</p>
              <p className="mt-1">농협 351-1234-5678-91 (예금주: 로고스선교회)</p>
            </div>
            <button
              type="button"
              onClick={() => setShowOfferingModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1b64b9] text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
