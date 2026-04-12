import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnimeCard } from '@/types/anime';

interface BookmarkState {
   bookmarkedAnimes: AnimeCard[];

   // 操作方法
   addBookmark: (anime: AnimeCard) => void;
   removeBookmark: (mal_id: number) => void;
   toggleBookmark: (anime: AnimeCard) => boolean;
   isBookmarked: (mal_id: number) => boolean;

   // 預留給未來登入/資料庫同步使用
   setBookmarksFromDB: (animes: AnimeCard[]) => void;
   clearBookmarks: () => void;
}

export const useBookmarkStore = create<BookmarkState>()(
   persist(
      (set, get) => ({
         bookmarkedAnimes: [],

         addBookmark: (anime) => {
            // TODO: 未來這裡可以加入 if (isLoggedIn) { await db.addBookmark(user.id, anime.mal_id) }
            set((state) => {
               // 避免重複收藏
               if (
                  state.bookmarkedAnimes.some((a) => a.mal_id === anime.mal_id)
               )
                  return state;
               return { bookmarkedAnimes: [...state.bookmarkedAnimes, anime] };
            });
         },

         removeBookmark: (mal_id) => {
            // TODO: 未來這裡可以加入 if (isLoggedIn) { await db.removeBookmark(user.id, mal_id) }
            set((state) => ({
               bookmarkedAnimes: state.bookmarkedAnimes.filter(
                  (a) => a.mal_id !== mal_id,
               ),
            }));
         },

         toggleBookmark: (anime) => {
            if (get().isBookmarked(anime.mal_id)) {
               get().removeBookmark(anime.mal_id);
               return false; // 回傳 false 代表已移除
            } else {
               get().addBookmark(anime);
               return true; // 回傳 true 代表已新增
            }
         },

         isBookmarked: (mal_id) =>
            get().bookmarkedAnimes.some((a) => a.mal_id === mal_id),

         // 登入時用來將資料庫的收藏清單同步到本地
         setBookmarksFromDB: (animes) => set({ bookmarkedAnimes: animes }),
         // 登出時清空本地快取
         clearBookmarks: () => set({ bookmarkedAnimes: [] }),
      }),
      {
         name: 'zenstream-bookmarks', // 存在 LocalStorage 中的 Key 名稱
      },
   ),
);
