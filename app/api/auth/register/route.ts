import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';

function isEmailValid(email: string) {
   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
   try {
      const body = (await req.json()) as {
         name?: string;
         email?: string;
         password?: string;
      };

      const name = body.name?.trim() || '';
      const email = body.email?.trim().toLowerCase() || '';
      const password = body.password || '';

      if (!name || !email || !password) {
         return NextResponse.json(
            { message: 'Name, email, and password are required.' },
            { status: 400 },
         );
      }

      if (!isEmailValid(email)) {
         return NextResponse.json(
            { message: 'Invalid email format.' },
            { status: 400 },
         );
      }

      if (password.length < 8) {
         return NextResponse.json(
            { message: 'Password must be at least 8 characters.' },
            { status: 400 },
         );
      }

      const existing = await prisma.user.findUnique({
         where: { email },
         select: { id: true },
      });

      if (existing) {
         return NextResponse.json(
            { message: 'Email is already registered.' },
            { status: 409 },
         );
      }

      const hashedPassword = await hash(password, 12);

      await prisma.user.create({
         data: {
            name,
            email,
            password: hashedPassword,
         },
      });

      return NextResponse.json(
         { message: 'Account created successfully.' },
         { status: 201 },
      );
   } catch {
      return NextResponse.json(
         { message: 'Registration failed.' },
         { status: 500 },
      );
   }
}
