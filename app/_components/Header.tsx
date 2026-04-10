import { IoSearch } from 'react-icons/io5';

export default function Header() {
   return (
      <header className="absolute top-0 left-0 w-full flex items-center h-fit py-6 px-8 justify-between z-50">
         <div className="bg-white/5 hover:bg-white/10 backdrop-blur-md focus-within:bg-[#0B0E14]/90 px-4 flex gap-3 rounded-xl min-w-100 items-center border border-white/10 focus-within:border-anime-primary/50 focus-within:ring-2 focus-within:ring-anime-primary/20 focus-within:shadow-[0_0_20px_rgba(160,124,254,0.2)] transition-all duration-300 group focus-within:bg-white/10">
            <IoSearch
               size={18}
               className="text-slate-400 group-focus-within:text-anime-primary group-focus-within:drop-shadow-[0_0_8px_rgba(160,124,254,0.8)] transition-all duration-300"
            />
            <input
               className="font-sans bg-transparent outline-none min-h-11 text-sm w-full text-white placeholder:text-slate-500 transition-colors"
               placeholder="Search by name, tag, or description..."
            />
         </div>

         <div className="h-full flex items-center">
            <button className="px-6 py-2.5 rounded-xl bg-anime-primary text-white text-sm font-bold hover:bg-anime-primary/90 hover:scale-105 hover:shadow-[0_0_20px_rgba(160,124,254,0.6)] active:scale-95 transition-all duration-300">
               Sign In
            </button>
         </div>
      </header>
   );
}
