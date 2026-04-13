'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
   IoHeart,
   IoHeartOutline,
   IoPlayCircle,
   IoPlanetOutline,
   IoStar,
} from 'react-icons/io5';
import type { AnimeCard } from '@/types/anime';

interface SearchResultsSectionProps {
   animeList: AnimeCard[];
   loading: boolean;
   page: number;
   totalResults: number;
   hasMore: boolean;
   favoriteIds: Set<number>;
   onToggleFavorite: (animeId: number) => void;
   lastElementRef: (node: HTMLDivElement | null) => void;
}

export function SearchResultsSection({
   animeList,
   loading,
   page,
   totalResults,
   hasMore,
   favoriteIds,
   onToggleFavorite,
   lastElementRef,
}: SearchResultsSectionProps) {
   return (
      <div className="flex flex-col gap-4 w-full px-4 md:px-8">
         <div className="flex items-center justify-between px-1 mb-1">
            <h2 className="text-xl font-black text-white tracking-wide">
               Results
            </h2>
            {!loading && (
               <span className="text-sm font-medium text-slate-400">
                  <strong className="text-anime-primary font-bold text-base mr-1">
                     {totalResults}
                  </strong>{' '}
                  Anime Found
               </span>
            )}
         </div>

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
                              <IoStar className="text-yellow-400" size={12} />
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
                           {anime.synopsis || 'No synopsis available.'}
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
                           onClick={() => onToggleFavorite(anime.mal_id)}
                           className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white transition-all hover:border-anime-primary/50 hover:text-anime-primary"
                        >
                           {isFavorited ? (
                              <IoHeart className="text-rose-400" size={14} />
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center text-slate-400 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
               <IoPlanetOutline className="mb-4 h-16 w-16 text-anime-primary/40 animate-pulse drop-shadow-[0_0_15px_rgba(160,124,254,0.4)]" />
               <h3 className="text-lg font-bold text-white mb-2">
                  No Anime Found...
               </h3>
               <p className="text-sm text-slate-400 max-w-sm">
                  It seems lost in space. Try adjusting your filters or search
                  keywords!
               </p>
            </div>
         )}

         {hasMore && animeList.length > 0 && (
            <div ref={lastElementRef} className="mt-2 flex h-10 justify-center">
               {loading && page > 1 && (
                  <div className="text-sm font-bold text-anime-primary animate-pulse">
                     Loading more...
                  </div>
               )}
            </div>
         )}
      </div>
   );
}
