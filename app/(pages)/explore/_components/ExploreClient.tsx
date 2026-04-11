'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoStar, IoChevronDown, IoSearch } from 'react-icons/io5';

// Jikan API 常用的 Genres ID
const GENRES = [
   { id: '', name: 'All Genres' },
   { id: '1', name: 'Action' },
   { id: '2', name: 'Adventure' },
   { id: '4', name: 'Comedy' },
   { id: '8', name: 'Drama' },
   { id: '10', name: 'Fantasy' },
   { id: '14', name: 'Horror' },
   { id: '22', name: 'Romance' },
   { id: '24', name: 'Sci-Fi' },
   { id: '36', name: 'Slice of Life' },
   { id: '30', name: 'Sports' },
   { id: '37', name: 'Supernatural' },
   { id: '41', name: 'Suspense' },
];

const STATUSES = [
   { id: '', name: 'Any Status' },
   { id: 'airing', name: 'Currently Airing' },
   { id: 'complete', name: 'Finished Airing' },
   { id: 'upcoming', name: 'Upcoming' },
];

export default function ExploreClient({ initialAnime }: { initialAnime: any[] }) {
   const [animeList, setAnimeList] = useState<any[]>(initialAnime);
   const [page, setPage] = useState(1);
   const [loading, setLoading] = useState(false);
   const [hasMore, setHasMore] = useState(true);

   // 過濾狀態
   const [selectedGenre, setSelectedGenre] = useState('');
   const [selectedStatus, setSelectedStatus] = useState('');
   const [searchQuery, setSearchQuery] = useState('');
   const [initialRender, setInitialRender] = useState(true);

   // 當 Filter 改變時，延遲 800ms 後重新抓取 (Debounce 以防止 429 錯誤)
   useEffect(() => {
      if (initialRender) {
         setInitialRender(false);
         return;
      }

      const fetchFilteredData = async () => {
         setLoading(true);
         setPage(1);
         try {
            let url = `https://api.jikan.moe/v4/anime?limit=24&page=1&order_by=popularity&sort=asc`;
            if (selectedGenre) url += `&genres=${selectedGenre}`;
            if (selectedStatus) url += `&status=${selectedStatus}`;
            if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('API Rate Limit Reached');
            const data = await res.json();
            
            setAnimeList(data.data || []);
            setHasMore(data.pagination?.has_next_page || false);
         } catch (err) {
            console.error('Failed to fetch filtered anime:', err);
         } finally {
            setLoading(false);
         }
      };

      const timer = setTimeout(fetchFilteredData, 800);
      return () => clearTimeout(timer);
   }, [selectedGenre, selectedStatus, searchQuery]);

   // 載入更多 (Load More) 功能
   const loadMore = async () => {
      if (loading || !hasMore) return;
      setLoading(true);
      const nextPage = page + 1;
      try {
         let url = `https://api.jikan.moe/v4/anime?limit=24&page=${nextPage}&order_by=popularity&sort=asc`;
         if (selectedGenre) url += `&genres=${selectedGenre}`;
         if (selectedStatus) url += `&status=${selectedStatus}`;
         if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

         const res = await fetch(url);
         if (!res.ok) throw new Error('API Rate Limit Reached');
         const data = await res.json();
         
         // 附加到現有陣列中 (並利用 Set 過濾潛在的重複 ID)
         setAnimeList((prev) => {
            const existingIds = new Set(prev.map(a => a.mal_id));
            const newAnime = (data.data || []).filter((a: any) => !existingIds.has(a.mal_id));
            return [...prev, ...newAnime];
         });
         setPage(nextPage);
         setHasMore(data.pagination?.has_next_page || false);
      } catch (err) {
         console.error('Failed to load more anime:', err);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="px-6 md:px-8 lg:px-12 pb-24 flex flex-col gap-6">
         {/* 頂部控制列 (Filters & Search Bar) - 懸浮毛玻璃設計 */}
         <div className="sticky top-0 z-40 bg-[#0B0E14]/85 backdrop-blur-2xl py-4 border-y border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between -mx-6 px-6 md:-mx-8 md:px-8 lg:-mx-12 lg:px-12 mb-4 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
            <div className="flex w-full md:w-auto gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden shrink-0">
               {/* 類型下拉選單 */}
               <div className="relative group shrink-0">
                  <select
                     value={selectedGenre}
                     onChange={(e) => setSelectedGenre(e.target.value)}
                     className="appearance-none bg-white/5 border border-white/10 hover:border-anime-primary/50 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-anime-primary transition-all cursor-pointer"
                  >
                     {GENRES.map((g) => (
                        <option key={g.name} value={g.id} className="bg-[#0B0E14] text-white">{g.name}</option>
                     ))}
                  </select>
                  <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-anime-primary transition-colors" />
               </div>

               {/* 狀態下拉選單 */}
               <div className="relative group shrink-0">
                  <select
                     value={selectedStatus}
                     onChange={(e) => setSelectedStatus(e.target.value)}
                     className="appearance-none bg-white/5 border border-white/10 hover:border-anime-primary/50 text-white text-sm font-bold rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-anime-primary transition-all cursor-pointer"
                  >
                     {STATUSES.map((s) => (
                        <option key={s.name} value={s.id} className="bg-[#0B0E14] text-white">{s.name}</option>
                     ))}
                  </select>
                  <IoChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-anime-primary transition-colors" />
               </div>
            </div>

            {/* 搜尋框 */}
            <div className="relative w-full md:w-64 shrink-0 group">
               <IoSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-anime-primary transition-colors" size={18} />
               <input
                  type="text"
                  placeholder="Search anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-anime-primary/50 focus:ring-1 focus:ring-anime-primary/50 transition-all shadow-inner"
               />
            </div>
         </div>

         {/* 動態網格區塊 (Grid) */}
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 auto-rows-max">
            {animeList.map((anime, index) => {
               // 判斷是否為前三名 (且在無任何過濾條件的第一頁)，來加入特殊醒目的樣式打破單調感
               const isTop3 = index < 3 && page === 1 && !selectedGenre && !selectedStatus && !searchQuery;
               const badgeColor = index === 0 ? 'bg-yellow-500 text-yellow-950 border-yellow-400' : index === 1 ? 'bg-slate-300 text-slate-800 border-slate-200' : 'bg-amber-700 text-amber-100 border-amber-600';
               const glowStyle = isTop3 ? (index === 0 ? 'group-hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] ring-1 ring-yellow-500/50' : 'group-hover:shadow-[0_15px_30px_rgba(255,255,255,0.2)] border border-white/20') : 'group-hover:shadow-[0_15px_30px_rgba(160,124,254,0.25)] border border-white/10';

               return (
                  <Link href={`/anime/${anime.mal_id}`} key={`${anime.mal_id}-${index}`} className="group relative flex flex-col gap-2 rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-2">
                     <div className={`relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-white/5 transition-all duration-500 ${glowStyle}`}>
                        <Image src={anime.images.webp.large_image_url} alt={anime.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* 左上徽章 */}
                        {isTop3 ? (
                           <div className={`absolute top-2.5 left-2.5 flex items-center gap-1 ${badgeColor} px-2.5 py-1 rounded-lg border shadow-lg`}>
                              <span className="text-[10px] font-black uppercase tracking-wider">#{index + 1} Trending</span>
                           </div>
                        ) : (
                           anime.score && (
                              <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-lg">
                                 <IoStar className="text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" size={12} />
                                 <span className="text-[11px] font-black text-white">{anime.score}</span>
                              </div>
                           )
                        )}

                        {/* 底部資訊 */}
                        <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                           <h3 className="text-sm font-bold text-white line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-snug">{anime.title_english || anime.title}</h3>
                           <div className="flex flex-wrap gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                              <span className="text-[9px] font-black px-1.5 py-0.5 bg-anime-primary/80 rounded text-white uppercase tracking-wider">{anime.type}</span>
                              {anime.genres?.slice(0, 2).map((g: any) => (
                                 <span key={g.mal_id} className="text-[9px] font-bold px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded text-white/90 whitespace-nowrap">{g.name}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                  </Link>
               );
            })}
         </div>

         {/* Load More Area */}
         {hasMore && animeList.length > 0 && (
            <div className="w-full flex justify-center mt-8">
               <button onClick={loadMore} disabled={loading} className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-anime-primary hover:border-anime-primary/50 hover:shadow-[0_0_20px_rgba(160,124,254,0.4)] text-white font-bold rounded-xl transition-all duration-300 flex items-center gap-3 disabled:opacity-50">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Load More Anime'}
               </button>
            </div>
         )}
         
         {/* 空狀態顯示 */}
         {animeList.length === 0 && !loading && (
            <div className="w-full py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
               <IoSearch size={48} className="opacity-20" />
               <p className="text-base font-bold">No anime found matching your filters.</p>
            </div>
         )}
      </div>
   );
}