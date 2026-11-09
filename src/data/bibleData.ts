import { BibleVerse, BibleBook, ReadingDayPlan, UserRecording } from '../types';

// Korean Bible 66 Books Standard Abbreviations (표준 한글 성경 약어 사전)
export const BIBLE_ABBREVIATIONS: Record<string, string> = {
  창세기: '창', 출애굽기: '출', 레위기: '레', 민수기: '민', 신명기: '신',
  여호수아: '수', 사사기: '삿', 룻기: '룻', 사무엘상: '삼상', 사무엘하: '삼하',
  열왕기상: '왕상', 열왕기하: '왕하', 역대상: '대상', 역대하: '대하', 에스라: '스',
  느헤미야: '느', 에스더: '에', 욥기: '욥', 시편: '시', 잠언: '잠',
  전도서: '전', 아가: '아', 이사야: '사', 예레미야: '렘', 예레미야애가: '애',
  에스겔: '겔', 다니엘: '단', 호세아: '호', 요엘: '욜', 아모스: '암',
  오바댜: '옵', 요나: '욘', 미가: '미', 나훔: '나', 하박국: '합',
  스바냐: '습', 학개: '학', 스가랴: '슥', 말라기: '말',
  마태복음: '마', 마가복음: '막', 누가복음: '눅', 요한복음: '요', 사도행전: '행',
  로마서: '롬', 고린도전서: '고전', 고린도후서: '고후', 갈라디아서: '갈', 에베소서: '엡',
  빌립보서: '빌', 골로새서: '골', 데살로니가전서: '살전', 데살로니가후서: '살후',
  디모데전서: '딤전', 디모데후서: '딤후', 디도서: '딛', 빌레몬서: '몬', 히브리서: '히',
  야고보서: '약', 베드로전서: '벧전', 베드로후서: '벧후', 요한일서: '요일', 요한이서: '요이',
  요한삼서: '요삼', 유다서: '유', 요한계시록: '계',
};

export function getBibleAbbreviation(bookName: string): string {
  return BIBLE_ABBREVIATIONS[bookName] || bookName.slice(0, 2);
}

