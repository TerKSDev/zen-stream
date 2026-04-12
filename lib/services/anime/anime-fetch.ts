import type {
   AniListMedia,
   AniListMediaResponse,
   AnimeCard,
   EpisodeData,
   JikanListResponse,
} from '@/types/anime';

type FetchWithNextInit = RequestInit & {
   next?: {
      revalidate?: number;
   };
};

type AniListSearchTranslateResponse = {
   data?: {
      Media?: {
         title?: {
            romaji?: string | null;
            english?: string | null;
         };
      };
   };
};

const CJK_QUERY_REGEX =
   /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/;

const ANILIST_SEARCH_TRANSLATE_QUERY = `
query($search: String) {
   Media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
      title {
         romaji
         english
      }
   }
}
`;

const ANILIST_MEDIA_BY_MAL_QUERY = `
query ($id: Int) {
   Media(idMal: $id, type: ANIME) {
      bannerImage
      episodes
      nextAiringEpisode {
         episode
      }
      streamingEpisodes {
         title
      }
   }
}
`;

export function dedupeByMalId<T extends { mal_id: number }>(items: T[]) {
   return Array.from(
      new Map(items.map((item) => [item.mal_id, item])).values(),
   );
}

export async function fetchJikanList(
   url: string,
   init?: FetchWithNextInit,
): Promise<JikanListResponse<AnimeCard> | null> {
   try {
      const response = await fetch(url, init);
      if (!response.ok) {
         return null;
      }

      return (await response.json()) as JikanListResponse<AnimeCard>;
   } catch {
      return null;
   }
}

async function postAniList<T>(
   query: string,
   variables: Record<string, unknown>,
   init?: FetchWithNextInit,
): Promise<T | null> {
   try {
      const response = await fetch('https://graphql.anilist.co', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
         },
         body: JSON.stringify({ query, variables }),
         ...init,
      });

      if (!response.ok) {
         return null;
      }

      return (await response.json()) as T;
   } catch {
      return null;
   }
}

export async function translateAnimeSearchQuery(query: string) {
   if (!query || !CJK_QUERY_REGEX.test(query)) {
      return query;
   }

   const data = await postAniList<AniListSearchTranslateResponse>(
      ANILIST_SEARCH_TRANSLATE_QUERY,
      { search: query },
   );

   const title = data?.data?.Media?.title;
   return title?.romaji || title?.english || query;
}

export async function fetchAniListMediaByMalId(malId: number) {
   const data = await postAniList<AniListMediaResponse>(
      ANILIST_MEDIA_BY_MAL_QUERY,
      { id: malId },
      {
         cache: 'no-store',
      },
   );

   return data?.data?.Media || null;
}

export function buildEpisodeFallbackFromAniList(
   media: AniListMedia | null,
): EpisodeData[] {
   if (!media) {
      return [];
   }

   const airedCount = media.nextAiringEpisode
      ? media.nextAiringEpisode.episode - 1
      : media.episodes || 0;

   if (airedCount <= 0) {
      return [];
   }

   return Array.from({ length: airedCount }, (_, index) => {
      const epNum = index + 1;
      const streamEp = media.streamingEpisodes?.find(
         (ep) =>
            ep.title.startsWith(`Episode ${epNum} `) ||
            ep.title === `Episode ${epNum}`,
      );

      let title = `Episode ${epNum}`;
      if (streamEp && streamEp.title.includes(' - ')) {
         title = streamEp.title.split(' - ').slice(1).join(' - ').trim();
      } else if (streamEp) {
         title = streamEp.title;
      }

      return {
         mal_id: epNum,
         title,
         title_romanji: null,
         aired: null,
      };
   });
}
