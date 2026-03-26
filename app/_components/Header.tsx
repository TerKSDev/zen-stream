import { IoSearch } from 'react-icons/io5';

export default function Header() {
   return (
      <header className="sticky top-0 left-0 w-full text-white flex items-center h-fit py-5 px-6 justify-between">
         <div className="bg-slate-50/15 px-4 flex gap-2 rounded-full min-w-100 items-center focus-within:border-anime-primary border border-slate-50/10 transition-colors group">
            <IoSearch
               size={16}
               className="text-slate-50/80 group-focus-within:text-white transition-colors"
            />
            <input
               className="font-sans bg-transparent outline-none min-h-9 text-xs w-full text-slate-200 placeholder:text-slate-50/50"
               placeholder="Search by name, tag, or description..."
            />
         </div>

         <div className="h-full flex items-center">
            <button className="px-3 py-1 rounded-full bg-anime-primary text-xs font-medium hover:bg-anime-primary/80 transition-colors">
               Sign In
            </button>
         </div>
      </header>
   );
}
