import React, { useState, useEffect } from 'react';
import { Play, Pause, Trash2, Award, Calendar, Clock, Flame, BookOpen } from 'lucide-react';
import { User, UserRecording } from '../types';
import { getNewTestamentStats, getOldTestamentStats } from '../data/bibleData';

interface StatsViewProps {
  user: User;
  recordings: UserRecording[];
  onDeleteRecording: (id: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ user, recordings, onDeleteRecording }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [ntStats, setNtStats] = useState(getNewTestamentStats);
  const [otStats, setOtStats] = useState(getOldTestamentStats);

  useEffect(() => {
    const handleUpdate = () => {
      setNtStats(getNewTestamentStats());
      setOtStats(getOldTestamentStats());
    };
    window.addEventListener('superbible_verse_read_changed', handleUpdate);
    window.addEventListener('superbible_today_read_changed', handleUpdate);
    return () => {
      window.removeEventListener('superbible_verse_read_changed', handleUpdate);
      window.removeEventListener('superbible_today_read_changed', handleUpdate);
    };
  }, []);

  const togglePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      setTimeout(() => setPlayingId(null), 3000);
    }
  };

  // 14 days streak simulation
  const daysOfSept = Array.from({ length: 14 }, (_, i) => i + 1);

  return (
    <div className="flex-1 overflow-y-auto smooth-scroll no-scrollbar bg-[#f8fafc] pb-24 text-slate-800 p-4 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">통독 및 묵상 통계</h2>
          <p className="text-xs text-slate-500">{user.name} 성도님의 거룩한 말씀 동행 기록</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 text-xs font-bold shadow-2xs">
          <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
          <span>{user.consecutiveDays}일 연속 통독 중</span>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">신약 성경 통독</span>
            <span className="font-bold text-[#0083e3]">{ntStats.percent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-2">
            <div
              className="bg-[#0083e3] h-full rounded-full transition-all duration-500"
              style={{ width: `${ntStats.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {ntStats.completedCount} / {ntStats.totalCount}장 완료
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">구약 성경 통독</span>
            <span className="font-bold text-amber-600">{otStats.percent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-2">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${otStats.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {otStats.completedCount} / {otStats.totalCount}장 완료
          </p>
        </div>
      </div>

      {/* 14 Days Reading Calendar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-800">9월 일일 통독 현황</h3>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold">14일 개근 달성 🎉</span>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
            <span key={i} className="text-[10px] text-slate-400 font-semibold">
              {w}
            </span>
          ))}
          {daysOfSept.map((day) => (
            <div
              key={day}
              className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#0083e3] font-bold flex flex-col items-center justify-center relative"
            >
              <span className="text-[11px]">{day}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Saved Audio Recordings List */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">나의 낭독 녹음 보관함</h3>
          </div>
          <span className="text-xs font-bold text-blue-600">{recordings.length}편 저장됨</span>
        </div>

        {recordings.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            아직 녹음된 파일이 없습니다. 성경 본문에서 마이크 버튼을 눌러 녹음해보세요!
          </p>
        ) : (
          <div className="space-y-2">
            {recordings.map((rec) => {
              const isPlaying = playingId === rec.id;
              return (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between transition hover:bg-slate-100/70"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePlay(rec.id)}
                      className="w-8 h-8 rounded-full bg-[#0083e3] text-white flex items-center justify-center hover:bg-blue-600 transition cursor-pointer shadow-2xs"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{rec.title}</h4>
                      <p className="text-[10px] text-slate-500">
                        {rec.verseRef} · {rec.duration} · {rec.date}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteRecording(rec.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
