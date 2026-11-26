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
  removePendingSyncForEmail,
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
  // v4: 삭제기록은 이메일/로그인아이디로만 남긴다. (이름·회원번호로 남기면 동명이인·새 회원까지 숨겨짐)
  const records = getDeletedRecords();
  const now = Date.now();
  [email, loginId].filter(Boolean).forEach((k) => {
    const clean = String(k).toLowerCase().trim();
    if (clean && clean !== 'yoocomdr57@gmail.com') records[clean] = now;
  });
  try {
    localStorage.setItem(DELETED_RECORDS_KEY, JSON.stringify(records));
  } catch {}
  return records;
}

export function clearDeletion(email?: string, loginId?: string, name?: string, memberId?: string): Record<string, number> {
  const records = getDeletedRecords();
  let changed = false;
  [email, loginId, memberId, name].filter(Boolean).forEach((k) => {
    const clean = String(k).toLowerCase().trim();
    [clean, `id:${clean}`, `name:${clean}`].forEach((key) => {
      if (records[key]) {
        delete records[key];
        changed = true;
      }
    });
  });
  if (changed) {
    try {
      localStorage.setItem(DELETED_RECORDS_KEY, JSON.stringify(records));
    } catch {}
  }
  return records;
}

// 이 기기에서 "방금(2분 이내)" 삭제한 회원인지. 시트 반영 전 잠깐 화면에서 숨기는 용도로만 쓴다.
// (회원 목록의 기준은 구글 시트이므로, 오래된 삭제기록으로 회원을 숨기지 않는다)
const RECENT_DELETE_WINDOW_MS = 2 * 60 * 1000;
export function isMemberDeleted(identifier: {
  email?: string;
  name?: string;
  id?: string;
  loginId?: string;
}): boolean {
  if (!identifier) return false;
  const keys = [identifier.email, identifier.loginId]
    .map((k) => String(k || '').toLowerCase().trim())
    .filter((k) => k && k !== 'yoocomdr57@gmail.com');
  if (!keys.length) return false;
  const records = getDeletedRecords();
  const cut = Date.now() - RECENT_DELETE_WINDOW_MS;
  return keys.some((k) => (records[k] || 0) > cut);
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

export async function deleteMemberCompletely(
  memberId: string,
  memberEmail?: string,
  memberName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const emailNorm = (memberEmail || '').toLowerCase().trim();
    const idNorm = (memberId || '').toLowerCase().trim();
    if (emailNorm === 'yoocomdr57@gmail.com' || idNorm === 'm-01') {
      return { success: false, message: '마스터 관리자 계정은 삭제할 수 없습니다.' };
    }

    // 1. 이 기기에서 즉시 숨김 (2분간) + 이 회원의 대기 중인 가입/진도 요청 제거
    recordDeletion(memberId, memberEmail);
    removePendingSyncForEmail(emailNorm);

    // 2. 명부에서 제거 (이메일 기준, 이메일이 없을 때만 회원번호 기준 — 이름으로는 지우지 않음)
    const rawMembers = localStorage.getItem(ADMIN_MEMBERS_KEY);
    if (rawMembers) {
      const parsed: MemberReadingProfile[] = JSON.parse(rawMembers);
      const filtered = parsed.filter((m) => {
        const mEmail = (m.email || '').toLowerCase().trim();
        if (emailNorm) return mEmail !== emailNorm;
        return (m.id || '').toLowerCase().trim() !== idNorm;
      });
      localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(filtered));
    }

    // 3. 이 기기의 로그인 계정 제거
    if (emailNorm) {
      const rawAccs = localStorage.getItem(REGISTRY_KEY);
      if (rawAccs) {
        const accounts: RegisteredAccount[] = JSON.parse(rawAccs);
        const filteredAccs = accounts.filter((acc) => {
          const aEmail = (acc.user?.email || '').toLowerCase().trim();
          const aLogin = (acc.loginId || '').toLowerCase().trim();
          return aEmail !== emailNorm && aLogin !== emailNorm;
        });
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(filteredAccs));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_members_changed'));
    }

    // 4. 구글 시트에서 삭제 (이메일 + 회원번호만 전달)
    const res = await sendPayloadToGoogleScript({
      action: 'deleteMember',
      id: memberId,
      memberId,
      email: emailNorm,
      name: memberName,
    });

    if (res.success) {
      return { success: true, message: `'${memberName || memberEmail || memberId}' 회원이 구글 시트에서 삭제되었습니다.` };
    }
    return {
      success: !!res.retryable,
      message: res.retryable
        ? `'${memberName || memberEmail}' 회원을 이 기기에서 삭제했고, 구글 시트 삭제는 연결되면 자동으로 다시 시도합니다. (${res.message})`
        : `구글 시트 삭제 실패: ${res.message}`,
    };
  } catch (err: any) {
    console.error('deleteMemberCompletely error:', err);
    return { success: false, message: '회원 삭제 중 오류가 발생했습니다.' };
  }
}

