'use server'

import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/app/lib/session'

// ============================================================
// Credential store — maps login ID → { password, role, displayName }
// Role values used across RBAC: admin | foreman | sect_dept_head |
//   div_head | purchasing | accounting | finance
// ============================================================
const VALID_USERS: Record<string, { password: string; role: string; displayName: string }> = {
  // Admin: full access including Master Data
  admin: { password: 'admin123', role: 'admin', displayName: 'Administrator' },
  // Section Head & Dept Head QPR (shared account)
  '2301': { password: '2301', role: 'sect_dept_head', displayName: 'Septian Nugraha' },
  // Foreman / Prepare QPR (Creator QPR)
  '3079': { password: '3079', role: 'foreman', displayName: 'Deny Maulana' },
  '0890': { password: '0890', role: 'foreman', displayName: 'Hendrik F.' },
  '890': { password: '890', role: 'foreman', displayName: 'Hendrik F.' },
  // Division Head QPR
  '1335': { password: '1335', role: 'div_head', displayName: 'Putu Ratna Saputra' },
  // Purchasing (Full Access: Buat CL, Approval CL, Approve QPR, etc.)
  '3790': { password: '3790', role: 'purchasing', displayName: 'Cicik Andria' },
  // Purchasing Approval QPR Only (Hanya Approval Purchasing di Approval QPR)
  '1175': { password: '1175', role: 'purchasing_qpr', displayName: 'Irvan H. N.' },
  // Dept Accounting
  '3123': { password: '3123', role: 'accounting', displayName: 'Anindita Irnilaningtyas' },
  // Finance
  '3616': { password: '3616', role: 'finance', displayName: 'Bagas Nur Pratama' },
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
    return { error: 'ID / NPK dan password wajib diisi.' }
  }

  // Credential check
  const userEntry = VALID_USERS[username]
  if (!userEntry || userEntry.password !== password) {
    return { error: 'ID / NPK atau password salah. Silakan coba lagi.' }
  }

  // Create session cookie — stores role in the cookie so RBAC works client-side
  await createSession(userEntry.role, username, userEntry.displayName)

  // Redirect to main dashboard
  redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
  await deleteSession()
  redirect('/login')
}
