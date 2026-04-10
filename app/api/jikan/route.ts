interface AnimeProps {
   mal_id: number;
   title: string;
   title_english: string;
   images: {
      webp: {
         large_image_url: string;
      };
   };
   score: number;
   members: number;
   bannerImage?: string | null; // 新增背景大圖屬性
}

// 輔助函數：透過 mal_id 陣列批量向 AniList 獲取背景大圖
async function fetchAniListBanners(
   malIds: number[],
): Promise<Record<number, string>> {
   const query = `
      query ($in: [Int]) {
         Page(page: 1, perPage: 50) {
            media(idMal_in: $in, type: ANIME) {
               idMal
               bannerImage
            }
         }
      }
   `;

   try {
      const res = await fetch('https://graphql.anilist.co', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
         },
         body: JSON.stringify({ query, variables: { in: malIds } }),
         next: { revalidate: 86400 }, // 快取一天
      });
      const result = await res.json();

      const bannerMap: Record<number, string> = {};
      result?.data?.Page?.media?.forEach((m: any) => {
         if (m.idMal && m.bannerImage) bannerMap[m.idMal] = m.bannerImage;
      });
      return bannerMap;
   } catch (error) {
      console.error('Failed to fetch AniList banners:', error);
      return {};
   }
}

export async function getTopAnime(count: number): Promise<AnimeProps[]> {
   const res = await fetch(
      `https://api.jikan.moe/v4/top/anime?limit=${count}`,
      {
         next: {
            revalidate: 6000,
         },
      },
   );

   if (!res.ok) {
      if (res.status === 429) {
         console.error(
            'Jikan API(Top Anime): Too many requests. Please try again later.',
         );
         return [];
      }
      throw new Error('Failed to fetch data: ' + res.statusText);
   }

   const result = await res.json();
   const animes = result.data as AnimeProps[];

   // 批量獲取背景圖並合併資料
   const bannerMap = await fetchAniListBanners(animes.map((a) => a.mal_id));
   return animes.map((a) => ({
      ...a,
      bannerImage: bannerMap[a.mal_id] || null,
   }));
}

export async function getSeasonAnime(count: number): Promise<AnimeProps[]> {
   try {
      const res = await fetch(
         `https://api.jikan.moe/v4/seasons/now?limit=${count}&order_by=members&sort=desc&filter=tv`,
         {
            next: {
               revalidate: 86400,
            },
         },
      );

      if (!res.ok) {
         if (res.status === 429) {
            console.error(
               'Jikan API(Season Anime): Too many requests. Please try again later.',
            );
            return [];
         }
         throw new Error('Failed to fetch data: ' + res.statusText);
      }

      const result = await res.json();
      const animes = result.data as AnimeProps[];

      // 批量獲取背景圖並合併資料
      const bannerMap = await fetchAniListBanners(animes.map((a) => a.mal_id));
      return animes.map((a) => ({
         ...a,
         bannerImage: bannerMap[a.mal_id] || null,
      }));
   } catch (error) {
      console.error('Error fetching data:', error);
      return [];
   }
}
