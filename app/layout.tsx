import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_JP, Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import SideNav from '@/components/navigation/SideNav';
import Header from '@/components/navigation/Header';
import AuthSessionProvider from '@/components/providers/SessionProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
   subsets: ['latin'],
   variable: '--font-inter',
});

const notoSansJP = Noto_Sans_JP({
   subsets: ['latin'],
   variable: '--font-noto-sans-jp',
});

const plusJakartaSans = Plus_Jakarta_Sans({
   subsets: ['latin'],
   variable: '--font-plus-jakarta-sans',
});

export const viewport: Viewport = {
   themeColor: '#0B0E14',
};

export const metadata: Metadata = {
   metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL || 'https://zen-stream-five.vercel.app',
   ),

   title: {
      template: '%s | ZenStream',
      default: 'ZenStream - Discover & Watch Anime',
   },
   verification: {
      google: '_af4gXVwaHot-IUy7VqWWbGBqjg9NXZ3Vebl1x3yxas',
   },
   description:
      'Discover, track, and watch your favorite anime. ZenStream provides the latest schedules, trending shows, and personalized recommendations.',
   applicationName: 'ZenStream',
   keywords: [
      'Anime',
      'Streaming',
      'Watch Anime',
      'ZenStream',
      'Anime Schedule',
      'Trending Anime',
      'Anime Streaming Platform',
      'Zen Stream Anime',
      'Anime Recommendations',
      'Anime Reviews',
      'Anime News',
   ],
   authors: [{ name: 'ZenStream' }],

   // 🌟 補充 3：SEO 機器人授權，告訴 Google 放心收錄你的網站
   robots: {
      index: true,
      follow: true,
      googleBot: {
         index: true,
         follow: true,
         'max-video-preview': -1,
         'max-image-preview': 'large',
         'max-snippet': -1,
      },
   },

   openGraph: {
      title: 'ZenStream - Discover & Watch Anime',
      description: 'Discover, track, and watch your favorite anime.',
      siteName: 'ZenStream',
      locale: 'en_US',
      type: 'website',
      images: [
         {
            url: '/og-image.png',
            width: 1200,
            height: 630,
            alt: 'ZenStream Platform Preview',
         },
      ],
   },
   twitter: {
      card: 'summary_large_image',
      title: 'ZenStream - Discover & Watch Anime',
      description: 'Discover, track, and watch your favorite anime.',
      images: ['/og-image.png'],
   },
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html
         lang="en"
         className={`${inter.variable} ${notoSansJP.variable} ${plusJakartaSans.variable} antialiased`}
      >
         <body>
            <AuthSessionProvider>
               <div className="flex h-[100dvh] w-full overflow-hidden">
                  <SideNav />
                  <main className="relative flex h-[100dvh] max-h-[100dvh] min-h-0 min-w-0 flex-1 flex-col">
                     <Suspense fallback={null}>
                        <Header />
                     </Suspense>
                     {children}
                     {/* 全域 Toast 提示設定 */}
                     <Toaster
                        position="bottom-right"
                        toastOptions={{
                           style: {
                              background: '#141824',
                              color: '#fff',
                              border: '1px solid rgba(255,255,255,0.1)',
                           },
                        }}
                     />
                  </main>
               </div>
            </AuthSessionProvider>
         </body>
      </html>
   );
}
