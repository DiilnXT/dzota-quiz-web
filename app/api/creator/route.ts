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
    const html = fs.readFileSync(path.join(process.cwd(), 'public/index.html'), 'utf8')
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (error) {
    return new NextResponse('Error loading creator', { status: 500 })
  }
}
