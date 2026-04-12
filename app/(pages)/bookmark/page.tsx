'use client';

import {
   Fragment,
   useMemo,
   useState,
   useSyncExternalStore,
   useEffect,
   useRef,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import {
   IoBookmarkOutline,
   IoBookmark,
   IoCompassOutline,
   IoTrashOutline,
   IoWarningOutline,
   IoSearch,
   IoChevronDown,
   IoCheckmark,
} from 'react-icons/io5';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import toast from 'react-hot-toast';

export default function BookmarkPage() {
   const {
      bookmarkedAnimes,
      removeBookmark,
      clearBookmarks,
      addBookmark,
      updateBookmarkStatus,
   } = useBookmarkStore();
   const isMounted = useSyncExternalStore(
      () => () => {},
      () => true,
      () => false,
   );
   const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [sortBy, setSortBy] = useState<'latest' | 'az'>('latest');
   const [activeTab, setActiveTab] = useState<
      'ALL' | 'watching' | 'plan_to_watch' | 'completed'
   >('ALL');
   const [visibleCount, setVisibleCount] = useState(24);
   const loadMoreRef = useRef<HTMLDivElement>(null);

   // 切換過濾條件時，重置顯示數量
   useEffect(() => {
      setVisibleCount(24);
   }, [searchQuery, sortBy, activeTab]);

   // Intersection Observer 實作懶加載 (效能優化)
   useEffect(() => {
      const observer = new IntersectionObserver(
         (entries) => {
            if (entries[0].isIntersecting) {
               setVisibleCount((prev) => prev + 24);
            }
         },
         { rootMargin: '200px' },
      );
      if (loadMoreRef.current) observer.observe(loadMoreRef.current);
      return () => observer.disconnect();
   }, []);

   // Undo 復原刪除機制
   const handleRemove = (e: React.MouseEvent, anime: any) => {
      e.preventDefault();
      removeBookmark(anime.mal_id);
      toast(
         (t) => (
            <div className="flex items-center gap-3">
               <span className="text-sm font-medium">
                  Removed from bookmarks
               </span>
               <button
                  onClick={() => {
                     if (addBookmark) addBookmark(anime);
                     toast.dismiss(t.id);
                     toast.success('Restored!', { id: 'restored' });
                  }}
                  className="text-xs font-bold text-anime-primary bg-anime-primary/10 hover:bg-anime-primary/20 px-3 py-1.5 rounded-lg transition-colors"
               >
                  Undo
               </button>
            </div>
         ),
         { duration: 5000, id: `undo-${anime.mal_id}` },
      );
   };

   // 依據搜尋關鍵字與排序選項，動態過濾並排序書籤
   const filteredAndSortedAnimes = useMemo(() => {
      let result = [...bookmarkedAnimes];

      // 0. 觀看狀態過濾
      if (activeTab !== 'ALL') {
         result = result.filter(
            (anime) => (anime.status || 'plan_to_watch') === activeTab,
         );
      }

      // 1. 執行搜尋過濾
      if (searchQuery.trim()) {
         const lowerQuery = searchQuery.toLowerCase();
         result = result.filter(
            (anime) =>
               anime.title.toLowerCase().includes(lowerQuery) ||
               anime.title_english?.toLowerCase().includes(lowerQuery) ||
               anime.title_japanese?.toLowerCase().includes(lowerQuery),
         );
      }

      // 2. 執行排序
      if (sortBy === 'latest') {
         result.reverse(); // Zustand Store 預設將新項目加在陣列最後，反轉陣列即可讓最新的排前面
      } else if (sortBy === 'az') {
         result.sort((a, b) => {
            const titleA = a.title_english || a.title;
            const titleB = b.title_english || b.title;
            return titleA.localeCompare(titleB);
         });
      }

      return result;
   }, [bookmarkedAnimes, searchQuery, sortBy]);

   return (
      <main className="flex-1 relative h-full w-full min-w-0 bg-[#0B0E14] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
         <div className="flex flex-col min-h-full px-6 py-24 md:px-8 lg:py-26 max-w-screen-2xl mx-auto w-full">
            {/* 標題與數量統計 */}
            <div className="flex items-start justify-between mb-5">
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

               <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white/70 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 shadow-sm hidden sm:block">
                     {isMounted ? bookmarkedAnimes.length : 0} Items
                  </span>
                  {isMounted && bookmarkedAnimes.length > 0 && (
                     <button
                        onClick={() => setIsClearDialogOpen(true)}
                        className="text-xs sm:text-sm font-bold text-red-400 hover:text-white bg-red-400/10 hover:bg-red-500/80 px-4 py-1.5 rounded-full transition-colors border border-red-400/20 hover:border-red-500 shadow-sm"
                     >
                        Clear All
                     </button>
                  )}
               </div>
            </div>

            {/* 搜尋與排序工具列 */}
            {isMounted && bookmarkedAnimes.length > 0 && (
               <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 sm:mb-8">
                  <div className="relative w-full sm:flex-1 group">
                     <IoSearch
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-anime-primary transition-colors"
                        size={18}
                     />
                     <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your bookmarks..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-anime-primary/50 focus:bg-[#0B0E14]/90 focus:ring-1 focus:ring-anime-primary/50 transition-all"
                     />
                  </div>
                  <Listbox value={sortBy} onChange={setSortBy}>
                     <div className="relative w-full sm:w-auto">
                        <Listbox.Button className="flex items-center justify-between w-full sm:w-55 gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 hover:bg-white/10 transition-all min-h-[41.6px] focus:outline-none focus:ring-1 focus:ring-anime-primary/50">
                           <span className="flex items-center gap-2 truncate">
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0">
                                 Sort:
                              </span>
                              <span className="text-sm text-white font-bold truncate">
                                 {sortBy === 'latest'
                                    ? 'Latest Added'
                                    : 'Alphabetical (A-Z)'}
                              </span>
                           </span>
                           <IoChevronDown className="text-slate-400 shrink-0" />
                        </Listbox.Button>
                        <Transition
                           as={Fragment}
                           leave="transition ease-in duration-100"
                           leaveFrom="opacity-100"
                           leaveTo="opacity-0"
                        >
                           <Listbox.Options className="absolute z-50 w-full mt-2 rounded-xl bg-[#141824] border border-white/10 overflow-hidden focus:outline-none p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                              {[
                                 { id: 'latest', name: 'Latest Added' },
                                 { id: 'az', name: 'Alphabetical (A-Z)' },
                              ].map((option) => (
                                 <Listbox.Option
                                    key={option.id}
                                    value={option.id}
                                    className={({ active }) =>
                                       `relative cursor-pointer select-none py-2 px-3 text-sm transition-colors rounded-lg ${
                                          active
                                             ? 'bg-anime-primary/20 text-white'
                                             : 'text-slate-200'
                                       }`
                                    }
                                 >
                                    {({ selected }) => (
                                       <div className="flex items-center justify-between gap-4">
                                          <span
                                             className={`block truncate whitespace-nowrap ${selected ? 'text-white' : ''}`}
                                          >
                                             {option.name}
                                          </span>
                                          {selected && (
                                             <IoCheckmark
                                                className="text-anime-primary shrink-0"
                                                size={16}
                                             />
                                          )}
                                       </div>
                                    )}
                                 </Listbox.Option>
                              ))}
                           </Listbox.Options>
                        </Transition>
                     </div>
                  </Listbox>
               </div>
            )}

            {/* 觀看狀態分類 (Tabs) */}
            {isMounted && bookmarkedAnimes.length > 0 && (
               <div className="flex flex-wrap gap-2 mb-6">
                  {[
                     { id: 'ALL', label: 'All' },
                     { id: 'watching', label: 'Watching' },
                     { id: 'plan_to_watch', label: 'Plan to Watch' },
                     { id: 'completed', label: 'Completed' },
                  ].map((tab) => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                           activeTab === tab.id
                              ? 'bg-anime-primary text-white shadow-[0_0_15px_rgba(160,124,254,0.4)]'
                              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                     >
                        {tab.label}
                     </button>
                  ))}
               </div>
            )}

            {/* 內容區塊 */}
            {!isMounted ? (
               /* 骨架屏 (Skeleton) - 避免載入時畫面閃爍空白，提升 UX */
               <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                  {[...Array(6)].map((_, i) => (
                     <div
                        key={i}
                        className="flex flex-row sm:flex-col gap-4 sm:gap-2 bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-2xl sm:rounded-none border border-white/5 sm:border-transparent"
                     >
                        <div className="w-24 sm:w-full shrink-0 aspect-3/4 rounded-xl bg-white/5 animate-pulse border border-white/10" />
                        <div className="flex-1 flex flex-col justify-center sm:justify-start gap-2 mt-0 sm:mt-1">
                           <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
                           <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse sm:hidden" />
                        </div>
                     </div>
                  ))}
               </div>
            ) : bookmarkedAnimes.length > 0 ? (
               filteredAndSortedAnimes.length > 0 ? (
                  <>
                     <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
                        {filteredAndSortedAnimes
                           .slice(0, visibleCount)
                           .map((anime) => (
                              <Link
                                 href={`/anime/${anime.mal_id}`}
                                 key={anime.mal_id}
                                 className="group relative flex flex-row sm:flex-col gap-4 sm:gap-2 bg-white/5 sm:bg-transparent p-3 sm:p-0 rounded-2xl sm:rounded-none hover:bg-white/10 sm:hover:bg-transparent transition-colors border border-white/5 sm:border-transparent"
                              >
                                 <div className="relative w-24 sm:w-full shrink-0 aspect-3/4 overflow-hidden rounded-xl bg-[#141824] border border-white/5 shadow-lg">
                                    <Image
                                       src={
                                          anime.images?.webp?.large_image_url ||
                                          ''
                                       }
                                       alt={anime.title}
                                       fill
                                       sizes="(max-width: 640px) 100px, (max-width: 1024px) 33vw, 20vw"
                                       className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <button
                                       onClick={(e) => handleRemove(e, anime)}
                                       title="Remove from bookmarks"
                                       className="group/btn absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full text-anime-primary hover:bg-red-500/90 hover:text-white transition-all duration-300"
                                    >
                                       <IoBookmark className="w-4 h-4 group-hover/btn:hidden" />
                                       <IoTrashOutline className="w-4 h-4 hidden group-hover/btn:block" />
                                    </button>
                                 </div>

                                 <div className="flex-1 flex flex-col justify-center sm:justify-start min-w-0 py-1 sm:py-0">
                                    <span className="text-sm md:text-base font-bold text-white line-clamp-2 group-hover:text-anime-primary transition-colors">
                                       {anime.title}
                                    </span>
                                    {/* 手機版專屬：橫向模式下顯示簡單評分與類型 */}
                                    <div className="flex items-center gap-3 mt-2 sm:hidden text-xs font-semibold text-slate-400">
                                       {anime.score && (
                                          <span className="flex items-center text-yellow-400">
                                             ★ {anime.score}
                                          </span>
                                       )}
                                       {anime.type && (
                                          <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase">
                                             {anime.type}
                                          </span>
                                       )}
                                    </div>

                                    {/* 狀態切換下拉選單 */}
                                    <div
                                       className="mt-2 sm:mt-3"
                                       onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                       }}
                                    >
                                       <select
                                          value={
                                             anime.status || 'plan_to_watch'
                                          }
                                          onChange={(e) =>
                                             updateBookmarkStatus?.(
                                                anime.mal_id,
                                                e.target.value,
                                             )
                                          }
                                          className="w-full bg-black/40 text-xs font-semibold text-slate-300 border border-white/10 rounded-lg p-1.5 outline-none focus:border-anime-primary transition-colors cursor-pointer"
                                       >
                                          <option value="plan_to_watch">
                                             🗓️ Plan to Watch
                                          </option>
                                          <option value="watching">
                                             ▶️ Watching
                                          </option>
                                          <option value="completed">
                                             ✅ Completed
                                          </option>
                                       </select>
                                    </div>
                                 </div>
                              </Link>
                           ))}
                     </div>
                     {/* 載入更多指示器 */}
                     {visibleCount < filteredAndSortedAnimes.length && (
                        <div
                           ref={loadMoreRef}
                           className="h-10 w-full flex items-center justify-center mt-8"
                        >
                           <div className="w-6 h-6 border-2 border-anime-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                     )}
                  </>
               ) : (
                  /* 搜尋無結果狀態 */
                  <div className="flex-1 flex flex-col items-center justify-center text-center mt-12 mb-24">
                     <IoSearch className="w-12 h-12 text-white/20 mb-4" />
                     <h2 className="text-xl font-bold text-white mb-2">
                        No bookmarks found
                     </h2>
                     <p className="text-sm text-slate-400">
                        Try adjusting your search query or status filter.
                     </p>
                  </div>
               )
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center mt-12 mb-24">
                  <div className="w-24 h-24 mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md">
                     <IoBookmarkOutline className="w-10 h-10 text-white/30" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                     Your bookmark list is empty
                  </h2>
                  <p className="text-slate-400 max-w-md mb-8 text-sm md:text-base leading-relaxed">
                     Looks like you haven&apos;t bookmarked any anime yet.
                     Discover top trending shows and add them to your list!
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

         {/* 清空確認對話框 (Clear All Modal) */}
         <Transition appear show={isClearDialogOpen} as={Fragment}>
            <Dialog
               as="div"
               className="relative z-100"
               onClose={() => setIsClearDialogOpen(false)}
            >
               <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
               >
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
               </Transition.Child>

               <div className="fixed inset-0 overflow-y-auto">
                  <div className="flex min-h-full items-center justify-center p-4 text-center">
                     <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                     >
                        <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-[#0B0E14] border border-white/10 p-6 text-left align-middle shadow-2xl transition-all">
                           <div className="flex items-center gap-4 mb-4">
                              <div className="p-3 bg-red-500/10 text-red-500 rounded-full border border-red-500/20">
                                 <IoWarningOutline size={24} />
                              </div>
                              <Dialog.Title
                                 as="h3"
                                 className="text-xl font-black text-white"
                              >
                                 Clear All Bookmarks
                              </Dialog.Title>
                           </div>
                           <p className="text-sm text-slate-400 mb-6">
                              Are you sure you want to remove all anime from
                              your bookmarks? This action cannot be undone.
                           </p>
                           <div className="flex items-center justify-end gap-3 mt-4">
                              <button
                                 onClick={() => setIsClearDialogOpen(false)}
                                 className="px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 rounded-xl transition-colors"
                              >
                                 Cancel
                              </button>
                              <button
                                 onClick={() => {
                                    clearBookmarks();
                                    setIsClearDialogOpen(false);
                                    toast.success('All bookmarks cleared');
                                 }}
                                 className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                              >
                                 Yes, Clear All
                              </button>
                           </div>
                        </Dialog.Panel>
                     </Transition.Child>
                  </div>
               </div>
            </Dialog>
         </Transition>
      </main>
   );
}
