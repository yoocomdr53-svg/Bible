import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  Mic,
  Settings,
  Heart,
  User as UserIcon,
  X,
  Sparkles,
} from 'lucide-react';
import { BIBLE_BOOKS, SAMPLE_VERSES_CHAPTER } from '../data/bibleData';
import { BibleVerse } from '../types';

interface BibleReaderViewProps {
  onOpenVerseCard: (verse: BibleVerse) => void;
  onOpenRecorder: (verse: BibleVerse) => void;
}

export const BibleReaderView: React.FC<BibleReaderViewProps> = ({
  onOpenVerseCard,
  onOpenRecorder,
}) => {
  // Default to 창세기 1장 as requested by the user
  const [selectedBook, setSelectedBook] = useState('창세기');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedTranslation, setSelectedTranslation] = useState<'개역개정' | '개역한글' | '쉬운성경' | 'NIV'>('개역개정');
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(186); // 03:06
  const [voiceType, setVoiceType] = useState('남성(중저음)');
  
  // UI Dropdowns & Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [showTransModal, setShowTransModal] = useState(false);
  const [showScreenSettings, setShowScreenSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedVerses, setHighlightedVerses] = useState<number[]>([]);
  
  const contentRef = useRef<HTMLDivElement>(null);

  const key = `${selectedBook}-${selectedChapter}`;
  const verses = SAMPLE_VERSES_CHAPTER[key] || [
    { verse: 1, text: `${selectedBook} ${selectedChapter}장 말씀입니다.` },
    { verse: 2, text: `하나님이 모든 말씀으로 말씀하여 이르시되 나는 너를 애굽 땅, 종 되었던 집에서 인도하여 낸 네 하나님 여호와니라.` },
    { verse: 3, text: `너는 나 외에는 다른 신들을 네게 두지 말라.` },
  ];

  // Speech synthesis audio playback
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
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleNextChapter = () => {
    setSelectedChapter((prev) => prev + 1);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleScrollDown = () => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: 300, behavior: 'smooth' });
    }
  };

  const filteredVerses = searchQuery.trim()
    ? verses.filter((v) => v.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : verses;

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden text-slate-800 select-none">
      {/* 1. TOP HEADER (Deep Blue Bar) */}
      <header className="bg-[#1b64b9] text-white px-3 py-2 flex items-center justify-between shadow-md z-30 flex-shrink-0">
        {/* Left: Back button & Dropdowns */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Back Button */}
          <button
            onClick={() => handlePrevChapter()}
            title="이전 화면"
            className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Book & Chapter Button */}
          <button
            onClick={() => setShowBookModal(true)}
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

        {/* Right Badges: 선교 헌금 & 남성(중저음) */}
        <div className="flex items-center gap-1.5">
          {/* 선교 헌금 버튼 */}
          <button
            onClick={() => setShowOfferingModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-slate-800 transition shadow-2xs cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
            <span className="text-[11px] font-bold text-amber-950">선교 헌금</span>
            <ChevronRight className="w-3 h-3 text-amber-700" />
          </button>

          {/* 음성 선택기 */}
          <button
            onClick={() => setShowVoiceModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition cursor-pointer"
          >
            <span className="text-xs">👦</span>
            <span className="text-[11px] font-semibold text-slate-700">{voiceType}</span>
          </button>
        </div>
      </div>

      {/* Screen Settings Drawer */}
      {showScreenSettings && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs animate-in slide-in-from-top duration-150 z-20">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">글자 크기:</span>
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
                key={v.verse}
                onClick={() => {
                  setHighlightedVerses((prev) =>
                    prev.includes(v.verse) ? prev.filter((n) => n !== v.verse) : [...prev, v.verse]
                  );
                }}
                className={`flex items-start gap-3.5 py-1.5 px-2 rounded-xl transition cursor-pointer ${
                  isHighlighted ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50'
                }`}
              >
                {/* Verse Number (Bold and clear like screenshot) */}
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

        {/* 창세기 1장 ∨ */}
        <button
          onClick={() => setShowBookModal(true)}
          className="flex items-center gap-1 text-sm font-extrabold text-[#1b64b9] hover:underline cursor-pointer"
        >
          <span>{selectedBook} {selectedChapter}장</span>
          <ChevronDown className="w-4 h-4 text-[#1b64b9]" />
        </button>

        {/* 다음장 > (Blue Pill Button) */}
        <button
          onClick={handleNextChapter}
          className="bg-[#1b64b9] hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
        >
          다음장 &gt;
        </button>
      </div>

      {/* 5. STICKY AUDIO PLAYER BAR (Matches Image Exactly) */}
      <div className="bg-white border-t border-slate-200/80 px-4 pt-2.5 pb-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20 flex-shrink-0">
        {/* Top Time & Badge */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
          <span className="font-mono text-xs text-slate-700">{formatTime(currentTime)}</span>

          {/* 낭독: 남성 음성 (중저음) Badge */}
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
                  verse: 1,
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

      {/* MODAL: Book / Chapter Picker */}
      {showBookModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBookModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="font-extrabold text-slate-900">성경 및 장 선택</h3>
              <button onClick={() => setShowBookModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 py-3 overflow-y-auto">
              {BIBLE_BOOKS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBook(b.name);
                    setSelectedChapter(1);
                    setShowBookModal(false);
                  }}
                  className={`px-2 py-2 rounded-xl text-xs font-bold border transition text-center ${
                    selectedBook === b.name
                      ? 'bg-[#1b64b9] text-white border-[#1b64b9]'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  {b.name}
                </button>
              ))}
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
            <h3 className="font-extrabold text-slate-900 pb-3 border-b">낭독 음원 설정</h3>
            <div className="space-y-2 py-3">
              {['남성 음성 (중저음)', '남성 음성 (표준)', '여성 음성 (온유한)', '인공지능 AI 입체 낭독'].map(
                (v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setVoiceType(v);
                      setShowVoiceModal(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-bold border flex items-center justify-between ${
                      voiceType.includes(v.slice(0, 4))
                        ? 'bg-[#1b64b9] text-white border-[#1b64b9]'
                        : 'hover:bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{v}</span>
                    {voiceType.includes(v.slice(0, 4)) && <span>✓</span>}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 선교 헌금 */}
      {showOfferingModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOfferingModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl border text-center">
            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">수퍼바이블 선교 헌금</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              모든 민족에게 무료로 성경 말씀을 보급하고 스마트 학사관리 시스템을 지원하는 사역에 함께 동참해 주세요.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-xl text-left border text-xs space-y-1">
              <p className="font-bold text-slate-700">후원 계좌 안내</p>
              <p className="text-slate-600">신한 100-034-892182 (로고스재단)</p>
            </div>
            <button
              onClick={() => setShowOfferingModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-[#1b64b9] text-white font-bold text-xs shadow-md"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
