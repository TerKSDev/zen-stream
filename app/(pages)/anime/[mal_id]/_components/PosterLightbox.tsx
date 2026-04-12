'use client';

import { useState, Fragment } from 'react';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { IoClose, IoScanOutline } from 'react-icons/io5';

export default function PosterLightbox({
   src,
   alt,
}: {
   src: string;
   alt: string;
}) {
   const [isOpen, setIsOpen] = useState(false);

   return (
      <>
         <div
            className="relative w-full aspect-3/4 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] ring-1 ring-white/10 group cursor-pointer"
            onClick={() => setIsOpen(true)}
         >
            <Image
               src={src}
               alt={alt}
               fill
               priority
               sizes="(max-width: 1024px) 50vw, 320px"
               className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* 懸浮放大提示遮罩 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
               <div className="opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 p-4 bg-black/60 backdrop-blur-md rounded-full text-white shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <IoScanOutline size={28} />
               </div>
            </div>
         </div>

         <Transition appear show={isOpen} as={Fragment}>
            <Dialog
               as="div"
               className="relative z-[100]"
               onClose={() => setIsOpen(false)}
            >
               <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
               >
                  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
               </Transition.Child>

               <div className="fixed inset-0 overflow-y-auto">
                  <div className="flex min-h-full items-center justify-center p-4 text-center">
                     <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                     >
                        <Dialog.Panel className="relative w-full max-w-4xl transform transition-all flex flex-col items-center justify-center">
                           <button
                              onClick={() => setIsOpen(false)}
                              className="absolute -top-12 right-0 md:-right-12 z-10 p-2 text-white/50 hover:text-white hover:scale-110 transition-all"
                           >
                              <IoClose size={32} />
                           </button>
                           <div className="relative w-full h-[85vh]">
                              <Image
                                 src={src}
                                 alt={alt}
                                 fill
                                 className="object-contain"
                              />
                           </div>
                        </Dialog.Panel>
                     </Transition.Child>
                  </div>
               </div>
            </Dialog>
         </Transition>
      </>
   );
}
