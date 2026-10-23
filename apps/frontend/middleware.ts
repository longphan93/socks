import { NextResponse, type NextRequest } from 'next/server';

const TOKEN_COOKIE = 'socks_admin_token';
const LOGIN_PATH = '/admin/login';

/**
 * Chặn `/admin/*` khi chưa đăng nhập.
 *
 * Chỉ kiểm cookie có tồn tại hay không, không kiểm chữ ký — backend mới là nơi
 * xác thực thật. Việc của middleware là đừng để người chưa đăng nhập thấy
 * khung trang rồi mới bị đá ra.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);

  if (pathname === LOGIN_PATH) {
    if (!hasToken) return NextResponse.next();

    return NextResponse.redirect(new URL('/admin', request.url));
  }

  if (hasToken) return NextResponse.next();

  const login = new URL(LOGIN_PATH, request.url);
  login.searchParams.set('next', pathname);

  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/admin/:path*'],
};
