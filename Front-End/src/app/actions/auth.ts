'use server'

import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/app/lib/session'

// ============================================================
// Credential store — in production replace with a real DB/API.
// ============================================================
const VALID_USERS: Record<string, string> = {
  admin: 'password123',
  operator: 'password123',
  sectionhead: 'password123',
  depthead: 'password123',
  divhead: 'password123',
  purchasing: 'password123',
  accounting: 'password123',
}

export interface LoginState {
  error: string | null
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = (formData.get('username') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  // Basic validation
  if (!username || !password) {
    return { error: 'Username dan password wajib diisi.' }
  }

  // Credential check
  const expectedPassword = VALID_USERS[username.toLowerCase()]
  if (!expectedPassword || expectedPassword !== password) {
    return { error: 'Username atau password salah. Silakan coba lagi.' }
  }

  // Create session cookie
  await createSession(username)

  // Redirect to main dashboard — redirect() throws internally, so it must be
  // outside of a try/catch block.
  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  await deleteSession()
  redirect('/login')
}
