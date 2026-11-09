import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  Search,
  Volume2,
  VolumeX,
  ArrowDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  X,
  Sun,
  Moon,
  Mic,
  Share2,
  Check,
} from 'lucide-react';
import {
  BIBLE_BOOKS,
  SAMPLE_VERSES_CHAPTER,
  getChapterVerseCount,
  getCompletedVerses,
  toggleVerseCompleted,
  toggleChapterVersesCompleted,
  markChapterVersesCompleted,
  markChapterRangeCompleted,
} from '../data/bibleData';
import { BibleVerse } from '../types';
import { BibleSelectorModal } from './BibleSelectorModal';
import {
  updateMemberReadingProgress,
  getActiveSession,
  addMemberRecordingToAdmin,
} from '../services/authService';

interface BibleReaderViewProps {
  onOpenVerseCard: (verse: BibleVerse) => void;
  onOpenRecorder: (verse: BibleVerse) => void;
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
  initialRecordingMode?: boolean;
  onBack?: () => void;
  onBackToHome?: () => void;
  onGoToChallenge?: () => void;
  onBackToSelector?: () => void;
}

// Fallback inspiring Scripture pool without redundant book/chapter/verse announcement prefix
const FALLBACK_SCRIPTURES = [
  '주의 말씀은 내 발에 등이요 내 길에 빛이니이다.',
  '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다.',
  '내가 산을 향하여 눈을 들리라 나의 도움이 어디서 올까 나의 도움은 천지를 지으신 여호와에게서로다.',
  '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라.',
  '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라.',
  '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라 너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라.',
  '오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요 달음박질하여도 곤비하지 아니하겠고 걸어가도 피곤하지 아니하리로다.',
  '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라.',
  '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라 그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라.',
  '여호와는 나의 빛이요 나의 구원이시니 내가 누구를 두려워하리요 여호와는 내 생명의 능력이시니 내가 누구를 무서워하리요.',
  '너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라.',
  '평안을 너희에게 끼치노니 곧 나의 평안을 너희에게 주노라 내가 너희에게 주는 것은 세상이 주는 것과 같지 아니하니라 너희는 마음에 근심하지도 말고 두려워하지도 말라.',
  '여호와를 경외하는 것이 지혜의 근본이요 거룩하신 자를 아는 것이 명철이니라.',
  '믿음은 바라는 것들의 실상이요 보이지 않는 것들의 증거니 선진들이 이로써 증거를 얻었느니라.',
  '사랑은 오래 참고 사랑은 온유하며 시기하지 아니하며 사랑은 자랑하지 아니하며 교만하지 아니하며 무례히 행하지 아니하며 자기의 유익을 구하지 아니하며.',
  '두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 참으로 너를 도와 주리라 참으로 나의 의로운 오른손으로 너를 붙들리라.',
  '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라.',
  '오직 성령의 열매는 사랑과 희락과 화평과 오래 참음과 자비와 양선과 충성과 온유와 절제니 이같은 것을 금지할 법이 없느니라.',
  '구하라 그리하면 너희에게 주실 것이요 찾으라 그리하면 찾아낼 것이요 문을 두드리라 그리하면 너희에게 열릴 것이니.',
  '풀은 마르고 꽃은 시드나 우리 하나님의 말씀은 영원히 서리라 하라.',
];

export interface VoiceProfile {
  voice: SpeechSynthesisVoice | null;
  pitch: number;
  rate: number;
  pauseMs: number;
  engineName: string;
  summary: string;
  isNatural?: boolean;
}

// 긴 구절 분할 (구글 음성 스트림 안정성 보장)
const splitLongText = (text: string, maxLen = 140): string[] => {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  const sentences = text.split(/([.,!?;\n]+)/);
  let current = '';
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if ((current + s).length > maxLen) {
      if (current.trim()) parts.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts.length > 0 ? parts : [text.slice(0, maxLen), text.slice(maxLen)];
};

// 기계음 없는 100% 자연 여성 육성 오디오 스트림 재생기 (Google Neural)
const playNeuralFemaleAudio = (
  text: string,
  rate: number,
  onEnd: () => void,
  onError: () => void
): { pause: () => void } => {
  const chunks = splitLongText(text, 140);
  let chunkIdx = 0;
  let currentAudio: HTMLAudioElement | null = null;
  let isCancelled = false;

  const playNextChunk = () => {
    if (isCancelled) return;
    if (chunkIdx >= chunks.length) {
      onEnd();
      return;
    }
    const chunk = chunks[chunkIdx];
    chunkIdx++;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    currentAudio = new Audio(url);
    currentAudio.playbackRate = Math.min(2.0, Math.max(0.7, rate));
    currentAudio.onended = () => {
      if (!isCancelled) playNextChunk();
    };
    currentAudio.onerror = (e) => {
      console.warn('Neural audio stream error', e);
      if (!isCancelled) onError();
    };
    currentAudio.play().catch((err) => {
      console.warn('Audio play error', err);
      if (!isCancelled) onError();
    });
  };

  playNextChunk();
  return {
    pause: () => {
      isCancelled = true;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
    },
  };
};

export const getVoiceProfile = (
  type: string,
  voices: SpeechSynthesisVoice[],
  baseRate: number = 1.1,
  userPitch: number = 0.96
): VoiceProfile => {
  const koVoices = (voices || []).filter(
    (v) => v.lang.toLowerCase().includes('ko') || v.lang.toLowerCase().includes('kr')
  );

  // 구형 기계음 SAPI 보이스(Microsoft Heami Desktop 등) 확인
  const isRoboticSapi = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    return n.includes('heami') || n.includes('혜미') || n.includes('desktop');
  };

  const isNatural = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    const uri = (v.voiceURI || '').toLowerCase();
    return (
      n.includes('natural') ||
      n.includes('online') ||
      n.includes('neural') ||
      n.includes('google') ||
      n.includes('apple') ||
      uri.includes('natural') ||
      uri.includes('neural')
    );
  };

  const isMale = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    const uri = (v.voiceURI || '').toLowerCase();
    return (
      n.includes('injoon') ||
      n.includes('in-joon') ||
      n.includes('in joon') ||
      n.includes('인준') ||
      n.includes('bongjin') ||
      n.includes('bong-jin') ||
      n.includes('봉진') ||
      n.includes('sinji') ||
      n.includes('신지') ||
      n.includes('male') ||
      n.includes('man') ||
      n.includes('남성') ||
      n.includes('boy') ||
      uri.includes('injoon')
    );
  };

  const isFemale = (v: SpeechSynthesisVoice) => {
    if (isMale(v)) return false;
    const n = v.name.toLowerCase();
    return (
      n.includes('sunhi') ||
      n.includes('sun-hi') ||
      n.includes('sun hi') ||
      n.includes('선희') ||
      n.includes('yuna') ||
      n.includes('yu-na') ||
      n.includes('유나') ||
      n.includes('sora') ||
      n.includes('소라') ||
      n.includes('seoyeon') ||
      n.includes('서연') ||
      n.includes('ji-min') ||
      n.includes('jimin') ||
      n.includes('지민') ||
      n.includes('so-hee') ||
      n.includes('sohee') ||
      n.includes('소희') ||
      n.includes('hyon-sim') ||
      n.includes('hyonsim') ||
      n.includes('현심') ||
      n.includes('female') ||
      n.includes('woman') ||
      n.includes('girl') ||
      n.includes('google') ||
      !isMale(v)
    );
  };

  // 1. 여성 선택 시 (절대 남성 음성 혼입 금지 / 기계음 차단)
  if (type.includes('여성')) {
    // 1순위: 브라우저 고음질 뉴럴 여성 보이스 (Edge SunHi Online Natural / Google 한국어 / Apple Yuna 등)
    const naturalFemale = koVoices.find(
      (v) => isFemale(v) && !isMale(v) && isNatural(v) && !isRoboticSapi(v)
    );

    if (naturalFemale) {
      return {
        voice: naturalFemale,
        pitch: 1.0, // 왜곡 없는 자연스러운 100% 여성 원음
        rate: baseRate,
        pauseMs: 60,
        engineName: naturalFemale.name,
        summary: '기계음 왜곡 없는 100% 맑고 자연스러운 여성 육성 낭독입니다.',
        isNatural: true,
      };
    }

    // 2순위: 브라우저에 구형 기계음(Heami)만 있거나 뉴럴 보이스가 없는 환경
    // AI 스튜디오 자연 여성 음원(Google Neural Female Audio)으로 낭독하여 기계음을 100% 차단!
    const anyFemale = koVoices.find((v) => isFemale(v) && !isMale(v)) || null;
    return {
      voice: anyFemale,
      pitch: 1.0,
      rate: baseRate,
      pauseMs: 60,
      engineName: 'AI 스튜디오 자연 여성 음원 (Google Neural)',
      summary: '기계음 없는 100% 자연스럽고 은혜로운 여성 육성 낭독입니다.',
      isNatural: false,
    };
  }

  // 2. 남성 (자연스러운 중저음):
  const naturalMale = koVoices.find((v) => isMale(v) && isNatural(v));
  const anyNonRoboticMale = naturalMale || koVoices.find((v) => isMale(v) && !isRoboticSapi(v));
  const voice = naturalMale || anyNonRoboticMale || koVoices.find((v) => isMale(v)) || koVoices[0] || null;

  return {
    voice,
    pitch: userPitch || 0.96, // 깊고 편안한 자연스러운 중저음 바리톤
    rate: baseRate,
    pauseMs: 60,
    engineName: voice ? voice.name : '한국어 고음질 자연어 엔진',
    summary: '기계음 없이 깊고 따뜻한 울림의 편안한 자연스러운 중저음(바리톤)입니다.',
    isNatural: voice ? isNatural(voice) : true,
  };
};