// 365일 매일 자동 갱신되는 엄선된 은혜의 말씀 풀 (Daily Grace Verses Pool)
export const DAILY_GRACE_VERSES: BibleVerse[] = [
  {
    book: '야고보서',
    chapter: 1,
    verse: 22,
    text: '너희는 말씀을 행하는 자가 되고 듣기만 하여 자신을 속이는 자가 되지 말라',
    translation: '개역개정',
  },
  {
    book: '시편',
    chapter: 23,
    verse: 1,
    text: '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다',
    translation: '개역개정',
  },
  {
    book: '로마서',
    chapter: 8,
    verse: 28,
    text: '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라',
    translation: '개역개정',
  },
  {
    book: '이사야',
    chapter: 40,
    verse: 31,
    text: '오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요 달음박질하여도 곤비하지 아니하겠고 걸어가도 피곤하지 아니하리로다',
    translation: '개역개정',
  },
  {
    book: '빌립보서',
    chapter: 4,
    verse: 13,
    text: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라',
    translation: '개역개정',
  },
  {
    book: '잠언',
    chapter: 3,
    verse: 5,
    text: '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라 너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라',
    translation: '개역개정',
  },
  {
    book: '이사야',
    chapter: 41,
    verse: 10,
    text: '두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 참으로 너를 도와 주리라 참으로 나의 의로운 오른손으로 너를 붙들리라',
    translation: '개역개정',
  },
  {
    book: '빌립보서',
    chapter: 4,
    verse: 6,
    text: '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라 그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라',
    translation: '개역개정',
  },
  {
    book: '여호수아',
    chapter: 1,
    verse: 9,
    text: '내가 네게 명령한 것이 아니냐 강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라 하시니라',
    translation: '개역개정',
  },
  {
    book: '요한복음',
    chapter: 3,
    verse: 16,
    text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라',
    translation: '개역개정',
  },
  {
    book: '요한복음',
    chapter: 14,
    verse: 27,
    text: '평안을 너희에게 끼치노니 곧 나의 평안을 너희에게 주노라 내가 너희에게 주는 것은 세상이 주는 것과 같지 아니하니라 너희는 마음에 근심하지도 말고 두려워하지도 말라',
    translation: '개역개정',
  },
  {
    book: '요한복음',
    chapter: 15,
    verse: 5,
    text: '나는 포도나무요 너희는 가지라 그가 내 안에, 내가 그 안에 거하면 사람이 열매를 많이 맺나니 나를 떠나서는 너희가 아무 것도 할 수 없음이라',
    translation: '개역개정',
  },
  {
    book: '마태복음',
    chapter: 6,
    verse: 33,
    text: '그런즉 너희는 먼저 그의 나라와 그의 의를 구하라 그리하면 이 모든 것을 너희에게 더하시리라',
    translation: '개역개정',
  },
  {
    book: '마태복음',
    chapter: 11,
    verse: 28,
    text: '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라',
    translation: '개역개정',
  },
  {
    book: '마태복음',
    chapter: 28,
    verse: 20,
    text: '내가 너희에게 분부한 모든 것을 가르쳐 지키게 하라 볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라 하시니라',
    translation: '개역개정',
  },
  {
    book: '예레미야',
    chapter: 29,
    verse: 11,
    text: '여호와의 말씀이니라 너희를 향한 나의 생각을 내가 아나니 평안이요 재앙이 아니니라 너희에게 미래와 희망을 주는 것이니라',
    translation: '개역개정',
  },
  {
    book: '예레미야',
    chapter: 33,
    verse: 3,
    text: '너는 내게 부르짖으라 내가 네게 응답하겠고 네가 알지 못하는 크고 은밀한 일을 네게 보이리라',
    translation: '개역개정',
  },
  {
    book: '시편',
    chapter: 1,
    verse: 2,
    text: '오직 여호와의 율법을 즐거워하여 그의 율법을 주야로 묵상하는도다 그는 시냇가에 심은 나무가 철을 따라 열매를 맺으며 그 잎사귀가 마르지 아니함 같으니 그가 하는 모든 일이 다 형통하리로다',
    translation: '개역개정',
  },
  {
    book: '시편',
    chapter: 46,
    verse: 1,
    text: '하나님은 우리의 피난처시요 힘이시니 환난 중에 만날 큰 도움이시라',
    translation: '개역개정',
  },
  {
    book: '시편',
    chapter: 91,
    verse: 1,
    text: '지존자의 은밀한 곳에 거주하며 전능자의 그늘 아래에 사는 자여, 나는 여호와를 향하여 말하기를 그는 나의 피난처요 나의 요새요 내가 의뢰하는 하나님이라 하리니',
    translation: '개역개정',
  },
  {
    book: '시편',
    chapter: 119,
    verse: 105,
    text: '주의 말씀은 내 발에 등이요 내 길에 빛이니이다',
    translation: '개역개정',
  },
  {
    book: '시편',
    chapter: 121,
    verse: 1,
    text: '내가 산을 향하여 눈을 들리라 나의 도움이 어디서 올까 나의 도움은 천지를 지으신 여호와에게서로다',
    translation: '개역개정',
  },
  {
    book: '잠언',
    chapter: 16,
    verse: 3,
    text: '너의 행사를 여호와께 맡기라 그리하면 네가 경영하는 것이 이루어지리라',
    translation: '개역개정',
  },
  {
    book: '잠언',
    chapter: 16,
    verse: 9,
    text: '사람이 마음으로 자기의 길을 계획할지라도 그의 걸음을 인도하시는 이는 여호와시니라',
    translation: '개역개정',
  },
  {
    book: '갈라디아서',
    chapter: 2,
    verse: 20,
    text: '내가 그리스도와 함께 십자가에 못 박혔나니 그런즉 이제는 내가 사는 것이 아니요 오직 내 안에 그리스도께서 사시는 것이라',
    translation: '개역개정',
  },
  {
    book: '갈라디아서',
    chapter: 5,
    verse: 22,
    text: '오직 성령의 열매는 사랑과 희락과 화평과 오래 참음과 자비와 양선과 충성과 온유와 절제니 이같은 것을 금지할 법이 없느니라',
    translation: '개역개정',
  },
  {
    book: '에베소서',
    chapter: 2,
    verse: 8,
    text: '너희는 그 은혜에 의하여 믿음으로 말미암아 구원을 받았으니 이것은 너희에게서 난 것이 아니요 하나님의 선물이라',
    translation: '개역개정',
  },
  {
    book: '에베소서',
    chapter: 6,
    verse: 10,
    text: '끝으로 너희가 주 안에서와 그 힘의 능력으로 강건하여지고 마귀의 간계를 능히 대적하기 위하여 하나님의 전신 갑주를 입으라',
    translation: '개역개정',
  },
  {
    book: '데살로니가전서',
    chapter: 5,
    verse: 16,
    text: '항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라',
    translation: '개역개정',
  },
  {
    book: '디모데후서',
    chapter: 1,
    verse: 7,
    text: '하나님이 우리에게 주신 것은 두려워하는 마음이 아니요 오직 능력과 사랑과 절제하는 마음이니',
    translation: '개역개정',
  },
  {
    book: '디모데후서',
    chapter: 3,
    verse: 16,
    text: '모든 성경은 하나님의 감동으로 된 것으로 교훈과 책망과 바르게 함과 의로 교육하기에 유익하니 이는 하나님의 사람으로 온전하게 함이라',
    translation: '개역개정',
  },
  {
    book: '히브리서',
    chapter: 4,
    verse: 12,
    text: '하나님의 말씀은 살아 있고 활력이 있어 좌우에 날선 어떤 검보다도 예리하여 혼과 영과 및 관절과 골수를 찔러 쪼개기까지 하며 마음의 생각과 뜻을 판단하나니',
    translation: '개역개정',
  },
  {
    book: '히브리서',
    chapter: 11,
    verse: 1,
    text: '믿음은 바라는 것들의 실상이요 보이지 않는 것들의 증거니 선진들이 이로써 증거를 얻었느니라',
    translation: '개역개정',
  },
  {
    book: '히브리서',
    chapter: 12,
    verse: 2,
    text: '믿음의 주요 또 온전하게 하시는 이인 예수를 바라보자 그는 그 앞에 있는 기쁨을 위하여 십자가를 참으사 부끄러움을 개의치 아니하시더니 하나님 보좌 우편에 앉으셨느니라',
    translation: '개역개정',
  },
  {
    book: '베드로전서',
    chapter: 5,
    verse: 7,
    text: '너희 염려를 다 주께 맡기라 이는 그가 너희를 돌보심이라 근신하라 깨어라 너희 대적 마귀가 우는 사자 같이 두루 다니며 삼킬 자를 찾나니',
    translation: '개역개정',
  },
  {
    book: '요한일서',
    chapter: 4,
    verse: 18,
    text: '사랑 안에 두려움이 없고 온전한 사랑이 두려움을 내쫓나니 두려움에는 형벌이 있음이라 두려워하는 자는 사랑 안에서 온전히 이루지 못하였느니라',
    translation: '개역개정',
  },
  {
    book: '고린도전서',
    chapter: 10,
    verse: 13,
    text: '사람이 감당할 시험 밖에는 너희가 당한 것이 없나니 오직 하나님은 미쁘사 너희가 감당하지 못할 시험 당함을 허락하지 아니하시고 시험 당할 즈음에 또한 피할 길을 내사 너희로 능히 감당하게 하시느니라',
    translation: '개역개정',
  },
  {
    book: '고린도전서',
    chapter: 13,
    verse: 13,
    text: '그런즉 믿음, 소망, 사랑, 이 세 가지는 항상 있을 것인데 그 중의 제일은 사랑이라',
    translation: '개역개정',
  },
  {
    book: '고린도후서',
    chapter: 5,
    verse: 17,
    text: '그런즉 누구든지 그리스도 안에 있으면 새로운 피조물이라 이전 것은 지나갔으니 보라 새 것이 되었도다',
    translation: '개역개정',
  },
  {
    book: '고린도후서',
    chapter: 12,
    verse: 9,
    text: '나에게 이르시기를 내 은혜가 네게 족하도다 이는 내 능력이 약한 데서 온전하여짐이라 하신지라 그러므로 나의 여러 약한 것들에 대하여 자랑하리니 이는 그리스도의 능력이 내게 머물게 하려 함이라',
    translation: '개역개정',
  },
  {
    book: '시편',
    chapter: 37,
    verse: 5,
    text: '네 길을 여호와께 맡기라 그를 의지하면 그가 이루시고 네 의를 빛 같이 나타내시며 네 공의를 정오의 빛 같이 하시리로다',
    translation: '개역개정',
  },
  {
    book: '시편',
    chapter: 103,
    verse: 1,
    text: '내 영혼아 여호와를 송축하라 내 속에 있는 것들아 다 그의 거룩한 이름을 송축하라 내 영혼아 여호와를 송축하며 그의 모든 은택을 잊지 말지어다',
    translation: '개역개정',
  },
  {
    book: '스바냐',
    chapter: 3,
    verse: 17,
    text: '너의 하나님 여호와가 너의 가운데에 계시니 그는 구원을 베푸실 전능자이시라 그가 너로 말미암아 기쁨을 이기지 못하시며 너를 잠잠히 사랑하시며 너로 말미암아 즐거이 부르며 기뻐하시리라',
    translation: '개역개정',
  },
  {
    book: '하박국',
    chapter: 3,
    verse: 17,
    text: '비록 무화과나무가 무성하지 못하며 포도나무에 열매가 없으며 외양간에 소가 없을지라도 나는 여호와로 말미암아 즐거워하며 나의 구원의 하나님으로 말미암아 기뻐하리로다',
    translation: '개역개정',
  },
  {
    book: '요한계시록',
    chapter: 21,
    verse: 4,
    text: '모든 눈물을 그 눈에서 닦아 주시니 다시는 사망이 없고 애통하는 것이나 곡하는 것이나 아픈 것이 다시 있지 아니하리니 처음 것들이 다 지나갔음이러라',
    translation: '개역개정',
  },
  {
    book: '시편',
    chapter: 19,
    verse: 14,
    text: '나의 반석이시요 나의 구속자이신 여호와여 내 입의 말과 마음의 묵상이 주님 앞에 열납되기를 원하나이다',
    translation: '개역개정',
  },
  {
    book: '로마서',
    chapter: 12,
    verse: 2,
    text: '너희는 이 세대를 본받지 말고 오직 마음을 새롭게 함으로 변화를 받아 하나님의 선하시고 기뻐하시고 온전하신 뜻이 무엇인지 분별하도록 하라',
    translation: '개역개정',
  },
  {
    book: '골로새서',
    chapter: 3,
    verse: 15,
    text: '그리스도의 평강이 너희 마음을 주장하게 하라 너희는 평강을 위하여 한 몸으로 부르심을 받았나니 너희는 또한 감사하는 자가 되라',
    translation: '개역개정',
  },
  {
    book: '요한복음',
    chapter: 8,
    verse: 32,
    text: '진리를 알지니 진리가 너희를 자유롭게 하리라',
    translation: '개역개정',
  },
  {
    book: '시편',
    chapter: 139,
    verse: 14,
    text: '내가 주께 감사하옴은 나를 지으심이 심히 기묘하심이라 주께서 하시는 일이 기이함을 내 영혼이 잘 아나이다',
    translation: '개역개정',
  },
];

