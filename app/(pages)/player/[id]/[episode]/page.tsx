import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { IoArrowBack, IoPlayCircle } from 'react-icons/io5';
import VideoPlayer from './_components/VideoPlayer';
import {
   buildEpisodeFallbackFromAniList,
   fetchAniListMediaByMalId,
} from '@/lib/services/anime/anime-fetch';
import { fetchVideoStream } from '@/app/_actions/anime';
import EpisodeList from './_components/EpisodeList';
import AnimeRecommendations from '@/app/(pages)/anime/[mal_id]/_components/AnimeRecommendations';
import ShareButton from '@/components/features/ShareButton';
import PlayerMobileActionBar from './_components/PlayerMobileActionBar';
import { fetchJikan } from '@/lib/services/anime/jikan-api';
import type {
   AnimeDetail,
   EpisodeData,
   PlaylistEpisode,
   RecommendationData,
} from '@/types/anime';

// ==========================================
// 異步抓取器：專門負責等水母抓影片 (不會阻塞主頁面渲染)
// ==========================================
async function StreamFetcher({
   searchQuery,
   currentEpNumber,
   malId,
   bgImage,
   episodes,
   historyMeta,
}: {
   searchQuery: string;
   currentEpNumber: string;
   malId: string;
   bgImage: string;
   episodes: PlaylistEpisode[];
   historyMeta: {
      mal_id: number;
      title: string;
      image: string;
   };
}) {
   const streamData = await fetchVideoStream(searchQuery, currentEpNumber);
   const streamUrl = streamData.success ? streamData.videoUrl : null;

   if (!streamUrl) {
      return (
         <>
            {bgImage && (
               <Image
                  src={bgImage}
                  alt="thumbnail"
                  fill
                  className="object-cover opacity-20"
               />
            )}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
               <IoPlayCircle
                  size={72}
                  className="opacity-50 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]"
               />
               <div className="flex flex-col items-center gap-1">
                  <span className="font-black tracking-widest text-lg text-white drop-shadow-md uppercase">
                     Stream Unavailable
                  </span>
                  <span className="text-sm text-slate-400 text-center max-w-md px-4">
                     {streamData.error ||
                        'The requested episode could not be loaded.'}
                  </span>
               </div>
            </div>
         </>
      );
   }

   return (
      <VideoPlayer
         videoUrl={streamUrl}
         poster={bgImage}
         storageKey={`${malId}-ep${currentEpNumber}`}
         malId={malId}
         currentEpNumber={currentEpNumber}
         episodes={episodes}
         historyMeta={historyMeta}
      />
   );
}

// ==========================================
// 載入骨架屏：水母正在抓取時顯示的超帥 UI
// ==========================================
function VideoSkeleton({ bgImage }: { bgImage: string }) {
   return (
      <>
         {bgImage && (
            <Image
               src={bgImage}
               alt="loading"
               fill
               className="object-cover opacity-30 blur-xl scale-110"
            />
         )}
         <div className="absolute inset-0 bg-linear-to-t from-[#0B0E14] via-black/40 to-black/40" />
         <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6">
            <div className="relative flex items-center justify-center w-20 h-20">
               <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-anime-primary border-t-transparent rounded-full animate-spin"></div>
               <IoPlayCircle
                  className="absolute text-anime-primary/50 animate-pulse"
                  size={32}
               />
            </div>
            <div className="flex flex-col items-center gap-2">
               <span className="font-black tracking-[0.2em] text-sm animate-pulse text-white drop-shadow-[0_0_10px_rgba(160,124,254,0.6)]">
                  INITIALIZING PLAYER
               </span>
               <span className="text-xs text-anime-primary/60 font-mono tracking-widest">
                  Securing Stream Connection...
               </span>
            </div>
         </div>
      </>
   );
}

