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
        question: 'AI 사주 분석은 얼마나 정확한가요?',
        answer:
          '자평진전, 궁통보감, 적천수, 삼명통회 등 수십 권의 명리학 고전을 학습한 AI가 분석합니다. 30년 이상 경력의 사주 전문가로부터 지속적인 피드백을 받아 알고리즘을 완성했습니다. 실제 사주 전문가 수준의 정확도를 목표로 개발되었습니다.',
      },
      {
        question: '사주 분석에 어떤 정보가 필요한가요?',
        answer:
          '생년월일과 성별만 있으면 바로 분석받을 수 있어요! 출생 시간을 아시면 더 정확한 시주까지 포함된 분석을, 모르시면 일주 기반의 분석을 제공해드립니다. 어떤 경우든 의미 있는 인사이트를 얻으실 수 있습니다.',
      },
      {
        question: '사주팔자란 무엇인가요?',
        answer:
          '사주팔자는 태어난 연, 월, 일, 시를 천간과 지지로 표현한 여덟 글자예요. 수천 년간 이어져 온 동양의 지혜로, 타고난 성격과 재능, 인생의 흐름을 이해하는 데 도움을 줍니다. 미신이 아닌 통계와 경험에 기반한 분석 체계입니다.',
      },
      {
        question: '분석 결과는 어디서 확인하나요?',
        answer:
          '결제 완료 후 약 1-2분이면 마이페이지에서 상세한 분석 결과를 확인하실 수 있어요. 성격, 재물운, 연애운, 직장운, 건강운은 물론 10년 대운 흐름까지 한눈에 보실 수 있습니다.',
      },
      {
        question: '여러 프로필을 등록할 수 있나요?',
        answer:
          '물론이죠! 본인은 물론 가족, 연인, 친구의 프로필을 등록해서 각각 분석받으실 수 있어요. 궁합 분석 기능도 있어서 두 사람의 사주를 비교해보실 수도 있답니다.',
      },
      {
        question: '환불이 가능한가요?',
        answer:
          '디지털 콘텐츠 특성상 분석 결과가 생성된 후에는 환불이 어렵습니다. 다만, 시스템 오류로 분석이 제대로 되지 않았거나 결제 오류가 발생한 경우에는 고객센터로 문의해주시면 신속하게 처리해드립니다.',
      },
    ],
    en: [
      {
        question: 'How accurate is the AI Saju analysis?',
        answer:
          'Our AI has been trained on dozens of classical texts including Ziping Zhenjuan, Qiongtong Baojian,Erta Zhenshu, and Sanming Tonghui. The algorithm was refined through continuous feedback from Saju masters with over 30 years of experience, achieving expert-level accuracy.',
      },
      {
        question: 'What information do I need for Saju analysis?',
        answer:
          'Just your birth date and gender are enough to get started! If you know your birth time, you will get a more detailed analysis including the hour pillar. Either way, you will receive meaningful insights about your destiny.',
      },
      {
        question: 'What is Four Pillars of Destiny (Saju)?',
        answer:
          'Saju, also known as BaZi in Chinese, represents your birth year, month, day, and hour in heavenly stems and earthly branches. This ancient Eastern wisdom system, refined over thousands of years, helps understand your innate personality, talents, and life patterns.',
      },
      {
        question: 'Where can I view my analysis results?',
        answer:
          'After payment, your detailed analysis will be ready on your My Page in just 1-2 minutes. You will see insights on personality, wealth, love, career, health, and even your 10-year fortune cycles at a glance.',
      },
      {
        question: 'Can I register multiple profiles?',
        answer:
          'Absolutely! You can register profiles for yourself, family members, partners, or friends to get individual analyses. We also offer compatibility analysis to compare the fortunes of two people.',
      },
      {
        question: 'Is a refund available?',
        answer:
          'Due to the nature of digital content, refunds are not available once the analysis has been generated. However, if there was a system error or payment issue, please contact our support team and we will resolve it promptly.',
      },
    ],
    ja: [
      {
        question: 'AI四柱推命分析はどれくらい正確ですか？',
        answer:
          '子平真詮、窮通宝鑑、滴天髄、三命通会など数十冊の命理学古典を学習したAIが分析します。30年以上の経験を持つ四柱推命の専門家から継続的なフィードバックを受けてアルゴリズムを完成させました。',
      },
      {
        question: '四柱推命分析にはどのような情報が必要ですか？',
        answer:
          '生年月日と性別だけですぐに分析を受けられます！出生時刻がわかればより詳細な時柱を含む分析を、わからなくても日柱ベースの分析を提供いたします。どちらの場合でも意味のある洞察を得ることができます。',
      },
      {
        question: '四柱推命とは何ですか？',
        answer:
          '四柱推命は、生まれた年、月、日、時を天干地支で表した八字です。数千年にわたって受け継がれてきた東洋の知恵で、生まれ持った性格や才能、人生の流れを理解するのに役立ちます。',
      },
      {
        question: '分析結果はどこで確認できますか？',
        answer:
          '決済完了後、約1〜2分でマイページで詳細な分析結果をご確認いただけます。性格、財運、恋愛運、仕事運、健康運はもちろん、10年間の大運の流れまで一目でご覧いただけます。',
      },
      {
        question: '複数のプロフィールを登録できますか？',
        answer:
          'もちろんです！ご本人はもちろん、ご家族、恋人、友人のプロフィールを登録してそれぞれ分析を受けることができます。相性分析機能もあり、お二人の四柱を比較することもできます。',
      },
      {
        question: '返金は可能ですか？',
        answer:
          'デジタルコンテンツの特性上、分析結果が生成された後の返金は難しいです。ただし、システムエラーで分析が正常に行われなかった場合や決済エラーが発生した場合は、カスタマーサポートにお問い合わせいただければ迅速に対応いたします。',
      },
    ],
    'zh-CN': [
      {
        question: 'AI八字分析有多准确？',
        answer:
          '我们的AI学习了子平真诠、穷通宝鉴、滴天髓、三命通会等数十本命理学经典。算法经过30年以上经验的八字大师持续反馈和完善，达到了专家级的准确度。',
      },
      {
        question: '八字分析需要提供什么信息？',
        answer:
          '只需要出生日期和性别就可以开始分析！如果知道出生时间，将提供包含时柱的更详细分析；不知道也没关系，日柱分析同样能带来有价值的洞察。',
      },
      {
        question: '什么是四柱八字？',
        answer:
          '四柱八字是用天干地支表示出生的年、月、日、时的八个字。这是流传数千年的东方智慧，帮助了解与生俱来的性格、才能和人生走向。',
      },
      {
        question: '在哪里查看分析结果？',
        answer:
          '付款后约1-2分钟，即可在"我的页面"查看详细分析结果。性格、财运、爱情、事业、健康以及10年大运走势一目了然。',
      },
      {
        question: '可以注册多个档案吗？',
        answer:
          '当然可以！您可以为自己、家人、恋人、朋友注册档案，分别获取分析。还有合婚分析功能，可以比较两个人的八字。',
      },
      {
        question: '可以退款吗？',
        answer:
          '由于数字内容的特性，分析结果生成后无法退款。但如果因系统错误导致分析未能正常完成或发生支付错误，请联系客服，我们会尽快处理。',
      },
    ],
    'zh-TW': [
      {
        question: 'AI八字分析有多準確？',
        answer:
          '我們的AI學習了子平真詮、窮通寶鑑、滴天髓、三命通會等數十本命理學經典。演算法經過30年以上經驗的八字大師持續反饋和完善，達到了專家級的準確度。',
      },
      {
        question: '八字分析需要提供什麼資訊？',
        answer:
          '只需要出生日期和性別就可以開始分析！如果知道出生時間，將提供包含時柱的更詳細分析；不知道也沒關係，日柱分析同樣能帶來有價值的洞察。',
      },
      {
        question: '什麼是四柱八字？',
        answer:
          '四柱八字是用天干地支表示出生的年、月、日、時的八個字。這是流傳數千年的東方智慧，幫助了解與生俱來的性格、才能和人生走向。',
      },
      {
        question: '在哪裡查看分析結果？',
        answer:
          '付款後約1-2分鐘，即可在「我的頁面」查看詳細分析結果。性格、財運、愛情、事業、健康以及10年大運走勢一目了然。',
      },
      {
        question: '可以註冊多個檔案嗎？',
        answer:
          '當然可以！您可以為自己、家人、戀人、朋友註冊檔案，分別獲取分析。還有合婚分析功能，可以比較兩個人的八字。',
      },
      {
        question: '可以退款嗎？',
        answer:
          '由於數位內容的特性，分析結果生成後無法退款。但如果因系統錯誤導致分析未能正常完成或發生支付錯誤，請聯繫客服，我們會盡快處理。',
      },
    ],
  };

  const defaultFaqs = [
    {
      question: 'AI 사주 분석은 얼마나 정확한가요?',
      answer:
        '자평진전, 궁통보감, 적천수, 삼명통회 등 수십 권의 명리학 고전을 학습한 AI가 분석합니다. 30년 이상 경력의 사주 전문가로부터 지속적인 피드백을 받아 알고리즘을 완성했습니다.',
    },
    {
      question: '사주 분석에 어떤 정보가 필요한가요?',
      answer:
        '생년월일과 성별만 있으면 바로 분석받을 수 있어요! 출생 시간을 아시면 더 정확한 분석을 제공해드립니다.',
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

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

/**
 * 빵부스러기 구조화 데이터
 * 검색결과에 페이지 경로 표시
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
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

interface WebSiteJsonLdProps {
  locale: string;
}

/**
 * 웹사이트 구조화 데이터
 * Google Sitelinks 검색박스 활성화
 */
export function WebSiteJsonLd({ locale }: WebSiteJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';

  const names: Record<string, string> = {
    ko: "Master's Insight AI - AI 사주 분석",
    en: "Master's Insight AI - AI Fortune Analysis",
    ja: "Master's Insight AI - AI四柱推命",
    'zh-CN': "Master's Insight AI - AI八字分析",
    'zh-TW': "Master's Insight AI - AI八字分析",
  };

  const descriptions: Record<string, string> = {
    ko: '30년 명리학 거장이 인정한 AI 사주 분석 서비스',
    en: 'AI-powered Four Pillars of Destiny analysis',
    ja: '30年の経験を持つ命理学の達人が認めたAI四柱推命分析',
    'zh-CN': '30年命理学大师认可的AI八字分析服务',
    'zh-TW': '30年命理學大師認可的AI八字分析服務',
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: names[locale] || names.ko,
    description: descriptions[locale] || descriptions.ko,
    url: baseUrl,
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name: "Master's Insight AI",
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/og-image.png`,
      },
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

interface HowToJsonLdProps {
  locale: string;
}

/**
 * HowTo 구조화 데이터
 * 사주 분석 사용법 단계별 안내 (AEO 최적화)
 */
export function HowToJsonLd({ locale }: HowToJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';

  const content: Record<
    string,
    { name: string; description: string; steps: Array<{ name: string; text: string }> }
  > = {
    ko: {
      name: 'AI 사주 분석 받는 방법',
      description:
        "Master's Insight AI에서 AI 사주 분석을 받는 4단계 가이드입니다. 생년월일 정보만 있으면 누구나 쉽게 사주팔자 분석을 받을 수 있습니다.",
      steps: [
        {
          name: '프로필 생성',
          text: '생년월일, 출생 시간(선택), 성별 정보를 입력하여 분석 대상 프로필을 생성합니다.',
        },
        {
          name: '분석 영역 선택',
          text: '재물운, 연애운, 직장운, 건강운 중 집중 분석하고 싶은 영역을 선택합니다.',
        },
        {
          name: '고민 입력',
          text: '현재 직면한 고민이나 구체적인 질문을 입력합니다. AI가 맞춤형 답변을 제공합니다.',
        },
        {
          name: '결제 및 분석 확인',
          text: '결제 후 1-2분 내에 상세한 사주 분석 결과를 마이페이지에서 확인할 수 있습니다.',
        },
      ],
    },
    en: {
      name: 'How to Get AI Saju Analysis',
      description:
        "A 4-step guide to getting AI Four Pillars of Destiny analysis at Master's Insight AI. Anyone can easily receive Saju analysis with just their birth date.",
      steps: [
        {
          name: 'Create Profile',
          text: 'Enter your birth date, birth time (optional), and gender to create an analysis profile.',
        },
        {
          name: 'Select Focus Area',
          text: 'Choose the area you want to focus on: wealth, love, career, or health.',
        },
        {
          name: 'Enter Your Question',
          text: 'Enter your current concerns or specific questions. The AI will provide personalized answers.',
        },
        {
          name: 'Payment and View Results',
          text: 'After payment, view your detailed Saju analysis results on My Page within 1-2 minutes.',
        },
      ],
    },
    ja: {
      name: 'AI四柱推命分析を受ける方法',
      description:
        "Master's Insight AIでAI四柱推命分析を受けるための4ステップガイドです。生年月日情報があれば誰でも簡単に四柱推命分析を受けられます。",
      steps: [
        {
          name: 'プロフィール作成',
          text: '生年月日、出生時刻（任意）、性別情報を入力してプロフィールを作成します。',
        },
        {
          name: '分析領域選択',
          text: '財運、恋愛運、仕事運、健康運から集中的に分析したい領域を選択します。',
        },
        {
          name: '悩み入力',
          text: '現在の悩みや具体的な質問を入力します。AIがカスタマイズされた回答を提供します。',
        },
        {
          name: '決済と結果確認',
          text: '決済後1〜2分以内にマイページで詳細な四柱推命分析結果を確認できます。',
        },
      ],
    },
    'zh-CN': {
      name: '如何获取AI八字分析',
      description:
        "在Master's Insight AI获取AI八字分析的4步指南。只需出生日期信息，任何人都可以轻松获得八字分析。",
      steps: [
        { name: '创建档案', text: '输入出生日期、出生时间（可选）和性别信息来创建分析档案。' },
        { name: '选择分析领域', text: '选择您想重点分析的领域：财运、爱情、事业或健康。' },
        { name: '输入问题', text: '输入您当前的困扰或具体问题。AI将提供个性化的回答。' },
        { name: '付款并查看结果', text: '付款后1-2分钟内，在"我的页面"查看详细的八字分析结果。' },
      ],
    },
    'zh-TW': {
      name: '如何獲取AI八字分析',
      description:
        "在Master's Insight AI獲取AI八字分析的4步指南。只需出生日期資訊，任何人都可以輕鬆獲得八字分析。",
      steps: [
        { name: '創建檔案', text: '輸入出生日期、出生時間（可選）和性別資訊來創建分析檔案。' },
        { name: '選擇分析領域', text: '選擇您想重點分析的領域：財運、愛情、事業或健康。' },
        { name: '輸入問題', text: '輸入您當前的困擾或具體問題。AI將提供個性化的回答。' },
        { name: '付款並查看結果', text: '付款後1-2分鐘內，在「我的頁面」查看詳細的八字分析結果。' },
      ],
    },
  };

  const defaultContent = {
    name: 'AI 사주 분석 받는 방법',
    description: 'AI 사주 분석을 받는 4단계 가이드입니다.',
    steps: [
      { name: '프로필 생성', text: '생년월일, 출생 시간(선택), 성별 정보를 입력합니다.' },
      { name: '분석 영역 선택', text: '집중 분석하고 싶은 영역을 선택합니다.' },
      { name: '고민 입력', text: '현재 고민이나 질문을 입력합니다.' },
      { name: '결제 및 분석 확인', text: '결제 후 분석 결과를 확인합니다.' },
    ],
  };

  const localeContent = content[locale] ?? defaultContent;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: localeContent.name,
    description: localeContent.description,
    step: localeContent.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${baseUrl}/${locale === 'ko' ? '' : locale}`,
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

interface SpeakableJsonLdProps {
  locale: string;
  cssSelectors?: string[];
}

/**
 * Speakable 구조화 데이터
 * 음성 검색 최적화 (Google Assistant 등)
 */
export function SpeakableJsonLd({ locale, cssSelectors }: SpeakableJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://masters-insight.ai';

  const names: Record<string, string> = {
    ko: "Master's Insight AI - AI 사주 분석 서비스",
    en: "Master's Insight AI - AI Fortune Analysis Service",
    ja: "Master's Insight AI - AI四柱推命分析サービス",
    'zh-CN': "Master's Insight AI - AI八字分析服务",
    'zh-TW': "Master's Insight AI - AI八字分析服務",
  };

  const descriptions: Record<string, string> = {
    ko: '30년 명리학 거장이 인정한 AI 사주 분석 서비스입니다. 자평진전, 궁통보감 등 전통 명리학 고전을 학습한 AI가 당신의 사주를 분석합니다.',
    en: "Master's Insight AI is an AI-powered Four Pillars of Destiny analysis service endorsed by master practitioners. Our AI trained on classical texts analyzes your destiny.",
    ja: "Master's Insight AIは30年の経験を持つ命理学の達人が認めたAI四柱推命分析サービスです。古典を学習したAIがあなたの運命を分析します。",
    'zh-CN':
      "Master's Insight AI是30年命理学大师认可的AI八字分析服务。基于经典著作训练的AI为您分析命运。",
    'zh-TW':
      "Master's Insight AI是30年命理學大師認可的AI八字分析服務。基於經典著作訓練的AI為您分析命運。",
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: names[locale] || names.ko,
    description: descriptions[locale] || descriptions.ko,
    url: baseUrl,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors || ['h1', 'h2', '.speakable-content'],
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
