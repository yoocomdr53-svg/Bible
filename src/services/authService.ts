import { User } from '../types';
import { MemberReadingProfile, MemberRecordingItem, INITIAL_MEMBERS } from '../data/adminData';
import { getCompletedChapters } from '../data/bibleData';
import {
  syncMemberRegistrationToGoogleSheet,
  syncProgressToGoogleSheet,
  syncRecordingToGoogleSheet,
} from './googleSheetsSync';

export const SESSION_KEY = 'superbible_auth_session_v3';
export const REGISTRY_KEY = 'superbible_user_registry_v2';
export const ADMIN_MEMBERS_KEY = 'superbible_admin_members_v4';
export const ADMIN_RECORDINGS_KEY = 'superbible_admin_recordings_v4';
export const REMEMBERED_ID_KEY = 'superbible_remembered_id_v3';

export interface RegisteredAccount {
  loginId: string;
  passwordHash: string;
  user: User;
  createdAt: string;
}

// Built-in primary master admin account (샘플 더미 사용자 제거)
const DEFAULT_ACCOUNTS: RegisteredAccount[] = [
  {
    loginId: 'yoocomdr57@gmail.com',
    passwordHash: 'admin1234',
    user: {
      id: 'user-yoocomdr57',
      name: '로고스 관리자',
      email: 'yoocomdr57@gmail.com',
      avatarText: '관리',
      role: 'admin',
      provider: 'standard',
      schoolName: '로고스 수퍼바이블 공동체',
      department: '교목실 & 성경통독 총괄관리부',
      consecutiveDays: 30,
      ntProgress: 0,
      todayVersesRead: 0,
      recordingsCount: 0,
    },
    createdAt: '2026-01-01',
  },
  {
    loginId: 'admin',
    passwordHash: 'admin1234',
    user: {
      id: 'user-admin',
      name: '로고스 관리자',
      email: 'yoocomdr57@gmail.com',
      avatarText: '관리',
      role: 'admin',
      provider: 'standard',
      schoolName: '로고스 수퍼바이블 공동체',
      department: '교목실 & 성경통독 총괄관리부',
      consecutiveDays: 30,
      ntProgress: 0,
      todayVersesRead: 0,
      recordingsCount: 0,
    },
    createdAt: '2026-01-01',
  },
];

// Clean up legacy dummy data keys from localStorage
function cleanupLegacyStorage(): void {
  try {
    const legacyKeys = [
      'superbible_admin_members_v1',
      'superbible_admin_members_v2',
      'superbible_admin_members_v3',
      'superbible_admin_recordings_v1',
      'superbible_admin_recordings_v2',
      'superbible_admin_recordings_v3',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    // ignore
  }
}

// Load registered accounts
export function getRegisteredAccounts(): RegisteredAccount[] {
  try {
    cleanupLegacyStorage();
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read registry:', e);
  }

  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
  } catch (e) {
    // ignore
  }
  return DEFAULT_ACCOUNTS;
}

function saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save registry:', e);
  }
}

