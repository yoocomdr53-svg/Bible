import React, { useState } from 'react';
import { Smartphone, Monitor, ShieldCheck } from 'lucide-react';
import { User, ActiveModal, BibleVerse, ReadingDayPlan, UserRecording } from './types';
import { TODAY_VERSE, INITIAL_READING_PLANS, INITIAL_RECORDINGS } from './data/bibleData';
import { LoginView } from './components/LoginView';
import { BibleDashboard } from './components/BibleDashboard';
import { GoogleChooserModal } from './components/GoogleChooserModal';
import { AuthSyncModal } from './components/AuthSyncModal';
import { HelpModals } from './components/HelpModals';
import { VerseCardModal } from './components/VerseCardModal';
import { AudioRecordingModal } from './components/AudioRecordingModal';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
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

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'dashboard'>('login');
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(true);

  // User session state
  const [user, setUser] = useState<User>({
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

  const [pendingAccount, setPendingAccount] = useState<Partial<User> | null>(null);
  const [readingPlans, setReadingPlans] = useState<ReadingDayPlan[]>(INITIAL_READING_PLANS);
  const [recordings, setRecordings] = useState<UserRecording[]>(INITIAL_RECORDINGS);
  const [verseForCard, setVerseForCard] = useState<BibleVerse>(TODAY_VERSE);
  const [verseForRecorder, setVerseForRecorder] = useState<BibleVerse>(TODAY_VERSE);

  // Handlers
  const handleOpenModal = (modal: ActiveModal) => {
    setActiveModal(modal);
  };

  const handleCloseModal = () => {
    setActiveModal('none');
  };

  // Google account picked in chooser modal -> show sync animation modal
  const handleSelectGoogleAccount = (acc: Partial<User>) => {
    setPendingAccount(acc);
    setActiveModal('auth-sync');
  };

  // Auth sync animation finished -> switch to Bible Dashboard
  const handleFinishSync = () => {
    if (pendingAccount) {
      setUser((prev) => ({ ...prev, ...pendingAccount }));
    }
    setActiveModal('none');
    setCurrentView('dashboard');
  };

  // Direct Google login without account chooser modal
  const handleDirectGoogleLogin = () => {
    setUser((prev) => ({
      ...prev,
      id: 'user-yooc',
      name: 'yooc',
      email: 'yooc.dev@gmail.com',
      avatarText: 'yooc',
      role: 'saint',
      provider: 'google',
      schoolName: '로고스 수퍼바이블 공동체',
      department: '청장년 성경통독부',
    }));
    setCurrentView('dashboard');
  };

  // Direct login from standard form (logos_admin@school.ac.kr)
  const handleStandardLogin = (userData: Partial<User>) => {
    setUser((prev) => ({ ...prev, ...userData }));
    setCurrentView('dashboard');
  };

  // Logout back to ERP Login
  const handleLogout = () => {
    setCurrentView('login');
  };

  // Toggle reading plan completion
  const handleTogglePlan = (day: number) => {
    setReadingPlans((prev) =>
      prev.map((p) => {
        if (p.day === day) {
          const updated = !p.completed;
          // Update user stat
          setUser((u) => ({
            ...u,
            todayVersesRead: updated ? u.todayVersesRead + 1 : Math.max(0, u.todayVersesRead - 1),
          }));
          return { ...p, completed: updated };
        }
        return p;
      })
    );
  };

  // Save new audio recording
  const handleSaveRecording = (newRec: UserRecording) => {
    setRecordings((prev) => [newRec, ...prev]);
    setUser((u) => ({ ...u, recordingsCount: u.recordingsCount + 1 }));
  };

  // Delete recording
  const handleDeleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
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
      {/* Top Floating Controls Bar */}
      <div className="fixed top-2.5 right-3 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/70 shadow-lg text-xs text-slate-300">
        {/* Role Switcher (일반회원 <-> 관리자 테스트) */}
        <button
          onClick={() => {
            setUser((u) => {
              const isAdmin = u.role === 'admin';
              return {
                ...u,
                role: isAdmin ? 'saint' : 'admin',
                name: isAdmin ? 'yooc (성도)' : '로고스 관리자',
                avatarText: isAdmin ? 'yooc' : '관리',
              };
            });
          }}
          className={`px-2.5 py-1 rounded-full text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs ${
            user.role === 'admin'
              ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="권한 전환 (일반회원 / 관리자 모드 즉시 테스트)"
        >
          <span>{user.role === 'admin' ? '👑 관리자' : '👤 일반회원'}</span>
          <span className="text-[10px] opacity-75 font-normal">(전환)</span>
        </button>

        <button
          onClick={() => setCurrentView(currentView === 'login' ? 'dashboard' : 'login')}
          className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer flex items-center gap-1.5"
          title="화면 전환"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentView === 'login' ? '수퍼바이블 바로보기' : '로그인 포털로'}</span>
        </button>

        <button
          onClick={() => setDeviceFrameMode(!deviceFrameMode)}
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
          title={deviceFrameMode ? '전체 화면으로 확장' : '모바일 프레임 모드로 보기'}
        >
          {deviceFrameMode ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Viewport Container */}
      <div
        id="appViewport"
        className={
          deviceFrameMode
            ? 'w-full max-w-[430px] h-[100dvh] sm:min-h-[880px] sm:max-h-[920px] sm:rounded-[44px] sm:shadow-2xl sm:border-[9px] sm:border-slate-800/90 relative overflow-hidden bg-slate-900 transition-all duration-300 flex flex-col'
            : 'w-full h-screen max-w-2xl relative overflow-hidden bg-slate-900 transition-all duration-300 flex flex-col'
        }
      >
        {currentView === 'login' ? (
          <LoginView
            onLoginSuccess={handleStandardLogin}
            onGoogleLogin={handleDirectGoogleLogin}
            openModal={handleOpenModal}
            onOpenSettings={() => setCurrentView('dashboard')}
          />
        ) : (
          <ErrorBoundary>
            <BibleDashboard
              user={user}
              onLogout={handleLogout}
              onToggleRole={() => {
                setUser((u) => {
                  const isAdmin = u.role === 'admin';
                  return {
                    ...u,
                    role: isAdmin ? 'saint' : 'admin',
                    name: isAdmin ? 'yooc (성도)' : '로고스 관리자',
                    avatarText: isAdmin ? 'yooc' : '관리',
                  };
                });
              }}
              openModal={handleOpenModal}
              onOpenVerseCard={handleOpenVerseCard}
              onOpenRecorder={handleOpenRecorder}
              readingPlans={readingPlans}
              onTogglePlan={handleTogglePlan}
              recordings={recordings}
              onDeleteRecording={handleDeleteRecording}
            />
          </ErrorBoundary>
        )}
      </div>

      {/* Modals */}
      <GoogleChooserModal
        isOpen={activeModal === 'google-chooser'}
        onClose={handleCloseModal}
        onSelectAccount={handleSelectGoogleAccount}
      />

      <AuthSyncModal
        isOpen={activeModal === 'auth-sync'}
        selectedAccount={pendingAccount}
        onFinishSync={handleFinishSync}
      />

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
    </div>
  );
}
