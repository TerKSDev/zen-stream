'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IoPlayCircle } from 'react-icons/io5';
import BookmarkButton from '@/components/ui/BookmarkButton';

export default function MobileActionBar({
   mal_id,
   anime,
}: {
   mal_id: string;
   anime: any;
}) {
   const [isVisible, setIsVisible] = useState(false);

   useEffect(() => {
      const target = document.getElementById('mobile-poster');
      if (!target) return;

      // 利用 IntersectionObserver 監聽海報是否在視窗內
      const observer = new IntersectionObserver(
         ([entry]) => {
            // 當海報離開視窗 (isIntersecting = false) 時，顯示底部懸浮列
            setIsVisible(!entry.isIntersecting);
         },
         { threshold: 0 }, // threshold: 0 代表目標完全離開可視範圍才觸發
      );

      observer.observe(target);
      return () => observer.disconnect();
   }, []);

   return (
      <div
         className={`fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center gap-3 px-4 py-3 bg-[#0B0E14]/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-all duration-500 ease-out transform ${
            isVisible
               ? 'translate-y-0 opacity-100'
               : 'translate-y-[150%] opacity-0'
         }`}
      >
         <Link
            href={`/player/${mal_id}/1`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-anime-primary text-white text-base font-bold rounded-xl hover:bg-anime-primary/90 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(160,124,254,0.4)]"
         >
            <IoPlayCircle className="w-6 h-6" />
            Watch Now
         </Link>
         <BookmarkButton
            anime={anime}
            className="w-[48px] h-[48px] shrink-0 p-0 flex items-center justify-center bg-white/5 hover:bg-white/10 border-white/10 rounded-xl [&>span]:hidden"
         />
      </div>
   );
}
