'use client';

import { PATHS } from '@/lib/config/route';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import {
   IoCloseCircle,
   IoSearch,
   IoNotificationsOutline,
} from 'react-icons/io5';

const SCROLL_CONTAINER_SELECTOR = '[data-header-scroll-container="true"]';

export default function Header() {
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();
   const searchParamsKey = searchParams.toString();

   const [query, setQuery] = useState('');
   const [hasScrollableContent, setHasScrollableContent] = useState(false);

   // 模擬登入狀態 (Mock Login State)
   const [isLoggedIn, setIsLoggedIn] = useState(false);
   const [isScrollingDown, setIsScrollingDown] = useState(false);

   useEffect(() => {
      const nextQuery = searchParams.get('q') ?? '';
      const timerId = window.setTimeout(() => {
         setQuery(nextQuery);
      }, 0);

      return () => {
         window.clearTimeout(timerId);
      };
   }, [pathname, searchParamsKey, searchParams]);

   useEffect(() => {
      let frameId = 0;

      const evaluateScrollability = () => {
         const container = document.querySelector<HTMLElement>(
            SCROLL_CONTAINER_SELECTOR,
         );
         const nextValue = Boolean(
            container && container.scrollHeight > container.clientHeight + 4,
         );
         setHasScrollableContent((prev) =>
            prev === nextValue ? prev : nextValue,
         );
      };

      const scheduleCheck = () => {
         cancelAnimationFrame(frameId);
         frameId = requestAnimationFrame(evaluateScrollability);
      };

      const mutationObserver = new MutationObserver(scheduleCheck);
      mutationObserver.observe(document.body, {
         childList: true,
         subtree: true,
      });

      window.addEventListener('resize', scheduleCheck);
      scheduleCheck();
      const delayedCheckId = window.setTimeout(scheduleCheck, 500);

      return () => {
         clearTimeout(delayedCheckId);
         cancelAnimationFrame(frameId);
         mutationObserver.disconnect();
         window.removeEventListener('resize', scheduleCheck);
      };
   }, [pathname, searchParamsKey]);

   // 監聽滾動方向來控制 Header 顯示/隱藏
   useEffect(() => {
      const scrollContainer = document.querySelector<HTMLElement>(SCROLL_CONTAINER_SELECTOR);
      const target = scrollContainer || window;
      let lastScrollY = scrollContainer ? scrollContainer.scrollTop : window.scrollY;

      const handleScroll = () => {
         const currentScrollY = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
         
         if (currentScrollY <= 50) {
            setIsScrollingDown(false); // 頂部始終顯示
         } else if (currentScrollY > lastScrollY + 10) {
            setIsScrollingDown(true);  // 向下滑動，隱藏
         } else if (currentScrollY < lastScrollY - 10) {
            setIsScrollingDown(false); // 向上滑動，顯示
         }
         lastScrollY = currentScrollY;
      };

      target.addEventListener('scroll', handleScroll, { passive: true });
      return () => target.removeEventListener('scroll', handleScroll);
   }, [pathname]);

   const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = query.trim();
      let params: URLSearchParams;

      if (pathname === PATHS.EXPLORE) {
         // Read from window.location.search to ensure we get the latest client-side filters
         params = new URLSearchParams(window.location.search);
      } else {
         params = new URLSearchParams();
      }

      if (trimmed) {
         params.set('q', trimmed);
      } else {
         params.delete('q');
      }

      const queryString = params.toString();
      router.push(
         queryString ? `${PATHS.EXPLORE}?${queryString}` : PATHS.EXPLORE,
      );
   };

   const handleClear = () => {
      setQuery('');
      if (pathname === PATHS.EXPLORE) {
         const params = new URLSearchParams(window.location.search);
         params.delete('q');

         const queryString = params.toString();
         router.push(
            queryString ? `${PATHS.EXPLORE}?${queryString}` : PATHS.EXPLORE,
         );
      }
   };

   return (
      <header
         className={`absolute top-0 left-0 z-50 flex w-full items-center justify-between gap-3 px-4 py-2 transition-all duration-500 sm:px-8 sm:py-4 border-b border-white/10 ${
            hasScrollableContent
               ? 'bg-[#0B0E14] border-b border-white/10'
               : 'bg-transparent'
         } ${isScrollingDown ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
         <form
            onSubmit={handleSubmit}
            className="group flex w-full min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 backdrop-blur-md transition-all duration-300 hover:bg-white/10 focus-within:border-anime-primary/50 focus-within:bg-[#0B0E14]/90 focus-within:ring-2 focus-within:ring-anime-primary/20 focus-within:shadow-[0_0_20px_rgba(160,124,254,0.2)] sm:px-4"
         >
            <IoSearch
               size={18}
               className="text-slate-400 group-focus-within:text-anime-primary group-focus-within:drop-shadow-[0_0_8px_rgba(160,124,254,0.8)] transition-all duration-300"
            />
            <input
               value={query}
               onChange={(event) => setQuery(event.target.value)}
               onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                     event.preventDefault();
                     handleClear();
                  }
               }}
               className="min-h-10 w-full min-w-0 bg-transparent font-sans text-sm text-white outline-none transition-colors placeholder:text-slate-500 sm:min-h-11"
               placeholder="Search anime title..."
            />

            {query.trim() && (
               <button
                  type="button"
                  onClick={handleClear}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Clear search"
               >
                  <IoCloseCircle size={18} />
               </button>
            )}

            <button
               type="submit"
               className="rounded-lg bg-white/5 px-2 py-1 text-xs font-bold text-slate-300 transition-colors hover:bg-anime-primary/20 hover:text-white"
               aria-label="Search"
            >
               Go
            </button>
         </form>

         <div className="hidden h-full items-center shrink-0 sm:flex">
            {isLoggedIn ? (
               <div className="flex items-center gap-4 lg:gap-6">
                  <button className="relative text-slate-400 hover:text-white transition-colors duration-300">
                     <IoNotificationsOutline size={24} />
                     <span className="absolute top-0 right-0 w-2 h-2 bg-anime-primary rounded-full border border-[#0B0E14]"></span>
                  </button>
                  <button
                     onClick={() => setIsLoggedIn(false)}
                     className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-anime-primary transition-all duration-300 active:scale-95"
                     title="Sign Out (Mock)"
                  >
                     <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=A07CFE"
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                     />
                  </button>
               </div>
            ) : (
               <button
                  onClick={() => setIsLoggedIn(true)}
                  className="rounded-xl bg-anime-primary px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-anime-primary/90 hover:shadow-[0_0_20px_rgba(160,124,254,0.6)] active:scale-95 sm:px-6 sm:py-2.5 sm:text-sm"
               >
                  Sign In
               </button>
            )}
         </div>
      </header>
   );
}
