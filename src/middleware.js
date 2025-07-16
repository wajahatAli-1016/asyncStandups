import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

// Configure paths that require authentication
const protectedPaths = ['/dashboard', '/adminDashboard'];

// Configure paths that should be accessible only to non-authenticated users
const authPaths = ['/', '/signup'];

// Configure paths that require admin role
const adminPaths = ['/adminDashboard'];

// Paths that should be ignored by the middleware
const ignoredPaths = ['/api', '_next', 'static', 'image', 'favicon.ico', 'public'];

export async function middleware(request) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname;

  // Ignore certain paths
  if (ignoredPaths.some(prefix => path.startsWith(`/${prefix}`))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if the path requires admin role
  if (adminPaths.some(prefix => path.startsWith(prefix))) {
    if (!token || token.role !== 'admin') {
      // Redirect non-admin users to regular dashboard
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Check if the path is protected
  if (protectedPaths.some(prefix => path.startsWith(prefix))) {
    if (!token) {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }
    
    // Redirect admin users trying to access regular dashboard to admin dashboard
    if (token.role === 'admin' && path.startsWith('/dashboard')) {
      const url = new URL('/adminDashboard', request.url);
      return NextResponse.redirect(url);
    }
    
    return NextResponse.next();
  }

  // Prevent authenticated users from accessing auth pages
  if (token && authPaths.includes(path)) {
    const url = new URL(token.role === 'admin' ? '/adminDashboard' : '/dashboard', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure the paths that this middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 