'use client';

import { useEffect, useState } from 'react';
import { FilterDropdown } from './FilterDropdown';
import { GENRES, SORTS, STATUSES, TYPES } from './exploreConstants';

const SCROLL_CONTAINER_SELECTOR = '[data-header-scroll-container="true"]';

interface ExploreFiltersBarProps {
   selectedGenre: string;
   selectedStatus: string;
   selectedType: string;
   selectedSort: string;
   searchQuery: string;
   onGenreChange: (value: string) => void;
   onStatusChange: (value: string) => void;
   onTypeChange: (value: string) => void;
   onSortChange: (value: string) => void;
   onResetFilters: () => void;
   onClearSearch: () => void;
}

export function ExploreFiltersBar({
   selectedGenre,
   selectedStatus,
   selectedType,
   selectedSort,
   searchQuery,
   onGenreChange,
   onStatusChange,
   onTypeChange,
   onSortChange,
   onResetFilters,
   onClearSearch,
}: ExploreFiltersBarProps) {
   const [isScrollingDown, setIsScrollingDown] = useState(false);

   const hasActiveFilters =
      selectedGenre ||
      selectedStatus ||
      selectedType ||
      selectedSort !== 'popularity-asc';

   useEffect(() => {
      if (typeof window === 'undefined') return;

      let cleanupScrollListener: (() => void) | null = null;

      const setupScrollListener = () => {
         cleanupScrollListener?.();

         if (window.innerWidth < 768) {
            setIsScrollingDown(false);
            cleanupScrollListener = null;
            return;
         }

         const scrollContainer = document.querySelector<HTMLElement>(
            SCROLL_CONTAINER_SELECTOR,
         );
         const target: HTMLElement | Window = scrollContainer || window;

         let lastScrollY = scrollContainer
            ? scrollContainer.scrollTop
            : window.scrollY;

         const handleScroll = () => {
            const currentScrollY = scrollContainer
               ? scrollContainer.scrollTop
               : window.scrollY;

            if (currentScrollY <= 50) {
               setIsScrollingDown(false);
            } else if (currentScrollY > lastScrollY + 10) {
               setIsScrollingDown(true);
            } else if (currentScrollY < lastScrollY - 10) {
               setIsScrollingDown(false);
            }

            lastScrollY = currentScrollY;
         };

         target.addEventListener('scroll', handleScroll, { passive: true });
         cleanupScrollListener = () => {
            target.removeEventListener('scroll', handleScroll);
         };
      };

      setupScrollListener();
      window.addEventListener('resize', setupScrollListener);

      return () => {
         cleanupScrollListener?.();
         window.removeEventListener('resize', setupScrollListener);
      };
   }, []);

   return (
      <div
         className={`md:sticky top-17 sm:top-[78.5px] z-30 py-4 bg-[#0B0E14] w-full mx-0 box-border px-4 md:px-8 transition-all duration-500 ${
            isScrollingDown
               ? 'md:-translate-y-full md:opacity-0 md:pointer-events-none'
               : 'translate-y-0 opacity-100'
         }`}
      >
         <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2.5 sm:gap-4">
               <FilterDropdown
                  label="Genre"
                  value={selectedGenre}
                  options={GENRES}
                  onChange={onGenreChange}
               />
               <FilterDropdown
                  label="Status"
                  value={selectedStatus}
                  options={STATUSES}
                  onChange={onStatusChange}
               />
               <FilterDropdown
                  label="Format"
                  value={selectedType}
                  options={TYPES}
                  onChange={onTypeChange}
               />
               <FilterDropdown
                  label="Sort By"
                  value={selectedSort}
                  options={SORTS}
                  onChange={onSortChange}
               />

               {hasActiveFilters && (
                  <button
                     onClick={onResetFilters}
                     className="h-14 rounded-xl border border-red-400/30 bg-red-500/10 px-4 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20"
                  >
                     Reset
                  </button>
               )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
               {searchQuery ? (
                  <>
                     <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200">
                        Search: {searchQuery}
                     </span>
                     <button
                        onClick={onClearSearch}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-300 transition-colors hover:border-anime-primary/50 hover:text-white"
                     >
                        Clear Search
                     </button>
                  </>
               ) : (
                  <span className="hidden xl:inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                     Use the top bar to search.
                  </span>
               )}
            </div>
         </div>
         <div className="border-b border-white/10 left-0 right-0 h-px absolute bottom-0 mx-6.5"></div>
      </div>
   );
}
