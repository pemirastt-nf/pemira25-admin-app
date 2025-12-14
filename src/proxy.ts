import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
     const token = request.cookies.get('admin_token');
     const path = request.nextUrl.pathname;

     // Public paths
     if (path.startsWith('/login') || path.startsWith('/_next') || path === '/favicon.ico') {
          if (token && path.startsWith('/login')) {
               return NextResponse.redirect(new URL('/', request.url));
          }
          return NextResponse.next();
     }

     // Protected paths
     if (!token) {
          return NextResponse.redirect(new URL('/login', request.url));
     }

     return NextResponse.next();
}

export const config = {
     matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
