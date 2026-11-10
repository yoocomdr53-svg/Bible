// Bible API & Multi-Translation Engine
// Supports: 개역개정, 개역한글, 쉬운성경, 표준새번역, 킹제임스(KJV), 킹제임스흠정역, NIV, and User-Uploaded Custom Bibles

import { BIBLE_BOOKS, SAMPLE_VERSES_CHAPTER } from '../data/bibleData';

export interface VerseItem {
  verse: number;
  text: string;
}

export interface TranslationOption {
  id: string;
  name: string;
  category: 'korean' | 'english' | 'custom';
  description: string;
  isCustom?: boolean;
}

export const OFFICIAL_TRANSLATIONS: TranslationOption[] = [
  { id: '개역개정', name: '개역개정 (GAE)', category: 'korean', description: '한국 교회 표준 공인 역본' },
  { id: '개역한글', name: '개역한글 (HAN)', category: 'korean', description: '전통 성경 공공 판본' },
  { id: '쉬운성경', name: '쉬운성경 (EASY)', category: 'korean', description: '현대어 쉬운 성경' },
  { id: '표준새번역', name: '표준새번역 (SAE)', category: 'korean', description: '대한성서공회 표준새번역' },
  { id: '킹제임스', name: '킹제임스 (KJV)', category: 'english', description: 'King James Version (영문 표준)' },
  { id: '킹제임스흠정역', name: '킹제임스 흠정역', category: 'korean', description: 'KJV 한국어 흠정역 (소장본 등록 지원)' },
  { id: 'NIV', name: 'NIV 성경', category: 'english', description: 'New International Version (영문 현대역)' },
];

const CUSTOM_VERSIONS_STORAGE_KEY = 'superbible_custom_versions_meta_v1';
const DB_NAME = 'SuperBibleVerseDB_v3';
const STORE_CACHE = 'verse_cache';
const STORE_CUSTOM = 'custom_chapters';

// IndexedDB Helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CUSTOM)) {
        db.createObjectStore(STORE_CUSTOM, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// In-Memory Rapid Cache for current session
const memoryCache = new Map<string, VerseItem[]>();

// 66 Books Bolls Index Mapping (1 to 66)
export const BOLLS_BOOK_MAP: Record<string, number> = {
  '창세기': 1, '출애굽기': 2, '레위기': 3, '민수기': 4, '신명기': 5,
  '여호수아': 6, '사사기': 7, '룻기': 8, '사무엘상': 9, '사무엘하': 10,
  '열왕기상': 11, '열왕기하': 12, '역대상': 13, '역대하': 14, '에스라': 15,
  '느헤미야': 16, '에스더': 17, '욥기': 18, '시편': 19, '잠언': 20,
  '전도서': 21, '아가': 22, '이사야': 23, '예레미야': 24, '예레미야애가': 25,
  '에스겔': 26, '다니엘': 27, '호세아': 28, '요엘': 29, '아모스': 30,
  '오바댜': 31, '요나': 32, '미가': 33, '나훔': 34, '하박국': 35,
  '스바냐': 36, '학개': 37, '스가랴': 38, '말라기': 39,
  '마태복음': 40, '마가복음': 41, '누가복음': 42, '요한복음': 43, '사도행전': 44,
  '로마서': 45, '고린도전서': 46, '고린도후서': 47, '갈라디아서': 48, '에베소서': 49,
  '빌립보서': 50, '골로새서': 51, '데살로니가전서': 52, '데살로니가후서': 53,
  '디모데전서': 54, '디모데후서': 55, '디도서': 56, '빌레몬서': 57, '히브리서': 58,
  '야고보서': 59, '베드로전서': 60, '베드로후서': 61, '요한일서': 62, '요한1서': 62,
  '요한이서': 63, '요한2서': 63, '요한삼서': 64, '요한3서': 64, '유다서': 65, '요한계시록': 66
};

// Available translations (Official + Custom)
export function getAllAvailableTranslations(): TranslationOption[] {
  if (typeof window === 'undefined') return OFFICIAL_TRANSLATIONS;
  try {
    const raw = localStorage.getItem(CUSTOM_VERSIONS_STORAGE_KEY);
    if (!raw) return OFFICIAL_TRANSLATIONS;
    const customList: TranslationOption[] = JSON.parse(raw);
    const set = new Set(OFFICIAL_TRANSLATIONS.map((o) => o.id));
    const merged = [...OFFICIAL_TRANSLATIONS];
    for (const c of customList) {
      if (!set.has(c.id)) {
        merged.push(c);
      }
    }
    return merged;
  } catch {
    return OFFICIAL_TRANSLATIONS;
  }
}

// Check if a translation is custom registered
export function isCustomTranslationRegistered(translationId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(`superbible_custom_${translationId}_flag`);
    return raw === 'true';
  } catch {
    return false;
  }
}