/**
 * Calculates Day of the Year (1 ~ 366) based on given date
 */
export function getDayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * 365일 날짜별 자동 갱신 말씀 반환 (매일 자정에 새로운 말씀으로 자동 수정/교체)
 */
export function getAutoDailyVerse(date: Date = new Date()): BibleVerse {
  const dayIndex = getDayOfYear(date);
  const verseIndex = (dayIndex - 1 + DAILY_GRACE_VERSES.length) % DAILY_GRACE_VERSES.length;
  return DAILY_GRACE_VERSES[verseIndex] || DAILY_GRACE_VERSES[0];
}

// Default Dynamic Today Verse (날짜 기반 자동 계산)
export const TODAY_VERSE: BibleVerse = getAutoDailyVerse();

export const POPULAR_VERSES: BibleVerse[] = DAILY_GRACE_VERSES.slice(0, 8);

// All 66 Books of the Bible (구약 39권 + 신약 27권)
export const BIBLE_BOOKS: BibleBook[] = [
  // --- Old Testament (구약 39권) ---
  { id: 'gen', name: '창세기', testament: 'OT', chaptersCount: 50 },
  { id: 'exo', name: '출애굽기', testament: 'OT', chaptersCount: 40 },
  { id: 'lev', name: '레위기', testament: 'OT', chaptersCount: 27 },
  { id: 'num', name: '민수기', testament: 'OT', chaptersCount: 36 },
  { id: 'deu', name: '신명기', testament: 'OT', chaptersCount: 34 },
  { id: 'jos', name: '여호수아', testament: 'OT', chaptersCount: 24 },
  { id: 'jdg', name: '사사기', testament: 'OT', chaptersCount: 21 },
  { id: 'rut', name: '룻기', testament: 'OT', chaptersCount: 4 },
  { id: '1sa', name: '사무엘상', testament: 'OT', chaptersCount: 31 },
  { id: '2sa', name: '사무엘하', testament: 'OT', chaptersCount: 24 },
  { id: '1ki', name: '열왕기상', testament: 'OT', chaptersCount: 22 },
  { id: '2ki', name: '열왕기하', testament: 'OT', chaptersCount: 25 },
  { id: '1ch', name: '역대상', testament: 'OT', chaptersCount: 29 },
  { id: '2ch', name: '역대하', testament: 'OT', chaptersCount: 36 },
  { id: 'ezr', name: '에스라', testament: 'OT', chaptersCount: 10 },
  { id: 'neh', name: '느헤미야', testament: 'OT', chaptersCount: 13 },
  { id: 'est', name: '에스더', testament: 'OT', chaptersCount: 10 },
  { id: 'job', name: '욥기', testament: 'OT', chaptersCount: 42 },
  { id: 'psa', name: '시편', testament: 'OT', chaptersCount: 150 },
  { id: 'pro', name: '잠언', testament: 'OT', chaptersCount: 31 },
  { id: 'ecc', name: '전도서', testament: 'OT', chaptersCount: 12 },
  { id: 'sng', name: '아가', testament: 'OT', chaptersCount: 8 },
  { id: 'isa', name: '이사야', testament: 'OT', chaptersCount: 66 },
  { id: 'jer', name: '예레미야', testament: 'OT', chaptersCount: 52 },
  { id: 'lam', name: '예레미야애가', testament: 'OT', chaptersCount: 5 },
  { id: 'ezk', name: '에스겔', testament: 'OT', chaptersCount: 48 },
  { id: 'dan', name: '다니엘', testament: 'OT', chaptersCount: 12 },
  { id: 'hos', name: '호세아', testament: 'OT', chaptersCount: 14 },
  { id: 'jol', name: '요엘', testament: 'OT', chaptersCount: 3 },
  { id: 'amo', name: '아모스', testament: 'OT', chaptersCount: 9 },
  { id: 'oba', name: '오바댜', testament: 'OT', chaptersCount: 1 },
  { id: 'jon', name: '요나', testament: 'OT', chaptersCount: 4 },
  { id: 'mic', name: '미가', testament: 'OT', chaptersCount: 7 },
  { id: 'nam', name: '나훔', testament: 'OT', chaptersCount: 3 },
  { id: 'hab', name: '하박국', testament: 'OT', chaptersCount: 3 },
  { id: 'zep', name: '스바냐', testament: 'OT', chaptersCount: 3 },
  { id: 'hag', name: '학개', testament: 'OT', chaptersCount: 2 },
  { id: 'zec', name: '스가랴', testament: 'OT', chaptersCount: 14 },
  { id: 'mal', name: '말라기', testament: 'OT', chaptersCount: 4 },

  // --- New Testament (신약 27권) ---
  { id: 'mat', name: '마태복음', testament: 'NT', chaptersCount: 28 },
  { id: 'mrk', name: '마가복음', testament: 'NT', chaptersCount: 16 },
  { id: 'luk', name: '누가복음', testament: 'NT', chaptersCount: 24 },
  { id: 'jhn', name: '요한복음', testament: 'NT', chaptersCount: 21 },
  { id: 'act', name: '사도행전', testament: 'NT', chaptersCount: 28 },
  { id: 'rom', name: '로마서', testament: 'NT', chaptersCount: 16 },
  { id: '1co', name: '고린도전서', testament: 'NT', chaptersCount: 16 },
  { id: '2co', name: '고린도후서', testament: 'NT', chaptersCount: 13 },
  { id: 'gal', name: '갈라디아서', testament: 'NT', chaptersCount: 6 },
  { id: 'eph', name: '에베소서', testament: 'NT', chaptersCount: 6 },
  { id: 'php', name: '빌립보서', testament: 'NT', chaptersCount: 4 },
  { id: 'col', name: '골로새서', testament: 'NT', chaptersCount: 4 },
  { id: '1th', name: '데살로니가전서', testament: 'NT', chaptersCount: 5 },
  { id: '2th', name: '데살로니가후서', testament: 'NT', chaptersCount: 3 },
  { id: '1ti', name: '디모데전서', testament: 'NT', chaptersCount: 6 },
  { id: '2ti', name: '디모데후서', testament: 'NT', chaptersCount: 4 },
  { id: 'tit', name: '디도서', testament: 'NT', chaptersCount: 3 },
  { id: 'phm', name: '빌레몬서', testament: 'NT', chaptersCount: 1 },
  { id: 'heb', name: '히브리서', testament: 'NT', chaptersCount: 13 },
  { id: 'jas', name: '야고보서', testament: 'NT', chaptersCount: 5 },
  { id: '1pe', name: '베드로전서', testament: 'NT', chaptersCount: 5 },
  { id: '2pe', name: '베드로후서', testament: 'NT', chaptersCount: 3 },
  { id: '1jn', name: '요한일서', testament: 'NT', chaptersCount: 5 },
  { id: '2jn', name: '요한이서', testament: 'NT', chaptersCount: 1 },
  { id: '3jn', name: '요한삼서', testament: 'NT', chaptersCount: 1 },
  { id: 'jud', name: '유다서', testament: 'NT', chaptersCount: 1 },
  { id: 'rev', name: '요한계시록', testament: 'NT', chaptersCount: 22 },
];

