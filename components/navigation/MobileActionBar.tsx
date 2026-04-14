'use client';

import Link from 'next/link';
import { IoPlayCircle } from 'react-icons/io5';
import BookmarkButton from '@/components/features/BookmarkButton';
import type { AnimeCard } from '@/types/anime';

export default function MobileActionBar({
   mal_id,
   anime,
}: {
   mal_id: string;
   anime: AnimeCard;
}) {
   return (
      <div className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center gap-3 px-4 py-3 bg-[#0B0E14]/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pb-[calc(0.75rem+env(safe-area-inset-bottom))] transform translate-y-0 opacity-100">
         <Link
            href={`/player/${mal_id}/1`}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-anime-primary text-white text-base font-bold rounded-xl hover:bg-anime-primary/90 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(160,124,254,0.4)]"
         >
            <IoPlayCircle className="w-6 h-6" />
            Watch Now
         </Link>
         <BookmarkButton
            anime={anime}
            className="w-12 h-12 shrink-0 p-0 flex items-center justify-center bg-white/5 hover:bg-white/10 border-white/10 rounded-xl [&>span]:hidden"
         />
      </div>
   );
}
