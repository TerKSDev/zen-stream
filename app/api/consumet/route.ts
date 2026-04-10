// lib/consumet.ts

const CONSUMET_URL = process.env.CONSUMET_URL || 'http://localhost:3000';

/**
 * 步驟 1：搜尋動漫 (使用 animepahe 路由)
 */
export async function searchAnimeOnConsumet(query: string) {
   try {
      const res = await fetch(
         `${CONSUMET_URL}/anime/animepahe/${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error('搜尋失敗');

      const data = await res.json();
      return data.results[0]?.id || null;
   } catch (error) {
      console.error('Consumet Search Error:', error);
      return null;
   }
}

/**
 * 步驟 2：獲取集數列表
 */
export async function getAnimeEpisodes(consumetId: string) {
   try {
      const res = await fetch(
         `${CONSUMET_URL}/anime/animepahe/info/${consumetId}`,
      );
      if (!res.ok) throw new Error('獲取集數失敗');

      const data = await res.json();
      return data.episodes;
   } catch (error) {
      console.error('Consumet Info Error:', error);
      return [];
   }
}

/**
 * 步驟 3：獲取 m3u8 串流播放網址
 */
export async function getStreamingLinks(episodeId: string) {
   // 注意：因為你的 ID 帶有斜線，且後端已改為 watch/*
   // 我們不需要再對 episodeId 進行 encodeURIComponent

   const targetUrl = `${CONSUMET_URL}/anime/gogoanime/watch/${episodeId}`;
   console.log('➡️ 前端正在請求的網址:', targetUrl);

   try {
      const res = await fetch(targetUrl);
      if (!res.ok) throw new Error(`抓取播放連結失敗`);

      const data = await res.json();

      // 優先選擇高品質 (800p)，如果沒有就拿第一個
      const bestSource =
         data.sources.find((s: any) => s.quality.includes('800p')) ||
         data.sources[0];

      return {
         url: bestSource.url,
         referer: data.headers.Referer, // 🌟 把這個傳給播放器
      };
   } catch (error) {
      console.error('抓取播放連結失敗', error);
      return null;
   }
}
