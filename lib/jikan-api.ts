// lib/api.ts
export async function fetchJikan(url: string) {
   let retries = 4;
   let delay = 2000;

   for (let i = 0; i < retries; i++) {
      try {
         const res = await fetch(url, { cache: 'no-store' });

         if (res.ok) {
            return await res.json();
         }

         if (res.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 1.5;
            continue;
         }

         return null;
      } catch (error) {
         return null;
      }
   }
   return null;
}
