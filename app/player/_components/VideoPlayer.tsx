'use client';

import { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface VideoPlayerProps {
   videoUrl: string;
   poster?: string;
}

export default function VideoPlayer({ videoUrl, poster }: VideoPlayerProps) {
   const artRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (!artRef.current) return;

      // 初始化 ArtPlayer
      const art = new Artplayer({
         container: artRef.current,
         url: videoUrl,
         poster: poster,
         volume: 0.5,
         isLive: false,
         muted: false,
         autoplay: false,
         pip: true, // 畫中畫
         autoSize: true,
         autoMini: true,
         screenshot: true, // 截圖
         setting: true,
         loop: false,
         flip: true,
         playbackRate: true,
         aspectRatio: true,
         fullscreen: true,
         fullscreenWeb: true,
         subtitleOffset: true,
         miniProgressBar: true,
         mutex: true,
         backdrop: true,
         playsInline: true,
         autoPlayback: true,
         airplay: true,
         customType: {
            m3u8: function (video, url) {
               if (Hls.isSupported()) {
                  const hls = new Hls({
                     // ⚠️ 這裡非常關鍵：有些片源需要特定配置
                     xhrSetup: function (xhr) {
                        // 注意：瀏覽器通常不允許直接在這裡設 Referer
                        // 如果影片還是 403，通常需要後端 Proxy 或特定瀏覽器插件繞過
                     },
                  });
                  hls.loadSource(url);
                  hls.attachMedia(video);
               } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                  video.src = url;
               }
            },
         },
      });

      return () => {
         if (art && art.destroy) {
            art.destroy(false);
         }
      };
   }, [videoUrl, poster]);

   return (
      <div
         ref={artRef}
         className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10"
      />
   );
}
