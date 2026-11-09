import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Play,
  Pause,
  Check,
  RefreshCw,
  ExternalLink,
  Settings,
  CloudCheck,
} from 'lucide-react';
import {
  uploadAudioToDrive,
  getGoogleSheetConfig,
  saveGoogleSheetConfig,
  generateAppsScriptCode,
} from '../services/googleSheetsSync';
import { getActiveSessionInfo } from '../services/authService';

export interface AudioShareData {
  title: string;
  verseRef: string;
  duration?: string;
  date?: string;
  audioBlob?: Blob | null;
  audioUrl?: string | null;
  audioFile?: File | null;
  book?: string;
  chapter?: number;
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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [telegramNotice, setTelegramNotice] = useState<string | null>(null);

  // Google Drive & Sheets Auto Sync State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState<string>('');
  const [driveFileUrl, setDriveFileUrl] = useState<string | null>(null);
  const [userFolderName, setUserFolderName] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [scriptUrlInput, setScriptUrlInput] = useState(() => getGoogleSheetConfig().scriptUrl || '');
  const [copiedScript, setCopiedScript] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sessionInfo = getActiveSessionInfo();
  const effectiveUserName = (sessionInfo?.user?.name || userName || '성도').replace(/ 성도$/, '').replace(/ 관리자$/, '').trim();
  const effectiveLoginId = (sessionInfo?.loginId || 'user').replace(/@.*$/, '').trim();
  const folderName = `${effectiveUserName}_${effectiveLoginId}`;

  const displayDate = data?.date || new Date().toISOString().slice(0, 10).replace(/-/g, '.');
  const displayDuration = data?.duration || '00:15';
  const bibleRecName = (data?.verseRef || data?.title || '성경낭독').trim();
  const targetFileName = `${bibleRecName}.webm`;

  const getAudioFile = (): File | null => {
    if (!data) return null;
    if (data.audioFile) return data.audioFile;
    if (data.audioBlob) {
      return new File([data.audioBlob], targetFileName, {
        type: data.audioBlob.type || 'audio/webm',
      });
    }
    return null;
  };

  // 1. Automatically Sync to Google Drive (성경낭독녹음 > [이름_아이디] 폴더) and Google Sheets
  useEffect(() => {
    if (isOpen && data?.audioBlob && syncStatus === 'idle') {
      autoSyncToDriveAndSheets();
    }
  }, [isOpen, data]);

  const autoSyncToDriveAndSheets = async (customUrl?: string) => {
    if (!data?.audioBlob) return;

    const config = getGoogleSheetConfig();
    const url = customUrl || config.scriptUrl;

    if (!url || !url.startsWith('http')) {
      setSyncStatus('idle');
      setSyncMsg('Google Apps Script URL이 등록되면 드라이브로 자동 저장됩니다.');
      return;
    }

    setSyncStatus('syncing');
    setSyncMsg(`구글 드라이브 [${folderName}] 폴더 및 시트 자동 저장 중...`);

    const res = await uploadAudioToDrive({
      audioBlob: data.audioBlob,
      fileName: targetFileName,
      bibleName: bibleRecName,
      memberName: effectiveUserName,
      loginId: effectiveLoginId,
      teamName: selectedTeam,
      verseRef: bibleRecName,
      book: data.book,
      chapter: data.chapter,
      duration: displayDuration,
      customScriptUrl: url,
    });

    if (res.success) {
      setSyncStatus('success');
      setSyncMsg(`구글 드라이브 [${res.userFolderName || folderName}] 폴더 저장 및 시트 자동 동기화 완료! (10일 보관)`);
      setUserFolderName(res.userFolderName || folderName);
      if (res.fileUrl) setDriveFileUrl(res.fileUrl);
    } else {
      setSyncStatus('error');
      setSyncMsg(res.message);
    }
  };

