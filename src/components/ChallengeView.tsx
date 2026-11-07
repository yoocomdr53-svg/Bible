import React, { useState } from 'react';
import {
  ChevronLeft,
  BookOpen,
  Calendar,
  Check,
  BellOff,
  Info,
  X,
} from 'lucide-react';
import { BIBLE_BOOKS } from '../data/bibleData';
import { ReadingDayPlan, User } from '../types';

interface ChallengeViewProps {
  user?: User;
  plans: ReadingDayPlan[];
  onTogglePlan: (day: number) => void;
  onNavigateToBible: (book: string, chapter?: number) => void;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  user,
  plans,
  onNavigateToBible,
}) => {
  // Sub-screens:
  // 'main': 도전!일독 메인 화면
  // 'matrix': 일독 진행표 (66권 매트릭스)
  // 'plan': 읽기 계획표 (통독12목표)
  // 'create-plan': 읽기 계획 만들기 (이미지 0 & 1 통합 화면)
  // 'edit-plan': 계획표 수정 (이미지 2/3)
  const [subScreen, setSubScreen] = useState<'main' | 'matrix' | 'plan' | 'create-plan' | 'edit-plan'>('main');

  // Plan Details state (editable via '계획표 수정')
  const [planTitle, setPlanTitle] = useState('통독12목표');
  const [planStartDate, setPlanStartDate] = useState('2026.01.01');
  const [planEndDate] = useState('2026.03.01');
  const [planPortion, setPlanPortion] = useState('구약/신약');
  const [planTranslation, setPlanTranslation] = useState('개역개정');
  const [planChapters, setPlanChapters] = useState('20장씩');
  const [planPush, setPlanPush] = useState(false);

  // Edit Plan temporary form state
  const [editTitle, setEditTitle] = useState(planTitle);
  const [editStartDate, setEditStartDate] = useState(planStartDate);
  const [editPortion, setEditPortion] = useState(planPortion);
  const [editTranslation, setEditTranslation] = useState(planTranslation);
  const [editChapters, setEditChapters] = useState(planChapters);
  const [editPush, setEditPush] = useState(planPush);

  // Manage menu dropdown state
  const [showManageMenu, setShowManageMenu] = useState(false);

  // Create Plan form state (Image 0 & 1)
  const [participationType, setParticipationType] = useState<'alone' | 'family' | 'church'>('alone');
  const [selectedTranslation, setSelectedTranslation] = useState('개역개정');
  const [readingScope, setReadingScope] = useState<'all' | 'ot' | 'nt' | 'custom'>('all');
  const [readingMethod, setReadingMethod] = useState<'read' | 'record'>('read');

  // Completed chapters set in Matrix (Default: 26 chapters = 2% of 1,189, matching screenshot)
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // 창세기 1~21장 (21 chapters)
    for (let i = 1; i <= 21; i++) {
      initial.add(`창세기-${i}`);
    }
    // 출애굽기 13~17장 (5 chapters, exactly highlighted in user screenshot)
    for (let i = 13; i <= 17; i++) {
      initial.add(`출애굽기-${i}`);
    }
    return initial; // total 26 chapters!
  });

  // State for reading plan screen
  const [planTab, setPlanTab] = useState<'plan' | 'attendance'>('plan');
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Total Bible Chapters: 1,189
  const TOTAL_CHAPTERS = 1189;
  const readChaptersCount = completedChapters.size;
  const matrixProgressPercent = Math.round((readChaptersCount / TOTAL_CHAPTERS) * 100);

  // Toggle chapter in Matrix
  const toggleChapter = (bookName: string, ch: number) => {
    const key = `${bookName}-${ch}`;
    setCompletedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Display user name matching screenshot
  const greetingName = user?.name || 'wounhee“pollRuy”Ruy';

  // ==========================================
  // SCREEN 4: 읽기 계획 만들기 (이미지 0 & 1 통합 화면)
  // ==========================================
  if (subScreen === 'create-plan') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] relative overflow-hidden select-none text-slate-800">
        {/* Top Header (Deep Blue #1b64b9) */}
        <header className="bg-[#1b64b9] text-white px-4 pt-3 pb-3.5 shadow-md z-30 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSubScreen('main')}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="뒤로 가기"
            >
              <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex-1 text-center -ml-6">
              읽기 계획 만들기
            </h1>
            <div className="w-6" />
          </div>
          <p className="text-center text-xs sm:text-sm text-blue-100 font-medium mt-1">
            읽을 성경과 방식을 선택해 주세요.
          </p>
        </header>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-6">
          {/* Section 1: 참여 유형 */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
            <h2 className="text-base font-black text-slate-900">참여 유형</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 justify-items-center">
              {/* 혼자 읽기 */}
              <button
                type="button"
                onClick={() => setParticipationType('alone')}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center relative transition-all ${
                    participationType === 'alone'
                      ? 'bg-[#dbeafe] ring-2 ring-[#1b64b9]'
                      : 'bg-slate-100 hover:bg-slate-200/60'
                  }`}
                >
                  <svg
                    className={`w-10 h-10 ${
                      participationType === 'alone' ? 'fill-[#1b64b9]' : 'fill-slate-400'
                    }`}
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="7" r="4" />
                    <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
                  </svg>
                  {participationType === 'alone' && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1b64b9] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2.5 font-bold ${
                    participationType === 'alone' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  혼자 읽기
                </span>
              </button>

              {/* 가족과 함께 읽기 */}
              <button
                type="button"
                onClick={() => setParticipationType('family')}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center relative transition-all ${
                    participationType === 'family'
                      ? 'bg-[#dbeafe] ring-2 ring-[#1b64b9]'
                      : 'bg-slate-100 hover:bg-slate-200/60'
                  }`}
                >
                  <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none">
                    <circle cx="17" cy="14" r="5" fill="#14b8a6" />
                    <path d="M10 32v-5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5" fill="#14b8a6" />
                    <circle cx="31" cy="14" r="5" fill="#0284c7" />
                    <path d="M24 32v-5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5" fill="#0284c7" />
                    <circle cx="24" cy="22" r="4" fill="#f59e0b" />
                    <path d="M19 35v-4a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4" fill="#f59e0b" />
                  </svg>
                  {participationType === 'family' && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1b64b9] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2.5 font-bold text-center ${
                    participationType === 'family' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  가족과 함께 읽기
                </span>
              </button>

              {/* 교회/그룹 */}
              <button
                type="button"
                onClick={() => setParticipationType('church')}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center relative transition-all ${
                    participationType === 'church'
                      ? 'bg-[#dbeafe] ring-2 ring-[#1b64b9]'
                      : 'bg-slate-100 hover:bg-slate-200/60'
                  }`}
                >
                  <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none">
                    <path d="M18 7v10M14 11h8" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M13 18l5-6 5 6v14h-10V18z" fill="#0284c7" />
                    <path d="M23 23h15v9H23v-9z" fill="#0284c7" />
                    <path d="M21 23l4-5h15l-4 5H21z" fill="#14b8a6" />
                    <path d="M16 32v-6a2 2 0 0 1 4 0v6" fill="#f8fafc" />
                  </svg>
                  {participationType === 'church' && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1b64b9] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2.5 font-bold ${
                    participationType === 'church' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  교회/그룹
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: 성경 번역본 선택 */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-slate-900">성경 번역본 선택</h2>
              <span className="w-4 h-4 rounded-full bg-[#1b64b9] text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            </div>
            <div className="relative">
              <select
                value={selectedTranslation}
                onChange={(e) => setSelectedTranslation(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold text-sm appearance-none focus:outline-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="개역개정">개역개정</option>
                <option value="개역한글">개역한글</option>
                <option value="새번역">새번역</option>
                <option value="공동번역">공동번역</option>
                <option value="NIV">NIV (English)</option>
                <option value="ESV">ESV (English)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Section 3: 읽을 범위 */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-3">
            <h2 className="text-base font-black text-slate-900">읽을 범위</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'all', label: '성경 전체' },
                { id: 'ot', label: '구약' },
                { id: 'nt', label: '신약' },
              ].map((item) => {
                const isSelected = readingScope === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setReadingScope(item.id as 'all' | 'ot' | 'nt' | 'custom')}
                    className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-extrabold text-center relative transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#dbeafe] text-slate-900 border-2 border-blue-400 shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#1b64b9] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                    {item.label}
                  </button>
                );
              })}
            </div>
            {/* 권 별 선택 button below */}
            <button
              type="button"
              onClick={() => setReadingScope('custom')}
              className={`w-32 py-3 px-2 rounded-xl text-xs sm:text-sm font-extrabold text-center relative transition cursor-pointer ${
                readingScope === 'custom'
                  ? 'bg-[#dbeafe] text-slate-900 border-2 border-blue-400 shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {readingScope === 'custom' && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#1b64b9] text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
              권 별 선택
            </button>
          </div>

          {/* Section 4: 방법 선택 */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
            <h2 className="text-base font-black text-slate-900">방법 선택</h2>
            <div className="grid grid-cols-2 gap-4 justify-items-center">
              {/* 읽거나 듣기 */}
              <button
                type="button"
                onClick={() => setReadingMethod('read')}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center relative transition-all ${
                    readingMethod === 'read'
                      ? 'bg-[#dbeafe] ring-2 ring-[#1b64b9]'
                      : 'bg-slate-100 hover:bg-slate-200/60'
                  }`}
                >
                  <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
                    <path
                      d="M10 24a14 14 0 0 1 28 0"
                      stroke="#0ea5e9"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <rect x="8" y="22" width="5" height="9" rx="2.5" fill="#0284c7" />
                    <rect x="35" y="22" width="5" height="9" rx="2.5" fill="#0284c7" />
                    <path d="M14 31l10-4 10 4v4l-10-4-10 4v-4z" fill="#0284c7" />
                    <path
                      d="M14 31l10 4 10-4"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  {readingMethod === 'read' && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1b64b9] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2.5 font-bold ${
                    readingMethod === 'read' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  읽거나 듣기
                </span>
              </button>

              {/* 녹음 */}
              <button
                type="button"
                onClick={() => setReadingMethod('record')}
                className="flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center relative transition-all ${
                    readingMethod === 'record'
                      ? 'bg-[#dbeafe] ring-2 ring-[#1b64b9]'
                      : 'bg-slate-100 hover:bg-slate-200/60'
                  }`}
                >
                  <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
                    <rect x="19" y="10" width="10" height="18" rx="5" fill="#14b8a6" />
                    <path
                      d="M14 23a10 10 0 0 0 20 0"
                      stroke="#0284c7"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M24 33v6M18 39h12"
                      stroke="#0284c7"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  {readingMethod === 'record' && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1b64b9] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2.5 font-bold ${
                    readingMethod === 'record' ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  녹음
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Sticky Action: 다음 */}
        <div className="p-3 bg-white border-t border-slate-200 shadow-lg flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              // Apply choices to plan
              setPlanTranslation(selectedTranslation);
              if (readingScope === 'ot') {
                setPlanPortion('구약');
              } else if (readingScope === 'nt') {
                setPlanPortion('신약');
              } else if (readingScope === 'all') {
                setPlanPortion('구약/신약');
              } else {
                setPlanPortion('권 별 선택');
              }
              setSubScreen('plan');
            }}
            className="w-full py-3.5 bg-[#1b64b9] hover:bg-blue-700 text-white font-extrabold text-base rounded-xl transition cursor-pointer shadow-md active:scale-98"
          >
            다음
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 5: 계획표 수정 (이미지 2/3 화면)
  // ==========================================
  if (subScreen === 'edit-plan') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] relative overflow-hidden select-none text-slate-800">
        {/* Top Header (Deep Blue #1b64b9) */}
        <header className="bg-[#1b64b9] text-white px-3 py-3 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSubScreen('plan')}
            className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="뒤로 가기"
          >
            <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
          </button>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex-1 text-center -ml-6">
            계획표 수정
          </h1>
          <div className="w-6" />
        </header>

        {/* Form Fields Card */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
            {/* 제목 */}
            <div className="flex items-center gap-3">
              <label className="w-16 sm:w-20 text-sm font-extrabold text-[#1b64b9] flex-shrink-0">
                제목
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-blue-500 focus:border-blue-500"
                placeholder="통독12목표"
              />
            </div>

            {/* 시작일 */}
            <div className="flex items-center gap-3">
              <label className="w-16 sm:w-20 text-sm font-extrabold text-[#1b64b9] flex-shrink-0">
                시작일
              </label>
              <input
                type="text"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-blue-500 focus:border-blue-500"
                placeholder="2026.01.01"
              />
            </div>

            {/* 분량 */}
            <div className="flex items-center gap-3">
              <label className="w-16 sm:w-20 text-sm font-extrabold text-[#1b64b9] flex-shrink-0">
                분량
              </label>
              <div className="flex-1 px-3.5 py-2.5 bg-[#f3f5f9] border border-slate-200 rounded-lg text-sm font-bold text-slate-900">
                {editPortion}
              </div>
            </div>

            {/* 번역본 */}
            <div className="flex items-center gap-3">
              <label className="w-16 sm:w-20 text-sm font-extrabold text-[#1b64b9] flex-shrink-0">
                번역본
              </label>
              <input
                type="text"
                value={editTranslation}
                onChange={(e) => setEditTranslation(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-blue-500 focus:border-blue-500"
                placeholder="개역개정"
              />
            </div>

            {/* 장수 변경 */}
            <div className="flex items-center gap-3">
              <label className="w-16 sm:w-20 text-sm font-extrabold text-[#1b64b9] flex-shrink-0 leading-tight">
                장수<br />변경
              </label>
              <input
                type="text"
                value={editChapters}
                onChange={(e) => setEditChapters(e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-blue-500 focus:border-blue-500"
                placeholder="20장씩"
              />
            </div>

            {/* 읽기 계획 푸시 알림 */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-extrabold text-slate-800">
                읽기 계획 푸시 알림
              </span>
              <button
                type="button"
                onClick={() => setEditPush(!editPush)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  editPush ? 'bg-[#1b64b9]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-xs ${
                    editPush ? 'left-[26px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Split Action Buttons: 취소 (Left Gray) | 수정 (Right Deep Blue) */}
        <div className="flex border-t border-slate-200 z-30 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSubScreen('plan')}
            className="flex-1 py-3.5 bg-[#94a3b8] hover:bg-[#8392a0] text-white font-black text-sm sm:text-base text-center transition cursor-pointer active:brightness-95"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              // Save edits to plan state
              setPlanTitle(editTitle);
              setPlanStartDate(editStartDate);
              setPlanPortion(editPortion);
              setPlanTranslation(editTranslation);
              setPlanChapters(editChapters);
              setPlanPush(editPush);
              setSubScreen('plan');
            }}
            className="flex-1 py-3.5 bg-[#1b64b9] hover:bg-blue-700 text-white font-black text-sm sm:text-base text-center transition cursor-pointer active:brightness-95"
          >
            수정
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 2: 일독 진행표 (Image 1)
  // ==========================================
  if (subScreen === 'matrix') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f8fafc] relative overflow-hidden select-none text-slate-800">
        {/* Top Header (Deep Blue #1b64b9) */}
        <header className="bg-[#1b64b9] text-white px-3 py-2.5 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubScreen('main')}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="뒤로 가기"
            >
              <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-1.5 cursor-pointer">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">일독 진행표</h1>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                ▽
              </span>
            </div>
          </div>
          <div className="w-6" />
        </header>

        {/* 66 Books Chapter Matrix List */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-4 pb-28 bg-white">
          {BIBLE_BOOKS.map((book) => {
            const chapters = Array.from({ length: book.chaptersCount }, (_, i) => i + 1);

            return (
              <div
                key={book.id}
                className="flex items-start border-b border-slate-100 pb-3.5 pt-1"
              >
                {/* Left Column: Book Name & 본문보기 > button */}
                <div className="w-20 sm:w-24 flex-shrink-0 pr-2 pt-0.5">
                  <h3 className="text-[15px] sm:text-base font-black text-[#1b64b9] leading-tight">
                    {book.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigateToBible(book.name, 1)}
                    className="mt-1.5 px-2 py-0.5 rounded-md bg-slate-500 hover:bg-slate-600 text-white text-[10px] font-bold tracking-tight flex items-center gap-0.5 transition cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <span>본문보기</span>
                    <span>&gt;</span>
                  </button>
                </div>

                {/* Right Column: 10-Column Chapter Number Grid */}
                <div className="flex-1 grid grid-cols-10 gap-1 sm:gap-1.5 justify-items-center">
                  {chapters.map((ch) => {
                    const isRead = completedChapters.has(`${book.name}-${ch}`);
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleChapter(book.name, ch)}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-90 ${
                          isRead
                            ? 'bg-[#f59e0b] text-slate-950 font-black shadow-xs'
                            : 'text-slate-800 hover:bg-slate-100'
                        }`}
                        title={`${book.name} ${ch}장 (터치하여 읽음/미완료 토글)`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Sticky Floating Status Bar (Dark Charcoal, matching screenshot) */}
        <div className="absolute left-3 right-3 bottom-3 z-30">
          <div className="bg-[#2c333e] text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-slate-700/60 backdrop-blur-md">
            {/* Top row: Plan title & percentage */}
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold pb-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="truncate">채은성 - 개역개정 | 구약/신약</span>
                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] flex-shrink-0">
                  ▽
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-amber-300 ml-2">
                {matrixProgressPercent}%
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden my-1">
              <div
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, matrixProgressPercent)}%` }}
              />
            </div>

            {/* Bottom row: 진행률 & chapters count */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-300 pt-1 font-semibold">
              <span>진행률</span>
              <span className="font-mono text-white">
                <span className="text-amber-300 font-bold">{readChaptersCount}</span> / {TOTAL_CHAPTERS.toLocaleString()}장
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 3: 읽기 계획표 (Image 2)
  // ==========================================
  if (subScreen === 'plan') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] relative overflow-hidden select-none text-slate-800">
        {/* Top Header (Deep Blue #1b64b9) */}
        <header className="bg-[#1b64b9] text-white px-3 py-2.5 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubScreen('main')}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="뒤로 가기"
            >
              <ChevronLeft className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">읽기 계획표</h1>
          </div>

          {/* Right: Notification Mute icon | 관리 */}
          <div className="flex items-center gap-2 text-white text-xs font-bold">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title={isMuted ? '알림 켜기' : '알림 끄기'}
            >
              <BellOff className="w-5 h-5 text-white" />
            </button>
            <span className="text-white/40">|</span>

            {/* 관리 버튼 & 설정/수정/삭제 팝업 메뉴 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowManageMenu(!showManageMenu)}
                className="hover:underline cursor-pointer py-1 px-1.5 rounded hover:bg-white/10"
              >
                관리
              </button>

              {showManageMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40 bg-black/20"
                    onClick={() => setShowManageMenu(false)}
                  />

                  {/* Menu Options Sheet/Popup */}
                  <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                    {/* 설정 */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowManageMenu(false);
                        alert('읽기 계획표 설정: 목표 기간 및 알림 주기를 관리할 수 있습니다.');
                      }}
                      className="w-full px-4 py-2 text-left text-xs sm:text-sm font-bold hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700"
                    >
                      설정
                    </button>

                    {/* 수정 -> 계획표 수정 화면으로 이동 */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowManageMenu(false);
                        // initialize edit state
                        setEditTitle(planTitle);
                        setEditStartDate(planStartDate);
                        setEditPortion(planPortion);
                        setEditTranslation(planTranslation);
                        setEditChapters(planChapters);
                        setEditPush(planPush);
                        setSubScreen('edit-plan');
                      }}
                      className="w-full px-4 py-2 text-left text-xs sm:text-sm font-bold hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-700 border-t border-slate-100"
                    >
                      수정
                    </button>

                    {/* 삭제 */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowManageMenu(false);
                        if (confirm('현재 읽기 계획표를 삭제하시겠습니까?')) {
                          setPlanTitle('새로운 계획표');
                          setSubScreen('main');
                        }
                      }}
                      className="w-full px-4 py-2 text-left text-xs sm:text-sm font-bold hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 pb-20">
          {/* Main Plan Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100">
            {/* Card Header: Open Book icon + Title & Date Range */}
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-slate-800" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {planTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-semibold mb-4 ml-7">
              {planStartDate} ~ {planEndDate}
            </p>

            {/* 3 Stats Columns */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 py-1 text-center">
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">진행률</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">0%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold mb-1">연속읽기</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">0일</p>
              </div>
              <div className="cursor-pointer" onClick={() => alert('획득한 성경 통독 배지 목록')}>
                <p className="text-xs text-slate-400 font-bold mb-1 flex items-center justify-center gap-0.5">
                  <span>배지</span>
                  <span>&gt;</span>
                </p>
                <p className="text-xl sm:text-2xl font-black text-slate-900">0개</p>
              </div>
            </div>

            {/* Cute Runner Illustration above progress bar */}
            <div className="pt-4 pb-1">
              <div className="relative w-full h-8 flex items-center">
                <div
                  className="absolute bottom-1.5 transition-all duration-300"
                  style={{ left: '15%' }}
                >
                  <span className="text-2xl select-none" role="img" aria-label="runner">
                    🏃
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                  style={{ width: '15%' }}
                />
              </div>
            </div>

            {/* 이번주 읽기 현황 Section */}
            <div className="pt-5 border-t border-slate-100 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-800 cursor-pointer">
                  <span>📅 이번주 읽기 현황</span>
                  <span>&gt;</span>
                </div>
                <Info className="w-4 h-4 text-blue-500 cursor-pointer" />
              </div>

              {/* Day of Week Circles (일 월 화 수 목 금 토) */}
              <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => {
                  const isToday = idx === 6; // Saturday
                  return (
                    <div
                      key={day}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isToday
                          ? 'bg-blue-50 text-[#1b64b9] border border-blue-200'
                          : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tabs: 읽기계획 | 출석 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button
                type="button"
                onClick={() => setPlanTab('plan')}
                className={`flex-1 py-3 text-center text-sm font-black transition cursor-pointer ${
                  planTab === 'plan'
                    ? 'text-[#1b64b9] border-b-2 border-[#1b64b9]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                읽기계획
              </button>
              <button
                type="button"
                onClick={() => setPlanTab('attendance')}
                className={`flex-1 py-3 text-center text-sm font-black transition cursor-pointer ${
                  planTab === 'attendance'
                    ? 'text-[#1b64b9] border-b-2 border-[#1b64b9]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                출석
              </button>
            </div>

            {/* Tab 1: 읽기계획 List */}
            {planTab === 'plan' && (
              <div className="p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1 cursor-pointer">
                  <span>읽기 현황 &gt;</span>
                  <span className="text-[11px] text-blue-600">오늘 통독 분량</span>
                </div>

                <div className="space-y-2">
                  {plans.map((p) => (
                    <div
                      key={p.day}
                      className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 flex items-center justify-between transition bg-slate-50/60"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1b64b9]">Day {p.day}</span>
                          <span className="text-xs font-semibold text-slate-800">{p.portion}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.verseRange}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigateToBible('창세기', 1)}
                        className="px-3 py-1 rounded-lg bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        읽기
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: 출석 현황 */}
            {planTab === 'attendance' && (
              <div className="p-6 text-center text-slate-500 text-xs">
                <p className="font-bold text-slate-800 text-sm mb-1">성경 통독 출석부</p>
                <p>매일 성경 말씀을 낭독하고 출석 도장을 모아보세요.</p>
                <div className="mt-4 p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-blue-800 text-xs font-semibold">
                  이번 달 총 출석일수: 14일 달성 🔥
                </div>
              </div>
            )}
          </div>

          {/* Bottom Update Notice Banner */}
          {showNotificationBanner && (
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex items-center justify-between text-xs text-slate-700">
              <span className="font-semibold truncate">
                [업데이트 안내] 더 편리해진 ‘도전!일독’을 만나보세요
              </span>
              <button
                type="button"
                onClick={() => setShowNotificationBanner(false)}
                className="text-slate-400 hover:text-slate-600 p-1 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 1: 도전!일독 메인 화면 (Image 0)
  // ==========================================
  return (
    <div className="flex-1 overflow-y-auto smooth-scroll no-scrollbar bg-[#f4f7fb] pb-24 text-slate-800 p-4 space-y-4 select-none">
      {/* 1. Top Greeting Header */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1b64b9] tracking-tight">
            {greetingName}님,
          </h1>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 tracking-tight">
            말씀으로 하루를 채우세요.
          </p>
        </div>

        {/* User Profile Avatar Icon */}
        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
          <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>

      {/* 2. Dashed Action Buttons: + 읽기표 새로 만들기 | + 계획표 새로 만들기 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setSubScreen('matrix')}
          className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white/60 hover:bg-white rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1b64b9] transition-all cursor-pointer text-center shadow-2xs active:scale-98"
        >
          + 읽기표 새로 만들기
        </button>
        <button
          type="button"
          onClick={() => setSubScreen('create-plan')}
          className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white/60 hover:bg-white rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1b64b9] transition-all cursor-pointer text-center shadow-2xs active:scale-98"
        >
          + 계획표 새로 만들기
        </button>
      </div>

      {/* 3. Two Side-by-Side Cards: 내 전체 읽기표 (Left) vs 내 전체 계획표 (Right) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* CARD 1: 내 전체 읽기표 (Left Card) */}
        <div className="bg-white rounded-[26px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            {/* Top link pill: 내 전체 읽기표 > */}
            <div className="flex justify-center mb-3">
              <button
                type="button"
                onClick={() => setSubScreen('matrix')}
                className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100/80 text-[#1b64b9] text-xs font-bold transition cursor-pointer"
              >
                내 전체 읽기표 &gt;
              </button>
            </div>

            {/* Icon: Open Book with Checkmark */}
            <div className="flex justify-center my-3">
              <div className="w-16 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-[#1b64b9] shadow-inner relative">
                <BookOpen className="w-9 h-9 stroke-[1.8]" />
                <span className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              </div>
            </div>

            {/* Title: 채은성 */}
            <h2 className="text-base sm:text-lg font-black text-slate-900 text-center tracking-tight">
              채은성
            </h2>

            {/* Progress: 2% 진행 중 */}
            <p className="text-sm font-extrabold text-[#0284c7] text-center mt-1">
              {matrixProgressPercent}% 진행 중
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-3">
              <div
                className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, matrixProgressPercent)}%` }}
              />
            </div>
          </div>

          {/* Action Buttons: 읽기 시작 / 읽기표 보기 */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToBible('출애굽기', 18)}
              className="w-full py-2.5 rounded-xl bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition shadow-sm cursor-pointer"
            >
              읽기 시작
            </button>
            <button
              type="button"
              onClick={() => setSubScreen('matrix')}
              className="w-full py-2.5 rounded-xl border border-[#1b64b9] hover:bg-blue-50 active:scale-95 text-[#1b64b9] font-extrabold text-xs sm:text-sm transition cursor-pointer"
            >
              읽기표 보기
            </button>
          </div>
        </div>

        {/* CARD 2: 내 전체 계획표 (Right Card) */}
        <div className="bg-white rounded-[26px] p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            {/* Top link pill: 내 전체 계획표 > */}
            <div className="flex justify-center mb-3">
              <button
                type="button"
                onClick={() => setSubScreen('plan')}
                className="px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100/80 text-[#1b64b9] text-xs font-bold transition cursor-pointer"
              >
                내 전체 계획표 &gt;
              </button>
            </div>

            {/* Icon: Calendar with Checkmark */}
            <div className="flex justify-center my-3">
              <div className="w-16 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-[#1b64b9] shadow-inner relative">
                <Calendar className="w-9 h-9 stroke-[1.8]" />
                <span className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
              </div>
            </div>

            {/* Title: 통독12목표 */}
            <h2 className="text-base sm:text-lg font-black text-slate-900 text-center tracking-tight">
              {planTitle}
            </h2>

            {/* Progress: 0% 진행 중 */}
            <p className="text-sm font-extrabold text-[#0284c7] text-center mt-1">
              0% 진행 중
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-3">
              <div
                className="bg-[#1b64b9] h-full rounded-full transition-all duration-300"
                style={{ width: '0%' }}
              />
            </div>
          </div>

          {/* Action Buttons: 오늘 읽기 / 계획표 보기 */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToBible('야고보서', 1)}
              className="w-full py-2.5 rounded-xl bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition shadow-sm cursor-pointer"
            >
              오늘 읽기
            </button>
            <button
              type="button"
              onClick={() => setSubScreen('plan')}
              className="w-full py-2.5 rounded-xl border border-[#1b64b9] hover:bg-blue-50 active:scale-95 text-[#1b64b9] font-extrabold text-xs sm:text-sm transition cursor-pointer"
            >
              계획표 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