// Fetch cached chapter from IndexedDB
async function getCachedChapter(key: string): Promise<VerseItem[] | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_CACHE], 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result.verses) && req.result.verses.length > 0) {
          resolve(req.result.verses);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Save chapter to IndexedDB cache
async function saveCachedChapter(key: string, verses: VerseItem[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_CACHE], 'readwrite');
    const store = tx.objectStore(STORE_CACHE);
    store.put({ id: key, verses, savedAt: Date.now() });
  } catch (e) {
    // silently fail
  }
}

// Fetch custom uploaded chapter from IndexedDB
export async function getCustomUploadedChapter(
  translationId: string,
  bookName: string,
  chapter: number
): Promise<VerseItem[] | null> {
  try {
    const key = `${translationId}_${bookName}_${chapter}`;
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_CUSTOM], 'readonly');
      const store = tx.objectStore(STORE_CUSTOM);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && Array.isArray(req.result.verses) && req.result.verses.length > 0) {
          resolve(req.result.verses);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Core Loader: Loads Bible Chapter Verses dynamically with full fallback & caching
export async function loadBibleChapterVerses(
  bookName: string,
  chapter: number,
  translation: string = '개역개정'
): Promise<VerseItem[]> {
  const cacheKey = `${translation}_${bookName}_${chapter}`;

  // 1. Check in-memory cache
  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    if (cached.length > 0) return cached;
  }

  // 2. Check Custom Uploaded Bibles (e.g. 킹제임스흠정역, 쉬운성경 custom files)
  const customVerses = await getCustomUploadedChapter(translation, bookName, chapter);
  if (customVerses && customVerses.length > 0) {
    memoryCache.set(cacheKey, customVerses);
    return customVerses;
  }

  // 3. Check IndexedDB persistent cache
  const dbCached = await getCachedChapter(cacheKey);
  if (dbCached && dbCached.length > 0) {
    memoryCache.set(cacheKey, dbCached);
    return dbCached;
  }

  // 4. Fetch from /api/bible
  try {
    let apiVer = 'GAE';
    if (translation === '개역한글') apiVer = 'HAN';
    else if (translation === '표준새번역') apiVer = 'SAE';
    else if (translation === '킹제임스') apiVer = 'KJV';
    else if (translation === 'NIV') apiVer = 'NIV';
    else if (translation === '쉬운성경') apiVer = 'SAENEW'; // 현대어 쉬운 성경
    else if (translation === '킹제임스흠정역') apiVer = 'GAE'; // 소장본 업로드 전 기본

    const apiUrl = `/api/bible?version=${encodeURIComponent(apiVer)}&book=${encodeURIComponent(bookName)}&chap=${chapter}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.verses) && data.verses.length > 0) {
        memoryCache.set(cacheKey, data.verses);
        saveCachedChapter(cacheKey, data.verses);
        return data.verses;
      }
    }
  } catch (apiErr) {
    console.warn(`[BibleAPI] Failed to fetch /api/bible for ${bookName} ${chapter}:`, apiErr);
  }

  // 5. Client Direct Fallback via Bolls Life (CORS enabled)
  try {
    const bookIdx = BOLLS_BOOK_MAP[bookName] || 1;
    let bollsTrans = 'KRV'; // 개역한글
    if (translation === '킹제임스') bollsTrans = 'KJV';
    else if (translation === 'NIV') bollsTrans = 'NIV';
    else if (translation === '표준새번역' || translation === '쉬운성경') bollsTrans = 'RNKSV';

    const bollsUrl = `https://bolls.life/get-chapter/${bollsTrans}/${bookIdx}/${chapter}/`;
    const bController = new AbortController();
    const bTimeout = setTimeout(() => bController.abort(), 6000);
    const bRes = await fetch(bollsUrl, { signal: bController.signal });
    clearTimeout(bTimeout);

    if (bRes.ok) {
      const bList = await bRes.json();
      if (Array.isArray(bList) && bList.length > 0) {
        const verses: VerseItem[] = bList.map((item) => ({
          verse: item.verse,
          text: String(item.text || '')
            .replace(/<S>\d+<\/S>/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
        }));
        memoryCache.set(cacheKey, verses);
        saveCachedChapter(cacheKey, verses);
        return verses;
      }
    }
  } catch (bollsErr) {
    console.warn(`[BibleAPI] Client direct fallback failed:`, bollsErr);
  }

  // 5-1. Direct NIV GitHub dataset fallback
  if (translation === 'NIV') {
    try {
      const bookIdx = BOLLS_BOOK_MAP[bookName] || 1;
      const nivResp = await fetch('https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_niv.json');
      if (nivResp.ok) {
        const fullNiv = await nivResp.json();
        const bookData = fullNiv[bookIdx - 1];
        const chapterArray = bookData?.chapters?.[chapter - 1] || [];
        if (Array.isArray(chapterArray) && chapterArray.length > 0) {
          const verses: VerseItem[] = chapterArray.map((txt: string, idx: number) => ({
            verse: idx + 1,
            text: String(txt || '').trim(),
          }));
          memoryCache.set(cacheKey, verses);
          saveCachedChapter(cacheKey, verses);
          return verses;
        }
      }
    } catch (nivErr) {
      console.warn(`[BibleAPI] Direct NIV fallback failed:`, nivErr);
    }
  }

  // 6. Hardcoded Sample Verses Fallback (e.g. 창세기 1, 2장 등)
  const sampleKey = `${bookName}-${chapter}`;
  if (SAMPLE_VERSES_CHAPTER[sampleKey] && SAMPLE_VERSES_CHAPTER[sampleKey].length > 0) {
    return SAMPLE_VERSES_CHAPTER[sampleKey];
  }

  return [];
}

// Save Custom Bible Uploaded by User (IndexedDB Batch Save)
export async function registerCustomBibleVersion(
  versionName: string,
  groupedChapters: Record<string, { bookName: string; chapter: number; verses: VerseItem[] }>
): Promise<{ totalVerses: number; totalChapters: number }> {
  const db = await openDB();
  const tx = db.transaction([STORE_CUSTOM], 'readwrite');
  const store = tx.objectStore(STORE_CUSTOM);

  let totalVerses = 0;
  let totalChapters = 0;

  for (const [key, val] of Object.entries(groupedChapters)) {
    const itemKey = `${versionName}_${val.bookName}_${val.chapter}`;
    store.put({
      id: itemKey,
      version: versionName,
      bookName: val.bookName,
      chapter: val.chapter,
      verses: val.verses,
      updatedAt: Date.now()
    });
    totalVerses += val.verses.length;
    totalChapters++;
  }

  // Register in available translations list
  const existing = getAllAvailableTranslations();
  if (!existing.some((t) => t.id === versionName)) {
    existing.push({
      id: versionName,
      name: `${versionName} [소장본]`,
      category: 'custom',
      description: `사용자 등록 성경 (${totalChapters}장, ${totalVerses.toLocaleString()}절)`,
      isCustom: true
    });
    localStorage.setItem(CUSTOM_VERSIONS_STORAGE_KEY, JSON.stringify(existing));
  }

  localStorage.setItem(`superbible_custom_${versionName}_flag`, 'true');

  return { totalVerses, totalChapters };
}

// 윈도우 ANSI(CP949/EUC-KR) 및 UTF-8 자동 감지 파일 디코더
export async function decodeBibleFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();

  try {
    const strictUtf8Decoder = new TextDecoder('utf-8', { fatal: true });
    const text = strictUtf8Decoder.decode(buffer);
    if (/[가-힣]/.test(text) || text.includes('Genesis') || text.includes('Bible')) {
      return text;
    }
  } catch {}

  try {
    const eucDecoder = new TextDecoder('euc-kr');
    const eucText = eucDecoder.decode(buffer);
    if (/[가-힣]/.test(eucText)) {
      return eucText;
    }
  } catch {}

  const fallbackDecoder = new TextDecoder('utf-8', { fatal: false });
  return fallbackDecoder.decode(buffer);
}

