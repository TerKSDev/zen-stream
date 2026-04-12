'use client';

import { Fragment, useState, useTransition } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { IoClose, IoSend, IoCheckmarkCircle } from 'react-icons/io5';
import { sendFeedback } from '@/app/_actions/feedback';

interface FeedbackModalProps {
   isOpen: boolean;
   onClose: () => void;
}

const TYPES = ['Suggestion', 'Bug', 'Question'];

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
   const [isPending, startTransition] = useTransition();
   const [type, setType] = useState(TYPES[0]);
   const [message, setMessage] = useState('');
   const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

   const handleClose = () => {
      if (isPending) return;
      onClose();
      // 等待動畫結束後再重置表單狀態
      setTimeout(() => {
         setStatus('idle');
         setMessage('');
         setType(TYPES[0]);
      }, 300);
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim()) return;

      setStatus('idle');
      const currentUrl =
         typeof window !== 'undefined' ? window.location.href : '';

      startTransition(async () => {
         const res = await sendFeedback({ type, message, url: currentUrl });
         if (res.success) {
            setStatus('success');
            setTimeout(handleClose, 2000); // 顯示成功訊息 2 秒後自動關閉
         } else {
            setStatus('error');
         }
      });
   };

   return (
      <Transition appear show={isOpen} as={Fragment}>
         <Dialog as="div" className="relative z-[100]" onClose={handleClose}>
            {/* 變暗且模糊的背景 */}
            <Transition.Child
               as={Fragment}
               enter="ease-out duration-300"
               enterFrom="opacity-0"
               enterTo="opacity-100"
               leave="ease-in duration-200"
               leaveFrom="opacity-100"
               leaveTo="opacity-0"
            >
               <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
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
                     <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#0B0E14] border border-white/10 p-6 text-left align-middle shadow-2xl transition-all">
                        <div className="flex items-center justify-between mb-2">
                           <Dialog.Title
                              as="h3"
                              className="text-xl font-black text-white"
                           >
                              Send Feedback
                           </Dialog.Title>
                           <button
                              onClick={handleClose}
                              className="text-slate-400 hover:text-white transition-colors"
                           >
                              <IoClose size={24} />
                           </button>
                        </div>
                        <div>
                           <p className="text-sm text-slate-400 mb-4">
                              We appreciate your feedback! Please let us know if
                              you have any suggestions, encounter any bugs, or
                              have questions about ZenStream.
                           </p>
                        </div>

                        {status === 'success' ? (
                           <div className="flex flex-col items-center justify-center py-10 gap-3 text-anime-primary animate-in fade-in zoom-in duration-300">
                              <IoCheckmarkCircle
                                 size={64}
                                 className="drop-shadow-[0_0_15px_rgba(160,124,254,0.6)]"
                              />
                              <p className="text-lg font-bold text-white">
                                 Thank you!
                              </p>
                              <p className="text-sm text-slate-400">
                                 Your feedback has been sent successfully.
                              </p>
                           </div>
                        ) : (
                           <form
                              onSubmit={handleSubmit}
                              className="flex flex-col gap-4"
                           >
                              <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                                 {TYPES.map((t) => (
                                    <button
                                       key={t}
                                       type="button"
                                       onClick={() => setType(t)}
                                       className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${type === t ? 'bg-anime-primary text-white shadow-[0_0_15px_rgba(160,124,254,0.4)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/10'}`}
                                    >
                                       {t}
                                    </button>
                                 ))}
                              </div>
                              <textarea
                                 value={message}
                                 onChange={(e) => setMessage(e.target.value)}
                                 placeholder="Tell us what you think..."
                                 rows={4}
                                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-anime-primary/50 focus:ring-1 focus:ring-anime-primary/50 transition-all resize-none"
                              />
                              {status === 'error' && (
                                 <p className="text-xs text-red-400 font-bold">
                                    Failed to send. Please try again.
                                 </p>
                              )}
                              <button
                                 type="submit"
                                 disabled={isPending || !message.trim()}
                                 className="w-full flex items-center justify-center gap-2 bg-anime-primary text-white font-bold py-2.5 rounded-xl transition-all duration-300 hover:bg-anime-primary/90 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(160,124,254,0.4)]"
                              >
                                 {isPending ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                 ) : (
                                    <>
                                       <IoSend size={16} /> Submit
                                    </>
                                 )}
                              </button>
                           </form>
                        )}
                     </Dialog.Panel>
                  </Transition.Child>
               </div>
            </div>
         </Dialog>
      </Transition>
   );
}
