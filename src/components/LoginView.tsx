import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Settings, Info, Loader2 } from 'lucide-react';
import { ActiveModal, User } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: Partial<User>) => void;
  onGoogleLogin?: () => void;
  openModal: (modal: ActiveModal) => void;
  onOpenSettings?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onGoogleLogin,
  openModal,
  onOpenSettings,
}) => {
  const [username, setUsername] = useState('logos_admin@school.ac.kr');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        id: 'user-admin',
        name: username.includes('admin') ? '로고스 관리자' : '로고스 교직원',
        email: username,
        avatarText: '로고스',
        role: 'faculty',
        provider: 'standard',
        schoolName: '로고스 고등학교 (Logos Academy High School)',
        department: '교목실 & 학사연구부',
        consecutiveDays: 14,
        ntProgress: 42,
        todayVersesRead: 4,
        recordingsCount: 7,
      });
    }, 800);
  };

  const handleFillDemo = () => {
    setUsername('teacher_demo@logos.hs.kr');
    setPassword('Logos2026!');
  };

  return (
    <main
      id="loginView"
      className="portal-bg w-full h-full flex flex-col justify-between relative overflow-y-auto no-scrollbar px-5 sm:px-6 pt-2 pb-5 z-10 select-none text-slate-100"
    >
      {/* Top Ambient Glow */}
      <div
        aria-hidden="true"
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"
      />

      {/* Top Status Bar (Matches Image: 4:22, signals, gear) */}
      <header className="w-full pt-1 pb-2 flex justify-between items-center z-20">
        <div className="flex items-center text-[13px] font-medium tracking-tight text-slate-300 pl-1">
          <span>4:22</span>
          <span className="text-[11px] opacity-70 ml-1">▢</span>
        </div>

        <div className="flex items-center space-x-3 text-slate-300 pr-1">
          {/* Signal / Battery */}
          <div className="flex items-center space-x-1.5 text-xs opacity-80">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" fillOpacity="0.2" />
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M16.67 4H15V2H9v2H7.33C6.6 4 6 4.6 6 5.33v15.33C6 21.4 6.6 22 7.33 22h9.33c.74 0 1.34-.6 1.34-1.33V5.33C18 4.6 17.4 4 16.67 4z" />
            </svg>
          </div>

          {/* Settings Cog Icon */}
          <button
            id="settingsGearBtn"
            type="button"
            aria-label="시스템 설정"
            onClick={onOpenSettings}
            className="p-1 text-slate-300 hover:text-white transition-colors duration-150 focus:outline-none cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-300 hover:rotate-45 transition-transform" />
          </button>
        </div>
      </header>

      {/* Brand Identity / Seal Crest (Faithfully Matching Screenshot) */}
      <section className="flex flex-col items-center text-center mt-1 sm:mt-2 mb-3 z-10">
        {/* Crest Ring */}
        <div className="relative w-24 h-24 mb-3 flex items-center justify-center">
          {/* Outer Golden Concentric Ring */}
          <div className="absolute inset-0 rounded-full border-[2.5px] border-[#e0b852] shadow-[0_0_16px_rgba(224,184,82,0.3)] flex items-center justify-center p-1 bg-[#0b1625]">
            {/* Inner Dotted Circle */}
            <div className="w-full h-full rounded-full border border-dashed border-amber-300/70 flex flex-col items-center justify-between py-1.5 px-1 relative">
              <span className="text-[7px] tracking-[0.14em] text-amber-300 font-bold uppercase font-cinzel">
                LOGOS ACADEMY
              </span>

              {/* Cross and Open Bible */}
              <div className="my-auto flex flex-col items-center justify-center -space-y-0.5">
                {/* Cross Vector */}
                <div className="relative flex items-center justify-center">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 rounded-[1px] shadow-sm" />
                  <div className="absolute top-1.5 w-4 h-1.5 bg-gradient-to-r from-amber-300 to-amber-400 rounded-[1px] shadow-sm" />
                </div>
                {/* Open Bible Vector */}
                <svg className="w-6 h-3 text-amber-300" fill="currentColor" viewBox="0 0 24 16">
                  <path
                    d="M12 4.5C9.5 2 4.5 2 1 3.5V14C4.5 12.5 9.5 12.5 12 15C14.5 12.5 19.5 12.5 23 14V3.5C19.5 2 14.5 2 12 4.5Z"
                    fillOpacity="0.85"
                    stroke="#fcd34d"
                    strokeWidth="0.8"
                  />
                </svg>
              </div>

              <span className="text-[6.5px] tracking-wider text-amber-400 font-medium">
                ★ HIGH SCHOOL ★
              </span>
            </div>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-[25px] sm:text-[27px] font-bold tracking-tight text-white font-sans drop-shadow-sm">
          LOGOS ERP 2.0
        </h1>

        {/* Subtitle */}
        <p className="text-[13px] sm:text-[14px] font-medium text-[#e0b852] tracking-normal mt-1">
          School & Bible Management System
        </p>
      </section>

      {/* Main Login Card */}
      <section className="bg-white rounded-[24px] shadow-2xl px-5 sm:px-6 pt-6 pb-6 text-slate-800 relative z-20 mx-0.5 sm:mx-1">
        <div className="text-center mb-5">
          <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">
            교직원 통합 로그인
          </h2>
          <p className="text-[12px] text-slate-400 mt-1 font-normal tracking-tight">
            스마트 학사관리 및 성경공부 제어 포털
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleStandardSubmit} className="space-y-3.5">
          {/* Field 1: ID / Email */}
          <div className="relative">
            <label
              htmlFor="username"
              className="absolute -top-2 left-3.5 bg-white px-1.5 text-[11px] font-medium text-slate-400 z-10"
            >
              아이디 / 이메일
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center">
                <Mail className="w-[18px] h-[18px] text-slate-600" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디 또는 이메일을 입력하세요"
                required
                className="w-full h-12 pl-10 pr-3 text-[13.5px] font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-slate-800 focus:border-slate-800 transition shadow-xs"
              />
            </div>
          </div>

          {/* Field 2: Password */}
          <div className="relative">
            <label
              htmlFor="password"
              className="absolute -top-2 left-3.5 bg-white px-1.5 text-[11px] font-medium text-slate-400 z-10"
            >
              비밀번호
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center">
                <Lock className="w-[18px] h-[18px] text-slate-600" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                required
                className="w-full h-12 pl-10 pr-10 text-[14.5px] font-medium text-slate-800 bg-white border border-slate-200 rounded-xl tracking-wider focus:outline-none focus:ring-1.5 focus:ring-slate-800 focus:border-slate-800 transition shadow-xs"
              />
              <button
                id="togglePasswordBtn"
                type="button"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              id="standardSubmitBtn"
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#1b2a3a] hover:bg-[#152331] active:scale-[0.99] text-white font-medium text-[15px] rounded-xl shadow-md transition-all duration-150 flex items-center justify-center tracking-tight cursor-pointer disabled:opacity-75"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>로그인 확인 중...</span>
                </span>
              ) : (
                <span>안전하게 로그인</span>
              )}
            </button>
          </div>

          {/* Divider: 또는 간편 로그인 */}
          <div className="pt-1 space-y-2.5">
            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-2.5 text-[11px] text-slate-400 font-medium absolute">
                또는 간편 로그인
              </span>
            </div>

            {/* Google Sign-in Button (Matching Official Google Colors) */}
            <button
              id="googleSignInBtn"
              type="button"
              onClick={onGoogleLogin}
              className="w-full h-11 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-medium text-[13.5px] rounded-xl border border-slate-200 shadow-xs transition-all duration-150 flex items-center justify-center gap-2.5 tracking-tight focus:outline-none focus:ring-1.5 focus:ring-slate-400 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Google 아이디로 로그인</span>
            </button>

            <p className="text-center text-[11px] text-slate-400 tracking-tight">
              학교 구글 워크스페이스 및 연동 계정으로 즉시 로그인됩니다
            </p>
          </div>

          {/* Quick Demo Credential Button */}
          <div className="pt-1 flex items-center justify-center">
            <button
              id="fillDemoBtn"
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-1.5 text-[12px] text-slate-700 hover:text-slate-900 transition-colors font-medium cursor-pointer focus:outline-none"
            >
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                i
              </span>
              <span>체험용 계정 정보 자동 입력 클릭</span>
            </button>
          </div>
        </form>
      </section>

      {/* Footer Links (ID 찾기 | 비밀번호 재설정 | 회원가입) */}
      <footer className="mt-auto pt-5 pb-1 text-center z-10">
        <nav
          aria-label="계정 관리 링크"
          className="flex items-center justify-center space-x-2 text-[12.5px] tracking-tight font-medium"
        >
          <button
            id="findIdLink"
            type="button"
            onClick={() => openModal('find-id')}
            className="text-slate-300 hover:text-white transition cursor-pointer"
          >
            ID 찾기
          </button>
          <span className="text-slate-500 text-[11px]">|</span>
          <button
            id="resetPasswordLink"
            type="button"
            onClick={() => openModal('reset-password')}
            className="text-slate-300 hover:text-white transition cursor-pointer"
          >
            비밀번호 재설정
          </button>
          <span className="text-slate-500 text-[11px]">|</span>
          <button
            id="registerSheetLink"
            type="button"
            onClick={() => openModal('register-sheet')}
            className="text-[#e0b852] hover:text-[#f3d37a] font-semibold transition cursor-pointer"
          >
            회원가입 (구글 시트 연동)
          </button>
        </nav>

        <p className="text-[11px] text-slate-400/80 mt-4 tracking-normal">
          © 2026 Logos Academy System. All rights reserved.
        </p>

        {/* Mobile Home indicator bar */}
        <div aria-hidden="true" className="w-32 h-1 bg-white/60 rounded-full mx-auto mt-3 mb-0.5" />
      </footer>
    </main>
  );
};