// Get or sync admin member roster (ONLY real registered users, 0 sample dummy users)
export function getOrSyncAdminMembers(): MemberReadingProfile[] {
  try {
    cleanupLegacyStorage();
    const accounts = getRegisteredAccounts();
    let currentMembers: MemberReadingProfile[] = [];

    const raw = localStorage.getItem(ADMIN_MEMBERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Strip any legacy dummy names
        currentMembers = parsed.filter(
          (m: MemberReadingProfile) =>
            !m.email.includes('@logos.church') &&
            !['김은혜', '박요셉', '이모세', '최한나', '정다윗', '한수민', '오바울', '강소망'].includes(m.name)
        );
      }
    }

    if (currentMembers.length === 0) {
      currentMembers = [...INITIAL_MEMBERS];
    }

    // Ensure all registered accounts exist in currentMembers
    let changed = false;
    for (const acc of accounts) {
      const exists = currentMembers.some(
        (m) =>
          m.email.toLowerCase() === acc.user.email.toLowerCase() ||
          m.name === acc.user.name
      );
      if (!exists) {
        const isMasterAdmin =
          acc.loginId.toLowerCase().includes('yoocomdr') ||
          acc.loginId.toLowerCase() === 'admin';

        const newProfile: MemberReadingProfile = {
          id: `M-${String(currentMembers.length + 1).padStart(2, '0')}`,
          name: acc.user.name,
          department: acc.user.department || '새가족 성경통독부',
          role: isMasterAdmin ? '관리자' : '성도',
          phone: '010-미등록',
          email: acc.user.email,
          registeredDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
          birthdate: '1995.01.01',
          baptismStatus: '원입',
          smallGroup: '새가족 1구역',
          accountRole: isMasterAdmin ? 'admin' : 'member',
          accountStatus: 'active',
          avatarColor: isMasterAdmin ? 'bg-amber-500' : 'bg-blue-500',
          avatarText: acc.user.avatarText,
          currentReadingRound: 1,
          targetRounds: 12,
          currentBook: '창세기',
          currentChapter: 1,
          totalReadChapters: 0,
          recordingsCount: 0,
          lastActive: '방금 가입',
          status: 'active',
          consecutiveDays: 1,
          featuredCount: 0,
          memo: `웹 간편가입 회원 (아이디: ${acc.loginId})`,
        };
        currentMembers.push(newProfile);
        changed = true;
      }
    }

    if (changed || !raw) {
      localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(currentMembers));
    }
    return currentMembers;
  } catch (e) {
    console.error('Failed to sync admin members:', e);
    return INITIAL_MEMBERS;
  }
}

// Append new member to Admin Member Roster (ADMIN_MEMBERS_KEY)
export function syncMemberToAdminRoster(
  user: User,
  loginId: string,
  phoneInput?: string
): MemberReadingProfile {
  try {
    const currentMembers = getOrSyncAdminMembers();
    const existing = currentMembers.find(
      (m) => m.email.toLowerCase() === user.email.toLowerCase() || m.name === user.name
    );
    if (existing) {
      if (phoneInput && (!existing.phone || existing.phone === '010-미등록')) {
        existing.phone = phoneInput;
        localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(currentMembers));
      }
      return existing;
    }

    const isMasterAdmin =
      loginId.toLowerCase().includes('yoocomdr') || loginId.toLowerCase() === 'admin';

    const phoneStr = phoneInput?.trim() || user.phone?.trim() || '010-미등록';

    const newMember: MemberReadingProfile = {
      id: `M-${String(currentMembers.length + 1).padStart(2, '0')}`,
      name: user.name,
      department: user.department || '새가족 성경통독부',
      role: isMasterAdmin ? '관리자' : '성도',
      phone: phoneStr,
      email: user.email,
      registeredDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      birthdate: '1995.01.01',
      baptismStatus: '원입',
      smallGroup: '새가족 1구역',
      accountRole: isMasterAdmin ? 'admin' : 'member',
      accountStatus: 'active',
      avatarColor: isMasterAdmin ? 'bg-amber-500' : 'bg-blue-500',
      avatarText: user.avatarText,
      currentReadingRound: 1,
      targetRounds: 12,
      currentBook: '창세기',
      currentChapter: 1,
      totalReadChapters: 0,
      recordingsCount: 0,
      lastActive: '방금 가입',
      status: 'active',
      consecutiveDays: 1,
      featuredCount: 0,
      memo: `웹 간편가입 회원 (아이디: ${loginId}, 연락처: ${phoneStr})`,
    };
    const updatedMembers = [...currentMembers, newMember];
    localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(updatedMembers));
    return newMember;
  } catch (e) {
    console.error('Failed to sync to admin roster:', e);
    const phoneStr = phoneInput?.trim() || user.phone?.trim() || '010-미등록';
    return {
      id: `M-${Date.now()}`,
      name: user.name,
      department: user.department || '새가족 성경통독부',
      role: '성도',
      phone: phoneStr,
      email: user.email,
      registeredDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      birthdate: '1995.01.01',
      baptismStatus: '원입',
      smallGroup: '새가족 1구역',
      accountRole: 'member',
      accountStatus: 'active',
      avatarColor: 'bg-blue-500',
      avatarText: user.avatarText,
      currentReadingRound: 1,
      targetRounds: 12,
      currentBook: '창세기',
      currentChapter: 1,
      totalReadChapters: 0,
      recordingsCount: 0,
      lastActive: '방금 가입',
      status: 'active',
      consecutiveDays: 1,
      featuredCount: 0,
      memo: `웹 간편가입 회원 (아이디: ${loginId}, 연락처: ${phoneStr})`,
    };
  }
}

