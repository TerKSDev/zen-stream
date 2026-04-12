import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
declare global {
   var __zenstreamPrisma__: PrismaClient | undefined;
}

const prisma = globalThis.__zenstreamPrisma__ || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
   globalThis.__zenstreamPrisma__ = prisma;
}

export { prisma };
