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
  Share2,
  Copy,
  Download,
  Smartphone,
} from 'lucide-react';
import {
  uploadAudioToDrive,
  getGoogleSheetConfig,
  saveGoogleSheetConfig,
  generateAppsScriptCode,
} from '../services/googleSheetsSync';
import { getActiveSessionInfo } from '../services/authService';
import { convertBlobToMp3 } from '../utils/audioToMp3';
import { APP_NAME, APP_VERSION } from '../version';

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
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [loadedBlob, setLoadedBlob] = useState<Blob | null>(null);

  // Google Drive & Sheets Auto Sync State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMsg, setSyncMsg] = useState<string>('');
  const [driveFileUrl, setDriveFileUrl] = useState<string | null>(null);
  const [userFolderName, setUserFolderName] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  const [scriptUrlInput, setScriptUrlInput] = useState(() => getGoogleSheetConfig().scriptUrl || '');
  const [copiedScript, setCopiedScript] = useState(false);
  const [customPassageName, setCustomPassageName] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Resolve user info and folder name matching Google Drive structure: [이름_아이디] (예: 유원희_yoocomdr)
  const sessionInfo = getActiveSessionInfo();
  const rawMemberName = (sessionInfo?.user?.name || userName || '성도')
    .replace(/ 성도$/, '')
    .replace(/ 관리자$/, '')
    .replace(/\s*\([^)]*\)$/, '')
    .trim();
  const rawLoginId = (sessionInfo?.loginId || 'user').replace(/@.*$/, '').trim();
  const isYooc = rawLoginId.toLowerCase().includes('yoocomdr');
  const effectiveUserName = (isYooc && (!rawMemberName || rawMemberName === '로고스' || rawMemberName === '성도'))
    ? '유원희'
    : (rawMemberName || '성도');
  const effectiveLoginId = isYooc ? 'yoocomdr' : rawLoginId;
  const folderName = `${effectiveUserName}_${effectiveLoginId}`;

  const displayDate = (() => {
    const now = new Date();
    const dateStr = data?.date || `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return dateStr.includes(':') ? dateStr : `${dateStr} ${timeStr}`;
  })();

  const displayDuration = data?.duration || '00:15';

  useEffect(() => {
    if (data?.verseRef) {
      setCustomPassageName(data.verseRef);
    } else if (data?.title) {
      setCustomPassageName(data.title.replace(/ 낭독 녹음$/, ''));
    }
  }, [data]);

  // Load blob from audioUrl if audioBlob is missing
  useEffect(() => {
    if (data?.audioBlob) {
      setLoadedBlob(data.audioBlob);
    } else if (data?.audioUrl) {
      fetch(data.audioUrl)
        .then((r) => r.blob())
        .then((b) => setLoadedBlob(b))
        .catch(() => {});
    }
  }, [data]);

  const effectivePassageName = (customPassageName || data?.verseRef || data?.title || '성경낭독').trim();
  const rawBase = effectivePassageName.replace(/\.(mp3|webm|wav|ogg|m4a)$/i, '');
  const targetFileName = `${rawBase}.mp3`;

  const getAudioFile = async (): Promise<File | null> => {
    if (!data) return null;
    let blobToUse = data.audioBlob || loadedBlob;
    if (!blobToUse && data.audioUrl) {
      try {
        const r = await fetch(data.audioUrl);
        blobToUse = await r.blob();
        setLoadedBlob(blobToUse);
      } catch (e) {}
    }
    if (!blobToUse && data.audioFile) {
      blobToUse = data.audioFile;
    }
    if (!blobToUse) return null;

    // Convert WebM/OGG to genuine MP3 if needed
    if (blobToUse.type.includes('webm') || blobToUse.type.includes('ogg')) {
      try {
        blobToUse = await convertBlobToMp3(blobToUse, 128);
      } catch (e) {
        console.warn('MP3 conversion fallback', e);
      }
    }

    return new File([blobToUse], targetFileName, { type: 'audio/mpeg' });
  };

  // 성경 녹음 낭독 공유 메세지: 낭독본문, 녹음시간, 제출일시만 텍스트로 표시하고 음원 첨부 (설명문, 바로가기 링크 완전 배제)
  const getSubmissionText = () => {
    return `낭독본문: ${effectivePassageName}\n녹음시간: ${displayDuration}\n제출일시: ${displayDate}`;
  };

  // 1. Automatically Sync to Google Drive (성경낭독녹음 > [이름_아이디] 폴더) and Google Sheets
  useEffect(() => {
    const blobToUse = data?.audioBlob || loadedBlob;
    if (isOpen && blobToUse && syncStatus === 'idle') {
      autoSyncToDriveAndSheets(blobToUse);
    }
  }, [isOpen, data, loadedBlob]);

  const autoSyncToDriveAndSheets = async (blobParam?: Blob, customUrl?: string) => {
    const blobToUse = blobParam || data?.audioBlob || loadedBlob;
    if (!blobToUse) return;

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
      audioBlob: blobToUse,
      fileName: targetFileName,
      bibleName: effectivePassageName,
      memberName: effectiveUserName,
      loginId: effectiveLoginId,
      teamName: selectedTeam,
      verseRef: effectivePassageName,
      book: data?.book,
      chapter: data?.chapter,
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
    const file = await getAudioFile();
    const canShareFiles =
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      file &&
      navigator.canShare({ files: [file] });

    if (canShareFiles && file) {
      try {
        await navigator.share({
          files: [file],
          title: effectivePassageName,
          text: getSubmissionText(),
        });
        setActionNotice(`과제제출방으로 ${targetFileName} 음원 파일과 내용이 공유되었습니다!`);
        setTimeout(() => setActionNotice(null), 3500);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('Native share error:', err);
      }
    }

    // Fallback for PC or browsers without Web Share files:
    // Download audio file & copy message text
    if (data?.audioUrl || file) {
      const downloadUrl = file ? URL.createObjectURL(file) : data?.audioUrl;
      if (downloadUrl) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = targetFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    }

    try {
      await navigator.clipboard.writeText(getSubmissionText());
    } catch (e) {}

    setActionNotice(
      `음원 파일(${targetFileName})이 다운로드되고 낭독본문/녹음시간/제출일시 내용이 복사되었습니다.`
    );
    setTimeout(() => {
      window.open('https://web.telegram.org/', '_blank');
    }, 900);
  };

  // 3. Smartphone general app share (KakaoTalk / Drive / Telegram)
  const handleNativeShare = async () => {
    const file = await getAudioFile();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: effectivePassageName,
            text: getSubmissionText(),
          });
        } else {
          await navigator.share({
            title: effectivePassageName,
            text: getSubmissionText(),
          });
          if (file) {
            handleDownloadAudio();
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn(e);
      }
    } else {
      await handleDownloadAudio();
    }
  };

  // 4. Copy text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getSubmissionText());
      setActionNotice('과제 제출 양식이 클립보드에 복사되었습니다!');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e) {
      setActionNotice('클립보드 복사에 실패했습니다.');
    }
  };

  // 5. Download MP3
  const handleDownloadAudio = async () => {
    const file = await getAudioFile();
    const downloadUrl = file ? URL.createObjectURL(file) : data?.audioUrl;
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = targetFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setActionNotice(`${targetFileName} 음원 다운로드가 시작되었습니다.`);
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // 6. Audio Preview Toggle
  const togglePlayAudio = () => {
    const streamUrl = data?.audioUrl || (loadedBlob ? URL.createObjectURL(loadedBlob) : null);
    if (!streamUrl) return;
    if (isPlayingAudio) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      const audio = new Audio(streamUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
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
    autoSyncToDriveAndSheets(undefined, trimmed);
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
      <div className="w-full max-w-[370px] bg-white rounded-3xl shadow-2xl p-5 border border-slate-100 text-slate-800 animate-in zoom-in-95 duration-200 space-y-3.5">
        {/* Header - Matching user screenshot Image 3 */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0083e3] flex items-center justify-center shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                낭독 과제 공유하기
              </h3>
              <p className="text-[11px] text-slate-400">
                과제제출방으로 바로 공유하세요
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

        {/* 1. 과제 제출 팀 선택: [지벳팀] [경영팀] [학생팀] */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            과제 제출 팀 선택:
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
                      ? 'bg-[#0083e3] text-white border-[#0083e3] shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {team}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 공유 메시지 미리보기 (낭독본문, 녹음시간, 제출일시) */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <span>📖</span>
              <span>공유 메시지 양식</span>
            </span>
            <span className="text-[10px] bg-blue-100 text-[#0083e3] font-bold px-2 py-0.5 rounded-full">
              {selectedTeam}
            </span>
          </div>

          <div className="space-y-1.5 text-slate-800 text-[12px] font-mono leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <strong className="text-slate-700 whitespace-nowrap font-sans">낭독본문:</strong>
              <input
                type="text"
                value={customPassageName}
                onChange={(e) => setCustomPassageName(e.target.value)}
                placeholder="예: 말라기 1~5장"
                className="flex-1 text-right text-xs font-black text-blue-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs font-sans"
              />
            </div>
            <div className="flex items-center justify-between">
              <strong className="text-slate-700 font-sans">녹음시간:</strong>
              <span className="font-bold text-slate-900">{displayDuration}</span>
            </div>
            <div className="flex items-center justify-between">
              <strong className="text-slate-700 font-sans">제출일시:</strong>
              <span className="font-bold text-slate-900">{displayDate}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
              <span className="text-slate-500 font-sans">첨부 음원:</span>
              <span className="font-bold text-blue-600 truncate max-w-[190px]">{targetFileName} (MP3)</span>
            </div>
          </div>

          {/* Audio Preview Player */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlayAudio}
              className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-xs flex-shrink-0"
              title="녹음 미리듣기"
            >
              {isPlayingAudio ? (
                <Pause className="w-3 h-3 fill-current" />
              ) : (
                <Play className="w-3 h-3 fill-current ml-0.5" />
              )}
            </button>
            <div className="text-[11px] text-slate-500 truncate flex-1">
              <span>{isPlayingAudio ? '음원 재생 중...' : '녹음 파일 미리듣기 (MP3)'}</span>
            </div>
          </div>
        </div>

        {/* 3. Action Buttons - Matching user screenshot Image 3 */}
        <div className="space-y-2 pt-1">
          {/* Button 1: 텔레그램으로 과제방 바로 공유 (Blue #24A1DE / #0083e3) */}
          <button
            type="button"
            onClick={handleShareToTelegram}
            className="w-full py-3 px-4 rounded-xl bg-[#24A1DE] hover:bg-[#1E88E5] active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Send className="w-4 h-4 fill-current" />
            <span>텔레그램으로 과제방 바로 공유</span>
          </button>

          {/* Button 2: 스마트폰 전체 앱 공유 (카카오톡/드라이브) */}
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-3 px-4 rounded-xl bg-[#0083e3] hover:bg-blue-600 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>스마트폰 전체 앱 공유 (카카오톡/드라이브)</span>
          </button>

          {/* Button 3 & 4: 내용 복사 & 음원 다운로드 */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>내용 복사</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadAudio}
              className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>음원 다운로드</span>
            </button>
          </div>

          {actionNotice && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed animate-in fade-in">
              {actionNotice}
            </div>
          )}

          {/* User Hint - Matching user screenshot Image 3 */}
          <p className="text-[11px] text-slate-500 leading-snug px-1 pt-1">
            💡 [텔레그램으로 과제방 바로 공유]를 누르면 텔레그램 앱이 열려 <strong>{selectedTeam} 과제제출방</strong>을 바로 선택해 전송할 수 있습니다.
          </p>
        </div>

        {/* 4. Google Drive & Spreadsheet Auto-Sync Status - Matching user screenshot Image 4 */}
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
                  : `구글 드라이브 [${folderName}] 자동 동기화`}
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
                title="Google Apps Script 연동 설정"
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
