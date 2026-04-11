'use client';

import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import EpisodeList from './EpisodeList';

interface VideoPlayerProps {
   videoUrl: string;
   poster?: string;
   storageKey?: string;
   malId: string;
   currentEpNumber: string;
   episodes: any[];
}

export default function VideoPlayer({
   videoUrl,
   poster,
   storageKey,
   malId,
   currentEpNumber,
   episodes,
}: VideoPlayerProps) {
   const artRef = useRef<HTMLDivElement>(null);
   const router = useRouter();
   const [playerNode, setPlayerNode] = useState<HTMLElement | null>(null);
   const [showDrawer, setShowDrawer] = useState(false);

   const currentIndex = episodes.findIndex(
      (ep) => ep.number.toString() === currentEpNumber,
   );
   const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
   const nextEp =
      currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

   useEffect(() => {
      if (!artRef.current) return;

      const art = new Artplayer({
         container: artRef.current,
         url: videoUrl,
         poster: poster,
         volume: 0.8,
         isLive: false,
         muted: false,
         autoplay: false, // 保持 false 以符合瀏覽器規範
         pip: true,
         autoSize: true,
         autoMini: true,
         screenshot: true,
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
         lock: true, // 針對手機端：加入螢幕防誤觸鎖定按鈕
         fastForward: true, // 針對手機端：長按畫面可實現 3 倍速快進
         autoOrientation: true, // 手機旋轉時自動進入全螢幕
         hotkey: true, // 開啟鍵盤快捷鍵 (空白鍵暫停、左右鍵快轉、上下鍵音量)
         theme: '#A07CFE', // 注入你的主題紫，讓播放器進度條發亮
         customType: {
            m3u8: function (video, url) {
               if (Hls.isSupported()) {
                  const hls = new Hls({
                     // 提高切片加載的容錯率
                     maxMaxBufferLength: 60,
                  });
                  hls.loadSource(url);
                  hls.attachMedia(video);
               } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                  video.src = url;
               }
            },
         },
      });

      // 保存播放器的 DOM 節點，供 React Portal 掛載 Drawer 使用
      art.on('ready', () => {
         setPlayerNode(art.template.$player);
      });

      // --- 1. 新增：上一集 / 下一集 按鈕 ---
      if (prevEp) {
         art.controls.add({
            position: 'left',
            index: 20,
            html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>',
            tooltip: `Prev: EP ${prevEp.number}`,
            click: () => router.push(`/player/${malId}/${prevEp.number}`),
         });
      }
      if (nextEp) {
         art.controls.add({
            position: 'left',
            index: 20,
            html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>',
            tooltip: `Next: EP ${nextEp.number}`,
            click: () => router.push(`/player/${malId}/${nextEp.number}`),
         });
      }

      // --- 2. 新增：播放清單 Drawer 切換按鈕 ---
      art.controls.add({
         position: 'right',
         index: 10,
         html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
         tooltip: 'Playlist',
         click: () => setShowDrawer((prev) => !prev),
      });

      // --- 3. 攔截鍵盤上下鍵切換集數 ---
      const handleKeyDown = (e: KeyboardEvent) => {
         // 若正在搜尋框輸入文字，則不攔截
         if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName))
            return;

         if (e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation(); // 阻止 Artplayer 改變音量
            if (prevEp) {
               art.notice.show = `Loading EP ${prevEp.number}...`;
               router.push(`/player/${malId}/${prevEp.number}`);
            } else art.notice.show = 'This is the first episode';
         } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            if (nextEp) {
               art.notice.show = `Loading EP ${nextEp.number}...`;
               router.push(`/player/${malId}/${nextEp.number}`);
            } else art.notice.show = 'This is the last episode';
         }
      };

      window.addEventListener('keydown', handleKeyDown, { capture: true });

      // --- 記憶播放進度 ---
      if (storageKey) {
         const cacheKey = `zen-stream-progress-${storageKey}`;

         art.on('ready', () => {
            const savedTime = localStorage.getItem(cacheKey);
            if (savedTime && parseFloat(savedTime) > 5) {
               art.currentTime = parseFloat(savedTime);
               const minutes = Math.floor(art.currentTime / 60);
               const seconds = Math.floor(art.currentTime % 60)
                  .toString()
                  .padStart(2, '0');
               art.notice.show = `已從 ${minutes}:${seconds} 繼續播放`;
            }
         });

         art.on('video:timeupdate', () => {
            if (art.currentTime > 5 && art.duration - art.currentTime > 5) {
               localStorage.setItem(cacheKey, art.currentTime.toString());
            }
         });
      }

      return () => {
         window.removeEventListener('keydown', handleKeyDown, {
            capture: true,
         });
         if (art && art.destroy) {
            art.destroy(true);
         }
      };
   }, [
      videoUrl,
      poster,
      storageKey,
      malId,
      currentEpNumber,
      episodes,
      router,
      prevEp,
      nextEp,
   ]);

   return (
      <>
         <div
            ref={artRef}
            className="w-full aspect-video rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] z-10"
         />
         {/* 利用 React Portal 將側邊欄渲染到 Artplayer 內部，確保全螢幕時也能顯示！ */}
         {playerNode &&
            showDrawer &&
            createPortal(
               <EpisodeList
                  episodes={episodes}
                  currentEpNumber={currentEpNumber}
                  malId={malId}
                  isDrawer={true}
                  onClose={() => setShowDrawer(false)}
               />,
               playerNode,
            )}
      </>
   );
}
