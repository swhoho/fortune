/**
 * NextAuth.js + next-intl 통합 미들웨어
 * - 언어 감지 및 라우팅
 * - 인증이 필요한 라우트 보호
 */
import { withAuth } from 'next-auth/middleware';
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing, locales } from './i18n/routing';

/**
 * 공개 페이지 목록 (인증 불필요)
 */
const publicPages = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/error',
  '/onboarding/step1',
  '/onboarding/step2',
  '/onboarding/step3',
];

/**
 * next-intl 미들웨어 생성
 */
const intlMiddleware = createMiddleware(routing);

/**
 * NextAuth 미들웨어 (인증 확인 후 i18n 라우팅 적용)
 */
const authMiddleware = withAuth(
  function onSuccess(req) {
    // 인증 성공 시 i18n 라우팅 적용
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token }) => token != null,
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

/**
 * 통합 미들웨어
 */
export default function middleware(req: NextRequest) {
  // 공개 페이지 정규식 생성 (로케일 prefix 고려)
  // 예: /en/onboarding/step1, /ja/auth/signin 등도 매칭
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join('|')}))?(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  );

  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

  if (isPublicPage) {
    // 공개 페이지: i18n 라우팅만 적용
    return intlMiddleware(req);
  } else {
    // 보호 페이지: 인증 확인 후 i18n 라우팅 적용
    return (authMiddleware as unknown as (req: NextRequest) => NextResponse)(req);
  }
}

/**
 * 미들웨어 적용 경로
 * - API 라우트, 정적 파일, Next.js 내부 파일 제외
 */
export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)', '/'],
};