// Standard Korean Bible Abbreviations for Text Parsing
export const BIBLE_ABBREVIATIONS: Record<string, string> = {
  '창': '창세기', '출': '출애굽기', '레': '레위기', '민': '민수기', '신': '신명기',
  '수': '여호수아', '삿': '사사기', '룻': '룻기', '삼상': '사무엘상', '삼하': '사무엘하',
  '왕상': '열왕기상', '왕하': '열왕기하', '대상': '역대상', '대하': '역대하', '스': '에스라',
  '느': '느헤미야', '에': '에스더', '욥': '욥기', '시': '시편', '잠': '잠언', '전': '전도서',
  '아': '아가', '사': '이사야', '렘': '예레미야', '애': '예레미야애가', '겔': '에스겔',
  '단': '다니엘', '호': '호세아', '욜': '요엘', '암': '아모스', '옵': '오바댜', '욘': '요나',
  '미': '미가', '나': '나훔', '합': '하박국', '습': '스바냐', '학': '학개', '슥': '스가랴', '말': '말라기',
  '마': '마태복음', '막': '마가복음', '눅': '누가복음', '요': '요한복음', '행': '사도행전',
  '롬': '로마서', '고전': '고린도전서', '고후': '고린도후서', '갈': '갈라디아서', '엡': '에베소서',
  '빌': '빌립보서', '골': '골로새서', '살전': '데살로니가전서', '살후': '데살로니가후서',
  '딤전': '디모데전서', '딤후': '디모데후서', '딛': '디도서', '몬': '빌레몬서', '히': '히브리서',
  '약': '야고보서', '벧전': '베드로전서', '벧후': '베드로후서', '요일': '요한일서', '요이': '요한이서',
  '요삼': '요한삼서', '유': '유다서', '계': '요한계시록'
};

