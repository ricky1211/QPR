'use server'

import { cookies } from 'next/headers'

// ============================================================
// Simple stateless session using a signed cookie.
// No external JWT library required — we use a lightweight
// HMAC-SHA256 approach with the Web Crypto API (Edge-safe).
// ============================================================

const SECRET = process.env.SESSION_SECRET ?? 'mtm-qpr-secret-2026-dev-only'
const COOKIE_NAME = 'mtm_session'
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000 // 8 hours

// ---- Crypto helpers ----------------------------------------

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(data: string): Promise<string> {
  const key = await getKey()
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Buffer.from(sig).toString('base64url')
}

async function verify(data: string, signature: string): Promise<boolean> {
  const key = await getKey()
  const enc = new TextEncoder()
  const sigBuf = Buffer.from(signature, 'base64url')
  return crypto.subtle.verify('HMAC', key, sigBuf, enc.encode(data))
}

// ---- Session payload ----------------------------------------

export interface SessionPayload {
  userId: string        // login ID / NPK
  username: string      // role key used for RBAC (e.g. 'admin', 'foreman')
  role: string          // same as username — kept separate for clarity
  displayName: string   // human-readable name shown in the UI
  expiresAt: number     // epoch ms
}

async function encodeSession(payload: SessionPayload): Promise<string> {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = await sign(data)
  return `${data}.${sig}`
}

async function decodeSession(token: string): Promise<SessionPayload | null> {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const valid = await verify(data, sig)
    if (!valid) return null
    const payload: SessionPayload = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf-8'),
    )
    if (payload.expiresAt < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

// ---- Public API --------------------------------------------

export async function createSession(
  role: string,
  loginId: string,
  displayName: string = role,
): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS
  const payload: SessionPayload = {
    userId: loginId,
    username: role,      // username field carries the role for backward compat
    role,
    displayName,
    expiresAt,
  }
  const token = await encodeSession(payload)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    expires: new Date(expiresAt),
    sameSite: 'lax',
    path: '/',
  })

  // Client-readable cookie: stores the ROLE so client RBAC works
  cookieStore.set('mtm_user', role, {
    httpOnly: false,
    secure: false,
    expires: new Date(expiresAt),
    sameSite: 'lax',
    path: '/',
  })

  // Client-readable cookie: stores display name for the topbar
  cookieStore.set('mtm_display_name', displayName, {
    httpOnly: false,
    secure: false,
    expires: new Date(expiresAt),
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return decodeSession(token)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  cookieStore.delete('mtm_user')
  cookieStore.delete('mtm_display_name')
}
