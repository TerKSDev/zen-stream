'use client';

import { useState } from 'react';

export default function ExpandableSynopsis({ text }: { text: string }) {
   const [isExpanded, setIsExpanded] = useState(false);

   if (!text) {
      return <p className="text-slate-300 leading-relaxed text-sm md:text-base text-justify lg:text-left">No synopsis available.</p>;
   }

   const threshold = 250; // 字數超過此設定才會顯示展開按鈕
   const isLong = text.length > threshold;

   return (
      <div className="flex flex-col items-start gap-2">
         <p className={`text-slate-300 leading-relaxed text-sm md:text-base text-justify lg:text-left transition-all ${!isExpanded && isLong ? 'line-clamp-4' : ''}`}>
            {text}
         </p>
         {isLong && (
            <button
               onClick={() => setIsExpanded(!isExpanded)}
               className="text-anime-primary text-sm font-bold hover:text-white transition-colors duration-300 mt-1"
            >
               {isExpanded ? 'Show Less' : 'Read More'}
            </button>
         )}
      </div>
   );
}