import { useCallback, useEffect, useState, useMemo } from 'react';
import { 
  CalendarDays, 
  Clock3, 
  Globe2, 
  Info, 
  Tv, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Settings, 
  Star, 
  X, 
  Play, 
  TrendingUp, 
  ArrowUp, 
  RefreshCw, 
  ExternalLink,
  BookOpen,
  Award,
  Layers,
  HelpCircle,
  Film,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import axios from 'axios';

interface AnimeSchedule {
  mal_id: number;
  title: string;
  title_japanese?: string;
  title_korean?: string;
  is_translated?: boolean;
  broadcast?: {
    day?: string;
    time?: string;
    timezone?: string;
    string?: string;
  };
  status: string;
  genres?: Array<{ mal_id?: number; type?: string; name: string; url?: string }>;
  demographics?: Array<{ name: string }>;
  studios?: Array<{ name: string }>;
  producers?: Array<{ name: string }>;
  images?: {
    jpg?: {
      image_url?: string;
      large_image_url?: string;
    };
  };
  score?: number;
  rank?: number;
  episodes?: number;
  synopsis?: string;
  source?: string;
  duration?: string;
  rating?: string;
  trailer?: {
    youtube_id?: string;
    url?: string;
    embed_url?: string;
  };
}

interface TMDBSearchResult {
  results: Array<{
    id: number;
    name?: string;
    original_name?: string;
    original_language?: string;
  }>;
}

interface JikanScheduleResponse {
  data: AnimeSchedule[];
  pagination?: {
    has_next_page?: boolean;
  };
}

const TMDB_API_KEY = (import.meta.env.VITE_TMDB_API_KEY as string | undefined)?.trim();

const excludedKeywords = [
  'wishcat', 'tiny ping', 'ninjala', 'chibi maruko', 'sazae', 'doraemon', 
  'crayon shin-chan', 'pokemon', 'digimon', 'youkai watch', 'anpanman', 
  'mini mini', 'minimini', 'miniforce', 'ping pong', 'pingu', 'pororo', 
  'tayo', 'robocar', 'larva', 'kongsuni', 'cocomong', 'tobot', 
  'power battle watch', 'pochaazu', 'rakuten', 'bonobono', 'detective conan', 
  'case closed', 'pretty cure', 'precure', 'i-pre', 'ipre', 'manul no yuube', 
  'mashin souzou-sen wataru', 'shin nippon history', 'kinnikuman', 'wish cat', 
  'tiniping', 'ウィッシュキャット', 'ティニピン', 'キン肉マン', 'まぬるの夕べ', 
  '魔神創造伝ワタル', '新日本史', 'キン肉マンII世', 'シューティングスター', 
  'ぼ의ぼ의', 'ぼのぼ의', 'ぼ의ぼの', 'ぼのぼの', 'コナン', 'プリキュア', 'ドラえもん', 'クレヨンしんちゃん', 
  'ポケットモンスター', 'デジモン', '妖怪ウォッチ', 'アンパンマン', 'ミニミニ', 
  'ピングー', 'ポ로로', 'ポロ로', 'ポ로로', 'ポロ로', 'ポロロ', 'タヨ', 'ロボカー', 'ラー바', 'ラーバ', 
  'コン스니', 'コンス니', 'ココ몽', 'ココモン', 'トボット', 'パワーバトルウォッチカー', 'ポча즈', 
  'ポチャーズ', 'pochazu', 'pochaaz', 'ぽちゃーず', 'ぽちゃーズ'
];

const excludedStudios = [
  'tencent', 'bilibili', 'dongwoo', 'iconix', 'toei animation', 
  'studio pierrot', 'tms entertainment', 'shin-ei animation', 
  'tv tokyo', 'olm', 'sunrise', 'bandai namco pictures'
];

const excludedGenres = ['kids', 'children', 'family', 'educational', 'kodomo'];

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];
const DAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const GENRE_MAP: Record<string, string> = {
  'Action': '액션',
  'Adventure': '모험',
  'Comedy': '코미디',
  'Drama': '드라마',
  'Fantasy': '판타지',
  'Horror': '공포',
  'Mystery': '미스터리',
  'Romance': '로맨스',
  'Sci-Fi': 'SF',
  'Slice of Life': '일상',
  'Sports': '스포츠',
  'Supernatural': '초자연',
  'Suspense': '서스펜스',
  'Award Winning': '수상작',
  'Gourmet': '미식',
  'Ecchi': '에치',
  'Girls Love': 'GL',
  'Boys Love': 'BL',
  'Avant Garde': '아방가르드',
  'Military': '밀리터리',
  'Music': '음악',
  'Parody': '패러디',
  'Historical': '역사',
  'Mecha': '메카',
  'Psychological': '심리',
  'School': '학원',
  'Space': '우주',
  'Super Power': '초능력',
  'Vampire': '뱀파이어',
  'Harem': '하렘',
  'Mythology': '신화',
  'Cyberpunk': '사이버펑크',
  'Survival': '서바이벌',
  'Idols (Female)': '아이돌(여)',
  'Idols (Male)': '아이돌(남)',
  'Detective': '추리',
  'Isekai': '이세계',
  'Otaku Culture': '오타쿠',
  'Shounen': '소년',
  'Shoujo': '순정',
  'Seinen': '청년',
  'Josei': '여성',
};

function normalizeTitle(value: string | null | undefined) {
  if (!value || typeof value !== 'string') return '';
  return value.toLowerCase().replace(/[^a-z0-9가-힣ぁ-んァ-ン一-龯]/g, '').trim();
}

