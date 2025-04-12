import { NextRequest, NextResponse } from 'next/server';
import { accessToken } from '@/constants';

export function middleware(request: NextRequest) {
  // Lấy token từ cookie
  const token = request.cookies.get(accessToken)?.value;

  // Lấy path hiện tại
  const { pathname } = request.nextUrl;

  // Kiểm tra xem pathname có phải là file tĩnh hay không
  const isStaticFile = /\.(jpg|jpeg|png|gif|svg|css|js)$/.test(pathname);

  // Bỏ qua middleware cho các file tĩnh
  if (isStaticFile) {
    return NextResponse.next();
  }

  // Không cần kiểm tra auth cho những route này
  const publicRoutes = [
    '/login',
    '/(auth)',
    '/_next',
    '/favicon.ico',
    '/api',
    '/avatars',
  ];

  // Kiểm tra xem route hiện tại có phải public route không
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // Nếu không phải public route và không có token, chuyển hướng về login
  if (!isPublicRoute && !token) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  // Nếu đã đăng nhập và đang ở trang login, chuyển hướng về trang chủ
  if ((pathname === '/login' || pathname.startsWith('/(auth)')) && token) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Chỉ áp dụng middleware cho những route cần thiết
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
