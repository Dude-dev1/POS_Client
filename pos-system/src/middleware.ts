import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. If user is NOT authenticated and trying to access a protected route
  if (!user && !request.nextUrl.pathname.startsWith('/login') && request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. If user IS authenticated
  if (user) {
    // If trying to access /login or /, redirect to dashboard (or POS based on role later)
    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/') {
       // We'll fetch the role from the profile
       const { data: profile } = await supabase
         .from('profiles')
         .select('role')
         .eq('id', user.id)
         .single()

       const role = profile?.role

       if (role === 'CASHIER') {
         return NextResponse.redirect(new URL('/pos', request.url))
       }
       return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Role-based access control
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (role === 'CASHIER') {
      const restrictedPaths = ['/dashboard', '/users', '/reports', '/audit-logs', '/settings']
      if (restrictedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
        return NextResponse.redirect(new URL('/pos', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
