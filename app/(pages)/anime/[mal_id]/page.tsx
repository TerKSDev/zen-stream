// app/anime/[mal_id]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { IoPlayCircle } from 'react-icons/io5';
import {
   buildEpisodeFallbackFromAniList,
   fetchAniListMediaByMalId,
} from '@/lib/services/anime/anime-fetch';
import { fetchJikan } from '@/lib/services/anime/jikan-api';
import AnimeEpisodes from './_components/AnimeEpisodes';
import AnimeRecommendations from './_components/AnimeRecommendations';
import AnimeCharacters from './_components/AnimeCharacters';
import ExpandableSynopsis from './_components/ExpandableSynopsis';
import PosterLightbox from './_components/PosterLightbox';
import BookmarkButton from '@/components/features/BookmarkButton';
import ShareButton from '@/components/features/ShareButton';
import type {
   AnimeDetail,
   CharacterData,
   EpisodeData,
   RecommendationData,
} from '@/types/anime';

export default async function AnimeDetailPage({
   params,
}: {
   params: Promise<{ mal_id: string }>;
}) {
   const resolvedParams = await params;
   const mal_id = resolvedParams.mal_id;

   // 1. 獲取 Jikan API 動漫詳細資料
   const jikanData = await fetchJikan<{ data: AnimeDetail }>(
      `https://api.jikan.moe/v4/anime/${mal_id}/full`,
   );
   const anime = jikanData?.data;

   if (!anime) {
      return (
         <main className="flex-1 relative h-screen w-full flex items-center justify-center bg-[#0B0E14]">
            <div className="text-white/50 text-lg">
               Failed to load anime details.
            </div>
         </main>
      );
   }

   const anilistPromise = fetchAniListMediaByMalId(parseInt(mal_id, 10));

   // 延遲 1500 毫秒後請求集數
   await new Promise((resolve) => setTimeout(resolve, 1500));
   const episodesData = await fetchJikan<{ data: EpisodeData[] }>(
      `https://api.jikan.moe/v4/anime/${mal_id}/episodes`,
   );

   // 延遲 1500 毫秒後請求角色資料
   await new Promise((resolve) => setTimeout(resolve, 1500));
   const charactersData = await fetchJikan<{ data: CharacterData[] }>(
      `https://api.jikan.moe/v4/anime/${mal_id}/characters`,
   );

   // 延遲 1500 毫秒後請求推薦動漫
   await new Promise((resolve) => setTimeout(resolve, 1500));
   const recommendationsData = await fetchJikan<{ data: RecommendationData[] }>(
      `https://api.jikan.moe/v4/anime/${mal_id}/recommendations`,
   );

   const media = await anilistPromise;
   const bannerImage = media?.bannerImage;
   const bgImage = bannerImage || anime.images?.webp?.large_image_url;

   // 取得最終資料陣列
   let episodes = episodesData?.data || [];
   // 限制最多顯示 20 個角色，避免畫面過於冗長
   const characters = (charactersData?.data || []).slice(0, 20);
   const recommendations = recommendationsData?.data || [];

   // 🚨 防呆機制：如果 Jikan 找不到 Episode，改用 AniList 的資料來補齊
   if (episodes.length === 0) {
      episodes = buildEpisodeFallbackFromAniList(media);
   }

   return (
      <main
         data-header-scroll-container="true"
         className="flex-1 relative h-full min-h-screen w-full min-w-0 overflow-y-auto bg-[#0B0E14] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
         {/* 沉浸式頂部橫幅背景 */}
         <div className="absolute top-0 left-0 w-full h-[80vh] lg:h-[85vh] z-0 pointer-events-none">
            <Image
               src={bgImage}
               alt={anime.title}
               fill
               priority
               className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#0B0E14] via-[#0B0E14]/50 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-r from-[#0B0E14]/90 via-[#0B0E14]/50 to-transparent" />
         </div>

         {/* 滾動內容容器 - 增加 pb-32 以避免手機版底部懸浮列遮擋內容 */}
         <div className="relative z-10 w-full pb-32 lg:pb-16 pt-28 md:pt-38 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
               {/* 左側：海報與操作區 (Sticky Sidebar) */}
               <div className="w-full lg:w-70 xl:w-80 shrink-0 flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start z-20">
                  <div
                     id="mobile-poster"
                     className="w-48 sm:w-56 lg:w-full mx-auto lg:mx-0"
                  >
                     <PosterLightbox
                        src={anime.images.webp.large_image_url}
                        alt={anime.title}
                     />
                  </div>

                  <div className="flex w-full flex-col gap-6">
                     <Link
                        href={`/player/${mal_id}/1`}
                        className="w-full flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-8 py-3 md:py-3.5 bg-anime-primary text-white text-sm sm:text-base md:text-lg font-bold rounded-xl hover:bg-anime-primary/90 hover:scale-105 hover:shadow-[0_0_25px_rgba(160,124,254,0.6)] active:scale-95 transition-all duration-300"
                     >
                        <IoPlayCircle className="w-5 h-5 md:w-6.5 md:h-6.5" />
                        Watch Now
                     </Link>

                     <div className="flex flex-row flex-wrap w-full gap-2.5">
                        <BookmarkButton
                           anime={anime}
                           className="flex-1 py-1.5 md:py-2 text-xs md:text-base bg-white/5 hover:bg-white/10 border-white/10"
                        />
                        <ShareButton
                           title={anime.title_english || anime.title}
                           className="flex-1 py-1.5 md:py-2 text-xs md:text-base bg-white/5 hover:bg-white/10 border-white/10"
                        />
                     </div>
                  </div>

                  {/* 相關動漫 (Related Media) */}
                  {anime.relations && anime.relations.length > 0 && (
                     <div className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm shadow-lg">
                        <h3 className="text-base font-bold mb-4 text-white flex items-center gap-2">
                           <div className="w-1.5 h-4 bg-anime-primary rounded-full" />
                           Related Media
                        </h3>
                        <div className="flex flex-col gap-4">
                           {anime.relations.map((rel, idx: number) => (
                              <div
                                 key={idx}
                                 className="flex flex-col gap-2 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                              >
                                 <span className="text-[11px] text-anime-primary uppercase tracking-wider font-bold">
                                    {rel.relation}
                                 </span>
                                 <div className="flex min-w-0 flex-wrap gap-2">
                                    {rel.entry.map((entry) => (
                                       <Link
                                          key={entry.mal_id}
                                          href={
                                             entry.type === 'anime'
                                                ? `/anime/${entry.mal_id}`
                                                : '#'
                                          }
                                          className={`max-w-full wrap-break-word whitespace-normal text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-300 ${
                                             entry.type === 'anime'
                                                ? 'bg-white/5 border-white/10 text-slate-200 hover:bg-anime-primary/20 hover:border-anime-primary/50 hover:text-white hover:shadow-[0_0_10px_rgba(160,124,254,0.2)]'
                                                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-400 cursor-default pointer-events-none'
                                          }`}
                                       >
                                          {entry.name}{' '}
                                          {entry.type !== 'anime' && (
                                             <span className="opacity-60 font-normal">
                                                ({entry.type})
                                             </span>
                                          )}
                                       </Link>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               {/* 右側：主內容區 */}
               <div className="flex-1 flex flex-col min-w-0 gap-8 mt-4 lg:mt-0">
                  {/* 標題與 Metadata */}
                  <div className="flex flex-col gap-4 text-center lg:text-left">
                     <div>
                        <h1 className="wrap-break-word text-3xl md:text-5xl font-black text-white drop-shadow-lg leading-tight">
                           {anime.title_english || anime.title}
                        </h1>
                        {anime.title_japanese && (
                           <h2 className="mt-2 wrap-break-word text-lg md:text-xl text-slate-400 font-medium tracking-wide">
                              {anime.title_japanese}
                           </h2>
                        )}
                     </div>

                     {/* Metadata 標籤 */}
                     <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-sm font-semibold text-white/90">
                        {anime.score && (
                           <span className="flex items-center gap-1 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] bg-white/10 backdrop-blur-md px-3 py-1 rounded-md border border-white/10">
                              ★ {anime.score}
                           </span>
                        )}
                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 tracking-wider">
                           {anime.type}{' '}
                           {anime.episodes ? `· ${anime.episodes} EPS` : ''}
                        </span>
                        {anime.status && (
                           <span className="flex items-center gap-1.5 text-white/80 bg-white/10 backdrop-blur-md px-3 py-1 rounded-md border border-white/10">
                              <span
                                 className={`w-2 h-2 rounded-full shadow-[0_0_5px_currentColor] ${
                                    anime.status === 'Currently Airing'
                                       ? 'bg-green-400 text-green-400'
                                       : 'bg-gray-400 text-gray-400'
                                 }`}
                              ></span>
                              {anime.status === 'Currently Airing'
                                 ? 'Airing'
                                 : anime.status}
                           </span>
                        )}
                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 tracking-wider">
                           {anime.rating || 'Unrated'}
                        </span>
                     </div>

                     {/* 類型標籤 (Genres) */}
                     <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                        {anime.genres?.map((genre) => (
                           <span
                              key={genre.mal_id}
                              className="text-xs md:text-sm px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white/80 hover:bg-anime-primary/40 hover:text-white transition-colors cursor-default"
                           >
                              {genre.name}
                           </span>
                        ))}
                     </div>
                  </div>

                  {/* 簡介 (Synopsis) */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-lg">
                     <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                        <div className="w-1.5 h-5 bg-anime-primary rounded-full shadow-[0_0_8px_rgba(160,124,254,0.6)]" />
                        Synopsis
                     </h3>
                     <ExpandableSynopsis text={anime.synopsis || ''} />
                  </div>

                  {/* 更多資訊網格 (Studio, Source, Duration, Aired) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-8 py-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-lg">
                     <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                           Studios
                        </span>
                        <span className="text-sm text-slate-200 line-clamp-2">
                           {anime.studios
                              ?.map((studio) => studio.name)
                              .join(', ') || 'Unknown'}
                        </span>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                           Source
                        </span>
                        <span className="text-sm text-slate-200 line-clamp-1">
                           {anime.source || 'Unknown'}
                        </span>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                           Duration
                        </span>
                        <span className="text-sm text-slate-200 line-clamp-1">
                           {anime.duration || 'Unknown'}
                        </span>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                           Aired
                        </span>
                        <span className="text-sm text-slate-200 line-clamp-2">
                           {anime.aired?.string || 'Unknown'}
                        </span>
                     </div>
                  </div>

                  {/* 集數列表 (Episodes) */}
                  <div className="backdrop-blur-sm px-2 -mt-5">
                     <AnimeEpisodes episodes={episodes} animeId={mal_id} />
                  </div>
               </div>
            </div>

            {/* 底部滿版：角色與推薦動漫 */}
            <div className="mt-12 flex flex-col gap-12">
               <AnimeCharacters characters={characters} />
               <AnimeRecommendations recommendations={recommendations} />
            </div>
         </div>
      </main>
   );
}
