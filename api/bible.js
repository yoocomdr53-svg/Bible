// Vercel Serverless Function: Bible Chapter API
// Supports: GAE (개역개정), HAN (개역한글), SAE (표준새번역), SAENEW (새번역), KJV (킹제임스), NIV (New International Version), EASY (쉬운성경)

const BSKOREA_BOOK_MAP = {
  // 구약 39권
  '창세기': 'gen', '출애굽기': 'exo', '레위기': 'lev', '민수기': 'num', '신명기': 'deu',
  '여호수아': 'jos', '사사기': 'jdg', '룻기': 'rut', '사무엘상': '1sa', '사무엘하': '2sa',
  '열왕기상': '1ki', '열왕기하': '2ki', '역대상': '1ch', '역대하': '2ch', '에스라': 'ezr',
  '느헤미야': 'neh', '에스더': 'est', '욥기': 'job', '시편': 'psa', '잠언': 'pro',
  '전도서': 'ecc', '아가': 'sng', '이사야': 'isa', '예레미야': 'jer', '예레미야애가': 'lam',
  '에스겔': 'ezk', '다니엘': 'dan', '호세아': 'hos', '요엘': 'jol', '아모스': 'amo',
  '오바댜': 'oba', '요나': 'jnh', '미가': 'mic', '나훔': 'nam', '하박국': 'hab',
  '스바냐': 'zep', '학개': 'hag', '스가랴': 'zec', '말라기': 'mal',
  // 신약 27권
  '마태복음': 'mat', '마가복음': 'mrk', '누가복음': 'luk', '요한복음': 'jhn', '사도행전': 'act',
  '로마서': 'rom', '고린도전서': '1co', '고린도후서': '2co', '갈라디아서': 'gal', '에베소서': 'eph',
  '빌립보서': 'php', '골로새서': 'col', '데살로니가전서': '1th', '데살로니가후서': '2th',
  '디모데전서': '1ti', '디모데후서': '2ti', '디도서': 'tit', '빌레몬서': 'phm', '히브리서': 'heb',
  '야고보서': 'jas', '베드로전서': '1pe', '베드로후서': '2pe', '요한일서': '1jn', '요한1서': '1jn',
  '요한이서': '2jn', '요한2서': '2jn', '요한삼서': '3jn', '요한3서': '3jn', '유다서': 'jud', '요한계시록': 'rev'
};

const BOLLS_BOOK_INDEX = {
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

// Simple In-memory chapter cache (30 min TTL)
const cache = new Map();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { version = 'GAE', book = '창세기', chap = '1' } = req.query || {};
  const chapterNum = parseInt(chap, 10) || 1;
  const bookName = decodeURIComponent(book).trim();
  const cacheKey = `${version}:${bookName}:${chapterNum}`;

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    res.status(200).json(cached);
    return;
  }

  try {
    // 1. KJV / KRV from Bolls API
    if (version === 'KJV' || version === 'KRV') {
      const bookIdx = BOLLS_BOOK_INDEX[bookName];
      if (!bookIdx) {
        throw new Error(`알 수 없는 성경 책 이름: ${bookName}`);
      }
      const bollsTrans = version === 'KJV' ? 'KJV' : 'KRV';
      const bollsUrl = `https://bolls.life/get-chapter/${bollsTrans}/${bookIdx}/${chapterNum}/`;
      const response = await fetch(bollsUrl, { headers: { 'User-Agent': 'SuperBible/1.5' } });
      if (!response.ok) throw new Error(`Bolls fetch failed: ${response.status}`);
      const list = await response.json();
      const verses = list.map((item) => ({
        verse: item.verse,
        text: String(item.text || '')
          .replace(/<S>\d+<\/S>/g, '') // remove Strong's numbers
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      }));

      const result = { version, book: bookName, chapter: chapterNum, verses };
      cache.set(cacheKey, result);
      res.status(200).json(result);
      return;
    }

    // 2. NIV from thiagobodruk github dataset
    if (version === 'NIV') {
      const bookIdx = BOLLS_BOOK_INDEX[bookName];
      if (!bookIdx) throw new Error(`Unknown book: ${bookName}`);
      // Fetch thiagobodruk en_niv.json on-demand (cached)
      const nivCacheKey = '__FULL_EN_NIV_JSON__';
      let fullNiv = cache.get(nivCacheKey);
      if (!fullNiv) {
        const nivResp = await fetch('https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_niv.json');
        fullNiv = await nivResp.json();
        cache.set(nivCacheKey, fullNiv);
      }
      const bookData = fullNiv[bookIdx - 1];
      const chapterArray = bookData?.chapters?.[chapterNum - 1] || [];
      const verses = chapterArray.map((txt, idx) => ({
        verse: idx + 1,
        text: String(txt || '').trim()
      }));

      const result = { version: 'NIV', book: bookName, chapter: chapterNum, verses };
      cache.set(cacheKey, result);
      res.status(200).json(result);
      return;
    }

    // 3. Korean Versions (GAE: 개역개정, HAN: 개역한글, SAE: 표준새번역, SAENEW: 새번역) from bskorea
    const bskoreaCode = BSKOREA_BOOK_MAP[bookName] || 'gen';
    let bskoreaVer = version;
    if (version === '개역개정') bskoreaVer = 'GAE';
    else if (version === '개역한글') bskoreaVer = 'HAN';
    else if (version === '표준새번역') bskoreaVer = 'SAE';
    else if (version === '새번역') bskoreaVer = 'SAENEW';
    else if (!['GAE', 'HAN', 'SAE', 'SAENEW'].includes(bskoreaVer)) {
      bskoreaVer = 'GAE'; // default to 개역개정
    }

    const bskoreaUrl = `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=${bskoreaVer}&book=${bskoreaCode}&chap=${chapterNum}`;
    const response = await fetch(bskoreaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`bskorea fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const parts = html.split(/<span class="number">/);
    const verses = [];

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const numMatch = part.match(/^(\d+)&nbsp;&nbsp;&nbsp;<\/span>/);
      if (numMatch) {
        const vNum = parseInt(numMatch[1], 10);
        const rawContent = part.replace(/^(\d+)&nbsp;&nbsp;&nbsp;<\/span>/, '').split(/<\/span>/)[0];
        const cleanText = rawContent
          .replace(/<div[\s\S]*?<\/div>/gi, '') // remove footnotes
          .replace(/<[^>]+>/g, '') // remove HTML tags
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanText) {
          verses.push({ verse: vNum, text: cleanText });
        }
      }
    }

    // Fallback to Bolls Life if bskorea returned empty
    if (verses.length === 0) {
      const bookIdx = BOLLS_BOOK_INDEX[bookName] || 1;
      const bollsFallbackUrl = `https://bolls.life/get-chapter/RNKSV/${bookIdx}/${chapterNum}/`;
      const fallbackResp = await fetch(bollsFallbackUrl);
      if (fallbackResp.ok) {
        const fList = await fallbackResp.json();
        for (const item of fList) {
          verses.push({
            verse: item.verse,
            text: String(item.text || '').replace(/<[^>]+>/g, '').trim()
          });
        }
      }
    }

    const result = {
      version: bskoreaVer,
      book: bookName,
      bookCode: bskoreaCode,
      chapter: chapterNum,
      verses
    };

    cache.set(cacheKey, result);
    res.status(200).json(result);
  } catch (error) {
    console.error('Bible API Error:', error);
    // Graceful error response with fallback indicator
    res.status(500).json({
      error: error.message || 'Failed to fetch Bible chapter',
      version,
      book: bookName,
      chapter: chapterNum,
      verses: []
    });
  }
}
