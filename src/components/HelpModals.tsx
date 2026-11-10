import React, { useState } from 'react';
import { X, Check, Sheet, Mail, Smartphone, Heart, ExternalLink } from 'lucide-react';
import { ActiveModal } from '../types';

interface HelpModalsProps {
  modal: ActiveModal;
  onClose: () => void;
}

export const HelpModals: React.FC<HelpModalsProps> = ({ modal, onClose }) => {
  const [phone, setPhone] = useState('010-3849-2910');
  const [email, setEmail] = useState('logos_admin@school.ac.kr');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  if (
    modal !== 'find-id' &&
    modal !== 'reset-password' &&
    modal !== 'register-sheet' &&
    modal !== 'sponsor'
  ) {
    return null;
  }

  const handleClose = () => {
    setSubmittedMessage(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl p-6 text-slate-800 border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            {modal === 'find-id' && '교직원 / 성도 ID 찾기'}
            {modal === 'reset-password' && '비밀번호 재설정'}
            {modal === 'register-sheet' && '회원가입 (구글 시트 연동)'}
            {modal === 'sponsor' && '시골교회 & 성경앱 후원 동참'}
          </h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4">
          {submittedMessage ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 stroke-[2.5]" />
              </div>
              <p className="text-sm font-bold text-slate-800">{submittedMessage}</p>
              <button
                onClick={handleClose}
                className="mt-2 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                확인
              </button>
            </div>
          ) : (
            <>
              {modal === 'find-id' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    학교에 등록된 교번 또는 등록 휴대폰 번호로 본인 인증 후 아이디를 확인하실 수 있습니다.
                  </p>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      등록 휴대폰 번호
                    </label>
                    <div className="relative flex items-center">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 pl-9 pr-3 text-xs border border-slate-200 rounded-xl focus:ring-1.5 focus:ring-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSubmittedMessage(
                        `인증번호가 발송되었습니다. [아이디: logos_admin@school.ac.kr]`
                      )
                    }
                    className="w-full h-11 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                  >
                    아이디 조회하기
                  </button>
                </div>
              )}

              {modal === 'reset-password' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    학교 웹메일 또는 등록된 구글 계정으로 비밀번호 재설정 보안 링크를 보내드립니다.
                  </p>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      학교 웹메일 / 이메일
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 pl-9 pr-3 text-xs border border-slate-200 rounded-xl focus:ring-1.5 focus:ring-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSubmittedMessage(
                        `${email} 메일함으로 비밀번호 재설정 링크가 안전하게 발송되었습니다.`
                      )
                    }
                    className="w-full h-11 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                  >
                    재설정 링크 발송
                  </button>
                </div>
              )}

              {modal === 'register-sheet' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-950 text-xs">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Sheet className="w-4 h-4 text-blue-700" />
                      <span>SuperBible 초간단 회원가입 안내</span>
                    </div>
                    <span>
                      로그인 화면 상단의 <strong>[간편 회원가입]</strong> 탭에서 <strong>아이디와 비밀번호</strong>만 입력하시면 3초 만에 가입이 완료됩니다. 상세 직분 및 소속은 관리자가 회원관리 폼에서 배정합니다.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full h-11 bg-[#1b64b9] text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>확인 및 로그인/회원가입으로 가기</span>
                  </button>
                </div>
              )}

              {modal === 'sponsor' && (
                <div className="space-y-3.5 text-xs text-slate-700">
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                      <span>갑자기 무너진 40년 시골교회 재건 사역</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-red-800">
                      수해와 노후화로 예배당이 붕괴 위기에 처한 영월 시골교회 재건 및 성경보급 사역에 동참해 주셔서 감사합니다.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <p className="font-bold text-slate-900">후원 계좌 안내</p>
                    <p className="text-slate-600">기업은행 042-892301-01-094 (사단법인 로고스선교회)</p>
                    <p className="text-slate-500 text-[11px]">기부금 영수증 발급 가능 (연말정산 소득공제 혜택)</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSubmittedMessage('따뜻한 마음으로 후원에 동참해 주셔서 진심으로 감사드립니다.')
                    }
                    className="w-full h-11 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition cursor-pointer"
                  >
                    1만원 후원 약정하기
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