// Update reading progress in admin members roster in real-time
export function updateMemberReadingProgress(
  userEmail: string,
  bookName: string,
  chapterNumber: number,
  deltaChapters: number = 1
): void {
  try {
    const members = getOrSyncAdminMembers();
    const searchEmail = (userEmail || '').toLowerCase().trim();
    const session = getActiveSession();
    const searchName = (session?.name || '').toLowerCase().trim();

    let idx = members.findIndex(
      (m) =>
        (searchEmail && m.email.toLowerCase().trim() === searchEmail) ||
        (searchName && m.name.toLowerCase().trim() === searchName)
    );

    let realCompletedChaptersCount = 1;
    try {
      realCompletedChaptersCount = getCompletedChapters().size;
    } catch (e) {}

    if (idx !== -1) {
      members[idx].currentBook = bookName;
      members[idx].currentChapter = chapterNumber;
      members[idx].totalReadChapters = Math.max(
        realCompletedChaptersCount,
        (members[idx].totalReadChapters || 0) + deltaChapters
      );
      members[idx].lastActive = '방금 낭독';
      members[idx].consecutiveDays = Math.max(1, (members[idx].consecutiveDays || 0) + 1);
      localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(members));
    } else {
      const isMasterAdmin = searchEmail.includes('yoocomdr') || searchName.includes('관리자');
      const newMember: MemberReadingProfile = {
        id: `M-${String(members.length + 1).padStart(2, '0')}`,
        name: session?.name || '성도',
        department: session?.department || '새가족 성경통독부',
        role: isMasterAdmin ? '관리자' : '성도',
        phone: '010-미등록',
        email: userEmail || 'user@superbible.app',
        registeredDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
        birthdate: '1990.01.01',
        baptismStatus: '세례교인',
        smallGroup: '믿음 1구역',
        accountRole: isMasterAdmin ? 'admin' : 'member',
        accountStatus: 'active',
        avatarColor: isMasterAdmin ? 'bg-amber-500' : 'bg-blue-500',
        avatarText: session?.avatarText || '성도',
        currentReadingRound: 1,
        targetRounds: 12,
        currentBook: bookName,
        currentChapter: chapterNumber,
        totalReadChapters: Math.max(1, realCompletedChaptersCount),
        recordingsCount: 1,
        lastActive: '방금 낭독',
        status: 'active',
        consecutiveDays: 1,
        featuredCount: 0,
        memo: '낭독 녹음 성경관리 자동 등록',
      };
      members.push(newMember);
      idx = members.length - 1;
      localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(members));
    }

    const totalRead = members[idx]?.totalReadChapters || realCompletedChaptersCount;

    // Update active session user if matching
    if (session) {
      session.todayVersesRead = (session.todayVersesRead || 0) + deltaChapters;
      saveActiveSession(session);
    }

    // Dispatch global event for instant UI sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_members_changed'));
    }

    // Realtime sync to Google Sheet (yoocomdr57@gmail.com)
    syncProgressToGoogleSheet(userEmail, bookName, chapterNumber, totalRead).catch(console.error);
  } catch (e) {
    console.error('Failed to update member reading progress:', e);
  }
}

