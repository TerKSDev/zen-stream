'use client';

import { useEffect, useRef, useState } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import EpisodeList from './EpisodeList';
import { upsertLocalHistory } from '@/lib/utils/local-storage';
import type { PlaylistEpisode } from '@/types/anime';
import type { HistoryEntry } from '@/types/history';
import '../player.css';

interface VideoPlayerProps {
   videoUrl: string;
   poster?: string;
   storageKey?: string;
   malId: string;
   currentEpNumber: string;
   episodes: PlaylistEpisode[];
   thumbnailUrl?: string;
   historyMeta: {
      mal_id: number;
      title: string;
      image: string;
   };
}

export default function VideoPlayer({
   videoUrl,
   poster,
   storageKey,
   malId,
   currentEpNumber,
   episodes,
   thumbnailUrl,
   historyMeta,
}: VideoPlayerProps) {
   const artRef = useRef<HTMLDivElement>(null);
   const router = useRouter();
   const [playerNode, setPlayerNode] = useState<HTMLElement | null>(null);
   const [showDrawer, setShowDrawer] = useState(false);
   const autoPlayCanceled = useRef(false);
   const lastHistoryPersistAtRef = useRef(0);
   const lastServerSyncAtRef = useRef(0);

   const currentIndex = episodes.findIndex(
      (ep) => ep.number.toString() === currentEpNumber,
   );
   const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
   const nextEp =
      currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;
   const doubleTapSeekSeconds = 5;

   useEffect(() => {
      autoPlayCanceled.current = false;
      if (!artRef.current) return;

      const syncHistoryToServer = async (entry: HistoryEntry) => {
         try {
            await fetch('/api/history', {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify({ item: entry }),
            });
         } catch {
            // Fail silently
         }
      };

      const persistWatchHistory = (progressTime: number, forceSync = false) => {
         if (!Number.isFinite(progressTime) || progressTime < 0) return;

         const now = Date.now();
         if (!forceSync && now - lastHistoryPersistAtRef.current < 5000) return;

         lastHistoryPersistAtRef.current = now;

         const normalizedProgress = Number(progressTime.toFixed(2));
         const entry: HistoryEntry = {
            mal_id: historyMeta.mal_id,
            title: historyMeta.title,
            episode: String(currentEpNumber),
            progressTime: normalizedProgress,
            image: historyMeta.image || poster || '',
            updatedAt: new Date().toISOString(),
         };

         upsertLocalHistory(entry);

         if (forceSync || now - lastServerSyncAtRef.current >= 15000) {
            lastServerSyncAtRef.current = now;
            void syncHistoryToServer(entry);
         }
      };

      const supportsPip =
         document.pictureInPictureEnabled ||
         'requestPictureInPicture' in HTMLVideoElement.prototype ||
         'webkitSetPresentationMode' in HTMLVideoElement.prototype;

      // Disable default mobile click/double-click toggles to use custom gesture rules.
      Artplayer.MOBILE_CLICK_PLAY = false;
      Artplayer.MOBILE_DBCLICK_PLAY = false;

      const art = new Artplayer({
         container: artRef.current,
         url: videoUrl,
         poster: poster,
         volume: 0.8,
         isLive: false,
         muted: false,
         autoplay: false,
         pip: supportsPip,
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
         subtitleOffset: false, // 關閉預設，改用下方 custom settings 解決卡頓
         miniProgressBar: true,
         mutex: true,
         backdrop: true,
         playsInline: true,
         autoPlayback: true,
         airplay: true,
         lock: true,
         gesture: false,
         fastForward: false,
         autoOrientation: true,
         hotkey: true,
         theme: '#A07CFE',
         settings: [
            {
               name: 'subtitle-offset',
               html: 'Subtitle Offset',
               tooltip: '0s',
               range: [0, -10, 10, 0.1],
               onChange: function (item: any) {
                  // 拖曳時只更新顯示，避免即時重算字幕造成掉幀
                  const previewOffset = Number(item.range[0].toFixed(1));
                  return `${previewOffset}s`;
               },
               onRange: function (item: any) {
                  // 放開滑塊後再套用，降低 settings 面板拖曳卡頓
                  const commitOffset = Number(item.range[0].toFixed(1));
                  requestAnimationFrame(() => {
                     this.subtitleOffset = commitOffset;
                  });
                  return `${commitOffset}s`;
               },
               mounted: function (_panel: any, item: any) {
                  this.on('subtitleOffset', (offset: number) => {
                     item.$range.value = offset;
                     item.tooltip = offset + 's';
                  });
               },
            },
         ],
         icons: {
            loading: `<div class="relative flex items-center justify-center w-16 h-16">
               <div class="absolute inset-0 border-[3px] border-white/10 rounded-full"></div>
               <div class="absolute inset-0 border-[3px] border-[#A07CFE] border-t-transparent rounded-full animate-spin"></div>
               <svg class="absolute text-[#A07CFE]/80 animate-pulse drop-shadow-[0_0_10px_rgba(160,124,254,0.8)]" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
               </svg>
            </div>`,
         },
         ...(thumbnailUrl && {
            thumbnails: {
               url: thumbnailUrl,
               number: 60,
               column: 10,
            },
         }),
         customType: {
            m3u8: function (video, url) {
               if (Hls.isSupported()) {
                  const hls = new Hls({ maxMaxBufferLength: 60 });
                  hls.loadSource(url);
                  hls.attachMedia(video);
               } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                  video.src = url;
               }
            },
         },
      });

      art.on('ready', () => {
         const playerElement = art.template.$player;
         setPlayerNode(playerElement);

         const volumeControl = playerElement.querySelector(
            '.art-control-volume',
         ) as HTMLElement | null;
         const volumePanel = playerElement.querySelector(
            '.art-volume-panel',
         ) as HTMLElement | null;
         const volumeSlider = playerElement.querySelector(
            '.art-volume-slider',
         ) as HTMLElement | null;
         const hasVolumePanel =
            playerElement.querySelector('.art-volume-panel') !== null;

         const isTouchInput = () =>
            playerElement.classList.contains('art-mobile') ||
            navigator.maxTouchPoints > 0 ||
            'ontouchstart' in window;

         // Artplayer sets mobile volume panel to display:none by default; force-enable it for custom touch volume UX.
         if (isTouchInput() && volumePanel) {
            volumePanel.style.display = 'flex';
         }

         const clamp = (value: number, min: number, max: number) =>
            Math.max(min, Math.min(max, value));

         const isInteractiveTarget = (target: EventTarget | null) => {
            const element = target as HTMLElement | null;
            if (!element) return false;

            return Boolean(
               element.closest(
                  '.art-controls, .art-setting, .art-settings, .art-contextmenu, .art-contextmenus, .art-layer-auto-playback, #next-ep-container',
               ),
            );
         };

         let volumePanelHideTimer: number | null = null;
         const hideVolumePanel = () => {
            playerElement.classList.remove('volume-panel-open');
         };

         const showVolumePanelTemporarily = () => {
            if (!hasVolumePanel) return;

            playerElement.classList.add('volume-panel-open');
            if (volumePanelHideTimer !== null) {
               window.clearTimeout(volumePanelHideTimer);
            }
            volumePanelHideTimer = window.setTimeout(() => {
               hideVolumePanel();
               volumePanelHideTimer = null;
            }, 2000);
         };

         const setVolume = (nextVolume: number, revealPanel = false) => {
            const normalizedVolume = clamp(Number(nextVolume.toFixed(2)), 0, 1);
            art.volume = normalizedVolume;
            if (normalizedVolume > 0 && art.muted) art.muted = false;
            if (revealPanel) showVolumePanelTemporarily();
         };

         const handleVolumeControlClick = () => {
            showVolumePanelTemporarily();
         };

         volumeControl?.addEventListener('click', handleVolumeControlClick);
         volumeControl?.addEventListener(
            'touchstart',
            handleVolumeControlClick,
            {
               passive: true,
            },
         );

         const handleWheel = (e: WheelEvent) => {
            if (isTouchInput()) return;
            if (isInteractiveTarget(e.target)) return;

            e.preventDefault();
            const volumeStep = e.deltaY < 0 ? 0.05 : -0.05;
            setVolume(art.volume + volumeStep);
         };

         playerElement.addEventListener('wheel', handleWheel, {
            passive: false,
         });

         if (isTouchInput() && volumeSlider) {
            let isDragging = false;
            volumeSlider.style.touchAction = 'none';

            const updateVolumeFromTouch = (e: TouchEvent) => {
               const rect = volumeSlider.getBoundingClientRect();
               const touch = e.touches[0] || e.changedTouches[0];
               if (!touch) return;

               let volume = 1 - (touch.clientY - rect.top) / rect.height;
               volume = clamp(volume, 0, 1);
               setVolume(volume, true);
            };

            const handleSliderTouchStart = (e: TouchEvent) => {
               isDragging = true;
               e.preventDefault();
               updateVolumeFromTouch(e);
            };

            const handleSliderTouchMove = (e: TouchEvent) => {
               if (!isDragging) return;
               e.preventDefault();
               updateVolumeFromTouch(e);
            };

            const handleSliderTouchEnd = () => {
               isDragging = false;
            };

            volumeSlider.addEventListener(
               'touchstart',
               handleSliderTouchStart,
               {
                  passive: false,
               },
            );
            document.addEventListener('touchmove', handleSliderTouchMove, {
               passive: false,
            });
            document.addEventListener('touchend', handleSliderTouchEnd, {
               passive: true,
            });
            document.addEventListener('touchcancel', handleSliderTouchEnd, {
               passive: true,
            });

            art.on('destroy', () => {
               volumeSlider.removeEventListener(
                  'touchstart',
                  handleSliderTouchStart,
               );
               document.removeEventListener('touchmove', handleSliderTouchMove);
               document.removeEventListener('touchend', handleSliderTouchEnd);
               document.removeEventListener(
                  'touchcancel',
                  handleSliderTouchEnd,
               );
            });
         }

         let touchStartX = 0;
         let touchStartY = 0;
         let touchStartVolume = 0;
         let isVolumeSwipe = false;
         let lastTapAt = 0;
         let lastTapZone: 'left' | 'right' | null = null;

         const handlePlayerTouchStart = (e: TouchEvent) => {
            if (!isTouchInput()) return;

            const touch = e.touches[0];
            if (!touch) return;

            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartVolume = art.volume;
            isVolumeSwipe = false;
         };

         const handlePlayerTouchMove = (e: TouchEvent) => {
            if (!isTouchInput()) return;
            if (!art.fullscreen || isScreenLocked) return;
            if (isInteractiveTarget(e.target)) return;

            const touch = e.touches[0];
            if (!touch) return;

            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;

            if (!isVolumeSwipe) {
               const verticalMoveEnough = Math.abs(deltaY) > 12;
               const mostlyVertical = Math.abs(deltaY) > Math.abs(deltaX);
               if (!verticalMoveEnough || !mostlyVertical) return;
               isVolumeSwipe = true;
            }

            e.preventDefault();

            const swipeRatio =
               (touchStartY - touch.clientY) /
               Math.max(220, window.innerHeight * 0.35);
            setVolume(touchStartVolume + swipeRatio);
         };

         const handlePlayerTouchEnd = (e: TouchEvent) => {
            const touch = e.changedTouches[0];
            if (!touch) {
               isVolumeSwipe = false;
               return;
            }

            if (isScreenLocked) {
               const swipeDistanceX = touch.clientX - touchStartX;
               if (Math.abs(swipeDistanceX) > 80) {
                  const lockControl = art.template.$player.querySelector(
                     '.art-control-lock',
                  ) as HTMLElement | null;
                  lockControl?.click();
                  if ('vibrate' in navigator) navigator.vibrate(50);
                  art.notice.show = 'Screen Unlocked';
               }
               return;
            }

            if (!isTouchInput()) return;
            if (isInteractiveTarget(e.target)) return;

            const movedX = Math.abs(touch.clientX - touchStartX);
            const movedY = Math.abs(touch.clientY - touchStartY);

            if (isVolumeSwipe) {
               isVolumeSwipe = false;
               return;
            }

            if (movedX > 14 || movedY > 14) return;

            const rect = playerElement.getBoundingClientRect();
            if (!rect.width) return;

            const offsetX = touch.clientX - rect.left;
            const leftBoundary = rect.width * 0.33;
            const rightBoundary = rect.width * 0.67;
            const tapZone =
               offsetX < leftBoundary
                  ? 'left'
                  : offsetX > rightBoundary
                    ? 'right'
                    : 'center';

            if (tapZone === 'center') {
               e.preventDefault();
               e.stopPropagation();
               if (art.playing) art.pause();
               else void art.play();
               return;
            }

            const now = Date.now();
            const isDoubleTap =
               lastTapZone === tapZone && now - lastTapAt <= 280;

            if (isDoubleTap) {
               e.preventDefault();
               e.stopPropagation();

               const seekStep = doubleTapSeekSeconds;
               const seekDelta = tapZone === 'left' ? -seekStep : seekStep;
               const duration = Number.isFinite(art.duration)
                  ? art.duration
                  : Infinity;
               art.currentTime = clamp(
                  art.currentTime + seekDelta,
                  0,
                  duration,
               );
               art.notice.show =
                  tapZone === 'left'
                     ? `Rewind ${seekStep}s`
                     : `Forward ${seekStep}s`;
               lastTapAt = 0;
               lastTapZone = null;
               return;
            }

            lastTapAt = now;
            lastTapZone = tapZone;
         };

         playerElement.addEventListener('touchstart', handlePlayerTouchStart, {
            passive: true,
            capture: true,
         });
         playerElement.addEventListener('touchmove', handlePlayerTouchMove, {
            passive: false,
            capture: true,
         });
         playerElement.addEventListener('touchend', handlePlayerTouchEnd, {
            passive: false,
            capture: true,
         });
         playerElement.addEventListener('touchcancel', handlePlayerTouchEnd, {
            passive: true,
            capture: true,
         });

         art.on('destroy', () => {
            if (volumePanelHideTimer !== null) {
               window.clearTimeout(volumePanelHideTimer);
            }
            hideVolumePanel();

            volumeControl?.removeEventListener(
               'click',
               handleVolumeControlClick,
            );
            volumeControl?.removeEventListener(
               'touchstart',
               handleVolumeControlClick,
            );

            playerElement.removeEventListener('wheel', handleWheel);
            playerElement.removeEventListener(
               'touchstart',
               handlePlayerTouchStart,
               true,
            );
            playerElement.removeEventListener(
               'touchmove',
               handlePlayerTouchMove,
               true,
            );
            playerElement.removeEventListener(
               'touchend',
               handlePlayerTouchEnd,
               true,
            );
            playerElement.removeEventListener(
               'touchcancel',
               handlePlayerTouchEnd,
               true,
            );
         });
      });

      if (nextEp) {
         art.controls.add({
            name: 'nextEp',
            position: 'left',
            index: 20,
            html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>',
            tooltip: `Next: EP ${nextEp.number}`,
            click: () => router.push(`/player/${malId}/${nextEp.number}`),
         });
      }

      art.controls.add({
         name: 'playlist',
         position: 'right',
         index: 10,
         html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>',
         tooltip: 'Playlist',
         click: () => setShowDrawer((prev) => !prev),
      });

      const handleKeyDown = (e: KeyboardEvent) => {
         if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName))
            return;
         if (e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
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

      if (nextEp) {
         art.on('ready', () => {
            art.layers.add({
               name: 'next-countdown',
               html: `
                  <div class="bg-[#0B0E14]/90 backdrop-blur-md border border-white/10 p-3 pr-4 rounded-2xl flex items-center gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] transform transition-all duration-500 translate-y-10 opacity-0 pointer-events-none" id="next-ep-container">
                     <div class="relative flex items-center justify-center w-12 h-12 shrink-0 cursor-pointer group" id="btn-play-next" title="Play Now">
                        <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                           <circle class="text-white/10" stroke-width="2.5" stroke="currentColor" fill="transparent" r="16" cx="18" cy="18"/>
                           <circle id="countdown-ring" class="text-[#A07CFE] transition-all duration-300 ease-linear" stroke-width="2.5" stroke-dasharray="100.5" stroke-dashoffset="0" stroke-linecap="round" stroke="currentColor" fill="transparent" r="16" cx="18" cy="18"/>
                        </svg>
                        <div class="w-9 h-9 bg-white/10 group-hover:bg-[#A07CFE] rounded-full flex items-center justify-center transition-colors">
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
                  bottom: '0', // 控制定位改交由 CSS 處理響應式
                  right: '0',
                  zIndex: '50',
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
               },
            });

            const btnPlay =
               art.template.$player.querySelector('#btn-play-next');
            const btnCancel =
               art.template.$player.querySelector('#btn-cancel-next');

            if (btnPlay) {
               btnPlay.addEventListener('click', () => {
                  art.notice.show = `Loading EP ${nextEp.number}...`;
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

            if (timeLeft <= 15 && timeLeft > 0) {
               if (container && container.classList.contains('opacity-0')) {
                  container.classList.remove(
                     'translate-y-10',
                     'opacity-0',
                     'pointer-events-none',
                  );
                  container.classList.add('pointer-events-auto'); // 讓面板本身可點擊
               }
               if (ring) {
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
                  container.classList.remove('pointer-events-auto');
               }
            }
         });

         art.on('video:ended', () => {
            if (!autoPlayCanceled.current) {
               art.notice.show = `Auto-playing EP ${nextEp.number}...`;
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

      let isScreenLocked = false;

      art.on('lock', (state) => {
         isScreenLocked = state;
         art.template.$player.classList.toggle('screen-locked', state);
         if (state) {
            art.notice.show = 'Screen Locked. Swipe horizontally to unlock.';
         }
      });

      art.on('fullscreen', (state) => {
         if (!state) {
            setShowDrawer(false);
            isScreenLocked = false;
            art.template.$player.classList.remove('screen-locked');
         }
      });

      art.on('video:ended', () => {
         const finalProgress = art.duration || art.currentTime;
         if (finalProgress > 0) persistWatchHistory(finalProgress, true);
      });

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
            if (art.currentTime > 5) persistWatchHistory(art.currentTime);
         });
      }

      return () => {
         if (art.currentTime > 5) persistWatchHistory(art.currentTime, true);
         window.removeEventListener('keydown', handleKeyDown, {
            capture: true,
         });
         if (art && art.destroy) art.destroy(true);
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
      historyMeta,
   ]);

   return (
      <>
         {/* 移除原本為了容納外推控制列所加的 mb-[56px]，恢復正常佈局 */}
         <div
            ref={artRef}
            className="w-full aspect-video rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] z-10 relative"
         />

         {playerNode &&
            createPortal(
               <EpisodeList
                  episodes={episodes}
                  currentEpNumber={currentEpNumber}
                  malId={malId}
                  isDrawer={true}
                  isOpen={showDrawer}
                  onClose={() => setShowDrawer(false)}
               />,
               playerNode,
            )}
      </>
   );
}
