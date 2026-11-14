import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 로그인이 필요한 경로. 참여(/w)·선물(/g) 페이지는 로그인 없이 열린다. */
const PROTECTED = ["/new", "/me", "/boards"];

export async function middleware(request: NextRequest) {
  // OAuth 로그인 뒤 Supabase 가 허용 목록에 없는 주소 대신 Site URL(메인 등)로 code 를 붙여 보내는 경우가 있다.
  // 어느 페이지로 돌아오든 code 가 있으면 콜백으로 넘겨 로그인을 마무리한다.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    const back = request.nextUrl.pathname === "/" ? "/new" : request.nextUrl.pathname;
    url.pathname = "/auth/callback";
    url.search = `?code=${encodeURIComponent(code)}&next=${encodeURIComponent(back)}`;
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // 키 연결 전에도 화면 개발을 할 수 있게, 설정이 없으면 인증 처리를 건너뛴다.
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // 세션 갱신. getUser() 는 토큰을 Supabase 에 검증받으므로 보호 경로 판단에 쓸 수 있다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const needsLogin = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (needsLogin && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/og|.*opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
