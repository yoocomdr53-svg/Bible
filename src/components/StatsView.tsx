import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  Trash2,
  Award,
  Calendar,
  Clock,
  Flame,
  BookOpen,
  Share2,
  BarChart2,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { User, UserRecording } from '../types';
import {
  getNewTestamentStats,
  getOldTestamentStats,
  getCompletedChapters,
  getTodayReadCount,
} from '../data/bibleData';
import { AudioShareModal, AudioShareData } from './AudioShareModal';
import { getAllUserRecordings, deleteUserRecordingFromStore } from '../services/authService';
import { getAudioFromStorage, deleteAudioFromStorage } from '../utils/audioStorage';

interface StatsViewProps {
  user: User;
  recordings: UserRecording[];
  onDeleteRecording: (id: string) => void;
  onNavigateToRecord?: () => void;
}

// Helper to extract chapter keys from a recording's title / verseRef
function extractChaptersFromRec(rec: UserRecording): string[] {
  const text = `${rec.verseRef || ''} ${rec.title || ''}`;
  const keys: string[] = [];

  // 1. Range e.g. "말라기 1~5장" or "말라기 1-5장"
  const rangeMatch = text.match(/([가-힣]+)\s*(\d+)[\s~–-]+(\d+)\s*장?/);
  if (rangeMatch) {
    const book = rangeMatch[1];
    const start = parseInt(rangeMatch[2], 10);
    const end = parseInt(rangeMatch[3], 10);
    for (let ch = start; ch <= end; ch++) {
      keys.push(`${book}-${ch}`);
    }
    return keys;
  }

  // 2. Single chapter e.g. "시편 23편" or "야고보서 1장"
  const singleMatch = text.match(/([가-힣]+)\s*(\d+)\s*(?:장|편)/);
  if (singleMatch) {
    const book = singleMatch[1];
    const ch = parseInt(singleMatch[2], 10);
    keys.push(`${book}-${ch}`);
    return keys;
  }

  // 3. Colon e.g. "시편 23:1-6" or "로마서 8:28-39"
  const colonMatch = text.match(/([가-힣]+)\s*(\d+)\s*:\s*\d+/);
  if (colonMatch) {
    const book = colonMatch[1];
    const ch = parseInt(colonMatch[2], 10);
    keys.push(`${book}-${ch}`);
    return keys;
  }

  return keys;
}

// Category book definitions
const NT_GOSPELS = ['마태복음', '마가복음', '누가복음', '요한복음']; // 89
const NT_ACTS = ['사도행전']; // 28
const NT_PAULINE = [
  '로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서',
  '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서',
  '디모데전서', '디모데후서', '디도서', '빌레몬서', '히브리서'
]; // 100
const NT_GENERAL = [
  '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서',
  '요한삼서', '유다서', '요한계시록'
]; // 43

const OT_PENTATEUCH = ['창세기', '출애굽기', '레위기', '민수기', '신명기']; // 187
const OT_HISTORY = [
  '여호수아', '사사기', '룻기', '사무엘상', '사무엘하', '열왕기상',
  '열왕기하', '역대상', '역대하', '에스라', '느헤미야', '에스더'
]; // 249
const OT_POETRY = ['욥기', '시편', '잠언', '전도서', '아가']; // 243
const OT_MAJOR_PROPHETS = ['이사야', '예레미야', '예레미야애가', '에스겔', '다니엘']; // 183
const OT_MINOR_PROPHETS = [
  '호세아', '요엘', '아모스', '오바댜', '요나', '미가',
  '나훔', '하박국', '스바냐', '학개', '스가랴', '말라기'
]; // 67

