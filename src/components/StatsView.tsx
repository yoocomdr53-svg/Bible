import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  Trash2,
  Award,
  Calendar as CalendarIcon,
  Clock,
  Flame,
  BookOpen,
  Share2,
  ChevronLeft,
  ChevronRight,
  Mic,
  Sparkles,
  CheckCircle2,
  Music,
} from 'lucide-react';
import { User, UserRecording } from '../types';
import {
  getNewTestamentStats,
  getOldTestamentStats,
  getSingleRoundBibleStats,
  getGoal12TotalStats,
  getTodayReadCount,
} from '../data/bibleData';
import { AudioShareModal, AudioShareData } from './AudioShareModal';
import { getAllUserRecordings, deleteUserRecordingFromStore } from '../services/authService';

interface StatsViewProps {
  user: User;
  recordings: UserRecording[];
  onDeleteRecording: (id: string) => void;
  onNavigateToRecord?: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  user,
  recordings: propRecordings,
  onDeleteRecording,
  onNavigateToRecord,
}) => {
  // Merged recordings from props and persistent store
  const [allRecordings, setAllRecordings] = useState<UserRecording[]>(() => {
    const fromStore = getAllUserRecordings();
    if (fromStore.length > 0) return fromStore;
    return propRecordings;
  });

  // Audio Playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Overall Stats
  const [ntStats, setNtStats] = useState(getNewTestamentStats);
  const [otStats, setOtStats] = useState(getOldTestamentStats);
  const [singleStats, setSingleStats] = useState(getSingleRoundBibleStats);
  const [goal12Stats, setGoal12Stats] = useState(getGoal12TotalStats);
  const [todayReadCount, setTodayReadCount] = useState(getTodayReadCount);

  // Share Modal state
  const [shareData, setShareData] = useState<AudioShareData | null>(null);

  // Library Filter Tab: 'today' (당일 낭독) | 'week' (최근 1주일) | 'all' (전체)
  const [libraryFilter, setLibraryFilter] = useState<'today' | 'week' | 'all'>('today');

  // Calendar State: Current viewing Year & Month
  const today = new Date();
  const [viewYear, setViewYear] = useState<number>(today.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    return `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  });

  // Today Date string: YYYY.MM.DD
  const todayDateStr = useMemo(() => {
    return `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  }, []);

  // Listen to realtime updates
  useEffect(() => {
    const handleUpdate = () => {
      setNtStats(getNewTestamentStats());
      setOtStats(getOldTestamentStats());
      setSingleStats(getSingleRoundBibleStats());
      setGoal12Stats(getGoal12TotalStats());
      setTodayReadCount(getTodayReadCount());
      const recs = getAllUserRecordings();
      if (recs.length > 0) {
        setAllRecordings(recs);
      }
    };
    window.addEventListener('superbible_verse_read_changed', handleUpdate);
    window.addEventListener('superbible_today_read_changed', handleUpdate);
    window.addEventListener('superbible_recordings_changed', handleUpdate);
    return () => {
      window.removeEventListener('superbible_verse_read_changed', handleUpdate);
      window.removeEventListener('superbible_today_read_changed', handleUpdate);
      window.removeEventListener('superbible_recordings_changed', handleUpdate);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  // Sync when propRecordings changes
  useEffect(() => {
    if (propRecordings && propRecordings.length > 0) {
      const merged = getAllUserRecordings();
      setAllRecordings(merged.length > 0 ? merged : propRecordings);
    }
  }, [propRecordings]);

  // Audio Playback handler
  const handleTogglePlay = (rec: UserRecording) => {
    if (playingId === rec.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    if (rec.audioBlobUrl) {
      const audio = new Audio(rec.audioBlobUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
      audio.play().catch(() => setPlayingId(null));
      setPlayingId(rec.id);
    } else {
      // Simulate play if audio blob is unavailable
      setPlayingId(rec.id);
      setTimeout(() => setPlayingId(null), 3500);
    }
  };

  const handleOpenShare = (rec: UserRecording) => {
    setShareData({
      title: rec.title,
      verseRef: rec.verseRef,
      duration: rec.duration,
      date: rec.date,
      audioUrl: rec.audioBlobUrl,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('이 낭독 녹음 파일을 삭제하시겠습니까?')) {
      deleteUserRecordingFromStore(id);
      onDeleteRecording(id);
      setAllRecordings((prev) => prev.filter((r) => r.id !== id));
      if (playingId === id) {
        if (audioPlayerRef.current) audioPlayerRef.current.pause();
        setPlayingId(null);
      }
    }
  };

  // Helper: Normalize date string to YYYY.MM.DD
  const normalizeDate = (dStr: string): string => {
    const clean = dStr.replace(/-/g, '.').trim();
    const parts = clean.split('.');
    if (parts.length === 3) {
      return `${parts[0]}.${parts[1].padStart(2, '0')}.${parts[2].padStart(2, '0')}`;
    }
    return clean;
  };

  // Calendar Calculation
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0: Sun, 6: Sat
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedCalendarDate(todayDateStr);
  };

  // Map recordings by normalized date
  const recordingsByDateMap = useMemo(() => {
    const map = new Map<string, UserRecording[]>();
    allRecordings.forEach((rec) => {
      const key = normalizeDate(rec.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(rec);
    });
    return map;
  }, [allRecordings]);

  // Monthly summary stats
  const monthlyStats = useMemo(() => {
    let recitedDays = 0;
    let totalMonthlyRecitations = 0;

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateKey = `${viewYear}.${String(viewMonth + 1).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
      const recs = recordingsByDateMap.get(dateKey);
      if (recs && recs.length > 0) {
        recitedDays += 1;
        totalMonthlyRecitations += recs.length;
      }
    }
    return {
      recitedDays,
      totalMonthlyRecitations,
      percent: Math.min(100, Math.round((recitedDays / daysInCurrentMonth) * 100)),
    };
  }, [viewYear, viewMonth, daysInCurrentMonth, recordingsByDateMap]);

  // Selected date recordings
  const selectedDateRecordings = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return recordingsByDateMap.get(selectedCalendarDate) || [];
  }, [selectedCalendarDate, recordingsByDateMap]);

  // Filtered recordings for the library
  const todayRecordings = useMemo(() => {
    return allRecordings.filter((r) => normalizeDate(r.date) === todayDateStr);
  }, [allRecordings, todayDateStr]);

  const weekRecordings = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return allRecordings.filter((r) => {
      const clean = r.date.replace(/\./g, '-');
      const time = new Date(clean).getTime();
      return isNaN(time) ? true : time >= sevenDaysAgo.getTime();
    });
  }, [allRecordings]);

  const displayedRecordings = useMemo(() => {
    if (libraryFilter === 'today') return todayRecordings;
    if (libraryFilter === 'week') return weekRecordings;
    return allRecordings;
  }, [libraryFilter, todayRecordings, weekRecordings, allRecordings]);

  return (
    <div className="flex-1 overflow-y-auto smooth-scroll no-scrollbar bg-[#f8fafc] pb-24 text-slate-800 p-3 sm:p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>말씀 통독 및 낭독 통계</span>
            <span className="text-[10px] bg-blue-100 text-[#0083e3] px-2 py-0.5 rounded-full font-bold">
              온라인 3.0
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {user.name} 성도님의 거룩한 말씀 동행 달력 및 낭독 음원 보관함
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-full border border-amber-200 text-xs font-black shadow-2xs">
          <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
          <span>{user.consecutiveDays || 1}일 연속 통독 중</span>
        </div>
      </div>

      {/* Progress Cards: 일독 진행률 & 목표달성 전체 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold">일독 진행률</span>
            <span className="font-black text-[#0083e3] text-sm">{singleStats.percent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-2">
            <div
              className="bg-[#0083e3] h-full rounded-full transition-all duration-500"
              style={{ width: `${singleStats.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            {singleStats.completedCount} / 1,189장 완독
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-soft">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold">목표달성 전체</span>
            <span className="font-black text-indigo-600 text-sm">{goal12Stats.percent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-2">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${goal12Stats.percent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">
            {goal12Stats.totalCumChapters.toLocaleString()} / 14,268장 (12목표)
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-soft col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold">오늘 읽은 말씀</span>
            <span className="font-black text-emerald-600 text-sm">{todayReadCount}장</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden my-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (todayReadCount / 10) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-emerald-700 font-bold">
            {todayReadCount >= 10 ? '🎉 오늘 10장 목표 달성!' : `오늘 목표까지 ${10 - todayReadCount}장`}
          </p>
        </div>
      </div>

      {/* ========================================================
          SECTION 1: 낭독 달력 (그날 그날 낭독한 날짜 표시)
         ======================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-soft space-y-3.5">
        {/* Calendar Header with Month Switcher */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0083e3] flex items-center justify-center shadow-2xs">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                일일 낭독 및 통독 달력
              </h3>
              <p className="text-[10px] text-slate-400">
                그날 그날 낭독한 날짜가 초록색 뱃지로 표시됩니다
              </p>
            </div>
          </div>

          {/* Month Navigator Controls */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition cursor-pointer"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-black text-xs text-slate-800 min-w-[76px] text-center">
              {viewYear}년 {viewMonth + 1}월
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition cursor-pointer"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleGoToday}
              className="px-2 py-0.5 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 transition cursor-pointer shadow-2xs ml-0.5"
            >
              오늘
            </button>
          </div>
        </div>

        {/* Monthly Summary Badges */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/70 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">이번 달 낭독 일수</span>
            <span className="text-xs sm:text-sm font-black text-emerald-600">
              {monthlyStats.recitedDays}일 / {daysInCurrentMonth}일
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">이번 달 낭독 편수</span>
            <span className="text-xs sm:text-sm font-black text-[#0083e3]">
              {monthlyStats.totalMonthlyRecitations}편 녹음
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">낭독 실천율</span>
            <span className="text-xs sm:text-sm font-black text-amber-600">
              {monthlyStats.percent}% 달성
            </span>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs pt-1">
          {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
            <span
              key={w}
              className={`text-[11px] py-1 ${
                idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-slate-500'
              }`}
            >
              {w}
            </span>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty slots before day 1 */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-13 sm:h-16 rounded-xl bg-slate-50/40" />
          ))}

          {/* Actual days in month */}
          {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateKey = `${viewYear}.${String(viewMonth + 1).padStart(2, '0')}.${String(dayNum).padStart(2, '0')}`;
            const isTodayDate = dateKey === todayDateStr;
            const isSelected = dateKey === selectedCalendarDate;
            const dayRecs = recordingsByDateMap.get(dateKey) || [];
            const hasRecitation = dayRecs.length > 0;
            const dayOfWeek = (firstDayOfWeek + i) % 7;

            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() => setSelectedCalendarDate(dateKey)}
                className={`h-13 sm:h-16 rounded-2xl p-1 sm:p-1.5 flex flex-col justify-between items-center transition relative cursor-pointer border ${
                  isSelected
                    ? 'ring-2 ring-blue-600 border-blue-400 bg-blue-50/60 shadow-xs'
                    : hasRecitation
                    ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/70'
                    : isTodayDate
                    ? 'bg-blue-50/30 border-blue-300'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {/* Day Number and Today Indicator */}
                <div className="w-full flex items-center justify-between px-0.5">
                  <span
                    className={`text-xs font-black leading-none ${
                      isTodayDate
                        ? 'text-blue-600 bg-blue-100 px-1 py-0.2 rounded-full text-[10px]'
                        : dayOfWeek === 0
                        ? 'text-red-500'
                        : dayOfWeek === 6
                        ? 'text-blue-500'
                        : 'text-slate-800'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {isTodayDate && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                  )}
                </div>

                {/* Recitation Marking Stamp / Badge */}
                {hasRecitation ? (
                  <div className="w-full flex flex-col items-center justify-center">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                      <Mic className="w-2.5 h-2.5 stroke-[2.8]" />
                    </span>
                    <span className="text-[9px] font-black text-emerald-700 leading-tight mt-0.5">
                      {dayRecs.length}편
                    </span>
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Details Box */}
        {selectedCalendarDate && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>{selectedCalendarDate} 낭독 및 묵상 기록</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                총 {selectedDateRecordings.length}건
              </span>
            </div>

            {selectedDateRecordings.length === 0 ? (
              <div className="py-2.5 text-center text-slate-400">
                <p>선택하신 날짜에 녹음된 낭독 파일이 없습니다.</p>
                {selectedCalendarDate === todayDateStr && onNavigateToRecord && (
                  <button
                    type="button"
                    onClick={onNavigateToRecord}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-xs"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>오늘 말씀 낭독 녹음하기</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                {selectedDateRecordings.map((rec) => {
                  const isPlaying = playingId === rec.id;
                  return (
                    <div
                      key={rec.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(rec)}
                          className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs flex-shrink-0"
                          title="재생"
                        >
                          {isPlaying ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 text-xs truncate">{rec.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {rec.verseRef} · {rec.duration} · MP3
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenShare(rec)}
                          className="p-1 text-[#24A1DE] hover:bg-sky-50 rounded-lg transition cursor-pointer"
                          title="텔레그램 과제제출방 공유"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          SECTION 2: 나의 낭독 녹음 보관함 (당일 낭독 / 1주일 / 전체)
         ======================================================== */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-soft space-y-3.5">
        {/* Header & Filter Tabs */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 leading-tight">
                  나의 낭독 녹음 보관함
                </h3>
                <p className="text-[10px] text-slate-400">
                  당일 낭독 및 일주일 동안 녹음한 음원 파일을 분류하여 청취합니다
                </p>
              </div>
            </div>

            {onNavigateToRecord && (
              <button
                type="button"
                onClick={onNavigateToRecord}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0083e3] text-[11px] font-bold border border-blue-200 transition cursor-pointer"
              >
                <Mic className="w-3 h-3" />
                <span>새 낭독 녹음</span>
              </button>
            )}
          </div>

          {/* 3 Filter Tabs: 당일 낭독 | 최근 1주일 | 전체 보관함 */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setLibraryFilter('today')}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer ${
                libraryFilter === 'today'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>당일 낭독 (오늘)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                {todayRecordings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLibraryFilter('week')}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer ${
                libraryFilter === 'week'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>최근 1주일</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-extrabold">
                {weekRecordings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLibraryFilter('all')}
              className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer ${
                libraryFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>전체 보관함</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-extrabold">
                {allRecordings.length}
              </span>
            </button>
          </div>
        </div>

        {/* Recordings List */}
        {displayedRecordings.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Music className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-slate-500">
              {libraryFilter === 'today'
                ? '오늘 낭독한 녹음 파일이 아직 없습니다.'
                : libraryFilter === 'week'
                ? '최근 1주일 동안 녹음된 파일이 없습니다.'
                : '보관된 낭독 녹음 파일이 없습니다.'}
            </p>
            {onNavigateToRecord && (
              <button
                type="button"
                onClick={onNavigateToRecord}
                className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-sm"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>지금 말씀 낭독 시작하기</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {displayedRecordings.map((rec) => {
              const isPlaying = playingId === rec.id;
              const isTodayRec = normalizeDate(rec.date) === todayDateStr;

              return (
                <div
                  key={rec.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between ${
                    isPlaying
                      ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                      : 'bg-slate-50/80 border-slate-200/90 hover:bg-slate-100/70'
                  }`}
                >
                  {/* Left: Play button & Recording Info */}
                  <div className="flex items-center gap-3 truncate">
                    <button
                      type="button"
                      onClick={() => handleTogglePlay(rec)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition active:scale-95 cursor-pointer shadow-xs flex-shrink-0 ${
                        isPlaying
                          ? 'bg-blue-600 ring-2 ring-blue-300 animate-pulse'
                          : 'bg-[#0083e3] hover:bg-blue-600'
                      }`}
                      title={isPlaying ? '일시 정지' : '재생'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {rec.title}
                        </h4>
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-extrabold flex-shrink-0">
                          MP3
                        </span>
                        {isTodayRec && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold flex-shrink-0">
                            오늘
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        <strong className="text-slate-700">{rec.verseRef}</strong> · {rec.duration} · {rec.date}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Share & Delete */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenShare(rec)}
                      className="p-2 text-[#24A1DE] hover:bg-sky-100/80 rounded-xl transition cursor-pointer"
                      title="텔레그램 과제제출방 공유"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rec.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="녹음 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audio Share Modal (Telegram / KakaoTalk / Team 과제제출방) */}
      <AudioShareModal
        isOpen={shareData !== null}
        onClose={() => setShareData(null)}
        data={shareData}
        userName={user?.name || '로고스 관리자'}
      />
    </div>
  );
};
