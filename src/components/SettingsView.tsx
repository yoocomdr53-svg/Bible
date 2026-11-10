import React, { useState } from 'react';
import { LogOut, Bell, Shield, Smartphone, Globe, RefreshCw, CheckCircle2, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { AppInstallModal } from './AppInstallModal';
import { APP_NAME, APP_VERSION, APP_BUILD_DATE } from '../version';

interface SettingsViewProps {
  user: User;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  onToggleRole?: () => void;
  onBackToHome?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout, onOpenAdmin, onToggleRole, onBackToHome }) => {
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [readingSpeed, setReadingSpeed] = useState('1.0x');
  const [offlineCache, setOfflineCache] = useState(true);
  const [syncNotice, setSyncNotice] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const triggerManualSync = () => {
    setSyncNotice(true);
    setTimeout(() => setSyncNotice(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto smooth-scroll no-scrollbar bg-[#f8fafc] pb-24 text-slate-800 p-4 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">시스템 및 계정 설정</h2>
          <p className="text-xs text-slate-500">{APP_NAME} {APP_VERSION} & 로고스 학사 ERP 연동 관리</p>
        </div>
        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0083e3] text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <span>← 홈으로</span>
          </button>
        )}
      </div>

      {/* Official App Installation Card (Android APK / Tablet / PWA) */}
      <div className="bg-gradient-to-r from-[#0052cc] via-[#0284c7] to-[#071739] text-white rounded-2xl p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl p-0.5 bg-gradient-to-br from-amber-300 to-amber-500 shadow-md flex-shrink-0">
              <img src="/app-icon-512.png" alt="SuperBible" className="w-full h-full rounded-xl object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-black text-white truncate">{APP_NAME}</h4>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full flex-shrink-0">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-[11px] text-blue-100/90 mt-0.5 truncate">스마트폰 · 태블릿 홈화면 앱 설치 & APK 안내</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs active:scale-95 transition shadow-xs cursor-pointer flex-shrink-0"
          >
            앱 설치 안내
          </button>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#0083e3] font-black text-sm border border-blue-200 shadow-inner">
            {user.avatarText}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900">{user.name}</h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                {user.provider === 'google' ? 'Google Workspace' : '일반 교직원'}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{user.department}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">현재 접속 권한:</span>
          {onToggleRole ? (
            <button
              type="button"
              onClick={onToggleRole}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                user.role === 'admin'
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
              }`}
              title="클릭하여 일반회원 / 관리자 권한 전환"
            >
              <span>{user.role === 'admin' ? '👑 관리자 권한' : '👤 일반회원 권한'}</span>
              <span className="text-[10px] text-slate-400 font-normal">(변경)</span>
            </button>
          ) : (
            <span className="font-bold text-slate-700">
              {user.role === 'admin' ? '👑 관리자' : '👤 일반회원'}
            </span>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">구글 시트 학사명부 연동:</span>
          <span className="text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            정상 연결됨
          </span>
        </div>
      </div>

      {/* App Preferences */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft space-y-3">
        <h4 className="text-xs font-bold text-slate-700">성경 묵상 환경설정</h4>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">매일 아침 말씀 알림</span>
              <span className="text-[11px] text-slate-400">오전 07:00 오늘의 말씀 푸시 알림</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={alarmEnabled}
            onChange={(e) => setAlarmEnabled(e.target.checked)}
            className="w-5 h-5 rounded text-[#0083e3] focus:ring-blue-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-2">
          <div>
            <span className="text-xs font-bold text-slate-800 block">음성 낭독 재생 속도</span>
            <span className="text-[11px] text-slate-400">성경 오디오 배속 설정</span>
          </div>
          <select
            value={readingSpeed}
            onChange={(e) => setReadingSpeed(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
          >
            <option value="0.8x">0.8x (느리게)</option>
            <option value="1.0x">1.0x (보통)</option>
            <option value="1.2x">1.2x (빠르게)</option>
            <option value="1.5x">1.5x</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-2">
          <div>
            <span className="text-xs font-bold text-slate-800 block">오프라인 성경 데이터 보관</span>
            <span className="text-[11px] text-slate-400">네트워크 없을 때도 성경 열람</span>
          </div>
          <input
            type="checkbox"
            checked={offlineCache}
            onChange={(e) => setOfflineCache(e.target.checked)}
            className="w-5 h-5 rounded text-[#0083e3] focus:ring-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Admin Management Card (관리자만 노출) */}
      {user.role === 'admin' && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/90 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
                👑
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-amber-950">관리자 성경관리</h4>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded-full">
                    관리자 전용
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 mt-0.5">회원 성경낭독 진도, 음원 검수 및 수료증 발급</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs cursor-pointer active:scale-95 transition shadow-xs flex-shrink-0"
            >
              프로그램 열기
            </button>
          </div>
        </div>
      )}

      {/* Cloud Sync Button */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-800">클라우드 데이터 동기화</h4>
            <p className="text-[11px] text-slate-400">읽은 장, 녹음 오디오, 하이라이트 동기화</p>
          </div>
          <button
            onClick={triggerManualSync}
            className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#0083e3] hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncNotice ? 'animate-spin' : ''}`} />
            <span>{syncNotice ? '동기화 완료' : '지금 동기화'}</span>
          </button>
        </div>
      </div>

      {/* Logout / Switch back to ERP */}
      <div className="pt-2">
        <button
          onClick={() => {
            if (window.confirm('SuperBible 앱에서 나가시겠습니까? (로그아웃)')) {
              onLogout();
            }
          }}
          className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>SuperBible 앱에서 나가기 (로그아웃)</span>
        </button>
      </div>

      {/* System Version */}
      <div className="text-center pt-2 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-500">
          LOGOS ERP 2.0 & {APP_NAME} {APP_VERSION} (Build {APP_BUILD_DATE})
        </p>
        <p>© 2026 Logos Academy System. All rights reserved.</p>
      </div>

      {/* SuperBible App Installation & APK Modal */}
      <AppInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
