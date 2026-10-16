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
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    let sessionData = null
    if (sessionStr) {
      try {
        sessionData = JSON.parse(sessionStr)
      } catch (e) {}
    }

    if (id) {
      let html = fs.readFileSync(path.join(process.cwd(), 'public/index.html'), 'utf8')
      if (sessionData) {
        const injectionScript = `<script>window.__DZOTA_SESSION__ = ${JSON.stringify(sessionData)};</script>`
        if (html.includes('</head>')) {
          html = html.replace('</head>', `${injectionScript}</head>`)
        } else {
          html = injectionScript + html
        }
      }
      const quiz = await prisma.quickQuiz.findUnique({ where: { id } })
      if (quiz) {
        // Replace OG tags in HTML safely
        html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${quiz.title}"`)
        html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="Nhấn để bắt đầu làm bài thi: ${quiz.title}"`)
        html = html.replace(/<title>.*?<\/title>/, `<title>${quiz.title}</title>`)
      }
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    } else {
      let landingHtml = fs.readFileSync(path.join(process.cwd(), 'public/landing.html'), 'utf8')
      if (sessionData) {
        const injectionScript = `<script>window.__DZOTA_SESSION__ = ${JSON.stringify(sessionData)};</script>`
        if (landingHtml.includes('</head>')) {
          landingHtml = landingHtml.replace('</head>', `${injectionScript}</head>`)
        } else {
          landingHtml = injectionScript + landingHtml
        }
      }
      return new NextResponse(landingHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
