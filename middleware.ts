import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Admin routes - require ADMIN role
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/auth/login?error=unauthorized', req.url))
      }
    }

    // Dashboard routes - require authentication
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
    }

    // Therapist-specific routes
    if (pathname.startsWith('/dashboard/therapist') || pathname.startsWith('/onboarding/therapist')) {
      if (token?.role !== 'THERAPIST') {
        return NextResponse.redirect(new URL('/auth/login?error=unauthorized', req.url))
      }
    }

    // Client-specific routes  
    if (pathname.startsWith('/book') || pathname.startsWith('/payment')) {
      if (token?.role !== 'CLIENT') {
        return NextResponse.redirect(new URL('/auth/login?error=unauthorized', req.url))
      }
    }

    // Video call routes - require authentication and valid session
    if (pathname.startsWith('/video-call')) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      // Additional validation could be added here to check if user has active appointment
    }

    // API routes protection
    if (pathname.startsWith('/api')) {
      // Admin API routes
      if (pathname.startsWith('/api/admin')) {
        if (token?.role !== 'ADMIN') {
          return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
        }
      }

      // Therapist-specific API routes
      if (pathname.includes('/therapist/profile') || pathname.startsWith('/api/availability')) {
        if (token?.role !== 'THERAPIST') {
          return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
        }
      }

      // Protected API routes that require authentication
      const protectedApiRoutes = [
        '/api/appointments',
        '/api/sessions',
        '/api/payments',
        '/api/video-calls',
        '/api/commissions',
        '/api/payouts'
      ]

      if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
        if (!token) {
          return NextResponse.json({ error: 'ไม่พบการเข้าสู่ระบบ' }, { status: 401 })
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/auth/login',
          '/auth/register',
          '/auth/logout',
          '/therapists',
          '/api/auth',
          '/api/therapists'
        ]

        // Allow public routes
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // For all other routes, require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images|icons).*)',
  ],
}