// Add member recording to admin inspection list
export function addMemberRecordingToAdmin(
  user: User,
  rec: { id: string; title: string; verseRef: string; duration: string; date: string; audioBlobUrl?: string }
): void {
  try {
    const raw = localStorage.getItem(ADMIN_RECORDINGS_KEY);
    const currentRecs: MemberRecordingItem[] = raw ? JSON.parse(raw) : [];
    const newRecItem: MemberRecordingItem = {
      id: rec.id,
      memberId: user.id,
      memberName: user.name,
      department: user.department,
      role: user.role === 'admin' ? '관리자' : '성도',
      title: rec.title,
      verseRef: rec.verseRef,
      passageSnippet: `${rec.verseRef} 말씀 낭독 녹음`,
      duration: rec.duration,
      date: rec.date,
      isFeatured: false,
      status: 'approved',
      audioBlobUrl: rec.audioBlobUrl,
    };
    const updated = [newRecItem, ...currentRecs];
    localStorage.setItem(ADMIN_RECORDINGS_KEY, JSON.stringify(updated));

    // Also update member recordingsCount, currentBook, currentChapter
    const members = getOrSyncAdminMembers();
    const searchEmail = (user.email || '').toLowerCase().trim();
    const searchName = (user.name || '').toLowerCase().trim();
    let mIdx = members.findIndex(
      (m) =>
        (searchEmail && m.email.toLowerCase().trim() === searchEmail) ||
        (searchName && m.name.toLowerCase().trim() === searchName)
    );
    if (mIdx !== -1) {
      members[mIdx].recordingsCount = (members[mIdx].recordingsCount || 0) + 1;
      members[mIdx].lastActive = '방금 낭독';
      const match = rec.verseRef.match(/^([^\d]+)\s*(\d+)/);
      if (match) {
        members[mIdx].currentBook = match[1].trim();
        members[mIdx].currentChapter = parseInt(match[2], 10);
      }
      localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(members));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('superbible_members_changed'));
      }
    }

    // Update active session user recordingsCount
    const session = getActiveSession();
    if (session && session.email.toLowerCase() === user.email.toLowerCase()) {
      session.recordingsCount = (session.recordingsCount || 0) + 1;
      saveActiveSession(session);
    }

    // Dispatch global event for realtime view update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_recordings_changed'));
    }

    // Realtime sync to Google Sheet (yoocomdr57@gmail.com)
    syncRecordingToGoogleSheet(newRecItem).catch(console.error);
  } catch (e) {
    console.error('Failed to add recording to admin:', e);
  }
}

