import React, { useState, useEffect } from 'react';
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
import {
  getGoogleSheetConfig,
  saveGoogleSheetConfig,
  syncBidirectionalWithGoogleSheets,
  generateAppsScriptCode,
  getSheetSyncLogs,
  GoogleSheetConfig,
  SheetSyncLog,
} from '../services/googleSheetsSync';

interface AdminBibleManagementViewProps {
  user?: User;
  onBack: () => void;
  onNavigateToBible?: (book: string, chapter?: number, verse?: number) => void;
}

const ADMIN_MEMBERS_KEY = 'superbible_admin_members_v1';
const ADMIN_RECORDINGS_KEY = 'superbible_admin_recordings_v1';
const ADMIN_CAMPAIGNS_KEY = 'superbible_admin_campaigns_v1';

export const AdminBibleManagementView: React.FC<AdminBibleManagementViewProps> = ({
  user,
  onBack,
  onNavigateToBible,
}) => {
  // Navigation Sub-tabs: 'overview' | 'roster' | 'members' | 'recordings' | 'campaigns' | 'reports' | 'sheets'
  const [adminTab, setAdminTab] = useState<'overview' | 'roster' | 'members' | 'recordings' | 'campaigns' | 'reports' | 'sheets'>('overview');

  // Google Sheets Sync state (yoocomdr57@gmail.com 계정 연동)
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>(() => getGoogleSheetConfig());
  const [syncLogs, setSyncLogs] = useState<SheetSyncLog[]>(() => getSheetSyncLogs());
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);

  // Members state (localStorage 연동 지속 보관)
  const [members, setMembers] = useState<MemberReadingProfile[]>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_MEMBERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MEMBERS;
  });
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('전체');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('전체');
  const [selectedMember, setSelectedMember] = useState<MemberReadingProfile | null>(null);

  // Roster (회원 관리 명부) state & filters
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterDeptFilter, setRosterDeptFilter] = useState<string>('전체');
  const [rosterBaptismFilter, setRosterBaptismFilter] = useState<string>('전체');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<string>('전체');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    department: '장년 1교구',
    role: '성도',
    phone: '010-',
    email: '',
    registeredDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    birthdate: '1985.01.01',
    baptismStatus: '세례' as '유아세례' | '세례' | '입교' | '학습' | '원입',
    smallGroup: '믿음 1구역',
    accountRole: 'member' as 'admin' | 'pastor' | 'leader' | 'member',
    accountStatus: '정상' as '정상' | '휴면' | '정지',
    memo: '',
  });
  const [editingMember, setEditingMember] = useState<MemberReadingProfile | null>(null);

  // Recordings state (localStorage 연동 지속 보관)
  const [recordings, setRecordings] = useState<MemberRecordingItem[]>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_RECORDINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MEMBER_RECORDINGS;
  });
  const [playingRecId, setPlayingRecId] = useState<string | null>(null);
  const [feedbackModalRec, setFeedbackModalRec] = useState<MemberRecordingItem | null>(null);
  const [feedbackInput, setFeedbackInput] = useState('');

  // Campaigns state (localStorage 연동 지속 보관)
  const [campaigns, setCampaigns] = useState<ReadingCampaign[]>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_CAMPAIGNS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CAMPAIGNS;
  });
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampScope, setNewCampScope] = useState('성경 66권 12독');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(members));
    } catch (e) {}
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_RECORDINGS_KEY, JSON.stringify(recordings));
    } catch (e) {}
  }, [recordings]);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_CAMPAIGNS_KEY, JSON.stringify(campaigns));
    } catch (e) {}
  }, [campaigns]);

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

  // Filtered Roster (회원 관리 명부) calculation
  const filteredRosterMembers = members.filter((m) => {
    const searchLow = rosterSearch.toLowerCase();
    const matchSearch =
      m.name.toLowerCase().includes(searchLow) ||
      m.department.toLowerCase().includes(searchLow) ||
      m.role.toLowerCase().includes(searchLow) ||
      (m.smallGroup && m.smallGroup.toLowerCase().includes(searchLow)) ||
      (m.phone && m.phone.includes(searchLow)) ||
      (m.email && m.email.toLowerCase().includes(searchLow));

    const matchDept = rosterDeptFilter === '전체' || m.department === rosterDeptFilter;
    const matchBaptism = rosterBaptismFilter === '전체' || m.baptismStatus === rosterBaptismFilter;
    const matchStatus = rosterStatusFilter === '전체' || (m.accountStatus || '정상') === rosterStatusFilter;

    return matchSearch && matchDept && matchBaptism && matchStatus;
  });

  // Filtered members calculation for Reading Progress
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

  // Register New Member Handler
  const handleCreateMember = () => {
    if (!newMemberForm.name.trim()) {
      alert('회원 성명을 입력해주세요.');
      return;
    }
    const newId = `M-${String(members.length + 1).padStart(2, '0')}`;
    const newMember: MemberReadingProfile = {
      id: newId,
      name: newMemberForm.name.trim(),
      department: newMemberForm.department,
      role: newMemberForm.role,
      phone: newMemberForm.phone.trim(),
      email: newMemberForm.email.trim() || `${newId.toLowerCase()}@church.net`,
      currentReadingRound: 1,
      currentBook: '창세기',
      currentChapter: 1,
      totalReadChapters: 0,
      recordingsCount: 0,
      lastActive: '방금 전 (신규 등록)',
      status: 'active',
      consecutiveDays: 0,
      registeredDate: newMemberForm.registeredDate,
      birthdate: newMemberForm.birthdate,
      baptismStatus: newMemberForm.baptismStatus,
      smallGroup: newMemberForm.smallGroup,
      accountRole: newMemberForm.accountRole,
      accountStatus: newMemberForm.accountStatus,
      memo: newMemberForm.memo,
    };
    setMembers((prev) => [newMember, ...prev]);
    showToast(`신규 회원 '${newMember.name}'(${newMember.role})님이 명부에 등록되었습니다! 🎉`);
    setShowAddMemberModal(false);
    setNewMemberForm({
      name: '',
      department: '장년 1교구',
      role: '성도',
      phone: '010-',
      email: '',
      registeredDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      birthdate: '1985.01.01',
      baptismStatus: '세례',
      smallGroup: '믿음 1구역',
      accountRole: 'member',
      accountStatus: '정상',
      memo: '',
    });
  };

  // Update Member Handler
  const handleUpdateMember = () => {
    if (!editingMember) return;
    if (!editingMember.name.trim()) {
      alert('회원 성명을 입력해주세요.');
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.id === editingMember.id ? editingMember : m))
    );
    showToast(`'${editingMember.name}' 회원 정보가 성공적으로 수정되었습니다.`);
    setEditingMember(null);
  };

  // Delete Member Handler
  const handleDeleteMember = (memberId: string, memberName: string) => {
    if (confirm(`'${memberName}' 회원을 회원 명부에서 삭제하시겠습니까?`)) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast(`'${memberName}' 회원이 삭제되었습니다.`);
    }
  };

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

  // Add new campaign
  const handleCreateCampaign = () => {
    if (!newCampTitle.trim()) {
      alert('캠페인 제목을 입력해주세요.');
      return;
    }
    const newCamp: ReadingCampaign = {
      id: `camp-${Date.now()}`,
      title: newCampTitle.trim(),
      description: '교회 공동체 말씀 낭독 캠페인',
      targetScope: newCampScope,
      startDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      endDate: '2026.12.31',
      participantsCount: members.length,
      avgProgress: 0,
      isActive: true,
      badgeTag: '신규 캠페인',
    };
    setCampaigns((prev) => [newCamp, ...prev]);
    showToast(`새 캠페인 '${newCamp.title}'이(가) 등록되었습니다! 🎉`);
    setShowAddCampaignModal(false);
    setNewCampTitle('');
  };

  // Reset admin demo data
  const handleResetAdminData = () => {
    if (confirm('모든 관리자 데이터를 초기 샘플 데이터로 복원하시겠습니까?')) {
      setMembers(INITIAL_MEMBERS);
      setRecordings(INITIAL_MEMBER_RECORDINGS);
      setCampaigns(INITIAL_CAMPAIGNS);
      try {
        localStorage.removeItem(ADMIN_MEMBERS_KEY);
        localStorage.removeItem(ADMIN_RECORDINGS_KEY);
        localStorage.removeItem(ADMIN_CAMPAIGNS_KEY);
      } catch (e) {}
      showToast('관리자 데이터가 초기 샘플로 복원되었습니다.');
    }
  };

  // Trigger real-time bidirectional sync
  const handleTriggerSheetSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncBidirectionalWithGoogleSheets(members, recordings, campaigns);
      setSheetConfig(getGoogleSheetConfig());
      setSyncLogs(getSheetSyncLogs());
      showToast(res.message);
    } catch (e) {
      showToast('구글 스프레드시트 동기화 중 오류가 발생했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy Google Apps Script code for yoocomdr57@gmail.com
  const handleCopyAppsScript = () => {
    const code = generateAppsScriptCode('yoocomdr57@gmail.com');
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
    showToast('yoocomdr57 계정용 Google Apps Script 코드가 복사되었습니다! 📋');
  };

  // Download Google Sheets 5-Tab Template as CSV (회원관리 포함)
  const handleDownloadGoogleSheetTemplate = () => {
    const lines: string[] = [];
    lines.push('# =======================================================');
    lines.push('# 수퍼바이블 Google Spreadsheet 5-Sheet Template (yoocomdr57@gmail.com)');
    lines.push('# 생성일시: ' + new Date().toLocaleString('ko-KR'));
    lines.push('# =======================================================\n');

    // Sheet 1: 회원관리 (마스터 명부)
    lines.push('### [시트 1: 회원관리] ###');
    lines.push('회원번호,성명,소속부서,직분,전화번호,이메일,등록일자,생년월일,세례구분,구역/목장,계정권한,회원상태,관리자메모');
    members.forEach((m) => {
      lines.push(
        `"${m.id}","${m.name}","${m.department}","${m.role}","${m.phone}","${m.email}","${m.registeredDate || ''}","${m.birthdate || ''}","${m.baptismStatus || '세례'}","${m.smallGroup || ''}","${m.accountRole || 'member'}","${m.accountStatus || '정상'}","${(m.memo || '').replace(/"/g, '""')}"`
      );
    });

    // Sheet 2: 회원_낭독진도
    lines.push('\n### [시트 2: 회원_낭독진도] ###');
    lines.push('회원번호,이름,소속부서,직분,전화번호,이메일,현재통독회차,현재성경,현재장,완독장수,녹음수,최근활동일시,상태,연속통독일,관리자메모');
    members.forEach((m) => {
      lines.push(
        `"${m.id}","${m.name}","${m.department}","${m.role}","${m.phone}","${m.email}","${m.currentReadingRound}독","${m.currentBook}","${m.currentChapter}장","${m.totalReadChapters}","${m.recordingsCount}","${m.lastActive}","${m.status}","${m.consecutiveDays}","${(m.memo || '').replace(/"/g, '""')}"`
      );
    });

    // Sheet 3: 낭독_음원검수
    lines.push('\n### [시트 3: 낭독_음원검수] ###');
    lines.push('녹음ID,회원번호,성명,소속부서,직분,낭독제목,성경구절,본문요약,재생시간,녹음일시,베스트낭독여부,심사상태,관리자피드백');
    recordings.forEach((r) => {
      lines.push(
        `"${r.id}","${r.memberId}","${r.memberName}","${r.department}","${r.role}","${r.title}","${r.verseRef}","${r.passageSnippet.slice(0, 30)}...","${r.duration}","${r.date}","${r.isFeatured ? 'Y' : 'N'}","${r.status}","${(r.feedback || '').replace(/"/g, '""')}"`
      );
    });

    // Sheet 4: 통독_캠페인
    lines.push('\n### [시트 4: 통독_캠페인] ###');
    lines.push('캠페인ID,캠페인명,설명,목표범위,시작일,종료일,참여자수,평균달성률,활성여부');
    campaigns.forEach((c) => {
      lines.push(
        `"${c.id}","${c.title}","${c.description}","${c.targetScope}","${c.startDate}","${c.endDate}","${c.participantsCount}","${c.avgProgress}%","${c.isActive ? 'Y' : 'N'}"`
      );
    });

    // Sheet 5: 실시간_동기화로그
    lines.push('\n### [시트 5: 실시간_동기화로그] ###');
    lines.push('로그ID,일시,방향,요약,영향행수');
    syncLogs.forEach((l) => {
      lines.push(`"${l.id}","${l.timestamp}","${l.direction}","${l.summary}","${l.rowsAffected}"`);
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `수퍼바이블_구글스프레드시트_5개시트_yoocomdr57_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('yoocomdr57 전용 5개 시트 템플릿(회원관리 포함 CSV)이 다운로드되었습니다.');
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
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">yoocomdr57 구글 시트 양방향 실시간 동기화</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyAppsScript}
            className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1 shadow-xs transition cursor-pointer active:scale-95 flex-shrink-0"
            title="yoocomdr57@gmail.com Google Apps Script 코드 복사"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
            <span>{copiedScript ? '복사됨!' : '스크립트 복사'}</span>
          </button>
          <button
            type="button"
            onClick={handleTriggerSheetSync}
            disabled={isSyncing}
            className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs font-black rounded-xl flex items-center gap-1 shadow-2xs transition cursor-pointer active:scale-95 flex-shrink-0"
            title="yoocomdr57@gmail.com 구글 시트 실시간 양방향 동기화"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
            <span className="hidden sm:inline">시트 동기화</span>
          </button>
          <button
            type="button"
            onClick={handleResetAdminData}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer border border-slate-700"
            title="관리자 데이터 초기화 (초기 샘플 데이터 복원)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
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

      {/* 2. Admin 7-Tab Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-2 py-1.5 flex items-center justify-start overflow-x-auto no-scrollbar flex-shrink-0 z-20 gap-1.5">
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
          onClick={() => setAdminTab('roster')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'roster'
              ? 'bg-[#0284c7] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>📇</span>
          <span>회원 관리 명부 ({members.length})</span>
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
          <span>📖</span>
          <span>낭독 진도 관리</span>
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

        <button
          type="button"
          onClick={() => setAdminTab('sheets')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            adminTab === 'sheets'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>구글 시트 연동</span>
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
            TAB 2: 회원 관리 명부 (교인 마스터 명부 - Master Member Directory)
           ======================================================== */}
        {adminTab === 'roster' && (
          <div className="space-y-4">
            {/* 1. Header Banner & Action Button */}
            <div className="bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-sky-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white text-sky-700 flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
                    📇
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black tracking-tight">회원 관리 마스터 명부</h3>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-300 text-sky-950">
                        구글시트 1번 시트 연동
                      </span>
                    </div>
                    <p className="text-xs text-sky-100 mt-0.5">
                      교인 인적사항, 소속 부서, 직분, 세례, 구역/목장 및 계정 권한 체계적 관리
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="px-3.5 py-2 bg-white hover:bg-sky-50 active:scale-95 text-sky-900 text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5] text-sky-600" />
                    <span>신규 회원 등록</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerSheetSync}
                    disabled={isSyncing}
                    className="px-3 py-2 bg-sky-900/80 hover:bg-sky-900 text-sky-100 text-xs font-bold rounded-xl border border-sky-400/40 transition cursor-pointer flex items-center gap-1"
                    title="구글 시트 즉시 동기화"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">동기화</span>
                  </button>
                </div>
              </div>

              {/* Roster Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-sky-200 block font-semibold">총 등록 회원</span>
                  <span className="font-black text-white text-base">{members.length}명</span>
                </div>
                <div className="bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-sky-200 block font-semibold">세례/입교 교인</span>
                  <span className="font-black text-white text-base">
                    {members.filter((m) => m.baptismStatus === '세례' || m.baptismStatus === '입교').length}명
                  </span>
                </div>
                <div className="bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-sky-200 block font-semibold">정상 활동 회원</span>
                  <span className="font-black text-white text-base">
                    {members.filter((m) => (m.accountStatus || '정상') === '정상').length}명
                  </span>
                </div>
                <div className="bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-sky-200 block font-semibold">소속 공동체</span>
                  <span className="font-black text-white text-base">5개 부서</span>
                </div>
              </div>
            </div>

            {/* 2. Search & Multi Filters */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="성명, 부서, 직분, 전화번호, 구역/목장 검색"
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                  {rosterSearch && (
                    <button
                      type="button"
                      onClick={() => setRosterSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                  {/* Department select */}
                  <select
                    value={rosterDeptFilter}
                    onChange={(e) => setRosterDeptFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="전체">부서 전체</option>
                    <option value="청장년 성경통독부">청장년 성경통독부</option>
                    <option value="대학청년부">대학청년부</option>
                    <option value="교직원선교회">교직원선교회</option>
                    <option value="주일학교 교사부">주일학교 교사부</option>
                    <option value="장년 1교구">장년 1교구</option>
                  </select>

                  {/* Baptism filter */}
                  <select
                    value={rosterBaptismFilter}
                    onChange={(e) => setRosterBaptismFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="전체">세례구분 전체</option>
                    <option value="세례">세례</option>
                    <option value="유아세례">유아세례</option>
                    <option value="입교">입교</option>
                    <option value="학습">학습</option>
                    <option value="원입">원입</option>
                  </select>

                  {/* Account status filter */}
                  <select
                    value={rosterStatusFilter}
                    onChange={(e) => setRosterStatusFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="전체">상태 전체</option>
                    <option value="정상">정상</option>
                    <option value="휴면">휴면</option>
                    <option value="정지">정지</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span className="font-bold">
                  총 <strong className="text-slate-900">{filteredRosterMembers.length}</strong>명 검색됨
                </span>
                <span className="text-[11px] text-slate-400">회원 정보를 직접 수정하거나 성경 낭독 진도를 확인할 수 있습니다.</span>
              </div>
            </div>

            {/* 3. Member Directory Cards */}
            <div className="space-y-3">
              {filteredRosterMembers.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/90 shadow-2xs space-y-2">
                  <p className="text-3xl">🔍</p>
                  <p className="text-sm font-black text-slate-700">검색 조건과 일치하는 회원이 없습니다</p>
                  <p className="text-xs text-slate-400">검색어를 지우거나 필터를 [전체]로 변경해보세요.</p>
                </div>
              ) : (
                filteredRosterMembers.map((m) => {
                  const roleBadgeColor =
                    m.role === '장로'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : m.role === '권사'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : m.role === '집사' || m.role === '안수집사'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  const accountBadgeColor =
                    m.accountRole === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : m.accountRole === 'pastor'
                      ? 'bg-indigo-100 text-indigo-800'
                      : m.accountRole === 'leader'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-slate-100 text-slate-700';

                  const statusColor =
                    (m.accountStatus || '정상') === '정상'
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                      : (m.accountStatus || '정상') === '휴면'
                      ? 'text-amber-600 bg-amber-50 border-amber-200'
                      : 'text-rose-600 bg-rose-50 border-rose-200';

                  return (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition space-y-3"
                    >
                      {/* Top: Member header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                            {m.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-mono font-bold text-slate-400">{m.id}</span>
                              <h4 className="text-sm font-black text-slate-900">{m.name}</h4>
                              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${roleBadgeColor}`}>
                                {m.role}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                {m.department}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {m.smallGroup || '구역 미정'} · 세례: <strong>{m.baptismStatus || '세례'}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusColor}`}>
                            {m.accountStatus || '정상'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${accountBadgeColor}`}>
                            {m.accountRole === 'admin'
                              ? '👑 관리자'
                              : m.accountRole === 'pastor'
                              ? '⛪ 목회자'
                              : m.accountRole === 'leader'
                              ? '🛡️ 리더'
                              : '👤 성도'}
                          </span>
                        </div>
                      </div>

                      {/* Detail Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">연락처</span>
                          <a
                            href={`tel:${m.phone}`}
                            className="font-bold text-slate-800 hover:text-sky-600 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{m.phone}</span>
                          </a>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">이메일</span>
                          <a
                            href={`mailto:${m.email}`}
                            className="font-bold text-slate-800 hover:text-sky-600 flex items-center gap-1 truncate"
                          >
                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{m.email}</span>
                          </a>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">생년월일 / 등록일</span>
                          <span className="font-bold text-slate-800">
                            {m.birthdate || '-'} ({m.registeredDate ? `${m.registeredDate} 등록` : '-'})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] font-semibold">성경 통독 현황</span>
                          <span className="font-black text-[#1b64b9]">
                            {m.currentReadingRound}독 진행 ({m.currentBook} {m.currentChapter}장)
                          </span>
                        </div>
                      </div>

                      {/* Memo note if exists */}
                      {m.memo && (
                        <div className="text-[11px] text-slate-600 bg-amber-50/60 border border-amber-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                          <span className="text-amber-600 font-bold">📝 관리자 메모:</span>
                          <span className="truncate">{m.memo}</span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember(m);
                            setAdminTab('members');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#1b64b9]" />
                          <span>낭독 진도 보기</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingMember(m)}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg border border-sky-200 transition cursor-pointer flex items-center gap-1"
                          >
                            <span>✏️ 정보 수정</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(m.id, m.name)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition cursor-pointer"
                            title="회원 삭제"
                          >
                            <span>🗑️</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: 회원 낭독 관리 (Members Table & Detail)
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

        {/* ========================================================
            TAB 6: 구글 시트 실시간 양방향 연동 (Google Sheets Sync)
           ======================================================== */}
        {adminTab === 'sheets' && (
          <div className="space-y-4">
            {/* 1. Account & Sheet Connection Status Card */}
            <div className="bg-gradient-to-r from-[#064e3b] via-[#065f46] to-[#047857] text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-emerald-500/30 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white text-emerald-700 flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
                    📊
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black tracking-tight">구글 스프레드시트 양방향 연동</h3>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                        실시간 연동중
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200 mt-0.5">
                      대상 관리자 계정: <strong className="text-white font-mono">{sheetConfig.adminEmail}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyAppsScript}
                    className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                    title="Google Apps Script 연동 코드 클립보드 복사"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                    <span>{copiedScript ? '✓ 복사 완료!' : '📋 스크립트 코드 복사'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAppsScriptModal(true)}
                    className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/20 transition cursor-pointer flex items-center gap-1 flex-shrink-0"
                    title="전체 코드 및 가이드 팝업 열기"
                  >
                    <span>👁️ 코드 전체보기</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerSheetSync}
                    disabled={isSyncing}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 active:scale-95 text-emerald-800 text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-600' : 'text-emerald-700'}`} />
                    <span>{isSyncing ? '동기화 중...' : '지금 동기화'}</span>
                  </button>
                </div>
              </div>

              {/* Status Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-emerald-300 block font-semibold">연동 시트명</span>
                  <span className="font-bold text-white text-[11px] truncate block">수퍼바이블_회원성경낭독_yoocomdr57</span>
                </div>
                <div className="bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-emerald-300 block font-semibold">동기화 대상 회원</span>
                  <span className="font-bold text-white text-[11px] block">{members.length}명 관리 중</span>
                </div>
                <div className="bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-emerald-300 block font-semibold">낭독 음원 검수</span>
                  <span className="font-bold text-white text-[11px] block">{recordings.length}건 동기화됨</span>
                </div>
                <div className="bg-black/20 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-emerald-300 block font-semibold">마지막 양방향 통신</span>
                  <span className="font-bold text-white text-[11px] block truncate">{sheetConfig.lastSynced || '실시간 자동 동기화'}</span>
                </div>
              </div>
            </div>

            {/* 2. Google Apps Script One-Click Integration Setup (Placed Prominently at Top) */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white rounded-3xl p-4 sm:p-5 shadow-xl border border-indigo-500/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-base sm:text-lg font-black text-white tracking-tight">
                        구글 앱스 스크립트(Apps Script) 연동 코드
                      </h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                        원클릭 복사
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      구글 시트 [확장 프로그램 &gt; Apps Script]에 붙여넣기만 하면 5개 마스터 시트가 자동 완성됩니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyAppsScript}
                    className={`flex-1 sm:flex-none px-4 py-2.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                      copiedScript
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-300'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-amber-500/20'
                    }`}
                  >
                    <Share2 className="w-4 h-4 stroke-[2.5]" />
                    <span className="text-sm font-black">
                      {copiedScript ? '✓ 클립보드 복사 완료!' : '📋 스크립트 코드 복사'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAppsScriptModal(true)}
                    className="px-3.5 py-2.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0"
                  >
                    <span>👁️ 전체보기</span>
                  </button>
                </div>
              </div>

              {/* 4-Step Quick Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-black/30 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-amber-300 font-bold block mb-0.5">STEP 1</span>
                  <p className="text-[11px] text-slate-200">
                    <strong className="text-white">구글 시트 생성/열기</strong>
                    <br />
                    <span className="text-slate-400 text-[10px]">yoocomdr57@gmail.com</span>
                  </p>
                </div>
                <div className="bg-black/30 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-amber-300 font-bold block mb-0.5">STEP 2</span>
                  <p className="text-[11px] text-slate-200">
                    상단 메뉴 <strong className="text-white">[확장 프로그램]</strong> 클릭 후 <strong className="text-white">[Apps Script]</strong> 열기
                  </p>
                </div>
                <div className="bg-black/30 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-amber-300 font-bold block mb-0.5">STEP 3</span>
                  <p className="text-[11px] text-slate-200">
                    기존 코드 지우고 <strong className="text-amber-300">[복사한 스크립트]</strong> 붙여넣기 (Ctrl+V) 후 저장
                  </p>
                </div>
                <div className="bg-black/30 backdrop-blur-xs rounded-xl p-2.5 border border-white/10">
                  <span className="text-[10px] text-amber-300 font-bold block mb-0.5">STEP 4</span>
                  <p className="text-[11px] text-slate-200">
                    함수 <strong className="text-emerald-300">[setupSuperBibleSheets]</strong> 선택 후 [실행] 누르면 5개 시트 자동 생성!
                  </p>
                </div>
              </div>

              {/* Code Snippet Box with Quick Copy Overlay */}
              <div className="relative rounded-2xl bg-black/60 border border-white/10 p-3 text-[11px] font-mono overflow-hidden">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold text-slate-300">
                    <span>📄 Code.gs</span>
                    <span className="text-slate-500 font-normal">(총 135줄, 5개 마스터 시트 자동 생성 및 실시간 동기화 Web App)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAppsScript}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20"
                  >
                    <span>{copiedScript ? '✓ 복사됨' : '복사하기'}</span>
                  </button>
                </div>
                <pre className="text-slate-300 overflow-x-auto max-h-32 no-scrollbar leading-relaxed">
                  {generateAppsScriptCode('yoocomdr57@gmail.com').slice(0, 480)}...
                </pre>
              </div>

              {/* Action Buttons: Open new Google Sheet or Trigger Sync */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <a
                  href="https://docs.google.com/spreadsheets/u/0/create"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition text-center shadow-md cursor-pointer"
                >
                  <span>🔗 yoocomdr57 새 구글 시트 만들기 (새 창)</span>
                </a>
                <button
                  type="button"
                  onClick={handleDownloadGoogleSheetTemplate}
                  className="w-full sm:flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-white/20 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>5개 시트 템플릿 파일(CSV) 받기</span>
                </button>
              </div>
            </div>

            {/* 3. Google Spreadsheet 5-Sheet Schema & Structure Preview */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <span>📑 구글 스프레드시트 5대 시트 자동 구성 (회원관리 포함)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    yoocomdr57@gmail.com 계정의 스프레드시트에 자동 생성·동기화되는 마스터 테이블 구조입니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadGoogleSheetTemplate}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1b64b9] text-xs font-black rounded-xl border border-blue-200 shadow-2xs transition cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>스프레드시트 원본(CSV) 받기</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                {/* Sheet 1: 회원관리 */}
                <div className="p-3 bg-sky-50/80 rounded-xl border border-sky-200 space-y-1">
                  <div className="flex items-center justify-between font-black text-sky-950">
                    <span className="flex items-center gap-1 text-sky-700">
                      <span>📇</span>
                      <span>1. [회원관리] 마스터 시트</span>
                    </span>
                    <span className="text-[10px] bg-sky-200 text-sky-900 px-1.5 py-0.2 rounded font-bold">13개 컬럼</span>
                  </div>
                  <p className="text-[11px] text-sky-800">
                    회원번호, 성명, 소속부서, 직분, 전화번호, 이메일, 등록일자, 생년월일, 세례구분, 구역/목장, 계정권한, 회원상태, 관리자메모
                  </p>
                </div>

                {/* Sheet 2: 회원_낭독진도 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span className="flex items-center gap-1 text-[#1b64b9]">
                      <span>📊</span>
                      <span>2. [회원_낭독진도] 시트</span>
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">15개 컬럼</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    회원번호, 성명, 부서, 직분, 전화번호, 이메일, 통독회차, 현재성경, 현재장, 완독장수, 낭독수, 최근활동, 상태, 연속일수, 관리자메모
                  </p>
                </div>

                {/* Sheet 3: 낭독_음원검수 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span className="flex items-center gap-1 text-purple-700">
                      <span>🎙️</span>
                      <span>3. [낭독_음원검수] 시트</span>
                    </span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold">13개 컬럼</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    녹음ID, 회원번호, 성명, 소속부서, 낭독제목, 구절, 시간, 녹음일시, 베스트낭독여부(⭐), 심사상태, 관리자피드백
                  </p>
                </div>

                {/* Sheet 4: 통독_캠페인 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <span>🎯</span>
                      <span>4. [통독_캠페인] 시트</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">9개 컬럼</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    캠페인ID, 캠페인명, 설명, 목표범위, 시작일, 종료일, 참여자수, 평균달성률, 활성여부
                  </p>
                </div>

                {/* Sheet 5: 실시간_동기화로그 */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between font-black text-slate-900">
                    <span className="flex items-center gap-1 text-slate-800">
                      <span>⚡</span>
                      <span>5. [실시간_동기화로그] 시트</span>
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-bold">5개 컬럼</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    로그ID, 일시, 방향(양방향), 동기화 요약, 영향 받은 행 수(Rows)
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Real-time Live Sync Logs Table */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-900">실시간 양방향 동기화 로그 기록</h4>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    최근 {syncLogs.length}건
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSyncLogs(getSheetSyncLogs());
                    showToast('동기화 로그를 새로고침했습니다.');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>새로고침</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {syncLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          {log.direction === 'bidirectional' ? '양방향' : log.direction === 'upload' ? '업로드' : '다운로드'}
                        </span>
                        <span className="font-bold text-slate-800 truncate">{log.summary}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{log.details}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 block">{log.timestamp.split(' ')[1] || log.timestamp}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">{log.rowsAffected}행 반영</span>
                    </div>
                  </div>
                ))}
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

      {/* ========================================================
          MODAL 6: 새 캠페인 등록 모달 (Add Campaign Modal)
         ======================================================== */}
      {showAddCampaignModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddCampaignModal(false);
          }}
        >
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-5 border border-slate-100 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>🎯 새 통독 캠페인 개설</span>
              </h3>
              <button onClick={() => setShowAddCampaignModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">캠페인 명칭</label>
                <input
                  type="text"
                  value={newCampTitle}
                  onChange={(e) => setNewCampTitle(e.target.value)}
                  placeholder="예: 2026 하반기 전교인 성경 12독"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">목표 범위</label>
                <select
                  value={newCampScope}
                  onChange={(e) => setNewCampScope(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="성경 66권 12독">성경 66권 12독</option>
                  <option value="성경 66권 1독">성경 66권 1독</option>
                  <option value="신약 27권 완독">신약 27권 완독</option>
                  <option value="구약 39권 완독">구약 39권 완독</option>
                  <option value="시편·잠언 지혜서">시편·잠언 지혜서</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCampaignModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreateCampaign}
                className="flex-1 py-2.5 bg-[#1b64b9] hover:bg-blue-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs"
              >
                캠페인 개설
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 7: 신규 회원 등록 모달 (Add Member Modal)
         ======================================================== */}
      {showAddMemberModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddMemberModal(false);
          }}
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar bg-white rounded-3xl shadow-2xl p-5 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">📇</span>
                <h3 className="text-sm font-black text-slate-900">신규 회원(교인) 등록</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">성명 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                    placeholder="예: 홍길동"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">직분</label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="성도">성도</option>
                    <option value="청년">청년</option>
                    <option value="서리집사">서리집사</option>
                    <option value="안수집사">안수집사</option>
                    <option value="권사">권사</option>
                    <option value="장로">장로</option>
                    <option value="교역자">교역자</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">소속 부서</label>
                  <select
                    value={newMemberForm.department}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, department: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="청장년 성경통독부">청장년 성경통독부</option>
                    <option value="대학청년부">대학청년부</option>
                    <option value="교직원선교회">교직원선교회</option>
                    <option value="주일학교 교사부">주일학교 교사부</option>
                    <option value="장년 1교구">장년 1교구</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">구역/목장</label>
                  <input
                    type="text"
                    value={newMemberForm.smallGroup}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, smallGroup: e.target.value })}
                    placeholder="예: 믿음 1구역"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">전화번호</label>
                  <input
                    type="text"
                    value={newMemberForm.phone}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">이메일</label>
                  <input
                    type="email"
                    value={newMemberForm.email}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">생년월일</label>
                  <input
                    type="text"
                    value={newMemberForm.birthdate}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, birthdate: e.target.value })}
                    placeholder="YYYY.MM.DD"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">등록일자</label>
                  <input
                    type="text"
                    value={newMemberForm.registeredDate}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, registeredDate: e.target.value })}
                    placeholder="YYYY.MM.DD"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">세례 구분</label>
                  <select
                    value={newMemberForm.baptismStatus}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, baptismStatus: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="세례">세례</option>
                    <option value="유아세례">유아세례</option>
                    <option value="입교">입교</option>
                    <option value="학습">학습</option>
                    <option value="원입">원입</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">계정 권한</label>
                  <select
                    value={newMemberForm.accountRole}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, accountRole: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="member">👤 성도</option>
                    <option value="leader">🛡️ 리더</option>
                    <option value="pastor">⛪ 목회자</option>
                    <option value="admin">👑 관리자</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">회원 상태</label>
                  <select
                    value={newMemberForm.accountStatus}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, accountStatus: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="정상">🟢 정상</option>
                    <option value="휴면">🟡 휴면</option>
                    <option value="정지">🔴 정지</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">관리자 메모</label>
                <textarea
                  value={newMemberForm.memo}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, memo: e.target.value })}
                  placeholder="특이사항, 심방 필요 사항, 성경통독 목표 등"
                  rows={2}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreateMember}
                className="flex-1 py-2.5 bg-[#0284c7] hover:bg-sky-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs"
              >
                회원 등록 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 8: 회원 정보 수정 모달 (Edit Member Modal)
         ======================================================== */}
      {editingMember && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingMember(null);
          }}
        >
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar bg-white rounded-3xl shadow-2xl p-5 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{editingMember.name} 회원 정보 수정</h3>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {editingMember.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">성명 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">직분</label>
                  <select
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="성도">성도</option>
                    <option value="청년">청년</option>
                    <option value="서리집사">서리집사</option>
                    <option value="안수집사">안수집사</option>
                    <option value="권사">권사</option>
                    <option value="장로">장로</option>
                    <option value="교역자">교역자</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">소속 부서</label>
                  <select
                    value={editingMember.department}
                    onChange={(e) => setEditingMember({ ...editingMember, department: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="청장년 성경통독부">청장년 성경통독부</option>
                    <option value="대학청년부">대학청년부</option>
                    <option value="교직원선교회">교직원선교회</option>
                    <option value="주일학교 교사부">주일학교 교사부</option>
                    <option value="장년 1교구">장년 1교구</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">구역/목장</label>
                  <input
                    type="text"
                    value={editingMember.smallGroup || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, smallGroup: e.target.value })}
                    placeholder="예: 믿음 1구역"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">전화번호</label>
                  <input
                    type="text"
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">이메일</label>
                  <input
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">생년월일</label>
                  <input
                    type="text"
                    value={editingMember.birthdate || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, birthdate: e.target.value })}
                    placeholder="YYYY.MM.DD"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">등록일자</label>
                  <input
                    type="text"
                    value={editingMember.registeredDate || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, registeredDate: e.target.value })}
                    placeholder="YYYY.MM.DD"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">세례 구분</label>
                  <select
                    value={editingMember.baptismStatus || '세례'}
                    onChange={(e) => setEditingMember({ ...editingMember, baptismStatus: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="세례">세례</option>
                    <option value="유아세례">유아세례</option>
                    <option value="입교">입교</option>
                    <option value="학습">학습</option>
                    <option value="원입">원입</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">계정 권한</label>
                  <select
                    value={editingMember.accountRole || 'member'}
                    onChange={(e) => setEditingMember({ ...editingMember, accountRole: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="member">👤 성도</option>
                    <option value="leader">🛡️ 리더</option>
                    <option value="pastor">⛪ 목회자</option>
                    <option value="admin">👑 관리자</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">회원 상태</label>
                  <select
                    value={editingMember.accountStatus || '정상'}
                    onChange={(e) => setEditingMember({ ...editingMember, accountStatus: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="정상">🟢 정상</option>
                    <option value="휴면">🟡 휴면</option>
                    <option value="정지">🔴 정지</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">관리자 메모</label>
                <textarea
                  value={editingMember.memo || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, memo: e.target.value })}
                  placeholder="특이사항, 심방 필요 사항 등"
                  rows={2}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleUpdateMember}
                className="flex-1 py-2.5 bg-[#0284c7] hover:bg-sky-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs"
              >
                수정사항 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 9: Google Apps Script 연동 코드 전체보기 및 복사 모달
         ======================================================== */}
      {showAppsScriptModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAppsScriptModal(false);
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#0f172a] text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>Google Apps Script 연동 코드 (Code.gs)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                      yoocomdr57@gmail.com
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    구글 시트 확장 프로그램 &gt; Apps Script에 붙여넣어 5개 시트 자동 생성 및 실시간 양방향 동기화
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAppsScriptModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Step instructions */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span>📌 간편 설치 가이드 (3분 완료)</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 font-medium">
                  <li>
                    <strong className="text-slate-800">구글 스프레드시트</strong> 열기 (
                    <a
                      href="https://docs.google.com/spreadsheets/u/0/create"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1b64b9] underline font-bold"
                    >
                      새 스프레드시트 바로 열기
                    </a>
                    )
                  </li>
                  <li>
                    상단 메뉴에서 <strong className="text-slate-800">[확장 프로그램]</strong> &gt; <strong className="text-slate-800">[Apps Script]</strong> 클릭
                  </li>
                  <li>
                    기존 기본 코드를 모두 지우고(Ctrl+A 후 Backspace), 아래의 <strong className="text-indigo-600">[복사한 스크립트 코드]</strong>를 붙여넣기(Ctrl+V) 한 뒤 저장(Ctrl+S)
                  </li>
                  <li>
                    상단 함수 드롭다운에서 <strong className="text-emerald-700">[setupSuperBibleSheets]</strong>를 선택하고 <strong className="text-emerald-700">[실행]</strong> 버튼 클릭 (5개 마스터 시트 자동 생성!)
                  </li>
                  <li>
                    우측 상단 <strong className="text-blue-700">[배포]</strong> &gt; <strong className="text-blue-700">[새 배포]</strong> 클릭 후 유형을 <strong className="text-blue-700">[웹 앱(Web App)]</strong>으로 선택하고 모든 사용자(Anyone) 권한으로 배포
                  </li>
                </ol>
              </div>

              {/* Code Box with Floating Copy Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>Code.gs 소스코드 (전체 내용)</span>
                  <button
                    type="button"
                    onClick={handleCopyAppsScript}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black shadow-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{copiedScript ? '✓ 복사되었습니다!' : '코드 복사하기'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-slate-200 rounded-2xl p-3.5 font-mono text-[11px] overflow-x-auto max-h-72 border border-slate-800 select-all leading-relaxed">
                  <pre>{generateAppsScriptCode('yoocomdr57@gmail.com')}</pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowAppsScriptModal(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleCopyAppsScript}
                className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <Share2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span className="text-sm font-black">
                  {copiedScript ? '✓ 클립보드에 복사 완료되었습니다!' : 'Google Apps Script 코드 전체 복사하기'}
                </span>
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
