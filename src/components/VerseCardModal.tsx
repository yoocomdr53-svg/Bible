import React, { useState } from 'react';
import { X, Copy, Check, Download, Sparkles, Share2 } from 'lucide-react';
import { BibleVerse } from '../types';
import { APP_NAME, APP_VERSION } from '../version';

interface VerseCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: BibleVerse;
}

const CARD_THEMES = [
  { id: 'gold', name: '골드빛 묵상', bg: 'from-amber-900 via-stone-900 to-amber-950', text: 'text-amber-100', accent: 'text-amber-400' },
  { id: 'sky', name: '새벽 호숫가', bg: 'from-blue-950 via-slate-900 to-indigo-950', text: 'text-blue-100', accent: 'text-sky-300' },
  { id: 'forest', name: '푸른 초장', bg: 'from-emerald-950 via-stone-900 to-teal-950', text: 'text-emerald-100', accent: 'text-emerald-300' },
  { id: 'clean', name: '순결한 양피지', bg: 'from-stone-100 via-amber-50 to-stone-200', text: 'text-stone-800', accent: 'text-amber-700' },
];

export const VerseCardModal: React.FC<VerseCardModalProps> = ({ isOpen, onClose, verse }) => {
  const [selectedTheme, setSelectedTheme] = useState(CARD_THEMES[0]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyText = () => {
    const formatted = `"${verse.text}"\n- ${verse.book} ${verse.chapter}:${verse.verse} (${verse.translation})\n${APP_NAME} ${APP_VERSION} 제공`;
    navigator.clipboard?.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[390px] bg-white rounded-3xl shadow-2xl p-5 border border-slate-100 text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900">💌 말씀카드 보내기</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Card Preview */}
        <div className="my-4">
          <div
            id="verseCardGraphic"
            className={`w-full min-h-[250px] p-6 rounded-2xl bg-gradient-to-br ${selectedTheme.bg} shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 border border-white/15`}
          >
            {/* Subtle Cross watermark */}
            <div className="absolute -right-4 -bottom-4 text-white/5 pointer-events-none select-none">
              <svg className="w-36 h-36" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2v20m-6-14h12" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex items-center justify-between z-10">
              <span className={`text-[11px] uppercase tracking-widest font-bold ${selectedTheme.accent} font-cinzel`}>
                LOGOS BIBLE
              </span>
              <span className={`text-xs font-semibold ${selectedTheme.accent}`}>
                {verse.book} {verse.chapter}:{verse.verse}
              </span>
            </div>

            <div className="my-auto py-4 z-10">
              <p
                className={`text-[17px] font-playfair font-semibold leading-relaxed tracking-tight ${selectedTheme.text}`}
              >
                "{verse.text}"
              </p>
            </div>

            <div className="flex items-center justify-between z-10 pt-2 border-t border-white/10 text-[10px]">
              <span className={selectedTheme.text}>SuperBible · 오늘의 말씀</span>
              <span className={selectedTheme.accent}>{verse.translation}</span>
            </div>
          </div>
        </div>

        {/* Theme Selectors */}
        <div className="flex gap-2 justify-center mb-4">
          {CARD_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedTheme.id === theme.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {theme.name}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopyText}
            className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">복사되었습니다</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>말씀 텍스트 복사</span>
              </>
            )}
          </button>
          <button
            onClick={handleCopyText}
            className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>카드 공유하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
