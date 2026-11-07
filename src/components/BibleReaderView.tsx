import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
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
  Sparkles,
} from 'lucide-react';
import { BIBLE_BOOKS, SAMPLE_VERSES_CHAPTER, getChapterVerseCount } from '../data/bibleData';
import { BibleVerse } from '../types';
import { BibleSelectorModal } from './BibleSelectorModal';

interface BibleReaderViewProps {
  onOpenVerseCard: (verse: BibleVerse) => void;
  onOpenRecorder: (verse: BibleVerse) => void;
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
  onBackToHome?: () => void;
  onBackToSelector?: () => void;
}

export const BibleReaderView: React.FC<BibleReaderViewProps> = ({
  onOpenVerseCard,
  onOpenRecorder,
  initialBook = '창세기',
  initialChapter = 1,
  initialVerse = 1,
  onBackToHome,
  onBackToSelector,
}) => {
  const [selectedBook, setSelectedBook] = useState(initialBook);
  const [selectedChapter, setSelectedChapter] = useState(initialChapter);
  const [selectedVerse, setSelectedVerse] = useState(initialVerse);
  const [selectedTranslation, setSelectedTranslation] = useState<'개역개정' | '개역한글' | '쉬운성경' | 'NIV'>('개역개정');

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(186); // 03:06
  const [voiceType, setVoiceType] = useState('남성(중저음)');

  // UI Dropdowns & Modals
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [selectorInitialStep, setSelectorInitialStep] = useState<'book' | 'chapter' | 'verse'>('book');
  const [showTransModal, setShowTransModal] = useState(false);
  const [showScreenSettings, setShowScreenSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedVerses, setHighlightedVerses] = useState<number[]>([]);

  const contentRef = useRef<HTMLDivElement>(null);

  // Sync with prop changes if passed from parent
  useEffect(() => {
    setSelectedBook(initialBook);
    setSelectedChapter(initialChapter);
    setSelectedVerse(initialVerse);
  }, [initialBook, initialChapter, initialVerse]);

  // Generate or fetch verses
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

  // Auto-scroll to selected verse and highlight it
  useEffect(() => {
    if (selectedVerse) {
      setHighlightedVerses([selectedVerse]);
      const timer = setTimeout(() => {
        const el = document.getElementById(`verse-row-${selectedVerse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedBook, selectedChapter, selectedVerse]);

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

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter((prev) => prev - 1);
      setSelectedVerse(1);
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
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleScrollDown = () => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: 300, behavior: 'smooth' });
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
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const filteredVerses = searchQuery.trim()
    ? verses.filter((v) => v.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : verses;

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden text-slate-800 select-none">
      {/* 1. TOP HEADER (Deep Blue Bar #1b64b9) */}
      <header className="bg-[#1b64b9] text-white px-3 py-2 flex items-center justify-between shadow-md z-30 flex-shrink-0">
        {/* Left: Back button & Dropdowns */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Back Button -> Back to Selector or Home */}
          <button
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

          {/* Book & Chapter Button -> Opens 3-step selector */}
          <button
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

        {/* Right Action Icons (원문업로드, 화면설정, 검색) */}
        <div className="flex items-center gap-1 sm:gap-2 text-white">
          {/* 원문업로드 */}
          <button
            onClick={() => alert('수퍼바이블 원문 및 사용자 성경 텍스트 업로드 준비 완료')}
            className="flex flex-col items-center justify-center px-1.5 py-0.5 hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="원문 업로드"
          >
            <Upload className="w-4 h-4 text-white" />
            <span className="text-[9px] font-medium leading-tight mt-0.5 text-center">원문업로드</span>
          </button>

          {/* 화면설정 */}
          <button
            onClick={() => setShowScreenSettings(!showScreenSettings)}
            className="flex flex-col items-center justify-center px-1.5 py-0.5 hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="화면 설정"
          >
            <Monitor className="w-4 h-4 text-white" />
            <span className="text-[9px] font-medium leading-tight mt-0.5 text-center">화면설정</span>
          </button>

          {/* 검색 */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex flex-col items-center justify-center px-1.5 py-0.5 hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="본문 검색"
          >
            <Search className="w-4 h-4 text-white" />
            <span className="text-[9px] font-medium leading-tight mt-0.5 text-center">검색</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-TOOLBAR (White Bar with Controls & Badges) */}
      <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-xs flex-shrink-0 z-20">
        {/* Left Quick Navigation Icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevChapter}
            title="이전장"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextChapter}
            title="다음장"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            title={isPlaying ? '음성 중지' : '음성 듣기'}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer transition ${
              isPlaying
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleScrollDown}
            title="아래로 스크롤"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Center & Right Badges */}
        <div className="flex items-center gap-1.5">
          {/* 선교 헌금 Badge */}
          <button
            onClick={() => setShowOfferingModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 hover:bg-red-100/80 border border-red-200/80 text-red-600 font-bold text-[11px] transition cursor-pointer"
          >
            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
            <span>선교 헌금 &gt;</span>
          </button>

          {/* 남성(중저음) Voice Badge */}
          <button
            onClick={() => setShowVoiceModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-[11px] transition cursor-pointer"
          >
            <span>👦</span>
            <span>{voiceType}</span>
          </button>
        </div>
      </div>

      {/* Screen Settings Popover */}
      {showScreenSettings && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs animate-in slide-in-from-top duration-150 z-20">
          <span className="font-bold text-slate-700">글자 크기:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 rounded ${fontSize === 'normal' ? 'bg-[#1b64b9] text-white font-bold' : 'bg-white border'}`}
            >
              보통
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 rounded ${fontSize === 'large' ? 'bg-[#1b64b9] text-white font-bold' : 'bg-white border'}`}
            >
              크게
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-0.5 rounded ${fontSize === 'xlarge' ? 'bg-[#1b64b9] text-white font-bold' : 'bg-white border'}`}
            >
              아주크게
            </button>
          </div>
          <button onClick={() => setShowScreenSettings(false)} className="text-slate-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      {showSearch && (
        <div className="bg-blue-50/70 border-b border-blue-200 px-4 py-2 flex items-center gap-2 animate-in slide-in-from-top duration-150 z-20">
          <Search className="w-4 h-4 text-blue-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="본문 구절 검색 (예: 하나님, 궁창, 빛)"
            className="flex-1 bg-white border border-blue-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            autoFocus
          />
          <button onClick={() => setShowSearch(false)} className="text-slate-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. BIBLE VERSES BODY */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-white smooth-scroll"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {filteredVerses.map((v) => {
            const isHighlighted = highlightedVerses.includes(v.verse);
            return (
              <div
                id={`verse-row-${v.verse}`}
                key={v.verse}
                onClick={() => {
                  setHighlightedVerses((prev) =>
                    prev.includes(v.verse) ? prev.filter((n) => n !== v.verse) : [...prev, v.verse]
                  );
                }}
                className={`flex items-start gap-3.5 py-2 px-3 rounded-xl transition cursor-pointer ${
                  isHighlighted
                    ? 'bg-amber-100/80 border-2 border-amber-400 shadow-sm'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Verse Number */}
                <span className="text-base sm:text-lg font-black text-slate-900 select-none min-w-[20px] pt-0.5">
                  {v.verse}
                </span>

                {/* Verse Text */}
                <p
                  className={`flex-1 text-slate-800 font-normal tracking-tight ${
                    fontSize === 'xlarge'
                      ? 'text-[20px] leading-[1.85]'
                      : fontSize === 'large'
                      ? 'text-[17.5px] leading-[1.8]'
                      : 'text-[15.5px] leading-[1.7]'
                  }`}
                >
                  {v.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CHAPTER NAVIGATION ROW (Right above audio player) */}
      <div className="bg-white border-t border-slate-100 px-4 py-2 flex items-center justify-between z-20 flex-shrink-0">
        {/* 이전장 */}
        <button
          onClick={handlePrevChapter}
          className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition cursor-pointer"
        >
          &lt; 이전장
        </button>

        {/* 창세기 1장 ∨ (Click opens 3-step selector) */}
        <button
          onClick={() => {
            if (onBackToSelector) {
              onBackToSelector();
            } else {
              handleOpenSelector('chapter');
            }
          }}
          className="flex items-center gap-1 text-sm font-extrabold text-[#1b64b9] hover:underline cursor-pointer"
        >
          <span>{selectedBook} {selectedChapter}장</span>
          <span className="text-xs">∨</span>
        </button>

        {/* 다음장 > */}
        <button
          onClick={handleNextChapter}
          className="bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer"
        >
          <span>다음장</span>
          <span>&gt;</span>
        </button>
      </div>

      {/* 5. AUDIO PLAYER (Sticky Bottom Bar) */}
      <div className="bg-[#f8fafc] border-t border-slate-200 px-4 py-2.5 z-20 flex-shrink-0 shadow-lg">
        {/* Timestamp & Reader Voice Badge */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-xs text-slate-700">{formatTime(currentTime)}</span>

          <div className="px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100/80 shadow-2xs">
            낭독: {voiceType}
          </div>

          <span className="font-mono text-xs text-slate-700">{formatTime(duration)}</span>
        </div>

        {/* Progress Timeline Slider */}
        <div className="relative w-full my-2 flex items-center">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1b64b9]"
          />
        </div>

        {/* Bottom Audio Controls */}
        <div className="flex items-center justify-between pt-1">
          {/* Audio Playback Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTime(Math.max(0, currentTime - 15))}
              className="p-1 text-slate-700 hover:text-black cursor-pointer"
              title="15초 전으로"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause Main Circle */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md transition cursor-pointer"
              title={isPlaying ? '일시 정지' : '재생'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>

            <button
              onClick={() => setCurrentTime(Math.min(duration, currentTime + 15))}
              className="p-1 text-slate-700 hover:text-black cursor-pointer"
              title="15초 후로"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Buttons: 녹음 & 음원 설정 */}
          <div className="flex items-center gap-2">
            {/* 녹음 버튼 */}
            <button
              onClick={() =>
                onOpenRecorder({
                  book: selectedBook,
                  chapter: selectedChapter,
                  verse: selectedVerse || 1,
                  text: verses[0]?.text || '',
                  translation: selectedTranslation,
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 transition shadow-2xs cursor-pointer"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span>녹음</span>
            </button>

            {/* 음원 설정 버튼 */}
            <button
              onClick={() => setShowVoiceModal(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 transition shadow-2xs cursor-pointer"
            >
              음원 설정
            </button>
          </div>
        </div>
      </div>

      {/* 6. FULL 3-STEP BIBLE SELECTOR MODAL (성경 -> 장 -> 절) */}
      <BibleSelectorModal
        isOpen={showSelectorModal}
        initialBook={selectedBook}
        initialChapter={selectedChapter}
        initialVerse={selectedVerse}
        initialStep={selectorInitialStep}
        onClose={() => setShowSelectorModal(false)}
        onSelectLocation={handleSelectLocation}
      />

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
              onClick={() => setShowOfferingModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1b64b9] text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
