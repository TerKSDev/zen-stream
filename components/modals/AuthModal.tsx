'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { IoClose, IoLogoGoogle } from 'react-icons/io5';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';

interface AuthModalProps {
   isOpen: boolean;
   onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
   const [mode, setMode] = useState<'login' | 'register'>('login');
   const [name, setName] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState('');

   const handleClose = () => {
      if (isLoading) return;
      onClose();
      // 等待過場動畫結束後重置表單
      setTimeout(() => {
         setMode('login');
         setName('');
         setEmail('');
         setPassword('');
         setError('');
      }, 300);
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');

      try {
         if (mode === 'login') {
            const res = await signIn('credentials', {
               email,
               password,
               redirect: false, // 阻止預設跳轉，讓我們可以自己處理錯誤與 Toast
            });

            if (res?.error) {
               setError('Invalid email or password.');
            } else {
               toast.success('Successfully logged in!');
               handleClose();
            }
         } else {
            // 註冊模式：這裡假設你有一個 /api/auth/register 的 API Route 來處理註冊
            const res = await fetch('/api/auth/register', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ name, email, password }),
            });

            if (!res.ok) {
               const data = await res.json();
               setError(data.message || 'Registration failed.');
            } else {
               // 註冊成功後自動登入
               const loginRes = await signIn('credentials', {
                  email,
                  password,
                  redirect: false,
               });
               if (loginRes?.error) {
                  setError(
                     'Account created, but auto-login failed. Please sign in manually.',
                  );
               } else {
                  toast.success('Account created successfully!');
                  handleClose();
               }
            }
         }
      } catch {
         setError('Something went wrong. Please try again.');
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <Transition appear show={isOpen} as={Fragment}>
         <Dialog as="div" className="relative z-100" onClose={handleClose}>
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
                     <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#0B0E14] border border-white/10 p-8 text-left align-middle shadow-2xl transition-all">
                        <div className="flex items-center justify-between mb-6">
                           <Dialog.Title
                              as="h3"
                              className="text-2xl font-black text-white"
                           >
                              {mode === 'login'
                                 ? 'Welcome Back'
                                 : 'Create Account'}
                           </Dialog.Title>
                           <button
                              onClick={handleClose}
                              className="text-slate-400 hover:text-white transition-colors"
                           >
                              <IoClose size={24} />
                           </button>
                        </div>

                        {/* Google SSO */}
                        <button
                           onClick={() =>
                              signIn('google', { callbackUrl: '/' })
                           }
                           className="w-full flex items-center justify-center gap-3 bg-white text-[#0B0E14] font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors mb-6"
                        >
                           <IoLogoGoogle size={20} className="text-blue-600" />
                           Continue with Google
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                           <div className="flex-1 h-px bg-white/10" />
                           <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                              or email
                           </span>
                           <div className="flex-1 h-px bg-white/10" />
                        </div>

                        <form
                           onSubmit={handleSubmit}
                           className="flex flex-col gap-4"
                        >
                           {mode === 'register' && (
                              <input
                                 type="text"
                                 value={name}
                                 onChange={(e) => setName(e.target.value)}
                                 placeholder="Username"
                                 required
                                 disabled={isLoading}
                                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-anime-primary/50 focus:ring-1 focus:ring-anime-primary/50 transition-all"
                              />
                           )}
                           <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Email address"
                              required
                              disabled={isLoading}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-anime-primary/50 focus:ring-1 focus:ring-anime-primary/50 transition-all"
                           />
                           <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Password"
                              required
                              disabled={isLoading}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-anime-primary/50 focus:ring-1 focus:ring-anime-primary/50 transition-all"
                           />

                           {error && (
                              <p className="text-xs text-red-400 font-bold mt-1">
                                 {error}
                              </p>
                           )}

                           <button
                              type="submit"
                              disabled={isLoading}
                              className="w-full flex items-center justify-center gap-2 bg-anime-primary text-white font-bold py-3 mt-2 rounded-xl transition-all duration-300 hover:bg-anime-primary/90 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(160,124,254,0.4)]"
                           >
                              {isLoading ? (
                                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : mode === 'login' ? (
                                 'Sign In'
                              ) : (
                                 'Sign Up'
                              )}
                           </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-400">
                           {mode === 'login'
                              ? "Don't have an account? "
                              : 'Already have an account? '}
                           <button
                              type="button"
                              onClick={() => {
                                 setMode(
                                    mode === 'login' ? 'register' : 'login',
                                 );
                                 setError('');
                              }}
                              className="text-anime-primary hover:text-white font-bold transition-colors"
                           >
                              {mode === 'login' ? 'Sign Up' : 'Sign In'}
                           </button>
                        </div>
                     </Dialog.Panel>
                  </Transition.Child>
               </div>
            </div>
         </Dialog>
      </Transition>
   );
}
