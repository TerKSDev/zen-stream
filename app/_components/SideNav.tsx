'use client';

import { ROUTES } from '@/lib/config/route';
import Link from 'next/link';
import { IoLogInOutline } from 'react-icons/io5';
import { usePathname } from 'next/navigation';

export default function SideNav() {
   const pathname = usePathname();

   return (
      <nav className="min-h-screen sticky top-0 left-0 flex flex-col items-center gap-8 min-w-10 px-3 py-5 max-w-fit z-10 bg-black justify-between border-r border-slate-50/10">
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

         <div className="flex flex-col gap-4">
            {ROUTES.map((route) => {
               const isActive = pathname === route.path;
               return (
                  <Link
                     key={route.name}
                     href={route.path}
                     title={route.name}
                     className={`rounded-full transition-colors hover:bg-slate-800 w-10 h-10 flex items-center justify-center group ${isActive && 'bg-slate-800'}`}
                  >
                     <route.icon
                        className={`inline-block text-slate-200 group-hover:text-white ${isActive && 'text-white'}`}
                        size={14}
                     />
                  </Link>
               );
            })}
         </div>

         <div>
            <Link
               href={ROUTES[0].path}
               className="rounded-full transition-colors hover:bg-slate-800 w-10 h-10 flex items-center justify-center group"
            >
               <IoLogInOutline className="inline-block text-slate-200 text-lg group-hover:text-white" />
            </Link>
         </div>
      </nav>
   );
}
