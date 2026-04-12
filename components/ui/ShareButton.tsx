'use client';

import { useState } from 'react';
import { IoShareSocialOutline, IoCheckmarkCircle } from 'react-icons/io5';

interface ShareButtonProps {
   title: string;
   className?: string;
}

export default function ShareButton({
   title,
   className = '',
}: ShareButtonProps) {
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
         className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all duration-300 active:scale-95 shadow-lg group ${className}`}
      >
         {copied ? (
            <IoCheckmarkCircle className="text-green-400" size={15} />
         ) : (
            <IoShareSocialOutline
               className="group-hover:scale-110 transition-transform"
               size={15}
            />
         )}
         <span className="text-sm font-bold tracking-wide">
            {copied ? 'COPIED!' : 'SHARE'}
         </span>
      </button>
   );
}
