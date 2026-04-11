import { IoCompassOutline } from 'react-icons/io5';
import ExploreClient from './_components/ExploreClient';
import type {
   AnimeCard,
   ExploreSectionData,
   JikanListResponse,
} from '@/lib/types/anime';

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
   const response = await fetch(url, {
      next: { revalidate: 1800 },
   }).catch(() => null);

   if (!response?.ok) {
      return null;
   }

   return (await response.json()) as JikanListResponse<AnimeCard>;
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

   const isSearchMode = Boolean(genre || status || q);

   let initialAnime: AnimeCard[] = [];
   let initialHasMore = false;

   if (isSearchMode) {
      const searchParamsValue = new URLSearchParams({
         limit: '24',
         page: '1',
         order_by: 'popularity',
         sort: 'asc',
      });

      if (genre) searchParamsValue.set('genres', genre);
      if (status) searchParamsValue.set('status', status);
      if (q) searchParamsValue.set('q', q);

      const searchData = await fetchAnimeList(
         `https://api.jikan.moe/v4/anime?${searchParamsValue.toString()}`,
      );
      initialAnime = searchData?.data || [];
      initialHasMore = Boolean(searchData?.pagination?.has_next_page);
   }

   const weekday = getCurrentWeekday();

   const [trendingData, newReleaseData, seasonHighlightData] =
      await Promise.all([
         fetchAnimeList(
            'https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=12',
         ),
         fetchAnimeList(
            `https://api.jikan.moe/v4/schedules?filter=${weekday.key}&limit=12`,
         ),
         fetchAnimeList(
            'https://api.jikan.moe/v4/seasons/now?limit=12&order_by=score&sort=desc',
         ),
      ]);

   const sections: ExploreSectionData[] = [
      {
         id: 'trending',
         title: 'Trending Anime',
         description: 'Most watched and talked-about titles right now.',
         items: trendingData?.data || [],
      },
      {
         id: 'new-release',
         title: `New Release · ${weekday.label}`,
         description:
            "Fresh episodes airing this week based on today's schedule.",
         items: newReleaseData?.data || [],
      },
      {
         id: 'season-highlights',
         title: 'Season Highlights',
         description: 'Top rated picks from the current season lineup.',
         items: seasonHighlightData?.data || [],
      },
   ];

   return (
      <main
         data-header-scroll-container="true"
         className="flex-1 relative min-h-screen w-full min-w-0 overflow-y-auto bg-[#0B0E14] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
         {/* 標題 Header 區塊 */}
         <div className="relative pt-24 pb-6 px-6 md:px-8 lg:px-12 bg-linear-to-b from-[#0B0E14] via-[#0B0E14]/90 to-transparent z-10">
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
            key={`${genre}-${status}-${q}`} // 確保瀏覽器上一頁/下一頁時，組件能完美重置並同步狀態
            initialAnime={initialAnime}
            initialHasMore={initialHasMore}
            initialGenre={genre}
            initialStatus={status}
            initialQuery={q}
            sections={sections}
         />
      </main>
   );
}