const KOREAN_TITLE_MAP_RAW: Record<string, string> = {
  // 2024-2026 popular / recent anime
  'sousou no frieren': '장송의 프리렌',
  'frieren: beyond journey\'s end': '장송의 프리렌',
  'kimetsu no yaiba': '귀멸의 칼날',
  'demon slayer': '귀멸의 칼날',
  'demon slayer: kimetsu no yaiba': '귀멸의 칼날',
  'jujutsu kaisen': '주술회전',
  'boku no hero academia': '나의 히어로 아카데미아',
  'my hero academia': '나의 히어로 아카데미아',
  'chainsaw man': '체인소 맨',
  'kaijuu 8-gou': '괴수 8호',
  'kaiju no. 8': '괴수 8호',
  'solo leveling': '나 혼자만 레벨업',
  'ore dake leveup na ken': '나 혼자만 레벨업',
  'dungeon meshi': '던전밥',
  'delicious in dungeon': '던전밥',
  'kusuriya no hitorigoto': '약사의 혼잣말',
  'the apothecary diaries': '약사의 혼잣말',
  'bocchi the rock!': '외토리 더 록!',
  'bocchi the rock': '외토리 더 록!',
  'oshi no ko': '최애의 아이',
  'oshi no ko 2nd season': '최애의 아이 2기',
  'mushoku tensei: isekai ittara honki dasu': '무직전생 ~이세계 갔으면 최선을 다한다~',
  'mushoku tensei ii: isekai ittara honki dasu': '무직전생 II ~이세계 갔으면 최선을 다한다~',
  'mushoku tensei': '무직전생',
  'tensei shitara slime datta ken': '전생했더니 슬라임이었던 건에 대하여',
  'tensura': '전생했더니 슬라임이었던 건에 대하여',
  'shingeki no kyojin': '진격의 거인',
  'attack on titan': '진격의 거인',
  'spy x family': '스파이 패밀리',
  'one piece': '원피스',
  'detective conan': '명탐정 코난',
  'case closed': '명탐정 코난',
  'bleach': '블리치',
  'naruto': '나루토',
  'boruto': '보루토',
  'black clover': '블랙 클로버',
  're:zero kara hajimeru isekai seikatsu': 'Re: 제로부터 시작하는 이세계 생활',
  're:zero': 'Re: 제로부터 시작하는 이세계 생활',
  'konosuba': '이 멋진 세계에 축복을!',
  'overlord': '오버로드',
  'no game no life': '노 게임 노 라이프',
  'one punch man': '원펀맨',
  'mob psycho 100': '모브사이코 100',
  'violet evergarden': '바이올렛 에버가든',
  'wind breaker': '윈드 브레이커',
  'blue lock': '블루 록',
  'haikyuu!!': '하이큐!!',
  'haikyu': '하이큐!!',
  'horimiya': '호리미야',
  'kaguya-sama wa kokurasetai': '카구야 님은 고백받고 싶어',
  'kaguya-sama: love is war': '카구야 님은 고백받고 싶어',
  'lycoris recoil': '리코리스 리코일',
  'cyberpunk: edgerunners': '사이버펑크: 엣지러너',
  'steins;gate': '슈타인즈 게이트',
  'sword art online': '소드 아트 온라인',
  'fate/stay night': '페이트 스테이 나이트',
  'fate/zero': '페이트 제로',
  'tate no yuusha no nariagari': '방패 용사 성공담',
  'kage no jitsuryokusha ni naritakute!': '어둠의 실력자가 되고 싶어서!',
  'the eminence in shadow': '어둠의 실력자가 되고 싶어서!',
  'chinnami': '친나미',
  'kimetsu no yaiba: hashira geiko-hen': '귀멸의 칼날: 합동 강화 훈련편',
  'kimetsu no yaiba: yuukaku-hen': '귀멸의 칼날: 환락의 거리편',
  'kimetsu no yaiba: mugen ressha-hen': '귀멸의 칼날: 무한열차편',
  'kimetsu no yaiba: katana kaji no sato-hen': '귀멸의 칼날: 도공 마을편',
  'vinland saga': '빈란드 사가',
  'dr. stone': '닥터 스톤',
  'dr.stone': '닥터 스톤',
  'hunter x hunter': '헌터 x 헌터',
  'hunter x hunter (2011)': '헌터 x 헌터 (2011)',
  'gintama': '은혼',
  'fairy tail': '페어리 테일',
  'tokyo ghoul': '도쿄 구울',
  'death note': '데스노트',
  'fullmetal alchemist: brotherhood': '강철의 연금술사 리메이크',
  'fullmetal alchemist': '강철의 연금술사',
  'code geass': '코드 기아스',
  'code geass: lelouch of the rebellion': '코드 기아스 반역의 를르슈',
  'neon genesis evangelion': '신세기 에반게리온',
  'cowboy bebop': '카우보이 비밥',
  'monogatari': '모노가타리',
  'bakemonogatari': '바케모노가타리',
  'nisemonogatari': '니세모노가타리',
  'jojo\'s bizarre adventure': '죠죠의 기묘한 모험',
  'jojo no kimyou na bouken': '죠죠의 기묘한 모험',
  'shigatsu wa kimi no uso': '4월은 너의 거짓말',
  'your lie in april': '4월은 너의 거짓말',
  'clannad': '클라나드',
  'angel beats!': '엔젤 비트',
  'anohana: the flower we saw that day': '그날 본 꽃의 이름을 우리는 아직 모른다',
  'anohana': '그날 본 꽃의 이름을 우리는 아직 모른다',
  'kono subarashii sekai ni shukufuku wo!': '이 멋진 세계에 축복을!',
  'tokyo revengers': '도쿄 리벤저스',
  'jigokuraku': '지옥락',
  'hell\'s paradise': '지옥락',
  'zom 100: bucket list of the dead': '좀100: 좀비가 되기 전에 하고 싶은 100가지',
  'zom 100: zombie ni naru made ni shitai 100 no koto': '좀100: 좀비가 되기 전에 하고 싶은 100가지',
  'mukanjou': '무감정',
  'jashin-chan dropkick': '사신 짱 드롭킥',
  'sasaki toピー쨩': '사사키와 피짱',
  'sasaki and peeps': '사사키와 피짱',
  'sasaki toピー-chan': '사사키와 피짱',
  'mashle: magic and muscles': '마슐',
  'mashle': '마슐',
  'shangri-la frontier': '샹그릴라 프론티어',
  'choujin x': '초인 X',
  'mato seihei no slave': '마도정병의 슬레이브',
  'chained soldier': '마도정병의 슬레이브',
  'yofukashi no uta': '철야의 노래',
  'call of the night': '철야의 노래',
  'blue box': '푸른 상자',
  'ao no hako': '푸른 상자',
  'dandadan': '단다단',
  'ranma 1/2': '란마 1/2',
  'ranma 1/2 (2024)': '란마 1/2 (2024)',
  're:zero kara hajimeru isekai seikatsu 3rd season': 'Re: 제로부터 시작하는 이세계 생활 3기',
  'shangri-la frontier: kusoge hanter, kami ge ni idoman to su': '샹그릴라 프론티어 ~망겜 헌터, 갓겜에 도전하다~',
  'shangri-la frontier 2nd season': '샹그릴라 프론티어 2기',
  'kekkon suru tte, hontou desu ka': '결혼한다는 게, 정말인가요',
  '365 days to the wedding': '결혼한다는 게, 정말인가요',
  'chi.: chikyuu no undou ni tsuite': '지. -지구의 운동에 대하여-',
  'orb: on the movements of the earth': '지. -지구의 운동에 대하여-',
  'seirei gensouki: spirit chronicles season 2': '정령환상기 2기',
  'seirei gensouki': '정령환상기',
  'blue lock vs. u-20 japan': '블루 록 VS. U-20 일본 대표전',
  'blue lock 2nd season': '블루 록 2기',
  'arifureta shokugyou de sekai saikyou season 3': '흔해빠진 직업으로 세계최강 3기',
  'arifureta shokugyou de sekai saikyou': '흔해빠진 직업으로 세계최강',
  'shokugeki no soma': '식극의 소마',
  'toaru majutsu no index': '어떤 마술의 금서목록',
  'toaru kagaku no railgun': '어떤 과학의 초전자포',
  'tate no yuusha no nariagari season 3': '방패 용사 성공담 3기',
  'danmachi': '던전에서 만남을 추구하면 안 되는 걸까',
  'dungeon ni deai wo motomeru no wa machigatteiru darou ka': '던전에서 만남을 추구하면 안 되는 걸까',
  'dungeon ni deai wo motomeru no wa machigatteiru darou ka v': '던전에서 만남을 추구하면 안 되는 걸까 5기',
  'tsundere akuyaku reijou liselotte to jikkyou no endou-kun to kaisetsu no kobayashi-san': '츠레와 츤데레 악역 영애 리젤로테와 실황의 엔도 씨와 해설의 코바야시 씨',
  'saenai heroine no sodatekata': '시원찮은 그녀를 위한 육성방법',
  'saekano': '시원찮은 그녀를 위한 육성방법',
  'yahari ore no seishun love comedy wa machigatteiru.': '역시 내 청춘 러브코메디는 잘못됐다.',
  'oregairu': '역시 내 청춘 러브코메디는 잘못됐다.',
  'hige wo soru. soshite joshikousei wo hirou.': '수염을 깎다. 그리고 여고생을 줍는다.',
  'higehiro': '수염을 깎다. 그리고 여고생을 줍는다.',
  'gotoubun no hanayome': '5등분의 신부',
  'the quintessential quintuplets': '5등분의 신부',
  'kanojo, okashishimasu': '여친, 빌리겠습니다',
  'rent-a-girlfriend': '여친, 빌리겠습니다',
  'isekai wa smartphone to tomo ni.': '이세계는 스마트폰과 함께.',
  'tensei shitara ken deshita': '전생했더니 검이었습니다',
  'reincarnated as a sword': '전생했더니 검이었습니다',
  'kage no jitsuryokusha ni naritakute! 2nd season': '어둠의 실력자가 되고 싶어서! 2기',
  'honzuki no gekokujou': '책벌레의 하극상',
  'ascendance of a bookworm': '책벌레의 하극상',
  'mahouka koukou no rettousei': '마법과고교의 열등생',
  'the irregular at magic high school': '마법과고교의 열등생',
  'black butler': '흑집사',
  'kuroshitsuji': '흑집사',
  'kuroko no basket': '쿠로코의 농구',
  'kuroko\'s basketball': '쿠로코의 농구',
  'slam dunk': '슬램덩크',
  'yowamushi pedal': '겁쟁이 페달',
  'diamond no ace': '다이아몬드 A',
  'ace of diamond': '다이아몬드 A',
  'chihayafuru': '치하야후루',
  'nichijou': '일상',
  'nichijou - my ordinary life': '일상',
  'danshi koukousei no nichijou': '남자 고교생의 일상',
  'daily lives of high school boys': '남자 고교생의 일상',
  'grand blue': '그랑블루',
  'grand blue dreaming': '그랑블루',
  'asobi asobase': '아소비 아소바세',
  'asobi asobase: workshop of fun': '아소비 아소바세',
  'barakamon': '바라카몬',
  'non non biyori': '논논비요리',
  'yuru camp△': '유루캠△',
  'yuru camp': '유루캠',
  'laid-back camp': '유루캠',
  'k-on!': '케이온!',
  'k-on': '케이온!',
  'lucky☆star': '러키☆스타',
  'lucky star': '러키☆스타',
  'suzumiya haruhi no yuuutsu': '스즈미야 하루히의 우울',
  'the melancholy of haruhi suzumiya': '스즈미야 하루히의 우울',
  'toradora!': '토라도라!',
  'toradora': '토라도라!',
  'golden time': '골든 타임',
  'sakurasou no pet na kanojo': '사쿠라장의 애완 그녀',
  'the pet girl of sakurasou': '사쿠라장의 애완 그녀',
  'nisekoi': '니세코이',
  'nisekoi: false love': '니세코이',
  'clannad: after story': '클라나드 애프터 스토리',
  'ano hi mita hana no namae wo bokutachi wa mada shiranai.': '그날 본 꽃의 이름을 우리는 아직 모른다.',
  'angel beats': '엔젤 비트',
  'plastic memories': '플라스틱 메모리즈',
  'charlotte': '샬롯',
  'guilty crown': '길티 크라운',
  'darling in the franxx': '달링 인 더 프랑키스',
  'kill la kill': '킬라킬',
  'tengen toppa gurren lagann': '천원돌파 그렌라간',
  'gurren lagann': '천원돌파 그렌라간',
  'puella magi madoka magica': '마법소녀 마도카☆마기카',
  'mahou shoujo madoka★magica': '마법소녀 마도카☆마기카',
  'made in abyss': '메이드 인 어비스',
  'yakusoku no neverland': '약속의 네버랜드',
  'the promised neverland': '약속의 네버랜드',
  'vinland saga season 2': '빈란드 사가 2기',
  'mob psycho 100 ii': '모브사이코 100 2기',
  'mob psycho 100 iii': '모브사이코 100 3기',
  'one punch man 2nd season': '원펀맨 2기',
  'shingeki no kyojin season 2': '진격의 거인 2기',
  'shingeki no kyojin season 3': '진격의 거인 3기',
  'shingeki no kyojin: the final season': '진격의 거인 파이널 시즌',
  'jujutsu kaisen 2nd season': '주술회전 2기',
  'kimetsu no yaiba: mugen ressha-hen (tv)': '귀멸의 칼날: 무한열차편 (TV판)',
};

