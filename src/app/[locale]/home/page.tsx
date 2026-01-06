import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HomePageClient } from '@/components/home/HomePageClient';

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * 홈 페이지 메타데이터 (SEO)
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';
  const canonicalPath = locale === 'ko' ? '/home' : `/${locale}/home`;

  return {
    title: t('pages.home.title'),
    description: t('pages.home.description'),
    openGraph: {
      title: t('pages.home.title'),
      description: t('pages.home.description'),
      url: `${baseUrl}${canonicalPath}`,
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      title: t('pages.home.title'),
      description: t('pages.home.description'),
    },
  };
}

/**
 * 홈 페이지 - 로그인 후 메인 화면
 * 프로필 관리, 분석, 마이페이지 등 주요 기능 진입점
 * 비로그인 시 로그인 페이지로 리다이렉트
 */
export default function HomePage() {
  return <HomePageClient />;
}
