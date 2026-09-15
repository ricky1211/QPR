import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ============================================================
// proxy.ts — Route protection (replaces deprecated middleware.ts)
// Docs: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
// ============================================================

const COOKIE_NAME = 'mtm_session'

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/login', '/login/']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Bypass API routes so proxy / rewrites to backend are never intercepted or redirected to /login
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/qpr/api') ||
    pathname.includes('/api/')
  ) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  )

  // Unauthenticated user trying to access a protected route → redirect to login
  if (!isPublicRoute && !sessionCookie) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login/'
    // Preserve the original destination so we can redirect back after login
    if (pathname !== '/' && pathname !== '') {
      loginUrl.searchParams.set('callbackUrl', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user visiting /login → redirect to dashboard
  if (isPublicRoute && sessionCookie) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard/'
    return NextResponse.redirect(dashboardUrl)
  }

  // Authenticated user visiting root / → redirect to dashboard
  if ((pathname === '/' || pathname === '') && sessionCookie) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard/'
    return NextResponse.redirect(dashboardUrl)
  }

  // Role-based protection (RBAC)
  const mtmUser = request.cookies.get('mtm_user')?.value || ''

  const isMatch = (routes: string[]) =>
    routes.some((route) => pathname === route || pathname.startsWith(route + '/') || pathname.startsWith(route))

  const redirectToDashboard = () => {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard/'
    return NextResponse.redirect(dashboardUrl)
  }

  // Admin has access to all routes; apply strict RBAC for non-admin users:
  if (mtmUser !== 'admin') {
    // 1. Master Data: Admin only
    if (isMatch(['/parts', '/vendors', '/users'])) {
      return redirectToDashboard()
    }

    // 2. NCR Routes: Admin only (currently inactive)
    if (isMatch(['/buat-ncr', '/approve-ncr', '/draft-ncr'])) {
      return redirectToDashboard()
    }

    // 3. Buat QPR & Draft QPR: Foreman only
    if (isMatch(['/buat-qpr', '/draft-qpr'])) {
      if (mtmUser !== 'foreman') {
        return redirectToDashboard()
      }
    }

    // 4. Approval QPR: Section/Dept Head, Division Head, Purchasing (Acknowledge), Purchasing QPR (1175)
    if (isMatch(['/approve-qpr'])) {
      if (!['sect_dept_head', 'div_head', 'purchasing', 'purchasing_qpr'].includes(mtmUser)) {
        return redirectToDashboard()
      }
    }

    // 5. Buat Confirmation Letter (CL) & Draft CL: Purchasing only
    if (isMatch(['/confirmation-letter', '/draft-cl'])) {
      if (mtmUser !== 'purchasing') {
        return redirectToDashboard()
      }
    }

    // 6. Approval Confirmation Letter (CL): Accounting, Purchasing (Ack), Finance (Ack)
    if (isMatch(['/approve-cl'])) {
      if (!['accounting', 'purchasing', 'finance'].includes(mtmUser)) {
        return redirectToDashboard()
      }
    }

    // 7. SSC Billing & Payments (I-Memo): Finance & Purchasing
    if (isMatch(['/i-memo'])) {
      if (!['finance', 'purchasing'].includes(mtmUser)) {
        return redirectToDashboard()
      }
    }
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
     * - /api routes   (handled server-side / rewrites)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$|api|qpr/api).*)',
  ],
}