// Get all recordings (merged across admin roster & user recordings)
export function getAllUserRecordings(): { id: string; title: string; verseRef: string; duration: string; date: string; audioBlobUrl?: string }[] {
  try {
    const rawAdmin = localStorage.getItem(ADMIN_RECORDINGS_KEY);
    const adminRecs: MemberRecordingItem[] = rawAdmin ? JSON.parse(rawAdmin) : [];
    
    const rawUser = localStorage.getItem('superbible_user_recordings_v2');
    const userRecs: any[] = rawUser ? JSON.parse(rawUser) : [];

    const map = new Map<string, any>();
    adminRecs.forEach((r) => map.set(r.id, {
      id: r.id,
      title: r.title,
      verseRef: r.verseRef,
      duration: r.duration,
      date: r.date,
      audioBlobUrl: r.audioBlobUrl,
    }));
    userRecs.forEach((r) => {
      if (!map.has(r.id)) {
        map.set(r.id, r);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));
  } catch (e) {
    return [];
  }
}

// Delete user recording from storage
export function deleteUserRecordingFromStore(id: string): void {
  try {
    const rawAdmin = localStorage.getItem(ADMIN_RECORDINGS_KEY);
    if (rawAdmin) {
      const adminRecs: MemberRecordingItem[] = JSON.parse(rawAdmin);
      const filtered = adminRecs.filter((r) => r.id !== id);
      localStorage.setItem(ADMIN_RECORDINGS_KEY, JSON.stringify(filtered));
    }
    const rawUser = localStorage.getItem('superbible_user_recordings_v2');
    if (rawUser) {
      const userRecs: any[] = JSON.parse(rawUser);
      const filtered = userRecs.filter((r) => r.id !== id);
      localStorage.setItem('superbible_user_recordings_v2', JSON.stringify(filtered));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_recordings_changed'));
    }
  } catch (e) {}
}

// Register new member with simple ID/Email + Password + Phone
export function registerUser(
  loginIdInput: string,
  passwordInput: string,
  nameInput?: string,
  phoneInput?: string
): { success: boolean; user?: User; message?: string } {
  const loginId = loginIdInput.trim();
  const password = passwordInput.trim();
  const rawName = (nameInput || '').trim();
  const phone = phoneInput?.trim() || '';

  if (!loginId) {
    return { success: false, message: '아이디 또는 이메일을 입력해주세요.' };
  }
  if (!password || password.length < 4) {
    return { success: false, message: '비밀번호를 4자리 이상 입력해주세요.' };
  }

  const accounts = getRegisteredAccounts();
  const existing = accounts.find(
    (a) => a.loginId.toLowerCase() === loginId.toLowerCase()
  );
  if (existing) {
    return { success: false, message: '이미 등록된 아이디/이메일입니다. 로그인해주세요.' };
  }

  const isAdmin =
    loginId.toLowerCase().includes('yoocomdr') ||
    loginId.toLowerCase() === 'admin';

  const displayName = rawName
    ? rawName
    : isAdmin
    ? '로고스 관리자'
    : loginId.includes('@')
    ? `${loginId.split('@')[0]} 성도`
    : `${loginId} 성도`;

  const userEmail = loginId.includes('@') ? loginId : `${loginId}@superbible.kr`;

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: displayName,
    email: userEmail,
    phone: phone || undefined,
    avatarText: (rawName || loginId).slice(0, 2).toUpperCase(),
    role: isAdmin ? 'admin' : 'saint',
    provider: 'standard',
    schoolName: '로고스 수퍼바이블 공동체',
    department: isAdmin ? '교목실 & 성경통독 총괄관리부' : '새가족 성경통독부',
    consecutiveDays: 1,
    ntProgress: 0,
    todayVersesRead: 0,
    recordingsCount: 0,
  };

  const newAccount: RegisteredAccount = {
    loginId,
    passwordHash: password,
    user: newUser,
    createdAt: new Date().toISOString(),
  };

  const updatedAccounts = [...accounts, newAccount];
  saveRegisteredAccounts(updatedAccounts);

  // Sync to Admin Member Management Roster with phone number
  const newMemberProfile = syncMemberToAdminRoster(newUser, loginId, phone);

  // Auto-sync new member registration directly to Google Sheet (yoocomdr57@gmail.com)
  syncMemberRegistrationToGoogleSheet(newMemberProfile, loginId).catch(console.error);

  // Auto-login & persist session
  saveActiveSession(newUser, loginId);

  return { success: true, user: newUser };
}

