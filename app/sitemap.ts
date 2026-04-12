import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
   const baseUrl = 'https://zen-stream-five.vercel.app';

   return [
      {
         url: baseUrl,
         lastModified: new Date(),
         changeFrequency: 'daily',
         priority: 1,
      },
      {
         url: `${baseUrl}/explore`,
         lastModified: new Date(),
         changeFrequency: 'hourly',
         priority: 0.8,
      },
      {
         url: `${baseUrl}/history`,
         lastModified: new Date(),
         changeFrequency: 'hourly',
         priority: 0.8,
      },
      {
         url: `${baseUrl}/anime`,
         lastModified: new Date(),
         changeFrequency: 'hourly',
         priority: 0.8,
      },
      {
         url: `${baseUrl}/bookmarks`,
         lastModified: new Date(),
         changeFrequency: 'hourly',
         priority: 0.8,
      },
      {
         url: `${baseUrl}/player`,
         lastModified: new Date(),
         changeFrequency: 'hourly',
         priority: 0.8,
      },
   ];
}
