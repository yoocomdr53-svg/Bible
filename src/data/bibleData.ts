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
const READ_VERSES_STORAGE_KEY = 'superbible_completed_verses_v2';
const COMPLETED_CHAPTERS_STORAGE_KEY = 'superbible_completed_chapters_v2';

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

export function resetAllReadingProgress(): void {
  try {
    localStorage.removeItem(READ_VERSES_STORAGE_KEY);
    localStorage.removeItem(COMPLETED_CHAPTERS_STORAGE_KEY);
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

