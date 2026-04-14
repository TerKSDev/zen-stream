'use client';

import { PATHS } from '@/lib/config/routes';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { FormEvent, useEffect, useState } from 'react';
import {
   IoCloseCircle,
   IoSearch,
   IoNotificationsOutline,
} from 'react-icons/io5';
import AuthModal from '@/components/modals/AuthModal';
import { useBookmarkStore } from '@/store/useBookmarkStore';

const SCROLL_CONTAINER_SELECTOR = '[data-header-scroll-container="true"]';

export default function Header() {
   const router = useRouter();
   const pathname = usePathname();
   const searchParams = useSearchParams();
   const searchParamsKey = searchParams.toString();

   const [query, setQuery] = useState('');
   const [hasScrollableContent, setHasScrollableContent] = useState(false);
   const { data: session, status } = useSession();

   const isLoggedIn = status === 'authenticated';
   const [isScrollingDown, setIsScrollingDown] = useState(false);
   const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
   const [isMounted, setIsMounted] = useState(false);

   // 書籤同步狀態
   const bookmarkedAnimes = useBookmarkStore((state) => state.bookmarkedAnimes);
   const setBookmarksFromDB = useBookmarkStore(
      (state) => state.setBookmarksFromDB,
   );
   const clearBookmarks = useBookmarkStore((state) => state.clearBookmarks);
   const [hasSynced, setHasSynced] = useState(false);

   useEffect(() => {
      setIsMounted(true);
   }, []);

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
      const scrollContainer = document.querySelector<HTMLElement>(
         SCROLL_CONTAINER_SELECTOR,
      );
      const target = scrollContainer || window;
      let lastScrollY = scrollContainer
         ? scrollContainer.scrollTop
         : window.scrollY;

      const handleScroll = () => {
         const currentScrollY = scrollContainer
            ? scrollContainer.scrollTop
            : window.scrollY;

         if (currentScrollY <= 50) {
            setIsScrollingDown(false); // 頂部始終顯示
         } else if (currentScrollY > lastScrollY + 10) {
            setIsScrollingDown(true); // 向下滑動，隱藏
         } else if (currentScrollY < lastScrollY - 10) {
            setIsScrollingDown(false); // 向上滑動，顯示
         }
         lastScrollY = currentScrollY;
      };

      target.addEventListener('scroll', handleScroll, { passive: true });
      return () => target.removeEventListener('scroll', handleScroll);
   }, [pathname]);

   // 登入後自動同步 Local Storage 與資料庫
   useEffect(() => {
      if (!isLoggedIn || hasSynced) {
         return;
      }

      let canceled = false;

      const syncBookmarks = async () => {
         try {
            const res = await fetch('/api/bookmarks/sync', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ localBookmarks: bookmarkedAnimes }),
            });

            if (!res.ok || canceled) {
               return;
            }

            const data = await res.json();
            if (!canceled) {
               setBookmarksFromDB(data.bookmarks);
               setHasSynced(true);
            }
         } catch (error) {
            console.error('Sync failed', error);
         }
      };

      syncBookmarks();

      return () => {
         canceled = true;
      };
   }, [isLoggedIn, hasSynced, bookmarkedAnimes, setBookmarksFromDB]);

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

   const avatarSrc =
      session?.user?.image ||
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=A07CFE';
   const displayName = session?.user?.name || session?.user?.email || 'User';

   return (
      <header
         className={`absolute top-0 left-0 z-50 flex w-full items-center justify-between gap-4 p-2.5 transition-all duration-500 sm:px-8 sm:py-4 
            ${
               hasScrollableContent
                  ? 'bg-[#05070a] border-b border-white/10'
                  : 'bg-transparent'
            } 
            ${isScrollingDown ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'} 
            ${pathname === PATHS.BOOKMARK ? 'border-b border-white/10' : ''}`}
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
               className="min-h-10 w-full min-w-0 bg-transparent font-sans text-sm text-white outline-none transition-colors placeholder:text-slate-500 sm:min-h-11 max-md:text-xs"
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

         <div className="h-full items-center flex">
            {!isMounted || status === 'loading' ? (
               <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-400 sm:px-6 sm:py-2.5 sm:text-sm">
                  Loading...
               </div>
            ) : isLoggedIn ? (
               <div className="flex items-center gap-4 lg:gap-6">
                  <button className="relative text-slate-400 hover:text-white transition-colors duration-300">
                     <IoNotificationsOutline size={24} />
                     <span className="absolute top-0 right-0 w-2 h-2 bg-anime-primary rounded-full border border-[#0B0E14]"></span>
                  </button>
                  <button
                     onClick={() => {
                        clearBookmarks(); // 登出時清空本地書籤
                        setHasSynced(false);
                        signOut({ callbackUrl: PATHS.HOME });
                     }}
                     className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-anime-primary transition-all duration-300 active:scale-95"
                     title="Sign Out"
                  >
                     <Image
                        src={avatarSrc}
                        alt={displayName}
                        width={40}
                        height={40}
                        unoptimized
                        className="w-full h-full object-cover"
                     />
                  </button>
               </div>
            ) : (
               <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="rounded-xl h-full bg-anime-primary px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-anime-primary/90 hover:shadow-[0_0_20px_rgba(160,124,254,0.6)] active:scale-95 sm:px-6 sm:py-2.5 sm:text-sm"
               >
                  Sign In
               </button>
            )}
         </div>

         <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
         />
      </header>
   );
}