export const SAMPLE_VERSES_CHAPTER: Record<string, { verse: number; text: string }[]> = {
  '창세기-1': [
    { verse: 1, text: '태초에 하나님이 천지를 창조하시니라' },
    { verse: 2, text: '땅이 혼돈하고 공허하며 흑암이 깊음 위에 있고 하나님의 영은 수면 위에 운행하시니라' },
    { verse: 3, text: '하나님이 이르시되 빛이 있으라 하시니 빛이 있었고' },
    { verse: 4, text: '빛이 하나님이 보시기에 좋았더라 하나님이 빛과 어둠을 나누사' },
    { verse: 5, text: '하나님이 빛을 낮이라 부르시고 어둠을 밤이라 부르시니라 저녁이 되고 아침이 되니 이는 첫째 날이니라' },
    { verse: 6, text: '하나님이 이르시되 물 가운데에 궁창이 있어 물과 물로 나뉘라 하시고' },
    { verse: 7, text: '하나님이 궁창을 만드사 궁창 아래의 물과 궁창 위의 물로 나뉘게 하시니 그대로 되니라' },
    { verse: 8, text: '하나님이 궁창을 하늘이라 부르시니라 저녁이 되고 아침이 되니 이는 둘째 날이니라' },
    { verse: 9, text: '하나님이 이르시되 천하의 물이 한 곳으로 모이고 뭍이 드러나라 하시니 그대로 되니라' },
    { verse: 10, text: '하나님이 뭍을 땅이라 부르시고 모인 물을 바다라 부르시니라 하나님이 보시기에 좋았더라' },
    { verse: 11, text: '하나님이 이르시되 땅은 풀과 씨 맺는 채소와 각기 종류대로 씨 가진 열매 맺는 나무를 내라 하시니 그대로 되어' },
    { verse: 12, text: '땅이 풀과 각기 종류대로 씨 맺는 채소와 각기 종류대로 씨 가진 열매 맺는 나무를 내니 하나님이 보시기에 좋았더라' },
    { verse: 13, text: '저녁이 되고 아침이 되니 이는 셋째 날이니라' },
    { verse: 14, text: '하나님이 이르시되 하늘의 궁창에 광명체들이 있어 낮과 밤을 나뉘게 하고 그것들로 징조와 계절과 날과 해를 이루게 하라' },
    { verse: 15, text: '또 광명체들이 하늘의 궁창에 있어 땅을 비추라 하시니 그대로 되니라' },
    { verse: 16, text: '하나님이 두 큰 광명체를 만드사 큰 광명체로 낮을 주관하게 하시고 작은 광명체로 밤을 주관하게 하시며 또 별들을 만드시고' },
    { verse: 17, text: '하나님이 그것들을 하늘의 궁창에 두어 땅을 비추게 하시며' },
    { verse: 18, text: '낮과 밤을 주관하게 하시고 빛과 어둠을 나뉘게 하시니 하나님이 보시기에 좋았더라' },
    { verse: 19, text: '저녁이 되고 아침이 되니 이는 넷째 날이니라' },
    { verse: 20, text: '하나님이 이르시되 물들은 생물을 번성하게 하라 땅 위 하늘의 궁창에는 새가 날으라 하시고' },
    { verse: 21, text: '하나님이 큰 바다 짐승들과 물에서 번성하여 움직이는 모든 생물을 그 종류대로, 날개 있는 모든 새를 그 종류대로 창조하시니 하나님이 보시기에 좋았더라' },
    { verse: 22, text: '하나님이 그들에게 복을 주시며 이르시되 생육하고 번성하여 여러 바닷물에 충만하라 새들도 땅에 번성하라 하시니라' },
    { verse: 23, text: '저녁이 되고 아침이 되니 이는 다섯째 날이니라' },
    { verse: 24, text: '하나님이 이르시되 땅은 생물을 그 종류대로 내되 가축과 기는 것과 땅의 짐승을 종류대로 내라 하시니 그대로 되니라' },
    { verse: 25, text: '하나님이 땅의 짐승을 그 종류대로, 가축을 그 종류대로, 땅에 기는 모든 것을 그 종류대로 만드시니 하나님이 보시기에 좋았더라' },
    { verse: 26, text: '하나님이 이르시되 우리의 형상을 따라 우리의 모양대로 우리가 사람을 만들고 그들로 바다의 물고기와 하늘의 새와 가축과 온 땅과 땅에 기는 모든 것을 다스리게 하자 하시고' },
    { verse: 27, text: '하나님이 자기 형상 곧 하나님의 형상대로 사람을 창조하시되 남자와 여자를 창조하시고' },
    { verse: 28, text: '하나님이 그들에게 복을 주시며 하나님이 그들에게 이르시되 생육하고 번성하여 땅에 충만하라, 땅을 정복하라, 바다의 물고기와 하늘의 새와 땅에 움직이는 모든 생물을 다스리라 하시니라' },
    { verse: 29, text: '하나님이 이르시되 내가 온 지면의 씨 맺는 모든 채소와 씨 가진 열매 맺는 모든 나무를 너희에게 주노니 너희의 먹을 거리가 되리라' },
    { verse: 30, text: '또 땅의 모든 짐승과 하늘의 모든 새와 생명이 있어 땅에 기는 모든 것에게는 내가 모든 푸른 풀을 먹을 거리로 주노라 하시니 그대로 되니라' },
    { verse: 31, text: '하나님이 지으신 그 모든 것을 보시니 보시기에 심히 좋았더라 저녁이 되고 아침이 되니 이는 여섯째 날이니라' },
  ],
  '창세기-2': [
    { verse: 1, text: '천지와 만물이 다 이루어지니라' },
    { verse: 2, text: '하나님이 그가 하시던 일을 일곱째 날에 마치시니 그가 하시던 모든 일을 그치고 일곱째 날에 안식하시니라' },
    { verse: 3, text: '하나님이 그 일곱째 날을 복되게 하사 거룩하게 하셨으니 이는 하나님이 그 창조하시며 만드시던 모든 일을 마치시고 그 날에 안식하셨음이니라' },
    { verse: 4, text: '이것이 천지가 창조될 때에 하늘과 땅의 내력이니 여호와 하나님이 땅과 하늘을 만드시던 날에' },
    { verse: 5, text: '여호와 하나님이 땅에 비를 내리지 아니하셨고 땅을 갈 사람도 없었으므로 들에는 초목이 아직 없었고 밭에는 채소가 나지 아니하였으며' },
    { verse: 6, text: '안개만 땅에서 올라와 온 지면을 적셨더라' },
    { verse: 7, text: '여호와 하나님이 땅의 흙으로 사람을 지으시고 생기를 그 코에 불어넣으시니 사람이 생령이 되니라' },
    { verse: 8, text: '여호와 하나님이 동방의 에덴에 동산을 창설하시고 그 지으신 사람을 거기 두시니라' },
    { verse: 9, text: '여호와 하나님이 그 땅에서 보기에 아름답고 먹기에 좋은 나무가 나게 하시니 동산 가운데에는 생명나무와 선악을 알게 하는 나무도 있더라' },
    { verse: 10, text: '강이 에덴에서 흘러 나와 동산을 적시고 거기서부터 갈라져 네 근원이 되었으니' },
    { verse: 11, text: '첫째의 이름은 비손이라 금이 있는 하윌라 온 땅을 둘렀으며' },
    { verse: 12, text: '그 땅의 금은 순금이요 그 곳에는 베델리엄과 호마노도 있으며' },
    { verse: 13, text: '둘째 강의 이름은 기혼이라 구스 온 땅을 둘렀고' },
    { verse: 14, text: '셋째 강의 이름은 힛데겔이라 앗수르 동쪽으로 흘렀으며 넷째 강은 유브라데더라' },
    { verse: 15, text: '여호와 하나님이 그 사람을 이끌어 에덴 동산에 두어 그것을 경작하며 지키게 하시고' },
    { verse: 16, text: '여호와 하나님이 그 사람에게 명하여 이르시되 동산 각종 나무의 열매는 네가 임의로 먹되' },
    { verse: 17, text: '선악을 알게 하는 나무의 열매는 먹지 말라 네가 먹는 날에는 반드시 죽으리라 하시니라' },
    { verse: 18, text: '여호와 하나님이 이르시되 사람이 혼자 사는 것이 좋지 아니하니 내가 그를 위하여 돕는 배필을 지으리라 하시니라' },
    { verse: 19, text: '여호와 하나님이 흙으로 각종 들짐승과 공중의 각종 새를 지으시고 아담이 무엇이라고 부르나 보시려고 그것들을 그에게로 이끌어 가시니 아담이 각 생물을 부르는 바가 곧 그 이름이 되었더라' },
    { verse: 20, text: '아담이 모든 가축과 공중의 새와 들의 모든 짐승에게 이름을 주니라 아담이 돕는 배필이 없으므로' },
    { verse: 21, text: '여호와 하나님이 아담을 깊이 잠들게 하시니 잠들매 그가 그 갈빗대 하나를 취하고 살로 대신 채우시고' },
    { verse: 22, text: '여호와 하나님이 아담에게서 취하신 그 갈빗대로 여자를 만드시고 그를 아담에게로 이끌어 오시니' },
    { verse: 23, text: '아담이 이르되 이는 내 뼈 중의 뼈요 살 중의 살이라 이것을 남자에게서 취하였은즉 여자라 부르리라 하니라' },
    { verse: 24, text: '이러므로 남자가 부모를 떠나 그의 아내와 합하여 둘이 한 몸을 이룰지로다' },
    { verse: 25, text: '아담과 그의 아내 두 사람이 벌거벗었으나 부끄러워하지 아니하니라' },
  ],
  '야고보서-1': [
    { verse: 1, text: '하나님과 주 예수 그리스도의 종 야고보는 흩어져 있는 열두 지파에게 문안하노라' },
    { verse: 2, text: '내 형제들아 너희가 여러 가지 시험을 당하거든 온전히 기쁘게 여기라' },
    { verse: 3, text: '이는 너희 믿음의 시련이 인내를 만들어 내는 줄 너희가 앎이라' },
    { verse: 4, text: '인내를 온전히 이루라 이는 너희로 온전하고 구비하여 조금도 부족함이 없게 하려 함이라' },
    { verse: 5, text: '너희 중에 누구든지 지혜가 부족하거든 모든 사람에게 후히 주시고 꾸짖지 아니하시는 하나님께 구하라 그리하면 주시리라' },
    { verse: 12, text: '시험을 참는 자는 복이 있나니 이는 시련을 견디어 낸 자가 주께서 자기를 사랑하는 자들에게 약속하신 생명의 면류관을 얻을 것이기 때문이라' },
    { verse: 19, text: '내 사랑하는 형제들아 너희가 알지니 사람마다 듣기는 속히 하고 말하기는 더디 하며 성내기도 더디 하라' },
    { verse: 22, text: '너희는 말씀을 행하는 자가 되고 듣기만 하여 자신을 속이는 자가 되지 말라' },
    { verse: 27, text: '하나님 아버지 앞에서 정결하고 더러움이 없는 경건은 곧 고아와 과부를 그 환난중에 돌보고 또 자기를 지켜 세속에 물들지 아니하는 그것이니라' },
  ],
  '시편-23': [
    { verse: 1, text: '여호와는 나의 목자시니 내게 부족함이 없으리로다' },
    { verse: 2, text: '그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다' },
    { verse: 3, text: '내 영혼을 소생시키시고 자기 이름을 위하여 의의 길로 인도하시는도다' },
    { verse: 4, text: '내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라 주의 지팡이와 막대기가 나를 안위하시나이다' },
    { verse: 5, text: '주께서 내 원수의 목전에서 내게 상을 차려 주시고 기름을 내 머리에 부으셨으니 내 잔이 넘치나이다' },
    { verse: 6, text: '내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다' },
  ],
  '출애굽기-18': [
    { verse: 1, text: '모세의 장인이며 미디안 제사장인 이드로가 하나님이 모세에게와 자기 백성 이스라엘에게 하신 일 곧 여호와께서 이스라엘을 애굽에서 인도하여 내신 모든 일을 들으니라' },
    { verse: 2, text: '모세의 장인 이드로가 모세가 돌려보냈던 그의 아내 십보라와' },
    { verse: 3, text: '그의 두 아들을 데리고 왔으니 그 하나의 이름은 게르솜이라 이는 모세가 이르기를 내가 이방에서 나그네가 되었다 함이요' },
    { verse: 4, text: '하나의 이름은 엘리에셀이라 이는 내 아버지의 하나님이 나를 도우사 바로의 칼에서 구원하셨다 함이더라' },
    { verse: 5, text: '모세의 장인 이드로가 모세의 아들들과 그의 아내와 더불어 광야에 들어와 모세에게 이르니 곧 모세가 하나님의 산에 진 친 곳이라' },
    { verse: 6, text: '그가 모세에게 말을 전하되 네 장인 나 이드로가 네 아내와 그와 함께 한 그의 두 아들과 더불어 네게 왔노라' },
    { verse: 7, text: '모세가 나가서 그의 장인을 맞아 절하고 그에게 입 맞추고 그들이 서로 문안하고 함께 장막에 들어가서' },
    { verse: 8, text: '모세가 여호와께서 이스라엘을 위하여 바로와 애굽 사람에게 행하신 모든 일과 길에서 그들이 당한 모든 고난과 여호와께서 그들을 구원하신 모든 일을 다 그 장인에게 말하매' },
    { verse: 9, text: '이드로가 여호와께서 이스라엘에게 큰 은혜를 베푸사 애굽 사람의 손에서 구원하심을 기뻐하여' },
    { verse: 10, text: '이드로가 이르되 여호와를 찬송하리로다 너희를 애굽 사람의 손에서와 바로의 손에서 건져내시고 백성을 애굽 사람의 손 아래에서 건지셨도다' },
    { verse: 11, text: '이제 내가 알았도다 여호와는 모든 신보다 크시므로 이스라엘에게 교만하게 행하는 그들을 이기셨도다 하고' },
    { verse: 12, text: '모세의 장인 이드로가 번제물과 희생제물들을 하나님께 가져오매 아론과 이스라엘 모든 장로가 와서 모세의 장인과 함께 하나님 앞에서 떡을 먹으니라' },
  ],
  '로마서-8': [
    { verse: 1, text: '그러므로 이제 그리스도 예수 안에 있는 자에게는 결코 정죄함이 없나니' },
    { verse: 2, text: '이는 그리스도 예수 안에 있는 생명의 성령의 법이 죄와 사망의 법에서 너를 해방하였음이라' },
    { verse: 28, text: '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라' },
    { verse: 31, text: '그런즉 이 일에 대하여 우리가 무슨 말 하리요 만일 하나님이 우리를 위하시면 누가 우리를 대적하리요' },
    { verse: 38, text: '내가 확신하노니 사망이나 생명이나 천사들이나 권세자들이나 현재 일이나 장래 일이나 능력이나' },
    { verse: 39, text: '높음이나 깊음이나 다른 어떤 피조물이라도 우리를 우리 주 그리스도 예수 안에 있는 하나님의 사랑에서 끊을 수 없으리라' },
  ],
};

