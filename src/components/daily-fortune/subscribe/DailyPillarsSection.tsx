'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface DailyPillarsSectionProps {
  locale: string;
}

/** 5개 분석 모듈 정의 */
const PILLAR_KEYS = ['wunseong', 'johu', 'samhap', 'mulsang', 'yongsin'] as const;

const PILLAR_COLORS: Record<string, string> = {
  wunseong: 'from-blue-900 to-blue-800',
  johu: 'from-red-900 to-red-800',
  samhap: 'from-emerald-900 to-emerald-800',
  mulsang: 'from-amber-900 to-amber-800',
  yongsin: 'from-purple-900 to-purple-800',
};

/**
 * Pillars Section - 5권 고전 명리학 분석 모듈 시각화
 */
export function DailyPillarsSection({ locale }: DailyPillarsSectionProps) {
  const t = useTranslations('dailyFortune.subscribe.pillars');

  return (
    <section className="px-6 py-8" suppressHydrationWarning>
      <div className="mx-auto max-w-6xl">
        {/* 섹션 제목 */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center text-xl font-bold text-white md:text-2xl"
        >
          {t('sectionTitle')}
        </motion.h2>

        {/* 5개 책 카드 */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
          {PILLAR_KEYS.map((key, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="group relative flex flex-col items-center text-center"
            >
              {/* 커넥터 라인 (데스크톱) */}
              {index < 4 && (
                <div className="hidden lg:absolute lg:left-1/2 lg:top-12 lg:-z-10 lg:block lg:w-full lg:translate-x-1/2 lg:border-t lg:border-dashed lg:border-white/10" />
              )}

              {/* 책 시각화 */}
              <div
                className={`mb-4 flex h-28 w-20 items-center justify-center rounded-l-sm rounded-r-md bg-gradient-to-br ${PILLAR_COLORS[key]} shadow-2xl transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] md:h-36 md:w-28`}
                style={{
                  boxShadow: 'inset 4px 0 10px rgba(0,0,0,0.5), 5px 5px 15px rgba(0,0,0,0.5)',
                  borderLeft: '4px solid rgba(255,255,255,0.1)',
                }}
              >
                <span className="writing-mode-vertical whitespace-pre-wrap font-serif text-sm font-bold text-white/80 mix-blend-overlay md:text-lg">
                  {t(`${key}.hanja`)}
                </span>
              </div>

              {/* 컨텐츠 */}
              <h3 className="mb-1 text-sm font-semibold text-white md:text-base">
                {t(`${key}.title`)}
              </h3>
              <p className="mb-2 text-xs text-[#d4af37]">{t(`${key}.source`)}</p>
              <p className="text-xs leading-relaxed text-gray-400 md:text-sm">
                {t(`${key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
