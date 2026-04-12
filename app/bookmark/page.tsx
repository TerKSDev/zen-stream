'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { IoBookmarkOutline, IoCompassOutline } from 'react-icons/io5';
import { useBookmarkStore } from '@/lib/store/useBookmarkStore';
import toast from 'react-hot-toast';

export default function BookmarkPage() {
   const { bookmarkedAnimes, removeBookmark } = useBookmarkStore();
   const [isMounted, setIsMounted] = useState(false);

   useEffect(() => {
      setIsMounted(true);
   }, []);

   if (!isMounted) return null; // 未載入完成前可替換為 Skeleton 骨架屏

   return (
      <main className="flex-1 relative h-full w-full min-w-0 bg-[#0B0E14] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
         <div className="flex flex-col min-h-full px-6 py-24 md:px-8 lg:py-25 max-w-screen-2xl mx-auto w-full">
            {/* 標題與數量統計 */}
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-start mb-2 flex-col">
                  <div className="flex items-center gap-3">
                     <IoBookmarkOutline
                        className="text-anime-primary drop-shadow-[0_0_15px_rgba(160,124,254,0.6)]"
                        size={36}
                     />
                     <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide drop-shadow-md">
                        My Bookmarks
                     </h1>
                  </div>
                  <p className="text-slate-400 text-sm md:text-base max-w-2xl mt-2">
                     A collection of your favorite anime titles for easy access.
                  </p>
               </div>
               <span className="text-sm font-semibold text-white/70 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 shadow-sm">
                  {bookmarkedAnimes.length} Items
               </span>
            </div>

            {/* 內容區塊 */}
            {bookmarkedAnimes.length > 0 ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {bookmarkedAnimes.map((anime) => (
                     <Link
                        href={`/anime/${anime.mal_id}`}
                        key={anime.mal_id}
                        className="group relative flex flex-col gap-2"
                     >
                        <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-[#141824] border border-white/5 shadow-lg">
                           <Image
                              src={anime.images?.webp?.large_image_url || ''}
                              alt={anime.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                           />
                           <button
                              onClick={(e) => {
                                 e.preventDefault(); // 阻止 Link 跳轉
                                 removeBookmark(anime.mal_id);
                                 toast.success('已從收藏中移除');
                              }}
                              className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full text-anime-primary hover:bg-anime-primary hover:text-white transition-colors"
                           >
                              <IoBookmarkOutline className="w-4 h-4 fill-current" />
                           </button>
                        </div>
                        <span className="text-sm font-bold text-white line-clamp-2 group-hover:text-anime-primary transition-colors">
                           {anime.title}
                        </span>
                     </Link>
                  ))}
               </div>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center mt-12 mb-24">
                  <div className="w-24 h-24 mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">
                     <IoBookmarkOutline className="w-10 h-10 text-white/30" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                     Your bookmark list is empty
                  </h2>
                  <p className="text-slate-400 max-w-md mb-8 text-sm md:text-base leading-relaxed">
                     Looks like you haven't bookmarked any anime yet. Discover
                     top trending shows and add them to your list!
                  </p>
                  <Link
                     href="/explore"
                     className="flex items-center gap-2 px-8 py-3 bg-anime-primary text-white font-bold rounded-xl hover:bg-anime-primary/90 hover:scale-105 hover:shadow-[0_0_25px_rgba(160,124,254,0.4)] active:scale-95 transition-all duration-300"
                  >
                     <IoCompassOutline className="w-5 h-5" />
                     Explore Anime
                  </Link>
               </div>
            )}
         </div>
      </main>
   );
}