// Known verse counts for specific chapters
export const KNOWN_VERSE_COUNTS: Record<string, number> = {
  '창세기-1': 31,
  '창세기-2': 25,
  '창세기-3': 24,
  '창세기-4': 26,
  '창세기-5': 32,
  '출애굽기-1': 22,
  '출애굽기-2': 25,
  '출애굽기-20': 26,
  '시편-1': 6,
  '시편-23': 6,
  '시편-119': 176,
  '잠언-1': 33,
  '이사야-40': 31,
  '마태복음-1': 25,
  '마태복음-5': 48,
  '요한복음-1': 51,
  '요한복음-3': 36,
  '로마서-8': 39,
  '야고보서-1': 27,
};

export const getChapterVerseCount = (book: string, chapter: number): number => {
  const key = `${book}-${chapter}`;
  if (KNOWN_VERSE_COUNTS[key]) {
    return KNOWN_VERSE_COUNTS[key];
  }
  if (SAMPLE_VERSES_CHAPTER[key]) {
    return SAMPLE_VERSES_CHAPTER[key].length;
  }
  // Standard reasonable fallback between 20 and 35
  const base = ((book.charCodeAt(0) + chapter * 7) % 15) + 20;
  return base;
};

export const INITIAL_READING_PLANS: ReadingDayPlan[] = [
  { day: 254, date: '9월 11일', portion: '약 1~2장', verseRange: '야고보서 1장 - 2장', completed: true, memo: '실천하는 믿음의 중요성' },
  { day: 255, date: '9월 12일', portion: '약 3~4장', verseRange: '야고보서 3장 - 4장', completed: true, memo: '혀를 다스리고 온유한 지혜를 구함' },
  { day: 256, date: '9월 13일 (오늘)', portion: '약 5장, 벧전 1장', verseRange: '야고보서 5장 - 베드로전서 1장', completed: false, memo: '고난 중의 인내와 기도' },
  { day: 257, date: '9월 14일', portion: '벧전 2~3장', verseRange: '베드로전서 2장 - 3장', completed: false },
  { day: 258, date: '9월 15일', portion: '벧전 4~5장', verseRange: '베드로전서 4장 - 5장', completed: false },
  { day: 259, date: '9월 16일', portion: '벧후 1~3장', verseRange: '베드로후서 1장 - 3장', completed: false },
  { day: 260, date: '9월 17일', portion: '요일 1~3장', verseRange: '요한일서 1장 - 3장', completed: false },
];

