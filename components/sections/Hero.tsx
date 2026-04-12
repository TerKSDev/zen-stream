'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
   IoChevronBackOutline,
   IoChevronForwardOutline,
   IoPauseOutline,
} from 'react-icons/io5';
import Link from 'next/link';
import type { AnimeCard, AnimeGenre } from '@/lib/types/anime';

interface HeroSlideshowProps {
   animes: AnimeCard[];
}

export default function HeroSection({
   animes: initialAnimes,
}: HeroSlideshowProps) {
   // 依據 mal_id 去除重複的動漫資料
   const animes = useMemo(() => {
      return initialAnimes
         .filter(
            (anime, index, self) =>
               index === self.findIndex((a) => a.mal_id === anime.mal_id),
         )
         .slice(0, 18); // 去重後，確保只取前 18 筆
   }, [initialAnimes]);

   const [activeIndex, setActiveIndex] = useState(0);
   const [isHovered, setIsHovered] = useState(false);
   // 新增：紀錄頁面是否可見，防止切換分頁時的動畫不同步
   const [isVisible, setIsVisible] = useState(true);
   // 紀錄圖片是否已經載入完成，用來控制 Loading/Skeleton 的顯示
   const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>(
      {},
   );
   // 紀錄手機版滑動座標
   const [touchStartX, setTouchStartX] = useState<number | null>(null);
   const [touchEndX, setTouchEndX] = useState<number | null>(null);
   const scrollContainerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const handleVisibilityChange = () => {
         setIsVisible(!document.hidden);
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
         document.removeEventListener(
            'visibilitychange',
            handleVisibilityChange,
         );
      };
   }, []);

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

   // 處理手機滑動事件 (Swipe)
   const handleTouchStart = (e: React.TouchEvent) => {
      // 如果滑動的是底部的縮圖列，不觸發主視覺的輪播切換
      if (scrollContainerRef.current?.contains(e.target as Node)) return;
      setTouchEndX(null);
      setTouchStartX(e.targetTouches[0].clientX);
   };

   const handleTouchMove = (e: React.TouchEvent) => {
      if (scrollContainerRef.current?.contains(e.target as Node)) return;
      setTouchEndX(e.targetTouches[0].clientX);
   };

   const handleTouchEnd = () => {
      if (!touchStartX || !touchEndX) return;
      const distance = touchStartX - touchEndX;
      const minSwipeDistance = 50; // 觸發滑動的最短距離

      if (distance > minSwipeDistance) {
         // 向左滑動 -> 下一部
         setActiveIndex((prev) => (prev + 1) % animes.length);
      } else if (distance < -minSwipeDistance) {
         // 向右滑動 -> 上一部
         setActiveIndex((prev) => (prev - 1 + animes.length) % animes.length);
      }
   };

   if (!animes || animes.length === 0) return null;

   const activeAnime = animes[activeIndex];

   // 只要滑鼠懸停，或是頁面不可見（切換分頁），就暫停輪播
   const isPaused = isHovered || !isVisible;

   return (
      <div
         className="relative w-full h-[100svh] flex flex-col overflow-hidden group bg-[#0B0E14]"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
      >
         <style>{`
            @keyframes slideProgress {
               0% { width: 0%; }
               100% { width: 100%; }
            }
            @keyframes kenBurns {
               0% { transform: scale(1); }
               100% { transform: scale(1.08); }
            }
            @keyframes fadeInUp {
               0% { opacity: 0; transform: translateY(20px); }
               100% { opacity: 1; transform: translateY(0); }
            }
         `}</style>

         {/* 頂部進度條 (Progress Bar) - 結合 CSS 動畫完美控制輪播與暫停 */}
         <div className="absolute top-0 left-0 right-0 h-0.5 md:h-1 bg-white/10 z-50">
            <div
               key={activeIndex}
               className="h-full bg-anime-primary shadow-[0_0_10px_rgba(160,124,254,0.8)]"
               style={{
                  animationName: 'slideProgress',
                  animationDuration: '10s',
                  animationTimingFunction: 'linear',
                  animationFillMode: 'forwards',
                  animationPlayState: isPaused ? 'paused' : 'running',
               }}
               onAnimationEnd={() => {
                  if (!isPaused)
                     setActiveIndex((prev) => (prev + 1) % animes.length);
               }}
            />
         </div>

         {/* 暫停指示器 (Pause Indicator) */}
         <div
            className={`absolute top-20 md:top-28 right-6 md:right-12 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/90 shadow-lg transition-all duration-300 pointer-events-none origin-center ${
               isHovered
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 -translate-y-2 scale-90'
            }`}
         >
            <IoPauseOutline className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase">
               Paused
            </span>
         </div>

         <div className="absolute inset-0 z-0 bg-[#0B0E14]">
            {/* 骨架屏 (Skeleton) / Loading 動畫：當前圖片尚未載入時顯示 */}
            {!loadedImages[activeIndex] && (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 animate-pulse z-0">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-anime-primary rounded-full animate-spin" />
               </div>
            )}

            {animes.map((anime, index) => {
               const isActive = index === activeIndex;
               const bgApi =
                  anime?.bannerImage || anime?.images?.webp?.large_image_url;
               const bgLocal = `/top_season_anime/top_${index + 1}.jpeg`;

               return (
                  <Image
                     key={`bg-${anime.mal_id}-${index}`}
                     src={bgApi || bgLocal}
                     alt={anime?.title || 'Background Image'}
                     fill
                     priority={index === 0} // 只有第一張圖需要優先載入
                     onLoad={() =>
                        setLoadedImages((prev) => ({ ...prev, [index]: true }))
                     }
                     style={{
                        animationName: isActive ? 'kenBurns' : 'none',
                        animationDuration: '10s',
                        animationTimingFunction: 'ease-out',
                        animationFillMode: 'forwards',
                        animationPlayState: isPaused ? 'paused' : 'running',
                     }}
                     className={`object-cover object-center transition-opacity duration-1000 ease-in-out ${isActive ? 'opacity-100 group-hover:opacity-90' : 'opacity-0'}`}
                  />
               );
            })}
         </div>

         {/* 全域漸層遮罩：確保文字與底部區塊的清晰度 */}
         <div className="absolute inset-0 z-10 bg-linear-to-r from-[#0B0E14]/90 via-[#0B0E14]/50 to-transparent pointer-events-none" />
         <div className="absolute inset-0 z-10 bg-linear-to-t from-[#0B0E14] via-transparent to-transparent pointer-events-none" />

         {/* 主內容區容器：利用 flexbox 完美劃分空間，防止重疊 */}
         <div className="relative z-20 flex flex-col h-full w-full pt-20 sm:pt-26 pb-4 md:pb-6 pointer-events-none gap-10">
            {/* 上半部彈性空間：詳情文字區塊 (加入 Fade-in-up 滑順浮出動畫) */}
            <div
               key={`text-info-${activeIndex}`}
               className="font-inter flex-1 flex flex-col justify-center px-6 md:px-12 w-full max-w-3xl gap-3 md:gap-5 min-h-78"
               style={{ animation: 'fadeInUp 0.8s ease-out forwards' }}
            >
               <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] line-clamp-2 leading-tight">
                  {activeAnime?.title_english || activeAnime?.title}
               </h1>

               <div className="flex flex-wrap items-center gap-2 md:gap-3 md:text-sm font-semibold text-white/90 drop-shadow-md">
                  {activeAnime?.score && (
                     <span className="flex items-center gap-1 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px]">
                        ★ {activeAnime.score}
                     </span>
                  )}

                  <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md tracking-wider text-[10px]">
                     {activeAnime?.type || 'TV'}{' '}
                     {activeAnime?.episodes
                        ? `· ${activeAnime.episodes} EPS`
                        : ''}
                  </span>

                  {activeAnime?.status && (
                     <span className="flex items-center gap-1.5 text-white/80 text-xs">
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
                     {activeAnime.genres
                        .slice(0, 3)
                        .map((genre: AnimeGenre) => (
                           <span
                              key={genre.mal_id}
                              className="text-[10px] px-3 py-1 rounded-full border border-white/10 bg-white/10 backdrop-blur-md text-white/90 hover:bg-anime-primary/60 hover:border-anime-primary/60 transition-all cursor-default"
                           >
                              {genre.name}
                           </span>
                        ))}
                  </div>
               )}

               <p className="text-slate-300 text-xs line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow-md mt-1">
                  {activeAnime?.synopsis || 'No synopsis available.'}
               </p>

               <Link
                  href={`/anime/${activeAnime?.mal_id}`}
                  className="pointer-events-auto self-start mt-2 px-6 py-2 bg-anime-primary text-white font-bold rounded-lg hover:scale-105 hover:shadow-[0_0_20px_rgba(160,124,254,0.6)] transition-all duration-300 active:scale-95 text-sm"
               >
                  View Details
               </Link>
            </div>

            {/* 下半部固定空間：縮圖與指示點 */}
            <div className="shrink-0 flex flex-col pointer-events-auto w-full mt-auto mb-0 relative z-30">
               <div className="px-6 md:px-12 flex items-center gap-4">
                  <span className="text-white/90 text-sm md:text-base font-bold uppercase tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-4 bg-anime-primary rounded-full shadow-[0_0_8px_rgba(160,124,254,0.6)]"></div>
                     Trending This Season
                  </span>
                  <div className="h-px bg-white/20 flex-1 hidden sm:block" />
               </div>

               <div className="relative w-full -mt-2 h-62 group/slider px-2 md:px-4 overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <button
                     onClick={() => scroll('left')}
                     aria-label="Scroll left"
                     className="hidden md:flex items-center justify-center absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-[#A07CFE] hover:border-transparent transition-all duration-300 shadow-lg"
                  >
                     <IoChevronBackOutline className="w-6 h-6" />
                  </button>

                  <div
                     ref={scrollContainerRef}
                     className="flex h-full items-center gap-3 md:gap-4 overflow-x-hidden snap-x snap-mandatory scroll-smooth px-4 md:px-8 py-4 md:py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transform-gpu will-change-transform"
                  >
                     {animes.map((anime, index) => {
                        const isActive = index === activeIndex;

                        return (
                           <div
                              key={`${anime.mal_id}-${index}`}
                              onClick={() => handleSelect(index)}
                              className={`flex-none cursor-pointer group/item relative rounded-xl transition-all duration-500 ease-out origin-bottom snap-center shrink-0 w-24 md:w-32 aspect-3/4 ${
                                 isActive
                                    ? 'ring-2 ring-anime-primary ring-offset-2 ring-offset-[#0B0E14] scale-110 z-20 shadow-[0_15px_30px_rgba(160,124,254,0.4)] mx-1.5 md:mx-2'
                                    : 'opacity-50 hover:opacity-100 hover:scale-105 z-10'
                              }`}
                           >
                              <div className="relative w-full h-full overflow-hidden rounded-xl bg-[#0B0E14] shadow-lg">
                                 <Image
                                    src={anime.images.webp.large_image_url}
                                    alt={anime.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover/item:scale-110"
                                    sizes="(max-width: 768px) 100px, 130px"
                                 />
                                 <div
                                    className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/40 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-80 group-hover/item:opacity-100'}`}
                                 />

                                 <div
                                    className={`absolute top-1.5 left-1.5 right-1.5 flex justify-between items-center transition-all duration-300 transform ${isActive || 'opacity-0 -translate-y-2 group-hover/item:opacity-100 group-hover/item:translate-y-0'}`}
                                 >
                                    <span className="flex items-center gap-0.5 text-[9px] md:text-[10px] font-bold text-yellow-400 bg-black/60 backdrop-blur-md px-1 py-0.5 rounded border border-white/10 shadow-sm">
                                       ★ {anime.score || '-'}
                                    </span>
                                    <span className="text-[8px] md:text-[9px] font-bold text-white bg-black/60 backdrop-blur-md px-1 py-0.5 rounded border border-white/10 shadow-sm">
                                       {anime.episodes
                                          ? `${anime.episodes} EP`
                                          : anime.type || 'TV'}
                                    </span>
                                 </div>

                                 <span
                                    className={`absolute bottom-2.5 left-2 right-2 text-[10px] md:text-xs leading-tight text-white font-bold font-sans line-clamp-2 text-center transition-all duration-300 ${isActive ? 'text-anime-primary drop-shadow-[0_0_8px_rgba(160,124,254,0.8)]' : 'drop-shadow-md'}`}
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
                     className="hidden md:flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-[#A07CFE] hover:border-transparent transition-all duration-300 shadow-lg"
                  >
                     <IoChevronForwardOutline className="w-6 h-6" />
                  </button>
               </div>

               {/* 輪播進度指示點 (Pagination Dots) */}
               <div className="flex justify-center w-full relative z-40 -mt-4">
                  <div className="flex items-center gap-4 md:gap-2.5 p-2 md:p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-w-[90vw] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                     {animes.map((_, index) => (
                        <button
                           key={`dot-${index}`}
                           onClick={() => handleSelect(index)}
                           aria-label={`Go to slide ${index + 1}`}
                           className={`h-2 md:h-2.5 shrink-0 rounded-full transition-all duration-300 ${
                              index === activeIndex
                                 ? 'w-6 md:w-8 bg-anime-primary shadow-[0_0_10px_rgba(160,124,254,0.8)]'
                                 : 'w-2 md:w-2.5 bg-white/40 hover:bg-white/80'
                           }`}
                        />
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
