// components/AnimeEpisodes.tsx
import { IoPlayCircle } from 'react-icons/io5';
import Link from 'next/link';

interface Episode {
   mal_id: number;
   title: string;
   title_romanji?: string | null;
   aired?: string | null;
}

interface AnimeEpisodesProps {
   episodes: Episode[];
   animeId: string;
}

export default function AnimeEpisodes({
   episodes,
   animeId,
}: AnimeEpisodesProps) {
   if (!episodes || episodes.length === 0) return null;

   return (
      <div className="w-full mt-6 lg:mt-8">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
               <div className="w-1.5 h-6 bg-anime-primary rounded-full shadow-[0_0_10px_rgba(160,124,254,0.6)]" />
               Episodes
            </h3>
            <span className="text-xs font-bold text-anime-primary bg-anime-primary/10 border border-anime-primary/20 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(160,124,254,0.2)] tracking-wider">
               {episodes.length} EPS
            </span>
         </div>

         {/* 加入內部滾動條，避免集數過多（如海賊王）導致頁面無限拉長 */}
         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 max-h-[450px] lg:max-h-[600px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 transition-all">
            {episodes.map((ep) => (
               <Link
                  href={`/player/${animeId}?ep=${ep.mal_id}`}
                  key={ep.mal_id}
                  className="relative flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-anime-primary/50 hover:shadow-[0_0_20px_rgba(160,124,254,0.15)] transition-all duration-300 group cursor-pointer overflow-hidden"
               >
                  <div className="absolute inset-0 bg-linear-to-br from-anime-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="flex justify-between items-center relative z-10">
                     <span className="text-anime-primary font-black text-sm bg-anime-primary/10 px-2 py-0.5 rounded-md drop-shadow-[0_0_5px_rgba(160,124,254,0.4)]">
                        EP {ep.mal_id}
                     </span>
                     {ep.aired && (
                        <span className="text-[11px] text-slate-400 font-medium">
                           {new Date(ep.aired).toLocaleDateString()}
                        </span>
                     )}
                  </div>
                  <div className="relative z-10 flex justify-between items-end gap-2 mt-1">
                     <div className="flex flex-col flex-1">
                        <h4 className="text-slate-200 font-bold text-sm line-clamp-1 group-hover:text-white transition-colors">
                           {ep.title}
                        </h4>
                        {ep.title_romanji && (
                           <span className="text-xs text-slate-500 line-clamp-1 mt-0.5 group-hover:text-slate-400 transition-colors">
                              {ep.title_romanji}
                           </span>
                        )}
                     </div>
                     <IoPlayCircle
                        className="text-anime-primary/40 group-hover:text-anime-primary group-hover:drop-shadow-[0_0_8px_rgba(160,124,254,0.8)] transition-all shrink-0"
                        size={26}
                     />
                  </div>
               </Link>
            ))}
         </div>
      </div>
   );
}
