'use client';

import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import EpisodeList from './EpisodeList';
import type { PlaylistEpisode } from '@/lib/types/anime';

interface VideoPlayerProps {
   videoUrl: string;
   poster?: string;
   storageKey?: string;
   malId: string;
   currentEpNumber: string;
   episodes: PlaylistEpisode[];
   thumbnailUrl?: string; // 預留給未來 API 提供的縮圖拼圖 (Sprite Sheet) 網址
}

export default function VideoPlayer({
   videoUrl,
   poster,
   storageKey,
   malId,
   currentEpNumber,
   episodes,
   thumbnailUrl,
}: VideoPlayerProps) {
   const artRef = useRef<HTMLDivElement>(null);
   const router = useRouter();
   const [playerNode, setPlayerNode] = useState<HTMLElement | null>(null);
   const [showDrawer, setShowDrawer] = useState(false);
   const autoPlayCanceled = useRef(false); // 用來記錄使用者是否取消了自動播放

   const currentIndex = episodes.findIndex(
      (ep) => ep.number.toString() === currentEpNumber,
   );
   const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
   const nextEp =
      currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

   useEffect(() => {
      autoPlayCanceled.current = false; // 每次切換新集數時，重置取消狀態
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
         // --- 替換預設的 Loading 動畫為科技感光環 ---
         icons: {
            loading: `<div class="relative flex items-center justify-center w-16 h-16">
               <div class="absolute inset-0 border-[3px] border-white/10 rounded-full"></div>
               <div class="absolute inset-0 border-[3px] border-[#A07CFE] border-t-transparent rounded-full animate-spin"></div>
               <svg class="absolute text-[#A07CFE]/80 animate-pulse drop-shadow-[0_0_10px_rgba(160,124,254,0.8)]" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
               </svg>
            </div>`,
         },
         // --- 進度條預覽縮圖配置 (Thumbnails) ---
         // 若未來 API 能抓到縮圖拼圖 (Sprite Sheet)，只要傳入 thumbnailUrl 就會自動生效！
         ...(thumbnailUrl && {
            thumbnails: {
               url: thumbnailUrl,
               number: 60, // 假設拼圖內總共有 60 張小縮圖 (需根據實際圖片格式調整)
               column: 10, // 假設排版為 10 欄 (需根據實際圖片格式調整)
            },
         }),
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

      // --- 4. 自動播放下一集 (Auto-play Next Episode) 倒數面板 ---
      if (nextEp) {
         art.on('ready', () => {
            // 建立浮動的「下一集」倒數面板
            art.layers.add({
               name: 'next-countdown',
               html: `
                  <div class="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 p-3 pr-4 rounded-2xl flex items-center gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] transform transition-all duration-500 translate-y-10 opacity-0 pointer-events-none" id="next-ep-container">
                     <div class="relative flex items-center justify-center w-12 h-12 shrink-0 cursor-pointer group" id="btn-play-next" title="Play Now">
                        <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                           <circle class="text-white/10" stroke-width="2.5" stroke="currentColor" fill="transparent" r="16" cx="18" cy="18"/>
                           <circle id="countdown-ring" class="text-anime-primary transition-all duration-300 ease-linear" stroke-width="2.5" stroke-dasharray="100.5" stroke-dashoffset="0" stroke-linecap="round" stroke="currentColor" fill="transparent" r="16" cx="18" cy="18"/>
                        </svg>
                        <div class="w-9 h-9 bg-white/10 group-hover:bg-anime-primary rounded-full flex items-center justify-center transition-colors">
                           <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="text-white ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                     </div>
                     <div class="flex flex-col min-w-30 max-w-50">
                        <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Up Next</span>
                        <span class="text-sm text-white font-bold line-clamp-1">${nextEp.title || `Episode ${nextEp.number}`}</span>
                     </div>
                     <button id="btn-cancel-next" class="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors ml-1" title="Cancel Auto-play">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                     </button>
                  </div>
               `,
               style: {
                  position: 'absolute',
                  bottom: '80px',
                  right: '25px',
                  zIndex: '50',
               },
            });

            const btnPlay =
               art.template.$player.querySelector('#btn-play-next');
            const btnCancel =
               art.template.$player.querySelector('#btn-cancel-next');

            if (btnPlay) {
               btnPlay.addEventListener('click', () => {
                  art.notice.show = `Loading EP ${nextEp.number}...`;

                  // 手動點擊播放時，加入較快的平滑淡出
                  if (art.template.$player) {
                     art.template.$player.style.transition =
                        'opacity 0.4s ease-in-out';
                     art.template.$player.style.opacity = '0';
                  }
                  setTimeout(
                     () => router.push(`/player/${malId}/${nextEp.number}`),
                     400,
                  );
               });
            }
            if (btnCancel) {
               btnCancel.addEventListener('click', () => {
                  autoPlayCanceled.current = true;
                  const container =
                     art.template.$player.querySelector('#next-ep-container');
                  if (container) {
                     container.classList.add(
                        'translate-y-10',
                        'opacity-0',
                        'pointer-events-none',
                     );
                  }
                  art.notice.show = 'Auto-play canceled';
               });
            }
         });

         art.on('video:timeupdate', () => {
            if (autoPlayCanceled.current || !art.duration || art.duration < 20)
               return;

            const timeLeft = art.duration - art.currentTime;
            const container =
               art.template.$player.querySelector('#next-ep-container');
            const ring = art.template.$player.querySelector(
               '#countdown-ring',
            ) as HTMLElement | null;

            // 倒數 15 秒時浮現
            if (timeLeft <= 15 && timeLeft > 0) {
               if (container && container.classList.contains('opacity-0')) {
                  container.classList.remove(
                     'translate-y-10',
                     'opacity-0',
                     'pointer-events-none',
                  );
               }
               if (ring) {
                  // 計算 SVG 光圈的偏移量 (0 為滿，100.5 為空)，創造倒數消失的效果
                  const offset = ((15 - timeLeft) / 15) * 100.5;
                  ring.style.strokeDashoffset = offset.toString();
               }
            } else {
               if (container && !container.classList.contains('opacity-0')) {
                  container.classList.add(
                     'translate-y-10',
                     'opacity-0',
                     'pointer-events-none',
                  );
               }
            }
         });

         // 影片播放完畢且沒有被取消時，執行跳轉
         art.on('video:ended', () => {
            if (!autoPlayCanceled.current) {
               art.notice.show = `Auto-playing EP ${nextEp.number}...`;

               // 影片自動結束時，加入較舒緩的平滑淡出
               if (art.template.$player) {
                  art.template.$player.style.transition =
                     'opacity 0.8s ease-in-out';
                  art.template.$player.style.opacity = '0';
               }
               setTimeout(
                  () => router.push(`/player/${malId}/${nextEp.number}`),
                  800,
               );
            }
         });
      }

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
      thumbnailUrl,
   ]);

   return (
      <>
         {/* 注入自定義樣式，把 Artplayer 原生的設定面板改成高質感深色毛玻璃 */}
         <style
            dangerouslySetInnerHTML={{
               __html: `
            .art-video-player .art-setting,
            .art-video-player .art-contextmenu {
               background: rgba(11, 14, 20, 0.85) !important;
               backdrop-filter: blur(20px) !important;
               -webkit-backdrop-filter: blur(20px) !important;
               border: 1px solid rgba(255, 255, 255, 0.1) !important;
               border-radius: 16px !important;
               padding: 8px !important;
               box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
            }
            .art-video-player .art-setting-inner {
               background: transparent !important;
            }
            .art-video-player .art-setting-item,
            .art-video-player .art-contextmenu-item {
               transition: all 0.2s ease !important;
               border-radius: 8px !important;
               margin-bottom: 2px !important;
            }
            .art-video-player .art-setting-item:hover, 
            .art-video-player .art-contextmenu-item:hover {
               background-color: rgba(160, 124, 254, 0.2) !important;
               color: #A07CFE !important;
            }
            .art-video-player .art-setting-item.art-current {
               color: #A07CFE !important;
            }
         `,
            }}
         />
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