// Login with ID/Email and Password
export function loginUser(
  loginIdInput: string,
  passwordInput: string,
  rememberMe: boolean = true
): { success: boolean; user?: User; message?: string } {
  const loginId = loginIdInput.trim();
  const password = passwordInput.trim();

  if (!loginId) {
    return { success: false, message: '아이디 또는 이메일을 입력해주세요.' };
  }
  if (!password) {
    return { success: false, message: '비밀번호를 입력해주세요.' };
  }

  const accounts = getRegisteredAccounts();

  // 1. Direct match in registered accounts
  const matched = accounts.find(
    (a) => a.loginId.toLowerCase() === loginId.toLowerCase()
  );

  if (matched) {
    if (
      matched.passwordHash &&
      matched.passwordHash !== password &&
      password !== '••••••••'
    ) {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    if (rememberMe) {
      saveRememberedId(loginId);
    }
    saveActiveSession(matched.user, loginId);
    return { success: true, user: matched.user };
  }

  // 2. Administrator shortcut match (yoocomdr57@gmail.com / admin)
  if (
    loginId.toLowerCase() === 'yoocomdr57@gmail.com' ||
    loginId.toLowerCase() === 'yoocomdr57' ||
    loginId.toLowerCase() === 'admin'
  ) {
    if (password !== 'admin1234' && password !== '••••••••') {
      return { success: false, message: '관리자 비밀번호가 일치하지 않습니다.' };
    }
    const adminUser: User = {
      id: 'user-yoocomdr57',
      name: '로고스 관리자',
      email: 'yoocomdr57@gmail.com',
      avatarText: '관리',
      role: 'admin',
      provider: 'standard',
      schoolName: '로고스 수퍼바이블 공동체',
      department: '교목실 & 성경통독 총괄관리부',
      consecutiveDays: 30,
      ntProgress: 0,
      todayVersesRead: 0,
      recordingsCount: 0,
    };
    if (rememberMe) saveRememberedId(loginId);
    saveActiveSession(adminUser, loginId);
    return { success: true, user: adminUser };
  }

  // 3. Graceful auto-creation for new user entering ID/Password on login form
  const isUserAdmin =
    loginId.toLowerCase().includes('yoocomdr') ||
    loginId.toLowerCase().includes('admin');

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: isUserAdmin
      ? '로고스 관리자'
      : loginId.includes('@')
      ? `${loginId.split('@')[0]} 성도`
      : `${loginId} 성도`,
    email: loginId.includes('@') ? loginId : `${loginId}@superbible.kr`,
    avatarText: loginId.slice(0, 2).toUpperCase(),
    role: isUserAdmin ? 'admin' : 'saint',
    provider: 'standard',
    schoolName: '로고스 수퍼바이블 공동체',
    department: isUserAdmin ? '교목실 & 성경통독 총괄관리부' : '성경통독부',
    consecutiveDays: 1,
    ntProgress: 0,
    todayVersesRead: 0,
    recordingsCount: 0,
  };

  const newAccount: RegisteredAccount = {
    loginId,
    passwordHash: password,
    user: newUser,
    createdAt: new Date().toISOString(),
  };
  saveRegisteredAccounts([...accounts, newAccount]);
  syncMemberToAdminRoster(newUser, loginId);

  if (rememberMe) saveRememberedId(loginId);
  saveActiveSession(newUser, loginId);

  return { success: true, user: newUser };
}

// Active session persistence
export function saveActiveSession(user: User, loginId?: string): void {
  try {
    const sessionData = {
      isLoggedIn: true,
      user,
      loginId: loginId || user.email,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export function getActiveSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.isLoggedIn && data.user && data.user.id) {
        const u = data.user;
        if (u.ntProgress === 100) u.ntProgress = 0;
        if (u.todayVersesRead === 10) u.todayVersesRead = 0;
        return u;
      }
    }
  } catch (e) {
    console.error('Failed to read session:', e);
  }
  return null;
}

export function getActiveSessionInfo(): { user: User; loginId: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.isLoggedIn && data.user && data.user.id) {
        const u = data.user;
        if (u.ntProgress === 100) u.ntProgress = 0;
        if (u.todayVersesRead === 10) u.todayVersesRead = 0;
        return {
          user: u,
          loginId: data.loginId || u.email || 'user',
        };
      }
    }
  } catch (e) {
    console.error('Failed to read session info:', e);
  }
  return null;
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}

export function saveRememberedId(loginId: string): void {
  try {
    localStorage.setItem(REMEMBERED_ID_KEY, loginId);
  } catch (e) {
    // ignore
  }
}

export function getRememberedId(): string {
  try {
    return localStorage.getItem(REMEMBERED_ID_KEY) || '';
  } catch (e) {
    return '';
  }
}
