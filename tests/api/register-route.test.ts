import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFindUnique, mockCreate, mockHash } = vi.hoisted(() => ({
   mockFindUnique: vi.fn(),
   mockCreate: vi.fn(),
   mockHash: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
   hash: mockHash,
}));

vi.mock('@/lib/config/prisma', () => ({
   prisma: {
      user: {
         findUnique: mockFindUnique,
         create: mockCreate,
      },
   },
}));

import { POST } from '@/app/api/auth/register/route';

describe('POST /api/auth/register', () => {
   beforeEach(() => {
      mockFindUnique.mockReset();
      mockCreate.mockReset();
      mockHash.mockReset();
   });

   it('returns 400 when required fields are missing', async () => {
      const request = new Request('http://localhost/api/auth/register', {
         method: 'POST',
         body: JSON.stringify({ email: 'user@test.dev' }),
      });

      const response = await POST(request);
      const data = (await response.json()) as { message: string };

      expect(response.status).toBe(400);
      expect(data.message).toContain('required');
   });

   it('returns 409 when email already exists', async () => {
      mockFindUnique.mockResolvedValue({ id: 'existing-user' });

      const request = new Request('http://localhost/api/auth/register', {
         method: 'POST',
         body: JSON.stringify({
            name: 'Tester',
            email: 'user@test.dev',
            password: 'password123',
         }),
      });

      const response = await POST(request);
      const data = (await response.json()) as { message: string };

      expect(response.status).toBe(409);
      expect(data.message).toContain('already registered');
      expect(mockCreate).not.toHaveBeenCalled();
   });

   it('creates account successfully with hashed password', async () => {
      mockFindUnique.mockResolvedValue(null);
      mockHash.mockResolvedValue('hashed-password');
      mockCreate.mockResolvedValue({ id: 'new-user' });

      const request = new Request('http://localhost/api/auth/register', {
         method: 'POST',
         body: JSON.stringify({
            name: 'Tester',
            email: 'user@test.dev',
            password: 'password123',
         }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(mockHash).toHaveBeenCalledWith('password123', 12);
      expect(mockCreate).toHaveBeenCalledWith({
         data: {
            name: 'Tester',
            email: 'user@test.dev',
            password: 'hashed-password',
         },
      });
   });
});
