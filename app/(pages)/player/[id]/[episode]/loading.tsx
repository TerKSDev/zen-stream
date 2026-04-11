export default function PlayerLoading() {
   return (
      <main className="flex-1 relative min-h-screen lg:h-screen w-full lg:overflow-hidden bg-[#0B0E14] flex flex-col">
         {/* Ambient Background Skeleton */}
         <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30 blur-[100px] scale-110 bg-white/5 animate-pulse" />
         <div className="absolute inset-0 bg-linear-to-b from-[#0B0E14]/80 via-[#0B0E14]/95 to-[#0B0E14] z-0 pointer-events-none" />

         {/* Top Navigation Bar Skeleton */}
         <header className="relative z-10 w-full px-6 py-6 flex items-center justify-between shrink-0">
            <div className="w-36 h-10 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
         </header>

         {/* Main Content Area Skeleton */}
         <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-6 px-4 md:px-8 pb-6 lg:overflow-hidden h-full">
            {/* Left Column: Video Player */}
            <div className="w-full lg:flex-1 flex flex-col min-w-0 lg:h-full gap-6">
               <div className="w-full aspect-video bg-white/5 rounded-2xl border border-white/10 animate-pulse shadow-2xl" />
               <div className="flex flex-col gap-3 mt-2">
                  <div className="flex justify-between items-end gap-4">
                     <div className="w-1/2 md:w-1/3 h-10 bg-white/5 rounded-lg animate-pulse" />
                     <div className="w-28 h-10 bg-white/5 rounded-xl animate-pulse shrink-0" />
                  </div>
                  <div className="w-1/3 h-6 bg-white/5 rounded-lg animate-pulse mt-1" />
                  <div className="w-full h-24 bg-white/5 border border-white/10 rounded-xl animate-pulse mt-2" />

                  {/* 推薦動漫骨架屏 */}
                  <div className="w-full mt-8">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-1.5 h-6 bg-white/10 rounded-full animate-pulse" />
                        <div className="w-48 h-6 bg-white/10 rounded-md animate-pulse" />
                     </div>
                     <div className="flex overflow-hidden gap-4 pb-4">
                        {[...Array(4)].map((_, i) => (
                           <div
                              key={i}
                              className="w-[160px] md:w-[200px] h-[240px] md:h-[280px] shrink-0 rounded-xl bg-white/5 border border-white/10 animate-pulse"
                           />
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column: Playlist Sidebar */}
            <div className="w-full lg:w-[400px] shrink-0 flex flex-col h-[500px] lg:h-full bg-white/5 border border-white/10 rounded-2xl animate-pulse shadow-2xl">
               <div className="px-6 py-5 border-b border-white/10 flex flex-col gap-4 bg-black/20 mt-1">
                  <div className="w-28 h-6 bg-white/10 rounded-md" />
                  <div className="w-20 h-4 bg-white/10 rounded-md" />
               </div>
               <div className="px-6 pb-5 border-b border-white/10 bg-black/20 flex flex-col gap-3 shrink-0">
                  <div className="w-full h-11 bg-white/5 rounded-xl" />
                  <div className="w-full h-10 bg-white/5 rounded-xl" />
               </div>
               <div className="p-4 flex flex-col gap-3">
                  {[...Array(8)].map((_, i) => (
                     <div
                        key={i}
                        className="w-full h-16 bg-white/10 rounded-xl"
                     />
                  ))}
               </div>
            </div>
         </div>
      </main>
   );
}
