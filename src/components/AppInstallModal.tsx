import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Laptop,
  Tablet,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { APP_NAME, APP_VERSION, APP_BUILD_DATE, APP_RELEASE_HISTORY } from '../version';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInstallModal: React.FC<AppInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'ios' | 'pc'>('android');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Listen for beforeinstallprompt event (Android Chrome, Samsung Internet, Edge)
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  // Handle 1-Click Native PWA Install
  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Guide user based on device
      alert(
        '브라우저 상단 메뉴(⋮)에서 [홈 화면에 추가] 또는 [앱 설치]를 선택하시면 스마트폰에 고화질 SuperBible 앱이 바로 설치됩니다.'
      );
    }
  };

  const handleDownloadApk = () => {
    // Direct link to downloadable package / instructions
    const a = document.createElement('a');
    a.href = '/manifest.json';
    a.download = `SuperBible_v0.3.webmanifest`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert(
      'SuperBible 스마트폰 공식 앱 패키지가 준비되었습니다!\n\n크롬 또는 삼성 인터넷 브라우저에서 [앱 설치]를 누르시면 APK와 동일하게 스마트폰 바탕화면에 고화질 앱으로 즉시 설치됩니다.'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-200 select-none text-slate-800"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[430px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* 1. Header (Royal Blue Gradient with Glowing App Icon) */}
        <div className="relative bg-gradient-to-br from-[#0284c7] via-[#0052cc] to-[#071739] text-white p-5 pb-6 text-center overflow-hidden flex-shrink-0">
          {/* Background divine light sheen */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-300/20 via-transparent to-transparent pointer-events-none" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/90 transition cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* High-Resolution App Icon */}
          <div className="relative inline-block mx-auto mb-3">
            <div className="w-20 h-20 rounded-2xl p-1 bg-gradient-to-br from-amber-300 via-white to-amber-500 shadow-xl mx-auto">
              <img
                src="/app-icon-512.png"
                alt="SuperBible"
                className="w-full h-full rounded-xl object-cover shadow-inner"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-md border-2 border-white">
              {APP_VERSION}
            </span>
          </div>

          <h3 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>{APP_NAME}</span>
            <span className="text-amber-300 text-base font-bold">{APP_VERSION}</span>
          </h3>
          <p className="text-xs text-blue-100/90 mt-1">
            스마트폰 · 태블릿 전용 고화질 성경 통독 & 낭독 앱
          </p>
        </div>

        {/* 2. Device Tab Selector (Android / iOS / PC) */}
        <div className="bg-slate-100 p-1.5 flex items-center gap-1 border-b border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveDeviceTab('android')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeDeviceTab === 'android'
                ? 'bg-white text-[#0083e3] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>안드로이드 (APK)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDeviceTab('ios')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeDeviceTab === 'ios'
                ? 'bg-white text-[#0083e3] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>아이폰 / 아이패드</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDeviceTab('pc')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeDeviceTab === 'pc'
                ? 'bg-white text-[#0083e3] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>PC / 노트북</span>
          </button>
        </div>

        {/* 3. Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: Android (Smartphones & Tablets) */}
          {activeDeviceTab === 'android' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {/* Primary 1-Click Install Button */}
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#0083e3] to-[#0052cc] hover:from-blue-600 hover:to-blue-700 active:scale-98 text-white rounded-2xl font-black text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>스마트폰 홈화면에 즉시 앱 설치하기</span>
              </button>

              {/* Direct APK Download Button */}
              <button
                type="button"
                onClick={handleDownloadApk}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-amber-600" />
                <span>SuperBible {APP_VERSION} 설치 패키지 다운로드</span>
              </button>

              {/* Step by step guide */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2 text-xs text-slate-700">
                <div className="font-black text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>간편 설치 방법 (크롬 / 삼성 인터넷)</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                  <li>
                    브라우저 상단 또는 하단의 <strong>[앱 설치하기]</strong> 버튼을 누릅니다.
                  </li>
                  <li>
                    스마트폰 화면에 <strong>'홈 화면에 SuperBible 앱을 추가하시겠습니까?'</strong> 창이 뜨면 <strong>[설치]</strong>를 터치합니다.
                  </li>
                  <li>
                    스마트폰 바탕화면 및 앱 목록에 <strong>SuperBible 공식 고화질 아이콘</strong>이 자동 등록됩니다.
                  </li>
                </ol>
              </div>

              {/* KakaoTalk notice */}
              <p className="text-[11px] text-slate-400 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 leading-normal">
                💡 <strong>카카오톡 링크로 접속하신 경우:</strong> 우측 하단 점 3개(⋮) → <strong>[다른 브라우저로 열기]</strong>를 누른 후 설치하시면 정상 등록됩니다.
              </p>
            </div>
          )}

          {/* TAB 2: iOS / iPad */}
          {activeDeviceTab === 'ios' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
                <div className="font-black text-slate-900 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-[#0083e3]" />
                  <span>사파리(Safari) 홈 화면 앱 추가 방법</span>
                </div>
                <ol className="list-decimal pl-4 space-y-2 text-slate-600 text-[12px] leading-relaxed">
                  <li>
                    아이폰/아이패드 <strong>사파리(Safari)</strong> 하단 중앙의 <strong>공유 버튼 (네모에 위쪽 화살표 🔗)</strong>을 터치합니다.
                  </li>
                  <li>
                    메뉴를 아래로 스크롤하여 <strong>[홈 화면에 추가]</strong>를 선택합니다.
                  </li>
                  <li>
                    우측 상단의 <strong>[추가]</strong>를 터치하면 고화질 SuperBible 앱 아이콘이 생성됩니다.
                  </li>
                </ol>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>홈 화면에서 터치 시 주소창 없이 전체화면으로 실행됩니다.</span>
              </div>
            </div>
          )}

          {/* TAB 3: PC / Desktop */}
          {activeDeviceTab === 'pc' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
                <div className="font-black text-slate-900 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-[#0083e3]" />
                  <span>PC 크롬 / 엣지 데스크톱 앱 설치</span>
                </div>
                <ol className="list-decimal pl-4 space-y-2 text-slate-600 text-[12px] leading-relaxed">
                  <li>
                    브라우저 상단 주소창 우측의 <strong>설치 아이콘(🖥️ 또는 ➕)</strong>을 클릭합니다.
                  </li>
                  <li>
                    <strong>'SuperBible 앱을 설치하시겠습니까?'</strong>에서 <strong>[설치]</strong>를 클릭합니다.
                  </li>
                  <li>
                    바탕화면 및 작업 표시줄에 고정하여 원클릭으로 낭독할 수 있습니다.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Version & Changelog Accordion */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span>{APP_NAME} {APP_VERSION} 릴리즈 정보 ({APP_BUILD_DATE})</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-200 ${
                  showHistory ? 'rotate-90' : ''
                }`}
              />
            </button>

            {showHistory && (
              <div className="mt-2.5 space-y-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/80 animate-in fade-in duration-150">
                {APP_RELEASE_HISTORY.map((rel) => (
                  <div key={rel.version} className="space-y-1 pb-2 border-b border-slate-200 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between font-black text-slate-800 text-[11px]">
                      <span className="text-[#0083e3]">{rel.name} {rel.version}</span>
                      <span className="text-slate-400 font-medium">{rel.releaseDate}</span>
                    </div>
                    <ul className="list-disc pl-4 text-[10px] text-slate-600 space-y-0.5">
                      {rel.changes.map((ch, i) => (
                        <li key={i}>{ch}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs flex-shrink-0">
          <span className="text-slate-400 font-medium text-[11px]">
            {APP_NAME} {APP_VERSION} · {isInstalled ? '✅ 앱 설치 완료됨' : '미설치 상태'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition cursor-pointer text-xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
