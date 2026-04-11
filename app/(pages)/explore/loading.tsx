import { IoCompassOutline } from 'react-icons/io5';

export default function ExploreLoading() {
   return (
      <main className="flex-1 relative min-h-screen max-w-[calc(100vw-66px)] md:max-w-full w-full overflow-y-auto bg-[#0B0E14] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
         {/* 頂部 Header 骨架 */}
         <div className="relative pt-24 pb-8 px-6 md:px-8 lg:px-12 z-10">
            <div className="flex items-center gap-3 mb-2">
               <IoCompassOutline
                  className="text-white/20 animate-pulse"
                  size={36}
               />
               <div className="w-40 h-10 bg-white/10 rounded-lg animate-pulse" />
            </div>
            <div className="w-72 md:w-96 h-4 bg-white/5 rounded-md animate-pulse mt-3" />
         </div>

         {/* 網格骨架 */}
         <div className="px-6 md:px-8 lg:px-12 pb-24">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
               {[...Array(24)].map((_, i) => (
                  <div
                     key={i}
                     className="w-full aspect-[3/4] rounded-xl bg-white/5 border border-white/10 animate-pulse shadow-lg"
                  />
               ))}
            </div>
         </div>
      </main>
   );
}
