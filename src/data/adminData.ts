export interface MemberReadingProfile {
  id: string;
  name: string;
  department: string;
  role: string;
  phone: string;
  email: string;
  registeredDate?: string;
  birthdate?: string;
  baptismStatus?: string;
  smallGroup?: string;
  accountRole?: 'admin' | 'leader' | 'member';
  accountStatus?: 'active' | 'dormant' | 'transferred';
  avatarColor: string;
  avatarText: string;
  currentReadingRound: number; // e.g. 1독
  targetRounds: number; // 12독
  currentBook: string;
  currentChapter: number;
  totalReadChapters: number; // out of 1,189
  recordingsCount: number;
  lastActive: string;
  status: 'excellent' | 'active' | 'warning' | 'completed';
  consecutiveDays: number;
  featuredCount: number;
  memo?: string;
}

export interface MemberRecordingItem {
  id: string;
  memberId: string;
  memberName: string;
  department: string;
  role: string;
  title: string;
  verseRef: string;
  passageSnippet: string;
  duration: string;
  date: string;
  isFeatured: boolean;
  status: 'approved' | 'pending';
  feedback?: string;
  audioBlobUrl?: string;
}

export interface ReadingCampaign {
  id: string;
  title: string;
  description: string;
  targetScope: string; // e.g. '성경 66권 12독'
  startDate: string;
  endDate: string;
  participantsCount: number;
  avgProgress: number; // 0 - 100
  isActive: boolean;
  badgeTag: string;
}

// 회원관리 초기 마스터 관리자 (샘플 더미 데이터 초기화 완료)
export const INITIAL_MEMBERS: MemberReadingProfile[] = [
  {
    id: 'M-01',
    name: '로고스 관리자',
    department: '교목실 & 성경통독 총괄관리부',
    role: '관리자',
    phone: '010-0000-0000',
    email: 'yoocomdr57@gmail.com',
    registeredDate: '2026.01.01',
    birthdate: '1980.01.01',
    baptismStatus: '세례교인',
    smallGroup: '총괄본부',
    accountRole: 'admin',
    accountStatus: 'active',
    avatarColor: 'bg-amber-500',
    avatarText: '관리',
    currentReadingRound: 1,
    targetRounds: 12,
    currentBook: '창세기',
    currentChapter: 1,
    totalReadChapters: 10,
    recordingsCount: 0,
    lastActive: '방금 전',
    status: 'active',
    consecutiveDays: 30,
    featuredCount: 0,
    memo: '수퍼바이블 총괄 시스템 관리자 (yoocomdr57@gmail.com)',
  },
];

// 낭독 음원 검수 데이터 초기화 (회원가입한 회원들의 실제 낭독 음원만 표시)
export const INITIAL_MEMBER_RECORDINGS: MemberRecordingItem[] = [];

// 통독 캠페인 초기화
export const INITIAL_CAMPAIGNS: ReadingCampaign[] = [
  {
    id: 'camp-1',
    title: '2026 전교인 성경 12독 대장정',
    description: '말씀의 반석 위에 굳게 서는 1년 12독 거룩한 통독 캠페인',
    targetScope: '구약 39권 · 신약 27권 전체 (12회 완독)',
    startDate: '2026.01.01',
    endDate: '2026.12.31',
    participantsCount: 1,
    avgProgress: 0,
    isActive: true,
    badgeTag: '12목표 대장정',
  },
  {
    id: 'camp-2',
    title: '사순절 40일 신약 260장 집중 낭독',
    description: '십자가의 고난과 부활의 소망을 묵상하는 40일 신약 완독',
    targetScope: '신약 성경 27권 (260장)',
    startDate: '2026.02.18',
    endDate: '2026.04.04',
    participantsCount: 1,
    avgProgress: 0,
    isActive: false,
    badgeTag: '사순절 특별통독',
  },
  {
    id: 'camp-3',
    title: '청년부 여름방학 시편·잠언 지혜서 정복',
    description: '젊은 날에 지혜의 근본이신 여호와를 경외하는 30일 프로젝트',
    targetScope: '시편 150편 + 잠언 31장',
    startDate: '2026.07.01',
    endDate: '2026.07.31',
    participantsCount: 1,
    avgProgress: 0,
    isActive: false,
    badgeTag: '지혜서 정복',
  },
];
