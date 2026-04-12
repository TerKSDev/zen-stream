export default function Loading() {
   return (
      <main className="flex-1 relative h-full min-h-screen w-full overflow-hidden bg-[#0B0E14]">
         {/* 沉浸式頂部橫幅骨架 */}
         <div className="absolute top-0 left-0 w-full h-[55vh] lg:h-[65vh] z-0 bg-white/5 animate-pulse pointer-events-none" />
         <div className="absolute inset-0 bg-linear-to-t from-[#0B0E14] via-[#0B0E14]/80 to-transparent pointer-events-none" />
         <div className="absolute inset-0 bg-linear-to-r from-[#0B0E14]/90 via-[#0B0E14]/50 to-transparent pointer-events-none" />

         {/* 內容區塊骨架 */}
         <div className="relative z-10 w-full py-26">
            <div className="px-6 md:px-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 lg:gap-14">
               {/* 左側：海報與按鈕 */}
               <div className="flex flex-col gap-6 items-center lg:items-start w-full">
                  <div className="w-56 lg:w-full aspect-3/4 rounded-2xl bg-white/5 border border-white/10 animate-pulse shadow-2xl" />
                  <div className="w-full h-13 bg-white/5 border border-white/10 rounded-xl animate-pulse" />

                  {/* 相關動漫 (Related Media) 骨架屏 */}
                  <div className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
                     <div className="w-32 h-5 bg-white/10 rounded-md animate-pulse mb-2" />
                     <div className="flex flex-col gap-4">
                        {/* 模擬項目 1 */}
                        <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                           <div className="w-16 h-3 bg-white/10 rounded animate-pulse" />
                           <div className="flex gap-2">
                              <div className="w-24 h-7 bg-white/10 rounded-lg animate-pulse" />
                              <div className="w-20 h-7 bg-white/10 rounded-lg animate-pulse" />
                           </div>
                        </div>
                        {/* 模擬項目 2 */}
                        <div className="flex flex-col gap-2">
                           <div className="w-20 h-3 bg-white/10 rounded animate-pulse" />
                           <div className="flex gap-2">
                              <div className="w-32 h-7 bg-white/10 rounded-lg animate-pulse" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* 右側：詳細資訊 */}
               <div className="flex flex-col gap-5 mt-4 lg:mt-0 w-full items-center lg:items-start text-center lg:text-left">
                  {/* 標題 */}
                  <div className="w-3/4 lg:w-2/3 h-10 md:h-14 bg-white/5 rounded-xl animate-pulse" />
                  <div className="w-1/2 lg:w-1/3 h-6 bg-white/5 rounded-lg animate-pulse" />

                  {/* 標籤 */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-2">
                     <div className="w-16 h-8 bg-white/5 rounded-md animate-pulse" />
                     <div className="w-24 h-8 bg-white/5 rounded-md animate-pulse" />
                     <div className="w-20 h-8 bg-white/5 rounded-md animate-pulse" />
                  </div>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-2">
                     <div className="w-16 h-7 bg-white/5 rounded-full animate-pulse" />
                     <div className="w-20 h-7 bg-white/5 rounded-full animate-pulse" />
                     <div className="w-24 h-7 bg-white/5 rounded-full animate-pulse" />
                  </div>

                  {/* 簡介 */}
                  <div className="w-full mt-4 flex flex-col gap-3 items-center lg:items-start">
                     <div className="w-24 h-6 bg-white/5 rounded-lg animate-pulse mb-1" />
                     <div className="w-full h-4 bg-white/5 rounded-md animate-pulse" />
                     <div className="w-full h-4 bg-white/5 rounded-md animate-pulse" />
                     <div className="w-11/12 h-4 bg-white/5 rounded-md animate-pulse" />
                     <div className="w-4/5 h-4 bg-white/5 rounded-md animate-pulse" />
                  </div>

                  {/* 網格資訊 */}
                  <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 p-6 rounded-2xl bg-white/5 border border-white/10 animate-pulse h-24" />

                  {/* Episodes 骨架屏 */}
                  <div className="w-full mt-10 lg:mt-12">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-6 bg-white/10 rounded-full animate-pulse" />
                           <div className="w-24 h-7 bg-white/10 rounded-md animate-pulse" />
                        </div>
                        <div className="w-16 h-6 bg-white/10 rounded-full animate-pulse" />
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                           <div
                              key={i}
                              className="h-20 rounded-xl bg-white/5 border border-white/10 animate-pulse"
                           />
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* 角色與聲優骨架屏 */}
            <div className="w-full px-6 md:px-8 mt-10 lg:mt-14">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-white/10 rounded-full animate-pulse" />
                  <div className="w-64 h-7 bg-white/10 rounded-md animate-pulse" />
               </div>
               <div className="flex overflow-hidden gap-4 pb-4">
                  {[...Array(5)].map((_, i) => (
                     <div
                        key={i}
                        className="w-80 md:w-90 h-24 shrink-0 rounded-xl bg-white/5 border border-white/10 animate-pulse"
                     />
                  ))}
               </div>
            </div>
         </div>
      </main>
   );
}
