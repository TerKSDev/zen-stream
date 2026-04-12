import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
   /* config options here */
   reactCompiler: true,
   images: {
      remotePatterns: [
         {
            protocol: 'https',
            hostname: 'cdn.myanimelist.net',
            port: '',
            pathname: '/**',
         },
         {
            protocol: 'https',
            hostname: 'myanimelist.net',
            port: '',
            pathname: '/**',
         },
         {
            protocol: 'https',
            hostname: 's4.anilist.co',
            port: '',
            pathname: '/**',
         },
         {
            protocol: 'https',
            hostname: 'api.dicebear.com',
            port: '',
            pathname: '/**',
         },
         {
            protocol: 'https',
            hostname: 'lh3.googleusercontent.com',
            port: '',
            pathname: '/**',
         },
      ],
   },
};

export default nextConfig;
