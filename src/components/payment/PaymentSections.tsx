'use client';

import { motion } from 'framer-motion';
import { HanjaPopup } from './HanjaPopup';

// ----------------------------------------------------------------------
// Types & Data
// ----------------------------------------------------------------------

interface CopyContent {
  headline: string;
  subHeadline: string;
  intro: string;
  pillars: {
    title: string;
    desc: string;
    hanja: string;
    source: string;
    bookTitle: string;
    bookColor: string;
  }[];
  socialProof: string;
}

const COPY: Record<string, CopyContent> = {
  ko: {
    headline: '30년 경력의 명리 전문가가\nGemini AI 앞에 붓을 내려놓았습니다.',
    subHeadline:
      "단순히 생년월일을 맞히는 앱이 아닙니다.\n인생의 '알고리즘'을 분석하는 시스템입니다.",
    intro:
      '대부분의 사주 앱은 단순한 만세력 데이터를 출력할 뿐입니다. Saju30은 30년 경력의 전문가가 AI에게 자신의 노하우와 동서양의 핵심 명리 서적 5권을 직접 학습시켜 완성한 고품질 엔진입니다.',
    pillars: [
      {
        title: '논리적 구조 설계',
        desc: '사주의 뼈대인 격국(Structure)을 수학적으로 분석하여 삶의 그릇과 성패를 판별합니다.',
        hanja: '格局',
        source: '자평진전(子平真詮)',
        bookTitle: '子平\n真詮',
        bookColor: 'from-blue-900 to-blue-800',
      },
      {
        title: '정밀한 가중치 분석',
        desc: "태어난 계절과 온도를 고려한 조후(Balance) 분석으로 당신에게 꼭 필요한 '행운의 글자'를 찾아냅니다.",
        hanja: '調候',
        source: '궁통보감(窮通寶鑑)',
        bookTitle: '窮通\n寶鑑',
        bookColor: 'from-red-900 to-red-800',
      },
      {
        title: '심층적 기운 분석',
        desc: '겉으로 드러나지 않는 오행의 깊은 흐름과 변화를 추적하여, 인생의 변곡점을 더욱 정교하게 예측합니다.',
        hanja: '氣運',
        source: '적천수(滴天髓)',
        bookTitle: '滴天\n髓',
        bookColor: 'from-emerald-900 to-emerald-800',
      },
      {
        title: '한국적 실전 검증',
        desc: '수만 명의 실제 임상 사례를 바탕으로 한국인의 삶과 정서에 가장 최적화된 적중률 높은 풀이를 제공합니다.',
        hanja: '臨床',
        source: '명리요강(命理要綱)',
        bookTitle: '命理\n要綱',
        bookColor: 'from-amber-900 to-amber-800',
      },
      {
        title: '글로벌 현대 해석',
        desc: '한자 중심의 낡은 해석 대신, 글로벌 스탠다드에 맞춘 현대적 심리와 비즈니스 언어로 당신의 운명을 매핑합니다.',
        hanja: 'Destiny',
        source: 'The Destiny Code',
        bookTitle: 'The\nDestiny\nCode',
        bookColor: 'from-purple-900 to-purple-800',
      },
    ],
    socialProof: '"전문가들도 그 정확도에 놀랐습니다. 지금, 그 압도적인 차이를 경험하세요."',
  },
  en: {
    headline: 'A 30-Year Master Laid Down His Brush\nBefore Gemini AI.',
    subHeadline:
      "Not just a fortune-telling app.\nA system that decodes the 'Algorithm' of your life.",
    intro:
      'Most fortune apps just output basic calendar data. Saju30 is a high-quality engine completed by a 30-year expert who directly trained the AI with his know-how and 5 core Eastern & Western texts.',
    pillars: [
      {
        title: 'Logical Structure',
        desc: "Mathematically analyzes the 'Structure' of your chart to determine the capacity and success of your life.",
        hanja: '格局',
        source: 'Ziping Zhenquan',
        bookTitle: 'Ziping',
        bookColor: 'from-blue-900 to-blue-800',
      },
      {
        title: 'Precise Weight Analysis',
        desc: "Finds your 'Lucky Characters' through Balance analysis considering the season and temperature of your birth.",
        hanja: '調候',
        source: 'Qiong Tong Bao Jian',
        bookTitle: 'Qiong\nTong',
        bookColor: 'from-red-900 to-red-800',
      },
      {
        title: 'Deep Energy Analysis',
        desc: "Tracks the deep flow and changes of the Five Elements not visible on the surface to predict life's turning points.",
        hanja: '氣運',
        source: 'Di Tian Sui',
        bookTitle: 'Di Tian\nSui',
        bookColor: 'from-emerald-900 to-emerald-800',
      },
      {
        title: 'Practical Verification',
        desc: 'Provides highly accurate interpretations optimized for modern life based on tens of thousands of actual clinical cases.',
        hanja: '臨床',
        source: 'Myeongni Yogang',
        bookTitle: 'Clinical\nMyeongni',
        bookColor: 'from-amber-900 to-amber-800',
      },
      {
        title: 'Global Modern Interpretation',
        desc: 'Maps your destiny with modern psychology and business language, replacing outdated character-centric interpretations.',
        hanja: 'Destiny',
        source: 'The Destiny Code',
        bookTitle: 'The\nDestiny\nCode',
        bookColor: 'from-purple-900 to-purple-800',
      },
    ],
    socialProof:
      '"Even experts were shocked by the accuracy. Experience the overwhelming difference now."',
  },
  ja: {
    headline: '30年のキャリアを持つ名理学の大家が、\nGemini AIの前に筆を置きました。',
    subHeadline:
      'ただ誕生日を当てるアプリではありません。\n人生の「アルゴリズム」を分析するシステムです。',
    intro:
      '多くの四柱推命アプリは、単なる万年暦データを出力するだけです。Saju30は、30年の専門家がAIに自身のノウハウと東洋・西洋の核心的な命理書5冊を直接学習させて完成させた高品質エンジンです。',
    pillars: [
      {
        title: '論理的構造設計',
        desc: '四柱推命の骨組みである格局(Structure)を数学的に分析し、人生の器と成敗を判別します。',
        hanja: '格局',
        source: '子平真詮',
        bookTitle: '子平\n真詮',
        bookColor: 'from-blue-900 to-blue-800',
      },
      {
        title: '精密な重み付け分析',
        desc: '生まれた季節と温度を考慮した調候(Balance)分析で、あなたに必ず必要な「幸運の文字」を見つけ出します。',
        hanja: '調候',
        source: '窮通宝鑑',
        bookTitle: '窮通\n宝鑑',
        bookColor: 'from-red-900 to-red-800',
      },
      {
        title: '深層的気運分析',
        desc: '表面に現れない五行の深い流れと変化を追跡し、人生の変曲点をより精巧に予測します。',
        hanja: '氣運',
        source: '滴天髄',
        bookTitle: '滴天\n髄',
        bookColor: 'from-emerald-900 to-emerald-800',
      },
      {
        title: '実戦的検証',
        desc: '数万人の実際の臨床事例をもとに、現代人の生活と情緒に最も最適化された的中率の高い解釈を提供します。',
        hanja: '臨床',
        source: '命理要綱',
        bookTitle: '命理\n要綱',
        bookColor: 'from-amber-900 to-amber-800',
      },
      {
        title: 'グローバル現代解釈',
        desc: '漢字中心の古い解釈の代わりに、グローバルスタンダードに合わせた現代的心理とビジネス言語であなたの運命をマッピングします。',
        hanja: 'Destiny',
        source: 'The Destiny Code',
        bookTitle: 'The\nDestiny\nCode',
        bookColor: 'from-purple-900 to-purple-800',
      },
    ],
    socialProof: '「専門家たちもその正確さに驚きました。今、その圧倒的な違いを体験してください。」',
  },
  'zh-CN': {
    headline: '30年资历的命理大师\n在 Gemini AI 面前放下了画笔。',
    subHeadline: '这不仅仅是一个算命应用。\n这是一个解析人生“算法”的系统。',
    intro:
      '大多数八字应用只是输出单纯的万年历数据。Saju30 是由30年资历的专家将自己的秘诀以及东西方5本核心命理书籍直接传授给AI而完成的高品质引擎。',
    pillars: [
      {
        title: '逻辑结构设计',
        desc: '以数学方式分析八字的骨架——格局(Structure)，从而判别人生的大小与成败。',
        hanja: '格局',
        source: '子平真诠',
        bookTitle: '子平\n真诠',
        bookColor: 'from-blue-900 to-blue-800',
      },
      {
        title: '精密权重分析',
        desc: '通过考虑出生季节和温度的调候(Balance)分析，找出对您至关重要的“幸运字”。',
        hanja: '调候',
        source: '穷通宝鉴',
        bookTitle: '穷通\n宝鉴',
        bookColor: 'from-red-900 to-red-800',
      },
      {
        title: '深层气运分析',
        desc: '追踪表面看不见的五行深层流动与变化，更精细地预测人生的转折点。',
        hanja: '气运',
        source: '滴天髓',
        bookTitle: '滴天\n髓',
        bookColor: 'from-emerald-900 to-emerald-800',
      },
      {
        title: '实战验证',
        desc: '基于数万名实际临床案例，提供最优化且命中率极高的现代生活解读。',
        hanja: '临床',
        source: '命理要纲',
        bookTitle: '命理\n要纲',
        bookColor: 'from-amber-900 to-amber-800',
      },
      {
        title: '全球现代解读',
        desc: '代替以汉字为中心的陈旧解读，用符合全球标准的现代心理学和商业语言描绘您的命运。',
        hanja: 'Destiny',
        source: 'The Destiny Code',
        bookTitle: 'The\nDestiny\nCode',
        bookColor: 'from-purple-900 to-purple-800',
      },
    ],
    socialProof: '“连专家都对其准确性感到惊讶。立刻体验这压倒性的差异吧。”',
  },
  'zh-TW': {
    headline: '30年資歷的命理大師\n在 Gemini AI 面前放下了畫筆。',
    subHeadline: '這不僅僅是一個算命應用。\n這是一個解析人生“演算法”的系統。',
    intro:
      '大多數八字應用只是輸出單純的萬年曆數據。Saju30 是由30年資歷的專家將自己的秘訣以及東西方5本核心命理書籍直接傳授給AI而完成的高品質引擎。',
    pillars: [
      {
        title: '邏輯結構設計',
        desc: '以數學方式分析八字的骨架——格局(Structure)，從而判別人生的大小與成敗。',
        hanja: '格局',
        source: '子平真詮',
        bookTitle: '子平\n真詮',
        bookColor: 'from-blue-900 to-blue-800',
      },
      {
        title: '精密權重分析',
        desc: '通過考慮出生季節和溫度的調候(Balance)分析，找出對您至關重要的“幸運字”。',
        hanja: '調候',
        source: '窮通寶鑑',
        bookTitle: '窮通\n寶鑑',
        bookColor: 'from-red-900 to-red-800',
      },
      {
        title: '深層氣運分析',
        desc: '追蹤表面看不見的五行深層流動與變化，更精細地預測人生的轉折點。',
        hanja: '氣運',
        source: '滴天髓',
        bookTitle: '滴天\n髓',
        bookColor: 'from-emerald-900 to-emerald-800',
      },
      {
        title: '實戰驗證',
        desc: '基於數萬名實際臨床案例，提供最優化且命中率極高的現代生活解讀。',
        hanja: '臨床',
        source: '命理要綱',
        bookTitle: '命理\n要綱',
        bookColor: 'from-amber-900 to-amber-800',
      },
      {
        title: '全球現代解讀',
        desc: '代替以漢字為中心的陳舊解讀，用符合全球標準的現代心理學和商業語言描繪您的命運。',
        hanja: 'Destiny',
        source: 'The Destiny Code',
        bookTitle: 'The\nDestiny\nCode',
        bookColor: 'from-purple-900 to-purple-800',
      },
    ],
    socialProof: '“連專家都對其準確性感到驚訝。立刻體驗這壓倒性的差異吧。”',
  },
};

