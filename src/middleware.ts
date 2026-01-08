/**
 * Supabase + next-intl 통합 미들웨어
 * - Supabase 세션 리프레시
 * - 언어 감지 및 라우팅
 * - 보호된 경로 접근 제어
 */
import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { updateSession } from '@/lib/supabase/middleware';
import { routing, locales } from './i18n/routing';
import { createServerClient } from '@supabase/ssr';

/**
 * 공개 페이지 목록 (정적 경로)
 * /payment/success는 Stripe 결제 후 리다이렉트되므로 공개 처리
 */
const publicPages = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/payment/success',
];

/**
 * 공개 페이지 패턴 (동적 경로)
 * 리포트 페이지는 공유 링크로 접근 가능
 */
const publicDynamicPatterns = [
  /^\/profiles\/[^/]+\/report$/, // /profiles/{id}/report
];

/**
 * next-intl 미들웨어 생성
 */
const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // 1. Supabase 세션 리프레시 (쿠키 갱신)
  // updateSession은 내부적으로 res.cookies.set을 수행한 response를 반환합니다.
  const response = await updateSession(request);

  // 2. i18n 라우팅 대상인지 확인
  // (API, 정적 파일 등은 config.matcher에서 제외되지만, 여기서 한 번 더 체크 가능)

  // 공개 페이지 정규식 생성
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  );

  const isStaticPublicPage = publicPathnameRegex.test(request.nextUrl.pathname);

  // 동적 공개 페이지 체크 (로케일 제거 후 매칭)
  const pathWithoutLocale = request.nextUrl.pathname.replace(
    new RegExp(`^/(${locales.join('|')})`),
    ''
  );
  const isDynamicPublicPage = publicDynamicPatterns.some((pattern) =>
    pattern.test(pathWithoutLocale)
  );

  const isPublicPage = isStaticPublicPage || isDynamicPublicPage;

  // 3. 인증 상태 확인
  // updateSession에서 이미 getUser를 호출했겠지만, 여기서 명시적으로 확인하거나
  // response 객체에 담긴 쿠키를 통해 확인이 필요할 수 있음.
  // 여기서는 간단히 supabase client를 다시 생성해서 확인 (쿠키는 request에서 옴)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. 보호된 페이지 접근 제어
  if (!isPublicPage && !user) {
    // 로그인 페이지로 리다이렉트
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    // 원래 가려던 페이지를 callbackUrl로 전달할 수 있음
    return NextResponse.redirect(url);
  }

  // 5. i18n 미들웨어 실행
  // 주의: intlMiddleware는 새로운 response를 반환하므로,
  // Supabase가 설정한 쿠키(세션 갱신)를 잃어버릴 수 있음.
  // 따라서 intlMiddleware의 응답에 Supabase 쿠키를 복사해야 함.

  const intlResponse = intlMiddleware(request);

  // Supabase가 설정한 쿠키들을 intlResponse로 복사
  response.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|trpc|_next|static|.*\\..*).*)', '/'],
};
