import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';

/**
 * 사이트맵 생성
 * 다국어 alternate 링크 포함 (hreflang)
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';

  // 공개 페이지 목록 (SEO 대상)
  const publicRoutes = [
    '', // 홈
    '/home', // 메인 홈
    '/analysis/focus', // 분석 영역 선택
    '/analysis/question', // 분석 질문 입력
  ];

  /**
   * 다국어 alternate 링크 생성
   * hreflang 태그를 위한 언어별 URL 매핑
   */
  const getAlternateLanguages = (path: string): Record<string, string> => {
    const languages: Record<string, string> = {};

    locales.forEach((locale) => {
      // ko는 기본 언어이므로 prefix 없음 (localePrefix: 'as-needed')
      const localePath = locale === 'ko' ? path : `/${locale}${path}`;
      languages[locale] = `${baseUrl}${localePath || '/'}`;
    });

    // x-default는 기본 언어(ko)로 설정
    languages['x-default'] = `${baseUrl}${path || '/'}`;

    return languages;
  };

  // 사이트맵 항목 생성
  const sitemapEntries: MetadataRoute.Sitemap = [];

  publicRoutes.forEach((route) => {
    // 각 로케일별로 항목 생성
    locales.forEach((locale) => {
      const localePath = locale === 'ko' ? route : `/${locale}${route}`;

      sitemapEntries.push({
        url: `${baseUrl}${localePath || '/'}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1.0 : 0.8,
        alternates: {
          languages: getAlternateLanguages(route),
        },
      });
    });
  });

  return sitemapEntries;
}
