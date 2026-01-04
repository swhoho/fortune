/**
 * JSON-LD 구조화 데이터 컴포넌트
 * Schema.org 기반 SEO 최적화
 */

interface OrganizationJsonLdProps {
  locale: string;
}

/**
 * 조직/웹 애플리케이션 구조화 데이터
 */
export function OrganizationJsonLd({ locale }: OrganizationJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';

  const names: Record<string, string> = {
    ko: "Master's Insight AI - AI 사주 분석 서비스",
    en: "Master's Insight AI - AI Fortune Analysis",
    ja: "Master's Insight AI - AI四柱推命分析",
    'zh-CN': "Master's Insight AI - AI四柱八字分析",
    'zh-TW': "Master's Insight AI - AI四柱八字分析",
  };

  const descriptions: Record<string, string> = {
    ko: '30년 명리학 거장이 인정한 AI 사주 분석 서비스. 자평진전, 궁통보감 기반.',
    en: 'AI-powered Four Pillars of Destiny analysis endorsed by master practitioners. Based on Ziping Zhenjuan and Qiongtong Baojian.',
    ja: '30年の経験を持つ命理学の達人が認めたAI四柱推命分析サービス。子平真詮、窮通宝鑑に基づく。',
    'zh-CN': '30年命理学大师认可的AI四柱八字分析服务。基于子平真诠、穷通宝鉴。',
    'zh-TW': '30年命理學大師認可的AI四柱八字分析服務。基於子平真詮、窮通寶鑑。',
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: names[locale] || names.ko,
    description: descriptions[locale] || descriptions.ko,
    url: baseUrl,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '1.00',
      highPrice: '5.00',
      offerCount: 4,
    },
    publisher: {
      '@type': 'Organization',
      name: "Master's Insight AI",
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/og-image.png`,
      },
    },
    inLanguage: locale,
    availableLanguage: ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  );
}

interface ServiceJsonLdProps {
  locale: string;
}

/**
 * 서비스 카탈로그 구조화 데이터
 */
export function ServiceJsonLd({ locale }: ServiceJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';

  const serviceNames: Record<string, { full: string; yearly: string; compatibility: string }> = {
    ko: {
      full: '전체 사주 분석',
      yearly: '신년 사주 분석',
      compatibility: '궁합 분석',
    },
    en: {
      full: 'Full Saju Analysis',
      yearly: 'Yearly Fortune Analysis',
      compatibility: 'Compatibility Analysis',
    },
    ja: {
      full: '総合四柱推命分析',
      yearly: '年間運勢分析',
      compatibility: '相性分析',
    },
    'zh-CN': {
      full: '全面八字分析',
      yearly: '年度运势分析',
      compatibility: '合婚分析',
    },
    'zh-TW': {
      full: '全面八字分析',
      yearly: '年度運勢分析',
      compatibility: '合婚分析',
    },
  };

  const defaultNames = {
    full: '전체 사주 분석',
    yearly: '신년 사주 분석',
    compatibility: '궁합 분석',
  };
  const names = serviceNames[locale] ?? defaultNames;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Fortune Analysis',
    provider: {
      '@type': 'Organization',
      name: "Master's Insight AI",
      url: baseUrl,
    },
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Saju Analysis Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: names.full,
          },
          price: '3.00',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: names.yearly,
          },
          price: '3.00',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: names.compatibility,
          },
          price: '5.00',
          priceCurrency: 'USD',
        },
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  );
}

interface FAQJsonLdProps {
  locale: string;
}

/**
 * FAQ 구조화 데이터 (선택적 사용)
 */
export function FAQJsonLd({ locale }: FAQJsonLdProps) {
  const faqs: Record<string, Array<{ question: string; answer: string }>> = {
    ko: [
      {
        question: '사주 분석은 얼마나 정확한가요?',
        answer:
          '자평진전, 궁통보감 등 전통 명리학 고전을 학습한 AI가 분석합니다. 30년 경력 명리학 전문가가 검증한 알고리즘을 사용합니다.',
      },
      {
        question: '어떤 정보가 필요한가요?',
        answer:
          '생년월일, 출생 시간(선택), 성별 정보가 필요합니다. 출생 시간을 모르시면 일주 기반 분석이 제공됩니다.',
      },
    ],
    en: [
      {
        question: 'How accurate is the Saju analysis?',
        answer:
          'Our AI is trained on classical texts like Ziping Zhenjuan and Qiongtong Baojian. The algorithm has been verified by a master practitioner with 30 years of experience.',
      },
      {
        question: 'What information do I need to provide?',
        answer:
          'You need to provide your birth date, birth time (optional), and gender. If you do not know your birth time, a day pillar-based analysis will be provided.',
      },
    ],
    ja: [
      {
        question: '四柱推命分析はどれくらい正確ですか？',
        answer:
          '子平真詮、窮通宝鑑などの古典を学習したAIが分析します。30年の経験を持つ命理学の専門家が検証したアルゴリズムを使用しています。',
      },
      {
        question: 'どのような情報が必要ですか？',
        answer:
          '生年月日、出生時刻（任意）、性別の情報が必要です。出生時刻がわからない場合は、日柱ベースの分析が提供されます。',
      },
    ],
    'zh-CN': [
      {
        question: '八字分析有多准确？',
        answer:
          '我们的AI基于子平真诠、穷通宝鉴等经典著作进行训练。该算法已由拥有30年经验的命理学大师验证。',
      },
      {
        question: '需要提供什么信息？',
        answer:
          '您需要提供出生日期、出生时间（可选）和性别。如果您不知道出生时间，将提供日柱分析。',
      },
    ],
    'zh-TW': [
      {
        question: '八字分析有多準確？',
        answer:
          '我們的AI基於子平真詮、窮通寶鑑等經典著作進行訓練。該算法已由擁有30年經驗的命理學大師驗證。',
      },
      {
        question: '需要提供什麼資訊？',
        answer:
          '您需要提供出生日期、出生時間（可選）和性別。如果您不知道出生時間，將提供日柱分析。',
      },
    ],
  };

  const defaultFaqs = [
    {
      question: '사주 분석은 얼마나 정확한가요?',
      answer:
        '자평진전, 궁통보감 등 전통 명리학 고전을 학습한 AI가 분석합니다. 30년 경력 명리학 전문가가 검증한 알고리즘을 사용합니다.',
    },
    {
      question: '어떤 정보가 필요한가요?',
      answer:
        '생년월일, 출생 시간(선택), 성별 정보가 필요합니다. 출생 시간을 모르시면 일주 기반 분석이 제공됩니다.',
    },
  ];
  const localeFaqs = faqs[locale] ?? defaultFaqs;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: localeFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  );
}