// ==========================================
// 主頁面 (瞬間渲染)
// ==========================================
export default async function AnimeWatchPage({
   params,
}: {
   params: Promise<{ id: string; episode: string }>;
}) {
   const resolvedParams = await params;
   const malId = resolvedParams.id;
   const currentEpNumber = resolvedParams.episode || '1';

   // 1. Fetch anime details (極快)
   const jikanData = await fetchJikan<{ data: AnimeDetail }>(
      `https://api.jikan.moe/v4/anime/${malId}`,
   );
   const anime = jikanData?.data;

   if (!anime) {
      return (
         <main className="flex-1 h-screen w-full flex items-center justify-center bg-[#0B0E14]">
            <div className="text-white/50 text-lg">
               Failed to load player details.
            </div>
         </main>
      );
   }

   // 2. Fetch Playlist (極快)
   const anilistPromise = fetchAniListMediaByMalId(parseInt(malId, 10));

   await new Promise((resolve) => setTimeout(resolve, 800)); // Rate limit buffer
   const episodesData = await fetchJikan<{ data: EpisodeData[] }>(
      `https://api.jikan.moe/v4/anime/${malId}/episodes`,
   );

   // 延遲 800 毫秒後請求推薦動漫，避免觸發 429 Rate Limit
   await new Promise((resolve) => setTimeout(resolve, 800));
   const recommendationsData = await fetchJikan<{ data: RecommendationData[] }>(
      `https://api.jikan.moe/v4/anime/${malId}/recommendations`,
   );
   const recommendations = recommendationsData?.data || [];

   const media = await anilistPromise;
   const bannerImage = media?.bannerImage;

   let rawEpisodes: EpisodeData[] = episodesData?.data || [];

   if (rawEpisodes.length === 0) {
      rawEpisodes = buildEpisodeFallbackFromAniList(media);
   }

   const episodes: PlaylistEpisode[] = rawEpisodes.map((ep) => ({
      id: ep.mal_id.toString(),
      number: ep.mal_id,
      title: ep.title,
   }));

   // 3. 準備水母的搜尋關鍵字
   const displayTitle = anime.title_english || anime.title;
   const zhTitleObj = anime.titles?.find(
      (title) =>
         title.type === 'Simplified Chinese' ||
         title.type === 'Traditional Chinese' ||
         title.type === 'Mandarin',
   );
   const rawQuery =
      zhTitleObj?.title ||
      anime.title_japanese ||
      anime.title_english ||
      anime.title;
   const searchQuery = rawQuery
      .replace(/(Season \d+|\d+th Season|Part \d+|第.期|第.季)/gi, '')
      .trim();

   const currentEpisodeData = episodes.find(
      (ep) => ep.number.toString() === currentEpNumber,
   ) || { number: currentEpNumber, title: `Episode ${currentEpNumber}` };
   const bgImage = bannerImage || anime.images?.webp?.large_image_url;
   const historyMeta = {
      mal_id: Number(malId),
      title: displayTitle,
      image: anime.images?.webp?.large_image_url || bgImage || '',
   };

   return (
      <main
         data-header-scroll-container="true"
         className="flex-1 relative min-h-screen w-full overflow-x-hidden overflow-y-auto bg-[#0B0E14] flex flex-col"
      >
         {/* 背景渲染 */}
         <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30 blur-[100px] scale-110 transform-gpu">
            {bgImage && (
               <Image
                  src={bgImage}
                  alt="background blur"
                  fill
                  className="object-cover"
               />
            )}
         </div>
         <div className="absolute inset-0 bg-linear-to-b from-[#0B0E14]/80 via-[#0B0E14]/95 to-[#0B0E14] z-0 pointer-events-none" />

         {/* 將 pt 調整，彌補上方 header 移除後的空間 */}
         <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-6 px-4 md:px-8 pt-24 md:pt-26 pb-24 lg:pb-6">
            {/* 左側容器 */}
            <div className="w-full lg:flex-1 flex flex-col min-w-0 transform-gpu">
               {/* ========================================== */}
               {/* 🚀 戰術核心：這裡使用 Suspense 包裹水母抓取器 */}
               {/* ========================================== */}
               <div
                  id="mobile-player"
                  className="w-full aspect-video bg-[#07090D] rounded-2xl ring-1 ring-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden shrink-0"
               >
                  <Suspense fallback={<VideoSkeleton bgImage={bgImage} />}>
                     <StreamFetcher
                        searchQuery={searchQuery}
                        currentEpNumber={currentEpNumber}
                        malId={malId}
                        bgImage={bgImage}
                        episodes={episodes}
                        historyMeta={historyMeta}
                     />
                  </Suspense>
               </div>

               {/* Anime Info Below Player */}
               <div className="mt-6 flex flex-col gap-4 shrink-0 pb-12">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                     <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-black text-white line-clamp-2 drop-shadow-md">
                           {displayTitle}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                           <span className="flex items-center gap-2 text-anime-primary font-bold text-sm bg-anime-primary/10 border border-anime-primary/20 px-3 py-1 rounded-lg shadow-[0_0_10px_rgba(160,124,254,0.1)]">
                              EPISODE {currentEpNumber}
                           </span>
                           <span className="text-base text-slate-300 font-medium">
                              {currentEpisodeData?.title &&
                              currentEpisodeData.title !==
                                 `Episode ${currentEpNumber}`
                                 ? currentEpisodeData.title
                                 : 'Official Stream'}
                           </span>
                        </div>
                     </div>

                     {/* 分享按鈕 */}
                     <div className="flex items-center shrink-0">
                        <ShareButton
                           title={`${displayTitle} - Episode ${currentEpNumber} | ZenStream`}
                        />
                     </div>
                  </div>

                  {/* 豐富化的簡介資訊卡 */}
                  <div className="mt-2 p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl transform-gpu shadow-lg flex gap-4 md:gap-6">
                     {/* 左側：動漫海報 (在極小螢幕上隱藏以節省空間) */}
                     <Link
                        href={`/anime/${malId}`}
                        className="relative w-24 sm:w-32 md:w-36 aspect-3/4 shrink-0 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.4)] border border-white/10 hidden sm:block group cursor-pointer"
                        title="Back to Details"
                     >
                        <Image
                           src={anime.images?.webp?.large_image_url || bgImage}
                           alt={anime.title}
                           fill
                           className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     </Link>

                     {/* 右側：詳細標籤與文字 */}
                     <div className="flex flex-col flex-1 min-w-0">
                        <h3 className="font-bold text-white mb-3 flex items-center gap-3 text-base">
                           <div className="w-1.5 h-5 bg-anime-primary rounded-full shadow-[0_0_10px_rgba(160,124,254,0.6)]" />
                           About Anime
                        </h3>

                        {/* Metadata 標籤 */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                           {anime.score && (
                              <span className="flex items-center gap-1 text-[11px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md border border-yellow-400/20">
                                 ★ {anime.score}
                              </span>
                           )}
                           {anime.status && (
                              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20 uppercase tracking-wider">
                                 {anime.status === 'Currently Airing'
                                    ? 'Airing'
                                    : anime.status}
                              </span>
                           )}
                           {anime.rating && (
                              <span className="text-[11px] font-bold text-white/70 bg-white/10 px-2 py-1 rounded-md border border-white/10 uppercase tracking-wider">
                                 {anime.rating.split(' ')[0]}
                              </span>
                           )}
                        </div>

                        {/* 類型標籤 (Genres) */}
                        <div className="flex flex-wrap gap-1.5 mb-3 md:mb-4">
                           {anime.genres?.map((genre) => (
                              <span
                                 key={genre.mal_id}
                                 className="text-[10px] md:text-[11px] text-slate-300 border border-white/10 bg-black/20 px-2.5 py-0.5 rounded-full whitespace-nowrap"
                              >
                                 {genre.name}
                              </span>
                           ))}
                        </div>

                        {/* 簡介文字 (使用 CSS-only Checkbox 實作 Read More 切換) */}
                        <div className="relative">
                           <input
                              type="checkbox"
                              id="desc-toggle"
                              className="peer hidden"
                           />
                           <p className="text-xs md:text-sm text-slate-400 leading-relaxed text-justify line-clamp-3 md:line-clamp-4 peer-checked:line-clamp-none transition-all duration-300">
                              {anime.synopsis ||
                                 'No synopsis available for this anime.'}
                           </p>
                           <label
                              htmlFor="desc-toggle"
                              className="text-anime-primary hover:text-anime-primary/80 text-xs font-bold cursor-pointer mt-1.5 inline-block peer-checked:hidden transition-colors"
                           >
                              Read More...
                           </label>
                           <label
                              htmlFor="desc-toggle"
                              className="text-anime-primary hover:text-anime-primary/80 text-xs font-bold cursor-pointer mt-1.5 hidden peer-checked:inline-block transition-colors"
                           >
                              Show Less
                           </label>
                        </div>
                     </div>
                  </div>

                  {/* 推薦動漫區塊 */}
                  <div className="mt-8 -mx-4 sm:mx-0">
                     <AnimeRecommendations recommendations={recommendations} />
                  </div>
               </div>
            </div>

            {/* Right Column: Playlist Sidebar */}
            <EpisodeList
               episodes={episodes}
               currentEpNumber={currentEpNumber}
               malId={malId}
            />
         </div>

         {/* 手機版專屬：底部懸浮播放列 (滑過影片後顯示) */}
         <PlayerMobileActionBar
            mal_id={malId}
            anime={anime}
            displayTitle={displayTitle}
            currentEpNumber={currentEpNumber}
         />
      </main>
   );
}
