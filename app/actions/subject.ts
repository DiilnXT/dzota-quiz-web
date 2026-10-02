'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getSubjects() {
  return prisma.subject.findMany({
    include: {
      chapters: {
        include: {
          questions: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createSubject(name: string) {
  await prisma.subject.create({
    data: { name }
  })
  revalidatePath('/subjects')
}

export async function deleteSubject(id: string) {
  await prisma.subject.delete({
    where: { id }
  })
  revalidatePath('/subjects')
}

export async function createChapter(subjectId: string, name: string) {
  await prisma.chapter.create({
    data: { name, subjectId }
  })
  revalidatePath(`/subjects/${subjectId}`)
}

export async function deleteChapter(id: string, subjectId: string) {
  await prisma.chapter.delete({
    where: { id }
  })
  revalidatePath(`/subjects/${subjectId}`)
}
