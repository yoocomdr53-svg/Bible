import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Settings,
  Loader2,
  UserPlus,
  LogIn,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { ActiveModal, User } from '../types';
import {
  loginUser,
  registerUser,
  getRememberedId,
} from '../services/authService';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  openModal: (modal: ActiveModal) => void;
  onOpenSettings?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  openModal,
  onOpenSettings,
}) => {
  // Tab mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state (아이디/이메일아이디 + 비밀번호 초간단)
  const [regId, setRegId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // UI feedback state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load remembered ID on mount
  useEffect(() => {
    const savedId = getRememberedId();
    if (savedId) {
      setLoginId(savedId);
      setLoginPassword('••••••••');
    } else {
      // Default initial admin ID
      setLoginId('yoocomdr57@gmail.com');
      setLoginPassword('admin1234');
    }
  }, []);

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = loginUser(loginId, loginPassword, rememberMe);
      setIsLoading(false);

      if (res.success && res.user) {
        setSuccessMessage('로그인 성공! 수퍼바이블로 이동합니다...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 350);
      } else {
        setErrorMessage(res.message || '아이디 또는 비밀번호를 확인해주세요.');
      }
    }, 400);
  };

  // Handle Register Submit (아이디/이메일 + 비밀번호)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = regId.trim();
    const cleanPw = regPassword.trim();
    const cleanPwConfirm = regPasswordConfirm.trim();

    if (!cleanId) {
      setErrorMessage('아이디 또는 이메일을 입력해주세요.');
      return;
    }
    if (!cleanPw || cleanPw.length < 4) {
      setErrorMessage('비밀번호를 4자리 이상 입력해주세요.');
      return;
    }
    if (cleanPw !== cleanPwConfirm) {
      setErrorMessage('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = registerUser(cleanId, cleanPw);
      setIsLoading(false);

      if (res.success && res.user) {
        setSuccessMessage('🎉 회원가입이 완료되었습니다! 자동으로 로그인됩니다.');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 700);
      } else {
        setErrorMessage(res.message || '회원가입 중 오류가 발생했습니다.');
      }
    }, 500);
  };

  // Quick fill demo credentials
  const handleFillAdmin = () => {
    setAuthMode('login');
    setLoginId('yoocomdr57@gmail.com');
    setLoginPassword('admin1234');
    setErrorMessage(null);
  };

  const handleFillMember = () => {
    setAuthMode('login');
    setLoginId('yooc');
    setLoginPassword('1234');
    setErrorMessage(null);
  };

  return (
    <main
      id="loginView"
      className="portal-bg w-full h-full flex flex-col justify-between relative overflow-y-auto no-scrollbar px-4 sm:px-6 pt-2 pb-5 z-10 select-none text-slate-100"
    >
      {/* Top Ambient Glow */}
      <div
        aria-hidden="true"
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"
      />

      {/* Top Status Bar */}
      <header className="w-full pt-1 pb-2 flex justify-between items-center z-20">
        <div className="flex items-center text-[13px] font-medium tracking-tight text-slate-300 pl-1">
          <span>수퍼바이블</span>
          <span className="text-[10px] bg-blue-500/30 text-blue-300 px-1.5 py-0.2 rounded-full ml-1.5 font-bold">
            온라인 3.0
          </span>
        </div>

        <div className="flex items-center space-x-3 text-slate-300 pr-1">
          {/* Signal / Status */}
          <div className="flex items-center space-x-1.5 text-xs opacity-80">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-300 font-medium">연결됨</span>
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

      {/* Brand Identity / Seal Crest */}
      <section className="flex flex-col items-center text-center mt-0.5 sm:mt-1 mb-2 z-10">
        <div className="relative w-20 h-20 mb-2 flex items-center justify-center">
          {/* Outer Golden Concentric Ring */}
          <div className="absolute inset-0 rounded-full border-[2.5px] border-[#e0b852] shadow-[0_0_16px_rgba(224,184,82,0.3)] flex items-center justify-center p-1 bg-[#0b1625]">
            <div className="w-full h-full rounded-full border border-dashed border-amber-300/70 flex flex-col items-center justify-between py-1 px-1 relative">
              <span className="text-[6.5px] tracking-[0.12em] text-amber-300 font-bold uppercase font-cinzel">
                SUPER BIBLE
              </span>

              {/* Cross and Bible */}
              <div className="my-auto flex flex-col items-center justify-center -space-y-0.5">
                <div className="relative flex items-center justify-center">
                  <div className="w-1.5 h-5 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 rounded-[1px] shadow-sm" />
                  <div className="absolute top-1 w-3.5 h-1 bg-gradient-to-r from-amber-300 to-amber-400 rounded-[1px] shadow-sm" />
                </div>
                <svg className="w-5 h-2.5 text-amber-300" fill="currentColor" viewBox="0 0 24 16">
                  <path
                    d="M12 4.5C9.5 2 4.5 2 1 3.5V14C4.5 12.5 9.5 12.5 12 15C14.5 12.5 19.5 12.5 23 14V3.5C19.5 2 14.5 2 12 4.5Z"
                    fillOpacity="0.85"
                    stroke="#fcd34d"
                    strokeWidth="0.8"
                  />
                </svg>
              </div>

              <span className="text-[6px] tracking-wider text-amber-400 font-medium">
                ★ 12독 성경통독 ★
              </span>
            </div>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-[22px] sm:text-[24px] font-black tracking-tight text-white font-sans drop-shadow-sm">
          수퍼바이블
        </h1>

        {/* Subtitle */}
        <p className="text-[12px] font-medium text-[#e0b852] tracking-normal mt-0.5">
          스마트 성경통독 & 학사 성경관리 시스템
        </p>
      </section>

      {/* Main Authentication Card */}
      <section className="bg-white rounded-[24px] shadow-2xl px-5 sm:px-6 pt-5 pb-5 text-slate-800 relative z-20 mx-0.5 sm:mx-1 border border-slate-100">
        {/* Tab Switcher: 로그인 vs 간편 회원가입 */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-black">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              authMode === 'login'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>로그인</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
              authMode === 'register'
                ? 'bg-[#1b64b9] text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>간편 회원가입</span>
          </button>
        </div>

        {/* Feedback Alert Messages */}
        {errorMessage && (
          <div className="mb-3.5 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-3.5 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span className="font-bold">{successMessage}</span>
          </div>
        )}

        {/* ================= MODE 1: LOGIN FORM ================= */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div className="text-center mb-3">
              <h2 className="text-[16px] font-black text-slate-900 tracking-tight">
                회원 로그인
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                아이디/비밀번호 입력 시 웹에서 로그인 상태가 영구 유지됩니다
              </p>
            </div>

            {/* Field 1: ID / Email */}
            <div className="relative">
              <label
                htmlFor="loginId"
                className="absolute -top-2 left-3.5 bg-white px-1.5 text-[11px] font-bold text-slate-500 z-10"
              >
                아이디 / 이메일
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="loginId"
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="아이디 또는 이메일 입력"
                  required
                  className="w-full h-11 pl-10 pr-3 text-[13px] font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-slate-800 focus:border-slate-800 transition shadow-xs"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="relative">
              <label
                htmlFor="loginPassword"
                className="absolute -top-2 left-3.5 bg-white px-1.5 text-[11px] font-bold text-slate-500 z-10"
              >
                비밀번호
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="loginPassword"
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  required
                  className="w-full h-11 pl-10 pr-10 text-[14px] font-medium text-slate-800 bg-white border border-slate-200 rounded-xl tracking-wider focus:outline-none focus:ring-1.5 focus:ring-slate-800 focus:border-slate-800 transition shadow-xs"
                />
                <button
                  type="button"
                  aria-label={showLoginPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1b64b9] focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-bold text-[11.5px]">로그인 상태 유지 (자동 로그인)</span>
              </label>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-[#1b64b9] hover:underline font-bold text-[11.5px]"
              >
                간편 회원가입 →
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                id="standardSubmitBtn"
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#1b2a3a] hover:bg-[#152331] active:scale-[0.99] text-white font-bold text-[14px] rounded-xl shadow-md transition-all duration-150 flex items-center justify-center tracking-tight cursor-pointer disabled:opacity-75"
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

            {/* Quick Demo Helper Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleFillAdmin}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-[11px] transition cursor-pointer"
                title="관리자 계정(yoocomdr57@gmail.com) 자동 입력"
              >
                👑 관리자 자동입력
              </button>
              <button
                type="button"
                onClick={handleFillMember}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[11px] transition cursor-pointer"
                title="일반 성도 계정(yooc) 자동 입력"
              >
                👤 성도 자동입력
              </button>
            </div>
          </form>
        ) : (
          /* ================= MODE 2: SIMPLE SIGN-UP FORM ================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="text-center mb-2">
              <div className="inline-flex items-center gap-1 bg-blue-50 text-[#1b64b9] px-2.5 py-0.5 rounded-full text-[11px] font-black mb-1">
                <Sparkles className="w-3 h-3" />
                <span>초간단 회원가입</span>
              </div>
              <h2 className="text-[16px] font-black text-slate-900 tracking-tight">
                아이디와 비밀번호로 즉시 가입
              </h2>
            </div>

            {/* Admin Management Notice Banner */}
            <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200/80 text-[11px] text-blue-950 space-y-1">
              <div className="flex items-center gap-1 font-black text-blue-800">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>간편 가입 안내</span>
              </div>
              <p className="text-slate-600 leading-tight">
                아이디와 비밀번호만 입력하면 3초 만에 가입됩니다. 성명, 소속, 직분 등 상세 정보는
                <strong className="text-blue-700"> 관리자가 회원관리 폼에서 배정 및 조정</strong>합니다.
              </p>
            </div>

            {/* Field 1: ID / Email */}
            <div className="relative">
              <label
                htmlFor="regId"
                className="absolute -top-2 left-3.5 bg-white px-1.5 text-[11px] font-bold text-slate-500 z-10"
              >
                아이디 또는 이메일 <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="regId"
                  type="text"
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  placeholder="사용할 아이디 또는 이메일 (예: paul2026)"
                  required
                  className="w-full h-11 pl-10 pr-3 text-[13px] font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-blue-600 focus:border-blue-600 transition shadow-xs"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="relative">
              <label
                htmlFor="regPassword"
                className="absolute -top-2 left-3.5 bg-white px-1.5 text-[11px] font-bold text-slate-500 z-10"
              >
                비밀번호 (4자리 이상) <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="regPassword"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="비밀번호 입력 (4자리 이상)"
                  required
                  minLength={4}
                  className="w-full h-11 pl-10 pr-10 text-[14px] font-medium text-slate-800 bg-white border border-slate-200 rounded-xl tracking-wider focus:outline-none focus:ring-1.5 focus:ring-blue-600 focus:border-blue-600 transition shadow-xs"
                />
                <button
                  type="button"
                  aria-label={showRegPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field 3: Password Confirmation */}
            <div className="relative">
              <label
                htmlFor="regPasswordConfirm"
                className="absolute -top-2 left-3.5 bg-white px-1.5 text-[11px] font-bold text-slate-500 z-10"
              >
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="regPasswordConfirm"
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 다시 입력"
                  required
                  minLength={4}
                  className="w-full h-11 pl-10 pr-3 text-[14px] font-medium text-slate-800 bg-white border border-slate-200 rounded-xl tracking-wider focus:outline-none focus:ring-1.5 focus:ring-blue-600 focus:border-blue-600 transition shadow-xs"
                />
              </div>
            </div>

            {/* Auto login reminder */}
            <p className="text-[11px] text-slate-500 text-center font-medium">
              ✓ 가입 즉시 자동으로 로그인되며 세션이 안전하게 유지됩니다.
            </p>

            {/* Submit Register Button */}
            <div className="pt-1">
              <button
                id="submitRegisterBtn"
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#1b64b9] hover:bg-blue-600 active:scale-[0.99] text-white font-black text-[14px] rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>가입 처리 및 로그인 중...</span>
                  </span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>회원가입 완료 및 바로 시작하기</span>
                  </>
                )}
              </button>
            </div>

            {/* Switch back to Login */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold transition cursor-pointer"
              >
                이미 계정이 있으신가요? <span className="text-[#1b64b9] underline">로그인하기</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Footer Links (ID 찾기 | 비밀번호 재설정 | 회원가입) */}
      <footer className="mt-auto pt-4 pb-1 text-center z-10">
        <nav
          aria-label="계정 관리 링크"
          className="flex items-center justify-center space-x-2 text-[12px] tracking-tight font-medium"
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
            onClick={() => setAuthMode('register')}
            className="text-[#e0b852] hover:text-[#f3d37a] font-bold transition cursor-pointer"
          >
            간편 회원가입
          </button>
        </nav>

        <p className="text-[11px] text-slate-400/80 mt-3 tracking-normal">
          © 2026 수퍼바이블 Logos Academy System. All rights reserved.
        </p>

        {/* Mobile Home indicator bar */}
        <div aria-hidden="true" className="w-32 h-1 bg-white/60 rounded-full mx-auto mt-2.5 mb-0.5" />
      </footer>
    </main>
  );
};
