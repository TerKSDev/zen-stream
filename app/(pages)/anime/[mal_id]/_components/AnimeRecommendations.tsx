// components/AnimeRecommendations.tsx
import Image from 'next/image';
import Link from 'next/link';

interface Recommendation {
   entry: {
      mal_id: number;
      title: string;
      images: {
         webp: {
            large_image_url: string;
         };
      };
   };
}

interface AnimeRecommendationsProps {
   recommendations: Recommendation[];
}

export default function AnimeRecommendations({
   recommendations,
}: AnimeRecommendationsProps) {
   if (!recommendations || recommendations.length === 0) return null;

   return (
      <div className="px-6 md:px-8 mt-12 lg:mt-16">
         <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
            <div className="w-1.5 h-6 bg-anime-primary rounded-full" />
            More Like This
         </h3>
         <div className="flex gap-4 overflow-x-auto pb-6 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {recommendations.slice(0, 15).map((rec) => (
               <Link
                  key={rec.entry.mal_id}
                  href={`/anime/${rec.entry.mal_id}`}
                  className="flex-none w-[140px] md:w-[160px] group relative rounded-xl overflow-hidden aspect-[3/4] border border-white/5 hover:border-anime-primary/50 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(160,124,254,0.3)]"
               >
                  <Image
                     src={rec.entry.images.webp.large_image_url}
                     alt={rec.entry.title}
                     fill
                     className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute bottom-3 left-3 right-3 text-[12px] md:text-sm font-bold text-white text-center line-clamp-2 drop-shadow-md group-hover:text-anime-primary transition-colors">
                     {rec.entry.title}
                  </span>
               </Link>
            ))}
         </div>
      </div>
   );
}
