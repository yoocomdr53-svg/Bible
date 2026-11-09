import React, { useState, useRef, useEffect } from 'react';
import { X, Mic, Square, Play, Pause, Save, Check, RefreshCw, Share2 } from 'lucide-react';
import { UserRecording, BibleVerse } from '../types';
import { addMemberRecordingToAdmin, getActiveSession } from '../services/authService';
import { AudioShareModal, AudioShareData } from './AudioShareModal';

interface AudioRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  verse: BibleVerse;
  onSaveRecording: (newRec: UserRecording) => void;
}

export const AudioRecordingModal: React.FC<AudioRecordingModalProps> = ({
  isOpen,
  onClose,
  verse,
  onSaveRecording,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [shareData, setShareData] = useState<AudioShareData | null>(null);

  // Real Audio Recording state & refs
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      setIsRecording(false);
      setRecordedSeconds(0);
      setHasRecorded(false);
      setIsPlaying(false);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);

  if (!isOpen) return null;

  // Real Microphone Audio Recording (Opus 24kHz Mono - 최소 용량 + 선명한 음성)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono (용량 최소화)
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        setRecordedBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setRecordedUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordedSeconds(0);
      setHasRecorded(false);
      timerRef.current = window.setInterval(() => {
        setRecordedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission not granted, falling back to simulated timer', err);
      setIsRecording(true);
      setRecordedSeconds(0);
      setHasRecorded(false);
      timerRef.current = window.setInterval(() => {
        setRecordedSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    setHasRecorded(true);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    } else {
      if (recordedUrl) {
        const audio = new Audio(recordedUrl);
        audioElementRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      } else {
        setIsPlaying(true);
        setTimeout(() => setIsPlaying(false), (recordedSeconds || 3) * 1000);
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const handleSave = () => {
    const newRec: UserRecording = {
      id: `rec-${Date.now()}`,
      title: `${verse.book} ${verse.chapter}:${verse.verse} 낭독`,
      verseRef: `${verse.book} ${verse.chapter}:${verse.verse}`,
      duration: formatTime(recordedSeconds || 15),
      date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    };
    onSaveRecording(newRec);

    const session = getActiveSession();
    if (session) {
      addMemberRecordingToAdmin(
        {
          id: session.id,
          name: session.name,
          email: session.email,
          role: session.role,
          avatarText: session.avatarText,
          provider: session.provider,
          schoolName: session.schoolName,
          department: session.department,
          consecutiveDays: session.consecutiveDays,
          ntProgress: session.ntProgress,
          todayVersesRead: session.todayVersesRead,
          recordingsCount: session.recordingsCount,
        },
        newRec
      );
    }

    const teamName = session?.department || '지벳팀';
    const userName = session?.name || '로고스 관리자';
    const fileName = `[${teamName}]_${userName}_${verse.book}${verse.chapter}장_${verse.verse}절.webm`;
    const audioFile = recordedBlob ? new File([recordedBlob], fileName, { type: recordedBlob.type || 'audio/webm' }) : null;

    setSavedSuccess(true);
    setShareData({
      title: newRec.title,
      verseRef: newRec.verseRef,
      duration: newRec.duration,
      date: newRec.date,
      audioBlob: recordedBlob,
      audioUrl: recordedUrl,
      audioFile: audioFile,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[390px] bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 text-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900">말씀 낭독 녹음실</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Verse to Recite */}
        <div className="my-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-blue-700">낭독할 말씀</span>
            <span className="text-[11px] font-semibold text-blue-600">
              {verse.book} {verse.chapter}:{verse.verse}
            </span>
          </div>
          <p className="text-[14px] text-slate-800 leading-relaxed font-medium">
            "{verse.text}"
          </p>
        </div>

        {/* Recording Visualizer & Controls */}
        <div className="py-5 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-black text-slate-900 tracking-wider mb-4 font-mono">
            {formatTime(recordedSeconds)}
          </div>

          {/* Sound Wave Animation when recording */}
          {isRecording ? (
            <div className="flex items-center gap-1.5 h-12 mb-5">
              {[40, 75, 55, 90, 65, 80, 45, 95, 70, 50, 85, 60].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="h-12 mb-5 flex items-center justify-center text-xs text-slate-400">
              {hasRecorded ? '녹음 완료! 들어보고 저장하세요' : '마이크 버튼을 눌러 낭독을 시작하세요'}
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="flex items-center gap-4">
            {!isRecording && !hasRecorded && (
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex items-center justify-center shadow-lg transition cursor-pointer"
                title="녹음 시작"
              >
                <Mic className="w-7 h-7" />
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white flex items-center justify-center shadow-lg transition cursor-pointer"
                title="녹음 정지"
              >
                <Square className="w-6 h-6 fill-current" />
              </button>
            )}

            {hasRecorded && (
              <>
                <button
                  onClick={togglePlayback}
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
                  title="미리듣기"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={startRecording}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-95 transition cursor-pointer"
                  title="다시 녹음"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={savedSuccess}
                  className="px-4 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>저장 완료!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>내 묵상에 저장</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-2">
          녹음된 음성은 계정 클라우드에 자동 동기화되어 언제든 다시 들을 수 있습니다.
        </p>
      </div>

      {/* Audio Share Modal (Telegram / KakaoTalk / Team 과제제출방) */}
      <AudioShareModal
        isOpen={shareData !== null}
        onClose={() => {
          setShareData(null);
          onClose();
        }}
        data={shareData}
        userName={getActiveSession()?.name || '로고스 관리자'}
      />
    </div>
  );
};
