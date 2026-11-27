import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Search, X, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { BIBLE_BOOKS } from '../data/bibleData';

/**
 * 성경 검색 화면
 * - 검색 본문: 성경전서 개역한글판 (대한성서공회, 저작권 보호기간 만료 · Public Domain)
 * - /bible-krv.json : [책][장][절] 문자열 배열 (66권 순서 = BIBLE_BOOKS 순서)
 */

type KrvData = string[][][];

let krvPromise: Promise<KrvData> | null = null;
function loadKrv(): Promise<KrvData> {
  if (!krvPromise) {
    krvPromise = fetch('/bible-krv.json')
      .then((r) => {
        if (!r.ok) throw new Error(`성경 본문을 불러오지 못했습니다 (${r.status})`);
        return r.json();
      })
      .catch((e) => {
        krvPromise = null;
        throw e;
      });
  }
  return krvPromise;
}

const RECENT_KEY = 'superbible_recent_searches_v1';
const MAX_RECENT = 10;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* 저장 불가 환경은 무시 */
  }
}

interface Hit {
  chapter: number;
  verse: number;
  text: string;
}
interface BookHits {
  bookIndex: number;
  name: string;
  hits: Hit[];
}

interface Props {
  onClose: () => void;
  /** 해당 장(절)을 성경 읽기 화면으로 연다 */
  onOpen: (book: string, chapter: number, verse?: number) => void;
  /** 검색어가 없을 때 보여 줄 책 (현재 읽던 책) */
  currentBook?: string;
}

const Highlight: React.FC<{ text: string; q: string }> = ({ text, q }) => {
  if (!q) return <>{text}</>;
  const parts = text.split(q);
  return (
    <>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {p}
          {i < parts.length - 1 && <mark className="bg-amber-200/80 text-slate-900 rounded px-0.5">{q}</mark>}
        </React.Fragment>
      ))}
    </>
  );
};

const ChapterRow: React.FC<{ book: string; count: number; onPick: (ch: number) => void }> = ({ book, count, onPick }) => (
  <section className="space-y-2.5">
    <h3 className="text-[15px] font-black text-[#2a5d9f]">{book}</h3>
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
      {Array.from({ length: count }, (_, i) => i + 1).map((ch) => (
        <button
          key={ch}
          type="button"
          onClick={() => onPick(ch)}
          className="w-12 h-12 flex-shrink-0 rounded-full border border-slate-200 bg-white text-[15px] font-semibold text-slate-800 hover:border-[#2a5d9f] hover:text-[#2a5d9f] active:scale-95 transition cursor-pointer"
        >
          {ch}
        </button>
      ))}
    </div>
  </section>
);

