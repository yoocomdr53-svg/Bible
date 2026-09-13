import React, { useState } from 'react';
import { Volume2, Bookmark, Share2, Check, Search, ChevronDown, Sparkles } from 'lucide-react';
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
  const [selectedBook, setSelectedBook] = useState('야고보서');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedTranslation, setSelectedTranslation] = useState<'개역개정' | '쉬운성경' | 'NIV'>('개역개정');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [highlightedVerses, setHighlightedVerses] = useState<number[]>([22]);
  const [isReadingAudio, setIsReadingAudio] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const key = `${selectedBook}-${selectedChapter}`;
  const verses = SAMPLE_VERSES_CHAPTER[key] || [
    { verse: 1, text: `${selectedBook} ${selectedChapter}장 말씀입니다. 너희는 말씀을 행하는 자가 되고 듣기만 하여 자신을 속이는 자가 되지 말라.` },
    { verse: 2, text: `믿음의 주요 또 온전하게 하시는 이인 예수를 바라보자 그는 그 앞에 있는 기쁨을 위하여 십자가를 참으사 부끄러움을 개의치 아니하시더니 하나님 보좌 우편에 앉으셨느니라.` },
    { verse: 3, text: `평안을 너희에게 끼치노니 곧 나의 평안을 너희에게 주노라 내가 너희에게 주는 것은 세상이 주는 것과 같지 아니하니라.` },
  ];

  const toggleHighlight = (vNum: number) => {
    setHighlightedVerses((prev) =>
      prev.includes(vNum) ? prev.filter((n) => n !== vNum) : [...prev, vNum]
    );
  };

  const handleAudioNarrate = () => {
    if ('speechSynthesis' in window) {
      if (isReadingAudio) {
        window.speechSynthesis.cancel();
        setIsReadingAudio(false);
        return;
      }
      setIsReadingAudio(true);
      const textToRead = verses.map((v) => `${v.verse}절. ${v.text}`).join(' ');
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.95;
      utterance.onend = () => setIsReadingAudio(false);
      utterance.onerror = () => setIsReadingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsReadingAudio(!isReadingAudio);
    }
  };

  const filteredVerses = searchQuery.trim()
    ? verses.filter((v) => v.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : verses;

  return (
    <div className="flex-1 overflow-y-auto smooth-scroll no-scrollbar bg-[#fdfbf7] pb-24 text-slate-800">
      {/* Top Reading Navigation Bar */}
      <div className="sticky top-0 z-30 bg-[#fdfbf7]/95 backdrop-blur-md border-b border-amber-900/10 px-4 py-2.5 flex items-center justify-between">
        {/* Book & Chapter Dropdowns */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedBook}
            onChange={(e) => {
              setSelectedBook(e.target.value);
              setSelectedChapter(1);
            }}
            className="text-sm font-bold bg-white border border-amber-900/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-600 text-slate-900 cursor-pointer shadow-2xs"
          >
            {BIBLE_BOOKS.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name} ({b.testament === 'NT' ? '신약' : '구약'})
              </option>
            ))}
          </select>

          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(Number(e.target.value))}
            className="text-sm font-bold bg-white border border-amber-900/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-600 text-slate-900 cursor-pointer shadow-2xs"
          >
            {[1, 2, 3, 4, 5, 8, 23].map((ch) => (
              <option key={ch} value={ch}>
                {ch}장
              </option>
            ))}
          </select>
        </div>

        {/* Translation & Audio */}
        <div className="flex items-center gap-1.5">
          <select
            value={selectedTranslation}
            onChange={(e) => setSelectedTranslation(e.target.value as any)}
            className="text-xs font-semibold bg-white border border-amber-900/15 rounded-lg px-2 py-1.5 text-slate-700 cursor-pointer"
          >
            <option value="개역개정">개역개정</option>
            <option value="쉬운성경">쉬운성경</option>
            <option value="NIV">NIV</option>
          </select>

          <button
            type="button"
            onClick={handleAudioNarrate}
            title={isReadingAudio ? '낭독 정지' : '음성 낭독 듣기'}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isReadingAudio
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm animate-pulse'
                : 'bg-white text-slate-700 border-amber-900/15 hover:bg-amber-50'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Font & Quick Jump Bar */}
      <div className="px-4 py-2 bg-amber-50/50 border-b border-amber-900/5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-medium text-slate-500">빠른 이동:</span>
          {['야고보서 1', '시편 23', '로마서 8'].map((item) => {
            const [b, c] = item.split(' ');
            return (
              <button
                key={item}
                onClick={() => {
                  setSelectedBook(b);
                  setSelectedChapter(Number(c));
                }}
                className="px-2 py-0.5 rounded-full bg-white border border-amber-900/10 hover:bg-amber-100 text-[11px] font-medium cursor-pointer transition"
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-slate-400">글자:</span>
          <button
            onClick={() => setFontSize('normal')}
            className={`px-1.5 py-0.5 rounded ${fontSize === 'normal' ? 'bg-amber-700 text-white font-bold' : 'hover:bg-amber-100'}`}
          >
            기본
          </button>
          <button
            onClick={() => setFontSize('large')}
            className={`px-1.5 py-0.5 rounded ${fontSize === 'large' ? 'bg-amber-700 text-white font-bold' : 'hover:bg-amber-100'}`}
          >
            크게
          </button>
        </div>
      </div>

      {/* Verses Content */}
      <div className="px-5 py-4 max-w-2xl mx-auto">
        <div className="text-center my-3 pb-3 border-b border-amber-900/10">
          <h2 className="text-xl font-bold font-playfair text-amber-950">
            {selectedBook} {selectedChapter}장
          </h2>
          <p className="text-xs text-amber-800/80 mt-0.5">{selectedTranslation}</p>
        </div>

        <div
          className={`space-y-3.5 transition-all ${
            fontSize === 'large' ? 'text-[17.5px] leading-[1.8]' : 'text-[15.5px] leading-[1.7]'
          }`}
        >
          {filteredVerses.map((v) => {
            const isHighlighted = highlightedVerses.includes(v.verse);
            return (
              <div
                key={v.verse}
                onClick={() => toggleHighlight(v.verse)}
                className={`p-2.5 rounded-xl transition cursor-pointer flex gap-3 group relative ${
                  isHighlighted
                    ? 'bg-amber-100/90 border border-amber-300 shadow-2xs'
                    : 'hover:bg-amber-50/70 border border-transparent'
                }`}
              >
                {/* Verse Number */}
                <span className="text-xs font-bold text-amber-800/80 pt-1 select-none font-mono min-w-[20px]">
                  {v.verse}
                </span>

                {/* Verse Text */}
                <div className="flex-1">
                  <p className="text-slate-800 font-serif tracking-normal">{v.text}</p>
                </div>

                {/* Floating Quick Action Buttons on Hover/Selection */}
                <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVerseCard({
                        book: selectedBook,
                        chapter: selectedChapter,
                        verse: v.verse,
                        text: v.text,
                        translation: selectedTranslation,
                      });
                    }}
                    title="말씀카드 만들기"
                    className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-red-600 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRecorder({
                        book: selectedBook,
                        chapter: selectedChapter,
                        verse: v.verse,
                        text: v.text,
                        translation: selectedTranslation,
                      });
                    }}
                    title="낭독 녹음하기"
                    className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-blue-600 transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Verse Actions for Selected Verses */}
        {highlightedVerses.length > 0 && (
          <div className="mt-8 p-4 bg-white rounded-2xl border border-amber-200 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Bookmark className="w-4 h-4 text-amber-600 fill-amber-600" />
              <span>{highlightedVerses.length}개 구절 하이라이트 중</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const targetV = verses.find((v) => v.verse === highlightedVerses[0]) || verses[0];
                  onOpenVerseCard({
                    book: selectedBook,
                    chapter: selectedChapter,
                    verse: targetV.verse,
                    text: targetV.text,
                    translation: selectedTranslation,
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                💌 말씀카드 생성
              </button>
              <button
                onClick={() => {
                  const targetV = verses.find((v) => v.verse === highlightedVerses[0]) || verses[0];
                  onOpenRecorder({
                    book: selectedBook,
                    chapter: selectedChapter,
                    verse: targetV.verse,
                    text: targetV.text,
                    translation: selectedTranslation,
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-[#0083e3] hover:bg-blue-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                🎙️ 음성 녹음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
