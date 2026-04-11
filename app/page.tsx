// app/page.tsx
import { getSeasonAnime } from '@/lib/jikan-api';
import SlideShow from './_components/SlideShow';

export default async function HomePage() {
   const data = await getSeasonAnime(18);

   return (
      <main className="flex-1 relative h-screen w-full min-w-0 overflow-hidden bg-[#0B0E14]">
         {data && data.length > 0 ? (
            <SlideShow animes={data} />
         ) : (
            <div className="flex h-full items-center justify-center text-anime-text/40">
               No anime data available. Please try again later.
            </div>
         )}
      </main>
   );
}
