import { BibleVerse, BibleBook, ReadingDayPlan, UserRecording } from '../types';

export const TODAY_VERSE: BibleVerse = {
  book: '야고보서',
  chapter: 1,
  verse: 22,
  text: '너희는 말씀을 행하는 자가 되고 듣기만 하여 자신을 속이는 자가 되지 말라',
  translation: '개역개정',
};

export const POPULAR_VERSES: BibleVerse[] = [
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
];

export const BIBLE_BOOKS: BibleBook[] = [
  // New Testament
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
  { id: 'jas', name: '야고보서', testament: 'NT', chaptersCount: 5 },
  { id: 'rev', name: '요한계시록', testament: 'NT', chaptersCount: 22 },
  // Old Testament (Popular)
  { id: 'gen', name: '창세기', testament: 'OT', chaptersCount: 50 },
  { id: 'exo', name: '출애굽기', testament: 'OT', chaptersCount: 40 },
  { id: 'psa', name: '시편', testament: 'OT', chaptersCount: 150 },
  { id: 'pro', name: '잠언', testament: 'OT', chaptersCount: 31 },
  { id: 'isa', name: '이사야', testament: 'OT', chaptersCount: 66 },
];

export const SAMPLE_VERSES_CHAPTER: Record<string, { verse: number; text: string }[]> = {
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
  '로마서-8': [
    { verse: 1, text: '그러므로 이제 그리스도 예수 안에 있는 자에게는 결코 정죄함이 없나니' },
    { verse: 2, text: '이는 그리스도 예수 안에 있는 생명의 성령의 법이 죄와 사망의 법에서 너를 해방하였음이라' },
    { verse: 28, text: '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라' },
    { verse: 31, text: '그런즉 이 일에 대하여 우리가 무슨 말 하리요 만일 하나님이 우리를 위하시면 누가 우리를 대적하리요' },
    { verse: 38, text: '내가 확신하노니 사망이나 생명이나 천사들이나 권세자들이나 현재 일이나 장래 일이나 능력이나' },
    { verse: 39, text: '높음이나 깊음이나 다른 어떤 피조물이라도 우리를 우리 주 그리스도 예수 안에 있는 하나님의 사랑에서 끊을 수 없으리라' },
  ],
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
