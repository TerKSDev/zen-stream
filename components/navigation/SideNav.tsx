'use client';

import { useState } from 'react';
import { ROUTES } from '@/lib/config/routes';
import Link from 'next/link';
import { IoChatbubbleEllipsesSharp } from 'react-icons/io5';
import { usePathname } from 'next/navigation';
import FeedbackModal from '@/components/modals/FeedbackModal';

export default function SideNav() {
   const pathname = usePathname();
   const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

   return (
      <nav className="sticky top-0 left-0 z-50 flex h-screen w-14 shrink-0 flex-col items-center justify-between gap-6 border-r border-white/10 bg-[#05070a] px-2 py-4 shadow-[4px_0_24px_rgba(0,0,0,0.4)] sm:w-16 sm:gap-8 sm:px-3 sm:py-6">
         <div className="relative flex h-8 w-8 items-center justify-center sm:h-8.5 sm:w-8.5">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 border-t-transparent rotate-45 box-border group-hover:border-indigo-400 transition-colors"></div>
            <div
               className="w-0 h-0 ml-1"
               style={{
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderLeft: '14px solid #A07CFE',
               }}
            ></div>
         </div>

         <div className="flex flex-col gap-4 w-full items-center">
            {ROUTES.map((route) => {
               const isActive = pathname === route.path;
               return (
                  <Link
                     key={route.name}
                     href={route.path}
                     title={route.name}
                     className={`relative rounded-xl transition-all duration-300 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group ${
                        isActive
                           ? 'bg-anime-primary/10 shadow-[inset_0_0_12px_rgba(160,124,254,0.1)]'
                           : 'text-slate-400 hover:bg-white/5 hover:text-white hover:scale-110'
                     }`}
                  >
                     {/* Active Indicator Line */}
                     {isActive && (
                        <div className="absolute -left-2 sm:-left-3 w-1 h-5 bg-anime-primary rounded-r-full shadow-[0_0_8px_rgba(160,124,254,0.8)]" />
                     )}
                     <route.icon
                        className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 ${isActive ? 'text-anime-primary drop-shadow-[0_0_8px_rgba(160,124,254,0.6)]' : 'group-hover:text-white'}`}
                     />
                  </Link>
               );
            })}
         </div>

         <div className="mb-2">
            <button
               onClick={() => setIsFeedbackOpen(true)}
               title="Feedback"
               className="relative rounded-xl transition-all duration-300 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group text-slate-400 hover:bg-white/5 hover:text-white hover:scale-110"
            >
               <IoChatbubbleEllipsesSharp className="h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 group-hover:text-anime-primary group-hover:drop-shadow-[0_0_8px_rgba(160,124,254,0.6)]" />
            </button>
         </div>

         <FeedbackModal
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
         />
      </nav>
   );
}
