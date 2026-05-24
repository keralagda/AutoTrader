import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { db } from './db'

const JWT_SECRET = process.env.JWT_SECRET || process.env.CRON_SECRET || 'bnfx-jwt-secret-change-me'
const SESSION_COOKIE = 'bnfx_session'
const SESSION_EXPIRY = '7d' // 7 days

// ─── Password Hashing ──────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Support legacy plain-text and SHA-256 passwords during migration
  if (hash.length === 64 && /^[a-f0-9]+$/.test(hash)) {
    // Legacy SHA-256 hash - compare directly
    const crypto = await import('crypto')
    const sha256 = crypto.createHash('sha256').update(password).digest('hex')
    if (sha256 === hash) return true
  }
  // Plain text comparison (for seeded admin password)
  if (password === hash) return true
  // bcrypt comparison
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

// ─── JWT Token Management ──────────────────────────────────────────

export interface SessionPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export function createToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_EXPIRY })
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload
  } catch {
    return null
  }
}

// ─── Cookie-based Session ──────────────────────────────────────────

export async function setSessionCookie(payload: Omit<SessionPayload, 'iat' | 'exp'>) {
  const token = createToken(payload)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  })
  return token
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

// ─── Auth Middleware Helpers ────────────────────────────────────────

export async function requireAuth(request: NextRequest): Promise<SessionPayload | NextResponse> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
    || request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const session = verifyToken(token)
  if (!session) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
  }

  return session
}

export async function requireAdmin(request: NextRequest): Promise<SessionPayload | NextResponse> {
  const result = await requireAuth(request)
  if (result instanceof NextResponse) return result

  if (result.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  return result
}

// ─── Get current user from request ─────────────────────────────────

export async function getCurrentUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
    || request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) return null

  const session = verifyToken(token)
  if (!session) return null

  const user = await db.user.findUnique({ where: { id: session.userId } })
  return user
}
