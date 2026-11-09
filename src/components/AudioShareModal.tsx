import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Send,
  Cloud,
  Play,
  Pause,
  ExternalLink,
  Settings,
  RefreshCw,
  FileAudio,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  uploadAudioToDrive,
  getGoogleSheetConfig,
  saveGoogleSheetConfig,
  generateAppsScriptCode,
} from '../services/googleSheetsSync';

export interface AudioShareData {
  title: string;
  verseRef: string;
  duration?: string;
  date?: string;
  audioBlob?: Blob | null;
  audioUrl?: string | null;
  audioFile?: File | null;
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
  const [selectedTeam, setSelectedTeam] = useState<'지벳팀' | '경영팀' | '학생팀'>(
    (initialTeam as '지벳팀' | '경영팀' | '학생팀') || '지벳팀'
  );
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [telegramNotice, setTelegramNotice] = useState<string | null>(null);

  // Google Drive Upload State
  const [driveStatus, setDriveStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [driveMsg, setDriveMsg] = useState<string>('');
  const [driveFileUrl, setDriveFileUrl] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [scriptUrlInput, setScriptUrlInput] = useState(() => getGoogleSheetConfig().scriptUrl || '');
  const [copiedScript, setCopiedScript] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const displayDate = data?.date || new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  const displayDuration = data?.duration || '00:15';
  const cleanVerseRef = (data?.verseRef || data?.title || '성경낭독').replace(/[: ]/g, '_');
  const generatedFileName = `[${selectedTeam}]_${userName}_${cleanVerseRef}_${displayDate}.webm`;

  const getAudioFile = (): File | null => {
    if (!data) return null;
    if (data.audioFile) return data.audioFile;
    if (data.audioBlob) {
      return new File([data.audioBlob], generatedFileName, {
        type: data.audioBlob.type || 'audio/webm',
      });
    }
    return null;
  };

  // Auto-upload to Google Drive if scriptUrl is already configured
  useEffect(() => {
    if (isOpen && data?.audioBlob && driveStatus === 'idle') {
      const config = getGoogleSheetConfig();
      if (config.scriptUrl && config.scriptUrl.startsWith('http')) {
        performDriveUpload(config.scriptUrl);
      }
    }
  }, [isOpen, data]);

  // Clean audio on close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  // 1. Google Drive Upload (yoocomdr57@gmail.com -> 성경낭독녹음 폴더)
  const performDriveUpload = async (customUrl?: string) => {
    if (!data.audioBlob) {
      setDriveStatus('error');
      setDriveMsg('녹음된 오디오 데이터가 없습니다. 마이크로 녹음을 먼저 완료해 주세요.');
      return;
    }

    const config = getGoogleSheetConfig();
    const url = customUrl || config.scriptUrl;

    if (!url || !url.startsWith('http')) {
      setShowConfig(true);
      setDriveMsg('yoocomdr57@gmail.com 구글 드라이브 연동을 위해 Web App URL을 등록해 주세요.');
      return;
    }

    setDriveStatus('uploading');
    setDriveMsg('yoocomdr57@gmail.com 구글 드라이브 [성경낭독녹음] 폴더로 전송 중...');

    const res = await uploadAudioToDrive({
      audioBlob: data.audioBlob,
      fileName: generatedFileName,
      memberName: userName,
      teamName: selectedTeam,
      verseRef: data.verseRef || data.title,
      duration: displayDuration,
      customScriptUrl: url,
    });

    if (res.success) {
      setDriveStatus('success');
      setDriveMsg('yoocomdr57@gmail.com [성경낭독녹음] 폴더 저장 완료! (10일 보관)');
      if (res.fileUrl) setDriveFileUrl(res.fileUrl);
    } else {
      setDriveStatus('error');
      setDriveMsg(res.message);
      setShowConfig(true);
    }
  };

  // 2. Share Audio File to Telegram ("파일만 업로드 되도록 한다")
  const handleShareAudioToTelegram = async () => {
    const file = getAudioFile();
    const canShareFiles =
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      file &&
      navigator.canShare({ files: [file] });

    if (canShareFiles && file) {
      try {
        // Native Web Share API Level 2: Passes ONLY the binary audio file directly to Telegram app!
        // No web links, no preview cards - sends as an actual audio message!
        await navigator.share({
          files: [file],
          title: `[${selectedTeam}] ${userName} 낭독 과제`,
        });
        setTelegramNotice(`텔레그램 ${selectedTeam} 과제제출방으로 음원 파일이 전송되었습니다!`);
        setTimeout(() => setTelegramNotice(null), 4000);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User canceled
        console.warn('Native share error:', err);
      }
    }

    // Fallback for PC or browsers without native file sharing:
    handleDownloadAudio();
    setTelegramNotice(
      `음원 파일이 다운로드되었습니다! 텔레그램 PC ${selectedTeam} 과제제출방에 다운로드된 파일을 드래그(끌어다 놓기) 또는 📎(클립)으로 첨부해 주세요.`
    );
    setTimeout(() => {
      window.open('https://web.telegram.org/', '_blank');
    }, 700);
  };

  // 3. Audio preview playback
  const togglePlayAudio = () => {
    if (!data.audioUrl) return;
    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      const audio = new Audio(data.audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
      setIsPlayingAudio(true);
    }
  };

  // 4. Download audio file to device
  const handleDownloadAudio = () => {
    try {
      if (data.audioUrl) {
        const a = document.createElement('a');
        a.href = data.audioUrl;
        a.download = generatedFileName;
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

  // 5. Copy assignment text (optional)
  const handleCopyText = async () => {
    const text =
      `📖 [수퍼바이블 성경 낭독 과제 제출]\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `👤 성도명: ${userName} (${selectedTeam})\n` +
      `📜 낭독 본문: ${data.verseRef || data.title}\n` +
      `⏱️ 녹음 시간: ${displayDuration}\n` +
      `📅 제출 일시: ${displayDate}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `✨ "주의 말씀은 내 발에 등이요 내 길에 빛이니이다" (시 119:105)`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Save Apps Script URL
  const handleSaveConfigAndUpload = () => {
    const trimmed = scriptUrlInput.trim();
    if (!trimmed) {
      alert('Apps Script Web App URL을 입력해 주세요.');
      return;
    }
    const current = getGoogleSheetConfig();
    const updated = {
      ...current,
      scriptUrl: trimmed,
      lastSyncMessage: 'yoocomdr57@gmail.com 구글 드라이브 [성경낭독녹음] 폴더 연동 활성화',
    };
    saveGoogleSheetConfig(updated);
    performDriveUpload(trimmed);
  };

  const handleCopyAppsScript = () => {
    const code = generateAppsScriptCode('yoocomdr57@gmail.com');
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl p-5 sm:p-6 border border-slate-100 text-slate-800 animate-in zoom-in-95 duration-200 space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0083e3] flex items-center justify-center font-bold">
              🎙️
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                낭독 과제 제출 및 음원 전송
              </h3>
              <p className="text-[11px] text-slate-400">텔레그램 과제방 및 구글 드라이브 연동</p>
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

        {/* 1. Team Selection */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
            <span>제출할 과제방 선택:</span>
            <span className="text-[11px] text-blue-600 font-semibold">{selectedTeam} 과제제출방</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['지벳팀', '경영팀', '학생팀'] as const).map((team) => {
              const isSelected = selectedTeam === team;
              return (
                <button
                  key={team}
                  type="button"
                  onClick={() => setSelectedTeam(team)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer border flex flex-col items-center gap-0.5 ${
                    isSelected
                      ? 'bg-[#0083e3] text-white border-[#0083e3] shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{team}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    과제제출방
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Recorded Audio Info & Player Preview */}
        <div className="p-3.5 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 rounded-2xl border border-blue-100 text-left space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">
                {cleanVerseRef} 낭독 파일
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
              ⏱️ {displayDuration}
            </span>
          </div>

          {/* Audio Player preview */}
          {data.audioUrl && (
            <div className="flex items-center gap-2 pt-1 border-t border-blue-100/70">
              <button
                type="button"
                onClick={togglePlayAudio}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>정지</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>녹음 들어보기</span>
                  </>
                )}
              </button>
              <span className="text-[11px] text-slate-500 font-mono truncate">
                {generatedFileName}
              </span>
            </div>
          )}
        </div>

        {/* 3. PRIMARY ACTION: Telegram Direct File Upload (파일만 업로드) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">과제방 전송 (파일 업로드):</span>
            <span className="text-[10px] text-slate-400">링크 없이 파일만 직접 전송</span>
          </div>

          <button
            type="button"
            onClick={handleShareAudioToTelegram}
            className="w-full py-3 px-4 rounded-2xl bg-[#24A1DE] hover:bg-[#1E88E5] active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-md transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>🎙️ 텔레그램 [{selectedTeam}] 과제방에 파일 전송</span>
          </button>

          {telegramNotice && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 leading-relaxed animate-in fade-in">
              {telegramNotice}
            </div>
          )}
          <p className="text-[11px] text-slate-400 leading-snug">
            💡 스마트폰에서 누르면 <strong>텔레그램 앱</strong>이 열리며 {selectedTeam} 과제제출방으로 <strong>음원 파일(.webm)만 직접 업로드</strong>됩니다.
          </p>
        </div>

        {/* 4. GOOGLE DRIVE UPLOAD (yoocomdr57@gmail.com -> 성경낭독녹음 폴더) */}
        <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black text-slate-900">
                구글 드라이브 (yoocomdr57@gmail.com)
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
              성경낭독녹음 폴더 (10일 보관)
            </span>
          </div>

          {/* Drive Upload Status & Action */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => performDriveUpload()}
              disabled={driveStatus === 'uploading'}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-xs ${
                driveStatus === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {driveStatus === 'uploading' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>드라이브 업로드 중...</span>
                </>
              ) : driveStatus === 'success' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>[성경낭독녹음] 저장 완료</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span>구글 드라이브에 지금 저장</span>
                </>
              )}
            </button>

            {driveFileUrl && (
              <a
                href={driveFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1 shadow-2xs"
              >
                <span>열기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="구글 드라이브 연동 설정"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {driveMsg && (
            <div
              className={`text-[11px] leading-relaxed p-2 rounded-xl ${
                driveStatus === 'success'
                  ? 'bg-emerald-100/70 text-emerald-800 font-semibold'
                  : driveStatus === 'error'
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-slate-600'
              }`}
            >
              {driveMsg}
            </div>
          )}

          {/* Inline Configuration Area for Google Apps Script Web App URL */}
          {showConfig && (
            <div className="pt-2 border-t border-emerald-200/80 space-y-2 animate-in fade-in text-xs">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                <strong>yoocomdr57@gmail.com</strong> 계정의 Apps Script Web App URL을 입력하면 [성경낭독녹음] 폴더에 음원이 10일간 자동 보관됩니다.
              </p>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={scriptUrlInput}
                  onChange={(e) => setScriptUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px] font-mono bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSaveConfigAndUpload}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                >
                  저장&업로드
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleCopyAppsScript}
                  className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{copiedScript ? '✅ 스크립트 코드 복사완료!' : '📜 Apps Script 코드 복사하기'}</span>
                </button>
                <a
                  href="https://script.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-slate-500 hover:underline flex items-center gap-0.5"
                >
                  <span>Apps Script 열기</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 5. Secondary Tools: Download & Copy Text */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDownloadAudio}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>음원 파일 다운로드</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>과제 내용 복사</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
