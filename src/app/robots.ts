import type { MetadataRoute } from 'next';

/**
 * robots.txt 생성
 * 검색 엔진 크롤링 규칙 정의
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/', // API 라우트 제외
          '/auth/', // 인증 페이지 제외
          '/mypage/', // 마이페이지 제외
          '/payment/', // 결제 페이지 제외
          '/analysis/processing/', // 처리 중 페이지 제외
          '/analysis/result/', // 분석 결과 페이지 제외 (개인 정보)
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
