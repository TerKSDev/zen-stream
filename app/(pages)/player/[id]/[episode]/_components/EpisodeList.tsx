'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IoPlayCircle, IoSearch, IoClose } from 'react-icons/io5';

interface EpisodeListProps {
   episodes: any[];
   currentEpNumber: string;
   malId: string;
   isDrawer?: boolean;
   onClose?: () => void;
}

export default function EpisodeList({
   episodes,
   currentEpNumber,
   malId,
   isDrawer,
   onClose,
}: EpisodeListProps) {
   const [search, setSearch] = useState('');

   // 根據集數或標題過濾
   const filteredEpisodes = episodes.filter(
      (ep) =>
         ep.number.toString().includes(search) ||
         (ep.title && ep.title.toLowerCase().includes(search.toLowerCase())),
   );

   return (
      <div className={isDrawer 
         ? "absolute top-0 right-0 w-full sm:w-[380px] h-full bg-[#0B0E14]/95 border-l border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl z-[9999] flex flex-col pointer-events-auto transition-transform"
         : "w-full lg:w-[400px] shrink-0 flex flex-col h-[500px] lg:h-full bg-[#0B0E14]/80 border border-white/10 rounded-2xl backdrop-blur-3xl overflow-hidden shadow-2xl ring-1 ring-white/5"}>
         <div className="px-6 py-5 border-b border-white/10 bg-black/40 relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-anime-primary to-transparent opacity-50" />

            <div className="flex justify-between items-center mb-5 mt-1">
               <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-anime-primary rounded-full shadow-[0_0_10px_rgba(160,124,254,0.8)]" />
                  Playlist
               </h3>
               <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                     {episodes.length} EPS
                  </span>
                  {isDrawer && (
                     <button onClick={onClose} className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <IoClose size={24} />
                     </button>
                  )}
               </div>
            </div>

            {/* 搜尋框 */}
            <div className="relative group">
               <IoSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-anime-primary transition-colors"
                  size={18}
               />
               <input
                  type="text"
                  placeholder="Search Episode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-anime-primary/50 focus:ring-1 focus:ring-anime-primary/50 transition-all shadow-inner"
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/5 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
            {filteredEpisodes.length > 0 ? (
               filteredEpisodes.map((ep: any) => {
                  const isCurrent = ep.number.toString() === currentEpNumber;
                  return (
                     <Link
                        href={`/player/${malId}/${ep.number}`}
                        key={ep.id}
                        className={`relative flex items-center gap-4 p-3 md:p-4 rounded-xl transition-all duration-300 group overflow-hidden ${
                           isCurrent 
                              ? 'bg-gradient-to-r from-anime-primary/20 to-anime-primary/5 border border-anime-primary/30 shadow-[0_4px_20px_rgba(160,124,254,0.15)]' 
                              : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                     >
                        <div className="absolute inset-0 bg-gradient-to-br from-anime-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {isCurrent && (
                           <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-anime-primary shadow-[0_0_15px_rgba(160,124,254,1)] rounded-l-xl" />
                        )}
                        <div className="flex flex-col flex-1 min-w-0 pl-2 relative z-10">
                           <div className="flex items-center justify-between mb-1.5">
                              <span
                                 className={`text-[10px] font-black tracking-widest uppercase ${isCurrent ? 'text-anime-primary drop-shadow-[0_0_5px_rgba(160,124,254,0.5)]' : 'text-slate-500 group-hover:text-anime-primary/80 transition-colors'}`}
                              >
                                 Episode {ep.number}
                              </span>
                              {isCurrent && (
                                 <span className="text-[9px] font-bold text-anime-primary bg-anime-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse border border-anime-primary/20">
                                    Now Playing
                                 </span>
                              )}
                           </div>
                           <span
                              className={`text-sm font-bold line-clamp-1 transition-colors ${isCurrent ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}
                           >
                              {ep.title || `Episode ${ep.number}`}
                           </span>
                        </div>
                        <IoPlayCircle
                           className={`shrink-0 relative z-10 transition-all duration-300 ${isCurrent ? 'text-anime-primary opacity-100 drop-shadow-[0_0_10px_rgba(160,124,254,0.8)] scale-110' : 'text-white/20 opacity-0 group-hover:opacity-100 group-hover:scale-110 group-hover:text-white/80'}`}
                           size={32}
                        />
                     </Link>
                  );
               })
            ) : (
               <div className="p-8 text-center flex flex-col items-center gap-2 text-slate-500">
                  <IoSearch size={32} className="opacity-20" />
                  <span className="text-sm">No episodes found.</span>
               </div>
            )}
         </div>
      </div>
   );
}
