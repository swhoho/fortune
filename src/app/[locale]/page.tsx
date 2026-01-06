import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LandingPageClient } from '@/components/landing/LandingPageClient';
import {
  FAQJsonLd,
  ServiceJsonLd,
  HowToJsonLd,
  SpeakableJsonLd,
} from '@/components/seo/JsonLd';

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * 랜딩 페이지 메타데이터 (SEO)
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';

  return {
    title: t('pages.landing.title'),
    description: t('pages.landing.description'),
    openGraph: {
      title: t('pages.landing.title'),
      description: t('pages.landing.description'),
      url: baseUrl,
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      title: t('pages.landing.title'),
      description: t('pages.landing.description'),
    },
  };
}

/**
 * 랜딩 페이지 - Master's Insight AI
 * 30년 명리학 거장이 인정한 AI 사주 분석 서비스
 */
export default async function LandingPage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      {/* AEO 최적화 구조화 데이터 */}
      <FAQJsonLd locale={locale} />
      <ServiceJsonLd locale={locale} />
      <HowToJsonLd locale={locale} />
      <SpeakableJsonLd locale={locale} />

      <LandingPageClient />
    </>
  );
}
