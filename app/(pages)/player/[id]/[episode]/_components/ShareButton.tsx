'use client';

import { useState } from 'react';
import { IoShareSocialOutline, IoCheckmarkCircle } from 'react-icons/io5';

export default function ShareButton({ title }: { title: string }) {
   const [copied, setCopied] = useState(false);

   const handleShare = async () => {
      const url = window.location.href;
      if (navigator.share) {
         try {
            await navigator.share({
               title: title,
               url: url,
            });
         } catch (err) {
            console.log('User canceled share or error occurred', err);
         }
      } else {
         await navigator.clipboard.writeText(url);
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
      }
   };

   return (
      <button
         onClick={handleShare}
         className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-anime-primary/20 hover:border-anime-primary/50 hover:text-anime-primary transition-all duration-300 shadow-lg group"
      >
         {copied ? (
            <IoCheckmarkCircle className="text-green-400" size={20} />
         ) : (
            <IoShareSocialOutline className="group-hover:scale-110 transition-transform" size={20} />
         )}
         <span className="text-sm font-bold tracking-wide">{copied ? 'COPIED!' : 'SHARE'}</span>
      </button>
   );
}