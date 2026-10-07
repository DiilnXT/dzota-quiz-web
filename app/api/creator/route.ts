import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  
  if (!sessionStr) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  try {
    let html = fs.readFileSync(path.join(process.cwd(), 'public/index.html'), 'utf8')
    let sessionData = {}
    try {
      sessionData = JSON.parse(sessionStr)
    } catch (e) {}

    // Inject session info into window.__DZOTA_SESSION__ so client knows who is logged in
    const injectionScript = `<script>window.__DZOTA_SESSION__ = ${JSON.stringify(sessionData)};</script>`
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${injectionScript}</head>`)
    } else {
      html = injectionScript + html
    }

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    return new NextResponse('Error loading creator', { status: 500 })
  }
}
