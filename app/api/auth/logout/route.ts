import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  cookieStore.delete('dzota_session')
  
  // If it's a form submission or API call
  if (request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ success: true })
  }
  
  // Normal form redirect
  return NextResponse.redirect(new URL('/login', request.url), 303)
}