export const BibleSearchView: React.FC<Props> = ({ onClose, onOpen, currentBook }) => {
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState(''); // 실제로 검색에 쓰는 검색어 (입력 후 잠시 뒤 반영)
  const [data, setData] = useState<KrvData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(readRecent);
  const [expanded, setExpanded] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    loadKrv()
      .then(setData)
      .catch((e) => setLoadError(e?.message || '성경 본문을 불러오지 못했습니다.'));
  }, []);

  // 입력이 멈추면 검색 실행
  useEffect(() => {
    const t = setTimeout(() => setTerm(query.trim().replace(/\s+/g, ' ')), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => setExpanded(null), [term]);

  const saveRecent = (q: string) => {
    const v = q.trim().replace(/\s+/g, ' ');
    if (!v) return;
    const next = [v, ...recent.filter((x) => x !== v)].slice(0, MAX_RECENT);
    setRecent(next);
    writeRecent(next);
  };
  const removeRecent = (q: string) => {
    const next = recent.filter((x) => x !== q);
    setRecent(next);
    writeRecent(next);
  };
  const clearRecent = () => {
    setRecent([]);
    writeRecent([]);
  };

  // 책 이름이 검색어를 포함하면 장 바로가기 표시 (예: 베드로 → 베드로전서·베드로후서)
  const bookMatches = useMemo(() => {
    if (!term) return [];
    const q = term.replace(/\s/g, '');
    return BIBLE_BOOKS.filter((b) => b.name.includes(q));
  }, [term]);

  // 본문 검색 (책별로 묶어서 건수 표시)
  const results: BookHits[] = useMemo(() => {
    if (!term || !data) return [];
    const out: BookHits[] = [];
    data.forEach((chapters, bi) => {
      const hits: Hit[] = [];
      chapters.forEach((verses, ci) => {
        verses.forEach((text, vi) => {
          if (text && text.includes(term)) hits.push({ chapter: ci + 1, verse: vi + 1, text });
        });
      });
      if (hits.length) out.push({ bookIndex: bi, name: BIBLE_BOOKS[bi]?.name || `${bi + 1}`, hits });
    });
    return out;
  }, [term, data]);

  const totalHits = results.reduce((n, r) => n + r.hits.length, 0);
  const current = BIBLE_BOOKS.find((b) => b.name === currentBook) || BIBLE_BOOKS.find((b) => b.name === '요한계시록');

  const openChapter = (book: string, ch: number, v?: number) => {
    if (term) saveRecent(term);
    onOpen(book, ch, v);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in">
      {/* 상단 제목 */}
      <header className="flex-shrink-0 px-3 pt-3 pb-2 flex items-center">
        <button type="button" onClick={onClose} aria-label="뒤로" className="p-2 rounded-full hover:bg-slate-100 cursor-pointer">
          <ArrowLeft className="w-6 h-6 text-slate-800" />
        </button>
        <h1 className="flex-1 text-center text-[19px] font-black text-slate-900 tracking-tight pr-10">성경 검색</h1>
      </header>

      {/* 검색창 */}
      <form
        className="flex-shrink-0 px-4 pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(query.trim().replace(/\s+/g, ' '));
          saveRecent(query);
          inputRef.current?.blur();
        }}
      >
        <div className="flex items-center gap-2 bg-[#eef3fb] rounded-full pl-2 pr-3 py-2">
          <span className="flex-shrink-0 bg-white text-slate-800 text-[13px] font-bold px-3 py-1.5 rounded-full shadow-2xs">
            개역한글
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어 입력"
            enterKeyHint="search"
            className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setTerm('');
                inputRef.current?.focus();
              }}
              aria-label="검색어 지우기"
              className="p-1 text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <button type="submit" aria-label="검색" className="p-1 text-[#2a5d9f] cursor-pointer">
            <Search className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>
      </form>

      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-10 space-y-5">
        {!term ? (
          <>
            {current && (
              <ChapterRow book={current.name} count={current.chaptersCount} onPick={(ch) => openChapter(current.name, ch)} />
            )}

            <section className="pt-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-[15px] font-black text-[#2a5d9f]">최근 검색어</h3>
                {recent.length > 0 && (
                  <button type="button" onClick={clearRecent} className="text-[13px] text-slate-400 hover:text-slate-600 cursor-pointer">
                    모두삭제
                  </button>
                )}
              </div>
              {recent.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">최근 검색어가 없습니다.</p>
              ) : (
                <ul>
                  {recent.map((r) => (
                    <li key={r} className="flex items-center border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setQuery(r);
                          setTerm(r);
                          saveRecent(r);
                        }}
                        className="flex-1 flex items-center gap-2.5 py-3.5 text-left cursor-pointer"
                      >
                        <Clock className="w-4.5 h-4.5 text-slate-700 flex-shrink-0" />
                        <span className="text-[15px] font-semibold text-slate-800 truncate">{r}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecent(r)}
                        aria-label={`${r} 삭제`}
                        className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : (
          <>
            {bookMatches.map((b) => (
              <ChapterRow key={b.id} book={b.name} count={b.chaptersCount} onPick={(ch) => openChapter(b.name, ch)} />
            ))}

            {loadError ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm text-rose-600 font-bold">{loadError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoadError(null);
                    loadKrv().then(setData).catch((e) => setLoadError(e?.message || '다시 시도해 주세요.'));
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 rounded-lg cursor-pointer"
                >
                  다시 시도
                </button>
              </div>
            ) : !data ? (
              <div className="py-10 flex flex-col items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                성경 본문을 불러오는 중… (처음 한 번만)
              </div>
            ) : results.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                ‘{term}’ 검색 결과가 없습니다.
              </p>
            ) : (
              <section>
                <p className="text-[12px] text-slate-400 pb-1">
                  {results.length}권 · 총 {totalHits.toLocaleString()}절
                </p>
                <ul>
                  {results.map((r) => {
                    const open = expanded === r.bookIndex;
                    return (
                      <li key={r.bookIndex} className="border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => setExpanded(open ? null : r.bookIndex)}
                          className="w-full flex items-center justify-between py-4 text-left cursor-pointer"
                        >
                          <span className="text-[16px] font-semibold text-slate-800">
                            {r.name} ({r.hits.length} 건)
                          </span>
                          {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
                        </button>
                        {open && (
                          <ul className="pb-3 space-y-1">
                            {r.hits.map((h) => (
                              <li key={`${h.chapter}-${h.verse}`}>
                                <button
                                  type="button"
                                  onClick={() => openChapter(r.name, h.chapter, h.verse)}
                                  className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 cursor-pointer"
                                >
                                  <span className="text-[12px] font-black text-[#2a5d9f] mr-1.5">
                                    {h.chapter}:{h.verse}
                                  </span>
                                  <span className="text-[14px] leading-relaxed text-slate-700">
                                    <Highlight text={h.text} q={term} />
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}

        <p className="pt-4 text-center text-[10px] text-slate-300">검색 본문: 성경전서 개역한글판 (대한성서공회)</p>
      </main>
    </div>
  );
};