export const INITIAL_RECORDINGS: UserRecording[] = [
  {
    id: 'rec-1',
    title: '시편 23편 전체 낭독',
    verseRef: '시편 23:1-6',
    duration: '01:24',
    date: '2026.09.12',
  },
  {
    id: 'rec-2',
    title: '야고보서 1장 말씀 묵상 낭독',
    verseRef: '야고보서 1:19-27',
    duration: '02:05',
    date: '2026.09.10',
  },
  {
    id: 'rec-3',
    title: '로마서 8장 생명의 성령의 법',
    verseRef: '로마서 8:28-39',
    duration: '01:48',
    date: '2026.09.08',
  },
];

// ==========================================
// 성경 읽기 완료된 절 및 완독된 장 (Completed Verses & Chapters) 관리
// ==========================================
export const READ_VERSES_STORAGE_KEY = 'superbible_completed_verses_v2';
export const COMPLETED_CHAPTERS_STORAGE_KEY = 'superbible_completed_chapters_v2';
export const CURRENT_READING_BOOK_KEY = 'superbible_current_reading_book';
export const CURRENT_READING_CHAPTER_KEY = 'superbible_current_reading_chapter';
export const IN_PROGRESS_CHAPTERS_KEY = 'superbible_reading_in_progress_v1';
export const TODAY_READ_STORAGE_KEY = 'superbible_today_read_data_v2';

// 오늘 날짜 문자열 반환 (한국 시간 기준 YYYY-MM-DD)
export function getTodayDateString(): string {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// 오늘 읽은/낭독한 장 목록 가져오기 (매일 자정에 0으로 자동 갱신)
export function getTodayReadChapters(): Set<string> {
  try {
    const raw = localStorage.getItem(TODAY_READ_STORAGE_KEY);
    const today = getTodayDateString();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.date === today && Array.isArray(parsed.chapters)) {
        return new Set<string>(parsed.chapters);
      }
    }
  } catch (e) {
    console.error('Failed to get today read chapters:', e);
  }
  return new Set<string>();
}

export function getTodayReadCount(): number {
  return getTodayReadChapters().size;
}

// 오늘 낭독 또는 완독한 장 기록
export function addTodayReadChapter(book: string, chapter: number): number {
  try {
    const today = getTodayDateString();
    const set = getTodayReadChapters();
    set.add(`${book}-${chapter}`);
    const data = {
      date: today,
      chapters: Array.from(set),
      count: set.size,
    };
    localStorage.setItem(TODAY_READ_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent('superbible_today_read_changed', {
        detail: { count: set.size, chapters: data.chapters },
      })
    );
    return set.size;
  } catch (e) {
    console.error('Failed to add today read chapter:', e);
    return 0;
  }
}

