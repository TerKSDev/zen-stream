import type { HistoryEntry } from '@/types/history';

export const HISTORY_STORAGE_KEY = 'zenstream-history';
const HISTORY_LIMIT = 200;

function normalize(entries: HistoryEntry[]) {
   return [...entries]
      .sort(
         (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, HISTORY_LIMIT);
}

export function readLocalHistory(): HistoryEntry[] {
   if (typeof window === 'undefined') {
      return [];
   }

   const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
   if (!raw) {
      return [];
   }

   try {
      const parsed = JSON.parse(raw) as HistoryEntry[];
      if (!Array.isArray(parsed)) {
         return [];
      }

      return normalize(
         parsed.filter(
            (item) =>
               typeof item?.mal_id === 'number' &&
               typeof item?.episode === 'string' &&
               typeof item?.progressTime === 'number',
         ),
      );
   } catch {
      return [];
   }
}

export function writeLocalHistory(entries: HistoryEntry[]) {
   if (typeof window === 'undefined') {
      return;
   }

   window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(normalize(entries)),
   );
}

export function upsertLocalHistory(
   entry: Omit<HistoryEntry, 'updatedAt'> & { updatedAt?: string },
) {
   const entries = readLocalHistory();
   const normalizedEntry: HistoryEntry = {
      ...entry,
      episode: String(entry.episode),
      updatedAt: entry.updatedAt || new Date().toISOString(),
   };

   const next = entries.filter(
      (item) =>
         item.mal_id !== normalizedEntry.mal_id ||
         item.episode !== normalizedEntry.episode,
   );

   next.unshift(normalizedEntry);
   writeLocalHistory(next);
   return normalize(next);
}

export function removeLocalHistoryEntry(mal_id: number, episode: string) {
   const next = readLocalHistory().filter(
      (item) => item.mal_id !== mal_id || item.episode !== episode,
   );
   writeLocalHistory(next);
   return next;
}

export function clearLocalHistory() {
   if (typeof window === 'undefined') {
      return;
   }

   window.localStorage.removeItem(HISTORY_STORAGE_KEY);
}
