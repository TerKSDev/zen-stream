'use client';

import {
   Fragment,
   useCallback,
   useEffect,
   useMemo,
   useRef,
   useState,
} from 'react';
import { Listbox, Transition } from '@headlessui/react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
   IoCheckmark,
   IoChevronDown,
   IoHeart,
   IoHeartOutline,
   IoPlayCircle,
   IoSearch,
   IoStar,
   IoCalendarOutline,
   IoCompassOutline,
} from 'react-icons/io5';
import { PATHS } from '@/lib/config/route';
import type {
   AnimeCard,
   ExploreSectionData,
   JikanListResponse,
} from '@/lib/types/anime';

type FilterOption = {
   id: string;
   name: string;
};

interface ExploreClientProps {
   initialAnime: AnimeCard[];
   initialHasMore: boolean;
   initialGenre: string;
   initialStatus: string;
   initialType: string;
   initialSort: string;
   initialQuery: string;
   initialWeekday: string;
   initialSchedule: AnimeCard[];
   sections: ExploreSectionData[];
}

interface FilterDropdownProps {
   label: string;
   value: string;
   options: FilterOption[];
   onChange: (value: string) => void;
}

const GENRES: FilterOption[] = [
   { id: '', name: 'All Genres' },
   { id: '1', name: 'Action' },
   { id: '2', name: 'Adventure' },
   { id: '4', name: 'Comedy' },
   { id: '8', name: 'Drama' },
   { id: '10', name: 'Fantasy' },
   { id: '14', name: 'Horror' },
   { id: '22', name: 'Romance' },
   { id: '24', name: 'Sci-Fi' },
   { id: '36', name: 'Slice of Life' },
   { id: '30', name: 'Sports' },
   { id: '37', name: 'Supernatural' },
   { id: '41', name: 'Suspense' },
];

const STATUSES: FilterOption[] = [
   { id: '', name: 'Any Status' },
   { id: 'airing', name: 'Currently Airing' },
   { id: 'complete', name: 'Finished Airing' },
   { id: 'upcoming', name: 'Upcoming' },
];

const TYPES: FilterOption[] = [
   { id: '', name: 'Any Format' },
   { id: 'tv', name: 'TV Series' },
   { id: 'movie', name: 'Movie' },
   { id: 'ova', name: 'OVA / Special' },
];

const SORTS: FilterOption[] = [
   { id: 'popularity-asc', name: 'Most Popular' },
   { id: 'score-desc', name: 'Highest Rated' },
   { id: 'favorites-desc', name: 'Most Favorited' },
   { id: 'start_date-desc', name: 'Newest First' },
];

const WEEKDAYS = [
   'monday',
   'tuesday',
   'wednesday',
   'thursday',
   'friday',
   'saturday',
   'sunday',
];

const FAVORITES_KEY = 'zen-stream-favorites';

function FilterDropdown({
   label,
   value,
   options,
   onChange,
}: FilterDropdownProps) {
   const selectedOption =
      options.find((option) => option.id === value) || options[0];

   return (
      <Listbox value={value} onChange={onChange}>
         <div className="relative min-w-35 flex-1 sm:flex-none">
            <Listbox.Button className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-white transition-all hover:border-anime-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-anime-primary/40">
               <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {label}
               </span>
               <span className="mt-0.5 block text-sm font-bold text-white pr-6 truncate">
                  {selectedOption.name}
               </span>
               <IoChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </Listbox.Button>

            <Transition
               as={Fragment}
               leave="transition ease-in duration-100"
               leaveFrom="opacity-100"
               leaveTo="opacity-0"
            >
               <Listbox.Options className="absolute z-50 mt-2 max-h-72 w-full min-w-max overflow-auto rounded-xl border border-white/10 bg-[#0B0E14]/95 p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl focus:outline-none">
                  {options.map((option) => (
                     <Listbox.Option
                        key={option.id || 'all'}
                        value={option.id}
                        className={({ active }) =>
                           `cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${
                              active
                                 ? 'bg-anime-primary/20 text-white'
                                 : 'text-slate-200'
                           }`
                        }
                     >
                        {({ selected }) => (
                           <div className="flex items-center justify-between gap-4">
                              <span className="whitespace-nowrap">
                                 {option.name}
                              </span>
                              {selected && (
                                 <IoCheckmark
                                    className="text-anime-primary shrink-0"
                                    size={16}
                                 />
                              )}
                           </div>
                        )}
                     </Listbox.Option>
                  ))}
               </Listbox.Options>
            </Transition>
         </div>
      </Listbox>
   );
}