const KOREAN_TITLE_MAP: Record<string, string> = Object.keys(KOREAN_TITLE_MAP_RAW).reduce((acc, key) => {
  acc[normalizeTitle(key)] = KOREAN_TITLE_MAP_RAW[key];
  return acc;
}, {} as Record<string, string>);

function scoreCandidate(item: TMDBSearchResult['results'][number], title: string, titleJa = '') {
  const titleN = normalizeTitle(title);
  const jaN = normalizeTitle(titleJa);
  const nameN = normalizeTitle(item.name || '');
  const originalNameN = normalizeTitle(item.original_name || '');

  let score = 0;
  if (item.original_language === 'ja') score += 35;
  if (nameN === titleN || originalNameN === titleN) score += 45;
  if (jaN && (nameN === jaN || originalNameN === jaN)) score += 40;
  if (nameN.includes(titleN) || titleN.includes(nameN)) score += 20;
  if (jaN && (originalNameN.includes(jaN) || jaN.includes(originalNameN))) score += 20;

  const lenPenalty = Math.abs((originalNameN || nameN).length - Math.max(titleN.length, jaN.length || 0));
  return score - Math.min(20, lenPenalty);
}

// Safe LocalStorage Wrapper to prevent security exceptions in sandboxed webviews or private windows
const getSafeLocalStorage = (key: string): string => {
  try {
    return localStorage.getItem(key) || '';
  } catch (e) {
    console.warn('localStorage.getItem is blocked or unavailable:', e);
    return '';
  }
};

const setSafeLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage.setItem is blocked or unavailable:', e);
  }
};

const removeSafeLocalStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('localStorage.removeItem is blocked or unavailable:', e);
  }
};

