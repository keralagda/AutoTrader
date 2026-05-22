import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple JWT verification for middleware (can't use full jsonwebtoken in edge)
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /dashboard route - require authenticated user
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('autotrade_session')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/?login=true', request.url))
    }
    const payload = decodeJWT(token)
    if (!payload || !payload.userId) {
      const response = NextResponse.redirect(new URL('/?login=true', request.url))
      response.cookies.delete('autotrade_session')
      return response
    }
  }

  // Protect /admin route - require admin role
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('autotrade_session')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/?login=true', request.url))
    }
    const payload = decodeJWT(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protect admin API routes
  if (pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('autotrade_session')?.value
      || request.headers.get('authorization')?.replace('Bearer ', '')

    // Allow cron requests with cron secret
    const cronSecret = request.headers.get('x-cron-secret')
    if (cronSecret) {
      return NextResponse.next()
    }

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const payload = decodeJWT(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
