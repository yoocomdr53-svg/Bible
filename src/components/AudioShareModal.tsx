import React, { useState } from 'react';
import { X, Share2, Copy, Check, Download, Send, Smartphone } from 'lucide-react';

export interface AudioShareData {
  title: string;
  verseRef: string;
  duration?: string;
  date?: string;
  audioBlob?: Blob | null;
  audioUrl?: string | null;
}

interface AudioShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AudioShareData | null;
  userName?: string;
  initialTeam?: string;
}

export const AudioShareModal: React.FC<AudioShareModalProps> = ({
  isOpen,
  onClose,
  data,
  userName = '로고스 관리자',
  initialTeam = '지벳팀',
}) => {
  const [selectedTeam, setSelectedTeam] = useState<'지벳팀' | '경영팀' | '학생팀'>('지벳팀');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const appUrl = 'https://bible-9lrz.vercel.app/';
  const displayDate = data.date || new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  const displayDuration = data.duration || '01:30';

  // Format message for Telegram, KakaoTalk, and clipboard
  const generateShareText = () => {
    return (
      `📖 [수퍼바이블 성경 낭독 과제 제출]\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 성도명: ${userName} (${selectedTeam})\n` +
      `📜 낭독 본문: ${data.verseRef || data.title}\n` +
      `⏱️ 녹음 시간: ${displayDuration}\n` +
      `📅 제출 일시: ${displayDate}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `✨ "주의 말씀은 내 발에 등이요 내 길에 빛이니이다" (시 119:105)\n` +
      `🔗 수퍼바이블 바로가기: ${appUrl}`
    );
  };

  // 1. Share directly to Telegram
  const handleTelegramShare = () => {
    const text = generateShareText();
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  // 2. Native Smartphone Web Share API (Telegram, KakaoTalk, Drive, etc.)
  const handleNativeShare = async () => {
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `[수퍼바이블] ${selectedTeam} ${userName} 낭독 과제`,
          text: text,
          url: appUrl,
        });
      } catch (e) {
        // User cancelled or share failed, fallback to copy
        handleCopyText();
      }
    } else {
      handleCopyText();
    }
  };

  // 3. Copy text to clipboard
  const handleCopyText = async () => {
    try {
      const text = generateShareText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = generateShareText();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 4. Download audio file to device
  const handleDownloadAudio = () => {
    try {
      if (data.audioUrl) {
        const a = document.createElement('a');
        a.href = data.audioUrl;
        a.download = `[${selectedTeam}]_${userName}_${data.verseRef || '성경낭독'}_${displayDate}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('낭독 녹음 파일이 안전하게 보관함에 저장되어 있습니다.');
      }
    } catch (e) {
      console.error('Download audio error:', e);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5 border border-slate-100 text-slate-800 animate-in zoom-in-95 duration-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0083e3] flex items-center justify-center">
              <Share2 className="w-4 h-4 text-[#0083e3]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">낭독 과제 공유하기</h3>
              <p className="text-[10px] text-slate-400">과제제출방으로 바로 공유하세요</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Team Selection */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
            과제 제출 팀 선택:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['지벳팀', '경영팀', '학생팀'] as const).map((team) => {
              const isSelected = selectedTeam === team;
              return (
                <button
                  key={team}
                  type="button"
                  onClick={() => setSelectedTeam(team)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0083e3] text-white border-[#0083e3] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {team}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview Card */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-1">
          <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200">
            <span className="font-extrabold text-[#0083e3]">📖 과제 제출 양식 미리보기</span>
            <span className="text-[10px] font-bold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
              {selectedTeam}
            </span>
          </div>
          <p className="text-slate-700">
            <strong>제출자:</strong> {userName}
          </p>
          <p className="text-slate-700">
            <strong>낭독 본문:</strong> {data.verseRef || data.title}
          </p>
          <p className="text-slate-700">
            <strong>녹음 시간:</strong> {displayDuration} · {displayDate}
          </p>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* 1. Telegram Direct Share */}
          <button
            type="button"
            onClick={handleTelegramShare}
            className="w-full py-2.5 px-4 rounded-xl bg-[#24A1DE] hover:bg-[#1E88E5] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>텔레그램으로 과제방 바로 공유</span>
          </button>

          {/* 2. Smartphone Native Share (KakaoTalk, Messages, Drive, etc.) */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0083e3] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>스마트폰 전체 앱 공유 (카카오톡/드라이브)</span>
          </button>

          {/* 3. Copy Text */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>내용 복사</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadAudio}
              className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>음원 다운로드</span>
            </button>
          </div>
        </div>

        {/* Help Tip */}
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          💡 [텔레그램으로 바로 공유]를 누르면 텔레그램 앱이 열려 <strong>{selectedTeam} 과제제출방</strong>을 바로 선택해 전송할 수 있습니다.
        </p>
      </div>
    </div>
  );
};
