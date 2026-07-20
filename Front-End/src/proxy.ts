import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============================================================
// proxy.ts — Route protection (replaces deprecated middleware.ts)
// Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
// ============================================================

const COOKIE_NAME = 'mtm_session'

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/login']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  )

  // Unauthenticated user trying to access a protected route → redirect to login
  if (!isPublicRoute && !sessionCookie) {
    const loginUrl = new URL('/qpr/login', request.url)
    // Preserve the original destination so we can redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user visiting /login → redirect to dashboard
  if (isPublicRoute && sessionCookie) {
    return NextResponse.redirect(new URL('/qpr', request.url))
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
