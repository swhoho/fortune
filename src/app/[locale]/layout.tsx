import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import localFont from 'next/font/local';
import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { routing, locales } from '@/i18n/routing';
import { Providers } from '@/lib/providers';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd';

/**
 * 기본 폰트 (Geist)
 */
const geistSans = localFont({
  src: '../fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: '../fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

/**
 * 정적 파라미터 생성 (빌드 최적화)
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * 동적 메타데이터 (SEO 최적화)
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';

  // 언어별 타이틀
  const titles: Record<string, string> = {
    ko: "Master's Insight AI | 30년 명리학 거장이 인정한 AI 사주 분석",
    en: "Master's Insight AI | AI Four Pillars of Destiny Analysis",
    ja: "Master's Insight AI | AI四柱推命分析",
    'zh-CN': "Master's Insight AI | AI四柱八字分析",
    'zh-TW': "Master's Insight AI | AI四柱八字分析",
  };

  // 언어별 설명
  const descriptions: Record<string, string> = {
    ko: '동양 명리학의 지혜와 최신 AI 기술이 만나 당신의 사주를 분석합니다. 자평진전, 궁통보감 기반의 정확한 분석.',
    en: 'Eastern fortune-telling wisdom meets cutting-edge AI to analyze your destiny. Based on classical texts like Ziping Zhenjuan.',
    ja: '東洋の命理学の知恵と最新のAI技術があなたの運命を分析します。子平真詮、窮通宝鑑に基づく正確な分析。',
    'zh-CN': '东方命理学的智慧与最新AI技术相结合，分析您的命运。基于子平真诠、穷通宝鉴的精准分析。',
    'zh-TW': '東方命理學的智慧與最新AI技術相結合，分析您的命運。基於子平真詮、窮通寶鑑的精準分析。',
  };

  // OpenGraph 로케일 매핑
  const ogLocales: Record<string, string> = {
    ko: 'ko_KR',
    en: 'en_US',
    ja: 'ja_JP',
    'zh-CN': 'zh_CN',
    'zh-TW': 'zh_TW',
  };

  // Canonical URL (로케일별)
  const canonicalPath = locale === 'ko' ? '' : `/${locale}`;
  const canonicalUrl = `${baseUrl}${canonicalPath}`;

  // Alternate languages for hreflang
  const alternateLanguages: Record<string, string> = {};
  locales.forEach((loc) => {
    const path = loc === 'ko' ? '' : `/${loc}`;
    alternateLanguages[loc] = `${baseUrl}${path}`;
  });

  const defaultTitle = "Master's Insight AI | 30년 명리학 거장이 인정한 AI 사주 분석";
  const defaultDescription =
    '동양 명리학의 지혜와 최신 AI 기술이 만나 당신의 사주를 분석합니다. 자평진전, 궁통보감 기반의 정확한 분석.';

  const title = titles[locale] ?? defaultTitle;
  const description = descriptions[locale] ?? defaultDescription;

  return {
    // 기본 메타
    title: {
      default: title,
      template: `%s | Master's Insight AI`,
    },
    description,
    keywords: [
      '사주',
      '명리학',
      'AI 사주',
      '운세',
      '사주팔자',
      'Four Pillars',
      'BaZi',
      '四柱推命',
      '八字',
      '자평진전',
      '궁통보감',
      'AI fortune telling',
    ],

    // 저자 및 생성자
    authors: [{ name: "Master's Insight AI" }],
    creator: "Master's Insight AI",
    publisher: "Master's Insight AI",

    // Canonical & Alternates (hreflang)
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },

    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Open Graph
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Master's Insight AI",
      type: 'website',
      locale: ogLocales[locale] ?? 'ko_KR',
      alternateLocale: Object.values(ogLocales).filter((l) => l !== ogLocales[locale]),
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.png`],
    },

    // 기타
    category: 'fortune-telling',
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * 로케일 레이아웃
 * - 언어별 html lang 속성 설정
 * - NextIntlClientProvider로 번역 메시지 전달
 * - JSON-LD 구조화 데이터 삽입
 */
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // 유효한 로케일 검증
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // 정적 렌더링 활성화
  setRequestLocale(locale);

  // 메시지 로드
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark overflow-x-hidden">
      <body className={`${geistSans.variable} ${geistMono.variable} overflow-x-hidden antialiased`}>
        {/* 전역 구조화 데이터 (SEO/AEO) */}
        <OrganizationJsonLd locale={locale} />
        <WebSiteJsonLd locale={locale} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
        <SpeedInsights />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