export function normalizeBookName(rawName?: string | null): string | null {
  if (!rawName) return null;
  const clean = rawName.trim().replace(/^[\(\[\<"']+|[\)\]\>"']+$/g, '').trim();
  if (!clean) return null;

  const directMatch = BIBLE_BOOKS.find((b) => b.name === clean);
  if (directMatch) return directMatch.name;

  if (BIBLE_ABBREVIATIONS[clean]) {
    return BIBLE_ABBREVIATIONS[clean];
  }

  const prefixMatch = BIBLE_BOOKS.find((b) => b.name.startsWith(clean));
  if (prefixMatch) return prefixMatch.name;

  return null;
}

export function extractBookFromFileName(filename: string): string | null {
  if (!filename) return null;
  const name = filename.replace(/\.[^/.]+$/, '');

  const sortedBooks = [...BIBLE_BOOKS].map((b) => b.name).sort((a, b) => b.length - a.length);
  for (const book of sortedBooks) {
    if (name.includes(book)) {
      return book;
    }
  }

  const sortedAbbrs = Object.entries(BIBLE_ABBREVIATIONS).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [abbr, fullName] of sortedAbbrs) {
    const pattern = new RegExp(`(?:^|[0-9_\\-\\s])${abbr}(?:[0-9_\\-\\s]|$)`);
    if (pattern.test(name)) {
      return fullName;
    }
  }

  return null;
}

// Parse plain text / TSV / CSV Bible File into structured chapters
export function parseBibleFullText(
  content: string,
  defaultBook = '창세기'
): Record<string, { bookName: string; chapter: number; verses: VerseItem[] }> {
  const trimmed = content.trim();
  const grouped: Record<string, { bookName: string; chapter: number; verses: VerseItem[] }> = {};

  if (!trimmed) return grouped;

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  let currentBook = defaultBook;
  let currentChapter = 1;

  for (const l of lines) {
    // 1. Header: [창세기 1장] or 창세기 1장
    const headerMatch = l.match(/^\[?\s*([가-힣]{1,8})\s*(?:제\s*)?(\d+)\s*장?\s*\]?$/);
    if (headerMatch) {
      const b = normalizeBookName(headerMatch[1]);
      if (b) {
        currentBook = b;
        currentChapter = parseInt(headerMatch[2], 10);
        continue;
      }
    }

    // 2. Full match: [창세기 1:1] 태초에... or 창1:1 태초에... or 창세기 1장 1절 태초에...
    const fullMatch = l.match(
      /^\[?\s*([가-힣]{1,8})\s*(\d+)\s*(?:장|:|\.)\s*(\d+)\s*(?:절|\]|[:.\s\t])\s*(.+)$/
    );
    if (fullMatch) {
      const b = normalizeBookName(fullMatch[1]);
      if (b) {
        currentBook = b;
        currentChapter = parseInt(fullMatch[2], 10);
        const vNum = parseInt(fullMatch[3], 10);
        const vText = fullMatch[4].trim();
        const key = `${currentBook}-${currentChapter}`;
        if (!grouped[key]) {
          grouped[key] = { bookName: currentBook, chapter: currentChapter, verses: [] };
        }
        grouped[key].verses.push({ verse: vNum, text: vText });
        continue;
      }
    }

    // 3. Simple number match within current chapter: "1 태초에..." or "1절 태초에..."
    const numOnlyMatch = l.match(/^(\d+)(?:절|[:.\s\t])\s*(.+)$/);
    if (numOnlyMatch) {
      const vNum = parseInt(numOnlyMatch[1], 10);
      const vText = numOnlyMatch[2].trim();
      const key = `${currentBook}-${currentChapter}`;
      if (!grouped[key]) {
        grouped[key] = { bookName: currentBook, chapter: currentChapter, verses: [] };
      }
      grouped[key].verses.push({ verse: vNum, text: vText });
    }
  }

  return grouped;
}
