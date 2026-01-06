import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AnalysisFocusClient } from '@/components/analysis/AnalysisFocusClient';

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * 분석 영역 선택 페이지 메타데이터 (SEO)
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';
  const canonicalPath = locale === 'ko' ? '/analysis/focus' : `/${locale}/analysis/focus`;

  return {
    title: t('pages.analysisFocus.title'),
    description: t('pages.analysisFocus.description'),
    openGraph: {
      title: t('pages.analysisFocus.title'),
      description: t('pages.analysisFocus.description'),
      url: `${baseUrl}${canonicalPath}`,
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      title: t('pages.analysisFocus.title'),
      description: t('pages.analysisFocus.description'),
    },
  };
}

/**
 * 분석 영역 선택 페이지
 * PRD 섹션 5.4 참고
 */
export default function AnalysisFocusPage() {
  return <AnalysisFocusClient />;
}
