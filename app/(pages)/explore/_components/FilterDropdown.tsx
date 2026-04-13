'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { IoCheckmark, IoChevronDown } from 'react-icons/io5';
import type { FilterOption } from './exploreConstants';

interface FilterDropdownProps {
   label: string;
   value: string;
   options: FilterOption[];
   onChange: (value: string) => void;
}

export function FilterDropdown({
   label,
   value,
   options,
   onChange,
}: FilterDropdownProps) {
   const selectedOption =
      options.find((option) => option.id === value) || options[0];

   return (
      <Listbox value={value} onChange={onChange}>
         <div className="relative min-w-35 flex-1 sm:flex-none">
            <Listbox.Button className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-white transition-all hover:border-anime-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-anime-primary/40">
               <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {label}
               </span>
               <span className="mt-0.5 block text-sm font-bold text-white pr-6 truncate">
                  {selectedOption.name}
               </span>
               <IoChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </Listbox.Button>

            <Transition
               as={Fragment}
               leave="transition ease-in duration-100"
               leaveFrom="opacity-100"
               leaveTo="opacity-0"
            >
               <Listbox.Options className="absolute z-50 mt-2 max-h-72 w-full min-w-max overflow-auto rounded-xl border border-white/10 bg-[#0B0E14]/95 p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl focus:outline-none">
                  {options.map((option) => (
                     <Listbox.Option
                        key={option.id || 'all'}
                        value={option.id}
                        className={({ active }) =>
                           `cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${
                              active
                                 ? 'bg-anime-primary/20 text-white'
                                 : 'text-slate-200'
                           }`
                        }
                     >
                        {({ selected }) => (
                           <div className="flex items-center justify-between gap-4">
                              <span className="whitespace-nowrap">
                                 {option.name}
                              </span>
                              {selected && (
                                 <IoCheckmark
                                    className="text-anime-primary shrink-0"
                                    size={16}
                                 />
                              )}
                           </div>
                        )}
                     </Listbox.Option>
                  ))}
               </Listbox.Options>
            </Transition>
         </div>
      </Listbox>
   );
}
