import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Clock3, Globe2, Info, Tv } from 'lucide-react';
import axios from 'axios';

interface AnimeSchedule {
  mal_id: number;
  title: string;
  title_japanese?: string;
  title_korean?: string;
  broadcast?: {
    day?: string;
    time?: string;
  };
  status: string;
  genres?: Array<{ name: string }>;
  demographics?: Array<{ name: string }>;
  studios?: Array<{ name: string }>;
  images?: {
    jpg?: {
      image_url?: string;
      large_image_url?: string;
    };
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
  'wishcat',
  'tiny ping',
  'ninjala',
  'chibi maruko',
  'sazae',
  'doraemon',
  'crayon shin-chan',
  'pokemon',
  'digimon',
  'youkai watch',
  'anpanman',
  'mini mini',
  'minimini',
  'miniforce',
  'ping pong',
  'pingu',
  'pororo',
  'tayo',
  'robocar',
  'larva',
  'kongsuni',
  'cocomong',
  'tobot',
  'power battle watch',
  'pochaazu',
  'rakuten',
  'bonobono',
  'detective conan',
  'case closed',
  'pretty cure',
  'precure',
  'i-pre',
  'ipre',
  'manul no yuube',
  'mashin souzou-sen wataru',
  'shin nippon history',
  'kinnikuman',
  'wish cat',
  'tiniping',
  'ウィッシュキャット',
  'ティニピン',
  'キン肉マン',
  'まぬるの夕べ',
  '魔神創造伝ワタル',
  '新日本史',
  'キン肉マンII世',
  'シューティングスター',
  'ぼのぼの',
  'コナン',
  'プリキュア',
  'ドラえもん',
  'クレヨンしんちゃん',
  'ポケットモンスター',
  'デジモン',
  '妖怪ウォッチ',
  'アンパンマン',
  'ミニミニ',
  'ピングー',
  'ポロロ',
  'タヨ',
  'ロボカー',
  'ラーバ',
  'コンスニ',
  'ココモン',
  'トボット',
  'パワーバトルウォッチカー',
  'ポチャーズ',
  'pochazu',
  'pochaaz',
  'ぽちゃーず',
  'ぽちゃーズ',
];

const excludedStudios = [
  'tencent',
  'bilibili',
  'dongwoo',
  'iconix',
  'toei animation',
  'studio pierrot',
  'tms entertainment',
  'shin-ei animation',
  'tv tokyo',
  'olm',
  'sunrise',
  'bandai namco pictures',
];

const excludedGenres = ['kids', 'children', 'family', 'educational', 'kodomo'];

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAYS_KR = ['일', '월', '화', '수', '목', '금', '토'];

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣ぁ-んァ-ン一-龯]/g, '');
}

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

