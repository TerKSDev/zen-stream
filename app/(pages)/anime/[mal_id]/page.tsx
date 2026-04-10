export default async function AnimeDetailPage({
   params,
}: {
   params: { mal_id: Promise<string> };
}) {
   const { mal_id } = await params;
   return (
      <main className="flex-1 relative h-screen max-w-[calc(100vw-66px)] w-full overflow-hidden bg-[#0B0E14]">
         <div className="flex h-full items-center justify-center text-anime-text/40">
            Anime Detail Page - MAL ID: {mal_id}
         </div>
      </main>
   );
}
