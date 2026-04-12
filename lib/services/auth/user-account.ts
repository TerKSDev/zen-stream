import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/config/prisma';

type EnsureUserInput = {
   email: string;
   name?: string | null;
};

function normalizeName(name: string | null | undefined, email: string) {
   return (name?.trim() || email.split('@')[0] || 'User').trim();
}

export async function ensureUserByEmail(input: EnsureUserInput) {
   const email = input.email.trim().toLowerCase();
   const name = normalizeName(input.name, email);

   const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
         id: true,
         name: true,
         email: true,
      },
   });

   if (existingUser) {
      if (existingUser.name !== name) {
         return prisma.user.update({
            where: { id: existingUser.id },
            data: { name },
            select: {
               id: true,
               name: true,
               email: true,
            },
         });
      }

      return existingUser;
   }

   return prisma.user.create({
      data: {
         email,
         name,
         password: await hash(randomUUID(), 12),
      },
      select: {
         id: true,
         name: true,
         email: true,
      },
   });
}
