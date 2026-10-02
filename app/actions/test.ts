'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getSubjectForTestCreation(subjectId: string) {
  return prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      chapters: {
        include: {
          questions: {
            include: {
              _count: { select: { questions: true } },
              questions: { select: { id: true } } // needed for random selection
            }
          }
        }
      }
    }
  })
}

export async function createTest(data: any) {
  const { title, subjectId, timeLimit, mode, password, chapterSettings } = data
  
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      chapters: {
        include: {
          questions: {
            include: { questions: { select: { id: true } } }
          }
        }
      }
    }
  })
  
  if (!subject) throw new Error("Subject not found")
  
  const selectedQuestionIds: string[] = []
  
  for (const [chapId, count] of Object.entries(chapterSettings)) {
    const numToPick = count as number
    if (numToPick <= 0) continue
    
    const chapter = subject.chapters.find(c => c.id === chapId)
    if (!chapter) continue
    
    // Pick `numToPick` random question groups from this chapter
    const groups = [...chapter.questions].filter(g => g.questions.length > 0)
    
    // Shuffle groups
    groups.sort(() => 0.5 - Math.random())
    const selectedGroups = groups.slice(0, numToPick)
    
    selectedGroups.forEach(g => {
      // Pick a random variant from the group
      const variantIdx = Math.floor(Math.random() * g.questions.length)
      selectedQuestionIds.push(g.questions[variantIdx].id)
    })
  }

  // Shuffle final list
  selectedQuestionIds.sort(() => 0.5 - Math.random())

  const test = await prisma.test.create({
    data: {
      title,
      timeLimit: parseInt(timeLimit),
      mode,
      password: password || null,
      questions: {
        create: selectedQuestionIds.map((qId, idx) => ({
          questionId: qId,
          order: idx
        }))
      }
    }
  })
  
  revalidatePath('/tests')
  return test.id
}
