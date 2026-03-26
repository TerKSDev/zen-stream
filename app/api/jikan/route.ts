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
}

export async function getTopAnime(count: number): Promise<AnimeProps[]> {
   const res = await fetch(
      `https://api.jikan.moe/v4/top/anime?limit=${count}`,
      {
         next: {
            revalidate: 86400,
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
   return result.data as AnimeProps[];
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
      return result.data as AnimeProps[];
   } catch (error) {
      console.error('Error fetching data:', error);
      return [];
   }
}
