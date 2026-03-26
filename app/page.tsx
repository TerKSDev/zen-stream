import Image from 'next/image';
import { getSeasonAnime } from './api/jikan/route';

export default async function Home() {
   const data = await getSeasonAnime(20); // 建議首頁先拿 20 個，Jikan 一頁預設是 25 個

   return (
      <main className="min-h-screen text-anime-text p-6 md:p-12">
         {/* 標題區域 */}
         <div className="mb-8">
            <h1 className="text-3xl font-bold font-brand text-anime-primary">
               當季熱門新番
            </h1>
            <p className="text-anime-text/60 text-sm mt-2">
               探索 2026 春季最新動漫
            </p>
         </div>

         {/* 動漫網格佈局 */}
         {data && data.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
               {data.map((anime: any) => (
                  <div
                     key={anime.mal_id}
                     className="group flex flex-col gap-3 bg-anime-secondary/30 p-2 rounded-xl border border-white/5 hover:border-anime-primary/50 transition-all duration-300"
                  >
                     {/* 圖片容器 - 固定比例 */}
                     <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg shadow-lg">
                        <Image
                           src={anime.images.webp.large_image_url}
                           alt={anime.title}
                           fill // 使用 fill 自動填滿容器，不用手動寫死寬高
                           className="object-cover group-hover:scale-110 transition-transform duration-500"
                           sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 15vw"
                        />
                        {/* 評分標籤 */}
                        {anime.score && (
                           <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-xs text-yellow-400 font-bold border border-white/10">
                              ★ {anime.score}
                           </div>
                        )}
                     </div>

                     {/* 文字內容 */}
                     <div className="flex flex-col gap-1">
                        <h2 className="text-sm font-semibold line-clamp-2 min-h-[40px] group-hover:text-anime-primary transition-colors">
                           {anime.title_english || anime.title}
                        </h2>
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] text-anime-text/40 bg-white/5 px-2 py-0.5 rounded uppercase">
                              {anime.type || 'TV'}
                           </span>
                           <span className="text-[11px] text-anime-text/60">
                              {anime.episodes
                                 ? `${anime.episodes} Ep`
                                 : '?? Ep'}
                           </span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="flex h-64 items-center justify-center text-anime-text/40">
               暫時找不到數據，可能 API 正在休息...
            </div>
         )}
      </main>
   );
}