// 신약 통독(27권, 총 260장) 실시간 실제 진행률 계산
export function getNewTestamentStats(): { completedCount: number; totalCount: number; percent: number } {
  const currentVerses = getCompletedVerses();
  const currentChapters = getCompletedChapters();
  const ntBooks = BIBLE_BOOKS.filter((b) => b.testament === 'NT');
  const totalCount = 260; // 27권 신약 전체 260장
  let completedCount = 0;

  for (const b of ntBooks) {
    for (let ch = 1; ch <= b.chaptersCount; ch++) {
      if (currentChapters.has(`${b.name}-${ch}`) || isChapterFullyRead(b.name, ch, currentVerses)) {
        completedCount++;
      }
    }
  }

  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  return { completedCount, totalCount, percent };
}

// 구약 통독(39권, 총 929장) 실시간 실제 진행률 계산
export function getOldTestamentStats(): { completedCount: number; totalCount: number; percent: number } {
  const currentVerses = getCompletedVerses();
  const currentChapters = getCompletedChapters();
  const otBooks = BIBLE_BOOKS.filter((b) => b.testament === 'OT');
  const totalCount = 929; // 39권 구약 전체 929장
  let completedCount = 0;

  for (const b of otBooks) {
    for (let ch = 1; ch <= b.chaptersCount; ch++) {
      if (currentChapters.has(`${b.name}-${ch}`) || isChapterFullyRead(b.name, ch, currentVerses)) {
        completedCount++;
      }
    }
  }

  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  return { completedCount, totalCount, percent };
}

// 현재 읽는 중인 위치 (책, 장) - 기본값: 출애굽기 24장
export function getCurrentReadingLocation(): { book: string; chapter: number } {
  try {
    const savedBook = localStorage.getItem(CURRENT_READING_BOOK_KEY);
    const savedChapter = localStorage.getItem(CURRENT_READING_CHAPTER_KEY);
    if (savedBook && savedChapter) {
      const ch = parseInt(savedChapter, 10);
      if (!isNaN(ch) && ch >= 1) {
        return { book: savedBook, chapter: ch };
      }
    }
  } catch (e) {
    console.error('Failed to get reading location:', e);
  }
  return { book: '출애굽기', chapter: 24 };
}

export function saveCurrentReadingLocation(book: string, chapter: number): void {
  try {
    localStorage.setItem(CURRENT_READING_BOOK_KEY, book);
    localStorage.setItem(CURRENT_READING_CHAPTER_KEY, String(chapter));
    window.dispatchEvent(
      new CustomEvent('superbible_reading_location_changed', {
        detail: { book, chapter },
      })
    );
  } catch (e) {
    console.error('Failed to save reading location:', e);
  }
}

// 읽는 중으로 지정된 장 목록 관리
export function getInProgressChapters(): Set<string> {
  try {
    const raw = localStorage.getItem(IN_PROGRESS_CHAPTERS_KEY);
    if (raw) {
      return new Set<string>(JSON.parse(raw));
    }
  } catch (e) {
    console.error('Failed to load in-progress chapters:', e);
  }
  // 기본값으로 출애굽기 24장 포함
  return new Set<string>(['출애굽기-24']);
}

// 1회성 자동 진도 동기화 (출애굽기 1~23장 완독 처리 및 24장 읽는 중 설정)
try {
  const SYNC_KEY_V24 = 'superbible_sync_exo_23done_24reading_v2';
  if (typeof window !== 'undefined' && !localStorage.getItem(SYNC_KEY_V24)) {
    const rawCh = localStorage.getItem(COMPLETED_CHAPTERS_STORAGE_KEY);
    const rawVs = localStorage.getItem(READ_VERSES_STORAGE_KEY);
    const chapters = rawCh ? new Set<string>(JSON.parse(rawCh)) : new Set<string>();
    const verses = rawVs ? new Set<string>(JSON.parse(rawVs)) : new Set<string>();

    // 1~23장 전체 완독 동기화 (18장 및 23장 완독 반영)
    for (let ch = 1; ch <= 23; ch++) {
      chapters.add(`출애굽기-${ch}`);
      const total = getChapterVerseCount('출애굽기', ch);
      for (let v = 1; v <= total; v++) {
        verses.add(`출애굽기-${ch}-${v}`);
      }
    }

    // 24장을 읽는 중으로 지정
    const inProgress = new Set<string>(['출애굽기-24']);

    localStorage.setItem(COMPLETED_CHAPTERS_STORAGE_KEY, JSON.stringify(Array.from(chapters)));
    localStorage.setItem(READ_VERSES_STORAGE_KEY, JSON.stringify(Array.from(verses)));
    localStorage.setItem(IN_PROGRESS_CHAPTERS_KEY, JSON.stringify(Array.from(inProgress)));
    localStorage.setItem(CURRENT_READING_BOOK_KEY, '출애굽기');
    localStorage.setItem(CURRENT_READING_CHAPTER_KEY, '24');
    localStorage.setItem(SYNC_KEY_V24, 'true');
  }
} catch (e) {
  console.error('Initial reading sync failed:', e);
}

export function setChapterInProgress(book: string, chapter: number, inProgress: boolean = true): void {
  try {
    const set = getInProgressChapters();
    const key = `${book}-${chapter}`;
    if (inProgress) {
      set.add(key);
    } else {
      set.delete(key);
    }
    localStorage.setItem(IN_PROGRESS_CHAPTERS_KEY, JSON.stringify(Array.from(set)));
    window.dispatchEvent(
      new CustomEvent('superbible_reading_location_changed', {
        detail: { book, chapter, inProgress },
      })
    );
  } catch (e) {
    console.error('Failed to save in-progress chapters:', e);
  }
}

export function getCompletedVerses(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_VERSES_STORAGE_KEY);
    if (raw) {
      return new Set<string>(JSON.parse(raw));
    }
  } catch (e) {
    console.error('Failed to load completed verses:', e);
  }
  // 초기화 상태: 완료된 절 없음 (0개)
  return new Set<string>();
}

export function saveCompletedVerses(versesSet: Set<string>): void {
  try {
    localStorage.setItem(READ_VERSES_STORAGE_KEY, JSON.stringify(Array.from(versesSet)));
  } catch (e) {
    console.error('Failed to save completed verses:', e);
  }
}

export function getCompletedChapters(): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETED_CHAPTERS_STORAGE_KEY);
    if (raw) {
      return new Set<string>(JSON.parse(raw));
    }
  } catch (e) {
    console.error('Failed to load completed chapters:', e);
  }
  // 초기화 상태: 완독된 장 없음 (0개)
  return new Set<string>();
}

export function saveCompletedChapters(chaptersSet: Set<string>): void {
  try {
    localStorage.setItem(COMPLETED_CHAPTERS_STORAGE_KEY, JSON.stringify(Array.from(chaptersSet)));
  } catch (e) {
    console.error('Failed to save completed chapters:', e);
  }
}

export function isChapterFullyRead(book: string, chapter: number, versesSet?: Set<string>): boolean {
  const currentVerses = versesSet || getCompletedVerses();
  const currentChapters = getCompletedChapters();
  if (currentChapters.has(`${book}-${chapter}`)) {
    return true;
  }
  const total = getChapterVerseCount(book, chapter);
  if (total <= 0) return false;
  let count = 0;
  for (let v = 1; v <= total; v++) {
    if (currentVerses.has(`${book}-${chapter}-${v}`)) {
      count++;
    }
  }
  return count >= total;
}

