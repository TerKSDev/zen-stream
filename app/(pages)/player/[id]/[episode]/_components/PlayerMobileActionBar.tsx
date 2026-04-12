'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IoArrowBack } from 'react-icons/io5';
import BookmarkButton from '@/components/ui/BookmarkButton';
import ShareButton from '@/components/ui/ShareButton';

export default function PlayerMobileActionBar({
   mal_id,
   anime,
   displayTitle,
   currentEpNumber,
}: {
   mal_id: string;
   anime: any;
   displayTitle: string;
   currentEpNumber: string;
}) {
   const [isPastPlayer, setIsPastPlayer] = useState(false);
   const [isScrollingDown, setIsScrollingDown] = useState(false);

   useEffect(() => {
      const target = document.getElementById('mobile-player');
      if (!target) return;

      const observer = new IntersectionObserver(
         ([entry]) => {
            // 當影片播放器離開視窗時 (往下滑過影片)，代表可以顯示底部操作列
            setIsPastPlayer(!entry.isIntersecting);
         },
         { threshold: 0 }
      );

      observer.observe(target);
      return () => observer.disconnect();
   }, []);

   useEffect(() => {
      const scrollContainer = document.querySelector('[data-header-scroll-container="true"]') || window;
      let lastScrollY = (scrollContainer as HTMLElement).scrollTop || window.scrollY;

      const handleScroll = () => {
         const currentScrollY = (scrollContainer as HTMLElement).scrollTop || window.scrollY;
         if (currentScrollY > lastScrollY + 10) {
            setIsScrollingDown(true);
         } else if (currentScrollY < lastScrollY - 10) {
            setIsScrollingDown(false);
         }
         lastScrollY = currentScrollY;
      };

      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
   }, []);

   // 只有在「滑過影片」且「手指向上滑動」時，才顯示這個懸浮操作列
   const isVisible = isPastPlayer && !isScrollingDown;

   return (
      <div
         className={`fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center gap-3 px-4 py-3 bg-[#0B0E14]/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-all duration-500 ease-out transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0'
         }`}
      >
         <Link
            href={`/anime/${mal_id}`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-anime-primary text-white text-base font-bold rounded-xl hover:bg-anime-primary/90 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(160,124,254,0.4)]"
         >
            <IoArrowBack className="w-5 h-5" />
            Details
         </Link>
         <BookmarkButton anime={anime} className="w-[48px] h-[48px] shrink-0 p-0 flex items-center justify-center bg-white/5 hover:bg-white/10 border-white/10 rounded-xl [&>span]:hidden" />
         <ShareButton title={`${displayTitle} - Episode ${currentEpNumber} | ZenStream`} className="w-[48px] h-[48px] shrink-0 p-0 flex items-center justify-center bg-white/5 hover:bg-white/10 border-white/10 rounded-xl [&>span]:hidden" />
      </div>
   );
}