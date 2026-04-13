'use client';

import Image from 'next/image';
import Link from 'next/link';
import { IoPlayCircle, IoStar } from 'react-icons/io5';
import type { ExploreSectionData } from '@/types/anime';
import type { HistoryEntry } from '@/types/history';

interface ExploreHomeSectionsProps {
   sortedHistory: HistoryEntry[];
   mainSections: ExploreSectionData[];
}

export function ExploreHomeSections({
   sortedHistory,
   mainSections,
}: ExploreHomeSectionsProps) {
   return (
      <div className="flex flex-col gap-12 px-4 md:px-8">
         {sortedHistory.length > 0 && (
            <section className="space-y-4 animate-in fade-in duration-500">
               <div>
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide">
                     Continue Watching
                  </h2>
                  <p className="mt-1 text-[10px] md:text-sm text-slate-400">
                     Pick up right where you left off.
                  </p>
               </div>
               <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 relative">
                  {sortedHistory.slice(0, 4).map((entry, idx) => (
                     <Link
                        key={`continue-${entry.mal_id}-${idx}`}
                        href={`/player/${entry.mal_id}/${entry.episode}`}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-anime-primary/50 hover:shadow-[0_12px_30px_rgba(160,124,254,0.25)]"
                     >
                        <div className="relative aspect-3/4 w-full">
                           <Image
                              src={entry.image || '/icon.png'}
                              alt={entry.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 45vw, 25vw"
                           />
                           <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent" />
                           <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-md bg-anime-primary/90 backdrop-blur-md border border-white/20 px-2.5 py-1 shadow-lg z-10">
                              <IoPlayCircle className="text-white" size={14} />
                              <span className="text-[11px] font-black text-white">
                                 EP {entry.episode}
                              </span>
                           </div>
                           <div className="absolute bottom-0 left-0 w-full p-3 z-10">
                              <h3 className="line-clamp-2 text-sm font-bold text-white drop-shadow-md group-hover:text-anime-primary transition-colors">
                                 {entry.title}
                              </h3>
                           </div>
                        </div>
                     </Link>
                  ))}
               </div>
            </section>
         )}

         {mainSections.map((section) => (
            <section key={section.id} className="space-y-4">
               <div>
                  <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide">
                     {section.title}
                  </h2>
                  <p className="mt-1 text-[10px] md:text-sm text-slate-400">
                     {section.description}
                  </p>
               </div>
               <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 relative">
                  {section.items.slice(0, 12).map((anime, idx) => (
                     <Link
                        key={`${section.id}-${anime.mal_id}-${idx}`}
                        href={`/anime/${anime.mal_id}`}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-anime-primary/50 hover:shadow-[0_12px_30px_rgba(160,124,254,0.25)]"
                     >
                        <div className="relative aspect-3/4 w-full">
                           <Image
                              src={anime.images.webp.large_image_url}
                              alt={anime.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 45vw, 25vw"
                           />
                           <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent" />
                           <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 px-2 py-1">
                              <IoStar className="text-yellow-400" size={12} />
                              <span className="text-[11px] font-black text-white">
                                 {anime.score || '-.--'}
                              </span>
                           </div>
                           <div className="absolute bottom-0 left-0 w-full p-3">
                              <h3 className="line-clamp-2 text-sm font-bold text-white drop-shadow-md">
                                 {anime.title_english || anime.title}
                              </h3>
                           </div>
                        </div>
                     </Link>
                  ))}
               </div>
            </section>
         ))}
      </div>
   );
}
