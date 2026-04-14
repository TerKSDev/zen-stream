'use client';

import BookmarkButton from '@/components/features/BookmarkButton';
import ShareButton from '@/components/features/ShareButton';
import { useFloatingActionBarVisibility } from '@/hooks/useFloatingActionBarVisibility';
import type { AnimeCard } from '@/types/anime';

export default function PlayerMobileActionBar({
   mal_id,
   anime,
   displayTitle,
   currentEpNumber,
}: {
   mal_id: string;
   anime: AnimeCard;
   displayTitle: string;
   currentEpNumber: string;
}) {
   const isVisible = useFloatingActionBarVisibility('mobile-player');

   return (
      <div
         className={`fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center gap-3 px-4 py-3 bg-[#0B0E14]/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-all duration-500 ease-out transform ${
            isVisible
               ? 'translate-y-0 opacity-100'
               : 'translate-y-[150%] opacity-0'
         }`}
      >
         <BookmarkButton
            anime={anime}
            className="flex-1 h-12 p-0 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all shadow-lg [&>svg]:w-5 [&>svg]:h-5"
         />
         <ShareButton
            title={`${displayTitle} - Episode ${currentEpNumber} | ZenStream`}
            className="flex-1 h-12 p-0 flex items-center justify-center gap-2 bg-anime-primary hover:bg-anime-primary/90 border border-anime-primary/50 rounded-xl text-sm font-bold text-white transition-all shadow-[0_0_20px_rgba(160,124,254,0.3)] [&>svg]:w-5 [&>svg]:h-5"
         />
      </div>
   );
}
