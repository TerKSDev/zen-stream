import { IconType } from 'react-icons';
import { IoHome, IoBookmark, IoTimeSharp, IoCompass } from 'react-icons/io5';

export const PATHS = {
   HOME: '/',
   EXPLORE: '/explore',
   BOOKMARK: '/bookmark',
   History: '/history',
};

interface RouteProps {
   path: string;
   name: string;
   icon: IconType;
}

export const ROUTES: RouteProps[] = [
   {
      path: PATHS.HOME,
      name: 'Home',
      icon: IoHome,
   },
   {
      path: PATHS.EXPLORE,
      name: 'Explore',
      icon: IoCompass,
   },
   {
      path: PATHS.BOOKMARK,
      name: 'Bookmark',
      icon: IoBookmark,
   },
   {
      path: PATHS.History,
      name: 'History',
      icon: IoTimeSharp,
   },
];
