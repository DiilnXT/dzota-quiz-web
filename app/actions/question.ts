'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createQuestionGroup(chapterId: string, name: string, skipRevalidate?: boolean) {
  const group = await prisma.questionGroup.create({
    data: { name, chapterId }
  })
  if (!skipRevalidate) revalidatePath(`/chapters/${chapterId}`)
  return group.id
}

export async function deleteQuestionGroup(id: string, chapterId: string) {
  await prisma.questionGroup.delete({
    where: { id }
  })
  revalidatePath(`/chapters/${chapterId}`)
}

export async function addQuestionVariant(groupId: string, data: { content: string, options: string, correctOption: string, explanation: string }, chapterId: string, skipRevalidate?: boolean) {
  const variant = await prisma.question.create({
    data: {
      groupId,
      content: data.content,
      options: data.options,
      correctOption: data.correctOption,
      explanation: data.explanation
    }
  })
  if (!skipRevalidate) revalidatePath(`/chapters/${chapterId}`)
  return variant.id
}

export async function deleteQuestionVariant(id: string, chapterId: string) {
  await prisma.question.delete({
    where: { id }
  })
  revalidatePath(`/chapters/${chapterId}`)
}
