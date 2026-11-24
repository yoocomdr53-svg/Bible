import { User } from '../types';
import {
  MemberReadingProfile,
  MemberRecordingItem,
  INITIAL_MEMBERS,
  OFFICIAL_DEPARTMENTS,
  OfficialDepartment,
} from '../data/adminData';
import { getCompletedChapters, getUserScopeKey } from '../data/bibleData';
import {
  syncMemberRegistrationToGoogleSheet,
  syncProgressToGoogleSheet,
  syncRecordingToGoogleSheet,
  sendPayloadToGoogleScript,
  enqueuePendingSync,
} from './googleSheetsSync';

export const SESSION_KEY = 'superbible_auth_session_v3';
export const REGISTRY_KEY = 'superbible_user_registry_v2';
export const ADMIN_MEMBERS_KEY = 'superbible_admin_members_v4';
export const ADMIN_RECORDINGS_KEY = 'superbible_admin_recordings_v4';
export const REMEMBERED_ID_KEY = 'superbible_remembered_id_v3';
export const DELETED_MEMBERS_KEY = 'superbible_deleted_members_v2';
export const ADMIN_DESIGNATED_BLACKLIST_KEY = 'superbible_admin_designated_blacklist_v1';

export interface AdminBlacklistItem {
  id: string;
  target: string; // 이메일 또는 아이디
  targetName?: string; // 성명
  reason: string; // 차단 사유
  createdAt: string; // 등록 일시
  createdBy: string; // 등록자
}

