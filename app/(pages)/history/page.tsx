'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
   IoCloseCircle,
   IoPlayCircle,
   IoSearch,
   IoTimeSharp,
   IoTrashOutline,
} from 'react-icons/io5';
import {
   clearLocalHistory,
   readLocalHistory,
   removeLocalHistoryEntry,
   writeLocalHistory,
} from '@/lib/utils/local-storage';
import type { HistoryEntry } from '@/types/history';

function formatProgressTime(seconds: number) {
   const totalSeconds = Math.max(0, Math.floor(seconds));
   const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
   const secs = (totalSeconds % 60).toString().padStart(2, '0');
   return `${mins}:${secs}`;
}

type HistoryApiResponse = {
   histories?: HistoryEntry[];
};

async function syncHistoryToServer(localHistories: HistoryEntry[]) {
   const response = await fetch('/api/history', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: localHistories }),
   });

   if (!response.ok) {
      return null;
   }

   const data = (await response.json()) as HistoryApiResponse;
   return data.histories || [];
}

async function deleteHistoryFromServer(payload: {
   clearAll?: boolean;
   mal_id?: number;
   episode?: string;
}) {
   const response = await fetch('/api/history', {
      method: 'DELETE',
      headers: {
         'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
   });

   if (!response.ok) {
      return null;
   }

   const data = (await response.json()) as HistoryApiResponse;
   return data.histories || [];
}

export default function HistoryPage() {
   const { status } = useSession();
   const [histories, setHistories] = useState<HistoryEntry[]>([]);
   const [query, setQuery] = useState('');
   const [isReady, setIsReady] = useState(false);
   const [isSyncing, setIsSyncing] = useState(false);
   const [hasSyncedSession, setHasSyncedSession] = useState(false);

   useEffect(() => {
      const localHistories = readLocalHistory();
      setHistories(localHistories);
      setIsReady(true);
   }, []);

   useEffect(() => {
      if (!isReady) {
         return;
      }

      if (status !== 'authenticated') {
         setHasSyncedSession(false);
         return;
      }

      if (hasSyncedSession) {
         return;
      }

      const runSync = async () => {
         setIsSyncing(true);
         try {
            const synced = await syncHistoryToServer(readLocalHistory());
            if (synced) {
               setHistories(synced);
               writeLocalHistory(synced);
            }
         } finally {
            setHasSyncedSession(true);
            setIsSyncing(false);
         }
      };

      runSync();
   }, [hasSyncedSession, isReady, status]);

   const filteredHistories = useMemo(() => {
      const keyword = query.trim().toLowerCase();
      if (!keyword) {
         return histories;
      }

      return histories.filter(
         (item) =>
            item.title.toLowerCase().includes(keyword) ||
            item.episode.toLowerCase().includes(keyword),
      );
   }, [histories, query]);

   const handleRemove = async (entry: HistoryEntry) => {
      const localNext = removeLocalHistoryEntry(entry.mal_id, entry.episode);
      setHistories(localNext);

      if (status === 'authenticated') {
         const synced = await deleteHistoryFromServer({
            mal_id: entry.mal_id,
            episode: entry.episode,
         });

         if (synced) {
            setHistories(synced);
            writeLocalHistory(synced);
         }
      }
   };

   const handleClearAll = async () => {
      const confirmed = window.confirm(
         'Clear all watch history records? This action cannot be undone.',
      );

      if (!confirmed) {
         return;
      }

      clearLocalHistory();
      setHistories([]);

      if (status === 'authenticated') {
         const synced = await deleteHistoryFromServer({ clearAll: true });
         if (synced) {
            setHistories(synced);
            writeLocalHistory(synced);
         }
      }
   };

   return (
      <main className="flex-1 relative h-full w-full min-w-0 bg-[#0B0E14] px-6 py-24 md:px-8 lg:py-26">
         <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
               <div>
                  <h1 className="flex items-center gap-3 text-3xl font-black tracking-wide text-white md:text-4xl">
                     <IoTimeSharp
                        className="text-anime-primary drop-shadow-[0_0_15px_rgba(160,124,254,0.6)]"
                        size={36}
                     />
                     Watch History
                  </h1>
                  <p className="mt-2 text-sm text-slate-400 md:text-base">
                     Continue where you left off, synced across local storage
                     and your account.
                  </p>
               </div>

               <div className="flex items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold text-white/70">
                     {histories.length} Records
                  </span>
                  {histories.length > 0 && (
                     <button
                        onClick={handleClearAll}
                        className="rounded-full border border-red-400/20 bg-red-400/10 px-4 py-1.5 text-xs font-bold text-red-400 transition-colors hover:border-red-500 hover:bg-red-500/80 hover:text-white sm:text-sm"
                     >
                        Clear All
                     </button>
                  )}
               </div>
            </header>

            <div className="relative group">
               <IoSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-anime-primary"
                  size={18}
               />
               <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search title or episode..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-10 text-sm text-white placeholder:text-slate-500 transition-all focus:border-anime-primary/50 focus:bg-[#0B0E14]/90 focus:outline-none focus:ring-1 focus:ring-anime-primary/50"
               />
               {query.trim() && (
                  <button
                     onClick={() => setQuery('')}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-white"
                     aria-label="Clear history search"
                  >
                     <IoCloseCircle size={18} />
                  </button>
               )}
            </div>

            {isSyncing && (
               <div className="rounded-xl border border-anime-primary/20 bg-anime-primary/5 px-4 py-3 text-sm font-medium text-anime-primary">
                  Syncing history with your account...
               </div>
            )}

            {!isReady ? (
               <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[...Array(6)].map((_, index) => (
                     <div
                        key={index}
                        className="flex gap-4 rounded-2xl border border-white/5 bg-white/5 p-3"
                     >
                        <div className="aspect-3/4 w-24 animate-pulse rounded-xl bg-white/10" />
                        <div className="flex flex-1 flex-col justify-center gap-2">
                           <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                           <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
                           <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                        </div>
                     </div>
                  ))}
               </div>
            ) : filteredHistories.length > 0 ? (
               <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredHistories.map((entry) => (
                     <article
                        key={`${entry.mal_id}-${entry.episode}`}
                        className="group relative flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-anime-primary/30 hover:bg-white/10"
                     >
                        <Link
                           href={`/anime/${entry.mal_id}`}
                           className="relative aspect-3/4 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#141824]"
                        >
                           <Image
                              src={entry.image || '/icon.png'}
                              alt={entry.title}
                              fill
                              sizes="96px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                           />
                        </Link>

                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 py-1">
                           <div>
                              <h2 className="line-clamp-2 text-sm font-bold text-white md:text-base">
                                 {entry.title}
                              </h2>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-anime-primary">
                                 Episode {entry.episode}
                              </p>
                           </div>

                           <div className="space-y-1 text-xs text-slate-400">
                              <p>
                                 Progress:{' '}
                                 {formatProgressTime(entry.progressTime)}
                              </p>
                              <p>
                                 Updated:{' '}
                                 {new Date(entry.updatedAt).toLocaleString()}
                              </p>
                           </div>

                           <div className="mt-2 flex items-center gap-2">
                              <Link
                                 href={`/player/${entry.mal_id}/${entry.episode}`}
                                 className="inline-flex items-center gap-1 rounded-lg bg-anime-primary px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-anime-primary/90 hover:shadow-[0_0_12px_rgba(160,124,254,0.5)]"
                              >
                                 <IoPlayCircle size={15} /> Continue
                              </Link>
                              <button
                                 onClick={() => handleRemove(entry)}
                                 className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-300"
                              >
                                 <IoTrashOutline size={14} /> Remove
                              </button>
                           </div>
                        </div>
                     </article>
                  ))}
               </div>
            ) : (
               <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center">
                  <IoTimeSharp className="mb-4 h-14 w-14 text-white/20" />
                  <h2 className="mb-2 text-xl font-bold text-white">
                     No history records yet
                  </h2>
                  <p className="max-w-md text-sm text-slate-400">
                     Start watching an episode and your progress will appear
                     here.
                  </p>
               </div>
            )}
         </div>
      </main>
   );
}
