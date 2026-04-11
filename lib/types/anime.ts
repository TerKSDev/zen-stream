export interface AnimeGenre {
   mal_id: number;
   name: string;
}

export interface AnimeImageWebp {
   large_image_url: string;
   image_url?: string;
}

export interface AnimeCard {
   mal_id: number;
   title: string;
   title_english?: string | null;
   images: {
      webp: AnimeImageWebp;
   };
   score?: number | null;
   members?: number | null;
   bannerImage?: string | null;
   type?: string | null;
   episodes?: number | null;
   status?: string | null;
   synopsis?: string | null;
   genres?: AnimeGenre[];
}

export interface AnimeTitle {
   type: string;
   title: string;
}

export interface AnimeRelationEntry {
   mal_id: number;
   name: string;
   type: string;
}

export interface AnimeRelation {
   relation: string;
   entry: AnimeRelationEntry[];
}

export interface AnimeStudio {
   name: string;
}

export interface AnimeDetail extends AnimeCard {
   title_japanese?: string | null;
   rating?: string | null;
   source?: string | null;
   duration?: string | null;
   aired?: {
      string?: string | null;
   } | null;
   studios?: AnimeStudio[];
   relations?: AnimeRelation[];
   titles?: AnimeTitle[];
}

export interface EpisodeData {
   mal_id: number;
   title: string;
   title_romanji?: string | null;
   aired?: string | null;
}

export interface RecommendationData {
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

export interface CharacterData {
   character: {
      mal_id: number;
      name: string;
      images: { webp: { image_url: string } };
   };
   role: string;
   voice_actors: {
      person: {
         mal_id: number;
         name: string;
         images: { jpg: { image_url: string } };
      };
      language: string;
   }[];
}

export interface PlaylistEpisode {
   id: string;
   number: number;
   title: string;
}

export interface AniListStreamingEpisode {
   title: string;
}

export interface AniListMedia {
   bannerImage?: string | null;
   episodes?: number | null;
   nextAiringEpisode?: {
      episode: number;
   } | null;
   streamingEpisodes?: AniListStreamingEpisode[];
}

export interface AniListMediaResponse {
   data?: {
      Media?: AniListMedia;
   };
}

export interface AniListBannerLookupResponse {
   data?: {
      Page?: {
         media?: Array<{
            idMal?: number | null;
            bannerImage?: string | null;
         }>;
      };
   };
}

export interface JikanSingleResponse<T> {
   data: T;
}

export interface JikanListResponse<T> {
   data: T[];
   pagination?: {
      has_next_page?: boolean;
   };
}
