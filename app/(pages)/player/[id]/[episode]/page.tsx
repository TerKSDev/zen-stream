import Image from 'next/image';
import Link from 'next/link';
import { IoArrowBack, IoPlayCircle } from 'react-icons/io5';
import VideoPlayer from './_components/VideoPlayer';
import { fetchVideoStream } from '@/app/_actions/anime';

export default async function AnimeWatchPage({
   params,
}: {
   params: Promise<{ id: string; episode: string }>;
}) {
   const resolvedParams = await params;
   const malId = resolvedParams.id;
   const currentEpNumber = resolvedParams.episode || '1';

   // 1. Fetch anime details from Jikan API (for precise title and poster)
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

   // 2. Fetch Playlist (Episodes) from Jikan with AniList Fallback
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

   const anilistPromise = fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables: { id: parseInt(malId) } }),
      cache: 'no-store',
   }).catch(() => null);

   // Prevent rate limit for Jikan
   await new Promise((resolve) => setTimeout(resolve, 800));
   const episodesRes = await fetch(
      `https://api.jikan.moe/v4/anime/${malId}/episodes`,
   ).catch(() => null);

   const anilistRes = await anilistPromise;
   const anilistData = anilistRes?.ok ? await anilistRes.json() : null;
   const media = anilistData?.data?.Media;
   const bannerImage = media?.bannerImage;

   const episodesData = episodesRes?.ok ? await episodesRes.json() : null;
   let rawEpisodes = episodesData?.data || [];

   // 🚨 Fallback: If Jikan fails to find episodes, use AniList data
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

   // Format episodes to match our UI mapping
   const episodes = rawEpisodes.map((ep: any) => ({
      id: ep.mal_id.toString(),
      number: ep.mal_id,
      title: ep.title,
   }));

   // 3. Fetch Streaming URL using custom Kagure Action
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

   console.log(
      `[Next.js Server] Fetching video stream for: ${searchQuery} - Episode ${currentEpNumber}`,
   );

   const streamData = await fetchVideoStream(searchQuery, currentEpNumber);
   const streamUrl = streamData.success ? streamData.videoUrl : null;

   const currentEpisodeData = episodes.find(
      (ep: any) => ep.number.toString() === currentEpNumber,
   ) || { number: currentEpNumber, title: `Episode ${currentEpNumber}` };
   const bgImage = bannerImage || anime.images?.webp?.large_image_url;

   return (
      <main className="flex-1 relative h-screen w-full overflow-hidden bg-[#0B0E14] flex flex-col">
         {/* Immersive Ambient Blur Background */}
         <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30 blur-[100px] scale-110">
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

         {/* Top Navigation Bar */}
         <header className="relative z-10 w-full px-6 py-6 flex items-center justify-between shrink-0">
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

         {/* Main Content Area: Left Player + Right Playlist */}
         <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-6 px-6 pb-6 overflow-hidden h-full">
            {/* Left Column: Video Player & Info */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
               <div className="w-full aspect-video bg-black rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center relative overflow-hidden group shrink-0">
                  {streamUrl ? (
                     <VideoPlayer videoUrl={streamUrl} poster={bgImage} />
                  ) : (
                     <>
                        {bgImage && (
                           <Image
                              src={bgImage}
                              alt="player thumbnail"
                              fill
                              className="object-cover opacity-40"
                           />
                        )}
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="relative z-10 flex flex-col items-center gap-4 text-white/50">
                           <IoPlayCircle size={64} className="opacity-50" />
                           <span className="font-medium tracking-wider">
                              No stream available for this episode.
                           </span>
                        </div>
                     </>
                  )}
               </div>

               {/* Anime Info Below Player */}
               <div className="mt-6 flex flex-col gap-2 shrink-0 pb-10">
                  <h1 className="text-2xl md:text-3xl font-black text-white line-clamp-1 drop-shadow-md">
                     {displayTitle}
                  </h1>
                  <h2 className="text-lg text-anime-primary font-bold">
                     Episode {currentEpNumber}{' '}
                     {currentEpisodeData?.title
                        ? `- ${currentEpisodeData.title}`
                        : ''}
                  </h2>
                  <div className="mt-4 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                     <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-anime-primary rounded-full" />
                        Synopsis
                     </h3>
                     <p className="text-sm text-slate-400 leading-relaxed text-justify">
                        {anime.synopsis || 'No synopsis available.'}
                     </p>
                  </div>
               </div>
            </div>

            {/* Right Column: Playlist Sidebar */}
            <div className="w-full lg:w-[380px] shrink-0 flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden shadow-2xl">
               <div className="px-6 py-5 border-b border-white/10 bg-black/20">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                     <div className="w-1 h-5 bg-anime-primary rounded-full shadow-[0_0_10px_rgba(160,124,254,0.8)]" />
                     Playlist
                  </h3>
                  <span className="text-xs text-slate-400 mt-1 block">
                     {episodes.length} Episodes Available
                  </span>
               </div>

               {/* Scrollable Episode List */}
               <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                  {episodes.length > 0 ? (
                     episodes.map((ep: any) => {
                        const isCurrent =
                           ep.number.toString() === currentEpNumber;
                        return (
                           <Link
                              href={`/player/${malId}/${ep.number}`}
                              key={ep.id}
                              className={`relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group overflow-hidden ${
                                 isCurrent
                                    ? 'bg-anime-primary/10 border border-anime-primary/50 shadow-[inset_0_0_20px_rgba(160,124,254,0.15)]'
                                    : 'bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10'
                              }`}
                           >
                              {/* Active indicator line */}
                              {isCurrent && (
                                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-anime-primary shadow-[0_0_10px_rgba(160,124,254,0.8)]" />
                              )}

                              <div className="flex flex-col flex-1 min-w-0 pl-2">
                                 <span
                                    className={`text-xs font-black tracking-wider mb-0.5 ${isCurrent ? 'text-anime-primary' : 'text-slate-500 group-hover:text-slate-400'}`}
                                 >
                                    EP {ep.number}
                                 </span>
                                 <span
                                    className={`text-sm font-bold line-clamp-1 transition-colors ${isCurrent ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}
                                 >
                                    {ep.title || `Episode ${ep.number}`}
                                 </span>
                              </div>

                              <IoPlayCircle
                                 className={`shrink-0 transition-all duration-300 ${isCurrent ? 'text-anime-primary opacity-100 drop-shadow-[0_0_8px_rgba(160,124,254,0.6)]' : 'text-white/30 opacity-0 group-hover:opacity-100 group-hover:scale-110'}`}
                                 size={24}
                              />
                           </Link>
                        );
                     })
                  ) : (
                     <div className="p-4 text-center text-sm text-slate-500">
                        No episodes found.
                     </div>
                  )}
               </div>
            </div>
         </div>
      </main>
   );
}