  // 2. Pure Telegram Share Function ("순수 텔레그램 공유기능")
  const handleShareToTelegram = async () => {
    const file = getAudioFile();
    const canShareFiles =
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      file &&
      navigator.canShare({ files: [file] });

    if (canShareFiles && file) {
      try {
        // Native Web Share API Level 2: Shares ONLY the binary audio file directly to Telegram
        // No web links, no text preview cards!
        await navigator.share({
          files: [file],
          title: `[${selectedTeam}] ${effectiveUserName} 낭독 과제`,
        });
        setTelegramNotice(`텔레그램 ${selectedTeam} 과제제출방으로 음원 파일이 전송되었습니다!`);
        setTimeout(() => setTelegramNotice(null), 3500);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User closed sheet
        console.warn('Native share error:', err);
      }
    }

    // Fallback for PC or browsers without Web Share files:
    // Download audio file & open Telegram Web
    if (data?.audioUrl) {
      const a = document.createElement('a');
      a.href = data.audioUrl;
      a.download = targetFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    setTelegramNotice(
      `PC에서는 음원 파일(${targetFileName})이 다운로드되었습니다. 텔레그램 ${selectedTeam} 과제제출방에 파일을 끌어다 놓아 전송해 주세요!`
    );
    setTimeout(() => {
      window.open('https://web.telegram.org/', '_blank');
    }, 700);
  };

  // 3. Audio Preview Toggle
  const togglePlayAudio = () => {
    if (!data?.audioUrl) return;
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

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlayingAudio(false);
    };
  }, [isOpen]);

  // Save Apps Script URL
  const handleSaveConfig = () => {
    const trimmed = scriptUrlInput.trim();
    if (!trimmed) {
      alert('Apps Script Web App URL을 입력해 주세요.');
      return;
    }
    const current = getGoogleSheetConfig();
    const updated = {
      ...current,
      scriptUrl: trimmed,
      lastSyncMessage: `yoocomdr57@gmail.com [${folderName}] 폴더 연동 준비 완료`,
    };
    saveGoogleSheetConfig(updated);
    setShowConfig(false);
    autoSyncToDriveAndSheets(trimmed);
  };

  const handleCopyAppsScript = () => {
    const code = generateAppsScriptCode('yoocomdr57@gmail.com');
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  if (!isOpen || !data) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[360px] bg-white rounded-3xl shadow-2xl p-5 border border-slate-100 text-slate-800 animate-in zoom-in-95 duration-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#24A1DE]/10 text-[#24A1DE] flex items-center justify-center">
              <Send className="w-4 h-4 fill-[#24A1DE]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                텔레그램 과제방 전송
              </h3>
              <p className="text-[11px] text-slate-400">
                {bibleRecName} · {effectiveUserName} 성도
              </p>
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

        {/* 1. Team Selector */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
            <span>제출할 과제방 선택:</span>
            <span className="text-[11px] text-[#24A1DE] font-bold">{selectedTeam} 과제제출방</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['지벳팀', '경영팀', '학생팀'] as const).map((team) => {
              const isSelected = selectedTeam === team;
              return (
                <button
                  key={team}
                  type="button"
                  onClick={() => setSelectedTeam(team)}
                  className={`py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                    isSelected
                      ? 'bg-[#24A1DE] text-white border-[#24A1DE] shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {team}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Audio Preview Player */}
        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs flex-shrink-0"
              title="녹음 미리듣기"
            >
              {isPlayingAudio ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>
            <div className="truncate">
              <p className="font-bold text-slate-800 text-[12px] truncate">{targetFileName}</p>
              <p className="text-[10px] text-slate-400 font-mono">녹음 시간: {displayDuration}</p>
            </div>
          </div>
        </div>

        {/* 3. Pure Telegram Send Button */}
        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={handleShareToTelegram}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#24A1DE] hover:bg-[#1E88E5] active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
          >
            <Send className="w-4 h-4 fill-current" />
            <span>🎙️ 텔레그램 [{selectedTeam}]에 파일 전송</span>
          </button>

          {telegramNotice && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed animate-in fade-in">
              {telegramNotice}
            </div>
          )}
        </div>

        {/* 4. Google Drive & Spreadsheet Auto-Sync Status */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 truncate">
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin flex-shrink-0" />
              ) : syncStatus === 'success' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
              )}
              <span className="truncate">
                {syncStatus === 'syncing'
                  ? '구글 드라이브 및 시트 자동 저장 중...'
                  : syncStatus === 'success'
                  ? `[${userFolderName || folderName}] 폴더 및 시트 자동 저장 완료`
                  : '구글 드라이브 및 스프레드시트 자동 동기화'}
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {driveFileUrl && (
                <a
                  href={driveFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                >
                  <span>열기</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                title="설정"
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Config popout if needed */}
          {showConfig && (
            <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 animate-in fade-in">
              <p className="text-[10.5px] text-slate-600 leading-relaxed">
                Apps Script Web App URL을 등록하면 <strong>yoocomdr57@gmail.com</strong> 계정의 [성경낭독녹음 &gt; {folderName}] 폴더에 음원이 자동 저장됩니다.
              </p>
              <div className="flex gap-1">
                <input
                  type="url"
                  value={scriptUrlInput}
                  onChange={(e) => setScriptUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-2 py-1 text-[11px] font-mono bg-white border border-slate-300 rounded-lg focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  저장
                </button>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-0.5">
                <button
                  type="button"
                  onClick={handleCopyAppsScript}
                  className="text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  {copiedScript ? '✅ 코드 복사됨' : '📜 Apps Script 코드 복사'}
                </button>
                <span>10일 자동 보관</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