function App() {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [schedule, setSchedule] = useState<AnimeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const shouldExcludeAnime = useCallback((anime: AnimeSchedule) => {
    const titleLower = anime.title.toLowerCase();
    const japaneseTitleLower = anime.title_japanese?.toLowerCase() || '';

    const hasExcludedKeyword = excludedKeywords.some((keyword) => {
      const normalizedKeyword = keyword.toLowerCase();
      return titleLower.includes(normalizedKeyword) || japaneseTitleLower.includes(normalizedKeyword);
    });

    const hasExcludedStudio = anime.studios?.some((studio) =>
      excludedStudios.some((excludedStudio) => studio.name.toLowerCase().includes(excludedStudio.toLowerCase())),
    );

    const hasKodomoDemographic = anime.demographics?.some((demo) => {
      const name = demo.name.toLowerCase();
      return name === 'kids' || name === 'kodomo';
    });

    const hasExcludedGenre = anime.genres?.some((genre) =>
      excludedGenres.some((excludedGenre) => genre.name.toLowerCase().includes(excludedGenre.toLowerCase())),
    );

    return Boolean(hasExcludedKeyword || hasExcludedStudio || hasKodomoDemographic || hasExcludedGenre);
  }, []);

  const fetchKoreanTitle = useCallback(async (title: string, japaneseTitle = '') => {
    if (!TMDB_API_KEY) return title;

    const doSearch = async (query: string) => {
      const response = await axios.get<TMDBSearchResult>('https://api.themoviedb.org/3/search/tv', {
        params: { api_key: TMDB_API_KEY, query, language: 'ko-KR', include_adult: false },
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
  }, []);

  useEffect(() => {
    let isActive = true;

    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      setWarning(null);

      try {
        const allAnime: AnimeSchedule[] = [];
        let page = 1;
        let hasNext = true;

        while (hasNext) {
          const response = await axios.get<JikanScheduleResponse>('https://api.jikan.moe/v4/schedules', {
            params: { filter: DAYS[selectedDay], limit: 25, sfw: true, page },
          });

          if (!response.data?.data) throw new Error('잘못된 데이터 형식');
          allAnime.push(...response.data.data);
          hasNext = Boolean(response.data.pagination?.has_next_page);
          page += 1;
        }

        const filteredAnime = allAnime
          .filter((anime) => !shouldExcludeAnime(anime))
          .filter((anime, index, self) => index === self.findIndex((item) => item.mal_id === anime.mal_id));

        if (!TMDB_API_KEY) {
          setWarning('TMDB API 키가 없어 한국어 제목 자동 번역이 비활성화됩니다.');
        }

        const batchSize = 4;
        const titlesWithKorean: AnimeSchedule[] = [];

        for (let i = 0; i < filteredAnime.length; i += batchSize) {
          const batch = filteredAnime.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map(async (anime) => ({
              ...anime,
              title_korean: await fetchKoreanTitle(anime.title, anime.title_japanese),
            })),
          );
          titlesWithKorean.push(...batchResults);
        }

        if (isActive) setSchedule(titlesWithKorean);
      } catch (err) {
        if (!isActive) return;
        const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다';
        setError(errorMessage);
        setSchedule([]);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchSchedule();

    return () => {
      isActive = false;
    };
  }, [selectedDay, shouldExcludeAnime, fetchKoreanTitle]);

  const formatTime = useCallback((timeString: string | undefined) => {
    if (!timeString) return '시간 미정';
    const [hours, minutes] = timeString.split(':');
    const hour = Number.parseInt(hours, 10);
    const ampm = hour >= 12 ? '오후' : '오전';
    const hour12 = hour % 12 || 12;
    return `${ampm} ${hour12}:${minutes}`;
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <h1 className="text-lg font-semibold tracking-tight">백지스케줄</h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
            <Globe2 className="h-3.5 w-3.5" /> 현지 시간 기준
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {DAYS_KR.map((day, index) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(index)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                selectedDay === index ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {day}
            </button>
          ))}
        </nav>

        {warning && <p className="mb-4 rounded-lg border border-amber-700/40 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">{warning}</p>}

        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">불러오는 중...</div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-300">
            <Info className="h-8 w-8 text-rose-400" />
            <p>데이터를 불러오는데 실패했습니다.</p>
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        ) : schedule.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-300">
            <CalendarDays className="h-8 w-8 text-slate-500" />
            <p>편성표 정보가 없습니다.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schedule.map((show) => {
              const imageUrl = show.images?.jpg?.large_image_url ?? show.images?.jpg?.image_url;

              return (
                <article key={`${show.mal_id}-${show.broadcast?.time ?? 'na'}`} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                  <div className="relative h-44 bg-slate-800">
                    {imageUrl ? (
                      <img src={imageUrl} alt={show.title_korean ?? show.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-500">No Image</div>
                    )}
                    {show.status === 'Currently Airing' && (
                      <span className="absolute right-2 top-2 rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-emerald-950">방영중</span>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h2 className="line-clamp-2 text-base font-semibold text-white">{show.title_korean ?? show.title}</h2>
                      {show.title_japanese && <p className="mt-1 line-clamp-1 text-xs text-slate-400">{show.title_japanese}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatTime(show.broadcast?.time)}
                      </span>
                      {!!show.broadcast?.day && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1">
                          <Tv className="h-3.5 w-3.5" />
                          {show.broadcast.day}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {show.genres?.slice(0, 4).map((genre) => (
                        <span key={`${show.mal_id}-${genre.name}`} className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-300">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
