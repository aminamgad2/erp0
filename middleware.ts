import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if the route requires authentication
  const protectedPaths = ['/dashboard', '/admin'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  try {
    // Get session cookie from request
    const sessionCookie = request.cookies.get('erp_session');
    
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // For admin routes, we'll do a more detailed check in the page component
    // since we can't easily decrypt the session in middleware without additional setup
    if (request.nextUrl.pathname.startsWith('/admin')) {
      // Let the page component handle the detailed role check
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
  ],
};