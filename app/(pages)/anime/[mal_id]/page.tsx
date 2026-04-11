// app/anime/[mal_id]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { IoPlayCircle } from 'react-icons/io5';
import { fetchJikan } from '@/lib/jikan-api';
import AnimeEpisodes from './_components/AnimeEpisodes';
import AnimeRecommendations from './_components/AnimeRecommendations';
import AnimeCharacters from './_components/AnimeCharacters';

export default async function AnimeDetailPage({
   params,
}: {
   params: Promise<{ mal_id: string }>;
}) {
   const resolvedParams = await params;
   const mal_id = resolvedParams.mal_id;

   // 1. 獲取 Jikan API 動漫詳細資料
   const jikanData = await fetchJikan(
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

   // 2. 獲取額外資訊
   const query = `
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

   // AniList 沒有嚴格限速，獨立發送
   const anilistPromise = fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables: { id: parseInt(mal_id) } }),
      cache: 'no-store',
   }).catch(() => null);

   // 延遲 1500 毫秒後請求集數
   await new Promise((resolve) => setTimeout(resolve, 1500));
   const episodesData = await fetchJikan(
      `https://api.jikan.moe/v4/anime/${mal_id}/episodes`,
   );

   // 延遲 1500 毫秒後請求角色資料
   await new Promise((resolve) => setTimeout(resolve, 1500));
   const charactersData = await fetchJikan(
      `https://api.jikan.moe/v4/anime/${mal_id}/characters`,
   );

   // 延遲 1500 毫秒後請求推薦動漫
   await new Promise((resolve) => setTimeout(resolve, 1500));
   const recommendationsData = await fetchJikan(
      `https://api.jikan.moe/v4/anime/${mal_id}/recommendations`,
   );

   const anilistRes = await anilistPromise;
   const anilistData = anilistRes?.ok ? await anilistRes.json() : null;
   const media = anilistData?.data?.Media;
   const bannerImage = media?.bannerImage;
   const bgImage = bannerImage || anime.images?.webp?.large_image_url;

   // 取得最終資料陣列
   let episodes = episodesData?.data || [];
   // 限制最多顯示 20 個角色，避免畫面過於冗長
   const characters = charactersData?.data?.slice(0, 20) || [];
   const recommendations = recommendationsData?.data || [];

   // 🚨 防呆機制：如果 Jikan 找不到 Episode，改用 AniList 的資料來補齊
   if (episodes.length === 0 && media) {
      const airedCount = media.nextAiringEpisode
         ? media.nextAiringEpisode.episode - 1
         : media.episodes || 0;

      if (airedCount > 0) {
         episodes = Array.from({ length: airedCount }, (_, i) => {
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

            return { mal_id: epNum, title, title_romanji: null, aired: null };
         });
      }
   }

   return (
      <main className="flex-1 relative h-full min-h-screen w-full overflow-y-auto bg-[#0B0E14] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
         {/* 沉浸式頂部橫幅背景 */}
         <div className="absolute top-0 left-0 w-full h-[55vh] lg:h-[65vh] z-0 pointer-events-none">
            <Image
               src={bgImage}
               alt={anime.title}
               fill
               priority
               className="object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#0B0E14] via-[#0B0E14]/80 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-r from-[#0B0E14]/90 via-[#0B0E14]/50 to-transparent" />
         </div>

         {/* 滾動內容容器 */}
         <div className="relative z-10 w-full py-26">
            {/* 主要詳細資訊區塊 */}
            <div className="px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 lg:gap-14">
               {/* 左側：海報與播放按鈕 */}
               <div className="flex flex-col gap-6 items-center lg:items-start">
                  <div className="relative w-56 lg:w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10 group">
                     <Image
                        src={anime.images.webp.large_image_url}
                        alt={anime.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                     />
                  </div>
                  <Link
                     href={`/player/${mal_id}`}
                     className="w-full flex items-center justify-center gap-2 px-8 py-3.5 bg-anime-primary text-white text-lg font-bold rounded-xl hover:bg-anime-primary/90 hover:scale-105 hover:shadow-[0_0_25px_rgba(160,124,254,0.6)] active:scale-95 transition-all duration-300"
                  >
                     <IoPlayCircle size={26} />
                     Watch Now
                  </Link>

                  {/* 相關動漫 (Related Media) */}
                  {anime.relations && anime.relations.length > 0 && (
                     <div className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm shadow-lg">
                        <h3 className="text-base font-bold mb-4 text-white flex items-center gap-2">
                           <div className="w-1.5 h-4 bg-anime-primary rounded-full" />
                           Related Media
                        </h3>
                        <div className="flex flex-col gap-4">
                           {anime.relations.map((rel: any, idx: number) => (
                              <div
                                 key={idx}
                                 className="flex flex-col gap-2 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                              >
                                 <span className="text-[11px] text-anime-primary uppercase tracking-wider font-bold">
                                    {rel.relation}
                                 </span>
                                 <div className="flex flex-wrap gap-2">
                                    {rel.entry.map((entry: any) => (
                                       <Link
                                          key={entry.mal_id}
                                          href={
                                             entry.type === 'anime'
                                                ? `/anime/${entry.mal_id}`
                                                : '#'
                                          }
                                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-300 ${
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

               {/* 右側：詳細資訊 */}
               <div className="flex flex-col gap-5 mt-4 lg:mt-0 text-center lg:text-left">
                  <div>
                     <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-lg leading-tight">
                        {anime.title_english || anime.title}
                     </h1>
                     {anime.title_japanese && (
                        <h2 className="text-lg md:text-xl text-slate-400 font-medium tracking-wide mt-2">
                           {anime.title_japanese}
                        </h2>
                     )}
                  </div>

                  {/* Metadata 標籤 */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-2 text-sm font-semibold text-white/90">
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
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-2">
                     {anime.genres?.map((genre: any) => (
                        <span
                           key={genre.mal_id}
                           className="text-xs md:text-sm px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white/80 hover:bg-anime-primary/40 hover:text-white transition-colors cursor-default"
                        >
                           {genre.name}
                        </span>
                     ))}
                  </div>

                  {/* 簡介 (Synopsis) */}
                  <div className="mt-4">
                     <h3 className="text-xl font-bold mb-3 text-white">
                        Synopsis
                     </h3>
                     <p className="text-slate-300 leading-relaxed text-sm md:text-base text-justify lg:text-left">
                        {anime.synopsis || 'No synopsis available.'}
                     </p>
                  </div>

                  {/* 更多資訊網格 (Studio, Source, Duration, Aired) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                     <div className="flex flex-col gap-1.5">
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                           Studios
                        </span>
                        <span className="text-sm text-slate-200 line-clamp-2">
                           {anime.studios?.map((s: any) => s.name).join(', ') ||
                              'Unknown'}
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

                  {/* 集數列表 (Episodes) 移入右側資訊欄 */}
                  <AnimeEpisodes episodes={episodes} animeId={mal_id} />
               </div>
            </div>

            <AnimeCharacters characters={characters} />
            <AnimeRecommendations recommendations={recommendations} />
         </div>
      </main>
   );
}