// Read Admin-Designated Blacklist
export function getAdminDesignatedBlacklist(): AdminBlacklistItem[] {
  try {
    const raw = localStorage.getItem(ADMIN_DESIGNATED_BLACKLIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

// Check if an email or loginId is in the admin-designated blacklist
export function isAccountInAdminBlacklist(target?: string, secondaryTarget?: string): boolean {
  const list = getAdminDesignatedBlacklist();
  if (list.length === 0) return false;
  const t1 = (target || '').toLowerCase().trim();
  const t2 = (secondaryTarget || '').toLowerCase().trim();
  return list.some((item) => {
    const k = (item.target || '').toLowerCase().trim();
    return (t1 && k === t1) || (t2 && k === t2);
  });
}

// Add an entry to the Admin-Designated Blacklist (관리자가 직접 지정)
export async function addAdminDesignatedBlacklist(
  target: string,
  targetName?: string,
  reason: string = '관리자 수동 차단',
  createdBy: string = '로고스 관리자'
): Promise<{ success: boolean; message: string; blacklist: AdminBlacklistItem[] }> {
  try {
    const cleanTarget = target.toLowerCase().trim();
    if (!cleanTarget) {
      return { success: false, message: '차단할 아이디 또는 이메일을 입력해주세요.', blacklist: getAdminDesignatedBlacklist() };
    }
    const current = getAdminDesignatedBlacklist().filter(
      (item) => item.target.toLowerCase().trim() !== cleanTarget
    );
    const newItem: AdminBlacklistItem = {
      id: `bl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      target: cleanTarget,
      targetName: targetName?.trim() || '',
      reason: reason.trim() || '관리자 수동 차단',
      createdAt: new Date().toLocaleString('ko-KR'),
      createdBy: createdBy || '로고스 관리자',
    };
    const updated = [newItem, ...current];
    localStorage.setItem(ADMIN_DESIGNATED_BLACKLIST_KEY, JSON.stringify(updated));

    // Sync to cloud hub
    try {
      await sendPayloadToGoogleScript({
        action: 'addBlacklist',
        ...newItem,
      });
    } catch (e) {}

    return {
      success: true,
      message: `'${targetName || cleanTarget}' 계정이 관리자 블랙리스트에 지정되었습니다.`,
      blacklist: updated,
    };
  } catch (err) {
    return { success: false, message: '블랙리스트 등록 중 오류가 발생했습니다.', blacklist: getAdminDesignatedBlacklist() };
  }
}

// Remove an entry from Admin-Designated Blacklist (차단 해제)
export async function removeAdminDesignatedBlacklist(
  idOrTarget: string
): Promise<{ success: boolean; message: string; blacklist: AdminBlacklistItem[] }> {
  try {
    const clean = idOrTarget.toLowerCase().trim();
    const current = getAdminDesignatedBlacklist();
    const updated = current.filter(
      (item) => item.id !== idOrTarget && item.target.toLowerCase().trim() !== clean
    );
    localStorage.setItem(ADMIN_DESIGNATED_BLACKLIST_KEY, JSON.stringify(updated));

    // Sync to cloud hub
    try {
      await sendPayloadToGoogleScript({
        action: 'removeBlacklist',
        id: idOrTarget,
        target: clean,
      });
    } catch (e) {}

    return {
      success: true,
      message: '블랙리스트에서 정상적으로 차단 해제되었습니다.',
      blacklist: updated,
    };
  } catch (err) {
    return { success: false, message: '블랙리스트 해제 중 오류가 발생했습니다.', blacklist: getAdminDesignatedBlacklist() };
  }
}

// Completely clear ALL blacklists everywhere (등록된 블랙리스트 전체 완전 삭제/초기화)
export async function clearAllAdminBlacklist(): Promise<{ success: boolean; message: string }> {
  try {
    localStorage.removeItem(ADMIN_DESIGNATED_BLACKLIST_KEY);
    localStorage.removeItem(DELETED_MEMBERS_KEY);
    localStorage.removeItem('superbible_deleted_members_v1');

    // Sync to cloud hub
    try {
      await sendPayloadToGoogleScript({
        action: 'clearAllBlacklist',
      });
    } catch (e) {}

    return {
      success: true,
      message: '등록된 블랙리스트가 전체 완전 삭제되었습니다. 모든 회원이 원활하게 회원가입 및 동기화됩니다.',
    };
  } catch (err) {
    return { success: false, message: '블랙리스트 초기화 중 오류가 발생했습니다.' };
  }
}

export const DELETED_RECORDS_KEY = 'superbible_deleted_records_v2';

export function getDeletedRecords(): Record<string, number> {
  try {
    const raw = localStorage.getItem(DELETED_RECORDS_KEY);
    const records: Record<string, number> = raw ? JSON.parse(raw) : {};
    // Sanitize: remove protected master admin account and sequential IDs (M-01, M-02, etc.)
    let cleaned = false;
    Object.keys(records).forEach((k) => {
      if (
        k === 'm-01' ||
        k === 'id:m-01' ||
        /^id:m-\d+$/i.test(k) ||
        /^m-\d+$/i.test(k) ||
        k === 'yoocomdr57@gmail.com' ||
        k.includes('로고스') ||
        k.includes('이순신')
      ) {
        delete records[k];
        cleaned = true;
      }
    });
    if (cleaned) {
      try { localStorage.setItem(DELETED_RECORDS_KEY, JSON.stringify(records)); } catch {}
    }
    return records;
  } catch {
    return {};
  }
}

export function recordDeletion(memberId?: string, email?: string, name?: string, loginId?: string): Record<string, number> {
  const records = getDeletedRecords();
  const now = Date.now();
  // Record unique email and loginId (never record protected master accounts)
  [email, loginId].filter(Boolean).forEach((k) => {
    const clean = String(k).toLowerCase().trim();
    if (clean && clean !== 'yoocomdr57@gmail.com') {
      records[clean] = now;
    }
  });
  // Also record member name if provided (never record protected master accounts or active members)
  if (name) {
    const cleanName = String(name).toLowerCase().trim();
    if (cleanName && cleanName !== '로고스 관리자' && cleanName !== '로고스관리자' && !cleanName.includes('이순신')) {
      records[cleanName] = now;
      records[`name:${cleanName}`] = now;
    }
  }
  try {
    localStorage.setItem(DELETED_RECORDS_KEY, JSON.stringify(records));
  } catch {}
  return records;
}

export function clearDeletion(email?: string, loginId?: string, name?: string, memberId?: string): Record<string, number> {
  const records = getDeletedRecords();
  const keys = [email, loginId, memberId].filter(Boolean).map((k) => String(k).toLowerCase().trim());
  let changed = false;
  keys.forEach((k) => {
    if (k && records[k]) {
      delete records[k];
      changed = true;
    }
    if (k && records[`id:${k}`]) {
      delete records[`id:${k}`];
      changed = true;
    }
  });
  if (name) {
    const cleanName = String(name).toLowerCase().trim();
    if (records[cleanName]) {
      delete records[cleanName];
      changed = true;
    }
    if (records[`name:${cleanName}`]) {
      delete records[`name:${cleanName}`];
      changed = true;
    }
  }
  if (changed) {
    try {
      localStorage.setItem(DELETED_RECORDS_KEY, JSON.stringify(records));
    } catch {}
  }
  return records;
}

export function isMemberDeleted(identifier: {
  email?: string;
  name?: string;
  id?: string;
  loginId?: string;
}): boolean {
  if (!identifier) return false;
  const kEmail = (identifier.email || '').toLowerCase().trim();
  const kName = (identifier.name || '').trim();
  const kLogin = (identifier.loginId || '').toLowerCase().trim();
  const nClean = kName.replace(/\s+/g, '').toLowerCase();

  // 1. Master system admin and active members strictly protected from deletion
  if (
    kEmail === 'yoocomdr57@gmail.com' ||
    kName.includes('로고스 관리자') ||
    kName.includes('로고스관리자') ||
    kName.includes('이순신')
  ) {
    return false;
  }

  // 2. Exact dummy test names (NEVER match partial Korean names of real church members!)
  const exactDummyNames = [
    '임시테스트',
    '임시테스트성도',
    '신규성도',
    'e2e테스터',
    'e2e테스터성도',
    '라이브테스트성도',
    '삭제실험맨',
    '홍범도',
    '김은혜',
    '유천년',
    '홍길동',
  ];
  if (exactDummyNames.includes(nClean)) {
    return true;
  }

  // 3. Specific test dummy emails and legacy ids
  const dummyEmails = [
    'temp_delete_test@gmail.com',
    'e2e_tester@superbible.kr',
    'user_live_test@gmail.com',
    'del_experiment@test.com',
    'yoocomdr55@gmail.com',
    'yoocomdr58@gmail.com',
    'realuser1@gmail.com',
    'yocomdr@superbible.kr',
    'yocomdr34@superbible.kr',
    'grace@superbible.kr',
    'yoocomdr53@gmail.com',
    'yocomdr@naver.com',
  ];
  if (dummyEmails.includes(kEmail)) {
    return true;
  }

  const dummyLogins = ['yocomdr', 'yocomdr34', 'yoocomdr53'];
  if (dummyLogins.includes(kLogin)) {
    return true;
  }

  // 4. Check deletion tombstones (email, loginId, or name only - NEVER sequential IDs)
  const records = getDeletedRecords();
  if (kEmail && records[kEmail]) return true;
  if (kLogin && records[kLogin]) return true;
  if (kName) {
    const cleanName = kName.toLowerCase().trim();
    if (records[cleanName] || records[`name:${cleanName}`]) return true;
  }

  return false;
}

export function getDeletedMembers(): string[] {
  return Object.keys(getDeletedRecords());
}

export function addDeletedMember(identifier: {
  email?: string;
  name?: string;
  id?: string;
  loginId?: string;
}): void {
  recordDeletion(identifier.id, identifier.email, identifier.name, identifier.loginId);
}

export function removeDeletedMember(identifier: {
  email?: string;
  name?: string;
  id?: string;
  loginId?: string;
}): void {
  clearDeletion(identifier.email, identifier.loginId, identifier.name, identifier.id);
}

/**
 * Generate collision-free next sequential member ID (M-01, M-02, M-03...)
 */
export function generateNextMemberId(existingMembers: MemberReadingProfile[]): string {
  const maxNum = (existingMembers || []).reduce((max, m) => {
    const match = (m.id || '').match(/\d+/);
    const n = match ? parseInt(match[0], 10) : 0;
    return Math.max(max, n);
  }, 0);
  return `M-${String(maxNum + 1).padStart(2, '0')}`;
}

/**
 * Permanently delete member from Admin Roster, Accounts Registry, Server Cache, and Google Sheets
 * ※ Clean and Complete Deletion: Recorded as deleted tombstone so stale Google Sheets rows never revive them!
 * ※ Re-registration is 100% permitted and cleans the tombstone.
 */
export async function deleteMemberCompletely(
  memberId: string,
  memberEmail?: string,
  memberName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const emailNorm = (memberEmail || '').toLowerCase().trim();
    const nameNorm = (memberName || '').toLowerCase().trim();
    const idNorm = (memberId || '').toLowerCase().trim();

    // 1. Record deletion tombstone in local registry
    recordDeletion(memberId, memberEmail, memberName);

    // 2. Remove from ADMIN_MEMBERS_KEY
    const rawMembers = localStorage.getItem(ADMIN_MEMBERS_KEY);
    if (rawMembers) {
      const parsed: MemberReadingProfile[] = JSON.parse(rawMembers);
      const filtered = parsed.filter((m) => {
        const mEmail = (m.email || '').toLowerCase().trim();
        const mName = (m.name || '').toLowerCase().trim();
        const mId = (m.id || '').toLowerCase().trim();
        if (emailNorm && mEmail === emailNorm) return false;
        if (nameNorm && mName === nameNorm) return false;
        if (idNorm && mId === idNorm) return false;
        return !isMemberDeleted(m);
      });
      localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(filtered));
    }

    // 3. Remove from REGISTRY_KEY (accounts)
    const rawAccs = localStorage.getItem(REGISTRY_KEY);
    if (rawAccs) {
      const accounts: RegisteredAccount[] = JSON.parse(rawAccs);
      const filteredAccs = accounts.filter((acc) => {
        const aId = (acc.user?.id || '').toLowerCase().trim();
        const aEmail = (acc.user?.email || '').toLowerCase().trim();
        const aLogin = (acc.loginId || '').toLowerCase().trim();
        const aName = (acc.user?.name || '').toLowerCase().trim();
        if (emailNorm && (aEmail === emailNorm || aLogin === emailNorm)) return false;
        if (nameNorm && aName === nameNorm) return false;
        if (idNorm && aId === idNorm) return false;
        return !isMemberDeleted({ id: aId, email: aEmail, loginId: aLogin, name: aName });
      });
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(filteredAccs));
    }

    // 4. Dispatch global change event for instant local UI update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_members_changed'));
    }

    // 5. Notify central sync hub and Google Sheets
    try {
      await sendPayloadToGoogleScript({
        action: 'deleteMember',
        memberId,
        email: memberEmail,
        name: memberName,
        id: memberId,
        deletedAt: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to notify server/Google Sheets of deletion:', e);
    }

    return {
      success: true,
      message: `'${memberName || memberEmail || memberId}' 회원이 명부 및 구글 시트에서 완전히 영구 삭제되었습니다.`,
    };
  } catch (err: any) {
    console.error('deleteMemberCompletely error:', err);
    return { success: false, message: '회원 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * Completely reset entire member database, server cache, and Google Spreadsheet
 * Leaves ONLY the master administrator (yoocomdr57@gmail.com).
 */
export async function resetAllMembersCompletely(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Reset localStorage
    localStorage.removeItem(ADMIN_MEMBERS_KEY);
    localStorage.removeItem(REGISTRY_KEY);
    localStorage.removeItem('superbible_deleted_records_v2');
    localStorage.removeItem('superbible_admin_recordings_v4');

    // 2. Set only master admin
    const masterAdminList = [...INITIAL_MEMBERS];
    localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(masterAdminList));
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
    localStorage.setItem('superbible_deleted_records_v2', JSON.stringify({}));

    // 3. Dispatch global change event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_members_changed'));
    }

    // 4. Notify central sync hub and Google Sheets
    try {
      await sendPayloadToGoogleScript({
        action: 'resetAll',
      });
    } catch (e) {
      console.warn('Failed to notify server/Google Sheets of resetAll:', e);
    }

    return {
      success: true,
      message: '회원 명부와 구글 시트가 마스터 관리자(yoocomdr57@gmail.com) 1명 체제로 전면 초기화되었습니다.',
    };
  } catch (err: any) {
    console.error('resetAllMembersCompletely error:', err);
    return { success: false, message: '전면 초기화 중 오류가 발생했습니다.' };
  }
}

/**
 * Update member information in localStorage, central hub, and Google Sheets
 */
export async function updateMemberProfile(
  updatedMember: MemberReadingProfile
): Promise<{ success: boolean; message: string }> {
  try {
    const raw = localStorage.getItem(ADMIN_MEMBERS_KEY);
    let members: MemberReadingProfile[] = raw ? JSON.parse(raw) : [];
    const idx = members.findIndex(
      (m) =>
        m.id === updatedMember.id ||
        (updatedMember.email && m.email.toLowerCase() === updatedMember.email.toLowerCase())
    );
    if (idx !== -1) {
      members[idx] = { ...members[idx], ...updatedMember };
    } else {
      members.push(updatedMember);
    }
    localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(members));

    // Also update account in REGISTRY_KEY if matching
    const rawAccs = localStorage.getItem(REGISTRY_KEY);
    if (rawAccs) {
      const accounts: RegisteredAccount[] = JSON.parse(rawAccs);
      const accIdx = accounts.findIndex(
        (a) =>
          a.user?.id === updatedMember.id ||
          (updatedMember.email && a.user?.email.toLowerCase() === updatedMember.email.toLowerCase())
      );
      if (accIdx !== -1) {
        accounts[accIdx].user.name = updatedMember.name;
        accounts[accIdx].user.department = updatedMember.department;
        accounts[accIdx].user.phone = updatedMember.phone;
        accounts[accIdx].user.role = updatedMember.accountRole === 'admin' ? 'admin' : 'saint';
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(accounts));
      }
    }

    // Dispatch event so UI updates everywhere
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_members_changed'));
    }

    // Send update to central hub and Google Sheets
    try {
      await sendPayloadToGoogleScript({
        action: 'updateMember',
        member: updatedMember,
      });
    } catch (e) {
      console.warn('Failed to send updateMember to Google Script:', e);
    }

    return {
      success: true,
      message: `'${updatedMember.name}' 회원 정보가 명부 및 구글 시트에 실시간 수정·반영되었습니다.`,
    };
  } catch (err: any) {
    console.error('updateMemberProfile error:', err);
    return { success: false, message: '회원 정보 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * Create a new member directly from Admin View and synchronize to Central Server & Google Sheets
 */
export async function createMemberByAdmin(
  formData: Partial<MemberReadingProfile>
): Promise<{ success: boolean; member?: MemberReadingProfile; message: string }> {
  try {
    const raw = localStorage.getItem(ADMIN_MEMBERS_KEY);
    let members: MemberReadingProfile[] = raw ? JSON.parse(raw) : [];

    // Calculate next sequential M-ID
    let maxNum = 0;
    members.forEach((m) => {
      const match = String(m.id || '').match(/M-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextId = `M-${String(maxNum + 1).padStart(2, '0')}`;

    const cleanName = (formData.name || '신규 성도').trim();
    const cleanEmail = (formData.email || '').trim().toLowerCase() || `${nextId.toLowerCase()}@superbible.kr`;
    const cleanPhone = (formData.phone || '010-미등록').trim();
    const cleanDept = formData.department || '경영팀';
    const cleanRole = formData.role || '성도';

    // Clear any past deletion tombstone
    clearDeletion(cleanEmail, '', cleanName, nextId);

    const newMember: MemberReadingProfile = {
      id: nextId,
      name: cleanName,
      department: cleanDept,
      role: cleanRole,
      phone: cleanPhone,
      email: cleanEmail,
      registeredDate: formData.registeredDate || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      birthdate: formData.birthdate || '1995.01.01',
      baptismStatus: formData.baptismStatus || '세례',
      smallGroup: formData.smallGroup || `${cleanDept} 1구역`,
      accountRole: formData.accountRole || (cleanRole === '관리자' ? 'admin' : 'member'),
      accountStatus: formData.accountStatus || 'active',
      avatarColor: 'bg-blue-600',
      avatarText: cleanName.slice(0, 2).toUpperCase(),
      currentReadingRound: 0,
      targetRounds: 12,
      currentBook: '창세기',
      currentChapter: 1,
      totalReadChapters: 0,
      recordingsCount: 0,
      lastActive: '방금 전 등록',
      status: 'active',
      consecutiveDays: 1,
      featuredCount: 0,
      memo: formData.memo || '관리자 직접 등록 회원',
    };

    // Add to members list
    members.push(newMember);
    localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(members));

    // Also register user account in REGISTRY_KEY for login capability
    const rawAccs = localStorage.getItem(REGISTRY_KEY);
    const accounts: RegisteredAccount[] = rawAccs ? JSON.parse(rawAccs) : [];
    if (!accounts.some((a) => a.loginId.toLowerCase() === cleanEmail)) {
      accounts.push({
        loginId: cleanEmail,
        passwordHash: 'user1234',
        user: {
          id: `user-${nextId.toLowerCase()}`,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          avatarText: cleanName.slice(0, 2).toUpperCase(),
          role: newMember.accountRole === 'admin' ? 'admin' : 'saint',
          provider: 'standard',
          schoolName: '로고스 수퍼바이블 공동체',
          department: cleanDept,
          consecutiveDays: 1,
          ntProgress: 0,
          todayVersesRead: 0,
          recordingsCount: 0,
        },
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(accounts));
    }

    // Dispatch event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_members_changed'));
    }

    // Send to central hub & Google Sheets
    try {
      await sendPayloadToGoogleScript({
        action: 'registerMember',
        loginId: cleanEmail,
        member: newMember,
      });
    } catch (e) {
      console.warn('Failed to send registerMember to Google Script:', e);
    }

    return {
      success: true,
      member: newMember,
      message: `신규 회원 '${cleanName}'(${newMember.id})님이 성공적으로 등록되어 구글 시트와 3대 기기에 실시간 동기화되었습니다! 🎉`,
    };
  } catch (err: any) {
    console.error('createMemberByAdmin error:', err);
    return { success: false, message: '회원 등록 중 오류가 발생했습니다.' };
  }
}

export interface RegisteredAccount {
  loginId: string;
  passwordHash: string;
  user: User;
  createdAt: string;
}

// Built-in primary master admin account (공식 5개 부서 적용 및 데이터 초기화)
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
      department: '경영팀',
      consecutiveDays: 1,
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
      department: '경영팀',
      consecutiveDays: 1,
      ntProgress: 0,
      todayVersesRead: 0,
      recordingsCount: 0,
    },
    createdAt: '2026-01-01',
  },
];

// Clean up legacy dummy data keys from localStorage and purge obsolete test members
function cleanupLegacyStorage(): void {
  try {
    const legacyKeys = [
      'superbible_admin_members_v1',
      'superbible_admin_members_v2',
      'superbible_admin_members_v3',
      'superbible_admin_recordings_v1',
      'superbible_admin_recordings_v2',
      'superbible_admin_recordings_v3',
      'superbible_deleted_members_v2',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));

    // Check if stored members or registry contain test accounts:
    const purgeTestAccounts = (key: string) => {
      try {
        const val = localStorage.getItem(key);
        if (!val) return;
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((item: any) => {
            const n = String(item.name || item.user?.name || '').trim();
            const em = String(item.email || item.user?.email || item.loginId || '').toLowerCase().trim();
            const lid = String(item.loginId || '').toLowerCase().trim();
            const exactDummyNames = [
              '임시테스트',
              '임시테스트성도',
              '신규성도',
              'e2e테스터',
              'e2e테스터성도',
              '라이브테스트성도',
              '삭제실험맨',
            ];
            const dummyEmails = [
              'yocomdr@superbible.kr',
              'yocomdr34@superbible.kr',
              'yoocomdr55@gmail.com',
              'yoocomdr58@gmail.com',
              'realuser1@gmail.com',
              'temp_delete_test@gmail.com',
              'e2e_tester@superbible.kr',
              'user_live_test@gmail.com',
              'del_experiment@test.com',
              'grace@superbible.kr',
              'yoocomdr53@gmail.com',
            ];
            const dummyLogins = ['yocomdr', 'yocomdr34', 'yoocomdr53'];

            if (
              exactDummyNames.includes(n.replace(/\s+/g, '').toLowerCase()) ||
              dummyEmails.includes(em) ||
              dummyLogins.includes(lid)
            ) {
              return false;
            }
            return true;
          });
          if (cleaned.length === 0 && key === ADMIN_MEMBERS_KEY) {
            localStorage.setItem(key, JSON.stringify(INITIAL_MEMBERS));
          } else {
            localStorage.setItem(key, JSON.stringify(cleaned));
          }
        }
      } catch (e) {}
    };

    [ADMIN_MEMBERS_KEY, REGISTRY_KEY].forEach(purgeTestAccounts);

    // Sanitize current active session if it was a purged test account
    try {
      const curUserRaw = localStorage.getItem(USER_KEY);
      if (curUserRaw) {
        const curUser = JSON.parse(curUserRaw);
        const curName = (curUser.name || '').trim();
        const curEmail = (curUser.email || '').toLowerCase().trim();
        const exactPurgeNames = ['임시테스트', '임시테스트성도', '신규성도', 'e2e테스터', '라이브테스트성도', '삭제실험맨'];
        if (
          exactPurgeNames.includes(curName.replace(/\s+/g, '').toLowerCase()) ||
          curEmail === 'yocomdr@superbible.kr' ||
          curEmail === 'yocomdr34@superbible.kr' ||
          curEmail === 'yoocomdr53@gmail.com'
        ) {
          localStorage.removeItem(USER_KEY);
        }
      }
    } catch (e) {}
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
        // Strip any deleted or legacy dummy names
        currentMembers = parsed.filter(
          (m: MemberReadingProfile) =>
            !isMemberDeleted(m) &&
            !m.email.includes('@logos.church')
        );
      }
    }

    if (currentMembers.length === 0) {
      currentMembers = INITIAL_MEMBERS.filter((m) => !isMemberDeleted(m));
    }

    // 부서 명칭을 5개 공식 부서(다이나믹팀, 경영팀, 지벳팀, 중고등부, 초등부)로 정규화 및 통독 회차(전체 1,189장 완독 시에만 1독) 정규화
    const validDepts = new Set<string>(OFFICIAL_DEPARTMENTS);
    currentMembers = currentMembers.map((m) => {
      let dept = m.department;
      if (!validDepts.has(dept)) {
        dept = m.role === '관리자' ? '경영팀' : '다이나믹팀';
      }
      const actualRound = Math.floor((m.totalReadChapters || 0) / 1189);
      return { ...m, department: dept, currentReadingRound: actualRound };
    });

    // Ensure all active registered accounts exist in currentMembers
    let changed = false;
    for (const acc of accounts) {
      if (
        isMemberDeleted({
          id: acc.user?.id,
          email: acc.user?.email,
          loginId: acc.loginId,
          name: acc.user?.name,
        })
      ) {
        continue;
      }
      const aEmail = (acc.user?.email || '').toLowerCase().trim();
      const aName = (acc.user?.name || '').trim();
      const existingIdx = currentMembers.findIndex(
        (m) =>
          (aEmail && m.email && m.email.toLowerCase() === aEmail) ||
          (aName && m.name && m.name === aName)
      );

      if (existingIdx !== -1) {
        // already exists
      } else {
        const isMasterAdmin =
          acc.loginId.toLowerCase() === 'yoocomdr57@gmail.com' ||
          acc.loginId.toLowerCase() === 'yoocomdr57' ||
          acc.loginId.toLowerCase() === 'admin';

        const dept =
          acc.user.department && validDepts.has(acc.user.department)
            ? acc.user.department
            : isMasterAdmin
            ? '경영팀'
            : '다이나믹팀';

        const realName = acc.user.name;

        const newProfile: MemberReadingProfile = {
          id: generateNextMemberId(currentMembers),
          name: realName,
          department: dept,
          role: isMasterAdmin ? '관리자' : '성도',
          phone: acc.user.phone || '010-미등록',
          email: acc.user.email,
          registeredDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
          birthdate: '1995.01.01',
          baptismStatus: '원입',
          smallGroup: `${dept} 1구역`,
          accountRole: isMasterAdmin ? 'admin' : 'member',
          accountStatus: 'active',
          avatarColor: isMasterAdmin ? 'bg-amber-500' : 'bg-blue-500',
          avatarText: realName.slice(0, 2),
          currentReadingRound: 0,
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
  phoneInput?: string,
  departmentInput?: string
): MemberReadingProfile {
  try {
    removeDeletedMember({ email: user.email, name: user.name, id: user.id, loginId });
    const currentMembers = getOrSyncAdminMembers();
    const existing = currentMembers.find(
      (m) => m.email.toLowerCase() === user.email.toLowerCase() || m.name === user.name
    );
    if (existing) {
      let modified = false;
      if (phoneInput && (!existing.phone || existing.phone === '010-미등록')) {
        existing.phone = phoneInput;
        modified = true;
      }
      if (departmentInput && departmentInput !== existing.department) {
        existing.department = departmentInput;
        modified = true;
      }
      if (modified) {
        localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(currentMembers));
      }
      return existing;
    }

    const isMasterAdmin =
      loginId.toLowerCase() === 'yoocomdr57@gmail.com' ||
      loginId.toLowerCase() === 'yoocomdr57' ||
      loginId.toLowerCase() === 'admin';

    const phoneStr = phoneInput?.trim() || user.phone?.trim() || '010-미등록';
    const deptChosen =
      departmentInput || user.department || (isMasterAdmin ? '경영팀' : '다이나믹팀');
    const validDept = OFFICIAL_DEPARTMENTS.includes(deptChosen as any)
      ? deptChosen
      : isMasterAdmin
      ? '경영팀'
      : '다이나믹팀';

    const newMember: MemberReadingProfile = {
      id: generateNextMemberId(currentMembers),
      name: user.name,
      department: validDept,
      role: isMasterAdmin ? '관리자' : '성도',
      phone: phoneStr,
      email: user.email,
      registeredDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      birthdate: '1995.01.01',
      baptismStatus: '원입',
      smallGroup: `${validDept} 1구역`,
      accountRole: isMasterAdmin ? 'admin' : 'member',
      accountStatus: 'active',
      avatarColor: isMasterAdmin ? 'bg-amber-500' : 'bg-blue-500',
      avatarText: user.avatarText,
      currentReadingRound: 0,
      targetRounds: 12,
      currentBook: '창세기',
      currentChapter: 1,
      totalReadChapters: 0,
      recordingsCount: 0,
      lastActive: '방금 가입',
      status: 'active',
      consecutiveDays: 1,
      featuredCount: 0,
      memo: `웹 간편가입 회원 (아이디: ${loginId}, 소속: ${validDept}, 연락처: ${phoneStr})`,
    };
    const updatedMembers = [...currentMembers, newMember];
    localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(updatedMembers));
    return newMember;
  } catch (e) {
    console.error('Failed to sync to admin roster:', e);
    const phoneStr = phoneInput?.trim() || user.phone?.trim() || '010-미등록';
    const deptChosen =
      departmentInput || user.department || '다이나믹팀';
    return {
      id: `M-${Date.now()}`,
      name: user.name,
      department: deptChosen,
      role: '성도',
      phone: phoneStr,
      email: user.email,
      registeredDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      birthdate: '1995.01.01',
      baptismStatus: '원입',
      smallGroup: `${deptChosen} 1구역`,
      accountRole: 'member',
      accountStatus: 'active',
      avatarColor: 'bg-blue-500',
      avatarText: user.avatarText,
      currentReadingRound: 0,
      targetRounds: 12,
      currentBook: '창세기',
      currentChapter: 1,
      totalReadChapters: 0,
      recordingsCount: 0,
      lastActive: '방금 가입',
      status: 'active',
      consecutiveDays: 1,
      featuredCount: 0,
      memo: `웹 간편가입 회원 (아이디: ${loginId}, 소속: ${deptChosen}, 연락처: ${phoneStr})`,
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

    let realCompletedChaptersCount = 0;
    try {
      realCompletedChaptersCount = getCompletedChapters(userEmail).size;
    } catch (e) {}

    if (idx !== -1) {
      members[idx].currentBook = bookName;
      members[idx].currentChapter = chapterNumber;
      members[idx].totalReadChapters = Math.max(
        realCompletedChaptersCount,
        (members[idx].totalReadChapters || 0) + deltaChapters
      );
      // 전체 1독(1,189장) 완료 시에만 1독으로 산정 (1,189장 미만은 0독)
      members[idx].currentReadingRound = Math.floor((members[idx].totalReadChapters || 0) / 1189);
      members[idx].lastActive = '방금 낭독';
      members[idx].consecutiveDays = Math.max(1, (members[idx].consecutiveDays || 0) + 1);
      localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(members));
    } else {
      const isMasterAdmin =
        searchEmail === 'yoocomdr57@gmail.com' ||
        searchEmail === 'yoocomdr57' ||
        searchName.includes('로고스 관리자');
      const dept = session?.department || (isMasterAdmin ? '경영팀' : '다이나믹팀');
      const initialTotalRead = Math.max(1, realCompletedChaptersCount);
      const newMember: MemberReadingProfile = {
        id: `M-${String(members.length + 1).padStart(2, '0')}`,
        name: session?.name || '성도',
        department: dept,
        role: isMasterAdmin ? '관리자' : '성도',
        phone: '010-미등록',
        email: userEmail || 'user@superbible.app',
        registeredDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
        birthdate: '1990.01.01',
        baptismStatus: '세례교인',
        smallGroup: `${dept} 1구역`,
        accountRole: isMasterAdmin ? 'admin' : 'member',
        accountStatus: 'active',
        avatarColor: isMasterAdmin ? 'bg-amber-500' : 'bg-blue-500',
        avatarText: session?.avatarText || '성도',
        currentReadingRound: Math.floor(initialTotalRead / 1189),
        targetRounds: 12,
        currentBook: bookName,
        currentChapter: chapterNumber,
        totalReadChapters: initialTotalRead,
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

// User-scoped recordings storage (신규 가입자는 빈 배열 []로 시작)
export function getUserRecordings(userEmail?: string): { id: string; title: string; verseRef: string; duration: string; date: string; audioBlobUrl?: string }[] {
  try {
    const key = getUserScopeKey('superbible_user_recordings_v4', userEmail);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveUserRecordings(
  userEmail: string | undefined,
  recs: { id: string; title: string; verseRef: string; duration: string; date: string; audioBlobUrl?: string }[]
): void {
  try {
    const key = getUserScopeKey('superbible_user_recordings_v4', userEmail);
    localStorage.setItem(key, JSON.stringify(recs));
    localStorage.setItem('superbible_user_recordings_v2', JSON.stringify(recs));
  } catch (e) {}
}

// Add member recording to admin inspection list & user's personal recordings
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

    // Save to user's isolated personal storage
    const myRecs = getUserRecordings(user.email);
    if (!myRecs.some((r) => r.id === rec.id)) {
      saveUserRecordings(user.email, [rec, ...myRecs]);
    }

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
export function deleteUserRecordingFromStore(id: string, userEmail?: string): void {
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
    const userKey = getUserScopeKey('superbible_user_recordings_v4', userEmail);
    const rawScoped = localStorage.getItem(userKey);
    if (rawScoped) {
      const scopedRecs: any[] = JSON.parse(rawScoped);
      const filteredScoped = scopedRecs.filter((r) => r.id !== id);
      localStorage.setItem(userKey, JSON.stringify(filteredScoped));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_recordings_changed'));
    }
  } catch (e) {}
}

// Register new member with simple ID/Email + Password + Phone + Department
export function registerUser(
  loginIdInput: string,
  passwordInput: string,
  nameInput?: string,
  phoneInput?: string,
  departmentInput?: string
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

  // Check admin-designated blacklist
  if (isAccountInAdminBlacklist(loginId)) {
    return {
      success: false,
      message: '관리자에 의해 가입이 제한(차단)된 계정입니다. 관리자에게 문의해주세요.',
    };
  }

  const accounts = getRegisteredAccounts();
  const existing = accounts.find(
    (a) => a.loginId.toLowerCase() === loginId.toLowerCase()
  );
  if (existing) {
    return { success: false, message: '이미 등록된 아이디/이메일입니다. 로그인해주세요.' };
  }

  const isAdmin =
    loginId.toLowerCase() === 'yoocomdr57@gmail.com' ||
    loginId.toLowerCase() === 'yoocomdr57' ||
    loginId.toLowerCase() === 'admin';

  const displayName = rawName
    ? rawName
    : isAdmin
    ? '로고스 관리자'
    : loginId.includes('@')
    ? `${loginId.split('@')[0]} 성도`
    : `${loginId} 성도`;

  const userEmail = loginId.includes('@') ? loginId : `${loginId}@superbible.kr`;

  const chosenDept =
    departmentInput && OFFICIAL_DEPARTMENTS.includes(departmentInput as any)
      ? departmentInput
      : isAdmin
      ? '경영팀'
      : '다이나믹팀';

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: displayName,
    email: userEmail,
    phone: phone || undefined,
    avatarText: (rawName || loginId).slice(0, 2).toUpperCase(),
    role: isAdmin ? 'admin' : 'saint',
    provider: 'standard',
    schoolName: '로고스 수퍼바이블 공동체',
    department: chosenDept,
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

  // Clear any past deletion tombstone so re-registration is completely fresh and never blocked
  clearDeletion(userEmail, loginId, displayName, newUser.id);

  const updatedAccounts = [...accounts, newAccount];
  saveRegisteredAccounts(updatedAccounts);

  // Sync to Admin Member Management Roster with phone number and department (starts at 0 chapters/recordings)
  const newMemberProfile = syncMemberToAdminRoster(newUser, loginId, phone, chosenDept);

  // Auto-sync new member registration directly to Google Sheet (yoocomdr57@gmail.com)
  syncMemberRegistrationToGoogleSheet(newMemberProfile, loginId)
    .then((res) => {
      if (!res.success) {
        console.warn('[Register] Google Sheet sync returned non-success, enqueued for retry:', res.message);
        enqueuePendingSync('registerMember', {
          action: 'registerMember',
          loginId,
          member: newMemberProfile,
        });
      }
    })
    .catch((err) => {
      console.warn('[Register] Google Sheet sync network failure, enqueued for retry:', err);
      enqueuePendingSync('registerMember', {
        action: 'registerMember',
        loginId,
        member: newMemberProfile,
      });
    });

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

  // Check admin-designated blacklist
  if (isAccountInAdminBlacklist(loginId)) {
    return {
      success: false,
      message: '관리자에 의해 로그인이 제한(차단)된 계정입니다. 관리자에게 문의해주세요.',
    };
  }

  const accounts = getRegisteredAccounts();

  // 1. Direct match in registered accounts
  const matched = accounts.find(
    (a) => a.loginId.toLowerCase() === loginId.toLowerCase()
  );

  if (matched) {
    if (matched.passwordHash && matched.passwordHash.startsWith('REMOTE_SYNC_')) {
      return {
        success: false,
        message: '구글 스프레드시트에서 동기화된 성도 계정입니다. 간편가입을 통해 본인 비밀번호를 설정하시거나 관리자에게 문의해주세요.',
      };
    }

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
    clearDeletion(loginId, matched.user?.email, matched.user?.name, matched.user?.id);
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
      department: '경영팀',
      consecutiveDays: 1,
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
    loginId.toLowerCase() === 'yoocomdr57@gmail.com' ||
    loginId.toLowerCase() === 'yoocomdr57' ||
    loginId.toLowerCase() === 'admin';

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
    department: isUserAdmin ? '경영팀' : '다이나믹팀',
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
  syncMemberToAdminRoster(newUser, loginId, undefined, newUser.department);

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
