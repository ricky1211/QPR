import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============================================================
// proxy.ts — Route protection (replaces deprecated middleware.ts)
// Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
// ============================================================

import * as fs from 'fs'
import * as path from 'path'

const COOKIE_NAME = 'mtm_session'

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value

  try {
    const logMsg = `[${new Date().toISOString()}] PATHNAME: ${pathname} | URL: ${request.url} | COOKIE: ${sessionCookie}\n`
    fs.appendFileSync('c:\\Users\\Rickyy\\Documents\\MTM\\QPR\\QPR\\Front-End\\proxy_debug.log', logMsg)
  } catch (e) {
    // Ignore logging errors
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  )

  // Unauthenticated user trying to access a protected route → redirect to login
  if (!isPublicRoute && !sessionCookie) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    // Preserve the original destination so we can redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user visiting /login → redirect to dashboard
  if (isPublicRoute && sessionCookie) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Run proxy on all paths EXCEPT:
     * - _next/static  (Next.js static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico, public assets (*.svg, *.png, *.jpg, *.jpeg, *.webp, *.ico)
     * - /api routes   (handled server-side)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$|api).*)',
  ],
}
