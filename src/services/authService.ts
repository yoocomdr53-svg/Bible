import { User } from '../types';
import { MemberReadingProfile, INITIAL_MEMBERS } from '../data/adminData';

const SESSION_KEY = 'superbible_auth_session_v3';
const REGISTRY_KEY = 'superbible_user_registry_v1';
const ADMIN_MEMBERS_KEY = 'superbible_admin_members_v1';
const REMEMBERED_ID_KEY = 'superbible_remembered_id_v3';

export interface RegisteredAccount {
  loginId: string;
  passwordHash: string;
  user: User;
  createdAt: string;
}

// Built-in primary accounts
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
      ntProgress: 100,
      todayVersesRead: 10,
      recordingsCount: 25,
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
      ntProgress: 100,
      todayVersesRead: 10,
      recordingsCount: 25,
    },
    createdAt: '2026-01-01',
  },
  {
    loginId: 'yooc',
    passwordHash: '1234',
    user: {
      id: 'user-yooc',
      name: 'yooc (성도)',
      email: 'yooc.dev@gmail.com',
      avatarText: 'yooc',
      role: 'saint',
      provider: 'standard',
      schoolName: '로고스 수퍼바이블 공동체',
      department: '청장년 성경통독부',
      consecutiveDays: 14,
      ntProgress: 42,
      todayVersesRead: 4,
      recordingsCount: 7,
    },
    createdAt: '2026-01-01',
  },
];

// Load registry from localStorage
export function getRegisteredAccounts(): RegisteredAccount[] {
  try {
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
  // Initialize with default accounts
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
  } catch (e) {
    // ignore
  }
  return DEFAULT_ACCOUNTS;
}

// Save registry
function saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save registry:', e);
  }
}

// Append new member to Admin Member Roster (ADMIN_MEMBERS_KEY)
function syncMemberToAdminRoster(user: User, loginId: string): void {
  try {
    let currentMembers: MemberReadingProfile[] = INITIAL_MEMBERS;
    const raw = localStorage.getItem(ADMIN_MEMBERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        currentMembers = parsed;
      }
    }

    // Check if member already exists
    const exists = currentMembers.some(
      (m) => m.email.toLowerCase() === user.email.toLowerCase() || m.name === user.name
    );
    if (!exists) {
      const newMember: MemberReadingProfile = {
        id: `M-${String(currentMembers.length + 1).padStart(2, '0')}`,
        name: user.name,
        department: user.department || '새가족 성경통독부',
        role: user.role === 'admin' ? '관리자' : '성도',
        phone: '010-미등록',
        email: user.email,
        registeredDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
        birthdate: '1995.01.01',
        baptismStatus: '원입',
        smallGroup: '새가족 1구역',
        accountRole: user.role === 'admin' ? 'admin' : 'member',
        accountStatus: 'active',
        avatarColor: user.role === 'admin' ? 'bg-amber-500' : 'bg-blue-500',
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
        memo: `웹 간편가입 회원 (아이디: ${loginId})`,
      };
      const updatedMembers = [newMember, ...currentMembers];
      localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(updatedMembers));
    }
  } catch (e) {
    console.error('Failed to sync to admin roster:', e);
  }
}

// Register new member with simple ID/Email + Password
export function registerUser(
  loginIdInput: string,
  passwordInput: string
): { success: boolean; user?: User; message?: string } {
  const loginId = loginIdInput.trim();
  const password = passwordInput.trim();

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
    loginId.toLowerCase().includes('admin');

  const displayName = isAdmin
    ? '로고스 관리자'
    : loginId.includes('@')
    ? `${loginId.split('@')[0]} 성도`
    : `${loginId} 성도`;

  const userEmail = loginId.includes('@') ? loginId : `${loginId}@superbible.kr`;

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: displayName,
    email: userEmail,
    avatarText: loginId.slice(0, 2).toUpperCase(),
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

  // Sync to Admin Member Management Roster so admin can manage details
  syncMemberToAdminRoster(newUser, loginId);

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
    // Check password if stored, or allow for admin/demo
    if (
      matched.passwordHash &&
      matched.passwordHash !== password &&
      !loginId.toLowerCase().includes('yoocomdr') &&
      !loginId.toLowerCase().includes('admin')
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
      ntProgress: 100,
      todayVersesRead: 10,
      recordingsCount: 25,
    };
    if (rememberMe) saveRememberedId(loginId);
    saveActiveSession(adminUser, loginId);
    return { success: true, user: adminUser };
  }

  // 3. Graceful auto-creation for new user entering ID/Password on login form
  // (Ensures users are never blocked even if they skipped registration tab)
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

// Active session persistence (한 번 입력하면 새로고침/재방문 시에도 웹 그대로 유지)
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
        return data.user;
      }
    }
  } catch (e) {
    console.error('Failed to read session:', e);
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
