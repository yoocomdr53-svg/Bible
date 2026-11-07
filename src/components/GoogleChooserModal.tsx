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
  const [customEmail, setCustomEmail] = useState('new_faculty@school.ac.kr');

  if (!isOpen) return null;

  const handleSelectYooc = () => {
    onSelectAccount({
      id: 'user-yooc',
      name: 'yooc',
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

  const handleSelectTeacher = () => {
    onSelectAccount({
      id: 'user-teacher',
      name: '로고스 교직원',
      email: 'logos_teacher@school.ac.kr',
      avatarText: '로고스',
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

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = customEmail.trim() || 'custom_user@school.ac.kr';
    const userName = cleanEmail.split('@')[0];
    onSelectAccount({
      id: 'user-custom',
      name: userName,
      email: cleanEmail,
      avatarText: userName.slice(0, 2).toUpperCase(),
      role: 'saint',
      provider: 'google',
      schoolName: '로고스 아카데미 학사망',
      department: '일반 교인 & 학생',
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
            {/* Account 1: yooc */}
            <button
              id="selectYoocAccountBtn"
              type="button"
              onClick={handleSelectYooc}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 active:bg-blue-50 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#0083e3] font-bold text-sm border border-blue-200 shadow-inner">
                    yooc
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800 truncate">yooc 성도님</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      기본
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 truncate block">yooc.dev@gmail.com</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </button>

            {/* Account 2: Teacher */}
            <button
              id="selectTeacherAccountBtn"
              type="button"
              onClick={handleSelectTeacher}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 active:bg-blue-50 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-sm border border-amber-200 shadow-inner">
                    로고스
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800 truncate">교직원 전용 계정</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                      학사
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 truncate block">
                    logos_teacher@school.ac.kr
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
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
