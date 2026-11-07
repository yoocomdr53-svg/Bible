import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { User } from '../types';

interface AuthSyncModalProps {
  isOpen: boolean;
  selectedAccount: Partial<User> | null;
  onFinishSync: () => void;
}

export const AuthSyncModal: React.FC<AuthSyncModalProps> = ({
  isOpen,
  selectedAccount,
  onFinishSync,
}) => {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (!isOpen) {
      setPhase(1);
      return;
    }

    // Step 1 to 2
    const timer1 = setTimeout(() => {
      setPhase(2);
    }, 600);

    // Step 2 to 3 (Success Checkmark)
    const timer2 = setTimeout(() => {
      setPhase(3);
    }, 1300);

    // Step 3 to Finish
    const timer3 = setTimeout(() => {
      onFinishSync();
    }, 1950);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, onFinishSync]);

  if (!isOpen) return null;

  const userName = selectedAccount?.name || '사용자';

  return (
    <div
      id="authProgressModal"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="authProgressContent"
        className="bg-white rounded-2xl p-6 w-[310px] text-center shadow-2xl border border-slate-100 transform animate-in zoom-in-95 duration-250"
      >
        {phase < 3 ? (
          <div className="flex flex-col items-center">
            {/* Spinning Indicator with Center Google G */}
            <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
              <svg className="animate-spin w-14 h-14 text-blue-600" viewBox="0 0 24 24">
                <circle
                  className="opacity-20"
                  cx="12"
                  cy="12"
                  fill="none"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-90"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  fill="currentColor"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-800">
              {phase === 1 ? 'Google 계정 확인 중...' : '동기화 완료 중...'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {phase === 1
                ? `${userName}님의 인증 및 데이터 동기화 중...`
                : `${userName}님의 성경/교무 데이터 로딩 완료`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">로그인 완료</h4>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              수퍼바이블 홈으로 이동합니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
