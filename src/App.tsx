import React, { useState, useEffect, Component, ReactNode, ErrorInfo } from 'react';
import { RefreshCw } from 'lucide-react';
import { User, ActiveTab, ActiveModal, BibleVerse, ReadingDayPlan, UserRecording } from './types';
import { TODAY_VERSE, INITIAL_READING_PLANS, INITIAL_RECORDINGS, addTodayReadChapter, markChapterRangeCompleted } from './data/bibleData';
import { LoginView } from './components/LoginView';
import { BibleDashboard } from './components/BibleDashboard';
import { HelpModals } from './components/HelpModals';
import { VerseCardModal } from './components/VerseCardModal';
import { AudioRecordingModal } from './components/AudioRecordingModal';
import { AppInstallModal } from './components/AppInstallModal';
import { initAutoUpdateService } from './services/updateService';
import {
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  updateMemberReadingProgress,
  addMemberRecordingToAdmin,
} from './services/authService';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends (Component as any) {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
            <span className="text-3xl">📖</span>
          </div>
          <h2 className="text-lg font-black text-white mb-2">성경 읽기 화면 불러오기</h2>
          <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
            화면 전환 중 일시적 지연이 발생했습니다.<br />아래 버튼을 누르면 성경 첫 화면으로 즉시 연결됩니다.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-6 py-3 rounded-2xl bg-[#1b64b9] hover:bg-blue-600 active:scale-95 text-white font-black text-sm shadow-md transition cursor-pointer"
          >
            말씀 읽기 화면으로 이동
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DEFAULT_CONNECTED_ADMIN_USER: User = {
  id: 'user-yoocomdr',
  name: '유원희 (로고스 관리자)',
  email: 'yoocomdr57@gmail.com',
  avatarText: '원희',
  role: 'admin',
  provider: 'standard',
  schoolName: '로고스 수퍼바이블 공동체',
  department: '교목실 & 성경통독 총괄관리부',
  consecutiveDays: 30,
  ntProgress: 0,
  todayVersesRead: 0,
  recordingsCount: 3,
};

function getSavedUser(): User {
  const sessionUser = getActiveSession();
  if (sessionUser && sessionUser.id) {
    return sessionUser;
  }
  return DEFAULT_CONNECTED_ADMIN_USER;
}

function getSavedView(): 'login' | 'dashboard' {
  const sessionUser = getActiveSession();
  // 로그인된 세션이 있는 경우 계속 로그인 상태를 유지하여 바로 홈(대시보드) 화면으로 진입
  // 나가기(로그아웃) 버튼을 눌러 세션이 해제된 경우에만 로그인 화면 표시
  if (sessionUser && sessionUser.id) {
    return 'dashboard';
  }
  return 'login';
}

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'dashboard'>(getSavedView);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [updatingVersion, setUpdatingVersion] = useState<string | null>(null);

  // Initialize real-time auto-update system (PC desktop and mobile PWA)
  useEffect(() => {
    const cleanup = initAutoUpdateService((newVer) => {
      setUpdatingVersion(newVer);
    });
    return cleanup;
  }, []);

  // User session state
  const [user, setUser] = useState<User>(getSavedUser);

  const [readingPlans, setReadingPlans] = useState<ReadingDayPlan[]>(INITIAL_READING_PLANS);
  const [recordings, setRecordings] = useState<UserRecording[]>(() => {
    try {
      const raw = localStorage.getItem('superbible_user_recordings_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_RECORDINGS;
  });
  const [verseForCard, setVerseForCard] = useState<BibleVerse>(TODAY_VERSE);
  const [verseForRecorder, setVerseForRecorder] = useState<BibleVerse>(TODAY_VERSE);

  // Handlers
  const handleOpenModal = (modal: ActiveModal) => {
    setActiveModal(modal);
  };

  const handleCloseModal = () => {
    setActiveModal('none');
  };

  const [dashboardInitialTab, setDashboardInitialTab] = useState<ActiveTab>('home');

  // Direct login from standard form or simple sign-up form
  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    saveActiveSession(authenticatedUser);
    setDashboardInitialTab('home');
    setCurrentView('dashboard');
  };

  // Open settings with admin authentication
  const handleOpenSettingsAsAdmin = (adminUser: User) => {
    setUser(adminUser);
    saveActiveSession(adminUser);
    setDashboardInitialTab('settings');
    setCurrentView('dashboard');
  };

  // Logout back to ERP Login & clear session
  const handleLogout = () => {
    clearActiveSession();
    setDashboardInitialTab('home');
    setCurrentView('login');
  };

  // Toggle user role between admin & saint for easy testing
  const handleToggleRole = () => {
    setUser((u) => {
      const isAdmin = u.role === 'admin';
      const updated: User = {
        ...u,
        role: isAdmin ? 'saint' : 'admin',
        name: isAdmin ? 'yooc (성도)' : '로고스 관리자',
        avatarText: isAdmin ? 'yooc' : '관리',
        email: isAdmin ? 'yooc.dev@gmail.com' : 'yoocomdr57@gmail.com',
      };
      saveActiveSession(updated);
      return updated;
    });
  };

  // Toggle reading plan completion
  const handleTogglePlan = (day: number) => {
    setReadingPlans((prev) =>
      prev.map((p) => {
        if (p.day === day) {
          const updated = !p.completed;
          setUser((u) => {
            const nextCount = updated ? u.todayVersesRead + 1 : Math.max(0, u.todayVersesRead - 1);
            const nextUser = { ...u, todayVersesRead: nextCount };
            saveActiveSession(nextUser);
            return nextUser;
          });
          if (updated) {
            updateMemberReadingProgress(user.email, p.portion.split(' ')[0] || '창세기', 1);
          }
          return { ...p, completed: updated };
        }
        return p;
      })
    );
  };

  // Save new audio recording
  const handleSaveRecording = (newRec: UserRecording) => {
    setRecordings((prev) => {
      const updated = [newRec, ...prev];
      try {
        localStorage.setItem('superbible_user_recordings_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setUser((u) => {
      const nextUser = { ...u, recordingsCount: u.recordingsCount + 1 };
      saveActiveSession(nextUser);
      return nextUser;
    });
    // Extract book, start chapter, end chapter from newRec.verseRef to register in Bible reading & management data
    try {
      const rangeMatch = newRec.verseRef.match(/^([^\d]+)\s*(\d+)(?:[~-](\d+))?/);
      if (rangeMatch) {
        const book = rangeMatch[1].trim();
        const startCh = parseInt(rangeMatch[2], 10);
        const endCh = rangeMatch[3] ? parseInt(rangeMatch[3], 10) : startCh;
        markChapterRangeCompleted(book, startCh, endCh, true);
        for (let c = startCh; c <= endCh; c++) {
          addTodayReadChapter(book, c);
        }
        updateMemberReadingProgress(user.email, book, endCh, Math.max(1, endCh - startCh + 1));
        window.dispatchEvent(new CustomEvent('superbible_verse_read_changed'));
        window.dispatchEvent(new CustomEvent('superbible_today_read_changed'));
        window.dispatchEvent(new CustomEvent('superbible_members_changed'));
      }
    } catch (e) {}
    // Sync recording to Admin Inspection List in real-time
    addMemberRecordingToAdmin(user, newRec);
  };

  // Delete recording
  const handleDeleteRecording = (id: string) => {
    setRecordings((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem('superbible_user_recordings_v2', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setUser((u) => ({ ...u, recordingsCount: Math.max(0, u.recordingsCount - 1) }));
  };

  const handleOpenVerseCard = (verse: BibleVerse) => {
    setVerseForCard(verse);
    setActiveModal('verse-card');
  };

  const handleOpenRecorder = (verse: BibleVerse) => {
    setVerseForRecorder(verse);
    setActiveModal('quick-record');
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center relative select-none">
      {/* Real-time Auto-Update Notice (PC 데스크톱 및 모바일 자동 갱신 알림) */}
      {updatingVersion && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 text-white rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-amber-400/80 animate-in fade-in slide-in-from-top duration-300">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          <span>SuperBible {updatingVersion} 최신 버전으로 자동 갱신 중...</span>
        </div>
      )}

      {/* Main Viewport Container: Smartphone / Tablet / Computer Auto-Responsive */}
      <div
        id="appViewport"
        className="w-full h-[100dvh] min-h-screen bg-slate-900 flex flex-col relative overflow-hidden transition-all duration-300 md:max-w-5xl lg:max-w-7xl 2xl:max-w-full md:mx-auto md:shadow-2xl md:border-x md:border-slate-800"
      >
        {currentView === 'login' ? (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            openModal={handleOpenModal}
            onOpenSettings={handleOpenSettingsAsAdmin}
            onOpenInstall={() => setShowInstallModal(true)}
          />
        ) : (
          <ErrorBoundary>
            <BibleDashboard
              user={user}
              initialTab={dashboardInitialTab}
              onLogout={handleLogout}
              onToggleRole={handleToggleRole}
              openModal={handleOpenModal}
              onOpenVerseCard={handleOpenVerseCard}
              onOpenRecorder={handleOpenRecorder}
              readingPlans={readingPlans}
              onTogglePlan={handleTogglePlan}
              recordings={recordings}
              onDeleteRecording={handleDeleteRecording}
              onOpenInstall={() => setShowInstallModal(true)}
            />
          </ErrorBoundary>
        )}
      </div>

      {/* Modals */}
      <HelpModals modal={activeModal} onClose={handleCloseModal} />

      <VerseCardModal
        isOpen={activeModal === 'verse-card'}
        onClose={handleCloseModal}
        verse={verseForCard}
      />

      <AudioRecordingModal
        isOpen={activeModal === 'quick-record'}
        onClose={handleCloseModal}
        verse={verseForRecorder}
        onSaveRecording={handleSaveRecording}
      />

      {/* SuperBible App Installation & APK Modal (로그인 및 대시보드 전 화면 공용) */}
      <AppInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