export function toggleVerseCompleted(book: string, chapter: number, verse: number): boolean {
  const currentVerses = getCompletedVerses();
  const currentChapters = getCompletedChapters();
  const verseKey = `${book}-${chapter}-${verse}`;
  const chapterKey = `${book}-${chapter}`;

  let isDone = false;
  if (currentVerses.has(verseKey)) {
    currentVerses.delete(verseKey);
    isDone = false;
    currentChapters.delete(chapterKey);
  } else {
    currentVerses.add(verseKey);
    isDone = true;
    const total = getChapterVerseCount(book, chapter);
    let allDone = true;
    for (let v = 1; v <= total; v++) {
      if (!currentVerses.has(`${book}-${chapter}-${v}`)) {
        allDone = false;
        break;
      }
    }
    if (allDone) {
      currentChapters.add(chapterKey);
    }
  }

  saveCompletedVerses(currentVerses);
  saveCompletedChapters(currentChapters);

  window.dispatchEvent(
    new CustomEvent('superbible_verse_read_changed', {
      detail: { book, chapter, verse, isDone },
    })
  );
  return isDone;
}

export function toggleChapterVersesCompleted(book: string, chapter: number, totalVerses: number): boolean {
  const currentVerses = getCompletedVerses();
  const currentChapters = getCompletedChapters();
  const chapterKey = `${book}-${chapter}`;

  // Check if currently all verses in this chapter are read
  let allRead = true;
  for (let v = 1; v <= totalVerses; v++) {
    if (!currentVerses.has(`${book}-${chapter}-${v}`)) {
      allRead = false;
      break;
    }
  }
  if (currentChapters.has(chapterKey)) {
    allRead = true;
  }

  let nextDone = false;
  if (allRead) {
    // 이미 완독됨 -> 전체 해제
    for (let v = 1; v <= totalVerses; v++) {
      currentVerses.delete(`${book}-${chapter}-${v}`);
    }
    currentChapters.delete(chapterKey);
    nextDone = false;
  } else {
    // 완독되지 않음 -> 전체 완독 체크
    for (let v = 1; v <= totalVerses; v++) {
      currentVerses.add(`${book}-${chapter}-${v}`);
    }
    currentChapters.add(chapterKey);
    nextDone = true;
    try {
      const inProg = getInProgressChapters();
      if (inProg.has(chapterKey)) {
        inProg.delete(chapterKey);
        localStorage.setItem(IN_PROGRESS_CHAPTERS_KEY, JSON.stringify(Array.from(inProg)));
      }
    } catch (e) {}
    try {
      addTodayReadChapter(book, chapter);
    } catch (e) {}
  }

  saveCompletedVerses(currentVerses);
  saveCompletedChapters(currentChapters);

  window.dispatchEvent(
    new CustomEvent('superbible_verse_read_changed', {
      detail: { book, chapter, isDone: nextDone, isAll: true },
    })
  );

  return nextDone;
}

export function toggleChapterDirect(book: string, chapter: number): boolean {
  const currentVerses = getCompletedVerses();
  const currentChapters = getCompletedChapters();
  const chapterKey = `${book}-${chapter}`;
  const total = getChapterVerseCount(book, chapter);

  let nextDone = false;
  if (currentChapters.has(chapterKey)) {
    currentChapters.delete(chapterKey);
    for (let v = 1; v <= total; v++) {
      currentVerses.delete(`${book}-${chapter}-${v}`);
    }
    nextDone = false;
  } else {
    currentChapters.add(chapterKey);
    for (let v = 1; v <= total; v++) {
      currentVerses.add(`${book}-${chapter}-${v}`);
    }
    nextDone = true;
    try {
      const inProg = getInProgressChapters();
      if (inProg.has(chapterKey)) {
        inProg.delete(chapterKey);
        localStorage.setItem(IN_PROGRESS_CHAPTERS_KEY, JSON.stringify(Array.from(inProg)));
      }
    } catch (e) {}
    try {
      addTodayReadChapter(book, chapter);
    } catch (e) {}
  }

  saveCompletedVerses(currentVerses);
  saveCompletedChapters(currentChapters);

  window.dispatchEvent(
    new CustomEvent('superbible_verse_read_changed', {
      detail: { book, chapter, isDone: nextDone, isAll: true },
    })
  );

  return nextDone;
}

export function markChapterVersesCompleted(book: string, chapter: number, totalVerses: number): void {
  toggleChapterVersesCompleted(book, chapter, totalVerses);
}

/**
 * 1-N장 등 여러 장을 한 번에 일괄 완독/해제 처리
 * 읽기표(내 전체 읽기표, 통독계획현황 등)에 즉시 반영됨
 */
export function markChapterRangeCompleted(
  book: string,
  startChapter: number,
  endChapter: number,
  isCompleted: boolean = true
): { completedCount: number; chapters: number[] } {
  const currentVerses = getCompletedVerses();
  const currentChapters = getCompletedChapters();
  const start = Math.max(1, Math.min(startChapter, endChapter));
  const end = Math.max(startChapter, endChapter);
  const processedChapters: number[] = [];

  for (let ch = start; ch <= end; ch++) {
    const chapterKey = `${book}-${ch}`;
    const total = getChapterVerseCount(book, ch);
    processedChapters.push(ch);

    if (isCompleted) {
      currentChapters.add(chapterKey);
      for (let v = 1; v <= total; v++) {
        currentVerses.add(`${book}-${ch}-${v}`);
      }
      try {
        addTodayReadChapter(book, ch);
      } catch (e) {}
    } else {
      currentChapters.delete(chapterKey);
      for (let v = 1; v <= total; v++) {
        currentVerses.delete(`${book}-${ch}-${v}`);
      }
    }
  }

  if (isCompleted) {
    try {
      const inProg = getInProgressChapters();
      let changed = false;
      for (let ch = start; ch <= end; ch++) {
        const k = `${book}-${ch}`;
        if (inProg.has(k)) {
          inProg.delete(k);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(IN_PROGRESS_CHAPTERS_KEY, JSON.stringify(Array.from(inProg)));
      }
    } catch (e) {}
  }

  saveCompletedVerses(currentVerses);
  saveCompletedChapters(currentChapters);

  window.dispatchEvent(
    new CustomEvent('superbible_verse_read_changed', {
      detail: { book, startChapter: start, endChapter: end, isRange: true, isDone: isCompleted },
    })
  );

  return { completedCount: processedChapters.length, chapters: processedChapters };
}

export function resetAllReadingProgress(): void {
  try {
    localStorage.removeItem(READ_VERSES_STORAGE_KEY);
    localStorage.removeItem(COMPLETED_CHAPTERS_STORAGE_KEY);
    localStorage.removeItem(IN_PROGRESS_CHAPTERS_KEY);
    localStorage.removeItem(CURRENT_READING_BOOK_KEY);
    localStorage.removeItem(CURRENT_READING_CHAPTER_KEY);
    // Also clear old legacy keys if present
    localStorage.removeItem('superbible_completed_verses_set');
    localStorage.removeItem('superbible_completed_chapters_set');
  } catch (e) {
    console.error('Failed to reset reading progress:', e);
  }
  window.dispatchEvent(
    new CustomEvent('superbible_verse_read_changed', {
      detail: { isResetAll: true },
    })
  );
}