export const StatsView: React.FC<StatsViewProps> = ({
  user,
  recordings: propRecordings,
  onDeleteRecording,
  onNavigateToRecord,
}) => {
  // Main Tab State: 'weekly' (주간) | 'monthly' (월간 추이) | 'progress' (진행률)
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'progress'>('progress');

  // Sub Tab in Monthly View: 'monthly' (월별 비교) | 'weekly' (주차별 추이)
  const [monthlySubTab, setMonthlySubTab] = useState<'monthly' | 'weekly'>('monthly');

  // Testament progress toggle in Progress tab: 'NT' (신약) | 'OT' (구약)
  const [progressTestament, setProgressTestament] = useState<'NT' | 'OT'>('NT');

  // Active Tooltip index in Monthly Chart (default: current month)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(4);

  // Active Day index in Weekly Chart (default: today's day of week)
  const now = useMemo(() => new Date(), []);
  const todayDayOfWeekIndex = (now.getDay() + 6) % 7; // Mon = 0, Sun = 6
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(todayDayOfWeekIndex);

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
  const [todayReadCount, setTodayReadCount] = useState(getTodayReadCount);

  // Share Modal state
  const [shareData, setShareData] = useState<AudioShareData | null>(null);

  // Toast notice
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Attendance tracking stored in localStorage
  const [attendedDays, setAttendedDays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('superbible_attendance_days_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    // Seed initial attendance based on user's consecutive days or recordings
    const initialDays = new Set<number>();
    const currentDay = new Date().getDate();
    initialDays.add(currentDay);
    // Add past days up to user consecutive days or default
    const count = Math.min(14, user.consecutiveDays || 14);
    for (let i = 1; i <= count; i++) {
      initialDays.add(i);
    }
    return Array.from(initialDays).sort((a, b) => a - b);
  });

  // Automatically record today's access/recitation to attendance
  useEffect(() => {
    try {
      const currentDayNum = new Date().getDate();
      setAttendedDays((prev) => {
        if (!prev.includes(currentDayNum)) {
          const updated = [...prev, currentDayNum].sort((a, b) => a - b);
          localStorage.setItem('superbible_attendance_days_v4', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    } catch (e) {}
  }, []);

  // Listen to realtime updates
  useEffect(() => {
    const handleUpdate = () => {
      setNtStats(getNewTestamentStats());
      setOtStats(getOldTestamentStats());
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

  // -------------------------------------------------------------
  // 1. EXTRACT ALL COMPLETED/RECITED CHAPTERS BY CURRENT USER
  // -------------------------------------------------------------
  const allUserCompletedChapters = useMemo(() => {
    const set = new Set<string>();

    // 1) From completed chapters store
    const completedStore = getCompletedChapters();
    completedStore.forEach((k) => set.add(k));

    // 2) From user recordings (e.g. 말라기 1~5장, 시편 23편, 야고보서 1장, 로마서 8장)
    allRecordings.forEach((r) => {
      const chs = extractChaptersFromRec(r);
      chs.forEach((chKey) => set.add(chKey));
    });

    return set;
  }, [allRecordings]);

  // -------------------------------------------------------------
  // 2. DYNAMIC PROGRESS CALCULATION: 신약 통독 진행 현황 (사용자 실제 낭독 기준)
  // -------------------------------------------------------------
  const ntCategories = useMemo(() => {
    let gospelCount = 0;
    let actsCount = 0;
    let paulineCount = 0;
    let generalCount = 0;

    allUserCompletedChapters.forEach((key) => {
      const book = key.split('-')[0];
      if (NT_GOSPELS.includes(book)) gospelCount++;
      else if (NT_ACTS.includes(book)) actsCount++;
      else if (NT_PAULINE.includes(book)) paulineCount++;
      else if (NT_GENERAL.includes(book)) generalCount++;
    });

    const totalDone = gospelCount + actsCount + paulineCount + generalCount;
    const totalChapters = 260;

    return [
      {
        name: '사복음서',
        completed: gospelCount,
        total: 89,
        percent: Math.min(100, Math.round((gospelCount / 89) * 100)),
        barColor: '#3B82F6',
      },
      {
        name: '사도행전',
        completed: actsCount,
        total: 28,
        percent: Math.min(100, Math.round((actsCount / 28) * 100)),
        barColor: '#06B6D4',
      },
      {
        name: '바울서신',
        completed: paulineCount,
        total: 100,
        percent: Math.min(100, Math.round((paulineCount / 100) * 100)),
        barColor: '#8B5CF6',
      },
      {
        name: '공동서신',
        completed: generalCount,
        total: 43,
        percent: Math.min(100, Math.round((generalCount / 43) * 100)),
        barColor: '#EC4899',
      },
      {
        name: '신약전체',
        completed: totalDone,
        total: totalChapters,
        percent: Math.min(100, Math.round((totalDone / totalChapters) * 100)),
        barColor: '#0284C7',
      },
    ];
  }, [allUserCompletedChapters]);

  // -------------------------------------------------------------
  // 3. DYNAMIC PROGRESS CALCULATION: 구약 통독 진행 현황 (사용자 실제 낭독 기준)
  // -------------------------------------------------------------
  const otCategories = useMemo(() => {
    let pentCount = 0;
    let histCount = 0;
    let poetCount = 0;
    let majorCount = 0;
    let minorCount = 0;

    allUserCompletedChapters.forEach((key) => {
      const book = key.split('-')[0];
      if (OT_PENTATEUCH.includes(book)) pentCount++;
      else if (OT_HISTORY.includes(book)) histCount++;
      else if (OT_POETRY.includes(book)) poetCount++;
      else if (OT_MAJOR_PROPHETS.includes(book)) majorCount++;
      else if (OT_MINOR_PROPHETS.includes(book)) minorCount++;
    });

    const totalDone = pentCount + histCount + poetCount + majorCount + minorCount;
    const totalChapters = 929;

    return [
      {
        name: '모세오경',
        completed: pentCount,
        total: 187,
        percent: Math.min(100, Math.round((pentCount / 187) * 100)),
        barColor: '#F59E0B',
      },
      {
        name: '역사서',
        completed: histCount,
        total: 249,
        percent: Math.min(100, Math.round((histCount / 249) * 100)),
        barColor: '#10B981',
      },
      {
        name: '시가서',
        completed: poetCount,
        total: 243,
        percent: Math.min(100, Math.round((poetCount / 243) * 100)),
        barColor: '#3B82F6',
      },
      {
        name: '대선지서',
        completed: majorCount,
        total: 183,
        percent: Math.min(100, Math.round((majorCount / 183) * 100)),
        barColor: '#8B5CF6',
      },
      {
        name: '소선지서',
        completed: minorCount,
        total: 67,
        percent: Math.min(100, Math.round((minorCount / 67) * 100)),
        barColor: '#EC4899',
      },
      {
        name: '구약전체',
        completed: totalDone,
        total: totalChapters,
        percent: Math.min(100, Math.round((totalDone / totalChapters) * 100)),
        barColor: '#D97706',
      },
    ];
  }, [allUserCompletedChapters]);

  const activeCategories = progressTestament === 'NT' ? ntCategories : otCategories;
  const currentTotalDone = activeCategories[activeCategories.length - 1].completed;
  const currentTotalCount = activeCategories[activeCategories.length - 1].total;
  const currentTotalPercent = activeCategories[activeCategories.length - 1].percent;
  const currentRemaining = Math.max(0, currentTotalCount - currentTotalDone);

  // Top Card Stats (Accurate user completed counts)
  const actualNtDone = ntCategories[4].completed;
  const actualNtPercent = ntCategories[4].percent;
  const actualOtDone = otCategories[5].completed;
  const actualOtPercent = otCategories[5].percent;

  // -------------------------------------------------------------
  // 4. DYNAMIC WEEKLY ACTIVITY CALCULATION (사용자 실제 낭독/통독 기준)
  // -------------------------------------------------------------
  const weeklyData = useMemo(() => {
    const dayOfWeek = now.getDay();
    const distToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distToMonday);
    monday.setHours(0, 0, 0, 0);

    return ['월', '화', '수', '목', '금', '토', '일'].map((dayName, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dotDate = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      const dashDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isToday = d.toDateString() === now.toDateString();

      // Count chapters recorded on that date
      let count = 0;
      allRecordings.forEach((r) => {
        const rDateClean = (r.date || '').replace(/\./g, '-');
        if (rDateClean === dashDate || r.date === dotDate || r.date === dashDate) {
          const chs = extractChaptersFromRec(r);
          count += Math.max(1, chs.length);
        }
      });

      // If today, also incorporate today's read chapters
      if (isToday) {
        count = Math.max(count, todayReadCount);
      }

      return {
        day: dayName,
        count,
        isGoal: count >= 3,
        dateStr: dotDate,
        isToday,
      };
    });
  }, [now, allRecordings, todayReadCount]);

  const weeklyTotal = useMemo(() => {
    return weeklyData.reduce((acc, cur) => acc + cur.count, 0);
  }, [weeklyData]);

  const elapsedDaysThisWeek = Math.max(1, ((now.getDay() + 6) % 7) + 1);
  const weeklyAverage = (weeklyTotal / elapsedDaysThisWeek).toFixed(1);
  const maxWeeklyCount = Math.max(6, Math.max(...weeklyData.map((d) => d.count)) + 1);

  // -------------------------------------------------------------
  // 5. DYNAMIC MONTHLY ANALYSIS CALCULATION (사용자 실제 낭독/통독 기준)
  // -------------------------------------------------------------
  const currentMonthNum = now.getMonth() + 1;
  const currentYearNum = now.getFullYear();

  // Monthly stats for current month
  const currentMonthChapters = useMemo(() => {
    const prefixDot = `${currentYearNum}.${String(currentMonthNum).padStart(2, '0')}.`;
    const prefixDash = `${currentYearNum}-${String(currentMonthNum).padStart(2, '0')}-`;
    let count = 0;
    allRecordings.forEach((r) => {
      if (r.date && (r.date.startsWith(prefixDot) || r.date.startsWith(prefixDash))) {
        const chs = extractChaptersFromRec(r);
        count += Math.max(1, chs.length);
      }
    });
    return Math.max(count, todayReadCount);
  }, [currentYearNum, currentMonthNum, allRecordings, todayReadCount]);

  const monthlyTarget = 30; // 1 month goal (1 chapter per day)
  const monthlyGoalPercent = Math.round((currentMonthChapters / monthlyTarget) * 100);

  // Monthly attendance days count
  const daysInCurrentMonth = new Date(currentYearNum, currentMonthNum, 0).getDate();
  const currentMonthAttendedCount = attendedDays.filter((d) => d <= daysInCurrentMonth).length;
  const monthlyAttendanceRate = Math.min(
    100,
    Math.round((currentMonthAttendedCount / Math.max(1, now.getDate())) * 100)
  );

  // Recent 5 months trend (calculated from user's actual recordings)
  const monthlyData = useMemo(() => {
    return [4, 3, 2, 1, 0].map((offset) => {
      const d = new Date(currentYearNum, now.getMonth() - offset, 1);
      const mYear = d.getFullYear();
      const mMonth = d.getMonth() + 1;
      const isCurrent = offset === 0;
      const monthLabel = isCurrent ? `${mMonth}월(현재)` : `${mMonth}월`;
      const prefixDot = `${mYear}.${String(mMonth).padStart(2, '0')}.`;
      const prefixDash = `${mYear}-${String(mMonth).padStart(2, '0')}-`;

      let count = 0;
      allRecordings.forEach((r) => {
        if (r.date && (r.date.startsWith(prefixDot) || r.date.startsWith(prefixDash))) {
          const chs = extractChaptersFromRec(r);
          count += Math.max(1, chs.length);
        }
      });

      if (isCurrent) {
        count = Math.max(count, currentMonthChapters);
      }

      return {
        month: monthLabel,
        count,
        target: monthlyTarget,
        isCurrent,
        growth: count > 0 ? `+${count}장` : '0장',
      };
    });
  }, [currentYearNum, now, allRecordings, currentMonthChapters, monthlyTarget]);

  // Max value for monthly chart Y-axis
  const maxMonthlyVal = Math.max(30, Math.max(...monthlyData.map((m) => m.count)) + 5);

  // Play audio function (IndexedDB에서 영구 복원 지원)
  const togglePlayAudio = async (rec: UserRecording) => {
    if (playingId === rec.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    setPlayingId(rec.id);

    let streamUrl = rec.audioBlobUrl;
    // 새로고침 등으로 Blob URL이 만료된 경우 IndexedDB에서 영구 보관된 MP3 복원
    try {
      const storedBlob = await getAudioFromStorage(rec.id);
      if (storedBlob && storedBlob.size > 0) {
        streamUrl = URL.createObjectURL(storedBlob);
      }
    } catch (e) {}

    if (streamUrl) {
      const audio = new Audio(streamUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        setPlayingId(null);
      };
      audio.play().catch(() => {
        setPlayingId(null);
      });
    } else {
      setTimeout(() => setPlayingId(null), 3000);
    }
  };

  // Open Share Modal
  const handleOpenShare = (rec: UserRecording) => {
    setShareData({
      title: rec.title,
      verseRef: rec.verseRef,
      duration: rec.duration,
      date: rec.date,
      audioUrl: rec.audioBlobUrl,
    });
  };

  // Delete recording
  const handleDelete = (id: string) => {
    if (confirm('이 낭독 녹음 파일을 삭제하시겠습니까?')) {
      deleteUserRecordingFromStore(id);
      deleteAudioFromStorage(id).catch(() => {});
      onDeleteRecording(id);
      setAllRecordings((prev) => prev.filter((r) => r.id !== id));
      if (playingId === id) {
        if (audioPlayerRef.current) audioPlayerRef.current.pause();
        setPlayingId(null);
      }
    }
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="flex-1 overflow-y-auto smooth-scroll no-scrollbar bg-[#f8fafc] pb-24 text-slate-800 p-3.5 sm:p-4 space-y-4">
      {/* 1. Top Cards: 신약 & 구약 통독 진행률 (현재 사용자의 실제 낭독/완독 기준) */}
      <div className="grid grid-cols-2 gap-3">
        {/* 신약 성경 통독 카드 */}
        <div
          onClick={() => {
            setActiveTab('progress');
            setProgressTestament('NT');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-soft ${
            progressTestament === 'NT' && activeTab === 'progress'
              ? 'bg-blue-50/50 border-[#0083e3] ring-1 ring-[#0083e3]/30'
              : 'bg-white border-slate-100 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-bold text-slate-800">신약 성경 통독</span>
            <span className="font-black text-[#0083e3]">{actualNtPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-2">
            <div
              className="bg-[#0083e3] h-full rounded-full transition-all duration-500"
              style={{ width: `${actualNtPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            <strong>{actualNtDone}</strong> / 260장 완료
          </p>
        </div>

        {/* 구약 성경 통독 카드 */}
        <div
          onClick={() => {
            setActiveTab('progress');
            setProgressTestament('OT');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-soft ${
            progressTestament === 'OT' && activeTab === 'progress'
              ? 'bg-amber-50/50 border-amber-500 ring-1 ring-amber-500/30'
              : 'bg-white border-slate-100 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-bold text-slate-800">구약 성경 통독</span>
            <span className="font-black text-amber-600">{actualOtPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-2">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${actualOtPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            <strong>{actualOtDone}</strong> / 929장 완료
          </p>
        </div>
      </div>

      {/* 2. Main Tabbed Card (진행률 | 주간 | 월간 추이) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-soft space-y-4">
        {/* Card Header & 3-Tab Switcher */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#0083e3] flex items-center justify-center shadow-xs flex-shrink-0">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                {activeTab === 'progress' && (
                  <>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      {progressTestament === 'NT' ? '신약 통독 진행 현황' : '구약 통독 진행 현황'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      사용자 낭독·통독 기준 {currentTotalPercent}% ({currentTotalDone}/{currentTotalCount}장)
                    </p>
                  </>
                )}
                {activeTab === 'weekly' && (
                  <>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      주간 통독 활동량
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      이번 주 누적 {weeklyTotal}장 완료 (일 평균 {weeklyAverage}장)
                    </p>
                  </>
                )}
                {activeTab === 'monthly' && (
                  <>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      월간 통독 분석
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {currentMonthNum}월 누적 {currentMonthChapters}장 완독
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* In progress tab: NT / OT Quick Switcher Toggle */}
            {activeTab === 'progress' && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl text-[11px] font-bold flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setProgressTestament('NT')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    progressTestament === 'NT'
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  신약
                </button>
                <button
                  type="button"
                  onClick={() => setProgressTestament('OT')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    progressTestament === 'OT'
                      ? 'bg-amber-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  구약
                </button>
              </div>
            )}
          </div>

          {/* 3-Tab Switcher: [ 진행률 ] [ 주간 ] [ 월간 추이 ] */}
          <div className="grid grid-cols-3 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('progress')}
              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'progress'
                  ? 'bg-white text-[#0083e3] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              진행률
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('weekly')}
              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'weekly'
                  ? 'bg-white text-[#0083e3] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              주간
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'monthly'
                  ? 'bg-white text-[#0083e3] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              월간 추이
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: 진행률 (사용자가 실제 낭독한 기준 가로 막대 그래프)  */}
        {/* ======================================================== */}
        {activeTab === 'progress' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header progress card (실제 낭독 데이터 기반) */}
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <TrendingUp className="w-4 h-4 text-[#0083e3] flex-shrink-0" />
                <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  {progressTestament === 'NT' ? '신약' : '구약'} {currentTotalCount}장 중{' '}
                  <strong className="text-[#0083e3]">{currentTotalDone}장</strong> 완독
                </span>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white font-extrabold text-[11px] rounded-full flex-shrink-0 shadow-2xs">
                전체 {currentTotalPercent}% 달성
              </span>
            </div>

            {/* Horizontal Bar Chart for Bible Categories (100% 실시간 낭독 연동) */}
            <div className="space-y-3.5 pt-2">
              {activeCategories.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="w-20 font-extrabold text-slate-800 text-[13px] truncate">
                      {cat.name}
                    </span>
                    <div className="flex-1 ml-2">
                      <div className="w-full bg-slate-100 h-6 rounded-xl overflow-hidden relative">
                        <div
                          className="h-full rounded-xl transition-all duration-500 flex items-center justify-end pr-2 text-[10px] text-white font-black"
                          style={{
                            width: `${Math.max(cat.completed > 0 ? 8 : 0, cat.percent)}%`,
                            backgroundColor: cat.barColor,
                          }}
                        >
                          {cat.percent > 12 ? `${cat.percent}%` : ''}
                        </div>
                        {cat.percent <= 12 && (
                          <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-bold text-slate-500">
                            {cat.completed > 0 ? `${cat.percent}%` : '0%'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="w-16 text-right text-[11px] text-slate-500 font-mono flex-shrink-0 ml-2">
                      {cat.completed}/{cat.total}장
                    </span>
                  </div>
                </div>
              ))}

              {/* X-Axis Scale: 0% 25% 50% 75% 100% */}
              <div className="flex items-center justify-between pl-22 pr-18 pt-1 text-[10px] text-slate-400 font-mono">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Bottom notice card (실제 잔여 장수) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
              <p className="text-xs font-extrabold text-slate-700">
                {progressTestament === 'NT' ? '신약' : '구약'} 통독 목표 달성까지 앞으로{' '}
                <strong className="text-[#0083e3]">{currentRemaining}장</strong> 남았습니다
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: 주간 통독 활동량 (사용자 실제 낭독 기준)             */}
        {/* ======================================================== */}
        {activeTab === 'weekly' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Summary Row */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2 truncate">
                <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-slate-700 font-bold truncate">
                  이번 주 누적: <strong className="text-slate-900 font-black">{weeklyTotal}장</strong>
                  <span className="text-slate-300 mx-1.5">|</span>
                  일 평균: <strong className="text-slate-900 font-black">{weeklyAverage}장</strong>
                </span>
              </div>
              <span
                className={`px-2 py-0.5 text-[11px] font-black rounded-full flex-shrink-0 ${
                  weeklyTotal >= elapsedDaysThisWeek * 3
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {weeklyTotal >= elapsedDaysThisWeek * 3 ? '목표 달성' : '통독 진행 중'}
              </span>
            </div>

            {/* Weekly Bar Chart (실제 사용자 기록 반영) */}
            <div className="relative pt-6 pb-2">
              {/* Y Axis Grid lines */}
              <div className="h-44 flex flex-col justify-between absolute inset-x-0 top-6 bottom-8 pointer-events-none">
                {[maxWeeklyCount, Math.round(maxWeeklyCount * 0.66), 3, Math.round(maxWeeklyCount * 0.33), 0].map(
                  (val, i) => (
                    <div key={i} className="flex items-center gap-2 w-full">
                      <span className="text-[10px] text-slate-400 font-mono w-4 text-right">
                        {val === 3 ? '' : val}
                      </span>
                      <div
                        className={`flex-1 border-b ${
                          val === 3 ? 'border-amber-300 border-dashed' : 'border-slate-100'
                        }`}
                      />
                    </div>
                  )
                )}
              </div>

              {/* Dotted Goal Indicator */}
              <div className="absolute top-[82px] right-2 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                일일 목표 3장
              </div>

              {/* Bars */}
              <div className="h-44 pl-6 pr-2 flex items-end justify-between gap-2 relative z-10">
                {weeklyData.map((item, idx) => {
                  const heightPercent = Math.min(100, Math.round((item.count / maxWeeklyCount) * 100));
                  const isSelected = selectedDayIndex === idx;
                  const isGoalMet = item.count >= 3;

                  return (
                    <div
                      key={item.day}
                      onClick={() => setSelectedDayIndex(idx)}
                      className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                    >
                      {/* Count pill */}
                      <span
                        className={`text-[10px] font-black mb-1 transition-all ${
                          isSelected
                            ? 'text-[#0083e3] scale-110'
                            : 'text-slate-400 opacity-80 group-hover:opacity-100'
                        }`}
                      >
                        {item.count}장
                      </span>

                      {/* Bar Pillar */}
                      <div className="w-full max-w-[28px] h-full flex items-end">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-300 ${
                            isGoalMet
                              ? 'bg-[#0083e3] group-hover:bg-blue-600 shadow-sm'
                              : item.count > 0
                              ? 'bg-blue-300 group-hover:bg-blue-400'
                              : 'bg-slate-200/60'
                          } ${isSelected ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                          style={{ height: `${Math.max(item.count > 0 ? 10 : 4, heightPercent)}%` }}
                        />
                      </div>

                      {/* Day Label */}
                      <span
                        className={`text-xs font-bold mt-2 transition-colors ${
                          item.isToday
                            ? 'text-[#0083e3] font-black underline underline-offset-2'
                            : isSelected
                            ? 'text-slate-900 font-bold'
                            : 'text-slate-600'
                        }`}
                      >
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Tip */}
            <p className="text-[11px] text-slate-500 text-center font-medium pt-1">
              💡 사용자가 성경 본문을 낭독하거나 통독할 때마다 요일별 막대에 실시간 자동 반영됩니다.
            </p>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: 월간 추이 (월간 통독 분석 - 실제 데이터 반영)         */}
        {/* ======================================================== */}
        {activeTab === 'monthly' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 3 Summary Stat Cards (실제 데이터 반영) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              {/* Card 1: 이번 달 총 완독 */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                <p className="text-[10.5px] text-slate-500 font-bold truncate">{currentMonthNum}월 총 완독</p>
                <p className="text-base sm:text-lg font-black text-slate-900 my-1">
                  {currentMonthChapters}장
                </p>
                <p className="text-[10.5px] font-black text-emerald-600">
                  목표 {monthlyGoalPercent}%
                </p>
              </div>

              {/* Card 2: 전월 대비 성장 */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                <p className="text-[10.5px] text-slate-500 font-bold truncate">전월 대비 성장</p>
                <p className="text-base sm:text-lg font-black text-[#0083e3] my-1">
                  +{currentMonthChapters}장
                </p>
                <p className="text-[10.5px] font-black text-[#0083e3] truncate">낭독 기록 반영</p>
              </div>

              {/* Card 3: 월간 통독 일수 */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                <p className="text-[10.5px] text-slate-500 font-bold truncate">월간 통독 일수</p>
                <p className="text-base sm:text-lg font-black text-amber-600 my-1">
                  {currentMonthAttendedCount}일/{daysInCurrentMonth}일
                </p>
                <p className="text-[10.5px] font-black text-amber-600 truncate">
                  실천율 {monthlyAttendanceRate}%
                </p>
              </div>
            </div>

            {/* Sub-header: 최근 5개월 통독량 추이 & sub-tabs */}
            <div className="flex items-center justify-between pt-2">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#0083e3]" />
                <span>최근 5개월 통독량 추이</span>
              </h4>

              <div className="flex items-center gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setMonthlySubTab('monthly')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    monthlySubTab === 'monthly'
                      ? 'bg-blue-50 text-[#0083e3] border border-blue-200 font-extrabold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  월별 비교
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlySubTab('weekly')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    monthlySubTab === 'weekly'
                      ? 'bg-blue-50 text-[#0083e3] border border-blue-200 font-extrabold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  주차별 추이
                </button>
              </div>
            </div>

            {/* 5-Month Bar & Line Graph Area */}
            <div className="relative pt-6 pb-2">
              {/* Y Axis Grid lines */}
              <div className="h-48 flex flex-col justify-between absolute inset-x-0 top-6 bottom-8 pointer-events-none">
                {[maxMonthlyVal, Math.round(maxMonthlyVal * 0.75), Math.round(maxMonthlyVal * 0.5), Math.round(maxMonthlyVal * 0.25), 0].map(
                  (val, i) => (
                    <div key={i} className="flex items-center gap-2 w-full">
                      <span className="text-[10px] text-slate-400 font-mono w-5 text-right">{val}</span>
                      <div className="flex-1 border-b border-slate-100" />
                    </div>
                  )
                )}
              </div>

              {/* Tooltip Card over Selected Month */}
              {selectedMonthIndex !== null && monthlyData[selectedMonthIndex] && (
                <div className="absolute top-2 right-4 z-20 w-44 bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700/80 text-[11px] space-y-1 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-700/60">
                    <span className="font-extrabold text-white">
                      {monthlyData[selectedMonthIndex].month}
                    </span>
                    <span className="text-[9px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                      {monthlyData[selectedMonthIndex].isCurrent ? '이번 달' : '과거 기록'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>완독 장수:</span>
                    <strong className="text-white font-black">
                      {monthlyData[selectedMonthIndex].count}장
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>목표량:</span>
                    <span className="text-slate-400">
                      {monthlyData[selectedMonthIndex].target}장
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>목표 달성률:</span>
                    <span className="text-emerald-400 font-extrabold">
                      {Math.round((monthlyData[selectedMonthIndex].count / monthlyData[selectedMonthIndex].target) * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Bars */}
              <div className="h-48 pl-7 pr-2 flex items-end justify-between gap-3 relative z-10">
                {monthlyData.map((item, idx) => {
                  const heightPercent = Math.min(100, Math.round((item.count / maxMonthlyVal) * 100));
                  const isCurrent = item.isCurrent;

                  return (
                    <div
                      key={item.month}
                      onClick={() => setSelectedMonthIndex(idx)}
                      className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                    >
                      {/* Bar Pillar */}
                      <div className="w-full max-w-[32px] h-full flex items-end">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-300 relative ${
                            isCurrent
                              ? 'bg-[#0083e3] shadow-md ring-2 ring-blue-400/50'
                              : item.count > 0
                              ? 'bg-blue-300 hover:bg-blue-400'
                              : 'bg-slate-200/60'
                          }`}
                          style={{ height: `${Math.max(item.count > 0 ? 12 : 4, heightPercent)}%` }}
                        >
                          <div
                            className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white ${
                              isCurrent ? 'bg-blue-600' : item.count > 0 ? 'bg-blue-400' : 'bg-slate-300'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Month Label */}
                      <span
                        className={`text-[11px] font-bold mt-2.5 transition-colors truncate max-w-full text-center ${
                          isCurrent ? 'text-[#0083e3] font-black' : 'text-slate-600'
                        }`}
                      >
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-3 h-3 rounded-sm bg-[#0083e3]" />
                  <span>이번 달</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <span className="w-3 h-3 rounded-sm bg-blue-300" />
                  <span>이전 월</span>
                </span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black text-[11px] rounded-full border border-emerald-200 flex items-center gap-1">
                <span>실제 낭독 기록 연동</span>
                <span>✨</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. 일일 통독 현황 (사용자 실제 접속 및 낭독한 날짜 표시) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs sm:text-sm font-black text-slate-800">
              {currentMonthNum}월 일일 통독 현황
            </h3>
          </div>
          <span className="text-xs text-emerald-600 font-black flex items-center gap-1">
            <span>{attendedDays.length}일 통독 달성</span>
            <span>💐</span>
          </span>
        </div>

        {/* Weekday headers: 일 월 화 수 목 금 토 */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {weekDays.map((w, idx) => (
            <span
              key={w}
              className={`text-[11px] font-bold ${
                idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-blue-500' : 'text-slate-400'
              }`}
            >
              {w}
            </span>
          ))}

          {/* Days pills with green dot under attended days */}
          {attendedDays.map((day) => (
            <div
              key={day}
              onClick={() => {
                setToastMsg(`${currentMonthNum}월 ${day}일: 말씀 통독 & 묵상 출석 완료 ✨`);
                setTimeout(() => setToastMsg(null), 2500);
              }}
              className="p-2 rounded-2xl bg-blue-50/90 border border-blue-200/80 text-[#0083e3] font-black flex flex-col items-center justify-center relative cursor-pointer active:scale-95 hover:bg-blue-100/60 transition shadow-2xs"
            >
              <span className="text-[12px]">{day}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shadow-xs" />
            </div>
          ))}
        </div>

        {toastMsg && (
          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-bold animate-in fade-in">
            {toastMsg}
          </div>
        )}
      </div>

      {/* 4. 나의 낭독 녹음 보관함 (사용자가 낭독한 실제 음원 파일 목록) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-black text-slate-800">나의 낭독 녹음 보관함</h3>
          </div>
          <span className="text-xs font-black text-[#0083e3]">
            {allRecordings.length}편 저장됨
          </span>
        </div>

        {allRecordings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-2">
            <p>아직 녹음된 파일이 없습니다.</p>
            {onNavigateToRecord && (
              <button
                type="button"
                onClick={onNavigateToRecord}
                className="px-3.5 py-1.5 bg-[#0083e3] text-white font-bold rounded-xl text-xs hover:bg-blue-600 transition cursor-pointer"
              >
                🎙️ 말씀 낭독 녹음하러 가기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {allRecordings.map((rec) => {
              const isPlaying = playingId === rec.id;
              return (
                <div
                  key={rec.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between transition hover:bg-slate-100/70 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Blue circular Play button */}
                    <button
                      type="button"
                      onClick={() => togglePlayAudio(rec)}
                      className="w-9 h-9 rounded-full bg-[#0083e3] hover:bg-blue-600 active:scale-95 text-white flex items-center justify-center transition cursor-pointer shadow-xs flex-shrink-0"
                      title={isPlaying ? '일시정지' : '재생'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {rec.title}
                        </h4>
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-extrabold flex-shrink-0">
                          MP3
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                        <strong className="text-slate-700">{rec.verseRef}</strong> · {rec.duration} · {rec.date}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Share & Delete */}
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => handleOpenShare(rec)}
                      className="p-1.5 text-[#0083e3] hover:bg-blue-100/80 rounded-xl transition cursor-pointer"
                      title="텔레그램 / 과제제출방 공유"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rec.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="삭제"
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
