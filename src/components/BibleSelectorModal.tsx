import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { BIBLE_BOOKS, getChapterVerseCount } from '../data/bibleData';

interface BibleSelectorModalProps {
  isOpen: boolean;
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
  initialStep?: 'book' | 'chapter' | 'verse';
  onClose: () => void;
  onSelectLocation: (book: string, chapter: number, verse: number) => void;
}

export const BibleSelectorModal: React.FC<BibleSelectorModalProps> = ({
  isOpen,
  initialBook = '창세기',
  initialChapter = 1,
  initialVerse = 1,
  initialStep = 'book',
  onClose,
  onSelectLocation,
}) => {
  const [currentStep, setCurrentStep] = useState<'book' | 'chapter' | 'verse'>(initialStep);
  const [testament, setTestament] = useState<'OT' | 'NT'>('OT');
  const [selectedBook, setSelectedBook] = useState<string>(initialBook);
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter);
  const [selectedVerse, setSelectedVerse] = useState<number>(initialVerse);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedBook(initialBook);
      setSelectedChapter(initialChapter);
      setSelectedVerse(initialVerse);
      setCurrentStep(initialStep);

      // Determine testament of initial book
      const found = BIBLE_BOOKS.find((b) => b.name === initialBook);
      if (found) {
        setTestament(found.testament);
      }
    }
  }, [isOpen, initialBook, initialChapter, initialVerse, initialStep]);

  if (!isOpen) return null;

  // Filter books by 구약 (OT) / 신약 (NT)
  const filteredBooks = BIBLE_BOOKS.filter((b) => b.testament === testament);

  // Current book details
  const currentBookObj = BIBLE_BOOKS.find((b) => b.name === selectedBook) || BIBLE_BOOKS[0];
  const totalChapters = currentBookObj.chaptersCount || 50;
  const totalVerses = getChapterVerseCount(selectedBook, selectedChapter);

  // Top header back chevron action
  const handleBack = () => {
    if (currentStep === 'verse') {
      setCurrentStep('chapter');
    } else if (currentStep === 'chapter') {
      setCurrentStep('book');
    } else {
      onClose();
    }
  };

  // Step 1: Book selection click -> advances to Chapter
  const handleSelectBook = (bookName: string) => {
    setSelectedBook(bookName);
    setSelectedChapter(1);
    setSelectedVerse(1);
    setCurrentStep('chapter');
  };

  // Step 2: Chapter selection click -> advances to Verse
  const handleSelectChapter = (ch: number) => {
    setSelectedChapter(ch);
    setSelectedVerse(1);
    setCurrentStep('verse');
  };

  // Step 3: Verse selection click -> immediately navigate to reader at this verse!
  const handleSelectVerse = (v: number) => {
    setSelectedVerse(v);
    onSelectLocation(selectedBook, selectedChapter, v);
    onClose();
  };

  // Bottom "말씀 읽기 이동" button click
  const handleGoToReading = () => {
    onSelectLocation(selectedBook, selectedChapter, selectedVerse);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white select-none animate-in fade-in duration-150">
      {/* 1. Deep Blue Header (#1b64b9) */}
      <header className="bg-[#1b64b9] text-white px-3 py-2.5 flex items-center justify-between shadow-md z-10 flex-shrink-0">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer flex items-center justify-center"
          title="뒤로 가기"
        >
          <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
        </button>

        {/* Center Title */}
        <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">성경선택</h1>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="border border-white/60 hover:bg-white/15 active:scale-95 px-3 py-1 rounded-md text-xs sm:text-sm font-semibold transition cursor-pointer"
        >
          닫기
        </button>
      </header>

      {/* 2. Step Tabs (성경 | 장 | 절) */}
      <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
        <button
          onClick={() => setCurrentStep('book')}
          className={`flex-1 py-2.5 text-center text-sm font-bold transition-colors cursor-pointer ${
            currentStep === 'book'
              ? 'text-[#1b64b9] border-b-2 border-[#1b64b9]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          성경
        </button>
        <button
          onClick={() => setCurrentStep('chapter')}
          className={`flex-1 py-2.5 text-center text-sm font-bold transition-colors cursor-pointer ${
            currentStep === 'chapter'
              ? 'text-[#1b64b9] border-b-2 border-[#1b64b9]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          장
        </button>
        <button
          onClick={() => setCurrentStep('verse')}
          className={`flex-1 py-2.5 text-center text-sm font-bold transition-colors cursor-pointer ${
            currentStep === 'verse'
              ? 'text-[#1b64b9] border-b-2 border-[#1b64b9]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          절
        </button>
      </div>

      {/* 3. Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col bg-white">
        {/* STEP 1: 성경 (Book Selection) */}
        {currentStep === 'book' && (
          <div className="flex-1 flex flex-col px-3 py-3">
            {/* 구약 / 신약 Segmented Toggle */}
            <div className="flex items-center justify-center my-2">
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl w-full max-w-[340px] shadow-inner">
                <button
                  type="button"
                  onClick={() => setTestament('OT')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    testament === 'OT'
                      ? 'bg-[#1b64b9] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  구약
                </button>
                <button
                  type="button"
                  onClick={() => setTestament('NT')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    testament === 'NT'
                      ? 'bg-[#1b64b9] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  신약
                </button>
              </div>
            </div>

            {/* 5-Column Book Grid */}
            <div className="grid grid-cols-5 gap-2 pt-2 pb-4">
              {filteredBooks.map((book) => {
                const isSelected = selectedBook === book.name;
                return (
                  <button
                    key={book.id}
                    onClick={() => handleSelectBook(book.name)}
                    className={`h-14 sm:h-16 rounded-2xl flex items-center justify-center text-center p-1 border transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'bg-[#f59e0b] border-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-400/50'
                        : 'bg-white text-slate-800 font-semibold border-slate-200/90 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <span className="text-[12px] sm:text-xs leading-tight line-clamp-2">
                      {book.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: 장 (Chapter Selection) */}
        {currentStep === 'chapter' && (
          <div className="flex-1 flex flex-col px-4 py-4">
            {/* Header Description */}
            <div className="text-center mb-4">
              <p className="text-xs text-slate-500 font-medium">선택된 성경:</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1b64b9] my-1">
                {selectedBook}
              </h2>
              <p className="text-xs text-slate-500">원하시는 장(구절 그룹)을 터치하여 선택해 주세요.</p>
            </div>

            {/* 10-Column Chapter Number Circle Grid */}
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2 justify-items-center py-2 max-w-[420px] mx-auto w-full">
              {Array.from({ length: totalChapters }, (_, i) => i + 1).map((ch) => {
                const isSelected = selectedChapter === ch;
                return (
                  <button
                    key={ch}
                    onClick={() => handleSelectChapter(ch)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-90 ${
                      isSelected
                        ? 'bg-[#f59e0b] text-slate-950 font-black border border-amber-500 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>

            {/* Note: The '1장 전체 말씀 보기로 곧바로 이동' button has been DELETED as requested by the user */}
          </div>
        )}

        {/* STEP 3: 절 (Verse Selection) */}
        {currentStep === 'verse' && (
          <div className="flex-1 flex flex-col px-4 py-4">
            {/* Header Description */}
            <div className="text-center mb-4">
              <p className="text-xs text-slate-500 font-medium">선택된 성경:</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1b64b9] my-1">
                {selectedBook} {selectedChapter}장
              </h2>
              <p className="text-xs text-slate-500">원하시는 절을 터치하여 선택해 주세요.</p>
            </div>

            {/* 10-Column Verse Number Circle Grid */}
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2 justify-items-center py-2 max-w-[420px] mx-auto w-full">
              {Array.from({ length: totalVerses }, (_, i) => i + 1).map((v) => {
                const isSelected = selectedVerse === v;
                return (
                  <button
                    key={v}
                    onClick={() => handleSelectVerse(v)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-90 ${
                      isSelected
                        ? 'bg-[#f59e0b] text-slate-950 font-black border border-amber-500 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {v}
                  </button>
                );
              })}
            </div>

            {/* Note: The '창세기 2장 1절로 이동' and '2장 전체 보기' buttons have been DELETED as requested by the user */}
          </div>
        )}
      </div>

      {/* 4. Bottom Info Bar: 현재 위치 & 말씀 읽기 이동 */}
      <footer className="border-t border-slate-200 bg-white px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-lg">
        <div className="text-xs sm:text-sm font-semibold text-slate-700">
          <span>현재 위치: </span>
          <span className="font-bold text-[#1b64b9]">
            {selectedBook} {selectedChapter}장
            {currentStep === 'verse' ? ` ${selectedVerse}절` : ''}
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoToReading}
          className="bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
        >
          말씀 읽기 이동
        </button>
      </footer>
    </div>
  );
};
