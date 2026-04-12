import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth/auth-options';
import { prisma } from '@/lib/config/prisma';
import { ensureUserByEmail } from '@/lib/services/auth/user-account';

type BookmarkPayload = {
   mal_id?: number;
   title?: string;
   images?: {
      webp?: {
         large_image_url?: string;
      };
   };
};

export async function POST(req: Request) {
   try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.email) {
         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const userEmail = session.user.email.toLowerCase();
      const userName = session.user.name?.trim() || userEmail.split('@')[0];

      const user = await ensureUserByEmail({
         email: userEmail,
         name: userName,
      });

      const body = (await req.json()) as { localBookmarks?: BookmarkPayload[] };
      const localBookmarks = Array.isArray(body?.localBookmarks)
         ? body.localBookmarks
         : [];

      await Promise.all(
         localBookmarks
            .filter((anime) => typeof anime?.mal_id === 'number')
            .map((anime) =>
               prisma.bookmark.upsert({
                  where: {
                     userId_malId: {
                        userId: user.id,
                        malId: anime.mal_id as number,
                     },
                  },
                  update: {
                     title: anime.title || 'Unknown',
                     image: anime.images?.webp?.large_image_url || '',
                  },
                  create: {
                     userId: user.id,
                     malId: anime.mal_id as number,
                     title: anime.title || 'Unknown',
                     image: anime.images?.webp?.large_image_url || '',
                  },
               }),
            ),
      );

      const dbBookmarks = await prisma.bookmark.findMany({
         where: { userId: user.id },
         orderBy: { addedAt: 'asc' },
      });

      const formattedBookmarks = dbBookmarks.map((bookmark) => ({
         mal_id: bookmark.malId,
         title: bookmark.title,
         images: {
            webp: {
               large_image_url: bookmark.image || '',
            },
         },
      }));

      return NextResponse.json(
         { bookmarks: formattedBookmarks },
         { status: 200 },
      );
   } catch {
      return NextResponse.json({ message: 'Sync failed' }, { status: 500 });
   }
}
