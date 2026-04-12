import { compare } from 'bcryptjs';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/config/prisma';
import { ensureUserByEmail } from '@/lib/services/auth/user-account';

export const authOptions: NextAuthOptions = {
   session: {
      strategy: 'jwt',
   },
   providers: [
      GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
      CredentialsProvider({
         name: 'Credentials',
         credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
         },
         async authorize(credentials) {
            const identifier = credentials?.email?.trim();
            const password = credentials?.password || '';

            if (!identifier || !password) {
               return null;
            }

            const user = await prisma.user.findFirst({
               where: {
                  OR: [
                     { email: identifier.toLowerCase() },
                     { name: identifier },
                  ],
               },
            });

            if (!user?.password) {
               return null;
            }

            const isValid = await compare(password, user.password);
            if (!isValid) {
               return null;
            }

            return {
               id: user.id,
               name: user.name,
               email: user.email,
            };
         },
      }),
   ],
   callbacks: {
      async signIn({ user }) {
         if (!user.email) {
            return false;
         }

         await ensureUserByEmail({
            email: user.email,
            name: user.name,
         });

         return true;
      },
      async jwt({ token, user }) {
         const email = (user?.email || token.email || '').toLowerCase();
         if (!email) {
            return token;
         }

         // Avoid hitting the database on every request after token is fully hydrated.
         if (!user && token.sub && token.name && token.email) {
            return token;
         }

         const dbUser = await ensureUserByEmail({
            email,
            name: user?.name,
         });

         if (dbUser) {
            token.sub = dbUser.id;
            token.name = dbUser.name;
            token.email = dbUser.email;
         }

         return token;
      },
      async session({ session, token }) {
         if (session.user) {
            session.user.name = token.name || session.user.name;
            session.user.email = token.email || session.user.email;
            (session.user as { id?: string }).id = token.sub;
         }

         return session;
      },
   },
   secret: process.env.NEXTAUTH_SECRET,
};
