import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/services/auth/auth-options';
import { prisma } from '@/lib/config/prisma';
import { ensureUserByEmail } from '@/lib/services/auth/user-account';

export const dynamic = 'force-dynamic';

type HistoryPayload = {
   mal_id?: number;
   title?: string;
   episode?: string | number;
   progressTime?: number;
   image?: string;
};

type DeletePayload = {
   clearAll?: boolean;
   mal_id?: number;
   episode?: string;
};

function normalizeHistoryItem(payload: HistoryPayload) {
   const malId = Number(payload.mal_id);
   const episode = String(payload.episode ?? '').trim();
   const progressTime = Number(payload.progressTime ?? 0);

   if (!Number.isFinite(malId) || malId <= 0 || !episode) {
      return null;
   }

   if (!Number.isFinite(progressTime) || progressTime < 0) {
      return null;
   }

   return {
      malId,
      episode,
      title: payload.title?.trim() || 'Unknown Title',
      progressTime,
      image: payload.image || '',
   };
}

function formatHistoryEntries(
   entries: Array<{
      id: string;
      malId: number;
      title: string;
      episode: string;
      progressTime: number;
      image: string | null;
      updatedAt: Date;
   }>,
) {
   return entries.map((entry) => ({
      id: entry.id,
      mal_id: entry.malId,
      title: entry.title,
      episode: entry.episode,
      progressTime: entry.progressTime,
      image: entry.image || '',
      updatedAt: entry.updatedAt.toISOString(),
   }));
}

async function parseJsonSafe<T>(request: Request): Promise<T | null> {
   try {
      return (await request.json()) as T;
   } catch {
      return null;
   }
}

async function resolveSessionUser() {
   const session = await getServerSession(authOptions);

   if (!session?.user?.email) {
      return null;
   }

   const email = session.user.email.toLowerCase();
   const name = session.user.name?.trim() || email.split('@')[0] || 'User';

   return ensureUserByEmail({ email, name });
}

async function fetchUserHistory(userId: string) {
   const histories = await prisma.history.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
   });

   return formatHistoryEntries(histories);
}

export async function GET() {
   try {
      const user = await resolveSessionUser();

      if (!user) {
         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const histories = await fetchUserHistory(user.id);

      return NextResponse.json({ histories }, { status: 200 });
   } catch {
      return NextResponse.json(
         { message: 'Failed to load history.' },
         { status: 500 },
      );
   }
}

export async function POST(request: Request) {
   try {
      const user = await resolveSessionUser();

      if (!user) {
         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const body = await parseJsonSafe<{
         item?: HistoryPayload;
         items?: HistoryPayload[];
      }>(request);

      const rawItems = Array.isArray(body?.items)
         ? body?.items
         : body?.item
           ? [body.item]
           : [];

      const items = rawItems
         .map((item) => normalizeHistoryItem(item))
         .filter((item) => item !== null);

      if (items.length === 0) {
         return NextResponse.json(
            { message: 'No valid history payload provided.' },
            { status: 400 },
         );
      }

      await Promise.all(
         items.map((item) =>
            prisma.history.upsert({
               where: {
                  userId_malId_episode: {
                     userId: user.id,
                     malId: item.malId,
                     episode: item.episode,
                  },
               },
               update: {
                  title: item.title,
                  progressTime: item.progressTime,
                  image: item.image,
               },
               create: {
                  userId: user.id,
                  malId: item.malId,
                  title: item.title,
                  episode: item.episode,
                  progressTime: item.progressTime,
                  image: item.image,
               },
            }),
         ),
      );

      const histories = await fetchUserHistory(user.id);
      return NextResponse.json({ histories }, { status: 200 });
   } catch {
      return NextResponse.json({ message: 'Sync failed.' }, { status: 500 });
   }
}

export async function DELETE(request: Request) {
   try {
      const user = await resolveSessionUser();

      if (!user) {
         return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const body = await parseJsonSafe<DeletePayload>(request);

      if (body?.clearAll) {
         await prisma.history.deleteMany({
            where: { userId: user.id },
         });
      } else if (
         typeof body?.mal_id === 'number' &&
         typeof body?.episode === 'string' &&
         body.episode.trim()
      ) {
         await prisma.history.deleteMany({
            where: {
               userId: user.id,
               malId: body.mal_id,
               episode: body.episode.trim(),
            },
         });
      } else {
         return NextResponse.json(
            { message: 'Invalid delete payload.' },
            { status: 400 },
         );
      }

      const histories = await fetchUserHistory(user.id);
      return NextResponse.json({ histories }, { status: 200 });
   } catch {
      return NextResponse.json(
         { message: 'Failed to delete history.' },
         { status: 500 },
      );
   }
}
