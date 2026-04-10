'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import Link from 'next/link';

interface HeroSlideshowProps {
   animes: any[];
}

export default function SlideShow({ animes }: HeroSlideshowProps) {
   const [activeIndex, setActiveIndex] = useState(0);
   const [isHovered, setIsHovered] = useState(false);
   const scrollContainerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (isHovered) return;

      const timer = setInterval(() => {
         setActiveIndex((prevIndex) => (prevIndex + 1) % animes.length);
      }, 10000);
      return () => clearInterval(timer);
   }, [animes.length, isHovered]);

   useEffect(() => {
      if (scrollContainerRef.current) {
         const container = scrollContainerRef.current;
         const activeCard = container.children[activeIndex] as HTMLElement;

         if (activeCard) {
            const targetScrollLeft =
               activeCard.offsetLeft -
               container.clientWidth / 2 +
               activeCard.clientWidth / 2;

            container.scrollTo({
               left: targetScrollLeft,
               behavior: 'smooth',
            });
         }
      }
   }, [activeIndex]);

   const handleSelect = (index: number) => setActiveIndex(index);

   const scroll = (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
         const container = scrollContainerRef.current;
         const scrollAmount = container.clientWidth * 1;
         container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
         });
      }
   };

   if (!animes || animes.length === 0) return null;

   const activeAnime = animes[activeIndex];
   const localBgImage = `/top_season_anime/top_${activeIndex + 1}.jpeg`;
   const apiBgImage =
      activeAnime?.bannerImage || activeAnime?.images?.webp?.large_image_url;

   return (
      <div
         className="relative h-full min-h-screen flex flex-col justify-end overflow-hidden group"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
      >
         <div className="absolute inset-0 z-0">
            <Image
               src={apiBgImage || localBgImage}
               alt={activeAnime?.title || 'Background Image'}
               fill
               priority
               className="object-cover object-center transition-opacity duration-1000 opacity-100 group-hover:opacity-90"
            />
         </div>

         <div className="absolute inset-0 bg-linear-to-r from-black via-black/80 to-black/40 pointer-events-none transition-opacity duration-500" />

         <div className="font-inter absolute top-[15%] left-6 md:left-12 z-20 max-w-2xl flex flex-col gap-4 transition-all duration-500">
            <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] line-clamp-2">
               {activeAnime?.title_english || activeAnime?.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-semibold text-white/90 drop-shadow-md">
               {activeAnime?.score && (
                  <span className="flex items-center gap-1 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                     ★ {activeAnime.score}
                  </span>
               )}

               <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md tracking-wider">
                  {activeAnime?.type || 'TV'}{' '}
                  {activeAnime?.episodes ? `· ${activeAnime.episodes} EPS` : ''}
               </span>

               {activeAnime?.status && (
                  <span className="flex items-center gap-1.5 text-white/80">
                     <span
                        className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] ${activeAnime.status === 'Currently Airing' ? 'bg-green-400 text-green-400' : 'bg-gray-400 text-gray-400'}`}
                     ></span>
                     {activeAnime.status === 'Currently Airing'
                        ? 'Airing'
                        : activeAnime.status}
                  </span>
               )}
            </div>

            {activeAnime?.genres && activeAnime.genres.length > 0 && (
               <div className="flex flex-wrap gap-2 mt-1">
                  {activeAnime.genres.slice(0, 3).map((genre: any) => (
                     <span
                        key={genre.mal_id}
                        className="text-[11px] md:text-xs px-3 py-1 rounded-full border border-white/10 bg-white/10 backdrop-blur-md text-white/90 hover:bg-anime-primary/60 hover:border-anime-primary/60 transition-all cursor-default"
                     >
                        {genre.name}
                     </span>
                  ))}
               </div>
            )}

            <p className="text-slate-300 line-clamp-3 text-sm md:text-base leading-relaxed drop-shadow-md mt-2">
               {activeAnime?.synopsis || 'No synopsis available.'}
            </p>

            <Link
               href={`/anime/${activeAnime?.mal_id}`}
               className="self-start mt-2 px-8 py-2.5 bg-anime-primary text-white font-bold rounded-lg hover:scale-105 hover:shadow-[0_0_20px_rgba(160,124,254,0.6)] transition-all duration-300 active:scale-95"
            >
               View Details
            </Link>
         </div>

         <div className="relative flex flex-col gap-2 px-6 pb-6">
            <div className="text-white text-lg left-4 z-10 font-bold uppercase tracking-wide opacity-80 font-sans flex items-center gap-4 px-2">
               Top 10 Popular Anime of the Season
               <div className="h-px bg-white/60 flex-1 flex" />
            </div>
            <div className="relative z-20 px-2 w-full">
               <button
                  onClick={() => scroll('left')}
                  aria-label="Scroll left"
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-[#A07CFE] hover:border-transparent transition-all duration-300 shadow-lg"
               >
                  <IoChevronBackOutline className="w-6 h-6" />
               </button>

               <div
                  ref={scrollContainerRef}
                  className="flex items-center gap-4 px-12 md:px-2 py-4 overflow-hidden scroll-smooth h-fit"
               >
                  {animes.map((anime, index) => {
                     const isActive = index === activeIndex;

                     return (
                        <div
                           key={index}
                           onClick={() => handleSelect(index)}
                           className={`flex-none cursor-pointer group/item relative rounded-xl transition-all duration-500 ease-out ${
                              isActive
                                 ? 'ring-2 ring-anime-primary ring-offset-2 ring-offset-black scale-105 z-10'
                                 : 'opacity-50 hover:opacity-100 hover:scale-105 z-0'
                           }`}
                        >
                           <div className="relative aspect-3/4 w-32 overflow-hidden rounded-lg shadow-lg">
                              <Image
                                 src={anime.images.webp.large_image_url}
                                 alt={anime.title}
                                 fill
                                 className="object-cover transition-transform duration-700 group-hover/item:scale-110"
                                 sizes="150px"
                              />
                              {/* 漸層底部與文字 */}
                              <div
                                 className={`absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70 group-hover/item:opacity-100'}`}
                              />
                              <span
                                 className={`absolute bottom-2 left-2 right-2 text-[11px] leading-tight text-white font-bold font-sans line-clamp-2 text-center transition-all duration-300 ${isActive ? 'text-anime-primary drop-shadow-[0_0_8px_rgba(160,124,254,0.8)]' : 'drop-shadow-md'}`}
                              >
                                 {anime.title}
                              </span>
                           </div>
                        </div>
                     );
                  })}
               </div>

               <button
                  onClick={() => scroll('right')}
                  aria-label="Scroll right"
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-[#A07CFE] hover:border-transparent transition-all duration-300 shadow-lg"
               >
                  <IoChevronForwardOutline className="w-6 h-6" />
               </button>
            </div>
         </div>
      </div>
   );
}
