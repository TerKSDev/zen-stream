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
   initialQuery: string;
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
         <div className="relative min-w-44">
            <Listbox.Button className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-white transition-all hover:border-anime-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-anime-primary/40">
               <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {label}
               </span>
               <span className="mt-0.5 block text-sm font-bold text-white pr-6">
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
               <Listbox.Options className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-white/10 bg-[#0B0E14]/95 p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl focus:outline-none">
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
                           <div className="flex items-center justify-between gap-2">
                              <span className="line-clamp-1">
                                 {option.name}
                              </span>
                              {selected && (
                                 <IoCheckmark
                                    className="text-anime-primary"
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
   initialQuery,
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
   const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

   const searchQuery = initialQuery.trim();
   const isSearchMode = Boolean(searchQuery || selectedGenre || selectedStatus);

   const initialRender = useRef(true);
   const observer = useRef<IntersectionObserver | null>(null);

   const visibleSections = useMemo(
      () => sections.filter((section) => section.items.length > 0),
      [sections],
   );

   useEffect(() => {
      if (typeof window === 'undefined') {
         return;
      }

      try {
         const raw = localStorage.getItem(FAVORITES_KEY);
         if (!raw) {
            return;
         }

         const parsed = JSON.parse(raw);
         if (!Array.isArray(parsed)) {
            return;
         }

         const ids = parsed.filter(
            (id): id is number => typeof id === 'number',
         );
         setFavoriteIds(new Set(ids));
      } catch {
         // Ignore broken storage values and continue with an empty set.
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
      (pageNumber: number) => {
         const params = new URLSearchParams({
            limit: '24',
            page: String(pageNumber),
            order_by: 'popularity',
            sort: 'asc',
         });

         if (selectedGenre) params.set('genres', selectedGenre);
         if (selectedStatus) params.set('status', selectedStatus);
         if (searchQuery) params.set('q', searchQuery);

         return params;
      },
      [searchQuery, selectedGenre, selectedStatus],
   );

   useEffect(() => {
      if (initialRender.current) {
         initialRender.current = false;
         return;
      }

      const paramsForUrl = new URLSearchParams();
      if (selectedGenre) paramsForUrl.set('genre', selectedGenre);
      if (selectedStatus) paramsForUrl.set('status', selectedStatus);
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

      const timerId = window.setTimeout(async () => {
         setLoading(true);

         try {
            const response = await fetch(
               `https://api.jikan.moe/v4/anime?${buildSearchParams(1).toString()}`,
            );

            if (!response.ok) {
               throw new Error('Failed to fetch explore results');
            }

            const data =
               (await response.json()) as JikanListResponse<AnimeCard>;
            setAnimeList(data.data || []);
            setHasMore(Boolean(data.pagination?.has_next_page));
            setPage(1);
         } catch (error) {
            console.error('Failed to refresh explore results:', error);
         } finally {
            setLoading(false);
         }
      }, 450);

      return () => {
         window.clearTimeout(timerId);
      };
   }, [
      buildSearchParams,
      isSearchMode,
      pathname,
      searchQuery,
      selectedGenre,
      selectedStatus,
   ]);

   const loadMore = useCallback(async () => {
      if (!isSearchMode || loading || !hasMore) return;

      setLoading(true);
      const nextPage = page + 1;

      try {
         const response = await fetch(
            `https://api.jikan.moe/v4/anime?${buildSearchParams(nextPage).toString()}`,
         );

         if (!response.ok) {
            throw new Error('Failed to load more explore results');
         }

         const data = (await response.json()) as JikanListResponse<AnimeCard>;

         setAnimeList((prev) => {
            const existingIds = new Set(prev.map((anime) => anime.mal_id));
            const incoming = (data.data || []).filter(
               (anime) => !existingIds.has(anime.mal_id),
            );
            return [...prev, ...incoming];
         });

         setPage(nextPage);
         setHasMore(Boolean(data.pagination?.has_next_page));
      } catch (error) {
         console.error('Failed to load additional explore results:', error);
      } finally {
         setLoading(false);
      }
   }, [buildSearchParams, hasMore, isSearchMode, loading, page]);

   const lastElementRef = useCallback(
      (node: HTMLDivElement | null) => {
         if (!isSearchMode || loading || !hasMore) return;

         if (observer.current) observer.current.disconnect();

         observer.current = new IntersectionObserver(
            (entries) => {
               if (entries[0].isIntersecting) {
                  loadMore();
               }
            },
            { rootMargin: '420px' },
         );

         if (node) observer.current.observe(node);
      },
      [hasMore, isSearchMode, loadMore, loading],
   );

   const resetFilters = () => {
      setSelectedGenre('');
      setSelectedStatus('');
   };

   const clearSearch = () => {
      const params = new URLSearchParams();
      if (selectedGenre) params.set('genre', selectedGenre);
      if (selectedStatus) params.set('status', selectedStatus);

      const nextUrl = params.toString()
         ? `${PATHS.EXPLORE}?${params.toString()}`
         : PATHS.EXPLORE;
      router.push(nextUrl);
   };

   return (
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-24 flex flex-col gap-8">
         <div className="sticky top-17 sm:top-22 z-30 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 border-y border-white/5 bg-[#0B0E14]/88 px-4 py-4 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.45)] sm:px-6 md:px-8 lg:px-12">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
               <div className="flex w-full flex-wrap gap-3">
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

                  {(selectedGenre || selectedStatus) && (
                     <button
                        onClick={resetFilters}
                        className="h-14 rounded-xl border border-red-400/30 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20"
                     >
                        Reset Filters
                     </button>
                  )}
               </div>

               <div className="flex w-full flex-wrap items-center justify-start gap-2 text-xs text-slate-400 lg:w-auto lg:justify-end">
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
                     <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                        Use the global header search to enter query mode.
                     </span>
                  )}
               </div>
            </div>
         </div>

         {!isSearchMode && (
            <div className="flex flex-col gap-10">
               {visibleSections.map((section) => (
                  <section key={section.id} className="space-y-4">
                     <div className="flex items-end justify-between gap-3">
                        <div>
                           <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                              {section.title}
                           </h2>
                           <p className="mt-1 text-sm text-slate-400">
                              {section.description}
                           </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">
                           {section.items.length} Titles
                        </span>
                     </div>

                     <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {section.items.slice(0, 12).map((anime) => (
                           <Link
                              key={`${section.id}-${anime.mal_id}`}
                              href={`/anime/${anime.mal_id}`}
                              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-anime-primary/50 hover:shadow-[0_12px_30px_rgba(160,124,254,0.25)]"
                           >
                              <div className="relative aspect-3/4 w-full">
                                 <Image
                                    src={anime.images.webp.large_image_url}
                                    alt={anime.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
                                 />
                                 <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/35 to-transparent" />

                                 {anime.score && (
                                    <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/55 px-2 py-1">
                                       <IoStar
                                          className="text-yellow-400"
                                          size={12}
                                       />
                                       <span className="text-[11px] font-black text-white">
                                          {anime.score}
                                       </span>
                                    </div>
                                 )}

                                 <div className="absolute bottom-0 left-0 w-full p-3">
                                    <h3 className="line-clamp-2 text-sm font-bold text-white">
                                       {anime.title_english || anime.title}
                                    </h3>
                                    <p className="mt-1 line-clamp-1 text-[11px] text-slate-300">
                                       {anime.broadcast?.day ||
                                          anime.status ||
                                          'TV Anime'}
                                    </p>
                                 </div>
                              </div>
                           </Link>
                        ))}
                     </div>
                  </section>
               ))}
            </div>
         )}

         {isSearchMode && (
            <div className="flex flex-col gap-4">
               {loading && page === 1 ? (
                  [...Array(8)].map((_, index) => (
                     <div
                        key={`skeleton-${index}`}
                        className="h-32 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
                     />
                  ))
               ) : animeList.length > 0 ? (
                  animeList.map((anime) => {
                     const isFavorited = favoriteIds.has(anime.mal_id);

                     return (
                        <article
                           key={anime.mal_id}
                           className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:p-4"
                        >
                           <Link
                              href={`/anime/${anime.mal_id}`}
                              className="relative h-36 w-full overflow-hidden rounded-lg border border-white/10 sm:h-30 sm:w-24 shrink-0"
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

                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                                 {anime.score && (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/35 px-2 py-1">
                                       <IoStar
                                          className="text-yellow-400"
                                          size={12}
                                       />
                                       {anime.score}
                                    </span>
                                 )}
                                 <span className="rounded-md border border-white/10 bg-black/35 px-2 py-1">
                                    {anime.type || 'TV'}
                                 </span>
                                 {anime.episodes && (
                                    <span className="rounded-md border border-white/10 bg-black/35 px-2 py-1">
                                       {anime.episodes} EPS
                                    </span>
                                 )}
                                 {anime.status && (
                                    <span className="rounded-md border border-white/10 bg-black/35 px-2 py-1">
                                       {anime.status}
                                    </span>
                                 )}
                              </div>

                              <p className="mt-3 line-clamp-2 text-sm text-slate-300">
                                 {anime.synopsis || 'No synopsis available.'}
                              </p>
                           </div>

                           <div className="flex shrink-0 flex-row gap-2 sm:flex-col sm:w-36">
                              <Link
                                 href={`/player/${anime.mal_id}/1`}
                                 className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-anime-primary px-3 py-2 text-xs font-bold text-white transition-all hover:bg-anime-primary/90"
                              >
                                 <IoPlayCircle size={15} />
                                 Watch Now
                              </Link>

                              <button
                                 onClick={() => toggleFavorite(anime.mal_id)}
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
                                 {isFavorited ? 'Favorited' : 'Favorite'}
                              </button>
                           </div>
                        </article>
                     );
                  })
               ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
                     <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-500">
                        <IoSearch size={22} />
                     </div>
                     <h3 className="text-lg font-black text-white">
                        No Results Found
                     </h3>
                     <p className="mt-2 text-sm text-slate-400">
                        Try a different keyword from the header search, or reset
                        your filters.
                     </p>
                     {(selectedGenre || selectedStatus) && (
                        <button
                           onClick={resetFilters}
                           className="mt-5 rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-bold text-white transition-colors hover:border-anime-primary/50 hover:text-anime-primary"
                        >
                           Reset Filters
                        </button>
                     )}
                  </div>
               )}

               {hasMore && animeList.length > 0 && (
                  <div
                     ref={lastElementRef}
                     className="mt-2 flex h-10 justify-center"
                  >
                     {loading && page > 1 && (
                        <div className="inline-flex items-center gap-2 text-sm font-bold text-anime-primary">
                           <span className="h-4 w-4 rounded-full border-2 border-anime-primary/30 border-t-anime-primary animate-spin" />
                           Loading more results...
                        </div>
                     )}
                  </div>
               )}
            </div>
         )}
      </div>
   );
}