export const BibleReaderView: React.FC<BibleReaderViewProps> = ({
  onOpenVerseCard,
  onOpenRecorder,
  initialBook = '창세기',
  initialChapter = 1,
  initialVerse = 1,
  initialRecordingMode = false,
  onBack,
  onBackToHome,
  onGoToChallenge,
  onBackToSelector,
}) => {
  const [selectedBook, setSelectedBook] = useState(initialBook);
  const [selectedChapter, setSelectedChapter] = useState(initialChapter);
  const [selectedVerse, setSelectedVerse] = useState(initialVerse);
  const [selectedTranslation, setSelectedTranslation] = useState<'개역개정' | '개역한글' | '쉬운성경' | 'NIV'>('개역개정');

  // Screen display settings (matching user uploaded screenshot)
  const [fontFamily, setFontFamily] = useState<'기본' | '나눔고딕' | '나눔명조'>('기본');
  const [isBold, setIsBold] = useState(false);
  const [fontSizePt, setFontSizePt] = useState(17);
  const [scrollSpeed, setScrollSpeed] = useState(13);
  const [isInverted, setIsInverted] = useState(false);

  // Audio state - 자연스러운 중저음 기본 활성화
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(186); // 03:06
  const [voiceType, setVoiceType] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('superbible_voice_type');
      if (saved && saved.includes('여성')) {
        return '여성 (맑고 자연스러운 음성)';
      }
    } catch (e) {}
    return '남성 (자연스러운 중저음)';
  });

  // Natural Korean TTS Speech Synthesis
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechRate, setSpeechRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('superbible_speech_rate');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.7 && parsed <= 2.0) return parsed;
      }
    } catch (e) {}
    return 1.1; // 시원하고 경쾌한 1.1x 빠른 낭독 속도 (기본값)
  });
  const [speechPitch, setSpeechPitch] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('superbible_speech_pitch');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0.7 && parsed <= 1.5) return parsed;
      }
    } catch (e) {}
    return 0.96; // 부드럽고 자연스러운 중저음 톤 (0.96)
  });
  const [currentSpeakingVerse, setCurrentSpeakingVerse] = useState<number | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);

  const isPlayingRef = useRef(false);
  const currentVerseIndexRef = useRef(0);
  const speechRateRef = useRef(speechRate);
  const speechPitchRef = useRef(speechPitch);
  const voiceTypeRef = useRef(voiceType);
  const currentAudioRef = useRef<{ pause: () => void } | null>(null);

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  useEffect(() => {
    speechPitchRef.current = speechPitch;
  }, [speechPitch]);

  useEffect(() => {
    voiceTypeRef.current = voiceType;
  }, [voiceType]);

  // Load and cache browser/system speech synthesis voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        setAvailableVoices(list);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When changing chapter or book, clean up any active playback
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedBook, selectedChapter]);

  // Smooth scroll current speaking verse into center view
  useEffect(() => {
    if (currentSpeakingVerse !== null && isPlaying) {
      const el = document.getElementById(`verse-row-${currentSpeakingVerse}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentSpeakingVerse, isPlaying]);

  // Bible Reading Recording Mode (성경낭독녹음 모드 - matching user uploaded screenshot)
  const [isRecordingMode, setIsRecordingMode] = useState(initialRecordingMode);
  const [activeRecordVerse, setActiveRecordVerse] = useState<number>(initialVerse || 1);
  const [isRecordingNow, setIsRecordingNow] = useState(false);
  const [recordDurationSec, setRecordDurationSec] = useState(0);
  const [isContinuousRecording, setIsContinuousRecording] = useState(true);
  const [recordedVerses, setRecordedVerses] = useState<number[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  // UI Modals
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [selectorInitialStep, setSelectorInitialStep] = useState<'book' | 'chapter' | 'verse'>('book');
  const [showTransModal, setShowTransModal] = useState(false);
  const [showScreenSettings, setShowScreenSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedVerses, setHighlightedVerses] = useState<number[]>([]);

  // 성경 읽기 완료된 절 관리 상태
  const [completedVerses, setCompletedVerses] = useState<Set<string>>(() => getCompletedVerses());

  useEffect(() => {
    const handleVerseChanged = () => {
      setCompletedVerses(getCompletedVerses());
    };
    window.addEventListener('superbible_verse_read_changed', handleVerseChanged);
    return () => {
      window.removeEventListener('superbible_verse_read_changed', handleVerseChanged);
    };
  }, []);

  const contentRef = useRef<HTMLDivElement>(null);

  // Sync with prop changes
  useEffect(() => {
    setSelectedBook(initialBook);
    setSelectedChapter(initialChapter);
    setSelectedVerse(initialVerse);
    setActiveRecordVerse(initialVerse || 1);
  }, [initialBook, initialChapter, initialVerse]);

  // Generate or fetch verses (defined BEFORE any derived counts to prevent temporal dead zone ReferenceError!)
  const key = `${selectedBook}-${selectedChapter}`;
  const verses = React.useMemo(() => {
    if (SAMPLE_VERSES_CHAPTER[key]) {
      return SAMPLE_VERSES_CHAPTER[key];
    }
    const count = getChapterVerseCount(selectedBook, selectedChapter);
    const generated = [];
    for (let i = 1; i <= count; i++) {
      generated.push({
        verse: i,
        text: FALLBACK_SCRIPTURES[(i - 1) % FALLBACK_SCRIPTURES.length],
      });
    }
    return generated;
  }, [key, selectedBook, selectedChapter]);

  const handleToggleVerseRead = (v: number) => {
    toggleVerseCompleted(selectedBook, selectedChapter, v);
    setCompletedVerses(getCompletedVerses());
  };

  const handleToggleCompleteAllChapterVerses = () => {
    toggleChapterVersesCompleted(selectedBook, selectedChapter, verses.length);
    setCompletedVerses(getCompletedVerses());
    const session = getActiveSession();
    if (session && session.email) {
      updateMemberReadingProgress(session.email, selectedBook, selectedChapter);
    }
  };

  const chapterReadVersesCount = verses.filter((v) =>
    completedVerses.has(`${selectedBook}-${selectedChapter}-${v.verse}`)
  ).length;

  // Range Chapter Completion State (1-5장 등 읽은 장수 한번에 완독)
  const currentBookObj = BIBLE_BOOKS.find((b) => b.name === selectedBook);
  const maxChapters = currentBookObj?.chaptersCount || 50;
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(initialChapter || 1);
  const [rangeToast, setRangeToast] = useState<string | null>(null);

  useEffect(() => {
    setRangeStart(1);
    setRangeEnd(selectedChapter);
  }, [selectedBook, selectedChapter]);

  const handleRangeComplete = (isCompleted: boolean = true) => {
    const start = Math.max(1, Math.min(rangeStart, rangeEnd));
    const end = Math.min(maxChapters, Math.max(rangeStart, rangeEnd));
    const res = markChapterRangeCompleted(selectedBook, start, end, isCompleted);
    setCompletedVerses(getCompletedVerses());

    const session = getActiveSession();
    if (session && session.email) {
      updateMemberReadingProgress(session.email, selectedBook, end, res.completedCount);
    }

    if (isCompleted) {
      setRangeToast(`📖 ${selectedBook} ${start}장 ~ ${end}장 (총 ${res.completedCount}개 장) 완독 완료! 내 전체 읽기표에 한번에 표시되었습니다.`);
    } else {
      setRangeToast(`↩️ ${selectedBook} ${start}장 ~ ${end}장 완독 표시가 해제되었습니다.`);
    }

    setTimeout(() => {
      setRangeToast(null);
    }, 4500);
  };

  const renderRangeCompletionCard = (position: 'top' | 'bottom') => {
    const isCurrentChapterDone = chapterReadVersesCount === verses.length && verses.length > 0;
    const startCh = Math.min(rangeStart, rangeEnd);
    const endCh = Math.max(rangeStart, rangeEnd);
    const count = Math.abs(rangeEnd - rangeStart) + 1;

    return (
      <div
        key={`range-card-${position}`}
        className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs transition-all ${
          position === 'bottom' ? 'mt-4 mb-2' : 'my-2'
        } ${
          isInverted
            ? 'bg-slate-900/95 border-emerald-900/70 text-slate-100'
            : 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950'
        }`}
      >
        {/* Row 1: 현재 장 완독 상태 및 단일 완독 버튼 */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-emerald-200/60 dark:border-emerald-900/50">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shadow-xs ${
                isCurrentChapterDone
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              ✓
            </span>
            <span className={`${isInverted ? 'text-emerald-100' : 'text-emerald-950'} text-xs sm:text-sm font-black`}>
              {selectedBook} {selectedChapter}장 읽기 완료:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                {chapterReadVersesCount}
              </strong>{' '}
              / {verses.length}절
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleCompleteAllChapterVerses}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1 flex-shrink-0 ${
              isCurrentChapterDone
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
                : isInverted
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700'
                : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
            }`}
            title="현재 장만 체크/해제"
          >
            <span>{isCurrentChapterDone ? '✓ 현재 장 완독됨' : '현재 장만 완독'}</span>
          </button>
        </div>

        {/* Row 2: 읽은 장수 구간 일괄 완독 (1~5장 등) - 사용자 핵심 요청 */}
        <div className="pt-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📚</span>
              <span className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-100">
                장수 완독{' '}
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  (1~5장 등 읽은 장수 한번에 완독)
                </span>
              </span>
            </div>

            {onGoToChallenge && (
              <button
                type="button"
                onClick={onGoToChallenge}
                className="text-[11px] font-black text-[#1b64b9] hover:underline flex items-center gap-0.5 cursor-pointer"
                title="내 전체 읽기표로 이동하여 확인"
              >
                <span>내 전체 읽기표 확인</span>
                <span>&gt;</span>
              </button>
            )}
          </div>

          {/* 장수 구간 선택 및 빠른 프리셋 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500">시작</span>
              <input
                type="number"
                min={1}
                max={maxChapters}
                value={rangeStart}
                onChange={(e) =>
                  setRangeStart(Math.max(1, Math.min(maxChapters, parseInt(e.target.value) || 1)))
                }
                className="w-11 text-center text-xs font-black bg-transparent border-b border-emerald-400 focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">장</span>
            </div>

            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">~</span>

            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-slate-700 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500">종료</span>
              <input
                type="number"
                min={1}
                max={maxChapters}
                value={rangeEnd}
                onChange={(e) =>
                  setRangeEnd(Math.max(1, Math.min(maxChapters, parseInt(e.target.value) || 1)))
                }
                className="w-11 text-center text-xs font-black bg-transparent border-b border-emerald-400 focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">장</span>
            </div>

            {/* 빠른 선택 버튼들 */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setRangeStart(1);
                  setRangeEnd(selectedChapter);
                }}
                className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 text-[11px] font-black transition cursor-pointer"
                title={`1장부터 현재 ${selectedChapter}장까지`}
              >
                1~{selectedChapter}장
              </button>
              <button
                type="button"
                onClick={() => {
                  setRangeStart(1);
                  setRangeEnd(Math.min(5, maxChapters));
                }}
                className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 text-[11px] font-black transition cursor-pointer"
                title="1장부터 5장까지"
              >
                1~5장
              </button>
              <button
                type="button"
                onClick={() => {
                  setRangeStart(1);
                  setRangeEnd(Math.min(10, maxChapters));
                }}
                className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 text-[11px] font-black transition cursor-pointer"
                title="1장부터 10장까지"
              >
                1~10장
              </button>
            </div>
          </div>

          {/* 일괄 완독 실행 버튼 */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleRangeComplete(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-[#05c46b] hover:bg-[#04b05f] text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>✓</span>
              <span>
                {selectedBook} {startCh}~{endCh}장 장완독 누르기 ({count}개 장 일괄 완독)
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleRangeComplete(false)}
              className="py-2 px-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer active:scale-95"
              title="선택한 구간의 완독 표시 해제"
            >
              해제
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Auto-scroll to selected verse and highlight
  useEffect(() => {
    if (selectedVerse && !isRecordingMode) {
      setHighlightedVerses([selectedVerse]);
      const timer = setTimeout(() => {
        const el = document.getElementById(`verse-row-${selectedVerse}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedBook, selectedChapter, selectedVerse, isRecordingMode]);

  // Scroll to active recording verse in recording mode
  useEffect(() => {
    if (isRecordingMode && activeRecordVerse) {
      const el = document.getElementById(`record-verse-row-${activeRecordVerse}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [isRecordingMode, activeRecordVerse]);

  // Audio speech synthesis simulation
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Recording timer simulation
  useEffect(() => {
    let interval: any;
    if (isRecordingNow) {
      interval = setInterval(() => {
        setRecordDurationSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecordingNow]);

  const stopPlayback = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentSpeakingVerse(null);
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSelectSpeechRate = (rate: number) => {
    setSpeechRate(rate);
    speechRateRef.current = rate;
    try {
      localStorage.setItem('superbible_speech_rate', String(rate));
    } catch (e) {}

    if (isPreviewPlaying) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPreviewPlaying(false);
    }

    // 재생 중이면 설정 변경 즉시 현재 절부터 새로운 속도로 실시간 전환
    if (isPlayingRef.current) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      playVerseAtIndex(currentVerseIndexRef.current);
    }
  };

  const handleSelectVoiceType = (type: string) => {
    const normalized = type.includes('여성') ? '여성 (맑고 자연스러운 음성)' : '남성 (자연스러운 중저음)';
    setVoiceType(normalized);
    voiceTypeRef.current = normalized;
    try {
      localStorage.setItem('superbible_voice_type', normalized);
    } catch (e) {}

    if (isPreviewPlaying) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPreviewPlaying(false);
    }

    if (isPlayingRef.current) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      playVerseAtIndex(currentVerseIndexRef.current);
    }
  };

  const handleSelectSpeechPitch = (pitch: number) => {
    setSpeechPitch(pitch);
    speechPitchRef.current = pitch;
    try {
      localStorage.setItem('superbible_speech_pitch', String(pitch));
    } catch (e) {}

    if (isPreviewPlaying) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPreviewPlaying(false);
    }

    if (isPlayingRef.current) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      playVerseAtIndex(currentVerseIndexRef.current);
    }
  };

  const playVerseAtIndex = (index: number) => {
    if (!isPlayingRef.current) return;
    if (index >= verses.length) {
      stopPlayback();
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    currentVerseIndexRef.current = index;
    const v = verses[index];
    setCurrentSpeakingVerse(v.verse);

    // 몇절 몇절(절 번호)을 제외하고 오직 절 본문 말씀만 자연스럽게 낭독
    const textToRead = v.text;
    const currentVoiceType = voiceTypeRef.current || voiceType;
    const currentRate = speechRateRef.current || speechRate || 1.1;
    const currentPitch = speechPitchRef.current || speechPitch || 0.96;

    const profile = getVoiceProfile(currentVoiceType, availableVoices, currentRate, currentPitch);

    // 1. 여성 낭독 음원 (절대 남성 음성 나오지 않으며 기계음 100% 배제)
    if (currentVoiceType.includes('여성')) {
      // 1순위: 브라우저에 고음질 뉴럴 여성 보이스(Edge SunHi Online Natural / Chrome Google 한국어)가 있으면 Web Speech로 재생
      if (profile.voice && profile.isNatural) {
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'ko-KR';
        utterance.voice = profile.voice;
        utterance.pitch = 1.0; // 왜곡 없는 자연스러운 여성 원음
        utterance.rate = currentRate;

        utterance.onend = () => {
          if (isPlayingRef.current) {
            setTimeout(() => {
              if (isPlayingRef.current) playVerseAtIndex(index + 1);
            }, profile.pauseMs);
          }
        };

        utterance.onerror = (err) => {
          console.warn('Speech error at verse', v.verse, err);
          if (isPlayingRef.current) {
            setTimeout(() => {
              if (isPlayingRef.current) playVerseAtIndex(index + 1);
            }, profile.pauseMs);
          }
        };

        window.speechSynthesis.speak(utterance);
        return;
      }

      // 2순위: 브라우저에 구형 기계음(Heami)만 있는 환경일 경우, 기계음을 완전히 배제하고 AI 스튜디오 100% 자연 여성 육성 스트림으로 재생!
      currentAudioRef.current = playNeuralFemaleAudio(
        textToRead,
        currentRate,
        () => {
          if (isPlayingRef.current) {
            setTimeout(() => {
              if (isPlayingRef.current) playVerseAtIndex(index + 1);
            }, profile.pauseMs);
          }
        },
        () => {
          // 네트워크 실패 시 로컬 여성 보이스로 폴백
          if (isPlayingRef.current && profile.voice && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = 'ko-KR';
            utterance.voice = profile.voice;
            utterance.pitch = 1.0;
            utterance.rate = currentRate;
            utterance.onend = () => {
              if (isPlayingRef.current) {
                setTimeout(() => {
                  if (isPlayingRef.current) playVerseAtIndex(index + 1);
                }, profile.pauseMs);
              }
            };
            utterance.onerror = () => {
              if (isPlayingRef.current) {
                setTimeout(() => {
                  if (isPlayingRef.current) playVerseAtIndex(index + 1);
                }, profile.pauseMs);
              }
            };
            window.speechSynthesis.speak(utterance);
          } else if (isPlayingRef.current) {
            setTimeout(() => {
              if (isPlayingRef.current) playVerseAtIndex(index + 1);
            }, profile.pauseMs);
          }
        }
      );
      return;
    }

    // 2. 남성 (자연스러운 중저음 바리톤)
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'ko-KR';
    if (profile.voice) {
      utterance.voice = profile.voice;
    }
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;

    utterance.onend = () => {
      if (isPlayingRef.current) {
        setTimeout(() => {
          if (isPlayingRef.current) {
            playVerseAtIndex(index + 1);
          }
        }, profile.pauseMs);
      }
    };

    utterance.onerror = (err) => {
      console.warn('Speech error at verse', v.verse, err);
      if (isPlayingRef.current) {
        setTimeout(() => {
          if (isPlayingRef.current) {
            playVerseAtIndex(index + 1);
          }
        }, profile.pauseMs);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      isPlayingRef.current = true;
      setIsPlaying(true);
      // 현재 선택된 절이 있으면 해당 절부터 낭독, 없으면 1절부터 시작
      const startIndex =
        selectedVerse && selectedVerse > 1
          ? Math.max(0, verses.findIndex((v) => v.verse === selectedVerse))
          : 0;
      playVerseAtIndex(startIndex >= 0 ? startIndex : 0);
    }
  };

  const previewVoice = (type: string, rate: number, pitch: number) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPreviewPlaying(true);

    const sample = '태초에 하나님이 천지를 창조하시니라.';

    // 1. 여성 낭독 음원 미리듣기
    if (type.includes('여성')) {
      const profile = getVoiceProfile(type, availableVoices, rate, pitch);
      if (profile.voice && profile.isNatural) {
        const utterance = new SpeechSynthesisUtterance(sample);
        utterance.lang = 'ko-KR';
        utterance.voice = profile.voice;
        utterance.pitch = 1.0;
        utterance.rate = rate;
        utterance.onend = () => setIsPreviewPlaying(false);
        utterance.onerror = () => setIsPreviewPlaying(false);
        window.speechSynthesis.speak(utterance);
        return;
      }

      currentAudioRef.current = playNeuralFemaleAudio(
        sample,
        rate,
        () => setIsPreviewPlaying(false),
        () => {
          if ('speechSynthesis' in window && profile.voice) {
            const utterance = new SpeechSynthesisUtterance(sample);
            utterance.lang = 'ko-KR';
            utterance.voice = profile.voice;
            utterance.pitch = 1.0;
            utterance.rate = rate;
            utterance.onend = () => setIsPreviewPlaying(false);
            utterance.onerror = () => setIsPreviewPlaying(false);
            window.speechSynthesis.speak(utterance);
          } else {
            setIsPreviewPlaying(false);
          }
        }
      );
      return;
    }

    // 2. 남성 (자연스러운 중저음)
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(sample);
    utterance.lang = 'ko-KR';

    const profile = getVoiceProfile(type, availableVoices, rate, pitch);
    if (profile.voice) {
      utterance.voice = profile.voice;
    }
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;

    utterance.onend = () => {
      setIsPreviewPlaying(false);
    };
    utterance.onerror = () => {
      setIsPreviewPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatHMS = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter((prev) => prev - 1);
      setSelectedVerse(1);
      setActiveRecordVerse(1);
      setCurrentTime(0);
      stopPlayback();
    }
  };

  const handleNextChapter = () => {
    const currentBookObj = BIBLE_BOOKS.find((b) => b.name === selectedBook);
    const maxCh = currentBookObj ? currentBookObj.chaptersCount : 50;
    if (selectedChapter < maxCh) {
      setSelectedChapter((prev) => prev + 1);
      setSelectedVerse(1);
      setActiveRecordVerse(1);
      setCurrentTime(0);
      stopPlayback();
    }
  };

  const handleScrollDown = () => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: scrollSpeed * 22, behavior: 'smooth' });
    }
  };

  const handleOpenSelector = (step: 'book' | 'chapter' | 'verse' = 'book') => {
    setSelectorInitialStep(step);
    setShowSelectorModal(true);
  };

  const handleSelectLocation = (book: string, chapter: number, verse: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setSelectedVerse(verse);
    setActiveRecordVerse(verse);
    setCurrentTime(0);
    stopPlayback();
  };

  // Recording controls
  const handleToggleRecord = () => {
    if (isRecordingNow) {
      // Stop recording
      setIsRecordingNow(false);
      if (!recordedVerses.includes(activeRecordVerse)) {
        setRecordedVerses((prev) => [...prev, activeRecordVerse]);
      }
      // If continuous recording, advance to next verse
      if (isContinuousRecording && activeRecordVerse < verses.length) {
        setActiveRecordVerse((prev) => prev + 1);
      }
    } else {
      // Start recording
      setIsRecordingNow(true);
    }
  };

  const handleCompleteRecording = () => {
    setIsRecordingNow(false);
    const session = getActiveSession();
    if (session) {
      addMemberRecordingToAdmin(
        {
          id: session.id,
          name: session.name,
          email: session.email,
          role: session.role,
          avatarText: session.avatarText,
          provider: session.provider,
          schoolName: session.schoolName,
          department: session.department,
          consecutiveDays: session.consecutiveDays,
          ntProgress: session.ntProgress,
          todayVersesRead: session.todayVersesRead,
          recordingsCount: session.recordingsCount,
        },
        {
          id: `rec-${Date.now()}`,
          title: `${selectedBook} ${selectedChapter}장 낭독 녹음`,
          verseRef: `${selectedBook} ${selectedChapter}:${activeRecordVerse}절`,
          duration: `${recordedVerses.length * 15 || 45}초`,
          date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
        }
      );
    }
    alert(`${selectedBook} ${selectedChapter}장 낭독 녹음이 안전하게 저장되었습니다.`);
    setIsRecordingMode(false);
  };

  const filteredVerses = searchQuery.trim()
    ? verses.filter((v) => v.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : verses;

  // ==========================================
  // MODE 1: 성경 낭독 녹음 화면 (Matching User Uploaded Image)
  // ==========================================
  if (isRecordingMode) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden select-none text-slate-800">
        {/* 1. Header (Dark Sage / Olive Green #496557) */}
        <header className="bg-[#496557] text-white px-3 py-2 flex items-center justify-between shadow-md z-30 flex-shrink-0">
          {/* Left: Back button & Book & Chapter and Translation */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  setIsRecordingMode(false);
                }
              }}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="뒤로 가기"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <button
              type="button"
              onClick={() => handleOpenSelector('book')}
              className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded-lg transition cursor-pointer"
            >
              <span className="text-[15px] sm:text-base font-extrabold whitespace-nowrap">
                {selectedBook} {selectedChapter}장
              </span>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                ▽
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowTransModal(true)}
              className="flex items-center gap-1 hover:bg-white/10 px-2 py-0.5 rounded-lg transition cursor-pointer"
            >
              <span className="text-[13px] sm:text-sm font-bold whitespace-nowrap">
                {selectedTranslation}
              </span>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                ▽
              </span>
            </button>
          </div>

          {/* Right: A 글자 and ✕ Close button */}
          <div className="flex items-center gap-3 text-white">
            <button
              type="button"
              onClick={() => setShowScreenSettings(true)}
              className="flex flex-col items-center justify-center hover:bg-white/15 px-1.5 py-0.5 rounded-lg transition cursor-pointer"
              title="글자 크기 및 화면 설정"
            >
              <span className="text-base font-serif font-black leading-none">A</span>
              <span className="text-[9px] font-medium leading-none mt-0.5">글자</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRecordingNow(false);
                if (onBack) {
                  onBack();
                } else {
                  setIsRecordingMode(false);
                }
              }}
              className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
              title="녹음 모드 종료"
            >
              <X className="w-6 h-6 stroke-[2.2]" />
            </button>
          </div>
        </header>

        {/* 2. Top Notice Banner: "성경낭독녹음 기능을 이용하고 계십니다" */}
        <div className="bg-[#f8faf9] border-b border-slate-200/90 px-4 py-2 flex items-center gap-2.5 z-20 flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-[#8c6d58] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            성경낭독녹음 기능을 이용하고 계십니다
          </span>
        </div>

        {/* 3. Sub-toolbar: < > | 녹음현황·공유 ➦ | 연속 녹음 ON */}
        <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-xs flex-shrink-0 z-20">
          {/* Left Chevrons: navigate active recording verse */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveRecordVerse((prev) => Math.max(1, prev - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
              title="이전 절 선택"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveRecordVerse((prev) => Math.min(verses.length, prev + 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
              title="다음 절 선택"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Center: 녹음현황·공유 ➦ */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1 px-3 py-1 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition shadow-2xs cursor-pointer"
          >
            <span>녹음현황·공유</span>
            <span className="text-[13px]">➦</span>
          </button>

          {/* Right: 연속 녹음 ON/OFF */}
          <button
            type="button"
            onClick={() => setIsContinuousRecording(!isContinuousRecording)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-[11px] transition shadow-2xs cursor-pointer"
          >
            <span>연속 녹음</span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full text-white ${
                isContinuousRecording ? 'bg-[#dc2626]' : 'bg-slate-400'
              }`}
            >
              {isContinuousRecording ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* 4. Verse List Body with Selection Radio Circles */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 smooth-scroll bg-white"
          style={{
            fontFamily:
              fontFamily === '나눔고딕'
                ? "'Nanum Gothic', sans-serif"
                : fontFamily === '나눔명조'
                ? "'Nanum Myeongjo', serif"
                : "'Noto Sans KR', sans-serif",
          }}
        >
          <div className="max-w-2xl mx-auto space-y-3.5">
            {verses.map((v) => {
              const isSelected = activeRecordVerse === v.verse;
              const isRecorded = recordedVerses.includes(v.verse);

              return (
                <div
                  id={`record-verse-row-${v.verse}`}
                  key={v.verse}
                  onClick={() => setActiveRecordVerse(v.verse)}
                  className={`flex items-start gap-3 py-2 px-3 rounded-xl transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 border border-emerald-300 shadow-xs'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Selection Radio Circle */}
                  <div className="pt-1 flex-shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[#496557] bg-[#496557]'
                          : isRecorded
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-300 bg-slate-100'
                      }`}
                    >
                      {isSelected ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      ) : isRecorded ? (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      ) : null}
                    </div>
                  </div>

                  {/* Verse Number */}
                  <span className="text-[15px] sm:text-base font-black text-slate-900 select-none min-w-[16px] pt-0.5">
                    {v.verse}
                  </span>

                  {/* Verse Text */}
                  <p
                    className="flex-1 text-slate-800 tracking-tight"
                    style={{
                      fontSize: `${fontSizePt}px`,
                      lineHeight: `${fontSizePt * 1.8}px`,
                      fontWeight: isBold ? 700 : 400,
                    }}
                  >
                    {v.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Audio Recording Bottom Control Bar (Matching User Screenshot) */}
        <div className="bg-[#fcfdfc] border-t border-slate-200 px-4 pt-2.5 pb-3 z-20 flex-shrink-0 shadow-lg">
          {/* Progress Timeline with Timestamps 00:00:00 */}
          <div className="space-y-1">
            <div className="relative w-full flex items-center">
              <input
                type="range"
                min={0}
                max={Math.max(60, recordDurationSec + 30)}
                value={recordDurationSec}
                onChange={() => {}}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
              <span>{formatHMS(recordDurationSec)}</span>
              <span>{formatHMS(0)}</span>
            </div>
          </div>

          {/* Floating Tooltip: "녹음 버튼을 누르시면 N절이 녹음됩니다" */}
          <div className="flex justify-center my-2">
            <div
              className={`text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md transition-all ${
                isRecordingNow ? 'bg-red-600 animate-pulse' : 'bg-[#4a5568]'
              }`}
            >
              {isRecordingNow
                ? `🔴 ${activeRecordVerse}절 낭독 녹음 중입니다... (터치 시 정지)`
                : `녹음 버튼을 누르시면 ${activeRecordVerse}절이 녹음됩니다`}
            </div>
          </div>

          {/* 3 Main Action Buttons: 전체 재생 | 🎙 (Microphone) | 완료 */}
          <div className="flex items-center justify-around px-4 pt-1">
            {/* 1. 전체 재생 Button */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={togglePlay}
                className="w-12 h-12 rounded-full border-2 border-slate-600 bg-white hover:bg-slate-50 active:scale-95 flex items-center justify-center text-slate-800 shadow-sm transition cursor-pointer"
                title="전체 재생"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-slate-800" /> : <Play className="w-5 h-5 fill-slate-800 ml-0.5" />}
              </button>
              <span className="text-[11px] font-bold text-slate-800 mt-1">전체 재생</span>
            </div>

            {/* 2. Main Red Microphone Circle Button */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleToggleRecord}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all cursor-pointer active:scale-90 ${
                  isRecordingNow
                    ? 'bg-red-600 ring-4 ring-red-300 animate-pulse scale-105'
                    : 'bg-[#ef4444] hover:bg-red-600 ring-4 ring-red-100'
                }`}
                title={isRecordingNow ? '녹음 정지' : '녹음 시작'}
              >
                <Mic className="w-8 h-8 stroke-[2.2]" />
              </button>
            </div>

            {/* 3. 완료 Button */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleCompleteRecording}
                className="w-12 h-12 rounded-full bg-[#786455] hover:bg-[#685548] active:scale-95 text-white flex items-center justify-center shadow-sm transition cursor-pointer"
                title="완료 및 저장"
              >
                <Check className="w-6 h-6 stroke-[2.5]" />
              </button>
              <span className="text-[11px] font-bold text-slate-800 mt-1">완료</span>
            </div>
          </div>
        </div>

        {/* Share & Recording Status Modal */}
        {showShareModal && (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowShareModal(false);
            }}
          >
            <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0284c7] flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">녹음 현황 및 공유</h3>
              <p className="text-xs text-slate-600 mb-3">
                {selectedBook} {selectedChapter}장 총 {verses.length}절 중{' '}
                <span className="font-bold text-[#0284c7]">{recordedVerses.length}개 구절</span>이 녹음되었습니다.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border text-xs text-slate-700 text-left mb-4 space-y-1">
                <p>• 녹음된 구절: {recordedVerses.length > 0 ? recordedVerses.join(', ') + '절' : '아직 녹음된 구절이 없습니다.'}</p>
                <p>• 저장 위치: 수퍼바이블 클라우드 성도 저장소</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    alert('낭독 오디오 공유 링크가 복사되었습니다!');
                    setShowShareModal(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#0284c7] text-white text-xs font-bold hover:bg-blue-600 transition"
                >
                  공유 링크 복사
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Screen Settings Modal can be opened via 'A 글자' in header */}
        {showScreenSettings && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowScreenSettings(false);
            }}
          >
            <div className="w-full max-w-lg mx-auto flex justify-end px-5 pb-2">
              <button
                type="button"
                onClick={() => setShowScreenSettings(false)}
                className="text-white hover:text-slate-200 p-1 cursor-pointer transition active:scale-90"
                title="닫기"
              >
                <X className="w-8 h-8 stroke-[2.2]" />
              </button>
            </div>
            <div className="w-full max-w-lg mx-auto bg-white rounded-t-[28px] p-6 sm:p-7 shadow-2xl space-y-6 text-slate-900 animate-in slide-in-from-bottom duration-200 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-slate-900">폰트변경</span>
                <div className="flex items-center text-[15px]">
                  <button
                    type="button"
                    onClick={() => setFontFamily('기본')}
                    className={`cursor-pointer transition-colors ${
                      fontFamily === '기본' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                    }`}
                  >
                    기본
                  </button>
                  <span className="text-slate-300 mx-2.5 font-light">|</span>
                  <button
                    type="button"
                    onClick={() => setFontFamily('나눔고딕')}
                    className={`cursor-pointer transition-colors ${
                      fontFamily === '나눔고딕' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                    }`}
                  >
                    나눔고딕
                  </button>
                  <span className="text-slate-300 mx-2.5 font-light">|</span>
                  <button
                    type="button"
                    onClick={() => setFontFamily('나눔명조')}
                    className={`cursor-pointer transition-colors ${
                      fontFamily === '나눔명조' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                    }`}
                  >
                    나눔명조
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-slate-900">폰트굵기</span>
                <button
                  type="button"
                  onClick={() => setIsBold(!isBold)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                    isBold ? 'bg-[#0284c7]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                      isBold ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-slate-900">글자크기</span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFontSizePt((prev) => Math.max(12, prev - 1))}
                    className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                  >
                    －
                  </button>
                  <div className="w-28 sm:w-36 flex items-center">
                    <input
                      type="range"
                      min={12}
                      max={26}
                      value={fontSizePt}
                      onChange={(e) => setFontSizePt(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFontSizePt((prev) => Math.min(26, prev + 1))}
                    className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                  >
                    ＋
                  </button>
                  <span className="text-[15px] font-bold text-slate-900 min-w-[38px] text-right">
                    {fontSizePt}pt
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // MODE 2: 일반 성경 본문 화면 (Normal Reader Mode)
  // ==========================================
  return (
    <div
      className={`flex-1 flex flex-col h-full relative overflow-hidden select-none transition-colors duration-200 ${
        isInverted ? 'bg-[#111827] text-slate-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* 장완독 일괄 완료 알림 토스트 */}
      {rangeToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/80 backdrop-blur-md flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-emerald-300">
            <span className="text-base">✨</span>
            <span>{rangeToast}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onGoToChallenge && (
              <button
                type="button"
                onClick={onGoToChallenge}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-xs active:scale-95 transition"
              >
                읽기표 확인
              </button>
            )}
            <button
              type="button"
              onClick={() => setRangeToast(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP HEADER (Deep Blue Bar #1b64b9) */}
      <header className="bg-[#1b64b9] text-white px-3 py-2 flex items-center justify-between shadow-md z-30 flex-shrink-0">
        {/* Left: Back button & Dropdowns */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Back Button -> Back to previous screen (Challenge, Selector, or Home) */}
          <button
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else if (onBackToSelector) {
                onBackToSelector();
              } else if (onBackToHome) {
                onBackToHome();
              } else {
                handlePrevChapter();
              }
            }}
            title="뒤로 가기"
            className="p-1 hover:bg-white/15 rounded-lg transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Book & Chapter Button */}
          <button
            type="button"
            onClick={() => {
              if (onBackToSelector) {
                onBackToSelector();
              } else {
                handleOpenSelector('book');
              }
            }}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 active:scale-95 px-2.5 py-1 rounded-full border border-white/20 transition cursor-pointer"
          >
            <span className="text-[13px] sm:text-sm font-bold whitespace-nowrap">
              {selectedBook} {selectedChapter}장
            </span>
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              ▼
            </span>
          </button>

          {/* Translation Button */}
          <button
            type="button"
            onClick={() => setShowTransModal(true)}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 active:scale-95 px-2.5 py-1 rounded-full border border-white/20 transition cursor-pointer"
          >
            <span className="text-[13px] sm:text-sm font-bold whitespace-nowrap">
              {selectedTranslation}
            </span>
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              ▼
            </span>
          </button>
        </div>

        {/* Right Action Icons: Only 화면설정 & 검색 (원문업로드 removed) */}
        <div className="flex items-center gap-1 sm:gap-2 text-white">
          {/* 화면설정 */}
          <button
            type="button"
            onClick={() => setShowScreenSettings(true)}
            className="flex flex-col items-center justify-center px-1.5 py-0.5 hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="화면 설정"
          >
            <Monitor className="w-4 h-4 text-white" />
            <span className="text-[9px] font-medium leading-tight mt-0.5 text-center">화면설정</span>
          </button>

          {/* 검색 */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="flex flex-col items-center justify-center px-1.5 py-0.5 hover:bg-white/15 rounded-lg transition cursor-pointer"
            title="본문 검색"
          >
            <Search className="w-4 h-4 text-white" />
            <span className="text-[9px] font-medium leading-tight mt-0.5 text-center">검색</span>
          </button>
        </div>
      </header>

      {/* 2. SUB-TOOLBAR (Controls & Badges) */}
      <div
        className={`border-b px-3 py-1.5 flex items-center justify-between text-xs flex-shrink-0 z-20 ${
          isInverted ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
        }`}
      >
        {/* Left Quick Navigation Icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevChapter}
            title="이전장"
            className={`w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer ${
              isInverted ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextChapter}
            title="다음장"
            className={`w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer ${
              isInverted ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? '음성 중지' : '음성 듣기'}
            className={`w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer transition ${
              isPlaying
                ? 'bg-blue-600 text-white border-blue-600'
                : isInverted
                ? 'border-slate-700 hover:bg-slate-800 text-slate-200'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleScrollDown}
            title="아래로 스크롤"
            className={`w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer ${
              isInverted ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Center & Right Badges */}
        <div className="flex items-center gap-1.5">
          {/* 선교 헌금 Badge */}
          <button
            type="button"
            onClick={() => setShowOfferingModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 hover:bg-red-100/80 border border-red-200/80 text-red-600 font-bold text-[11px] transition cursor-pointer"
          >
            <Heart className="w-3 h-3 fill-red-500 text-red-500" />
            <span>선교 헌금 &gt;</span>
          </button>

          {/* 낭독 음원 및 속도 설정 배지 */}
          <button
            type="button"
            onClick={() => setShowVoiceModal(true)}
            title="클릭 시 낭독 음원 및 속도 설정"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-bold text-[11px] transition cursor-pointer hover:opacity-90 active:scale-95 ${
              isInverted ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}
          >
            <span>{voiceType.includes('여성') ? '🌸' : '🎙️'}</span>
            <span>{voiceType.includes('여성') ? '여성(자연음성)' : '남성(중저음)'}</span>
            <span className="text-[10px] text-[#1b64b9] font-black">{speechRate}x</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      {showSearch && (
        <div
          className={`border-b px-4 py-2 flex items-center gap-2 animate-in slide-in-from-top duration-150 z-20 ${
            isInverted ? 'bg-slate-900 border-slate-800' : 'bg-blue-50/70 border-blue-200'
          }`}
        >
          <Search className="w-4 h-4 text-blue-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="본문 구절 검색 (예: 하나님, 궁창, 빛)"
            className={`flex-1 border rounded-lg px-2.5 py-1 text-xs focus:outline-none ${
              isInverted ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-blue-200 text-slate-900'
            }`}
            autoFocus
          />
          <button type="button" onClick={() => setShowSearch(false)} className="text-slate-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. BIBLE VERSES BODY */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 smooth-scroll"
        style={{
          fontFamily:
            fontFamily === '나눔고딕'
              ? "'Nanum Gothic', sans-serif"
              : fontFamily === '나눔명조'
              ? "'Nanum Myeongjo', serif"
              : "'Noto Sans KR', sans-serif",
        }}
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Section banner */}
          {selectedBook === '창세기' && selectedChapter === 1 && (
            <div className="pt-2 pb-1">
              <button
                type="button"
                className="bg-[#3b747c] hover:bg-[#32636a] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs transition cursor-pointer"
              >
                창세기 이해하기
              </button>
              <h3 className={`text-base sm:text-lg font-extrabold mt-3 mb-1 ${isInverted ? 'text-blue-400' : 'text-[#1b64b9]'}`}>
                천지 창조
              </h3>
            </div>
          )}
          {selectedBook === '창세기' && selectedChapter === 2 && (
            <div className="pt-2 pb-1">
              <button
                type="button"
                className="bg-[#3b747c] hover:bg-[#32636a] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-xs transition cursor-pointer"
              >
                창세기 이해하기
              </button>
              <h3 className={`text-base sm:text-lg font-extrabold mt-3 mb-1 ${isInverted ? 'text-blue-400' : 'text-[#1b64b9]'}`}>
                안식일과 에덴 동산
              </h3>
            </div>
          )}

          {/* 성경 읽기 완료 현황 및 장수 완독 (구간 일괄 완독) 카드 */}
          {renderRangeCompletionCard('top')}

          {filteredVerses.map((v) => {
            const isHighlighted = highlightedVerses.includes(v.verse);
            const isRead = completedVerses.has(`${selectedBook}-${selectedChapter}-${v.verse}`);
            const isSpeaking = currentSpeakingVerse === v.verse;
            return (
              <div
                id={`verse-row-${v.verse}`}
                key={v.verse}
                onClick={() => {
                  setHighlightedVerses((prev) =>
                    prev.includes(v.verse) ? prev.filter((n) => n !== v.verse) : [...prev, v.verse]
                  );
                }}
                className={`flex items-start gap-3 py-2 px-2.5 rounded-xl transition cursor-pointer ${
                  isSpeaking
                    ? isInverted
                      ? 'bg-blue-950/70 border-2 border-blue-400 shadow-md ring-2 ring-blue-500/30'
                      : 'bg-blue-50/90 border-2 border-[#1b64b9] shadow-sm ring-2 ring-blue-200'
                    : isHighlighted
                    ? isInverted
                      ? 'bg-amber-950/60 border border-amber-500/80 shadow-xs'
                      : 'bg-amber-100/80 border-2 border-amber-400 shadow-sm'
                    : isRead
                    ? isInverted
                      ? 'bg-emerald-950/30 border border-emerald-800/50'
                      : 'bg-emerald-50/40 border border-emerald-200/70'
                    : isInverted
                    ? 'hover:bg-slate-800/60'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Verse Number & Speaking Pulsing Indicator (절 앞 원 제거) */}
                <div className="flex items-center gap-1.5 min-w-[24px] pt-0.5 flex-shrink-0">
                  {isSpeaking && (
                    <span className="w-2 h-2 rounded-full bg-[#1b64b9] animate-ping flex-shrink-0" title="현재 낭독 중" />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVerseRead(v.verse);
                    }}
                    title={isRead ? '읽기 완료됨 (클릭 시 취소)' : '클릭 시 읽기 완료 체크'}
                    className={`text-base sm:text-lg font-black select-none cursor-pointer transition active:scale-90 ${
                      isSpeaking
                        ? 'text-[#1b64b9]'
                        : isRead
                        ? 'text-emerald-600'
                        : isInverted
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-slate-900 hover:text-emerald-600'
                    }`}
                  >
                    {v.verse}
                  </button>
                </div>

                {/* Verse Text with dynamic font size, weight, and family */}
                <p
                  className={`flex-1 tracking-tight ${isInverted ? 'text-slate-100' : 'text-slate-800'}`}
                  style={{
                    fontSize: `${fontSizePt}px`,
                    lineHeight: `${fontSizePt * 1.8}px`,
                    fontWeight: isBold ? 700 : 400,
                  }}
                >
                  {v.text}
                </p>
              </div>
            );
          })}

          {/* 맨 아래 절 부분 - 성경 읽기 완료 현황 및 장수 완독 (구간 일괄 완독) 카드 */}
          {renderRangeCompletionCard('bottom')}
        </div>
      </div>

      {/* 4. CHAPTER NAVIGATION ROW (Right above audio player) */}
      <div
        className={`border-t px-4 py-2 flex items-center justify-between z-20 flex-shrink-0 ${
          isInverted ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-800'
        }`}
      >
        {/* 이전장 */}
        <button
          type="button"
          onClick={handlePrevChapter}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          &lt; 이전장
        </button>

        {/* 창세기 1장 ∨ (Click opens 3-step selector) */}
        <button
          type="button"
          onClick={() => {
            if (onBackToSelector) {
              onBackToSelector();
            } else {
              handleOpenSelector('chapter');
            }
          }}
          className={`flex items-center gap-1 text-sm font-extrabold hover:underline cursor-pointer ${
            isInverted ? 'text-blue-400' : 'text-[#1b64b9]'
          }`}
        >
          <span>{selectedBook} {selectedChapter}장</span>
          <span className="text-xs">∨</span>
        </button>

        {/* 다음장 > */}
        <button
          type="button"
          onClick={handleNextChapter}
          className="bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition cursor-pointer"
        >
          <span>다음장</span>
          <span>&gt;</span>
        </button>
      </div>

      {/* 5. AUDIO PLAYER (Sticky Bottom Bar) */}
      <div
        className={`border-t px-4 py-2.5 z-20 flex-shrink-0 shadow-lg ${
          isInverted ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-[#f8fafc] border-slate-200 text-slate-800'
        }`}
      >
        {/* Timestamp & Reader Voice Badge & 이 장 전체 완독 버튼 */}
        <div className="flex items-center justify-between text-xs gap-2">
          <span className="font-mono text-xs text-slate-500 flex-shrink-0">{formatTime(currentTime)}</span>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {/* 낭독 음원 및 속도 활성화 버튼 (클릭 시 음원 설정) */}
            <button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              title="클릭 시 낭독 음원 및 속도 설정 열기"
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs flex items-center gap-1.5 transition cursor-pointer hover:opacity-90 active:scale-95 ${
                isInverted
                  ? 'bg-slate-800 text-blue-300 border-slate-700 hover:bg-slate-750'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70'
              }`}
            >
              <span>{voiceType.includes('여성') ? '🌸' : '🎙️'}</span>
              <span>낭독: {voiceType.includes('여성') ? '여성(자연음성)' : '남성(중저음)'}</span>
              <span className="px-1.5 py-0.2 bg-[#1b64b9] text-white rounded-full text-[10px] font-black">
                {speechRate}x
              </span>
            </button>

            {/* 낭독:남성(중저음) 옆 이 장 전체 완독 버튼 */}
            <button
              type="button"
              onClick={handleToggleCompleteAllChapterVerses}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-black transition cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1 ${
                chapterReadVersesCount === verses.length && verses.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500'
                  : isInverted
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-700'
                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
              }`}
              title={
                chapterReadVersesCount === verses.length && verses.length > 0
                  ? '클릭 시 이 장 전체 완독 해제'
                  : '클릭 시 이 장 전체 완독 체크'
              }
            >
              <span>✓</span>
              <span>
                {chapterReadVersesCount === verses.length && verses.length > 0
                  ? '전체 완독됨'
                  : '이 장 전체 완독'}
              </span>
            </button>
          </div>

          <span className="font-mono text-xs text-slate-500 flex-shrink-0">{formatTime(duration)}</span>
        </div>

        {/* Progress Timeline Slider */}
        <div className="relative w-full my-2 flex items-center">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => setCurrentTime(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#1b64b9]"
          />
        </div>

        {/* Bottom Audio Controls */}
        <div className="flex items-center justify-between pt-1">
          {/* Audio Playback Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentTime(Math.max(0, currentTime - 15))}
              className="p-1 text-slate-600 hover:text-black cursor-pointer"
              title="15초 전으로"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause Main Circle */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-[#1b64b9] hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md transition cursor-pointer"
              title={isPlaying ? '일시 정지' : '재생'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => setCurrentTime(Math.min(duration, currentTime + 15))}
              className="p-1 text-slate-600 hover:text-black cursor-pointer"
              title="15초 후로"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Buttons: 녹음 & 음원 설정 */}
          <div className="flex items-center gap-2">
            {/* 녹음 버튼 -> Activates the new full Recording Mode Screen from uploaded image! */}
            <button
              type="button"
              onClick={() => {
                setActiveRecordVerse(selectedVerse || 1);
                setIsRecordingMode(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-2xs cursor-pointer ${
                isInverted ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span>녹음</span>
            </button>

            {/* 음원 설정 버튼 */}
            <button
              type="button"
              onClick={() => setShowVoiceModal(true)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition shadow-2xs cursor-pointer ${
                isInverted ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
              }`}
            >
              음원 설정
            </button>
          </div>
        </div>
      </div>

      {/* 6. FULL 3-STEP BIBLE SELECTOR MODAL (Fallback) */}
      <BibleSelectorModal
        isOpen={showSelectorModal}
        initialBook={selectedBook}
        initialChapter={selectedChapter}
        initialVerse={selectedVerse}
        initialStep={selectorInitialStep}
        onClose={() => setShowSelectorModal(false)}
        onSelectLocation={handleSelectLocation}
      />

      {/* 7. 화면설정 Bottom Sheet (Exact Match to User Uploaded Screenshot) */}
      {showScreenSettings && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowScreenSettings(false);
          }}
        >
          {/* Close 'X' Button on top-right above sheet */}
          <div className="w-full max-w-lg mx-auto flex justify-end px-5 pb-2">
            <button
              type="button"
              onClick={() => setShowScreenSettings(false)}
              className="text-white hover:text-slate-200 p-1 cursor-pointer transition active:scale-90"
              title="닫기"
            >
              <X className="w-8 h-8 stroke-[2.2]" />
            </button>
          </div>

          {/* Bottom Sheet Card */}
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-[28px] p-6 sm:p-7 shadow-2xl space-y-6 text-slate-900 animate-in slide-in-from-bottom duration-200 border-t border-slate-100">
            {/* 1. 폰트변경 */}
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-slate-900">폰트변경</span>
              <div className="flex items-center text-[15px]">
                <button
                  type="button"
                  onClick={() => setFontFamily('기본')}
                  className={`cursor-pointer transition-colors ${
                    fontFamily === '기본' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                  }`}
                >
                  기본
                </button>
                <span className="text-slate-300 mx-2.5 font-light">|</span>
                <button
                  type="button"
                  onClick={() => setFontFamily('나눔고딕')}
                  className={`cursor-pointer transition-colors ${
                    fontFamily === '나눔고딕' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                  }`}
                >
                  나눔고딕
                </button>
                <span className="text-slate-300 mx-2.5 font-light">|</span>
                <button
                  type="button"
                  onClick={() => setFontFamily('나눔명조')}
                  className={`cursor-pointer transition-colors ${
                    fontFamily === '나눔명조' ? 'text-[#0284c7] font-bold' : 'text-slate-800'
                  }`}
                >
                  나눔명조
                </button>
              </div>
            </div>

            {/* 2. 폰트굵기 */}
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-slate-900">폰트굵기</span>
              <button
                type="button"
                onClick={() => setIsBold(!isBold)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                  isBold ? 'bg-[#0284c7]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                    isBold ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 3. 글자크기 */}
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-slate-900">글자크기</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setFontSizePt((prev) => Math.max(12, prev - 1))}
                  className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                >
                  －
                </button>
                <div className="w-28 sm:w-36 flex items-center">
                  <input
                    type="range"
                    min={12}
                    max={26}
                    value={fontSizePt}
                    onChange={(e) => setFontSizePt(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFontSizePt((prev) => Math.min(26, prev + 1))}
                  className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                >
                  ＋
                </button>
                <span className="text-[15px] font-bold text-slate-900 min-w-[38px] text-right">
                  {fontSizePt}pt
                </span>
              </div>
            </div>

            {/* 4. 스크롤 속도 */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[15px] font-bold text-slate-900 leading-tight">스크롤</span>
                  <span className="text-[15px] font-bold text-slate-900 leading-tight">속도</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setScrollSpeed((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                  >
                    －
                  </button>
                  <div className="w-28 sm:w-36 flex items-center">
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={scrollSpeed}
                      onChange={(e) => setScrollSpeed(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setScrollSpeed((prev) => Math.min(30, prev + 1))}
                    className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold active:scale-90 cursor-pointer"
                  >
                    ＋
                  </button>
                  <span className="text-[15px] font-bold text-slate-900 min-w-[38px] text-right">
                    {scrollSpeed}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                (숫자가 클수록 스크롤 속도가 빨라집니다)
              </p>
            </div>

            {/* 5. 화면 색반전 */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[15px] font-bold text-slate-900">화면 색반전</span>
              <div className="flex items-center gap-3">
                {/* Light Mode Button (Sun) */}
                <button
                  type="button"
                  onClick={() => setIsInverted(false)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    !isInverted
                      ? 'bg-[#0284c7] text-white shadow-md ring-2 ring-blue-300 scale-105'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                  title="주간 모드 (밝은 화면)"
                >
                  <Sun className="w-6 h-6 fill-amber-300 text-amber-300" />
                </button>

                {/* Dark Mode Button (Moon) */}
                <button
                  type="button"
                  onClick={() => setIsInverted(true)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isInverted
                      ? 'bg-slate-900 text-amber-300 shadow-md ring-2 ring-amber-400 scale-105'
                      : 'bg-slate-100 text-amber-500 hover:bg-slate-200'
                  }`}
                  title="야간 모드 (색반전 어두운 화면)"
                >
                  <Moon className="w-6 h-6 fill-amber-300 text-amber-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Translation Picker */}
      {showTransModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTransModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl border">
            <h3 className="font-extrabold text-slate-900 pb-3 border-b">역본 선택</h3>
            <div className="space-y-2 py-3">
              {(['개역개정', '개역한글', '쉬운성경', 'NIV'] as const).map((trans) => (
                <button
                  key={trans}
                  type="button"
                  onClick={() => {
                    setSelectedTranslation(trans);
                    setShowTransModal(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-bold border flex items-center justify-between ${
                    selectedTranslation === trans
                      ? 'bg-[#1b64b9] text-white border-[#1b64b9]'
                      : 'hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <span>{trans}</span>
                  {selectedTranslation === trans && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Voice and Natural AI TTS Settings */}
      {showVoiceModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current = null;
              }
              if (isPreviewPlaying && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                setIsPreviewPlaying(false);
              }
              setShowVoiceModal(false);
            }
          }}
        >
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4 text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎙️</span>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base">
                    낭독 음원 및 AI TTS 설정
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    기계음을 제거하고 자연스러운 낭독을 제공합니다
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (currentAudioRef.current) {
                    currentAudioRef.current.pause();
                    currentAudioRef.current = null;
                  }
                  if (isPreviewPlaying && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    setIsPreviewPlaying(false);
                  }
                  setShowVoiceModal(false);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voice Type Options */}
            <div>
              <p className="text-xs font-bold text-slate-600 mb-2">1. 낭독 음원 선택</p>
              <div className="space-y-1.5">
                {[
                  {
                    id: '남성 (자연스러운 중저음)',
                    label: '남성 (자연스러운 중저음)',
                    sub: '깊고 편안한 바리톤 울림, 안정감 있는 낭독 (권장)',
                    tag: '남성 바리톤',
                    icon: '🎙️',
                  },
                  {
                    id: '여성 (맑고 자연스러운 음성)',
                    label: '여성 (맑고 자연스러운 음성)',
                    sub: '기계음 없는 100% 맑고 은혜로운 자연 여성 육성 (기계음 절대 차단)',
                    tag: '자연 여성음',
                    icon: '🌸',
                  },
                ].map((item) => {
                  const isSelected = item.id.includes('여성')
                    ? voiceType.includes('여성')
                    : !voiceType.includes('여성');
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectVoiceType(item.id)}
                      className={`w-full p-2.5 rounded-2xl text-left border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 border-2 border-[#1b64b9] shadow-xs'
                          : 'hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p
                              className={`text-xs font-black ${
                                isSelected ? 'text-[#1b64b9]' : 'text-slate-900'
                              }`}
                            >
                              {item.label}
                            </p>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                isSelected
                                  ? 'bg-blue-200/80 text-blue-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {item.tag}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold">{item.sub}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#1b64b9] text-white flex items-center justify-center text-xs font-black shadow-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Speed Control */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-700">2. 낭독 속도</p>
                <span className="text-xs font-black text-[#1b64b9] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  현재 속도: {speechRate}x
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: '0.9x', sub: '차분하게', rate: 0.9 },
                  { label: '1.0x', sub: '표준', rate: 1.0 },
                  { label: '1.1x', sub: '추천·빠름', rate: 1.1 },
                  { label: '1.2x', sub: '빠르게', rate: 1.2 },
                  { label: '1.35x', sub: '속독', rate: 1.35 },
                ].map((s) => {
                  const isActive = Math.abs(speechRate - s.rate) < 0.03;
                  return (
                    <button
                      key={s.rate}
                      type="button"
                      onClick={() => handleSelectSpeechRate(s.rate)}
                      className={`py-2 px-1 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-center ${
                        isActive
                          ? 'bg-[#1b64b9] text-white border-[#1b64b9] shadow-sm ring-2 ring-blue-300 font-black'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-semibold'
                      }`}
                    >
                      <span className="text-xs font-black leading-tight">{s.label}</span>
                      <span
                        className={`text-[10px] mt-0.5 leading-tight ${
                          isActive ? 'text-blue-100 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {s.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pitch / Tone Control */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-slate-600">3. 음성 톤 (저음/표준)</p>
                <span className="text-xs font-black text-[#1b64b9]">
                  {speechPitch <= 0.94 ? '깊은 저음' : speechPitch <= 0.97 ? '부드러운 중저음' : '표준 톤'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '깊은 저음', pitch: 0.94 },
                  { label: '부드러운 중저음', pitch: 0.96 },
                  { label: '표준 톤', pitch: 1.0 },
                ].map((p) => {
                  const isActive = Math.abs(speechPitch - p.pitch) < 0.01;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectSpeechPitch(p.pitch)}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        isActive
                          ? 'bg-[#1b64b9] text-white border-[#1b64b9] shadow-xs ring-2 ring-blue-300 font-black'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Voice Info Box */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-700 font-extrabold">
                  <span className="text-emerald-600">●</span>
                  <span>현재 활성 음원:</span>
                  <span className="text-[#1b64b9] font-black">{voiceType}</span>
                </div>
                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[140px]">
                  {getVoiceProfile(voiceType, availableVoices, speechRate, speechPitch).engineName}
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                ✓ {getVoiceProfile(voiceType, availableVoices, speechRate, speechPitch).summary}
              </p>
            </div>

            {/* Preview and Save Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (isPreviewPlaying) {
                    if (currentAudioRef.current) {
                      currentAudioRef.current.pause();
                      currentAudioRef.current = null;
                    }
                    if ('speechSynthesis' in window) {
                      window.speechSynthesis.cancel();
                    }
                    setIsPreviewPlaying(false);
                  } else {
                    previewVoice(voiceType, speechRate, speechPitch);
                  }
                }}
                className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition cursor-pointer active:scale-95 ${
                  isPreviewPlaying
                    ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                    : 'bg-blue-50 hover:bg-blue-100 text-[#1b64b9] border-blue-200'
                }`}
              >
                <span>{isPreviewPlaying ? '⏹ 미리듣기 멈춤' : '▶ 낭독 음원 미리듣기 (1절 시연)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentAudioRef.current) {
                    currentAudioRef.current.pause();
                    currentAudioRef.current = null;
                  }
                  if (isPreviewPlaying && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                    setIsPreviewPlaying(false);
                  }
                  setShowVoiceModal(false);
                }}
                className="w-full py-2.5 rounded-xl bg-[#1b64b9] hover:bg-blue-700 text-white font-black text-xs shadow-md transition cursor-pointer active:scale-95"
              >
                설정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 선교 헌금 Modal */}
      {showOfferingModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOfferingModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 fill-red-500" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">수퍼바이블 사역 선교 헌금</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              전 세계 성도들의 말씀 통독과 음성 녹음 사역을 후원해 주셔서 감사합니다.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border text-xs text-slate-700 text-left mb-4">
              <p className="font-bold text-slate-900">후원 계좌 안내</p>
              <p className="mt-1">농협 351-1234-5678-91 (예금주: 로고스선교회)</p>
            </div>
            <button
              type="button"
              onClick={() => setShowOfferingModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#1b64b9] text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
