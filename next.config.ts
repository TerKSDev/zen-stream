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
      ],
   },
};

export default nextConfig;
