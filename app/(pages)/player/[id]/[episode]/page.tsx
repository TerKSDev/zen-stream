// app/anime/[id]/page.tsx
import VideoPlayer from './_components/VideoPlayer';
import {
   getStreamingLinks,
   searchAnimeOnConsumet,
   getAnimeEpisodes,
} from '@/app/api/consumet/route';

export default async function AnimeWatchPage({
   params,
}: {
   params: Promise<{ id: string }>;
}) {
   const param = await params;
   const malId = await param.id;

   // 1. 先從 Jikan 獲取動漫詳細資訊 (取得精確標題與海報)
   const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
   const jikanData = await jikanRes.json();
   const anime = jikanData.data;

   // 優先使用英文名或默認羅馬音搜尋 Consumet
   const searchQuery = anime.title_english || anime.title;

   // 2. 串聯 Consumet API
   const consumetId = await searchAnimeOnConsumet(searchQuery);

   let episodes = [];
   let streamUrl = null;

   if (consumetId) {
      episodes = await getAnimeEpisodes(consumetId);

      if (episodes.length > 0) {
         const firstEpisodeId = episodes[0].id;
         // 🌟 這裡注意：streamingData 現在是 { url, referer }
         const streamingData = await getStreamingLinks(firstEpisodeId);

         // 只把網址字串交給 streamUrl 變數
         streamUrl = streamingData?.url || null;
      }
   }

   return (
      <main className="min-h-screen bg-[#0B0E14] text-white p-6 md:p-12 pt-24">
         <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左側：播放器與簡介區 */}
            <div className="lg:col-span-2 flex flex-col gap-6">
               <h1 className="text-2xl md:text-3xl font-bold">
                  {searchQuery} - Episode 1
               </h1>

               {/* 🌟 核心播放器：如果拿到 streamUrl 就渲染我們剛才寫的 VideoPlayer */}
               {streamUrl ? (
                  <VideoPlayer
                     videoUrl={streamUrl}
                     poster={anime.images.webp.large_image_url}
                  />
               ) : (
                  <div className="w-full aspect-video bg-black/50 border border-white/10 rounded-xl flex items-center justify-center text-white/50">
                     無法找到該動漫的播放源 (No sources found)
                  </div>
               )}

               {/* 動漫簡介 */}
               <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                  <h2 className="text-xl font-bold mb-4 text-[#A07CFE]">
                     Synopsis
                  </h2>
                  <p className="text-white/70 leading-relaxed text-sm">
                     {anime.synopsis}
                  </p>
               </div>
            </div>

            {/* 右側：集數選擇列表 (UI 預留) */}
            <div className="flex flex-col gap-4 bg-black/40 p-4 rounded-xl border border-white/5 h-fit max-h-[800px] overflow-y-auto scrollbar-hide">
               <h3 className="font-bold text-lg mb-2">
                  Episodes ({episodes.length})
               </h3>

               {episodes.map((ep: any) => (
                  <button
                     key={ep.id}
                     className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-[#A07CFE]/20 hover:border-[#A07CFE]/50 border border-transparent transition-all flex items-center justify-between group"
                  >
                     <span className="font-medium text-white/80 group-hover:text-white">
                        Episode {ep.number}
                     </span>
                     {/* 這裡可以放一個小的播放圖標 */}
                  </button>
               ))}
            </div>
         </div>
      </main>
   );
}
