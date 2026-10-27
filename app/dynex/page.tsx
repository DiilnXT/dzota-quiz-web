import React from 'react';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import DynexAppClient from './DynexAppClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'DYNEX - Hệ Thống Giải Phẫu & Thi Chạy Trạm Y Khoa AI | Dzota Quiz',
  description: 'Nền tảng học giải phẫu tương tác, Flashcard Anki SM-2 và thi chạy trạm 20 trạm OSCE y khoa bản quyền Nhật Duy',
};

export default async function DynexPage() {
  const cookieStore = await cookies();
  const sessionStr = cookieStore.get('dzota_session')?.value;

  let currentUser: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  } | null = null;

  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (session) {
        currentUser = {
          id: session.id,
          email: session.email,
          name: session.name,
          role: session.role,
        };

        // Try getting latest info from db if available
        try {
          const dbUser = await prisma.user.findFirst({
            where: {
              OR: [
                ...(session.id ? [{ id: session.id }] : []),
                ...(session.email ? [{ email: session.email }] : []),
                ...(session.username ? [{ username: session.username }] : []),
              ],
            },
            select: { id: true, email: true, name: true, role: true },
          });

          if (dbUser) {
            currentUser = {
              id: dbUser.id,
              email: dbUser.email || session.email,
              name: dbUser.name || session.name,
              role: dbUser.role || session.role,
            };
          }
        } catch {
          // Fallback to session
        }
      }
    } catch {
      // Ignore session parse error
    }
  }

  return <DynexAppClient initialUser={currentUser} />;
}
