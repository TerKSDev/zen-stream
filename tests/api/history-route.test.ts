import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
   mockGetServerSession,
   mockEnsureUserByEmail,
   mockFindMany,
   mockUpsert,
   mockDeleteMany,
} = vi.hoisted(() => ({
   mockGetServerSession: vi.fn(),
   mockEnsureUserByEmail: vi.fn(),
   mockFindMany: vi.fn(),
   mockUpsert: vi.fn(),
   mockDeleteMany: vi.fn(),
}));

vi.mock('next-auth', () => ({
   getServerSession: mockGetServerSession,
}));

vi.mock('@/lib/auth-options', () => ({
   authOptions: {},
}));

vi.mock('@/lib/user-account', () => ({
   ensureUserByEmail: mockEnsureUserByEmail,
}));

vi.mock('@/lib/config/prisma', () => ({
   prisma: {
      history: {
         findMany: mockFindMany,
         upsert: mockUpsert,
         deleteMany: mockDeleteMany,
      },
   },
}));

import { DELETE, GET, POST } from '@/app/api/history/route';

describe('History Route Handlers', () => {
   beforeEach(() => {
      mockGetServerSession.mockReset();
      mockEnsureUserByEmail.mockReset();
      mockFindMany.mockReset();
      mockUpsert.mockReset();
      mockDeleteMany.mockReset();
   });

   it('GET returns 401 when unauthenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      expect(response.status).toBe(401);
   });

   it('POST upserts history and returns normalized response', async () => {
      mockGetServerSession.mockResolvedValue({
         user: { email: 'user@test.dev', name: 'Tester' },
      });
      mockEnsureUserByEmail.mockResolvedValue({ id: 'user-1' });
      mockUpsert.mockResolvedValue({ id: 'history-1' });
      mockFindMany.mockResolvedValue([
         {
            id: 'history-1',
            malId: 1,
            title: 'Sample Anime',
            episode: '3',
            progressTime: 132.2,
            image: 'https://img.test/poster.jpg',
            updatedAt: new Date('2026-04-13T00:00:00.000Z'),
         },
      ]);

      const request = new Request('http://localhost/api/history', {
         method: 'POST',
         body: JSON.stringify({
            item: {
               mal_id: 1,
               title: 'Sample Anime',
               episode: '3',
               progressTime: 132.2,
               image: 'https://img.test/poster.jpg',
            },
         }),
      });

      const response = await POST(request);
      const data = (await response.json()) as {
         histories: Array<{ mal_id: number; episode: string }>;
      };

      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledTimes(1);
      expect(data.histories[0]).toEqual(
         expect.objectContaining({ mal_id: 1, episode: '3' }),
      );
   });

   it('DELETE clearAll removes all rows for current user', async () => {
      mockGetServerSession.mockResolvedValue({
         user: { email: 'user@test.dev', name: 'Tester' },
      });
      mockEnsureUserByEmail.mockResolvedValue({ id: 'user-1' });
      mockDeleteMany.mockResolvedValue({ count: 3 });
      mockFindMany.mockResolvedValue([]);

      const request = new Request('http://localhost/api/history', {
         method: 'DELETE',
         body: JSON.stringify({ clearAll: true }),
      });

      const response = await DELETE(request);
      const data = (await response.json()) as { histories: unknown[] };

      expect(response.status).toBe(200);
      expect(mockDeleteMany).toHaveBeenCalledWith({
         where: { userId: 'user-1' },
      });
      expect(data.histories).toEqual([]);
   });
});