function App() {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [schedule, setSchedule] = useState<AnimeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'airing' | 'finished'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'score' | 'title'>('time');
  const [cachedSchedules, setCachedSchedules] = useState<Record<number, AnimeSchedule[]>>({});
  
  const [tmdbKey, setTmdbKey] = useState<string>(() => getSafeLocalStorage('baekji_tmdb_key'));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsKeyValue, setSettingsKeyValue] = useState(tmdbKey);

  // 환경설정 튜닝 상태
  const [timeFormat24, setTimeFormat24] = useState<boolean>(() => getSafeLocalStorage('blank_time_format_24') === 'true');
  const [showRatings, setShowRatings] = useState<boolean>(() => {
    const val = getSafeLocalStorage('blank_show_ratings');
    return val === null ? true : val === 'true';
  });
  const [safeMode, setSafeMode] = useState<boolean>(() => getSafeLocalStorage('blank_safe_mode') === 'true');
  const [blurIntensity, setBlurIntensity] = useState<'off' | 'medium' | 'heavy'>(() => {
    return (getSafeLocalStorage('blank_blur_intensity') as 'off' | 'medium' | 'heavy') || 'medium';
  });
  const [springSpeed, setSpringSpeed] = useState<'snappy' | 'fluid' | 'fast'>(() => {
    return (getSafeLocalStorage('blank_spring_speed') as 'snappy' | 'fluid' | 'fast') || 'fluid';
  });

  const [activeAnime, setActiveAnime] = useState<AnimeSchedule | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [anissiaTitleMap, setAnissiaTitleMap] = useState<Record<string, string>>({});

  const shouldExcludeAnime = useCallback((anime: AnimeSchedule) => {
    if (!anime || typeof anime.title !== 'string') return true;
    
    // safeMode 성인 필터 적용
    if (safeMode) {
      const rating = typeof anime.rating === 'string' ? anime.rating.toLowerCase() : '';
      const isAdultRating = rating.includes('rx') || rating.includes('r - 17+') || rating.includes('hentai') || rating.includes('mild nudity');
      const hasAdultGenre = Array.isArray(anime.genres) && anime.genres.some((genre) => {
        if (!genre || typeof genre.name !== 'string') return false;
        const gName = genre.name.toLowerCase();
        return gName.includes('hentai') || gName.includes('ecchi') || gName.includes('erotica');
      });
      if (isAdultRating || hasAdultGenre) return true;
    }

    const titleLower = anime.title.toLowerCase();
    const japaneseTitleLower = typeof anime.title_japanese === 'string' ? anime.title_japanese.toLowerCase() : '';

    const hasExcludedKeyword = excludedKeywords.some((keyword) => {
      if (typeof keyword !== 'string') return false;
      const normalizedKeyword = keyword.toLowerCase();
      return titleLower.includes(normalizedKeyword) || japaneseTitleLower.includes(normalizedKeyword);
    });

    const hasExcludedStudio = Array.isArray(anime.studios) && anime.studios.some((studio) =>
      studio && typeof studio.name === 'string' && excludedStudios.some((excludedStudio) => 
        typeof excludedStudio === 'string' && studio.name.toLowerCase().includes(excludedStudio.toLowerCase())
      )
    );

    const hasKodomoDemographic = Array.isArray(anime.demographics) && anime.demographics.some((demo) => {
      if (!demo || typeof demo.name !== 'string') return false;
      const name = demo.name.toLowerCase();
      return name === 'kids' || name === 'kodomo';
    });

    const hasExcludedGenre = Array.isArray(anime.genres) && anime.genres.some((genre) =>
      genre && typeof genre.name === 'string' && excludedGenres.some((excludedGenre) => 
        typeof excludedGenre === 'string' && genre.name.toLowerCase().includes(excludedGenre.toLowerCase())
      )
    );

    return Boolean(hasExcludedKeyword || hasExcludedStudio || hasKodomoDemographic || hasExcludedGenre);
  }, [safeMode]);

  const fetchKoreanTitle = useCallback(async (title: string, japaneseTitle = '', customKey?: string) => {
    // 1. 로컬 정적 사전 매핑 확인 (KOREAN_TITLE_MAP)
    const normTitle = normalizeTitle(title);
    const normJa = japaneseTitle ? normalizeTitle(japaneseTitle) : '';

    if (normJa && KOREAN_TITLE_MAP[normJa]) {
      return KOREAN_TITLE_MAP[normJa];
    }
    if (normTitle && KOREAN_TITLE_MAP[normTitle]) {
      return KOREAN_TITLE_MAP[normTitle];
    }

    // 2. 동적으로 로드된 애니시아 매핑 확인 (anissiaTitleMap)
    if (normJa && anissiaTitleMap[normJa]) {
      return anissiaTitleMap[normJa];
    }
    if (normTitle && anissiaTitleMap[normTitle]) {
      return anissiaTitleMap[normTitle];
    }

    // 3. TMDB API 백업 검색 작동
    const activeKey = customKey || tmdbKey || TMDB_API_KEY;
    if (!activeKey) return title;

    const doSearch = async (query: string) => {
      const response = await axios.get<TMDBSearchResult>('https://api.themoviedb.org/3/search/tv', {
        params: { api_key: activeKey, query, language: 'ko-KR', include_adult: false },
      });
      return response.data.results;
    };

    const queries = Array.from(new Set([title, japaneseTitle].filter(Boolean)));

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const results = (await Promise.all(queries.map(doSearch))).flat();
        if (results.length === 0) return title;

        const best = Array.from(new Map(results.map((item) => [item.id, item])).values())
          .map((item) => ({ item, score: scoreCandidate(item, title, japaneseTitle) }))
          .sort((a, b) => b.score - a.score)[0];

        if (!best || best.score < 40) return title;
        return best.item.name || title;
      } catch {
        if (attempt === 1) return title;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return title;
  }, [tmdbKey, anissiaTitleMap]);

  const fetchSchedule = useCallback(async (forceRefetch = false) => {
    setLoading(true);
    setError(null);
    setWarning(null);

    const activeKey = tmdbKey || TMDB_API_KEY;

    if (!forceRefetch && cachedSchedules[selectedDay]) {
      setSchedule(cachedSchedules[selectedDay]);
      setLoading(false);
      if (!activeKey) {
        setWarning('기본 한글 번역이 적용되어 있습니다. 더 많은 고전/마이너 작품 번역을 위해 설정(톱니바퀴)에서 TMDB API 키를 등록하실 수 있습니다.');
      }
      return;
    }

    try {
      const allAnime: AnimeSchedule[] = [];
      let page = 1;
      let hasNext = true;

      while (hasNext) {
        if (page > 1) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }

        const response = await axios.get<JikanScheduleResponse>('https://api.jikan.moe/v4/schedules', {
          params: { filter: DAYS[selectedDay], limit: 25, sfw: true, page },
        });

        if (!response.data?.data) throw new Error('잘못된 데이터 형식');
        allAnime.push(...response.data.data);
        hasNext = Boolean(response.data.pagination?.has_next_page);
        page += 1;
      }

      const filteredAnime = allAnime
        .filter((anime) => anime && anime.title && !shouldExcludeAnime(anime))
        .filter((anime, index, self) => index === self.findIndex((item) => item && item.mal_id === anime.mal_id));

      if (!activeKey) {
        setWarning('기본 한글 번역이 적용되어 있습니다. 더 많은 고전/마이너 작품 번역을 위해 설정(톱니바퀴)에서 TMDB API 키를 등록하실 수 있습니다.');
      }

      const batchSize = 4;
      const titlesWithKorean: AnimeSchedule[] = [];

      for (let i = 0; i < filteredAnime.length; i += batchSize) {
        const batch = filteredAnime.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (anime) => {
            const ko = await fetchKoreanTitle(anime.title, anime.title_japanese, activeKey);
            const normTitle = normalizeTitle(anime.title);
            const normJa = anime.title_japanese ? normalizeTitle(anime.title_japanese) : '';
            const hasStatic = (normJa && KOREAN_TITLE_MAP[normJa]) || (normTitle && KOREAN_TITLE_MAP[normTitle]);
            const hasAnissia = Object.keys(anissiaTitleMap).length > 0 && ((normJa && anissiaTitleMap[normJa]) || (normTitle && anissiaTitleMap[normTitle]));
            const hasTmdb = ko !== anime.title;
            const isTranslated = Boolean(hasStatic || hasAnissia || hasTmdb || Object.keys(anissiaTitleMap).length > 0);
            return {
              ...anime,
              title_korean: ko,
              is_translated: isTranslated
            };
          }),
        );
        titlesWithKorean.push(...batchResults);
      }

      setSchedule(titlesWithKorean);
      setCachedSchedules((prev) => ({
        ...prev,
        [selectedDay]: titlesWithKorean
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다';
      setError(errorMessage);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDay, shouldExcludeAnime, fetchKoreanTitle, cachedSchedules, tmdbKey, anissiaTitleMap]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Anissia schedule in the background to dynamically map Korean titles
  useEffect(() => {
    const loadAnissiaTitles = async () => {
      try {
        const days = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        const responses = await Promise.all(
          days.map((day) =>
            axios
              .get<{ code: number; data: Array<{ subject: string; originalSubject: string }> }>(
                `https://api.anissia.net/anime/schedule/${day}`
              )
              .then((res) => res.data?.data || [])
              .catch(() => [])
          )
        );

        const newMap: Record<string, string> = {};
        for (const list of responses) {
          if (Array.isArray(list)) {
            for (const item of list) {
              if (item && item.subject) {
                if (item.originalSubject) {
                  const cleanJa = normalizeTitle(item.originalSubject);
                  if (cleanJa) {
                    newMap[cleanJa] = item.subject;
                  }
                  const cleanEn = item.originalSubject.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
                  const cleanEnNorm = normalizeTitle(cleanEn);
                  if (cleanEnNorm) {
                    newMap[cleanEnNorm] = item.subject;
                  }
                }
                const cleanSubj = normalizeTitle(item.subject);
                if (cleanSubj) {
                  newMap[cleanSubj] = item.subject;
                }
              }
            }
          }
        }
        setAnissiaTitleMap(newMap);
      } catch (err) {
        console.error('Anissia API 로드 실패:', err);
      }
    };
    loadAnissiaTitles();
  }, []);

  // Re-translate current view when Anissia map finishes loading
  useEffect(() => {
    if (Object.keys(anissiaTitleMap).length === 0 || schedule.length === 0) return;

    const hasUntranslated = schedule.some((anime) => !anime.is_translated);
    if (!hasUntranslated) return;

    const updateTitles = async () => {
      const updated = await Promise.all(
        schedule.map(async (anime) => {
          if (anime.is_translated) return anime;
          const ko = await fetchKoreanTitle(anime.title, anime.title_japanese);
          return { ...anime, title_korean: ko, is_translated: true };
        })
      );
      setSchedule(updated);
      
      setCachedSchedules((prev) => ({
        ...prev,
        [selectedDay]: updated
      }));
    };
    updateTitles();
  }, [anissiaTitleMap, schedule, fetchKoreanTitle, selectedDay]);

  useEffect(() => {
    fetchSchedule(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  const handleManualRefresh = () => {
    fetchSchedule(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    // TMDB API Key 저장
    const trimmed = settingsKeyValue.trim();
    setSafeLocalStorage('baekji_tmdb_key', trimmed);
    setTmdbKey(trimmed);

    // 고급 옵션들 영구 동기화
    setSafeLocalStorage('blank_time_format_24', String(timeFormat24));
    setSafeLocalStorage('blank_show_ratings', String(showRatings));
    setSafeLocalStorage('blank_safe_mode', String(safeMode));
    setSafeLocalStorage('blank_blur_intensity', blurIntensity);
    setSafeLocalStorage('blank_spring_speed', springSpeed);
    
    setIsSettingsOpen(false);
    
    // 세이프모드나 시간대 설정 등이 즉시 반영되도록 캐시와 일정을 리로드
    setCachedSchedules({});
    setTimeout(() => {
      setSchedule([]);
      setSelectedDay((prev) => prev);
    }, 100);
  };

  const handleClearSettings = () => {
    removeSafeLocalStorage('baekji_tmdb_key');
    setTmdbKey('');
    setSettingsKeyValue('');
    setIsSettingsOpen(false);
    setCachedSchedules({});
  };

  const handleFactoryReset = () => {
    // eslint-disable-next-line no-restricted-globals
    const proceed = confirm('모든 사용자 지정 튜닝 옵션, 캐시, TMDB API Key를 통째로 지우고 blank.sch를 처음 상태로 완전히 공장 초기화하시겠습니까?');
    if (proceed) {
      removeSafeLocalStorage('baekji_tmdb_key');
      removeSafeLocalStorage('blank_time_format_24');
      removeSafeLocalStorage('blank_show_ratings');
      removeSafeLocalStorage('blank_safe_mode');
      removeSafeLocalStorage('blank_blur_intensity');
      removeSafeLocalStorage('blank_spring_speed');
      
      setTmdbKey('');
      setSettingsKeyValue('');
      setTimeFormat24(false);
      setShowRatings(true);
      setSafeMode(false);
      setBlurIntensity('medium');
      setSpringSpeed('fluid');
      
      setIsSettingsOpen(false);
      setCachedSchedules({});
      
      setTimeout(() => {
        setSchedule([]);
        setSelectedDay((prev) => prev);
      }, 100);
    }
  };

  const formatTime = useCallback((timeString: string | undefined) => {
    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return '시간 미정';
    if (timeFormat24) {
      return timeString; // 24시간 형식 그대로 리턴 (예: 23:30)
    }
    const [hours, minutes] = timeString.split(':');
    const hour = Number.parseInt(hours, 10);
    if (isNaN(hour)) return '시간 미정';
    const ampm = hour >= 12 ? '오후' : '오전';
    const hour12 = hour % 12 || 12;
    return `${ampm} ${hour12}:${minutes || '00'}`;
  }, [timeFormat24]);

  const availableGenres = useMemo(() => {
    const genresSet = new Set<string>();
    schedule.forEach((anime) => {
      if (anime && Array.isArray(anime.genres)) {
        anime.genres.forEach((genre) => {
          if (genre && typeof genre.name === 'string') {
            genresSet.add(genre.name);
          }
        });
      }
    });
    return Array.from(genresSet).sort((a, b) => {
      const translationA = (a && GENRE_MAP[a]) || a || '';
      const translationB = (b && GENRE_MAP[b]) || b || '';
      return translationA.localeCompare(translationB, 'ko');
    });
  }, [schedule]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => 
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const processedSchedule = useMemo(() => {
    let result = [...schedule];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((anime) => {
        const ko = typeof anime.title_korean === 'string' ? anime.title_korean.toLowerCase() : '';
        const en = typeof anime.title === 'string' ? anime.title.toLowerCase() : '';
        const ja = typeof anime.title_japanese === 'string' ? anime.title_japanese.toLowerCase() : '';
        const studioMatch = Array.isArray(anime.studios) && anime.studios.some((s) => 
          s && typeof s.name === 'string' && s.name.toLowerCase().includes(q)
        );
        return ko.includes(q) || en.includes(q) || ja.includes(q) || studioMatch;
      });
    }

    if (selectedGenres.length > 0) {
      result = result.filter((anime) => 
        selectedGenres.every((selectedGenre) => 
          anime.genres?.some((g) => g.name === selectedGenre)
        )
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((anime) => {
        if (statusFilter === 'airing') return anime.status === 'Currently Airing';
        if (statusFilter === 'finished') return anime.status === 'Finished Airing';
        return true;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'time') {
        const timeA = a.broadcast?.time || '99:99';
        const timeB = b.broadcast?.time || '99:99';
        return timeA.localeCompare(timeB);
      }
      if (sortBy === 'score') {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        return scoreB - scoreA;
      }
      if (sortBy === 'title') {
        const nameA = a.title_korean || a.title;
        const nameB = b.title_korean || b.title;
        return nameA.localeCompare(nameB, 'ko');
      }
      return 0;
    });

    return result;
  }, [schedule, searchQuery, selectedGenres, statusFilter, sortBy]);

  // OTT Apple-TV style Spotlight Anime Selection (Select top rated anime today)
  const spotlightAnime = useMemo(() => {
    const scoredList = schedule.filter((a) => a.score && a.images?.jpg?.large_image_url);
    if (scoredList.length === 0) return schedule[0] || null;
    return scoredList.sort((a, b) => (b.score || 0) - (a.score || 0))[0] || null;
  }, [schedule]);

  // Group anime schedule chronologically by hour index
  const chronologicalGroups = useMemo(() => {
    const groups: Record<string, AnimeSchedule[]> = {};
    
    processedSchedule.forEach((anime) => {
      let key = '시간 정보 없음';
      if (anime && anime.broadcast && typeof anime.broadcast.time === 'string' && anime.broadcast.time.includes(':')) {
        const [h] = anime.broadcast.time.split(':');
        const hourNum = parseInt(h, 10);
        if (!isNaN(hourNum)) {
          const ampm = hourNum >= 12 ? '오후' : '오전';
          const displayHour = hourNum % 12 || 12;
          key = `${ampm} ${displayHour}시 방영`;
        }
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(anime);
    });

    return groups;
  }, [processedSchedule]);

  // Sort chronological group keys properly
  const sortedGroupKeys = useMemo(() => {
    return Object.keys(chronologicalGroups).sort((a, b) => {
      if (a === b) return 0;
      if (a === '시간 정보 없음') return 1;
      if (b === '시간 정보 없음') return -1;
      
      const parseKey = (key: string) => {
        const isPM = key.startsWith('오후');
        const hour = parseInt(key.replace(/[^0-9]/g, ''), 10);
        let absoluteHour = isNaN(hour) ? 99 : (hour === 12 ? 0 : hour);
        if (isPM && !isNaN(hour)) absoluteHour += 12;
        return absoluteHour;
      };
      
      return parseKey(a) - parseKey(b);
    });
  }, [chronologicalGroups]);

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] antialiased">
      
      {/* 슬림하고 정교한 헤더 (Vercel Style) */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center">
            <h1 className="text-sm font-black tracking-widest text-white lowercase select-none">
              blank.sch
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              title="새로고침"
              className="p-1.5 rounded bg-[#09090b] border border-[#18181b] text-[#a1a1aa] hover:text-white transition duration-200"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="환경설정"
              className="p-1.5 rounded bg-[#09090b] border border-[#18181b] text-[#a1a1aa] hover:text-white transition duration-200"
            >
              <Settings className="h-3 w-3" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        
        {/* 요일 선택 네비게이션 */}
        <section className="mb-6">
          <div className={`relative border p-1 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 ${
            blurIntensity === 'off' ? 'bg-[#09090b] border-[#18181b] backdrop-blur-none' :
            blurIntensity === 'heavy' ? 'bg-black/95 border-white/10 backdrop-blur-xl' :
            'bg-[#09090b]/90 border-[#18181b] backdrop-blur-md'
          }`}>
            {/* Sliding Liquid Glass Indicator */}
            <div 
              className={`absolute top-1 bottom-1 rounded-lg bg-gradient-to-b from-white/[0.08] to-white/[0.01] border border-white/[0.12] shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),_0_1px_1px_rgba(255,255,255,0.1),_0_12px_24px_rgba(0,0,0,0.8)] z-0 ${
                springSpeed === 'snappy' ? 'transition-all duration-[180ms] ease-out' :
                springSpeed === 'fast' ? 'transition-all duration-[280ms] ease-[cubic-bezier(0.25,1.4,0.4,1.15)]' :
                'transition-all duration-[420ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]'
              }`}
              style={{
                width: 'calc((100% - 8px) / 7)',
                left: `calc(4px + ${selectedDay} * (100% - 8px) / 7)`
              }}
            >
              {/* Inner Highlight Reflection */}
              <div className="absolute inset-0 rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_100%)] pointer-events-none" />
            </div>
            
            {/* Navigation Buttons Row */}
            <div className="relative z-10 grid grid-cols-7 gap-0.5">
              {DAYS_KR.map((day, index) => {
                const isToday = index === new Date().getDay();
                const isSelected = selectedDay === index;
                const enDay = DAYS_EN[index];
                
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setSelectedDay(index);
                      setSelectedGenres([]);
                    }}
                    className="group relative rounded-lg py-2.5 px-1 text-center transition-all duration-300 flex flex-col items-center justify-center gap-0.5 border border-transparent select-none cursor-pointer hover:bg-white/[0.02] active:scale-95"
                  >
                    <span className={`text-[8px] sm:text-[9px] font-bold tracking-widest transition-colors duration-300 ${
                      isSelected ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]' : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}>
                      {enDay}
                    </span>
                    <span className={`text-[10px] sm:text-[11px] font-black tracking-tight transition-colors duration-300 ${
                      isSelected ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-[#a1a1aa] group-hover:text-white'
                    }`}>
                      {day}요일
                    </span>
                    {isToday && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full transition-all duration-300 ${
                        isSelected 
                          ? 'bg-red-500 shadow-[0_0_8px_#ef4444] scale-125' 
                          : 'bg-zinc-600 shadow-[0_0_4px_rgba(255,255,255,0.1)]'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {warning && (
          <p className="mb-6 rounded border border-amber-500/10 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300 flex items-center gap-2">
            <Info className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
            <span>{warning}</span>
          </p>
        )}

        {/* 2. 대시보드 컨트롤 패널 */}
        <section className="mb-6 p-4 premium-panel rounded flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search input */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#a1a1aa]" />
              <input
                type="text"
                placeholder="제목, 스튜디오 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded bg-black border border-[#18181b] py-1.5 pl-8 pr-8 text-[11px] text-[#f5f5f7] placeholder-[#a1a1aa]/60 focus:outline-none focus:border-[#27272a] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#a1a1aa] hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap w-full md:w-auto gap-2 items-center justify-between md:justify-end">
              <div className="flex items-center gap-0.5 bg-black p-0.5 rounded border border-[#18181b]">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`text-[9px] font-semibold px-2.5 py-1 rounded transition ${
                    statusFilter === 'all' ? 'bg-[#27272a] text-white' : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setStatusFilter('airing')}
                  className={`text-[9px] font-semibold px-2.5 py-1 rounded transition ${
                    statusFilter === 'airing' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  방영중
                </button>
                <button
                  onClick={() => setStatusFilter('finished')}
                  className={`text-[9px] font-semibold px-2.5 py-1 rounded transition ${
                    statusFilter === 'finished' ? 'bg-[#27272a] text-[#cbd5e0]' : 'text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  완방
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#a1a1aa]">
                <SlidersHorizontal className="h-3 w-3 text-zinc-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'time' | 'score' | 'title')}
                  className="bg-black border border-[#18181b] text-white rounded px-2 py-1 text-[10px] font-semibold focus:outline-none"
                >
                  <option value="time">시간 순</option>
                  <option value="score">글로벌 평점 순</option>
                  <option value="title">가나다 순</option>
                </select>
              </div>
            </div>
          </div>

          {/* 장르 접이식 필터 목록 */}
          {availableGenres.length > 0 && (
            <div className="border-t border-[#18181b] pt-2.5">
              <div className="flex items-center justify-between mb-2">
                <button 
                  onClick={() => setIsGenreOpen(!isGenreOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-semibold text-[#a1a1aa] hover:text-white transition"
                >
                  <Filter className="h-3 w-3 text-zinc-500" />
                  <span>장르 필터 ({selectedGenres.length > 0 ? `${selectedGenres.length}개` : '전체'})</span>
                  {isGenreOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {selectedGenres.length > 0 && (
                  <button 
                    onClick={() => setSelectedGenres([])}
                    className="text-[9px] text-red-400 hover:underline transition"
                  >
                    초기화
                  </button>
                )}
              </div>
              
              {isGenreOpen && (
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 py-1 animate-fade-in">
                  {availableGenres.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`text-[9px] font-medium px-2 py-0.5 rounded border transition ${
                          isSelected 
                            ? 'bg-white/10 border-white/20 text-white' 
                            : 'bg-black border-[#18181b] text-[#a1a1aa] hover:text-white hover:border-[#27272a]'
                        }`}
                      >
                        {GENRE_MAP[genre] || genre}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
          {/* 3. 극단적 미니멀리즘 단일 카드 그리드 */}
        {loading ? (
          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
              <div key={num} className="shimmer-card rounded aspect-[3/4.2] opacity-30" />
            ))}
          </section>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded border border-red-500/10 bg-[#09090b] text-[#f5f5f7] p-6 text-center max-w-sm mx-auto">
            <Info className="h-8 w-8 text-red-500" />
            <h3 className="text-xs font-bold text-white">데이터 로드 실패</h3>
            <p className="text-[10px] text-[#a1a1aa] leading-relaxed">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="mt-3 rounded bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-[10px] font-semibold text-white transition"
            >
              다시 시도
            </button>
          </div>
        ) : processedSchedule.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-[#a1a1aa] bg-[#09090b] border border-[#18181b] rounded p-6 text-center">
            <CalendarDays className="h-8 w-8 text-zinc-700" />
            <h3 className="text-[11px] font-semibold text-[#f5f5f7]">해당하는 방영 정보가 없습니다</h3>
          </div>
        ) : (
          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {processedSchedule.map((show) => {
              const imageUrl = show.images?.jpg?.large_image_url ?? show.images?.jpg?.image_url;

              return (
                <article
                  key={`${show.mal_id}-${show.broadcast?.time ?? 'na'}`}
                  onClick={() => setActiveAnime(show)}
                  className="group relative overflow-hidden rounded bg-[#09090b] border border-[#18181b] hover:border-zinc-700 transition-all duration-200 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[3/4.2] overflow-hidden bg-black shrink-0">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={show.title_korean ?? show.title}
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#a1a1aa] bg-[#09090b] font-medium text-[9px]">No Image</div>
                    )}

                    {/* Airing / Completed tag */}
                    {show.status === 'Currently Airing' ? (
                      <span className="absolute right-2 top-2 rounded bg-red-500/10 border border-red-500/20 px-1 py-0.5 text-[8px] font-semibold text-red-400">
                        ON
                      </span>
                    ) : (
                      <span className="absolute right-2 top-2 rounded bg-black/60 px-1 py-0.5 text-[8px] font-semibold text-[#a1a1aa]">
                        완방
                      </span>
                    )}

                    {/* Star Badge */}
                    {showRatings && show.score && (
                      <span className="absolute left-2 top-2 rounded bg-black/80 px-1 py-0.5 text-[8px] font-medium text-amber-400 flex items-center gap-0.5">
                        ★ {show.score.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 flex flex-col justify-between flex-1 min-h-[74px] bg-[#09090b]">
                    <h4 className="line-clamp-2 text-[11px] font-bold text-[#e1e1e6] group-hover:text-white transition-colors leading-tight">
                      {show.title_korean ?? show.title}
                    </h4>

                    <div className="flex flex-col gap-0.5 mt-2 text-[9px] text-[#a1a1aa] font-semibold">
                      <div className="flex items-center justify-between border-t border-[#18181b]/50 pt-1.5">
                        <span className="text-[#f5f5f7] flex items-center gap-0.5">
                          <Clock3 className="h-2.5 w-2.5 text-zinc-500" />
                          {show.broadcast?.time ? formatTime(show.broadcast.time) : '미정'}
                        </span>
                        {show.studios && show.studios.length > 0 && (
                          <span className="truncate max-w-[65px] text-right font-medium text-[#a1a1aa]">
                            {show.studios[0].name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* SCROLL TO TOP */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-xl hover:bg-red-500 transition duration-200"
          title="위로 이동"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* TMDB API SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl premium-modal p-5 shadow-2xl z-10 border border-white/5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute right-4 top-4 text-[#718096] hover:text-white"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-4.5 w-4.5 text-zinc-400" />
              <h3 className="text-sm font-bold text-white">환경설정</h3>
            </div>
            
            <form onSubmit={handleSaveSettings} className="space-y-4">
              
              {/* 섹션 1: 기능 제어 */}
              <div className="space-y-2 border-b border-[#18181b] pb-3">
                <h4 className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase mb-2">기능 제어</h4>
                
                {/* 24시간 형식 */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-300">24시간 시간제 표시</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={timeFormat24}
                      onChange={(e) => setTimeFormat24(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-zinc-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* 별점 평점 */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-300">편성표 별점 평점 표시</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={showRatings}
                      onChange={(e) => setShowRatings(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-zinc-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* 세이프 모드 */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-zinc-300">세이프 모드 (Safe Mode)</span>
                    <span className="text-[8px] text-zinc-500">성인용(R-17+/Rx) 및 19금 장르 차단</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={safeMode}
                      onChange={(e) => setSafeMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-zinc-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>
              </div>

              {/* 섹션 2: 테마 & 인터랙션 */}
              <div className="space-y-3 border-b border-[#18181b] pb-3">
                <h4 className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase">테마 & 인터랙션</h4>
                
                {/* 블러 강도 */}
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">유리 글라스 블러 강도</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#060709] p-0.5 rounded border border-[#1a1c23]">
                    {(['off', 'medium', 'heavy'] as const).map((intensity) => (
                      <button
                        key={intensity}
                        type="button"
                        onClick={() => setBlurIntensity(intensity)}
                        className={`py-1 text-[9px] font-bold rounded transition ${
                          blurIntensity === intensity 
                            ? 'bg-zinc-800 text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {intensity === 'off' ? 'Off' : intensity === 'medium' ? 'Medium' : 'Heavy'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 요일 스프링 강도 */}
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">요일 전환 물리 탄성 (Elastic)</label>
                  <div className="grid grid-cols-3 gap-1 bg-[#060709] p-0.5 rounded border border-[#1a1c23]">
                    {(['snappy', 'fluid', 'fast'] as const).map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => setSpringSpeed(speed)}
                        className={`py-1 text-[9px] font-bold rounded transition ${
                          springSpeed === speed 
                            ? 'bg-zinc-800 text-white shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {speed === 'snappy' ? 'Snappy' : speed === 'fluid' ? 'Fluid' : 'Fast'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 섹션 3: TMDB 연동 */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-bold text-zinc-500 tracking-wider uppercase mb-1">TMDB 번역 매핑</h4>
                <div className="bg-[#060709] border border-[#1a1c23] p-2.5 rounded-lg space-y-2">
                  <label className="block text-[9px] font-bold text-zinc-400">TMDB API Key (v3)</label>
                  <input
                    type="password"
                    placeholder="API 키가 없을 시 자동 한글 번역 사전 가동"
                    value={settingsKeyValue}
                    onChange={(e) => setSettingsKeyValue(e.target.value)}
                    className="w-full rounded bg-black border border-[#18181b] py-1.5 px-2 text-[10px] font-mono text-[#cbd5e0] focus:outline-none focus:border-[#2d313f] placeholder-zinc-700"
                  />
                </div>
              </div>

              {/* 액션 버튼 그룹 */}
              <div className="flex flex-col gap-1.5 pt-2">
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-500 transition shadow-md shadow-red-900/10 cursor-pointer"
                  >
                    설정 저장
                  </button>
                  {tmdbKey && (
                    <button
                      type="button"
                      onClick={handleClearSettings}
                      className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    >
                      지우기
                    </button>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={handleFactoryReset}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/20 py-1.5 text-[9px] font-bold text-zinc-500 hover:text-red-400 hover:border-red-900/30 hover:bg-red-950/10 transition cursor-pointer"
                >
                  기기 데이터 공장 초기화 (Factory Reset)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED OVERLAY MODAL (Theatrical Dark overlay) */}
      {activeAnime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/85 backdrop-blur-xs"
            onClick={() => setActiveAnime(null)}
          />
          
          <div className="relative w-full max-w-4xl rounded-2xl premium-modal overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] z-10 border border-white/5 animate-fade-in">
            
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-10 overflow-hidden">
              <img 
                src={activeAnime.images?.jpg?.large_image_url ?? activeAnime.images?.jpg?.image_url} 
                alt="" 
                className="w-full h-full object-cover scale-150 blur-2xl" 
              />
            </div>

            <button
              onClick={() => setActiveAnime(null)}
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 border border-white/5 text-[#a0aec0] hover:text-white transition duration-200"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left Column: Widescreen Poster & streaming buttons */}
            <div className="w-full md:w-[260px] p-5 flex flex-col border-b md:border-b-0 md:border-r border-[#1a1c23] flex-shrink-0 bg-[#0d0f13]/60">
              <div className="relative aspect-[3/4.2] w-full rounded-lg bg-[#060709] overflow-hidden border border-white/5 shadow-md">
                {activeAnime.images?.jpg?.large_image_url || activeAnime.images?.jpg?.image_url ? (
                  <img 
                    src={activeAnime.images?.jpg?.large_image_url ?? activeAnime.images?.jpg?.image_url} 
                    alt={activeAnime.title_korean ?? activeAnime.title} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#718096] bg-black font-black text-xs">No Poster</div>
                )}
              </div>

              {/* streaming hubs */}
              <div className="flex flex-col gap-2 mt-4">
                <span className="text-[9px] font-bold text-[#718096] uppercase tracking-wider pl-1 flex items-center gap-1">
                  <Layers className="h-3 w-3 text-red-500" />
                  바로가기 서비스
                </span>
                
                <a 
                  href={`https://laftel.net/search?q=${encodeURIComponent(activeAnime.title_korean || activeAnime.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-purple-500/10 border border-purple-500/20 px-3.5 py-2.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition group"
                >
                  <span className="flex items-center gap-2">
                    <Play className="h-3.5 w-3.5 fill-purple-300" />
                    라프텔 검색
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <a 
                  href={`https://namu.wiki/w/${encodeURIComponent(activeAnime.title_korean || activeAnime.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs font-bold text-[#cbd5e0] hover:bg-white/10 transition group"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-slate-300" />
                    나무위키 검색
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent((activeAnime.title_korean || activeAnime.title) + " 애니메이션")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition group"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-3.5 w-3.5 text-red-400" />
                    구글 검색
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-red-500 group-hover:translate-x-0.5 transition-transform" />
                </a>

                <a 
                  href={`https://myanimelist.net/anime/${activeAnime.mal_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg bg-[#060709] border border-white/5 px-3.5 py-2.5 text-[11px] font-semibold text-[#a0aec0] hover:text-white transition group"
                >
                  <span>MyAnimeList 정보</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Right Column: Full Info, Synopsis and Youtube embedded player */}
            <div className="flex-1 p-5 overflow-y-auto min-w-0 flex flex-col justify-between">
              <div>
                {/* Title names */}
                <div className="space-y-1 mb-4 pr-6">
                  <h2 className="text-lg md:text-xl font-black text-white leading-tight">
                    {activeAnime.title_korean ?? activeAnime.title}
                  </h2>
                  <div className="flex flex-col gap-0.5 text-[10px]">
                    {activeAnime.title_japanese && (
                      <p className="text-[#a0aec0] font-semibold">{activeAnime.title_japanese}</p>
                    )}
                    {activeAnime.title_korean && activeAnime.title_korean !== activeAnime.title && (
                      <p className="text-[#718096] font-medium">{activeAnime.title}</p>
                    )}
                  </div>
                </div>

                {/* score ranks */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {activeAnime.score && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/25 px-2 py-1 text-xs font-black text-amber-400">
                      ★ {activeAnime.score.toFixed(2)}
                    </span>
                  )}
                  {activeAnime.rank && (
                    <span className="inline-flex items-center gap-1 rounded bg-red-600/10 border border-red-500/25 px-2 py-1 text-xs font-bold text-red-400">
                      <Award className="h-3.5 w-3.5" />
                      순위 #{activeAnime.rank}위
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded bg-[#1a1c23] px-2 py-1 text-xs text-[#cbd5e0] font-bold border border-white/5">
                    <Clock3 className="h-3.5 w-3.5 text-red-500" />
                    시간: {formatTime(activeAnime.broadcast?.time)}
                  </span>
                </div>

                {/* stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 border-y border-[#1a1c23] py-3.5 mb-4 text-[11px]">
                  <div>
                    <span className="block text-[#718096] font-bold mb-0.5">제작사</span>
                    <span className="font-semibold text-[#cbd5e0]">
                      {activeAnime.studios && activeAnime.studios.length > 0 
                        ? activeAnime.studios.map(s => s.name).join(', ') 
                        : '정보 없음'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#718096] font-bold mb-0.5">에피소드</span>
                    <span className="font-semibold text-[#cbd5e0]">
                      {activeAnime.episodes ? `${activeAnime.episodes}화 완결` : '미정 (방영 중)'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#718096] font-bold mb-0.5">상영 시간</span>
                    <span className="font-semibold text-[#cbd5e0]">{activeAnime.duration ?? '정보 없음'}</span>
                  </div>
                  <div>
                    <span className="block text-[#718096] font-bold mb-0.5">원작 소스</span>
                    <span className="font-semibold text-[#cbd5e0]">{activeAnime.source ?? '정보 없음'}</span>
                  </div>
                  <div>
                    <span className="block text-[#718096] font-bold mb-0.5">시청 등급</span>
                    <span className="font-semibold text-[#cbd5e0] line-clamp-1" title={activeAnime.rating}>
                      {activeAnime.rating ?? '정보 없음'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#718096] font-bold mb-0.5">요일 정보</span>
                    <span className="font-semibold text-[#cbd5e0]">
                      {activeAnime.broadcast?.day ?? '정보 없음'}
                    </span>
                  </div>
                </div>

                {/* Synopsis content */}
                <div className="mb-4">
                  <span className="block text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-1.5">시놉시스</span>
                  <div className="rounded-lg bg-black/40 p-3 border border-white/5 max-h-36 overflow-y-auto">
                    <p className="text-[11px] text-[#a0aec0] leading-relaxed whitespace-pre-line">
                      {activeAnime.synopsis ?? '제공되는 시놉시스가 존재하지 않습니다.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* YouTube Video iframe */}
              {activeAnime.trailer?.youtube_id && (
                <div className="border-t border-[#1a1c23] pt-3.5">
                  <span className="block text-[10px] font-bold text-[#718096] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                    공식 예고편
                  </span>
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-white/5 shadow-md bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${activeAnime.trailer.youtube_id}`}
                      title={`${activeAnime.title} Official Trailer`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
