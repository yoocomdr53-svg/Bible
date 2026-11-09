export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarText: string;
  role: 'faculty' | 'student' | 'admin' | 'saint';
  schoolName: string;
  department: string;
  provider: 'google' | 'standard' | 'sheets';
  consecutiveDays: number;
  ntProgress: number; // 0 - 100
  todayVersesRead: number;
  recordingsCount: number;
}

export type ActiveTab = 'home' | 'bible' | 'stats' | 'challenge' | 'settings' | 'admin';

export type ActiveModal =
  | 'none'
  | 'google-chooser'
  | 'auth-sync'
  | 'find-id'
  | 'reset-password'
  | 'register-sheet'
  | 'verse-card'
  | 'sponsor'
  | 'quick-record';

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

export interface BibleBook {
  id: string;
  name: string;
  testament: 'OT' | 'NT';
  chaptersCount: number;
}

export interface ReadingDayPlan {
  day: number;
  date: string;
  portion: string;
  verseRange: string;
  completed: boolean;
  memo?: string;
}

export interface UserRecording {
  id: string;
  title: string;
  verseRef: string;
  duration: string;
  date: string;
  audioBlobUrl?: string;
}