const DEFAULT_CONTENT: CopyContent = COPY['en']!;

interface PaymentSectionsProps {
  currentLocale: string;
}

export function HeroSection({ currentLocale }: PaymentSectionsProps) {
  const content = COPY[currentLocale] || DEFAULT_CONTENT;

  return (
    <section className="relative px-6 py-12 text-center">
      {/* Background Decor */}
      <div className="absolute left-1/2 top-0 block h-64 w-[200%] -translate-x-1/2 rounded-[100%] bg-gradient-to-b from-[#d4af37]/10 via-[#d4af37]/5 to-transparent blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 mx-auto max-w-4xl"
      >
        <h1 className="mb-6 whitespace-pre-wrap break-keep font-serif text-2xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
          {content.headline}
        </h1>
        <p className="mb-8 whitespace-pre-wrap break-keep text-lg text-gray-400 md:text-2xl">
          {content.subHeadline}
        </p>
        <p className="mx-auto max-w-2xl text-balance break-keep text-base leading-relaxed text-gray-500 md:text-lg">
          {content.intro}
        </p>
      </motion.div>
    </section>
  );
}

export function PillarsSection({ currentLocale }: PaymentSectionsProps) {
  const content = COPY[currentLocale] || DEFAULT_CONTENT;

  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-5">
          {content.pillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group relative flex flex-col items-center text-center"
            >
              {/* Connector Line (Desktop) */}
              {index < 4 && (
                <div className="hidden lg:absolute lg:left-1/2 lg:top-12 lg:-z-10 lg:block lg:w-full lg:translate-x-1/2 lg:border-t lg:border-dashed lg:border-white/10" />
              )}

              {/* Book Visualization */}
              <div
                className={`mb-6 flex h-36 w-28 items-center justify-center rounded-l-sm rounded-r-md bg-gradient-to-br ${pillar.bookColor} shadow-2xl transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)]`}
                style={{
                  boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.5), 5px 5px 15px rgba(0,0,0,0.5)',
                  borderLeft: '4px solid rgba(255,255,255,0.1)',
                }}
              >
                <span className="writing-mode-vertical whitespace-pre-wrap font-serif text-lg font-bold text-white/80 mix-blend-overlay">
                  {pillar.bookTitle}
                </span>
              </div>

              {/* Content */}
              <h3 className="mb-3 text-lg font-semibold text-white">
                <HanjaPopup
                  hanja={pillar.hanja}
                  meaning={pillar.title}
                  source={pillar.source}
                  description={pillar.desc}
                >
                  {pillar.title}
                </HanjaPopup>
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">{pillar.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SocialProofSection({ currentLocale }: PaymentSectionsProps) {
  const content = COPY[currentLocale] || DEFAULT_CONTENT;

  return (
    <section className="px-6 py-10 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="mx-auto max-w-3xl rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-10 shadow-2xl"
      >
        <h3 className="font-serif text-xl font-medium text-white md:text-3xl">
          {content.socialProof}
        </h3>
      </motion.div>
    </section>
  );
}
