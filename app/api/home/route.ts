import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    let html = fs.readFileSync(path.join(process.cwd(), 'public/index.html'), 'utf8')
    
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    let sessionData = null
    if (sessionStr) {
      try {
        sessionData = JSON.parse(sessionStr)
      } catch (e) {}
    }

    if (sessionData) {
      const injectionScript = `<script>window.__DZOTA_SESSION__ = ${JSON.stringify(sessionData)};</script>`
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${injectionScript}</head>`)
      } else {
        html = injectionScript + html
      }
    }

    if (id) {
      const quiz = await prisma.quickQuiz.findUnique({ where: { id } })
      if (quiz) {
        // Replace OG tags in HTML safely
        html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${quiz.title}"`)
        html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="Nhấn để bắt đầu làm bài thi: ${quiz.title}"`)
        html = html.replace(/<title>.*?<\/title>/, `<title>${quiz.title}</title>`)
      }
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
