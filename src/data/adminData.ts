export interface MemberReadingProfile {
  id: string;
  name: string;
  department: string;
  role: string;
  phone: string;
  email: string;
  avatarColor: string;
  avatarText: string;
  currentReadingRound: number; // e.g. 2독
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

export const INITIAL_MEMBERS: MemberReadingProfile[] = [
  {
    id: 'm-01',
    name: '김은혜',
    department: '청장년 성경통독부',
    role: '권사',
    phone: '010-3847-1920',
    email: 'grace.kim@logos.church',
    avatarColor: 'bg-emerald-500',
    avatarText: '은혜',
    currentReadingRound: 3,
    targetRounds: 12,
    currentBook: '마태복음',
    currentChapter: 14,
    totalReadChapters: 980,
    recordingsCount: 24,
    lastActive: '방금 전',
    status: 'excellent',
    consecutiveDays: 45,
    featuredCount: 4,
    memo: '매일 새벽기도 후 5장씩 성실히 낭독',
  },
  {
    id: 'm-02',
    name: '박요셉',
    department: '대학청년부',
    role: '청년',
    phone: '010-4921-9988',
    email: 'joseph.park@logos.church',
    avatarColor: 'bg-blue-500',
    avatarText: '요셉',
    currentReadingRound: 1,
    targetRounds: 12,
    currentBook: '창세기',
    currentChapter: 32,
    totalReadChapters: 32,
    recordingsCount: 8,
    lastActive: '오늘 19:20',
    status: 'active',
    consecutiveDays: 12,
    featuredCount: 1,
    memo: '청년부 또래 리더, 낭독 음질 우수',
  },
  {
    id: 'm-03',
    name: '이모세',
    department: '교직원선교회',
    role: '장로',
    phone: '010-8823-1123',
    email: 'moses.lee@school.ac.kr',
    avatarColor: 'bg-purple-600',
    avatarText: '모세',
    currentReadingRound: 12,
    targetRounds: 12,
    currentBook: '요한계시록',
    currentChapter: 22,
    totalReadChapters: 1189,
    recordingsCount: 52,
    lastActive: '오늘 06:10',
    status: 'completed',
    consecutiveDays: 120,
    featuredCount: 9,
    memo: '12목표 최종 완수 달성자! 면류관 배지 수여',
  },
  {
    id: 'm-04',
    name: '최한나',
    department: '주일학교 교사부',
    role: '집사',
    phone: '010-7761-3450',
    email: 'hanna.choi@logos.church',
    avatarColor: 'bg-rose-500',
    avatarText: '한나',
    currentReadingRound: 2,
    targetRounds: 12,
    currentBook: '시편',
    currentChapter: 84,
    totalReadChapters: 620,
    recordingsCount: 15,
    lastActive: '어제 22:15',
    status: 'active',
    consecutiveDays: 8,
    featuredCount: 2,
    memo: '유초등부 공과 연계 시편 낭독 녹음',
  },
  {
    id: 'm-05',
    name: '정다윗',
    department: '대학청년부',
    role: '청년',
    phone: '010-2345-6789',
    email: 'david.jung@logos.church',
    avatarColor: 'bg-amber-500',
    avatarText: '다윗',
    currentReadingRound: 1,
    targetRounds: 12,
    currentBook: '출애굽기',
    currentChapter: 4,
    totalReadChapters: 54,
    recordingsCount: 2,
    lastActive: '4일 전',
    status: 'warning',
    consecutiveDays: 0,
    featuredCount: 0,
    memo: '학업/시험 기간으로 낭독 지연, 격려 필요',
  },
  {
    id: 'm-06',
    name: '강사라',
    department: '청장년 성경통독부',
    role: '성도',
    phone: '010-9901-2234',
    email: 'sarah.kang@logos.church',
    avatarColor: 'bg-teal-500',
    avatarText: '사라',
    currentReadingRound: 1,
    targetRounds: 12,
    currentBook: '레위기',
    currentChapter: 11,
    totalReadChapters: 101,
    recordingsCount: 6,
    lastActive: '오늘 14:05',
    status: 'active',
    consecutiveDays: 5,
    featuredCount: 1,
    memo: '가족 통독 함께 진행 중',
  },
  {
    id: 'm-07',
    name: '오바울',
    department: '교직원선교회',
    role: '교직원',
    phone: '010-5544-7788',
    email: 'paul.oh@school.ac.kr',
    avatarColor: 'bg-indigo-500',
    avatarText: '바울',
    currentReadingRound: 4,
    targetRounds: 12,
    currentBook: '로마서',
    currentChapter: 8,
    totalReadChapters: 1050,
    recordingsCount: 31,
    lastActive: '오늘 08:30',
    status: 'excellent',
    consecutiveDays: 32,
    featuredCount: 5,
    memo: '교직원 낭독 모임 인도자',
  },
  {
    id: 'm-08',
    name: '윤에스더',
    department: '장년 1교구',
    role: '권사',
    phone: '010-6677-8899',
    email: 'esther.yoon@logos.church',
    avatarColor: 'bg-pink-500',
    avatarText: '에스더',
    currentReadingRound: 2,
    targetRounds: 12,
    currentBook: '에스더',
    currentChapter: 4,
    totalReadChapters: 480,
    recordingsCount: 11,
    lastActive: '5일 전',
    status: 'warning',
    consecutiveDays: 0,
    featuredCount: 1,
    memo: '직장 출장으로 3일 연속 미참여, 안부 확인 필요',
  },
];

export const INITIAL_MEMBER_RECORDINGS: MemberRecordingItem[] = [
  {
    id: 'rec-m-1',
    memberId: 'm-01',
    memberName: '김은혜 권사',
    department: '청장년 성경통독부',
    role: '권사',
    title: '시편 23편 전체 은혜의 낭독',
    verseRef: '시편 23:1-6',
    passageSnippet: '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며...',
    duration: '01:24',
    date: '2026.09.13 06:30',
    isFeatured: true,
    status: 'approved',
    feedback: '차분하고 정돈된 목소리로 새벽 묵상에 큰 은혜가 됩니다.',
  },
  {
    id: 'rec-m-2',
    memberId: 'm-02',
    memberName: '박요셉 청년',
    department: '대학청년부',
    role: '청년',
    title: '창세기 1장 천지창조 선포 낭독',
    verseRef: '창세기 1:1-5',
    passageSnippet: '태초에 하나님이 천지를 창조하시니라 땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고...',
    duration: '01:15',
    date: '2026.09.13 19:15',
    isFeatured: true,
    status: 'approved',
    feedback: '힘있고 또렷한 청년의 목소리로 창조의 감동이 전해집니다.',
  },
  {
    id: 'rec-m-3',
    memberId: 'm-07',
    memberName: '오바울 교직원',
    department: '교직원선교회',
    role: '교직원',
    title: '로마서 8장 생명의 성령의 법',
    verseRef: '로마서 8:28-39',
    passageSnippet: '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여...',
    duration: '02:18',
    date: '2026.09.12 08:20',
    isFeatured: false,
    status: 'approved',
    feedback: '깊이 있는 묵상이 담긴 감동적인 낭독입니다.',
  },
  {
    id: 'rec-m-4',
    memberId: 'm-04',
    memberName: '최한나 집사',
    department: '주일학교 교사부',
    role: '집사',
    title: '시편 84편 주의 장막을 사모함',
    verseRef: '시편 84:1-12',
    passageSnippet: '만군의 여호와여 주의 장막이 어찌 그리 사랑스러운지요 내 영혼이 여호와의 궁정을 사모하여...',
    duration: '01:52',
    date: '2026.09.11 21:40',
    isFeatured: false,
    status: 'approved',
  },
  {
    id: 'rec-m-5',
    memberId: 'm-05',
    memberName: '정다윗 청년',
    department: '대학청년부',
    role: '청년',
    title: '출애굽기 3장 떨기나무 불꽃',
    verseRef: '출애굽기 3:1-10',
    passageSnippet: '여호와의 사자가 떨기나무 가운데로부터 나오는 불꽃 안에서 그에게 나타나시니라...',
    duration: '01:40',
    date: '2026.09.08 17:30',
    isFeatured: false,
    status: 'pending',
  },
];

export const INITIAL_CAMPAIGNS: ReadingCampaign[] = [
  {
    id: 'camp-1',
    title: '2026 전교인 성경 12독 대장정',
    description: '말씀의 반석 위에 굳게 서는 1년 12독 거룩한 통독 캠페인',
    targetScope: '구약 39권 · 신약 27권 전체 (12회 완독)',
    startDate: '2026.01.01',
    endDate: '2026.12.31',
    participantsCount: 248,
    avgProgress: 48,
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
    participantsCount: 165,
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
    participantsCount: 72,
    avgProgress: 100,
    isActive: false,
    badgeTag: '지혜서 정복',
  },
];
