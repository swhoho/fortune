import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * 오늘의 운세 페이지 메타데이터 (SEO)
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';
  const canonicalPath = locale === 'ko' ? '/daily-fortune' : `/${locale}/daily-fortune`;

  return {
    title: t('pages.dailyFortune.title'),
    description: t('pages.dailyFortune.description'),
    openGraph: {
      title: t('pages.dailyFortune.title'),
      description: t('pages.dailyFortune.description'),
      url: `${baseUrl}${canonicalPath}`,
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      title: t('pages.dailyFortune.title'),
      description: t('pages.dailyFortune.description'),
    },
  };
}

/**
 * 오늘의 운세 레이아웃
 */
export default async function DailyFortuneLayout({ children }: Props) {
  return <>{children}</>;
}