export default function ExploreClient({
   initialAnime,
   initialHasMore,
   initialGenre,
   initialStatus,
   initialType,
   initialSort,
   initialQuery,
   initialWeekday,
   initialSchedule,
   sections,
}: ExploreClientProps) {
   const router = useRouter();
   const pathname = usePathname();

   const [animeList, setAnimeList] = useState<AnimeCard[]>(initialAnime);
   const [page, setPage] = useState(1);
   const [loading, setLoading] = useState(false);
   const [hasMore, setHasMore] = useState(initialHasMore);
   const [selectedGenre, setSelectedGenre] = useState(initialGenre);
   const [selectedStatus, setSelectedStatus] = useState(initialStatus);
   const [selectedType, setSelectedType] = useState(initialType);
   const [selectedSort, setSelectedSort] = useState(initialSort);
   const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

   const [selectedDay, setSelectedDay] = useState(initialWeekday);
   const [scheduleCache, setScheduleCache] = useState<
      Record<string, AnimeCard[]>
   >({
      [initialWeekday]: initialSchedule,
   });
   const [scheduleLoading, setScheduleLoading] = useState(false);

   const searchQuery = initialQuery.trim();
   const [currentTimeJST, setCurrentTimeJST] = useState<Date | null>(null);
   const isSearchMode = Boolean(
      searchQuery ||
      selectedGenre ||
      selectedStatus ||
      selectedType ||
      selectedSort !== 'popularity-asc',
   );

   const initialRender = useRef(true);
   const observer = useRef<IntersectionObserver | null>(null);
   const activeSearchQueryRef = useRef(searchQuery); // 用於記錄翻譯後的最終查詢字串給 loadMore 使用

   // 取得主內容區的 Sections（只過濾掉沒有內容的）
   const mainSections = useMemo(
      () => sections.filter((section) => section.items.length > 0),
      [sections],
   );

   // 初始化 JST 時間，每分鐘更新一次確保即時狀態 (呼吸燈特效使用)
   useEffect(() => {
      const updateJST = () => {
         setCurrentTimeJST(new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })));
      };
      updateJST();
      const timer = setInterval(updateJST, 60000);
      return () => clearInterval(timer);
   }, []);

   useEffect(() => {
      if (typeof window === 'undefined') return;
      try {
         const raw = localStorage.getItem(FAVORITES_KEY);
         if (!raw) return;
         const parsed = JSON.parse(raw);
         if (Array.isArray(parsed)) {
            setFavoriteIds(
               new Set(
                  parsed.filter((id): id is number => typeof id === 'number'),
               ),
            );
         }
      } catch {}
   }, []);

   const toggleFavorite = useCallback((animeId: number) => {
      setFavoriteIds((prev) => {
         const next = new Set(prev);
         next.has(animeId) ? next.delete(animeId) : next.add(animeId);
         if (typeof window !== 'undefined')
            localStorage.setItem(
               FAVORITES_KEY,
               JSON.stringify(Array.from(next)),
            );
         return next;
      });
   }, []);

   const buildSearchParams = useCallback(
      (pageNumber: number, overrideQuery?: string) => {
         const params = new URLSearchParams({
            limit: '24',
            page: String(pageNumber),
         });
         
         const q = overrideQuery !== undefined ? overrideQuery : searchQuery;
         if (q) params.set('q', q);

         // 當有搜尋關鍵字且使用者未手動切換排序時，取消 order_by 讓 API 使用預設的「相關度」排序
         const isDefaultSort = selectedSort === 'popularity-asc';
         if (!q || !isDefaultSort) {
            const [orderBy, sortDir] = selectedSort.split('-');
            params.set('order_by', orderBy || 'popularity');
            params.set('sort', sortDir || 'asc');
         }
         params.set('sfw', 'true'); // 過濾 NSFW 內容

         if (selectedGenre) params.set('genres', selectedGenre);
         if (selectedStatus) params.set('status', selectedStatus);
         if (selectedType) params.set('type', selectedType);
         return params;
      },
      [searchQuery, selectedGenre, selectedStatus, selectedType, selectedSort],
   );

   useEffect(() => {
      if (initialRender.current) {
         initialRender.current = false;
         return;
      }

      const paramsForUrl = new URLSearchParams();
      if (selectedGenre) paramsForUrl.set('genre', selectedGenre);
      if (selectedStatus) paramsForUrl.set('status', selectedStatus);
      if (selectedType) paramsForUrl.set('type', selectedType);
      if (selectedSort && selectedSort !== 'popularity-asc')
         paramsForUrl.set('sort', selectedSort);
      if (searchQuery) paramsForUrl.set('q', searchQuery);

      const nextUrl = paramsForUrl.toString()
         ? `${pathname}?${paramsForUrl.toString()}`
         : pathname;
      window.history.replaceState(null, '', nextUrl);

      if (!isSearchMode) {
         setAnimeList([]);
         setHasMore(false);
         setPage(1);
         setLoading(false);
         return;
      }

      // 立即設定 loading 狀態，避免在 450ms 延遲期間畫面閃現 "No Results Found."
      setLoading(true);

      const timerId = window.setTimeout(async () => {
         try {
            let activeQuery = searchQuery;
            
            // 如果字串包含中日韓文，透過 Anilist 即時翻譯成 Romaji，解決 Jikan 找不到中文與少於 3 個字的 Bug
            if (activeQuery && /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(activeQuery)) {
               try {
                  const transRes = await fetch('https://graphql.anilist.co', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                        query: `query($search: String) { Media(search: $search, type: ANIME, sort: SEARCH_MATCH) { title { romaji english } } }`,
                        variables: { search: activeQuery }
                     })
                  });
                  if (transRes.ok) {
                     const transData = await transRes.json();
                     const title = transData?.data?.Media?.title;
                     activeQuery = title?.romaji || title?.english || activeQuery;
                  }
               } catch (e) { /* fallback to original query */ }
            }

            activeSearchQueryRef.current = activeQuery;

            const response = await fetch(
               `https://api.jikan.moe/v4/anime?${buildSearchParams(1, activeQuery).toString()}`,
            );
            if (!response.ok) {
               setAnimeList([]);
               setHasMore(false);
               return; // 遇到 400 (字數不夠) 或 429 (Rate Limit) 時，優雅地清空結果，不拋出錯誤
            }

            const data =
               (await response.json()) as JikanListResponse<AnimeCard>;
            const uniqueData = Array.from(
               new Map(
                  (data.data || []).map((item) => [item.mal_id, item]),
               ).values(),
            ) as AnimeCard[];
            setAnimeList(uniqueData);
            setHasMore(Boolean(data.pagination?.has_next_page));
            setPage(1);
         } catch (error) {
            console.error(error);
         } finally {
            setLoading(false);
         }
      }, 450);

      return () => window.clearTimeout(timerId);
   }, [
      buildSearchParams,
      isSearchMode,
      pathname,
      searchQuery,
      selectedGenre,
      selectedStatus,
      selectedType,
      selectedSort,
   ]);

   const loadMore = useCallback(async () => {
      if (!isSearchMode || loading || !hasMore) return;
      setLoading(true);
      const nextPage = page + 1;
      try {
         const response = await fetch(
            `https://api.jikan.moe/v4/anime?${buildSearchParams(nextPage, activeSearchQueryRef.current).toString()}`,
         );
         if (!response.ok) {
            setHasMore(false);
            return;
         }

         const data = (await response.json()) as JikanListResponse<AnimeCard>;
         setAnimeList((prev) => {
            const existingIds = new Set(prev.map((a) => a.mal_id));
            const incomingUnique = Array.from(
               new Map(
                  (data.data || []).map((item) => [item.mal_id, item]),
               ).values(),
            ) as AnimeCard[];
            const incoming = incomingUnique.filter(
               (a) => !existingIds.has(a.mal_id),
            );
            return [...prev, ...incoming];
         });
         setPage(nextPage);
         setHasMore(Boolean(data.pagination?.has_next_page));
      } catch (error) {
         console.error(error);
      } finally {
         setLoading(false);
      }
   }, [buildSearchParams, hasMore, isSearchMode, loading, page]);

   const lastElementRef = useCallback(
      (node: HTMLDivElement | null) => {
         if (loading) return;
         if (observer.current) observer.current.disconnect();
         if (!isSearchMode || !hasMore) return;

         observer.current = new IntersectionObserver(
            (entries) => {
               if (entries[0].isIntersecting) loadMore();
            },
            { rootMargin: '420px' },
         );
         if (node) observer.current.observe(node);
      },
      [hasMore, isSearchMode, loadMore, loading],
   );

   const fetchSchedule = async (day: string) => {
      setSelectedDay(day);
      if (scheduleCache[day]) return;

      setScheduleLoading(true);
      try {
         const res = await fetch(
            `https://api.jikan.moe/v4/schedules?filter=${day}`,
         );
         if (!res.ok) throw new Error('Failed to fetch schedule');
         const data = await res.json();
         const uniqueData = Array.from(
            new Map(
               (data.data || []).map((item: AnimeCard) => [item.mal_id, item]),
            ).values(),
         ) as AnimeCard[];
         setScheduleCache((prev) => ({ ...prev, [day]: uniqueData }));
      } catch (error) {
         console.error('Error fetching schedule:', error);
      } finally {
         setScheduleLoading(false);
      }
   };

   const resetFilters = () => {
      setSelectedGenre('');
      setSelectedStatus('');
      setSelectedType('');
      setSelectedSort('popularity-asc');
   };

   const clearSearch = () => {
      const params = new URLSearchParams();
      if (selectedGenre) params.set('genre', selectedGenre);
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedType) params.set('type', selectedType);
      if (selectedSort && selectedSort !== 'popularity-asc')
         params.set('sort', selectedSort);
      const nextUrl = params.toString()
         ? `${PATHS.EXPLORE}?${params.toString()}`
         : PATHS.EXPLORE;
      router.push(nextUrl);
   };

   return (
      <div className="px-4 sm:px-6 md:px-8 pb-6">
         {/* 雙欄佈局核心結構 */}
         <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-6 xl:gap-8">
            {/* ================================== */}
            {/* 左欄：過濾器 + 搜尋結果 或 主打內容區 */}
            {/* ================================== */}
            <div className="flex-1 min-w-0 w-full flex flex-col gap-5">
               {/* 過濾器 (Sticky Navbar) */}
               <div className="sticky top-17 sm:top-[78.5px] z-30 py-4 bg-[#0B0E14] -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                     <div className="flex flex-wrap gap-2 sm:gap-3">
                        <FilterDropdown
                           label="Genre"
                           value={selectedGenre}
                           options={GENRES}
                           onChange={setSelectedGenre}
                        />
                        <FilterDropdown
                           label="Status"
                           value={selectedStatus}
                           options={STATUSES}
                           onChange={setSelectedStatus}
                        />
                        <FilterDropdown
                           label="Format"
                           value={selectedType}
                           options={TYPES}
                           onChange={setSelectedType}
                        />
                        <FilterDropdown
                           label="Sort By"
                           value={selectedSort}
                           options={SORTS}
                           onChange={setSelectedSort}
                        />

                        {(selectedGenre ||
                           selectedStatus ||
                           selectedType ||
                           selectedSort !== 'popularity-asc') && (
                           <button
                              onClick={resetFilters}
                              className="h-14 rounded-xl border border-red-400/30 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20"
                           >
                              Reset
                           </button>
                        )}
                     </div>

                     <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        {searchQuery ? (
                           <>
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200">
                                 Search: {searchQuery}
                              </span>
                              <button
                                 onClick={clearSearch}
                                 className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 transition-colors hover:border-anime-primary/50 hover:text-white"
                              >
                                 Clear Search
                              </button>
                           </>
                        ) : (
                           <span className="hidden xl:inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                              Use the top bar to search.
                           </span>
                        )}
                     </div>
                  </div>
                  <div className="lg:border-b lg:border-white/10 left-0 right-0 h-px absolute bottom-0 mx-6.5"></div>
               </div>

               {/* 主內容區：搜尋模式 或 推薦分類 */}
               {isSearchMode ? (
                  /* 搜尋結果清單 */
                  <div className="flex flex-col gap-4">
                     {loading && page === 1 ? (
                        [...Array(8)].map((_, idx) => (
                           <div
                              key={`sk-${idx}`}
                              className="h-32 rounded-2xl bg-white/5 animate-pulse"
                           />
                        ))
                     ) : animeList.length > 0 ? (
                        animeList.map((anime, idx) => {
                           const isFavorited = favoriteIds.has(anime.mal_id);
                           return (
                              <article
                                 key={`search-${anime.mal_id}-${idx}`}
                                 className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:p-4 hover:border-white/20 transition-colors"
                              >
                                 <Link
                                    href={`/anime/${anime.mal_id}`}
                                    className="relative h-36 w-full shrink-0 overflow-hidden rounded-lg sm:h-30 sm:w-24"
                                 >
                                    <Image
                                       src={anime.images.webp.large_image_url}
                                       alt={anime.title}
                                       fill
                                       className="object-cover"
                                       sizes="(max-width: 640px) 90vw, 160px"
                                    />
                                 </Link>
                                 <div className="min-w-0 flex-1">
                                    <Link href={`/anime/${anime.mal_id}`}>
                                       <h3 className="line-clamp-2 text-lg font-black text-white hover:text-anime-primary transition-colors">
                                          {anime.title_english || anime.title}
                                       </h3>
                                    </Link>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                                       <span className="inline-flex items-center gap-1 rounded-md bg-black/40 px-2 py-1">
                                          <IoStar
                                             className="text-yellow-400"
                                             size={12}
                                          />
                                          {anime.score || '-.--'}
                                       </span>
                                       <span className="rounded-md bg-black/40 px-2 py-1">
                                          {anime.type || 'TV'}
                                       </span>
                                       {anime.status && (
                                          <span className="rounded-md bg-black/40 px-2 py-1">
                                             {anime.status}
                                          </span>
                                       )}
                                    </div>
                                    <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                                       {anime.synopsis ||
                                          'No synopsis available.'}
                                    </p>
                                 </div>
                                 <div className="flex shrink-0 flex-row gap-2 sm:w-32 sm:flex-col">
                                    <Link
                                       href={`/player/${anime.mal_id}/1`}
                                       className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-anime-primary px-3 py-2 text-xs font-bold text-white transition-all hover:bg-anime-primary/90"
                                    >
                                       <IoPlayCircle size={15} /> Play
                                    </Link>
                                    <button
                                       onClick={() =>
                                          toggleFavorite(anime.mal_id)
                                       }
                                       className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white transition-all hover:border-anime-primary/50 hover:text-anime-primary"
                                    >
                                       {isFavorited ? (
                                          <IoHeart
                                             className="text-rose-400"
                                             size={14}
                                          />
                                       ) : (
                                          <IoHeartOutline size={14} />
                                       )}
                                       {isFavorited ? 'Saved' : 'Save'}
                                    </button>
                                 </div>
                              </article>
                           );
                        })
                     ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-slate-400">
                           No Results Found.
                        </div>
                     )}
                     {hasMore && animeList.length > 0 && (
                        <div
                           ref={lastElementRef}
                           className="mt-2 flex h-10 justify-center"
                        >
                           {loading && page > 1 && (
                              <div className="text-sm font-bold text-anime-primary animate-pulse">
                                 Loading more...
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               ) : (
                  /* 探索首頁：海報網格 (Trending, Season Highlights) */
                  <div className="flex flex-col gap-12">
                     {mainSections.map((section) => (
                        <section key={section.id} className="space-y-4">
                           <div>
                              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                                 {section.title}
                              </h2>
                              <p className="mt-1 text-sm text-slate-400">
                                 {section.description}
                              </p>
                           </div>
                           {/* 注意這裡改為較密集的 Grid，適配左欄寬度 */}
                           <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 relative">
                              {section.items.slice(0, 12).map((anime, idx) => (
                                 <Link
                                    key={`${section.id}-${anime.mal_id}-${idx}`}
                                    href={`/anime/${anime.mal_id}`}
                                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-anime-primary/50 hover:shadow-[0_12px_30px_rgba(160,124,254,0.25)]"
                                 >
                                    <div className="relative aspect-3/4 w-full">
                                       <Image
                                          src={
                                             anime.images.webp.large_image_url
                                          }
                                          alt={anime.title}
                                          fill
                                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                                          sizes="(max-width: 640px) 45vw, 25vw"
                                       />
                                       <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent" />
                                       <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 px-2 py-1">
                                          <IoStar
                                             className="text-yellow-400"
                                             size={12}
                                          />
                                          <span className="text-[11px] font-black text-white">
                                             {anime.score || '-.--'}
                                          </span>
                                       </div>
                                       <div className="absolute bottom-0 left-0 w-full p-3">
                                          <h3 className="line-clamp-2 text-sm font-bold text-white drop-shadow-md">
                                             {anime.title_english ||
                                                anime.title}
                                          </h3>
                                       </div>
                                    </div>
                                 </Link>
                              ))}
                           </div>
                        </section>
                     ))}
                  </div>
               )}
            </div>

            {/* ================================== */}
            {/* 右欄：每週放送列表 (Schedule Sidebar) */}
            {/* ================================== */}
            {!isSearchMode && (
               <aside className="w-full lg:w-90 xl:w-112.5 shrink-0 max-h-fit lg:sticky lg:top-24 flex flex-col gap-4 box-border">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-lg">
                     <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                           <IoCalendarOutline
                              className="text-anime-primary"
                              size={20}
                           />
                           Weekly Schedule
                        </h2>
                     </div>

                     {/* 緊湊型星期切換 (Tab) */}
                     <div className="flex flex-nowrap gap-1.5 mb-5 bg-black/40 p-1.5 rounded-xl border border-white/5">
                        {WEEKDAYS.map((day) => {
                           const shortDay = day.slice(0, 3); // Mon, Tue, Wed...
                           return (
                              <button
                                 key={day}
                                 onClick={() => fetchSchedule(day)}
                                 className={`flex-1 min-w-9.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                                    selectedDay === day
                                       ? 'bg-anime-primary text-white shadow-[0_0_15px_rgba(160,124,254,0.4)]'
                                       : 'text-slate-500 hover:text-slate-300 hover:bg-white/10'
                                 }`}
                              >
                                 {shortDay}
                              </button>
                           );
                        })}
                     </div>

                     {/* 放送清單 (List) */}
                     <div className="flex flex-col gap-2 min-h-75 lg:min-h-0 max-h-150 lg:max-h-[calc(100vh-17rem)] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {scheduleLoading ? (
                           <div className="flex-1 flex items-center justify-center py-10">
                              <div className="h-6 w-6 rounded-full border-2 border-anime-primary/30 border-t-anime-primary animate-spin" />
                           </div>
                        ) : (scheduleCache[selectedDay] || []).length > 0 ? (
                           (scheduleCache[selectedDay] || []).map(
                              (anime, idx) => {
                                 // 判斷是否「正在放送」(與 JST 當前時間誤差在 1 小時內)
                                 let isAiringNow = false;
                                 if (currentTimeJST && anime.broadcast?.time) {
                                    const currentDayJST = [
                                       'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
                                    ][currentTimeJST.getDay()];
                                    
                                    if (selectedDay === currentDayJST) {
                                       const currentMinutes = currentTimeJST.getHours() * 60 + currentTimeJST.getMinutes();
                                       const [bHour, bMinute] = anime.broadcast.time.split(':').map(Number);
                                       if (!isNaN(bHour) && !isNaN(bMinute)) {
                                          const bMinutes = bHour * 60 + bMinute;
                                          let diff = Math.abs(currentMinutes - bMinutes);
                                          if (diff > 12 * 60) diff = 24 * 60 - diff;
                                          isAiringNow = diff <= 60; // 差距在 1 小時內
                                       }
                                    }
                                 }

                                 return (
                                 <Link
                                    key={`sched-${anime.mal_id}-${idx}`}
                                    href={`/anime/${anime.mal_id}`}
                                    className={`relative group flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-white/5 border ${
                                       isAiringNow
                                          ? 'bg-anime-primary/5 border-anime-primary/30'
                                          : 'border-transparent hover:border-white/10'
                                    }`}
                                 >
                                    {/* 呼吸燈邊框特效 */}
                                    {isAiringNow && (
                                       <div className="absolute inset-0 rounded-xl border border-anime-primary shadow-[0_0_15px_rgba(160,124,254,0.4)] animate-pulse pointer-events-none" />
                                    )}

                                    {/* 縮圖 */}
                                    <div className="relative h-14 w-10 shrink-0 rounded-md overflow-hidden bg-white/5">
                                       <Image
                                          src={
                                             anime.images.webp.large_image_url
                                          }
                                          alt={anime.title}
                                          fill
                                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                                          sizes="40px"
                                       />
                                    </div>

                                    {/* 標題與時間 */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                       <span className="line-clamp-1 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                                          {anime.title_english || anime.title}
                                       </span>
                                       <div className="flex items-center gap-2 mt-1">
                                          <span className="flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                                             <IoStar
                                                className="text-yellow-400"
                                                size={10}
                                             />
                                             {anime.score || '-.--'}
                                          </span>
                                          {anime.broadcast?.time && (
                                             <span className="text-[10px] font-mono text-anime-primary tracking-wider">
                                                {anime.broadcast.time}
                                             </span>
                                          )}
                                          {isAiringNow ? (
                                             <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-anime-primary/20 text-anime-primary border border-anime-primary/30 animate-pulse relative z-10">
                                                LIVE
                                             </span>
                                          ) : anime.status === 'Currently Airing' && (
                                             <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 relative z-10">
                                                NEW
                                             </span>
                                          )}
                                       </div>
                                    </div>

                                    {/* Hover 顯示的播放按鈕 */}
                                    <div className="shrink-0 flex items-center justify-center opacity-0 -translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 pr-1 relative z-10">
                                       <IoPlayCircle className="text-anime-primary drop-shadow-[0_0_10px_rgba(160,124,254,0.6)]" size={28} />
                                    </div>
                                 </Link>
                                 );
                              }
                           )
                        ) : (
                           <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-500">
                              <p className="text-sm font-bold">
                                 No schedule data.
                              </p>
                           </div>
                        )}
                     </div>
                  </div>
               </aside>
            )}
         </div>
      </div>
   );
}
