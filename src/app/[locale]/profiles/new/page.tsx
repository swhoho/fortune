import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { NewProfilePageClient } from '@/components/profile/NewProfilePageClient';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';

type Props = {
  params: Promise<{ locale: string }>;
};

/**
 * 프로필 생성 페이지 메타데이터 (SEO)
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';
  const canonicalPath = locale === 'ko' ? '/profiles/new' : `/${locale}/profiles/new`;

  return {
    title: t('pages.profileNew.title'),
    description: t('pages.profileNew.description'),
    openGraph: {
      title: t('pages.profileNew.title'),
      description: t('pages.profileNew.description'),
      url: `${baseUrl}${canonicalPath}`,
      images: [{ url: `${baseUrl}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      title: t('pages.profileNew.title'),
      description: t('pages.profileNew.description'),
    },
  };
}

/**
 * 프로필 등록 페이지
 * Task 3.1: /[locale]/profiles/new/page.tsx
 */
export default async function NewProfilePage({ params }: Props) {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';
  const localePath = locale === 'ko' ? '' : `/${locale}`;

  const breadcrumbItems = [
    { name: 'Home', url: `${baseUrl}${localePath}` },
    { name: 'Profiles', url: `${baseUrl}${localePath}/profiles` },
    { name: 'New Profile', url: `${baseUrl}${localePath}/profiles/new` },
  ];

  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <NewProfilePageClient />
    </>
  );
}
