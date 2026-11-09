import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Search,
  Music,
  Star,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  BookOpen,
  ArrowRight,
  List,
  Sparkles,
  Sliders,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  Hymn,
  ALL_HYMNS,
  HYMN_CATEGORIES,
  getHymnFavorites,
  toggleHymnFavorite,
  getRecentHymns,
  addRecentHymn,
} from '../data/hymnData';

interface HymnViewProps {
  onBackToHome?: () => void;
  onNavigateToBible?: (book: string, chapter?: number, verse?: number) => void;
}

export const HymnView: React.FC<HymnViewProps> = ({ onBackToHome, onNavigateToBible }) => {
  // Navigation & View State
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'recent'>('all');
  const [favorites, setFavorites] = useState<number[]>(() => getHymnFavorites());
  const [recentHymns, setRecentHymns] = useState<number[]>(() => getRecentHymns());

  // Lyrics font size
  const [fontSizePt, setFontSizePt] = useState<number>(17);

  // Audio Melody Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentNoteIdx, setCurrentNoteIdx] = useState<number>(-1);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const timeoutsRef = useRef<number[]>([]);

  // Update favorites list
  const handleToggleFav = (num: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleHymnFavorite(num);
    setFavorites(getHymnFavorites());
  };

  // Open hymn detail
  const handleSelectHymn = (h: Hymn) => {
    setSelectedHymn(h);
    addRecentHymn(h.number);
    setRecentHymns(getRecentHymns());
    stopAudio();
  };

  // Web Audio Synthesizer: Smooth Church Organ / Chime Melody
  const stopAudio = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentNoteIdx(-1);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const playHymnMelody = (h: Hymn) => {
    stopAudio();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        alert('현재 브라우저에서 오디오 반주 재생을 지원하지 않습니다.');
        return;
      }

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      isPlayingRef.current = true;
      setIsPlaying(true);

      const notes = h.notes && h.notes.length > 0 ? h.notes : [60, 64, 67, 72, 67, 64, 60];
      const noteDuration = 0.5; // seconds per note

      notes.forEach((midi, idx) => {
        const timeDelay = idx * noteDuration * 1000;
        const timerId = window.setTimeout(() => {
          if (!isPlayingRef.current || !ctx || ctx.state === 'closed') return;
          setCurrentNoteIdx(idx);

          // MIDI to Frequency: 440 * 2^((midi - 69) / 12)
          const freq = 440 * Math.pow(2, (midi - 69) / 12);

          // 1. Fundamental tone (Sine wave)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(freq, ctx.currentTime);

          // 2. Harmonic warm organ tone (Triangle wave)
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(freq, ctx.currentTime);

          // Master Envelope
          gain1.gain.setValueAtTime(0.001, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
          gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noteDuration - 0.02);

          gain2.gain.setValueAtTime(0.001, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.05);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + noteDuration - 0.02);

          osc1.connect(gain1);
          osc2.connect(gain2);
          gain1.connect(ctx.destination);
          gain2.connect(ctx.destination);

          osc1.start(ctx.currentTime);
          osc2.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + noteDuration);
          osc2.stop(ctx.currentTime + noteDuration);

          if (idx === notes.length - 1) {
            window.setTimeout(() => {
              if (isPlayingRef.current) {
                // Loop melody smoothly
                playHymnMelody(h);
              }
            }, noteDuration * 1000);
          }
        }, timeDelay);

        timeoutsRef.current.push(timerId);
      });
    } catch (e) {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  // Filtered Hymn List
  const filteredHymns = ALL_HYMNS.filter((h) => {
    // Tab filter
    if (activeTab === 'favorites' && !favorites.includes(h.number)) return false;
    if (activeTab === 'recent' && !recentHymns.includes(h.number)) return false;

    // Category filter
    if (selectedCategory !== '전체' && h.category !== selectedCategory) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const numMatch = h.number.toString().includes(q) || (h.oldNumber && h.oldNumber.toString().includes(q));
      const titleMatch = h.title.toLowerCase().includes(q);
      const lyricsMatch = h.verses.some((v) => v.toLowerCase().includes(q)) || (h.chorus && h.chorus.toLowerCase().includes(q));
      return numMatch || titleMatch || lyricsMatch;
    }

    return true;
  });

  // Navigate to previous/next hymn
  const handlePrevHymn = () => {
    if (!selectedHymn) return;
    const prevNum = selectedHymn.number > 1 ? selectedHymn.number - 1 : 645;
    const prev = ALL_HYMNS.find((h) => h.number === prevNum);
    if (prev) handleSelectHymn(prev);
  };

  const handleNextHymn = () => {
    if (!selectedHymn) return;
    const nextNum = selectedHymn.number < 645 ? selectedHymn.number + 1 : 1;
    const next = ALL_HYMNS.find((h) => h.number === nextNum);
    if (next) handleSelectHymn(next);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden select-none">
      {/* 1. TOP HEADER */}
      <header className="bg-[#1b64b9] text-white px-3.5 py-2.5 flex items-center justify-between shadow-md z-30 flex-shrink-0">
        <div className="flex items-center gap-2">
          {selectedHymn ? (
            <button
              type="button"
              onClick={() => {
                stopAudio();
                setSelectedHymn(null);
              }}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="찬송가 목록으로"
            >
              <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onBackToHome}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="홈으로 가기"
            >
              <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-white/20 rounded-md">
              <Music className="w-4 h-4 text-white" />
            </span>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
              {selectedHymn ? `새찬송가 ${selectedHymn.number}장` : '새찬송가 645곡'}
            </h1>
          </div>
        </div>

        {/* Right actions in header */}
        <div className="flex items-center gap-1.5">
          {selectedHymn ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFontSizePt((prev) => Math.max(14, prev - 1))}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xs font-bold transition cursor-pointer active:scale-95"
                title="글자 작게"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSizePt((prev) => Math.min(26, prev + 1))}
                className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xs font-black transition cursor-pointer active:scale-95"
                title="글자 크게"
              >
                A+
              </button>
              <button
                type="button"
                onClick={(e) => handleToggleFav(selectedHymn.number, e)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition cursor-pointer"
                title={favorites.includes(selectedHymn.number) ? '애창 찬송 해제' : '애창 찬송 등록'}
              >
                <Star
                  className={`w-5 h-5 ${
                    favorites.includes(selectedHymn.number)
                      ? 'fill-amber-300 text-amber-300'
                      : 'text-white'
                  }`}
                />
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-blue-100 bg-blue-800/60 px-2.5 py-1 rounded-full border border-blue-400/30">
              전 645곡 수록
            </span>
          )}
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HYMN DETAIL VIEW (가사 뷰어 및 멜로디 반주 재생기) */}
      {/* ========================================================= */}
      {selectedHymn ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Sub Header / Info Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#1b64b9] text-white text-xs font-black">
                  {selectedHymn.number}장
                </span>
                {selectedHymn.oldNumber && (
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                    통일 {selectedHymn.oldNumber}장
                  </span>
                )}
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedHymn.category}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                {selectedHymn.title}
              </h2>
            </div>

            {selectedHymn.scripture && (
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 block">관련 말씀</span>
                <span className="text-xs font-black text-[#1b64b9] bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 inline-block">
                  {selectedHymn.scripture}
                </span>
              </div>
            )}
          </div>

          {/* Melody Accompaniment Banner */}
          <div className="bg-emerald-50/80 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (isPlaying ? stopAudio() : playHymnMelody(selectedHymn))}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm transition cursor-pointer active:scale-95 ${
                  isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#05c46b] hover:bg-[#04b05f]'
                }`}
                title={isPlaying ? '반주 정지' : '오르간 멜로디 반주 재생'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div>
                <p className="text-xs font-black text-emerald-950 flex items-center gap-1">
                  <span>🎶 멜로디 오르간 반주</span>
                  {isPlaying && (
                    <span className="text-[10px] text-emerald-600 font-bold animate-pulse">
                      (연주 중...)
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-emerald-800">
                  {isPlaying ? '찬송가 멜로디 반주가 울려 퍼집니다' : '재생을 누르면 멜로디 반주가 시작됩니다'}
                </p>
              </div>
            </div>

            {isPlaying && (
              <button
                type="button"
                onClick={stopAudio}
                className="px-2.5 py-1 rounded-lg bg-white text-slate-600 hover:bg-slate-100 text-xs font-bold border border-slate-200 transition cursor-pointer"
              >
                정지
              </button>
            )}
          </div>

          {/* Lyrics Scroll View */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            {selectedHymn.verses.map((verseText, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 shadow-2xs space-y-2 hover:bg-blue-50/40 transition"
              >
                <p
                  className="font-bold text-slate-900 whitespace-pre-line tracking-normal leading-relaxed"
                  style={{
                    fontSize: `${fontSizePt}px`,
                    lineHeight: `${fontSizePt * 1.85}px`,
                  }}
                >
                  {verseText}
                </p>
              </div>
            ))}

            {selectedHymn.chorus && (
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-2xs space-y-2">
                <span className="text-[11px] font-black text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full inline-block">
                  [후렴]
                </span>
                <p
                  className="font-black text-amber-950 whitespace-pre-line tracking-normal leading-relaxed"
                  style={{
                    fontSize: `${fontSizePt}px`,
                    lineHeight: `${fontSizePt * 1.85}px`,
                  }}
                >
                  {selectedHymn.chorus}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Hymn Navigation Bar */}
          <div className="bg-white border-t border-slate-200 px-4 py-2.5 flex items-center justify-between z-20 flex-shrink-0">
            <button
              type="button"
              onClick={handlePrevHymn}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>이전 찬송</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopAudio();
                setSelectedHymn(null);
              }}
              className="text-xs font-black text-[#1b64b9] hover:underline cursor-pointer"
            >
              전체 목록 보기
            </button>

            <button
              type="button"
              onClick={handleNextHymn}
              className="px-3 py-1.5 rounded-xl bg-[#1b64b9] hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-xs"
            >
              <span>다음 찬송</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* 3. HYMN LIST & SEARCH VIEW */
        /* ========================================================= */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Box */}
          <div className="bg-white px-3.5 py-2.5 border-b border-slate-200 shadow-2xs">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="찬송가 장수 (예: 288) 또는 제목 / 가사 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-slate-100 focus:bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-900 border border-transparent focus:border-[#1b64b9] focus:outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs: 전체 / 애창 찬송 / 최근 찬송 */}
          <div className="bg-white border-b border-slate-200 px-3 flex items-center gap-2 pt-1.5 flex-shrink-0 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-2 px-2.5 text-xs font-black transition cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-[#1b64b9] text-[#1b64b9]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              전체 찬송 (645)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={`pb-2 px-2.5 text-xs font-black transition cursor-pointer border-b-2 flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'favorites'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>⭐</span>
              <span>애창 찬송 ({favorites.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recent')}
              className={`pb-2 px-2.5 text-xs font-black transition cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'recent'
                  ? 'border-[#1b64b9] text-[#1b64b9]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              최근 본 찬송 ({recentHymns.length})
            </button>
          </div>

          {/* Category Chips Bar */}
          {activeTab === 'all' && (
            <div className="bg-slate-100/70 px-3 py-1.5 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
              {HYMN_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#1b64b9] text-white shadow-2xs font-black'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Hymn Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredHymns.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Music className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-bold">검색 결과와 일치하는 찬송가가 없습니다.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('전체');
                    setActiveTab('all');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#1b64b9] text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                >
                  전체 목록 보기
                </button>
              </div>
            ) : (
              filteredHymns.map((hymn) => {
                const isFav = favorites.includes(hymn.number);
                return (
                  <div
                    key={hymn.number}
                    onClick={() => handleSelectHymn(hymn)}
                    className="p-3 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between transition cursor-pointer active:scale-99 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1b64b9] group-hover:bg-[#1b64b9] group-hover:text-white flex flex-col items-center justify-center font-black transition flex-shrink-0 border border-blue-200/80">
                        <span className="text-[10px] leading-none opacity-80">새</span>
                        <span className="text-sm leading-tight">{hymn.number}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-[#1b64b9] transition">
                            {hymn.title}
                          </h3>
                          {hymn.oldNumber && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                              통일 {hymn.oldNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-semibold text-emerald-700">
                            {hymn.category}
                          </span>
                          {hymn.scripture && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] font-medium text-slate-500">
                                {hymn.scripture}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFav(hymn.number, e)}
                        className="p-2 text-slate-400 hover:text-amber-500 transition cursor-pointer rounded-lg hover:bg-slate-100"
                        title={isFav ? '애창 찬송 해제' : '애창 찬송 등록'}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#1b64b9] transition" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
