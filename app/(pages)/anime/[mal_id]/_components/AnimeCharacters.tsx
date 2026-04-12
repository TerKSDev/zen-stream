import Image from 'next/image';

interface CharacterData {
   character: {
      mal_id: number;
      name: string;
      images: { webp: { image_url: string } };
   };
   role: string;
   voice_actors: {
      person: {
         mal_id: number;
         name: string;
         images: { jpg: { image_url: string } };
      };
      language: string;
   }[];
}

interface AnimeCharactersProps {
   characters: CharacterData[];
}

export default function AnimeCharacters({ characters }: AnimeCharactersProps) {
   if (!characters || characters.length === 0) return null;

   return (
      <div className="w-full px-6 md:px-8 mt-10 lg:mt-14">
         <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-anime-primary rounded-full shadow-[0_0_10px_rgba(160,124,254,0.6)]" />
            Characters & Voice Actors
         </h3>

         {/* 橫向滾動容器 */}
         <div className="flex overflow-x-auto gap-4 pb-4 overscroll-contain [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full snap-x snap-mandatory">
            {characters.map((charData, idx) => {
               const character = charData.character;
               const role = charData.role;
               // 優先顯示日文聲優
               const va =
                  charData.voice_actors?.find(
                     (v) => v.language === 'Japanese',
                  ) || charData.voice_actors?.[0];

               return (
                  <div
                     key={`${character.mal_id}-${idx}`}
                     className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden shrink-0 w-80 md:w-90 h-24 snap-start hover:bg-white/10 hover:border-white/20 hover:shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-all duration-300 group"
                  >
                     {/* 左側：角色 (Character) */}
                     <div className="flex flex-1 items-center gap-3 p-2 bg-linear-to-r from-black/40 to-transparent w-1/2">
                        <div className="relative w-14 h-full rounded-md overflow-hidden shrink-0">
                           {character.images?.webp?.image_url && (
                              <Image
                                 src={character.images.webp.image_url}
                                 alt={character.name}
                                 fill
                                 className="object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                           )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 pr-1">
                           <span className="text-sm font-bold text-white line-clamp-1 leading-tight">
                              {character.name}
                           </span>
                           <span className="text-[10px] font-black text-anime-primary uppercase tracking-wider mt-1">
                              {role}
                           </span>
                        </div>
                     </div>

                     {/* 右側：聲優 (Voice Actor) */}
                     {va && (
                        <div className="flex flex-1 flex-row-reverse items-center gap-3 p-2 text-right bg-linear-to-l from-black/40 to-transparent w-1/2">
                           <div className="relative w-14 h-full rounded-md overflow-hidden shrink-0">
                              {va.person.images?.jpg?.image_url && (
                                 <Image
                                    src={va.person.images.jpg.image_url}
                                    alt={va.person.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                 />
                              )}
                           </div>
                           <div className="flex flex-col flex-1 min-w-0 pl-1">
                              <span className="text-sm font-bold text-white line-clamp-1 leading-tight">
                                 {va.person.name}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                                 {va.language}
                              </span>
                           </div>
                        </div>
                     )}
                  </div>
               );
            })}
         </div>
      </div>
   );
}
