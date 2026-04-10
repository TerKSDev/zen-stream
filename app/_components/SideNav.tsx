'use client';

import { ROUTES } from '@/lib/config/route';
import Link from 'next/link';
import { IoLogInOutline } from 'react-icons/io5';
import { usePathname } from 'next/navigation';

export default function SideNav() {
   const pathname = usePathname();

   return (
      <nav className="min-h-screen sticky top-0 left-0 flex flex-col items-center gap-8 min-w-fit px-3 py-6 max-w-fit z-50 bg-[#0B0E14] justify-between border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
         <div className="relative w-8.5 h-8.5 flex items-center justify-center">
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
                     className={`relative rounded-xl transition-all duration-300 w-10 h-10 flex items-center justify-center group ${
                        isActive
                           ? 'bg-anime-primary/10 shadow-[inset_0_0_12px_rgba(160,124,254,0.1)]'
                           : 'text-slate-400 hover:bg-white/5 hover:text-white hover:scale-110'
                     }`}
                  >
                     {/* Active Indicator Line */}
                     {isActive && (
                        <div className="absolute -left-3 w-1 h-5 bg-anime-primary rounded-r-full shadow-[0_0_8px_rgba(160,124,254,0.8)]" />
                     )}
                     <route.icon
                        className={`transition-all duration-300 ${isActive ? 'text-anime-primary drop-shadow-[0_0_8px_rgba(160,124,254,0.6)]' : 'group-hover:text-white'}`}
                        size={20}
                     />
                  </Link>
               );
            })}
         </div>

         <div className="mb-2">
            <Link
               href={ROUTES[0].path}
               title="Sign In"
               className="relative rounded-xl transition-all duration-300 w-10 h-10 flex items-center justify-center group text-slate-400 hover:bg-white/5 hover:text-white hover:scale-110"
            >
               <IoLogInOutline
                  className="transition-all duration-300 group-hover:text-anime-primary group-hover:drop-shadow-[0_0_8px_rgba(160,124,254,0.6)]"
                  size={24}
               />
            </Link>
         </div>
      </nav>
   );
}
