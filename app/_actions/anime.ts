'use server';

export async function fetchVideoStream(title: string, episode: string) {
   try {
      console.log(
         `[Next.js Server] Ready to fetch video: ${title} - Episode ${episode}`,
      );
      const searchRes = await fetch(
         `http://localhost:3000/api/scrape/search?keyword=${encodeURIComponent(title)}`,
         {
            cache: 'no-store',
         },
      );
      const searchData = await searchRes.json();

      if (!searchData.success || searchData.data.length === 0) {
         throw new Error(`Kagure API failed to find anime: ${title}`);
      }

      const targetAnime = searchData.data[0].id;
      console.log(
         `[Next.js Server] Found anime ID: ${targetAnime} for title: ${title}`,
      );

      const ageUrl = `https://www.agedm.io/play/${targetAnime}/1/${episode}`;
      const videoRes = await fetch(
         `http://localhost:3000/api/scrape/episode?url=${encodeURIComponent(ageUrl)}`,
         {
            cache: 'no-store',
         },
      );
      const videoData = await videoRes.json();

      if (!videoData.success || !videoData.data.streamUrl) {
         throw new Error(
            `Kagure API failed to fetch video URL for: ${title} - Episode ${episode}`,
         );
      }

      return { success: true, videoUrl: videoData.data.streamUrl };
   } catch (error) {
      console.error(
         `[Next.js Server] Error fetching video stream for ${title} - Episode ${episode}:`,
         error,
      );
      return {
         success: false,
         error: error instanceof Error ? error.message : 'Unknown error',
      };
   }
}
