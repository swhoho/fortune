import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AnalysisQuestionClient } from '@/components/analysis/AnalysisQuestionClient';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * 분석 질문 입력 페이지 메타데이터 (SEO)
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';
  const canonicalPath = locale === 'ko' ? '/analysis/question' : `/${locale}/analysis/question`;

  return {
    title: t('pages.analysisQuestion.title'),
    description: t('pages.analysisQuestion.description'),
    openGraph: {
      title: t('pages.analysisQuestion.title'),
      description: t('pages.analysisQuestion.description'),
      url: `${baseUrl}${canonicalPath}`,
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      title: t('pages.analysisQuestion.title'),
      description: t('pages.analysisQuestion.description'),
    },
  };
}

/**
 * 고민 입력 페이지
 * PRD 섹션 5.5 참고
 */
export default async function AnalysisQuestionPage({ params }: Props) {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';
  const localePath = locale === 'ko' ? '' : `/${locale}`;

  const breadcrumbItems = [
    { name: 'Home', url: `${baseUrl}${localePath}` },
    { name: 'Analysis', url: `${baseUrl}${localePath}/analysis/focus` },
    { name: 'Question', url: `${baseUrl}${localePath}/analysis/question` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <AnalysisQuestionClient />
    </>
  );
}
