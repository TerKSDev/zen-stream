'use client';

import { PATHS } from '@/lib/config/route';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { IoCloseCircle, IoSearch } from 'react-icons/io5';

const SCROLL_CONTAINER_SELECTOR = '[data-header-scroll-container="true"]';

export default function Header() {
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();
   const searchParamsKey = searchParams.toString();

   const [query, setQuery] = useState('');
   const [hasScrollableContent, setHasScrollableContent] = useState(false);

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

   const searchUrl = useMemo(() => {
      const params = new URLSearchParams();
      const trimmed = query.trim();

      if (pathname === PATHS.EXPLORE) {
         const genre = searchParams.get('genre');
         const status = searchParams.get('status');
         if (genre) params.set('genre', genre);
         if (status) params.set('status', status);
      }

      if (trimmed) {
         params.set('q', trimmed);
      }

      const queryString = params.toString();
      return queryString ? `${PATHS.EXPLORE}?${queryString}` : PATHS.EXPLORE;
   }, [pathname, query, searchParams]);

   const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      router.push(searchUrl);
   };

   const handleClear = () => {
      setQuery('');
      if (pathname === PATHS.EXPLORE) {
         const params = new URLSearchParams();
         const genre = searchParams.get('genre');
         const status = searchParams.get('status');
         if (genre) params.set('genre', genre);
         if (status) params.set('status', status);

         const queryString = params.toString();
         router.push(
            queryString ? `${PATHS.EXPLORE}?${queryString}` : PATHS.EXPLORE,
         );
      }
   };

   return (
      <header
         className={`absolute top-0 left-0 z-50 flex w-full items-center justify-between gap-3 px-4 py-4 transition-all duration-300 sm:px-8 sm:py-6 ${
            hasScrollableContent
               ? 'bg-[#0B0E14]/20 backdrop-blur-[3px] border-b border-white/5'
               : 'bg-transparent'
         }`}
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
            <button className="rounded-xl bg-anime-primary px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-anime-primary/90 hover:shadow-[0_0_20px_rgba(160,124,254,0.6)] active:scale-95 sm:px-6 sm:py-2.5 sm:text-sm">
               Sign In
            </button>
         </div>
      </header>
   );
}
