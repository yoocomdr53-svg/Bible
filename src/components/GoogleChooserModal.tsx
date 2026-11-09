import React, { useState } from 'react';
import { X, ChevronRight, UserPlus, ArrowLeft } from 'lucide-react';
import { User } from '../types';

interface GoogleChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: Partial<User>) => void;
}

export const GoogleChooserModal: React.FC<GoogleChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('yoocomdr57@gmail.com');

  if (!isOpen) return null;

  // Primary Account: yoocomdr57@gmail.com (Connected Google Account & Admin)
  const handleSelectAdmin = () => {
    onSelectAccount({
      id: 'user-yoocomdr',
      name: '유원희 (로고스 관리자)',
      email: 'yoocomdr57@gmail.com',
      avatarText: '원희',
      role: 'admin',
      provider: 'google',
      schoolName: '로고스 수퍼바이블 공동체',
      department: '교목실 & 성경통독 총괄관리부',
      consecutiveDays: 30,
      ntProgress: 0,
      todayVersesRead: 0,
      recordingsCount: 3,
    });
  };

  // Account 2: yooc (일반 성도)
  const handleSelectYooc = () => {
    onSelectAccount({
      id: 'user-yooc',
      name: 'yooc (성도)',
      email: 'yooc.dev@gmail.com',
      avatarText: 'yooc',
      role: 'saint',
      provider: 'google',
      schoolName: '로고스 수퍼바이블 공동체',
      department: '청장년 성경통독부',
      consecutiveDays: 14,
      ntProgress: 42,
      todayVersesRead: 4,
      recordingsCount: 7,
    });
  };

  // Account 3: 로고스 교직원
  const handleSelectTeacher = () => {
    onSelectAccount({
      id: 'user-teacher',
      name: '로고스 교직원',
      email: 'logos_teacher@school.ac.kr',
      avatarText: '교직',
      role: 'faculty',
      provider: 'google',
      schoolName: '로고스 고등학교',
      department: '종교교무부 & 신앙지도실',
      consecutiveDays: 21,
      ntProgress: 68,
      todayVersesRead: 6,
      recordingsCount: 12,
    });
  };

  // Custom Account Input
  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim() || 'yoocomdr57@gmail.com';
    const userName = cleanEmail.split('@')[0];
    const isAdmin =
      cleanEmail.toLowerCase().includes('yoocomdr') ||
      cleanEmail.toLowerCase().includes('admin');
    const isFaculty =
      cleanEmail.toLowerCase().includes('school') ||
      cleanEmail.toLowerCase().includes('teacher') ||
      cleanEmail.toLowerCase().includes('logos.hs.kr');

    onSelectAccount({
      id: `user-${Date.now()}`,
      name: isAdmin ? '로고스 관리자' : isFaculty ? '로고스 교직원' : userName,
      email: cleanEmail,
      avatarText: isAdmin ? '관리' : isFaculty ? '교직' : userName.slice(0, 2).toUpperCase(),
      role: isAdmin ? 'admin' : isFaculty ? 'faculty' : 'saint',
      provider: 'google',
      schoolName: '로고스 수퍼바이블 공동체',
      department: isAdmin ? '교목실 & 총괄운영부' : isFaculty ? '학사연구부' : '일반 교인 & 성경통독부',
      consecutiveDays: 1,
      ntProgress: 5,
      todayVersesRead: 1,
      recordingsCount: 0,
    });
  };

  return (
    <div
      id="googleModalOverlay"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="googleModalContent"
        className="w-full max-w-[400px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 mx-auto border border-slate-100 text-slate-800 animate-in slide-in-from-bottom duration-250"
      >
        {/* Header with Google Brand and Close */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                fill="#4285F4"
              />
              <path
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24z"
                fill="#34A853"
              />
              <path
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                fill="#FBBC05"
              />
              <path
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-sm font-semibold text-slate-700">Google 계정으로 로그인</span>
          </div>
          <button
            id="closeGoogleModalBtn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="py-3">
          <h3 className="text-base font-bold text-slate-900 leading-tight">
            {showCustomInput ? '새 계정으로 로그인' : '계정 선택'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            <span className="font-semibold text-blue-600">Logos ERP / 수퍼바이블</span>(으)로 이동합니다.
          </p>
        </div>

        {/* Account List or Custom Input */}
        {!showCustomInput ? (
          <div className="space-y-2 pb-2">
            {/* Account 1: yoocomdr57@gmail.com (Connected Google Account & Admin) */}
            <button
              id="selectAdminAccountBtn"
              type="button"
              onClick={handleSelectAdmin}
              className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-blue-500 bg-blue-50/60 hover:bg-blue-100/60 active:bg-blue-100 transition-all text-left group cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#1b64b9] flex items-center justify-center text-white font-black text-sm shadow-inner">
                    관리
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-slate-900 truncate">로고스 관리자</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black border border-amber-300">
                      👑 최고 관리자
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                      📱 접속 계정
                    </span>
                  </div>
                  <span className="text-xs text-blue-900 font-semibold truncate block mt-0.5">
                    yoocomdr57@gmail.com
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </button>

            {/* Account 2: yooc (일반 성도) */}
            <button
              id="selectYoocAccountBtn"
              type="button"
              onClick={handleSelectYooc}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-slate-50 active:bg-blue-50/50 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#1b64b9] font-bold text-sm border border-slate-200 shadow-inner">
                    yooc
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800 truncate">yooc (성도)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                      일반 성도
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 truncate block">yooc.dev@gmail.com</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </button>

            {/* Account 3: Teacher (교직원) */}
            <button
              id="selectTeacherAccountBtn"
              type="button"
              onClick={handleSelectTeacher}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-slate-50 active:bg-blue-50/50 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-sm border border-amber-200 shadow-inner">
                    교직
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800 truncate">로고스 교직원</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                      학사
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 truncate block">
                    logos_teacher@school.ac.kr
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </button>

            {/* Button: Use another account */}
            <button
              id="useAnotherAccountBtn"
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-dashed border-slate-300 transition text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-700 block">다른 계정 사용</span>
                <span className="text-[11px] text-slate-400">새 Google / 교직원 계정 직접 입력</span>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitCustom} className="space-y-3 pb-2">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-700 block">
                새 계정 이메일 또는 휴대폰 번호
              </label>
              <input
                id="customGoogleEmailInput"
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="example@school.ac.kr"
                required
                className="w-full h-11 px-3 text-[13px] text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-blue-600 focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-400">
                학교 구글 워크스페이스 도메인 계정으로 즉시 연동됩니다.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 gap-2">
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="h-10 px-3.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium transition cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>뒤로가기</span>
              </button>
              <button
                type="submit"
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>다음</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Consent Footer */}
        <div className="pt-3 text-[11px] text-slate-400 border-t border-slate-100 leading-tight">
          계속 진행하면 Google이 사용자의 이름, 이메일 주소, 언어 환경설정, 프로필 사진을 Logos ERP와 공유합니다.
        </div>
      </div>
    </div>
  );
};
