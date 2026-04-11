// 這是 app/(pages)/explore/page.tsx (與客戶端分離的 Server Component)
import { IoCompassOutline } from 'react-icons/io5';
import ExploreClient from './_components/ExploreClient';
import type {
   AnimeCard,
   ExploreSectionData,
   JikanListResponse,
} from '@/lib/types/anime';

// 多語言翻譯層：將中/日文標題透過 Anilist 轉換為 Romaji/English 讓 Jikan 精準搜尋
async function translateSearchQuery(query: string): Promise<string> {
   if (!query || !/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(query)) {
      return query;
   }
   try {
      const res = await fetch('https://graphql.anilist.co', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            query: `query($search: String) { Media(search: $search, type: ANIME, sort: SEARCH_MATCH) { title { romaji english } } }`,
            variables: { search: query }
         })
      });
      if (!res.ok) return query;
      const data = await res.json();
      const title = data?.data?.Media?.title;
      return title?.romaji || title?.english || query;
   } catch {
      return query;
   }
}

function pickParamValue(value: string | string[] | undefined): string {
   if (Array.isArray(value)) {
      return value[0] ?? '';
   }
   return value ?? '';
}

function getCurrentWeekday() {
   const weekdays = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
   ] as const;

   const dayKey = weekdays[new Date().getDay()] ?? 'monday';
   const dayLabel = `${dayKey.charAt(0).toUpperCase()}${dayKey.slice(1)}`;

   return {
      key: dayKey,
      label: dayLabel,
   };
}

async function fetchAnimeList(
   url: string,
): Promise<JikanListResponse<AnimeCard> | null> {
   try {
      const response = await fetch(url, {
         next: { revalidate: 1800 },
      });
      if (!response.ok) {
         return null;
      }
      return (await response.json()) as JikanListResponse<AnimeCard>;
   } catch (error) {
      return null;
   }
}

export default async function ExplorePage({
   searchParams,
}: {
   searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
   const resolvedParams = await searchParams;
   const genre = pickParamValue(resolvedParams.genre);
   const status = pickParamValue(resolvedParams.status);
   const q = pickParamValue(resolvedParams.q).trim();
   const type = pickParamValue(resolvedParams.type);
   const sort = pickParamValue(resolvedParams.sort) || 'popularity-asc';

   const isSearchMode = Boolean(
      genre || status || q || type || sort !== 'popularity-asc',
   );

   let initialAnime: AnimeCard[] = [];
   let initialHasMore = false;

   if (isSearchMode) {
      const searchParamsValue = new URLSearchParams({
         limit: '24',
         page: '1',
      });

      // 當有搜尋關鍵字且沒有手動切換排序時，不發送 order_by，讓 API 使用預設的「相關度 (Relevance)」排序
      const isDefaultSort = sort === 'popularity-asc';
      if (!q || !isDefaultSort) {
         const [orderBy, sortDir] = sort.split('-');
         searchParamsValue.set('order_by', orderBy || 'popularity');
         searchParamsValue.set('sort', sortDir || 'asc');
      }
      searchParamsValue.set('sfw', 'true'); // 過濾掉不適宜的奇怪結果

      if (genre) searchParamsValue.set('genres', genre);
      if (status) searchParamsValue.set('status', status);
      if (type) searchParamsValue.set('type', type);
      
      if (q) {
         // 攔截並翻譯 CJK 查詢字串
         const translatedQ = await translateSearchQuery(q);
         searchParamsValue.set('q', translatedQ);
      }

      const searchData = await fetchAnimeList(
         `https://api.jikan.moe/v4/anime?${searchParamsValue.toString()}`,
      );
      initialAnime = Array.from(
         new Map((searchData?.data || []).map((item) => [item.mal_id, item])).values(),
      ) as AnimeCard[];
      initialHasMore = Boolean(searchData?.pagination?.has_next_page);
   }

   const weekday = getCurrentWeekday();

   let trendingData: JikanListResponse<AnimeCard> | null = null;
   let newReleaseData: JikanListResponse<AnimeCard> | null = null;
   let seasonHighlightData: JikanListResponse<AnimeCard> | null = null;

   // 效能與 Rate Limit 優化：如果正在搜尋，就不要浪費資源去抓不會顯示的推薦清單
   if (!isSearchMode) {
      const results = await Promise.all([
            fetchAnimeList(
               'https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=24',
            ),
            fetchAnimeList(
               `https://api.jikan.moe/v4/schedules?filter=${weekday.key}&limit=24`,
            ),
            fetchAnimeList(
               'https://api.jikan.moe/v4/seasons/now?limit=24&order_by=score&sort=desc',
            ),
         ]);
      trendingData = results[0];
      newReleaseData = results[1];
      seasonHighlightData = results[2];
   }

   // 跨區塊全域去重：確保同一個動漫只會出現在一個分類中（增加畫面多樣性）
   const seenMalIds = new Set<number>();

   const uniqueSchedule = (newReleaseData?.data || []).filter((item) => {
      if (seenMalIds.has(item.mal_id)) return false;
      seenMalIds.add(item.mal_id);
      return true;
   });

   const uniqueSeason = (seasonHighlightData?.data || []).filter((item) => {
      if (seenMalIds.has(item.mal_id)) return false;
      seenMalIds.add(item.mal_id);
      return true;
   });

   const uniqueTrending = (trendingData?.data || []).filter((item) => {
      if (seenMalIds.has(item.mal_id)) return false;
      seenMalIds.add(item.mal_id);
      return true;
   });

   const sections: ExploreSectionData[] = [
      {
         id: 'new-release',
         title: `New Release · ${weekday.label}`,
         description:
            "Fresh episodes airing this week based on today's schedule.",
         items: uniqueSchedule,
      },
      {
         id: 'season-highlights',
         title: 'Season Highlights',
         description: 'Top rated picks from the current season lineup.',
         items: uniqueSeason,
      },
      {
         id: 'trending',
         title: 'Trending Anime',
         description: 'Most watched and talked-about titles right now.',
         items: uniqueTrending,
      },
   ];

   return (
      <main
         data-header-scroll-container="true"
         className="flex-1 relative min-h-screen w-full min-w-0 overflow-y-auto bg-[#0B0E14] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
         {/* 標題 Header 區塊 */}
         <div className="relative pt-25 pb-4 px-6 md:px-8 bg-linear-to-b from-[#0B0E14] via-[#0B0E14]/90 to-transparent z-10">
            <div className="flex items-center gap-3 mb-2">
               <IoCompassOutline
                  className="text-anime-primary drop-shadow-[0_0_15px_rgba(160,124,254,0.6)]"
                  size={36}
               />
               <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide drop-shadow-md">
                  Explore
               </h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mt-2">
               {isSearchMode
                  ? 'Search mode is active. Showing filtered results with quick actions.'
                  : 'Browse curated sections by trend, release day, and season highlights.'}
            </p>
         </div>

         {/* 互動式客戶端組件 (分區塊瀏覽 + 搜尋結果清單) */}
         <ExploreClient
            key={`${genre}-${status}-${q}-${type}-${sort}`}
            initialAnime={initialAnime}
            initialHasMore={initialHasMore}
            initialGenre={genre}
            initialStatus={status}
            initialType={type}
            initialSort={sort}
            initialQuery={q}
            initialWeekday={weekday.key}
            initialSchedule={uniqueSchedule}
            sections={sections}
         />
      </main>
   );
}
