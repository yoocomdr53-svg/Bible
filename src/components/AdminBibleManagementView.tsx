import React, { useState } from 'react';
import {
  ChevronLeft,
  Users,
  BookOpen,
  Award,
  Search,
  Filter,
  Calendar,
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  Mic,
  Crown,
  ChevronRight,
  Plus,
  RefreshCw,
  Star,
  FileText,
  Sparkles,
  Share2,
  X,
  SlidersHorizontal,
  Flame,
  Check,
  Phone,
  Mail,
  Shield,
  Layers,
} from 'lucide-react';
import { User } from '../types';
import { BIBLE_BOOKS } from '../data/bibleData';
import {
  MemberReadingProfile,
  MemberRecordingItem,
  ReadingCampaign,
  INITIAL_MEMBERS,
  INITIAL_MEMBER_RECORDINGS,
  INITIAL_CAMPAIGNS,
} from '../data/adminData';

interface AdminBibleManagementViewProps {
  user?: User;
  onBack: () => void;
  onNavigateToBible?: (book: string, chapter?: number, verse?: number) => void;
}

export const AdminBibleManagementView: React.FC<AdminBibleManagementViewProps> = ({
  user,
  onBack,
  onNavigateToBible,
}) => {
  // Navigation Sub-tabs: 'overview' | 'members' | 'recordings' | 'campaigns' | 'reports'
  const [adminTab, setAdminTab] = useState<'overview' | 'members' | 'recordings' | 'campaigns' | 'reports'>('overview');

  // Members state
  const [members, setMembers] = useState<MemberReadingProfile[]>(INITIAL_MEMBERS);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('전체');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('전체');
  const [selectedMember, setSelectedMember] = useState<MemberReadingProfile | null>(null);

  // Recordings state
  const [recordings, setRecordings] = useState<MemberRecordingItem[]>(INITIAL_MEMBER_RECORDINGS);
  const [playingRecId, setPlayingRecId] = useState<string | null>(null);
  const [feedbackModalRec, setFeedbackModalRec] = useState<MemberRecordingItem | null>(null);
  const [feedbackInput, setFeedbackInput] = useState('');

  // Campaigns state
  const [campaigns, setCampaigns] = useState<ReadingCampaign[]>(INITIAL_CAMPAIGNS);
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampScope, setNewCampScope] = useState('성경 66권 12독');

  // Manual Progress Adjustment Modal
  const [progressAdjustMember, setProgressAdjustMember] = useState<MemberReadingProfile | null>(null);
  const [adjustBook, setAdjustBook] = useState('창세기');
  const [adjustChapter, setAdjustChapter] = useState(1);
  const [adjustReason, setAdjustReason] = useState('가정예배 통독 인정');

  // Encouragement Notification Modal
  const [encourageMember, setEncourageMember] = useState<MemberReadingProfile | null>(null);
  const [encourageMsg, setEncourageMsg] = useState('오늘도 말씀 안에서 승리하시길 기도합니다! 성경 낭독을 응원합니다. ✨');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Certificate Modal
  const [certMember, setCertMember] = useState<MemberReadingProfile | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered members calculation
  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.name.includes(memberSearch) ||
      m.department.includes(memberSearch) ||
      m.role.includes(memberSearch) ||
      m.currentBook.includes(memberSearch);

    const matchDept = selectedDeptFilter === '전체' || m.department === selectedDeptFilter;

    let matchStatus = true;
    if (selectedStatusFilter === 'excellent') matchStatus = m.status === 'excellent';
    else if (selectedStatusFilter === 'warning') matchStatus = m.status === 'warning';
    else if (selectedStatusFilter === 'completed') matchStatus = m.currentReadingRound >= 12;
    else if (selectedStatusFilter === 'active') matchStatus = m.status === 'active' || m.status === 'excellent';

    return matchSearch && matchDept && matchStatus;
  });

  // KPI aggregates
  const totalMembersCount = members.length;
  const activeTodayCount = members.filter((m) => m.lastActive.includes('오늘') || m.lastActive.includes('방금')).length;
  const completed12Count = members.filter((m) => m.currentReadingRound >= 12).length;
  const totalRecordingsSum = members.reduce((sum, m) => sum + m.recordingsCount, 0);

  // Toggle Featured Recording
  const handleToggleFeatured = (recId: string) => {
    setRecordings((prev) =>
      prev.map((r) => {
        if (r.id === recId) {
          const next = !r.isFeatured;
          showToast(next ? `'${r.title}' 베스트 추천 낭독으로 선정되었습니다 ⭐` : '추천 선정이 해제되었습니다.');
          return { ...r, isFeatured: next };
        }
        return r;
      })
    );
  };

  // Submit Feedback on recording
  const handleSaveFeedback = () => {
    if (!feedbackModalRec) return;
    setRecordings((prev) =>
      prev.map((r) => (r.id === feedbackModalRec.id ? { ...r, feedback: feedbackInput, status: 'approved' } : r))
    );
    showToast(`${feedbackModalRec.memberName}님 낭독에 피드백이 등록되었습니다.`);
    setFeedbackModalRec(null);
    setFeedbackInput('');
  };

  // Approve manual reading completion
  const handleApproveProgress = () => {
    if (!progressAdjustMember) return;
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === progressAdjustMember.id) {
          const nextRead = Math.min(1189, m.totalReadChapters + 1);
          return {
            ...m,
            totalReadChapters: nextRead,
            currentBook: adjustBook,
            currentChapter: adjustChapter,
            lastActive: '방금 전 (관리자 승인)',
            memo: `${m.memo || ''} [관리자 승인: ${adjustBook} ${adjustChapter}장 - ${adjustReason}]`,
          };
        }
        return m;
      })
    );
    showToast(`${progressAdjustMember.name}님의 ${adjustBook} ${adjustChapter}장 완독이 승인 반영되었습니다.`);
    setProgressAdjustMember(null);
  };

  // Send encouragement message
  const handleSendEncouragement = () => {
    if (!encourageMember) return;
    showToast(`${encourageMember.name} ${encourageMember.role}님께 격려 메시지가 전송되었습니다! 💌`);
    setEncourageMember(null);
  };

  // Bulk encouragement
  const handleBulkEncouragement = () => {
    showToast('독려가 필요한 회원 2명에게 격려 알림(Push)이 일괄 발송되었습니다!');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['회원번호', '이름', '소속부서', '직분', '전화번호', '현재통독회차', '현재성경', '현재장', '완독장수', '녹음수', '최근활동', '연속낭독일'];
    const rows = members.map((m) => [
      m.id,
      m.name,
      m.department,
      m.role,
      m.phone,
      `${m.currentReadingRound}독`,
      m.currentBook,
      `${m.currentChapter}장`,
      `${m.totalReadChapters}/1189장`,
      `${m.recordingsCount}건`,
      m.lastActive,
      `${m.consecutiveDays}일`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `수퍼바이블_회원성경낭독관리_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('전체 회원 성경낭독 진도표 엑셀(CSV)이 다운로드되었습니다.');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] relative overflow-hidden select-none text-slate-800">
      {/* 1. Header Bar: Deep Blue Admin Style */}
      <header className="bg-[#0f172a] text-white px-3.5 py-3 flex items-center justify-between shadow-md z-30 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="p-1 -ml-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="돌아가기"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
              👑
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5 leading-none">
                <span>관리자 성경관리</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600/90 text-blue-100">
                  ERP 연동
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">회원 성경낭독 및 12목표 통합 관리 시스템</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs transition cursor-pointer active:scale-95"
            title="회원 진도표 CSV 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">엑셀 내보내기</span>
          </button>
        </div>
      </header>

      {/* 2. Admin 5-Tab Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-2 py-1.5 flex items-center justify-between overflow-x-auto no-scrollbar flex-shrink-0 z-20">
        <button
          type="button"
          onClick={() => setAdminTab('overview')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'overview'
              ? 'bg-[#1b64b9] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>📊</span>
          <span>대시보드</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('members')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'members'
              ? 'bg-[#1b64b9] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>👥</span>
          <span>회원 낭독 관리 ({members.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('recordings')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'recordings'
              ? 'bg-[#1b64b9] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>🎙️</span>
          <span>낭독 음원 검수</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('campaigns')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'campaigns'
              ? 'bg-[#1b64b9] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>🎯</span>
          <span>통독 캠페인</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('reports')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'reports'
              ? 'bg-[#1b64b9] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>📜</span>
          <span>수료증 & 보고서</span>
        </button>
      </nav>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-3.5 sm:p-4 pb-24 space-y-4">
        {/* ========================================================
            TAB 1: 종합 대시보드 (Overview)
           ======================================================== */}
        {adminTab === 'overview' && (
          <div className="space-y-4">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>총 등록 회원</span>
                  <span className="p-1.5 rounded-lg bg-blue-50 text-[#1b64b9]">👥</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-900">{totalMembersCount}</span>
                  <span className="text-xs text-slate-500 font-bold">명</span>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">↑ 전월 대비 +12명</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>오늘 낭독 참여</span>
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">📖</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-emerald-600">{activeTodayCount}</span>
                  <span className="text-xs text-slate-500 font-bold">명 참여</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold mt-1 inline-block">참여율 27.4%</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>누적 낭독 녹음</span>
                  <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">🎙️</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-purple-700">{totalRecordingsSum}</span>
                  <span className="text-xs text-slate-500 font-bold">건</span>
                </div>
                <span className="text-[10px] text-purple-600 font-bold mt-1 inline-block">추천 낭독 7건</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                  <span>12독 완수자</span>
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">👑</span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-amber-600">{completed12Count}</span>
                  <span className="text-xs text-slate-500 font-bold">명 완수</span>
                </div>
                <span className="text-[10px] text-amber-600 font-bold mt-1 inline-block">영광의 면류관 수여</span>
              </div>
            </div>

            {/* Quick Alert Banner for Slack Members */}
            <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 border border-amber-200 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black flex-shrink-0">
                  ⚠️
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-amber-950 truncate">3일 이상 낭독이 지연된 성도 2명 감지</p>
                  <p className="text-[11px] text-amber-800">따뜻한 말씀 격려 메시지를 보내어 통독 완주를 독려하세요.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleBulkEncouragement}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex-shrink-0 active:scale-95"
              >
                일괄 격려 발송
              </button>
            </div>

            {/* Department Progress Summary */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">부서별 통독 참여 현황</span>
                  <span className="text-[10px] text-slate-400 font-bold">5개 공동체</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdminTab('members')}
                  className="text-xs text-[#1b64b9] font-black hover:underline cursor-pointer"
                >
                  상세 보기 &gt;
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: '청장년 성경통독부', count: 85, progress: 68, color: 'bg-emerald-500' },
                  { name: '교직원선교회', count: 42, progress: 84, color: 'bg-indigo-500' },
                  { name: '주일학교 교사부', count: 38, progress: 72, color: 'bg-purple-500' },
                  { name: '대학청년부', count: 56, progress: 54, color: 'bg-blue-500' },
                  { name: '장년 1교구', count: 27, progress: 45, color: 'bg-amber-500' },
                ].map((dept, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>{dept.name} ({dept.count}명)</span>
                      <span className="font-black text-slate-900">{dept.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`${dept.color} h-full rounded-full transition-all`} style={{ width: `${dept.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Realtime Reading Activity Stream */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">실시간 낭독 및 완독 피드</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">자동 새로고침 중</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {recordings.slice(0, 4).map((rec) => (
                  <div key={rec.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1b64b9] flex items-center justify-center font-black flex-shrink-0 text-xs">
                        {rec.memberName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900">{rec.memberName}</span>
                          <span className="text-[10px] text-slate-400">({rec.department})</span>
                        </div>
                        <p className="text-slate-600 truncate mt-0.5 font-medium">{rec.verseRef} 낭독 완료</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">{rec.date.split(' ')[1] || '오늘'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: 회원 낭독 관리 (Members Table & Detail)
           ======================================================== */}
        {adminTab === 'members' && (
          <div className="space-y-3">
            {/* Search & Multi Filter */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="회원 이름, 부서, 직분, 읽고 있는 성경 검색"
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b64b9]"
                />
              </div>

              {/* Department Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px] font-bold">
                {['전체', '청장년 성경통독부', '대학청년부', '교직원선교회', '주일학교 교사부', '장년 1교구'].map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDeptFilter(dept)}
                    className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                      selectedDeptFilter === dept
                        ? 'bg-[#1b64b9] text-white font-black'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] font-bold">
                <span className="text-slate-400 text-[10px]">상태:</span>
                <div className="flex items-center gap-1">
                  {[
                    { key: '전체', label: '전체보기' },
                    { key: 'excellent', label: '⭐ 우수 참여' },
                    { key: 'warning', label: '⚠️ 독려 필요' },
                    { key: 'completed', label: '👑 12독 완수' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setSelectedStatusFilter(st.key)}
                      className={`px-2 py-0.5 rounded-md transition cursor-pointer text-[10px] ${
                        selectedStatusFilter === st.key
                          ? 'bg-slate-900 text-white font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Member Cards List */}
            <div className="space-y-2.5">
              {filteredMembers.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs">
                  검색 조건과 일치하는 회원이 없습니다.
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const percent = Math.round((member.totalReadChapters / 1189) * 100);

                  return (
                    <div
                      key={member.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs hover:border-blue-400 transition space-y-2.5"
                    >
                      {/* Top line: Avatar + Name + Department + Badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full ${member.avatarColor} text-white flex items-center justify-center font-black text-xs shadow-inner flex-shrink-0`}
                          >
                            {member.avatarText}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-slate-900">{member.name}</span>
                              <span className="text-xs text-slate-500 font-bold">{member.role}</span>
                              {member.currentReadingRound >= 12 && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.2 rounded-md">
                                  👑 12독 완수
                                </span>
                              )}
                              {member.status === 'warning' && (
                                <span className="text-[10px] bg-rose-100 text-rose-700 font-black px-1.5 py-0.2 rounded-md">
                                  ⚠️ 독려필요
                                </span>
                              )}
                              {member.status === 'excellent' && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded-md">
                                  ⭐ 우수
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                              {member.department} · {member.phone}
                            </p>
                          </div>
                        </div>

                        {/* Round pill */}
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-[#1b64b9] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            {member.currentReadingRound}독 / 12독 목표
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{member.lastActive}</p>
                        </div>
                      </div>

                      {/* Middle: Current reading & progress bar */}
                      <div className="bg-slate-50 rounded-xl p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-bold">
                            현재 읽는 말씀:{' '}
                            <strong className="text-slate-900 font-black">
                              {member.currentBook} {member.currentChapter}장
                            </strong>
                          </span>
                          <span className="text-xs font-black text-emerald-700">
                            {member.totalReadChapters} / 1,189장 ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                          <span>연속 통독: <strong>{member.consecutiveDays}일째</strong></span>
                          <span>낭독 녹음: <strong>{member.recordingsCount}건</strong></span>
                        </div>
                      </div>

                      {/* Actions: Member-specific management buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedMember(member)}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer text-center"
                        >
                          📋 상세 진도
                        </button>
                        <button
                          type="button"
                          onClick={() => setProgressAdjustMember(member)}
                          className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1b64b9] text-xs font-black rounded-xl transition cursor-pointer text-center"
                        >
                          ✅ 진도 승인
                        </button>
                        <button
                          type="button"
                          onClick={() => setEncourageMember(member)}
                          className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl transition cursor-pointer text-center"
                        >
                          💬 격려 알림
                        </button>
                        {member.currentReadingRound >= 12 && (
                          <button
                            type="button"
                            onClick={() => setCertMember(member)}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition cursor-pointer text-center shadow-xs"
                            title="12독 완독 수료증 발급"
                          >
                            📜 수료증
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: 낭독 음원 검수 (Audio Recordings Review)
           ======================================================== */}
        {adminTab === 'recordings' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">회원 제출 낭독 음원 심사</h3>
                <p className="text-xs text-slate-400">성도들이 직접 녹음한 은혜로운 성경 낭독을 청취하고 피드백을 전달합니다.</p>
              </div>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-xl text-xs font-black">
                총 {recordings.length}건
              </span>
            </div>

            <div className="space-y-2.5">
              {recordings.map((rec) => {
                const isPlaying = playingRecId === rec.id;

                return (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-purple-300 transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{rec.title}</span>
                        {rec.isFeatured && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full flex items-center gap-0.5">
                            ⭐ 베스트 낭독
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                        {rec.verseRef}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{rec.passageSnippet}"
                    </p>

                    {/* Audio Player Simulated Bar */}
                    <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center justify-between gap-3 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setPlayingRecId(isPlaying ? null : rec.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer flex-shrink-0 ${
                          isPlaying ? 'bg-amber-400 text-slate-950' : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-[11px] text-slate-300 font-bold mb-1">
                          <span className="truncate">{rec.memberName} ({rec.department})</span>
                          <span>{rec.duration}</span>
                        </div>
                        {/* Audio Wave representation */}
                        <div className="w-full h-3 flex items-center gap-0.5">
                          {Array.from({ length: 32 }, (_, i) => {
                            const heights = [20, 45, 80, 60, 90, 40, 70, 30, 85, 100, 50, 75, 95, 30, 60, 80, 20, 50, 85, 70, 95, 40, 65, 30, 90, 80, 50, 70, 40, 60, 30, 50];
                            const h = heights[i % heights.length];
                            return (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-all ${
                                  isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                                }`}
                                style={{ height: `${h}%` }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Feedback displayed if present */}
                    {rec.feedback && (
                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-xs text-emerald-900">
                        <span className="font-black text-emerald-800">관리자 코멘트:</span> {rec.feedback}
                      </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">{rec.date} 등록</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(rec.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                            rec.isFeatured
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${rec.isFeatured ? 'fill-amber-400 text-amber-500' : ''}`} />
                          <span>{rec.isFeatured ? '베스트 해제' : '베스트 선정'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFeedbackModalRec(rec);
                            setFeedbackInput(rec.feedback || '');
                          }}
                          className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-[#1b64b9] text-xs font-bold rounded-lg hover:bg-blue-100 transition cursor-pointer"
                        >
                          코멘트 작성
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: 통독 캠페인 관리 (Campaigns)
           ======================================================== */}
        {adminTab === 'campaigns' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">공동체 통독 캠페인 기획 & 운영</h3>
                <p className="text-xs text-slate-400">교회 전체 또는 부서별 통독 목표를 설정하고 관리합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCampaignModal(true)}
                className="px-3 py-1.5 bg-[#1b64b9] hover:bg-blue-600 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 캠페인</span>
              </button>
            </div>

            <div className="space-y-3">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900">{camp.title}</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          camp.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {camp.isActive ? '진행 중' : '대기 / 종료'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{camp.badgeTag}</span>
                  </div>

                  <p className="text-xs text-slate-600">{camp.description}</p>

                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>목표 범위: <strong className="text-slate-800">{camp.targetScope}</strong></span>
                      <span>참여자: <strong className="text-[#1b64b9] font-black">{camp.participantsCount}명</strong></span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>캠페인 기간: {camp.startDate} ~ {camp.endDate}</span>
                      <span>평균 달성률: <strong className="text-emerald-600 font-black">{camp.avgProgress}%</strong></span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#1b64b9] to-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${camp.avgProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCampaigns((prev) =>
                          prev.map((c) => (c.id === camp.id ? { ...c, isActive: !c.isActive } : c))
                        );
                        showToast(`캠페인 상태가 변경되었습니다.`);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                    >
                      {camp.isActive ? '일시 정지' : '캠페인 시작'}
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast(`'${camp.title}' 참여자 전원에게 오늘의 분량 낭독 알림이 발송되었습니다!`)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1b64b9] text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>참여자 전체 오늘 말씀 발송</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: 수료증 & 보고서 (Reports & Certificates)
           ======================================================== */}
        {adminTab === 'reports' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">통독 완수 증서 및 통계 보고서</h3>
              <p className="text-xs text-slate-500">
                12목표 또는 1독을 완수한 성도님들에게 수여할 수 있는 공인 수료증을 관리하고 인쇄/발송할 수 있습니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-amber-950">👑 12목표 면류관 완수 수료증</span>
                    <span className="text-xs font-black text-amber-700">{completed12Count}명 대상</span>
                  </div>
                  <p className="text-xs text-amber-800">신구약 66권을 12번 완독한 성도님께 수여하는 최고 영예의 증서</p>
                  <button
                    type="button"
                    onClick={() => {
                      const m = members.find((x) => x.currentReadingRound >= 12) || members[0];
                      setCertMember(m);
                    }}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer text-center"
                  >
                    수료증 서식 미리보기 & 발급
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">📊 통합 통독 관리 보고서 (CSV)</span>
                    <span className="text-xs font-bold text-slate-500">실시간 생성</span>
                  </div>
                  <p className="text-xs text-slate-600">출석부, 진도율, 녹음 건수, 부서별 랭킹 데이터 일괄 추출</p>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>엑셀(CSV) 전체 다운로드</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: 회원 상세 진도 모달 (Member Detail Modal)
         ======================================================== */}
      {selectedMember && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMember(null);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="bg-[#0f172a] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-full ${selectedMember.avatarColor} flex items-center justify-center font-black text-sm`}>
                  {selectedMember.avatarText}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{selectedMember.name} {selectedMember.role}</h3>
                  <p className="text-xs text-slate-400">{selectedMember.department} · {selectedMember.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">통독 회차</span>
                  <span className="text-sm font-black text-[#1b64b9]">{selectedMember.currentReadingRound}독 / 12독</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">완독 장수</span>
                  <span className="text-sm font-black text-emerald-600">{selectedMember.totalReadChapters}장</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">낭독 녹음</span>
                  <span className="text-sm font-black text-purple-600">{selectedMember.recordingsCount}건</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5 border border-slate-100">
                <span className="font-black text-slate-900 block text-xs">현재 진행 진도</span>
                <p className="text-slate-600 font-medium">
                  성경 본문: <strong className="text-slate-900">{selectedMember.currentBook} {selectedMember.currentChapter}장</strong>
                </p>
                <p className="text-slate-500 text-[11px]">마지막 활동: {selectedMember.lastActive} (연속 {selectedMember.consecutiveDays}일)</p>
                {selectedMember.memo && (
                  <p className="text-slate-600 text-[11px] bg-white p-2 rounded-lg border border-slate-200 mt-1">
                    📝 관리자 메모: {selectedMember.memo}
                  </p>
                )}
              </div>

              {/* Quick Actions inside Modal */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setProgressAdjustMember(selectedMember);
                    setSelectedMember(null);
                  }}
                  className="flex-1 py-2.5 bg-blue-50 text-[#1b64b9] hover:bg-blue-100 font-black rounded-xl text-center cursor-pointer"
                >
                  진도 수기 승인
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEncourageMember(selectedMember);
                    setSelectedMember(null);
                  }}
                  className="flex-1 py-2.5 bg-amber-50 text-amber-800 hover:bg-amber-100 font-black rounded-xl text-center cursor-pointer"
                >
                  격려 메시지 보내기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: 진도 수기 승인 모달 (Manual Progress Approval)
         ======================================================== */}
      {progressAdjustMember && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setProgressAdjustMember(null);
          }}
        >
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-4 sm:p-5 border border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>✅ 성경 완독 수기 승인</span>
              </h3>
              <button onClick={() => setProgressAdjustMember(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">{progressAdjustMember.name} {progressAdjustMember.role}</strong>님의 성경 완독 기록을 관리자가 직접 확인 및 승인 처리합니다.
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">성경 권 선택</label>
                <select
                  value={adjustBook}
                  onChange={(e) => setAdjustBook(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {BIBLE_BOOKS.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} (총 {b.chaptersCount}장)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">완독 장 번호</label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={adjustChapter}
                  onChange={(e) => setAdjustChapter(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">승인 사유 / 메모</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="예: 가정예배 통독, 구역모임 낭독"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProgressAdjustMember(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleApproveProgress}
                className="flex-1 py-2.5 bg-[#1b64b9] hover:bg-blue-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs"
              >
                완독 승인 반영
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: 격려 메시지 발송 모달 (Encouragement Modal)
         ======================================================== */}
      {encourageMember && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEncourageMember(null);
          }}
        >
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-4 sm:p-5 border border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>💬 성도 격려 메시지 발송</span>
              </h3>
              <button onClick={() => setEncourageMember(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">{encourageMember.name} {encourageMember.role}</strong>님께 전송할 알림 내용:
            </p>

            {/* Template options */}
            <div className="space-y-1.5">
              {[
                '오늘도 말씀 안에서 승리하시길 기도합니다! 성경 낭독을 응원합니다. ✨',
                '잠시 쉬어가도 괜찮습니다. 함께 12독 목표의 완주를 향해 나아가요! 🕊️',
                '은혜로운 성경 낭독에 감사드립니다. 오늘도 말씀이 삶의 등이 되길 소망합니다. 🕯️',
              ].map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEncourageMsg(template)}
                  className={`w-full text-left p-2 rounded-xl text-[11px] font-medium border transition cursor-pointer ${
                    encourageMsg === template
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {template}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={encourageMsg}
              onChange={(e) => setEncourageMsg(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEncourageMember(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSendEncouragement}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>격려 알림 전송</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: 낭독 피드백 코멘트 모달 (Recording Feedback Modal)
         ======================================================== */}
      {feedbackModalRec && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFeedbackModalRec(null);
          }}
        >
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-4 sm:p-5 border border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black text-slate-900">낭독 코멘트 및 심사</h3>
              <button onClick={() => setFeedbackModalRec(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              <p>낭독자: <strong className="text-slate-900">{feedbackModalRec.memberName}</strong></p>
              <p>구절: <strong className="text-[#1b64b9]">{feedbackModalRec.verseRef}</strong></p>
            </div>

            <textarea
              rows={3}
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="회원의 낭독에 전할 은혜로운 코멘트와 칭찬을 작성해주세요."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1b64b9] font-medium"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFeedbackModalRec(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveFeedback}
                className="flex-1 py-2.5 bg-[#1b64b9] hover:bg-blue-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs"
              >
                코멘트 저장 및 승인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: 수료증 미리보기 모달 (Certificate of Honor Modal)
         ======================================================== */}
      {certMember && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCertMember(null);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 space-y-4 p-5 text-center relative">
            <button
              onClick={() => setCertMember(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Certificate Frame */}
            <div className="border-4 border-double border-amber-300 rounded-2xl p-6 bg-gradient-to-b from-[#fffef5] to-amber-50/40 relative shadow-inner">
              <div className="text-3xl mb-1">👑</div>
              <h2 className="text-lg font-black text-amber-950 tracking-widest mb-1">
                성경 12목표 완독 수료증
              </h2>
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-4">
                Certificate of Bible 12-Cycle Completion
              </p>

              <div className="space-y-1.5 my-4">
                <span className="text-xs text-slate-500 font-medium">성도 성명</span>
                <p className="text-xl font-black text-slate-900 border-b border-amber-200 pb-1 inline-block px-4">
                  {certMember.name} {certMember.role}
                </p>
                <p className="text-xs text-slate-500">{certMember.department}</p>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium px-2 py-2">
                위 성도는 신구약 66권 총 1,189장의 거룩한 하나님의 말씀을 주야로 묵상하며
                <strong className="text-amber-900 font-bold"> 성경 12회 통독 대장정(총 14,268장)</strong>을
                성실과 믿음으로 완수하였으므로 영광의 면류관 증서를 수여합니다.
              </p>

              <div className="text-[11px] text-amber-800 font-serif italic mt-3">
                "주의 말씀은 내 발에 등이요 내 길에 빛이니이다" (시 119:105)
              </div>

              <div className="mt-6 pt-3 border-t border-amber-200 text-xs text-slate-600 font-bold flex items-center justify-between">
                <span>발행: 로고스 수퍼바이블</span>
                <span>{new Date().toLocaleDateString('ko-KR')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                인쇄하기
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`${certMember.name} 성도님께 수료증 PDF 및 축하 알림이 발송되었습니다!`);
                  setCertMember(null);
                }}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs"
              >
                성도에게 수료증 발송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
