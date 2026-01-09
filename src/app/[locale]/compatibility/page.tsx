'use client';

/**
 * 궁합 분석 유형 선택 페이지
 * /[locale]/compatibility
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Heart, Users, Lock } from 'lucide-react';

import { AppHeader } from '@/components/layout';
import { BRAND_COLORS } from '@/lib/constants/colors';

export default function CompatibilityPage() {
  const router = useRouter();
  const t = useTranslations('compatibility');

  const handleRomanceSelect = () => {
    router.push('/compatibility/romance/new');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 헤더 */}
      <AppHeader title={t('title', { defaultValue: '궁합 분석' })} />

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* 서브 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
          >
            <Heart className="h-8 w-8" style={{ color: BRAND_COLORS.primary }} />
          </div>
          <p className="text-gray-400">
            {t('subtitle', { defaultValue: '두 사람의 사주로 궁합을 분석합니다' })}
          </p>
        </motion.div>

        {/* 유형 선택 카드 */}
        <div className="space-y-4">
          {/* 연인 궁합 */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={handleRomanceSelect}
            className="w-full rounded-xl border border-[#333] bg-[#1a1a1a] p-6 text-left transition-all hover:border-[#d4af37] hover:bg-[#242424]"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
              >
                <Heart className="h-6 w-6" style={{ color: BRAND_COLORS.primary }} />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold text-white">
                  {t('types.romance.title', { defaultValue: '연인 궁합' })}
                </h3>
                <p className="text-sm text-gray-400">
                  {t('types.romance.description', {
                    defaultValue: '두 사람의 연애 스타일, 궁합 점수, 결혼 적합도를 분석합니다',
                  })}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${BRAND_COLORS.primary}20`,
                      color: BRAND_COLORS.primary,
                    }}
                  >
                    70 크레딧
                  </span>
                </div>
              </div>
            </div>
          </motion.button>

          {/* 친구 궁합 (준비 중) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full cursor-not-allowed rounded-xl border border-[#333] bg-[#1a1a1a] p-6 opacity-50"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-800">
                <Users className="h-6 w-6 text-gray-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-500">
                    {t('types.friend.title', { defaultValue: '친구 궁합' })}
                  </h3>
                  <span className="flex items-center gap-1 rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
                    <Lock className="h-3 w-3" />
                    {t('comingSoon', { defaultValue: '준비 중' })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {t('types.friend.description', {
                    defaultValue: '친구, 동료와의 관계 궁합을 분석합니다',
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 안내 텍스트 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          {t('notice', { defaultValue: '분석에는 약 30~60초가 소요됩니다' })}
        </motion.p>
      </div>
    </div>
  );
}
