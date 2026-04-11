import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { IoArrowBack, IoPlayCircle } from 'react-icons/io5';
import VideoPlayer from './_components/VideoPlayer';
import { fetchVideoStream } from '@/app/_actions/anime';
import EpisodeList from './_components/EpisodeList';

// ==========================================
// 異步抓取器：專門負責等水母抓影片 (不會阻塞主頁面渲染)
// ==========================================
async function StreamFetcher({
   searchQuery,
   currentEpNumber,
   malId,
   bgImage,
   episodes,
}: {
   searchQuery: string;
   currentEpNumber: string;
   malId: string;
   bgImage: string;
   episodes: any[];
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
         <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-black/40 to-black/40" />
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
   const jikanRes = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
   const jikanData = await jikanRes.json();
   const anime = jikanData.data;

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
   const query = `
      query ($id: Int) {
         Media(idMal: $id, type: ANIME) {
            bannerImage
            episodes
            nextAiringEpisode { episode }
            streamingEpisodes { title }
         }
      }
   `;

   const anilistPromise = fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables: { id: parseInt(malId) } }),
      cache: 'no-store',
   }).catch(() => null);

   await new Promise((resolve) => setTimeout(resolve, 800)); // Rate limit buffer
   const episodesRes = await fetch(
      `https://api.jikan.moe/v4/anime/${malId}/episodes`,
   ).catch(() => null);

   const anilistRes = await anilistPromise;
   const anilistData = anilistRes?.ok ? await anilistRes.json() : null;
   const media = anilistData?.data?.Media;
   const bannerImage = media?.bannerImage;

   const episodesData = episodesRes?.ok ? await episodesRes.json() : null;
   let rawEpisodes = episodesData?.data || [];

   if (rawEpisodes.length === 0 && media) {
      const airedCount = media.nextAiringEpisode
         ? media.nextAiringEpisode.episode - 1
         : media.episodes || 0;
      if (airedCount > 0) {
         rawEpisodes = Array.from({ length: airedCount }, (_, i) => {
            const epNum = i + 1;
            const streamEp = media.streamingEpisodes?.find(
               (ep: any) =>
                  ep.title.startsWith(`Episode ${epNum} `) ||
                  ep.title === `Episode ${epNum}`,
            );
            let title = `Episode ${epNum}`;
            if (streamEp && streamEp.title.includes(' - ')) {
               title = streamEp.title.split(' - ').slice(1).join(' - ').trim();
            } else if (streamEp) {
               title = streamEp.title;
            }
            return { mal_id: epNum, title };
         });
      }
   }

   const episodes = rawEpisodes.map((ep: any) => ({
      id: ep.mal_id.toString(),
      number: ep.mal_id,
      title: ep.title,
   }));

   // 3. 準備水母的搜尋關鍵字
   const displayTitle = anime.title_english || anime.title;
   const zhTitleObj = anime.titles?.find(
      (t: any) =>
         t.type === 'Simplified Chinese' ||
         t.type === 'Traditional Chinese' ||
         t.type === 'Mandarin',
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
      (ep: any) => ep.number.toString() === currentEpNumber,
   ) || { number: currentEpNumber, title: `Episode ${currentEpNumber}` };
   const bgImage = bannerImage || anime.images?.webp?.large_image_url;

   return (
      <main className="flex-1 relative min-h-screen lg:h-screen w-full lg:overflow-hidden bg-[#0B0E14] flex flex-col">
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
         <div className="absolute inset-0 bg-gradient-to-b from-[#0B0E14]/80 via-[#0B0E14]/95 to-[#0B0E14] z-0 pointer-events-none" />

         <header className="relative z-10 w-full px-6 md:px-8 py-6 pt-8 lg:pt-10 flex items-center justify-between shrink-0 mt-14">
            <Link
               href={`/anime/${malId}`}
               className="flex items-center gap-2 text-slate-400 hover:text-anime-primary transition-colors group bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5 hover:border-anime-primary/30"
            >
               <IoArrowBack
                  className="group-hover:-translate-x-1 transition-transform"
                  size={20}
               />
               <span className="font-semibold text-sm">Back to Details</span>
            </Link>
         </header>

         <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-6 px-4 md:px-8 pb-6 lg:overflow-hidden h-full">
            {/* 左側容器 */}
            <div className="w-full lg:flex-1 flex flex-col min-w-0 lg:h-full lg:overflow-y-auto transform-gpu [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
               {/* ========================================== */}
               {/* 🚀 戰術核心：這裡使用 Suspense 包裹水母抓取器 */}
               {/* ========================================== */}
               <div className="w-full aspect-video bg-[#07090D] rounded-2xl ring-1 ring-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden shrink-0">
                  <Suspense fallback={<VideoSkeleton bgImage={bgImage} />}>
                     <StreamFetcher
                        searchQuery={searchQuery}
                        currentEpNumber={currentEpNumber}
                        malId={malId}
                        bgImage={bgImage}
                        episodes={episodes}
                     />
                  </Suspense>
               </div>

               {/* Anime Info Below Player */}
               <div className="mt-6 flex flex-col gap-4 shrink-0 pb-12">
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

                  {/* 豐富化的簡介資訊卡 */}
                  <div className="mt-2 p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl transform-gpu shadow-lg flex gap-4 md:gap-6">
                     {/* 左側：動漫海報 (在極小螢幕上隱藏以節省空間) */}
                     <div className="relative w-24 sm:w-32 md:w-36 aspect-[3/4] shrink-0 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.4)] border border-white/10 hidden sm:block">
                        <Image
                           src={anime.images?.webp?.large_image_url || bgImage}
                           alt={anime.title}
                           fill
                           className="object-cover"
                        />
                     </div>

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
                           {anime.genres?.map((genre: any) => (
                              <span
                                 key={genre.mal_id}
                                 className="text-[10px] md:text-[11px] text-slate-300 border border-white/10 bg-black/20 px-2.5 py-0.5 rounded-full whitespace-nowrap"
                              >
                                 {genre.name}
                              </span>
                           ))}
                        </div>

                        {/* 簡介文字 (使用 line-clamp，Hover 時自動展開) */}
                        <p
                           className="text-xs md:text-sm text-slate-400 leading-relaxed text-justify line-clamp-3 md:line-clamp-4 hover:line-clamp-none transition-all duration-300 cursor-pointer"
                           title="Click to read more"
                        >
                           {anime.synopsis ||
                              'No synopsis available for this anime.'}
                        </p>
                     </div>
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
      </main>
   );
}
