import { IoCompassOutline } from 'react-icons/io5';
import ExploreClient from './_components/ExploreClient';

export default async function ExplorePage({
   searchParams,
}: {
   searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
   const resolvedParams = await searchParams;
   const genre = (resolvedParams.genre as string) || '';
   const status = (resolvedParams.status as string) || '';
   const q = (resolvedParams.q as string) || '';

   let url = `https://api.jikan.moe/v4/anime?limit=24&page=1&order_by=popularity&sort=asc`;
   if (genre) url += `&genres=${genre}`;
   if (status) url += `&status=${status}`;
   if (q) url += `&q=${encodeURIComponent(q)}`;

   // 抓取初始化資料，讓網格瞬間出現 (包含透過 URL 分享進來的過濾狀態)
   // 使用 next: { revalidate: 3600 } 讓這份資料在背景快取 1 小時，提升載入速度
   const res = await fetch(url, {
      next: { revalidate: 3600 },
   }).catch(() => null);
   const data = res?.ok ? await res.json() : null;
   const animeList = data?.data || [];

   return (
      <main className="flex-1 relative min-h-screen max-w-[calc(100vw-66px)] md:max-w-full w-full overflow-y-auto bg-[#0B0E14] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
         {/* 標題 Header 區塊 */}
         <div className="relative pt-24 pb-6 px-6 md:px-8 lg:px-12 bg-gradient-to-b from-[#0B0E14] via-[#0B0E14]/90 to-transparent z-10">
            <div className="flex items-center gap-3 mb-2">
               <IoCompassOutline
                  className="text-anime-primary drop-shadow-[0_0_15px_rgba(160,124,254,0.6)]"
                  size={36}
               />
               <h1 className="text-3xl md:text-4xl font-black text-white tracking-wide drop-shadow-md">
                  Explore
               </h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mt-2">
               Discover the most popular, highly-rated, and trending anime
               series. Filter by your favorite genres to find your next binge.
            </p>
         </div>

         {/* 互動式客戶端組件 (含 Filter, Search 與 Load More 功能) */}
         <ExploreClient
            key={`${genre}-${status}-${q}`} // 確保瀏覽器上一頁/下一頁時，組件能完美重置並同步狀態
            initialAnime={animeList}
            initialGenre={genre}
            initialStatus={status}
            initialQuery={q}
         />
      </main>
   );
}
