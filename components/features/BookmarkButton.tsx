'use client';

import { IoBookmarkOutline, IoBookmark } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import type { AnimeCard } from '@/types/anime';

interface BookmarkButtonProps {
   anime: AnimeCard;
   className?: string;
}

type AudioContextWindow = Window & {
   webkitAudioContext?: typeof AudioContext;
};

export default function BookmarkButton({
   anime,
   className = '',
}: BookmarkButtonProps) {
   const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);
   const isBookmarked = useBookmarkStore((state) =>
      state.isBookmarked(anime.mal_id),
   );

   // 利用瀏覽器內建 Web Audio API 產生乾淨的「叮」聲 (不需準備 mp3 檔案)
   const playDing = () => {
      try {
         const AudioContextCtor =
            window.AudioContext ||
            (window as AudioContextWindow).webkitAudioContext;

         if (!AudioContextCtor) {
            return;
         }

         const ctx = new AudioContextCtor();
         const playOscillator = (freq: number, vol: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine'; // 乾淨的正弦波
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(
               0.001,
               ctx.currentTime + 0.3,
            ); // 0.3秒淡出
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
         };
         playOscillator(880, 0.2); // 主音 A5
         playOscillator(1760, 0.1); // 泛音 A6 (增加清脆感)

         setTimeout(() => {
            void ctx.close();
         }, 350);
      } catch (err) {
         console.error('Audio playback failed', err);
      }
   };

   const handleToggle = () => {
      playDing(); // 播放音效
      const isAdded = toggleBookmark(anime);

      if (isAdded) {
         toast.success('已新增至我的收藏！');
      } else {
         toast.success('已從收藏中移除');
      }
   };

   return (
      <button
         onClick={handleToggle}
         className={`flex items-center justify-center gap-2 px-6 py-2 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 border border-white/10 active:scale-95 uppercase ${className}`}
      >
         {isBookmarked ? (
            <IoBookmark className="text-anime-primary" size={15} />
         ) : (
            <IoBookmarkOutline size={15} />
         )}
         <span className="text-sm font-bold tracking-wide">
            {isBookmarked ? 'Saved' : 'Bookmark'}
         </span>
      </button>
   );
}