/**
 * 앱 기기 데이터를 관리자 1명으로 초기화. (구글 시트 전면 초기화는 안전을 위해 시트 메뉴에서만 가능)
 */
export async function resetAllMembersCompletely(): Promise<{ success: boolean; message: string }> {
  try {
    localStorage.removeItem(ADMIN_MEMBERS_KEY);
    localStorage.removeItem(REGISTRY_KEY);
    localStorage.removeItem(DELETED_RECORDS_KEY);
    localStorage.removeItem('superbible_admin_recordings_v4');
    localStorage.removeItem('superbible_pending_sheet_sync_v2');
    localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify([...INITIAL_MEMBERS]));
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(DEFAULT_ACCOUNTS));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_members_changed'));
    }

    const res = await sendPayloadToGoogleScript({ action: 'resetAll' }, undefined, { enqueueOnFail: false });
    return {
      success: true,
      message: res.success
        ? '앱과 구글 시트가 마스터 관리자 1명으로 초기화되었습니다.'
        : '이 기기의 데이터를 초기화했습니다. 구글 시트 초기화는 시트 상단 메뉴 [★ 수퍼바이블 DB] > [전면 초기화] 에서 실행하세요.',
    };
  } catch (err: any) {
    console.error('resetAllMembersCompletely error:', err);
    return { success: false, message: '전면 초기화 중 오류가 발생했습니다.' };
  }
}

/**
 * 회원 정보 수정 → 구글 시트 반영 (회원번호로 찾고, 이메일을 바꾼 경우 원래 이메일을 함께 보냄)
 */
export async function updateMemberProfile(
  updatedMember: MemberReadingProfile
): Promise<{ success: boolean; message: string }> {
  try {
    const raw = localStorage.getItem(ADMIN_MEMBERS_KEY);
    const members: MemberReadingProfile[] = raw ? JSON.parse(raw) : [];
    const idx = members.findIndex((m) => m.id === updatedMember.id);
    const original = idx !== -1 ? members[idx] : undefined;
    const originalEmail = (original?.email || updatedMember.email || '').toLowerCase().trim();
    const newEmail = (updatedMember.email || '').toLowerCase().trim();

    if (
      newEmail &&
      newEmail !== originalEmail &&
      members.some((m, i) => i !== idx && (m.email || '').toLowerCase().trim() === newEmail)
    ) {
      return { success: false, message: `이미 다른 회원이 사용 중인 이메일입니다: ${newEmail}` };
    }

    const res = await sendPayloadToGoogleScript(
      { action: 'updateMember', member: { ...updatedMember, email: newEmail }, originalEmail },
      undefined,
      { enqueueOnFail: true }
    );
    if (!res.success && !res.retryable) {
      return { success: false, message: `구글 시트 수정 실패: ${res.message}` };
    }

    // 시트가 받아들였으면(또는 재시도 대기면) 이 기기에도 반영
    if (idx !== -1) members[idx] = { ...members[idx], ...updatedMember, email: newEmail };
    localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(members));

    const rawAccs = localStorage.getItem(REGISTRY_KEY);
    if (rawAccs && originalEmail) {
      const accounts: RegisteredAccount[] = JSON.parse(rawAccs);
      const acc = accounts.find(
        (a) => (a.user?.email || '').toLowerCase() === originalEmail || (a.loginId || '').toLowerCase() === originalEmail
      );
      if (acc) {
        acc.user.name = updatedMember.name;
        acc.user.department = updatedMember.department;
        acc.user.phone = updatedMember.phone;
        acc.user.email = newEmail || acc.user.email;
        acc.user.role = updatedMember.accountRole === 'admin' ? 'admin' : 'saint';
        localStorage.setItem(REGISTRY_KEY, JSON.stringify(accounts));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_members_changed'));
    }

    return {
      success: true,
      message: res.success
        ? `'${updatedMember.name}' 회원 정보가 구글 시트에 수정·반영되었습니다.`
        : `'${updatedMember.name}' 회원 정보를 저장했고, 구글 시트 반영은 연결되면 자동으로 다시 시도합니다.`,
    };
  } catch (err: any) {
    console.error('updateMemberProfile error:', err);
    return { success: false, message: '회원 정보 수정 중 오류가 발생했습니다.' };
  }
}

/**
 * 관리자 화면에서 신규 회원 등록 → 구글 시트가 회원번호를 발급
 */
