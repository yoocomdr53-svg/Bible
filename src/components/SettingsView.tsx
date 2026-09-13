import React, { useState } from 'react';
import { LogOut, Bell, Shield, Smartphone, Globe, RefreshCw, CheckCircle2, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface SettingsViewProps {
  user: User;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onLogout }) => {
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [readingSpeed, setReadingSpeed] = useState('1.0x');
  const [offlineCache, setOfflineCache] = useState(true);
  const [syncNotice, setSyncNotice] = useState(false);

  const triggerManualSync = () => {
    setSyncNotice(true);
    setTimeout(() => setSyncNotice(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto smooth-scroll no-scrollbar bg-[#f8fafc] pb-24 text-slate-800 p-4 space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">시스템 및 계정 설정</h2>
        <p className="text-xs text-slate-500">바이블 애플 & 로고스 학사 ERP 연동 관리</p>
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
          onClick={onLogout}
          className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOS ERP 로그인 포털로 나가기 (로그아웃)</span>
        </button>
      </div>

      {/* System Version */}
      <div className="text-center pt-2 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-500">LOGOS ERP 2.0 & 바이블 애플 v2.4.0</p>
        <p>© 2026 Logos Academy System. All rights reserved.</p>
      </div>
    </div>
  );
};
