'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Briefcase, Coins, Heart, HeartPulse, Users, Sparkles } from 'lucide-react';

interface DailyBenefitsSectionProps {
  locale: string;
}

/** 6개 영역 정의 */
const BENEFIT_ITEMS = [
  { key: 'career', icon: Briefcase },
  { key: 'wealth', icon: Coins },
  { key: 'love', icon: Heart },
  { key: 'health', icon: HeartPulse },
  { key: 'relationship', icon: Users },
  { key: 'overall', icon: Sparkles },
] as const;

/**
 * Benefits Section - 6개 분석 영역 그리드
 */
export function DailyBenefitsSection({ locale }: DailyBenefitsSectionProps) {
  const t = useTranslations('dailyFortune.subscribe.benefits');

  return (
    <section className="px-6 py-6" suppressHydrationWarning>
      <div className="mx-auto max-w-4xl">
        {/* 섹션 제목 */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center text-xl font-bold text-white md:text-2xl"
        >
          {t('sectionTitle')}
        </motion.h2>

        {/* 6개 영역 그리드 */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {BENEFIT_ITEMS.map(({ key, icon: Icon }, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="group rounded-xl border border-[#333] bg-[#1a1a1a] p-4 transition-all duration-300 hover:border-[#d4af37]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]"
            >
              {/* 아이콘 */}
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#242424] transition-colors group-hover:bg-[#d4af37]/10">
                <Icon className="h-5 w-5 text-[#d4af37]" />
              </div>

              {/* 타이틀 */}
              <h3 className="mb-1 text-sm font-semibold text-white md:text-base">
                {t(`${key}.title`)}
              </h3>

              {/* 설명 */}
              <p className="text-xs text-gray-400 md:text-sm">{t(`${key}.description`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