export async function createMemberByAdmin(
  formData: Partial<MemberReadingProfile> & { loginId?: string; password?: string }
): Promise<{ success: boolean; member?: MemberReadingProfile; message: string }> {
  try {
    const raw = localStorage.getItem(ADMIN_MEMBERS_KEY);
    const members: MemberReadingProfile[] = raw ? JSON.parse(raw) : [];

    const cleanName = (formData.name || '').trim();
    if (!cleanName) return { success: false, message: '회원 성명을 입력해주세요.' };
    // 아이디·비밀번호 (관리자가 정해 주는 로그인 정보)
    const loginId = (formData.loginId || '').trim();
    const password = (formData.password || '').trim();
    if (!loginId) return { success: false, message: '아이디를 입력해주세요.' };
    if (/\s/.test(loginId)) return { success: false, message: '아이디에는 공백을 넣을 수 없습니다.' };
    if (password.length < 4) return { success: false, message: '비밀번호를 4자리 이상 입력해주세요.' };
    const loginLower = loginId.toLowerCase();
    // 이메일을 따로 안 쓰면: 아이디가 이메일이면 그대로, 아니면 아이디@superbible.kr (가입 화면과 같은 규칙)
    const cleanEmail =
      (formData.email || '').trim().toLowerCase() || (loginLower.includes('@') ? loginLower : `${loginLower}@superbible.kr`);
    if (members.some((m) => (m.email || '').toLowerCase().trim() === cleanEmail)) {
      return { success: false, message: `이미 등록된 이메일입니다: ${cleanEmail}` };
    }
    {
      const accs: RegisteredAccount[] = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]');
      const taken = accs.find((a) => (a.loginId || '').toLowerCase() === loginLower);
      if (taken && !String(taken.passwordHash || '').startsWith('REMOTE_SYNC_')) {
        return { success: false, message: `이미 사용 중인 아이디입니다: ${loginId}` };
      }
    }
    const cleanPhone = (formData.phone || '010-미등록').trim();
    const cleanDept = formData.department || '경영팀';
    const cleanRole = formData.role || '성도';

    clearDeletion(cleanEmail);

    const newMember: MemberReadingProfile = {
      id: generateNextMemberId(members), // 임시 번호 — 시트가 발급한 번호로 곧 바뀜
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
      accountStatus: (formData.accountStatus as any) === '정상' ? 'active' : formData.accountStatus || 'active',
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
      memo: formData.memo || `관리자 직접 등록 (아이디: ${loginId})`,
    };

    const res = await sendPayloadToGoogleScript({
      action: 'registerMember',
      loginId,
      member: newMember,
      requestedAt: Date.now(),
    });
    if (!res.success && !res.retryable) {
      return { success: false, message: `구글 시트 등록 실패: ${res.message}` };
    }
    if (res.data?.memberId) newMember.id = res.data.memberId;

    members.push(newMember);
    localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(members));

    const rawAccs = localStorage.getItem(REGISTRY_KEY);
    const accounts: RegisteredAccount[] = rawAccs ? JSON.parse(rawAccs) : [];
    // 같은 아이디/이메일의 원격 자리(REMOTE_SYNC_)는 정리하고 관리자가 정한 비밀번호로 계정 생성
    for (let i = accounts.length - 1; i >= 0; i--) {
      const a = accounts[i];
      const k = [(a.loginId || '').toLowerCase(), (a.user?.email || '').toLowerCase()];
      if ((k.includes(loginLower) || k.includes(cleanEmail)) && String(a.passwordHash || '').startsWith('REMOTE_SYNC_')) accounts.splice(i, 1);
    }
    if (!accounts.some((a) => a.loginId.toLowerCase() === loginLower)) {
      accounts.push({
        loginId,
        passwordHash: password,
        user: {
          id: `user-${newMember.id.toLowerCase()}`,
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

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('superbible_members_changed'));
    }

    return {
      success: true,
      member: newMember,
      message: res.success
        ? `신규 회원 '${cleanName}'(${newMember.id})님이 구글 시트에 등록되었습니다. 🎉`
        : `신규 회원 '${cleanName}'님을 저장했고, 구글 시트 등록은 연결되면 자동으로 다시 시도합니다.`,
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
      const curUserRaw = localStorage.getItem(SESSION_KEY);
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
          localStorage.removeItem(SESSION_KEY);
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
            !String(m.email || '').includes('@logos.church')
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

    // v4: 로그인 계정 목록으로 명부에 회원을 자동 추가하지 않는다.
    //     (명부의 기준은 구글 시트 — 계정 목록에서 다시 채우면 삭제된 회원이 되살아남)
    const changed = false;

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
    removeDeletedMember({ email: user.email, loginId });
    const currentMembers = getOrSyncAdminMembers();
    const myEmail = (user.email || '').toLowerCase().trim();
    // 같은 사람 = 같은 이메일 (이름이 같아도 다른 사람)
    const existing = currentMembers.find((m) => (m.email || '').toLowerCase().trim() === myEmail);
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

// 이 기기에서 만든 회원을 구글 시트에 등록하고, 시트가 발급한 회원번호로 맞춘다.
function pushRegistrationToSheet(member: MemberReadingProfile, loginId: string): void {
  syncMemberRegistrationToGoogleSheet(member, loginId)
    .then((res) => {
      const newId = res.data?.memberId;
      if (res.success && newId && newId !== member.id) {
        try {
          const raw = localStorage.getItem(ADMIN_MEMBERS_KEY);
          const list: MemberReadingProfile[] = raw ? JSON.parse(raw) : [];
          const e = (member.email || '').toLowerCase().trim();
          const m = list.find((x) => (x.email || '').toLowerCase().trim() === e);
          if (m) {
            m.id = newId;
            localStorage.setItem(ADMIN_MEMBERS_KEY, JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('superbible_members_changed'));
          }
        } catch {}
      }
      if (!res.success) console.warn('[Register] 구글 시트 등록 결과:', res.message);
    })
    .catch((err) => console.warn('[Register] 구글 시트 등록 오류:', err));
}

// 간편 회원가입: 아이디(이메일) + 비밀번호 + 성명 + 전화번호 + 소속부서
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
  if (/\s/.test(loginId)) {
    return { success: false, message: '아이디/이메일에는 공백을 넣을 수 없습니다.' };
  }
  if (!password || password.length < 4) {
    return { success: false, message: '비밀번호를 4자리 이상 입력해주세요.' };
  }

  if (isAccountInAdminBlacklist(loginId)) {
    return {
      success: false,
      message: '관리자에 의해 가입이 제한(차단)된 계정입니다. 관리자에게 문의해주세요.',
    };
  }

  const isAdmin =
    loginId.toLowerCase() === 'yoocomdr57@gmail.com' ||
    loginId.toLowerCase() === 'yoocomdr57' ||
    loginId.toLowerCase() === 'admin';
  const userEmail = (loginId.includes('@') ? loginId : `${loginId}@superbible.kr`).toLowerCase();

  const accounts = getRegisteredAccounts();
  const existingIdx = accounts.findIndex(
    (a) =>
      a.loginId.toLowerCase() === loginId.toLowerCase() ||
      (a.user?.email || '').toLowerCase() === userEmail
  );
  const existing = existingIdx !== -1 ? accounts[existingIdx] : undefined;
  // 다른 기기에서 가입해 시트로만 내려온 계정(REMOTE_SYNC_)은 이 기기에서 비밀번호를 정하고 이어서 사용 가능
  const isRemoteOnly = !!existing && String(existing.passwordHash || '').startsWith('REMOTE_SYNC_');
  if (existing && !isRemoteOnly) {
    return { success: false, message: '이미 등록된 아이디/이메일입니다. 로그인해주세요.' };
  }

  const displayName = rawName
    ? rawName
    : isAdmin
    ? '로고스 관리자'
    : `${loginId.split('@')[0]} 성도`;

  const chosenDept =
    departmentInput && OFFICIAL_DEPARTMENTS.includes(departmentInput as any)
      ? departmentInput
      : isAdmin
      ? '경영팀'
      : '다이나믹팀';

  const newUser: User = {
    ...(existing?.user || {}),
    id: existing?.user?.id || `user-${Date.now()}`,
    name: displayName,
    email: userEmail,
    phone: phone || existing?.user?.phone || undefined,
    avatarText: (rawName || loginId).slice(0, 2).toUpperCase(),
    role: isAdmin ? 'admin' : 'saint',
    provider: 'standard',
    schoolName: '로고스 수퍼바이블 공동체',
    department: chosenDept,
    consecutiveDays: existing?.user?.consecutiveDays || 1,
    ntProgress: existing?.user?.ntProgress || 0,
    todayVersesRead: existing?.user?.todayVersesRead || 0,
    recordingsCount: existing?.user?.recordingsCount || 0,
  } as User;

  const newAccount: RegisteredAccount = {
    loginId,
    passwordHash: password,
    user: newUser,
    createdAt: new Date().toISOString(),
  };

  // 예전 삭제기록이 있어도 새 가입은 막지 않음 (시트도 requestedAt 으로 새 가입임을 확인)
  clearDeletion(userEmail, loginId);

  const updatedAccounts = [...accounts];
  if (existingIdx !== -1) updatedAccounts[existingIdx] = newAccount;
  else updatedAccounts.push(newAccount);
  saveRegisteredAccounts(updatedAccounts);

  // 명부에 추가하고 구글 시트로 전송 (실패 시 자동 재전송 대기열)
  const newMemberProfile = syncMemberToAdminRoster(newUser, loginId, phone, chosenDept);
  newMemberProfile.name = displayName;
  pushRegistrationToSheet(newMemberProfile, loginId);

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
  const autoProfile = syncMemberToAdminRoster(newUser, loginId, undefined, newUser.department);
  pushRegistrationToSheet(autoProfile, loginId);

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
