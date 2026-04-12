// app/page.tsx
import { getSeasonAnime } from '@/lib/services/anime/jikan-api';
import HeroSection from '@/app/_components/Hero';

export default async function HomePage() {
   // 多請求一些資料作為緩衝，確保去重後還有足夠的數量
   const data = await getSeasonAnime(25);

   return (
      <main className="flex-1 relative h-screen w-full min-w-0 overflow-hidden bg-[#0B0E14]">
         {data && data.length > 0 ? (
            <HeroSection animes={data} />
         ) : (
            <div className="flex h-full items-center justify-center text-anime-text/40">
               No anime data available. Please try again later.
            </div>
         )}
      </main>
   );
}
