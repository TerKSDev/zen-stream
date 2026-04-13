'use client';

import Image from 'next/image';
import Link from 'next/link';
import { IoCalendarOutline, IoPlayCircle, IoStar } from 'react-icons/io5';
import type { AnimeCard } from '@/types/anime';
import { WEEKDAYS } from './exploreConstants';

interface WeeklyScheduleSidebarProps {
   currentTimeJST: Date | null;
   selectedDay: string;
   scheduleLoading: boolean;
   selectedDaySchedule: AnimeCard[];
   onSelectDay: (day: string) => void;
   className?: string;
}

function getScheduleTimingState(
   anime: AnimeCard,
   currentTimeJST: Date | null,
   selectedDay: string,
) {
   if (!currentTimeJST || !anime.broadcast?.time) {
      return { isLive: false, isNew: false };
   }

   const currentDayJST = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
   ][currentTimeJST.getDay()];

   if (selectedDay !== currentDayJST) {
      return { isLive: false, isNew: false };
   }

   const currentMinutes =
      currentTimeJST.getHours() * 60 + currentTimeJST.getMinutes();
   const [bHour, bMinute] = anime.broadcast.time.split(':').map(Number);

   if (isNaN(bHour) || isNaN(bMinute)) {
      return { isLive: false, isNew: false };
   }

   const broadcastMinutes = bHour * 60 + bMinute;
   let signedDelta = currentMinutes - broadcastMinutes;

   if (signedDelta > 12 * 60) signedDelta -= 24 * 60;
   if (signedDelta < -12 * 60) signedDelta += 24 * 60;

   const absDelta = Math.abs(signedDelta);
   const isLive = absDelta <= 60;
   const isNew = !isLive && absDelta <= 120;

   return { isLive, isNew };
}

export function WeeklyScheduleSidebar({
   currentTimeJST,
   selectedDay,
   scheduleLoading,
   selectedDaySchedule,
   onSelectDay,
   className,
}: WeeklyScheduleSidebarProps) {
   return (
      <aside
         className={`w-full lg:w-90 xl:w-112.5 shrink-0 max-h-fit max-lg:mb-10 max-lg:mt-2 lg:sticky lg:top-24 flex flex-col gap-4 box-border px-4 ${className ?? ''}`}
      >
         <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-lg">
            <div className="flex items-center justify-between mb-4 w-full">
               <h2 className="text-xs md:text-lg font-black text-white flex items-center gap-2 ml-2">
                  <IoCalendarOutline
                     className="text-anime-primary hidden md:inline-block"
                     size={20}
                  />
                  <IoCalendarOutline
                     className="text-anime-primary inline-block md:hidden"
                     size={14}
                  />
                  Weekly Schedule
               </h2>
               {currentTimeJST && (
                  <span className="text-xs font-bold text-slate-400 bg-black/40 px-2 py-1 rounded-md border border-white/5 tracking-widest">
                     {String(currentTimeJST.getMonth() + 1).padStart(2, '0')}/
                     {String(currentTimeJST.getDate()).padStart(2, '0')}
                  </span>
               )}
            </div>

            <div className="flex flex-nowrap overflow-x-auto scrollbar-hidden gap-1.5 mb-5 bg-black/40 p-1.5 rounded-xl border border-white/5">
               {WEEKDAYS.map((day) => {
                  const shortDay = day.slice(0, 3);
                  return (
                     <button
                        key={day}
                        onClick={() => onSelectDay(day)}
                        className={`flex-1 min-w-9.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                           selectedDay === day
                              ? 'bg-anime-primary text-white shadow-[0_0_15px_rgba(160,124,254,0.4)]'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-white/10'
                        }`}
                     >
                        {shortDay}
                     </button>
                  );
               })}
            </div>

            <div className="flex flex-col gap-2 min-h-75 lg:min-h-0 max-h-150 lg:max-h-[calc(100vh-17rem)] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
               {scheduleLoading ? (
                  <div className="flex-1 flex items-center justify-center py-10">
                     <div className="h-6 w-6 rounded-full border-2 border-anime-primary/30 border-t-anime-primary animate-spin" />
                  </div>
               ) : selectedDaySchedule.length > 0 ? (
                  selectedDaySchedule.map((anime, idx) => {
                     const { isLive, isNew } = getScheduleTimingState(
                        anime,
                        currentTimeJST,
                        selectedDay,
                     );

                     return (
                        <Link
                           key={`sched-${anime.mal_id}-${idx}`}
                           href={`/anime/${anime.mal_id}`}
                           className={`relative group flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-white/5 border ${
                              isLive
                                 ? 'bg-anime-primary/5 border-anime-primary/30'
                                 : 'border-transparent hover:border-white/10'
                           }`}
                        >
                           {isLive && (
                              <div className="absolute inset-0 rounded-xl border border-anime-primary shadow-[0_0_15px_rgba(160,124,254,0.4)] animate-pulse pointer-events-none" />
                           )}

                           <div className="relative h-14 w-10 shrink-0 rounded-md overflow-hidden bg-white/5">
                              <Image
                                 src={anime.images.webp.large_image_url}
                                 alt={anime.title}
                                 fill
                                 className="object-cover transition-transform duration-300 group-hover:scale-110"
                                 sizes="40px"
                              />
                           </div>

                           <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <span className="line-clamp-1 text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                                 {anime.title_english || anime.title}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                 <span className="flex items-center gap-1 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                                    <IoStar
                                       className="text-yellow-400"
                                       size={10}
                                    />
                                    {anime.score || '-.--'}
                                 </span>
                                 {anime.broadcast?.time && (
                                    <span className="text-[10px] font-mono text-anime-primary tracking-wider">
                                       {anime.broadcast.time}
                                    </span>
                                 )}
                                 {isLive ? (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-anime-primary/20 text-anime-primary border border-anime-primary/30 animate-pulse relative z-10">
                                       LIVE
                                    </span>
                                 ) : isNew ? (
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 relative z-10">
                                       NEW
                                    </span>
                                 ) : null}
                              </div>
                           </div>

                           <div className="shrink-0 flex items-center justify-center opacity-0 -translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 pr-1 relative z-10">
                              <IoPlayCircle
                                 className="text-anime-primary drop-shadow-[0_0_10px_rgba(160,124,254,0.6)]"
                                 size={28}
                              />
                           </div>
                        </Link>
                     );
                  })
               ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-500">
                     <p className="text-sm font-bold">No schedule data.</p>
                  </div>
               )}
            </div>
         </div>
      </aside>
   );
}
