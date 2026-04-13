'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
   dedupeByMalId,
   fetchJikanList,
   translateAnimeSearchQuery,
} from '@/lib/services/anime/anime-fetch';
import { PATHS } from '@/lib/config/routes';
import { readLocalHistory } from '@/lib/utils/local-storage';
import type { AnimeCard, ExploreSectionData } from '@/types/anime';
import type { HistoryEntry } from '@/types/history';
import { ExploreFiltersBar } from './ExploreFiltersBar';
import { ExploreHomeSections } from './ExploreHomeSections';
import { SearchResultsSection } from './SearchResultsSection';
import { WeeklyScheduleSidebar } from '@/app/(pages)/explore/_components/WeeklyScheduleSidebar';
import { FAVORITES_KEY } from './exploreConstants';

interface ExploreClientProps {
   initialAnime: AnimeCard[];
   initialHasMore: boolean;
   initialGenre: string;
   initialStatus: string;
   initialType: string;
   initialSort: string;
   initialQuery: string;
   initialTotal: number;
   initialWeekday: string;
   initialSchedule: AnimeCard[];
   sections: ExploreSectionData[];
}

export default function ExploreClient({
   initialAnime,
   initialHasMore,
   initialGenre,
   initialStatus,
   initialType,
   initialSort,
   initialQuery,
   initialTotal,
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
   const [totalResults, setTotalResults] = useState(initialTotal);
   const [history, setHistory] = useState<HistoryEntry[]>([]);

   const sortedHistory = useMemo(() => {
      return [...history].sort(
         (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
   }, [history]);

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
   const activeSearchQueryRef = useRef(searchQuery);

   const mainSections = useMemo(
      () => sections.filter((section) => section.items.length > 0),
      [sections],
   );

   useEffect(() => {
      const updateJST = () => {
         setCurrentTimeJST(
            new Date(
               new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }),
            ),
         );
      };

      updateJST();
      const timer = setInterval(updateJST, 60000);
      return () => clearInterval(timer);
   }, []);

   useEffect(() => {
      if (typeof window === 'undefined') return;

      try {
         const raw = localStorage.getItem(FAVORITES_KEY);
         if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
               setFavoriteIds(
                  new Set(
                     parsed.filter(
                        (id): id is number => typeof id === 'number',
                     ),
                  ),
               );
            }
         }
      } catch {
         // no-op
      }

      try {
         setHistory(readLocalHistory());
      } catch {
         // no-op
      }
   }, []);

   const toggleFavorite = useCallback((animeId: number) => {
      setFavoriteIds((prev) => {
         const next = new Set(prev);
         if (next.has(animeId)) {
            next.delete(animeId);
         } else {
            next.add(animeId);
         }

         if (typeof window !== 'undefined') {
            localStorage.setItem(
               FAVORITES_KEY,
               JSON.stringify(Array.from(next)),
            );
         }

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

         const isDefaultSort = selectedSort === 'popularity-asc';
         if (!q || !isDefaultSort) {
            const [orderBy, sortDir] = selectedSort.split('-');
            params.set('order_by', orderBy || 'popularity');
            params.set('sort', sortDir || 'asc');
         }

         params.set('sfw', 'true');

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
      if (selectedSort && selectedSort !== 'popularity-asc') {
         paramsForUrl.set('sort', selectedSort);
      }
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

      setLoading(true);

      const timerId = window.setTimeout(async () => {
         try {
            let activeQuery = searchQuery;
            activeQuery = await translateAnimeSearchQuery(activeQuery);
            activeSearchQueryRef.current = activeQuery;

            const data = await fetchJikanList(
               `https://api.jikan.moe/v4/anime?${buildSearchParams(1, activeQuery).toString()}`,
            );

            if (!data) {
               setAnimeList([]);
               setHasMore(false);
               setTotalResults(0);
               return;
            }

            const uniqueData = dedupeByMalId(data.data || []);
            setAnimeList(uniqueData);
            setHasMore(Boolean(data.pagination?.has_next_page));
            setTotalResults(data.pagination?.items?.total || uniqueData.length);
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
         const data = await fetchJikanList(
            `https://api.jikan.moe/v4/anime?${buildSearchParams(nextPage, activeSearchQueryRef.current).toString()}`,
         );

         if (!data) {
            setHasMore(false);
            return;
         }

         setAnimeList((prev) => {
            const existingIds = new Set(prev.map((a) => a.mal_id));
            const incomingUnique = dedupeByMalId(data.data || []);
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
         const data = await fetchJikanList(
            `https://api.jikan.moe/v4/schedules?filter=${day}`,
         );
         if (!data) throw new Error('Failed to fetch schedule');

         const uniqueData = dedupeByMalId(data.data || []);
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
      if (selectedSort && selectedSort !== 'popularity-asc') {
         params.set('sort', selectedSort);
      }

      const nextUrl = params.toString()
         ? `${PATHS.EXPLORE}?${params.toString()}`
         : PATHS.EXPLORE;
      router.push(nextUrl);
   };

   return (
      <div className="md:pr-8 pb-6">
         <div className="flex flex-col lg:flex-row items-start">
            <div className="flex-1 min-w-0 w-full flex flex-col gap-5">
               <ExploreFiltersBar
                  selectedGenre={selectedGenre}
                  selectedStatus={selectedStatus}
                  selectedType={selectedType}
                  selectedSort={selectedSort}
                  searchQuery={searchQuery}
                  onGenreChange={setSelectedGenre}
                  onStatusChange={setSelectedStatus}
                  onTypeChange={setSelectedType}
                  onSortChange={setSelectedSort}
                  onResetFilters={resetFilters}
                  onClearSearch={clearSearch}
               />

               {!isSearchMode && (
                  <WeeklyScheduleSidebar
                     className="lg:hidden"
                     currentTimeJST={currentTimeJST}
                     selectedDay={selectedDay}
                     scheduleLoading={scheduleLoading}
                     selectedDaySchedule={scheduleCache[selectedDay] || []}
                     onSelectDay={fetchSchedule}
                  />
               )}

               {isSearchMode ? (
                  <SearchResultsSection
                     animeList={animeList}
                     loading={loading}
                     page={page}
                     totalResults={totalResults}
                     hasMore={hasMore}
                     favoriteIds={favoriteIds}
                     onToggleFavorite={toggleFavorite}
                     lastElementRef={lastElementRef}
                  />
               ) : (
                  <ExploreHomeSections
                     sortedHistory={sortedHistory}
                     mainSections={mainSections}
                  />
               )}
            </div>

            {!isSearchMode && (
               <WeeklyScheduleSidebar
                  className="hidden lg:flex"
                  currentTimeJST={currentTimeJST}
                  selectedDay={selectedDay}
                  scheduleLoading={scheduleLoading}
                  selectedDaySchedule={scheduleCache[selectedDay] || []}
                  onSelectDay={fetchSchedule}
               />
            )}
         </div>
      </div>
   );
}
