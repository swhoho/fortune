'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Layers, BookOpen, LayoutGrid } from 'lucide-react';

interface DailySocialProofSectionProps {
  locale: string;
}

/**
 * Social Proof Section - 신뢰 지표
 */
export function DailySocialProofSection({ locale: _locale }: DailySocialProofSectionProps) {
  const t = useTranslations('dailyFortune.subscribe.socialProof');

  const stats = [
    { key: 'steps', icon: Layers },
    { key: 'classics', icon: BookOpen },
    { key: 'areas', icon: LayoutGrid },
  ];

  return (
    <section className="px-6 py-6 text-center" suppressHydrationWarning>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="mx-auto max-w-3xl rounded-3xl border border-white/5 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-8 shadow-2xl md:p-10"
      >
        {/* 인용문 */}
        <h3 className="mb-8 whitespace-pre-wrap font-serif text-lg font-medium text-white md:text-2xl">
          {t('quote')}
        </h3>

        {/* 신뢰 지표 3개 */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {stats.map(({ key, icon: Icon }, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 rounded-full bg-[#242424] px-4 py-2"
            >
              <Icon className="h-4 w-4 text-[#d4af37]" />
              <span className="text-sm font-medium text-white">{t(`stats.${key}`)}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
