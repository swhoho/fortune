'use client';

/**
 * 실패한 섹션 카드 컴포넌트
 * 분석 실패 시 재분석 버튼을 표시 + 다국어 지원
 */

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND_COLORS } from '@/lib/constants/colors';

interface FailedSectionCardProps {
  /** 섹션 제목 */
  title: string;
  /** 섹션 설명 (선택) */
  description?: string;
  /** 재분석 버튼 클릭 핸들러 */
  onReanalyze: () => void;
  /** 재분석 진행 중 */
  isReanalyzing?: boolean;
  /** 아이콘 컴포넌트 (선택) */
  icon?: React.ReactNode;
}

/**
 * 실패한 섹션 카드 (재분석 버튼 포함)
 */
export function FailedSectionCard({
  title,
  description,
  onReanalyze,
  isReanalyzing = false,
  icon,
}: FailedSectionCardProps) {
  const t = useTranslations('yearly.failedSection');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-amber-900/50 bg-[#1a1a1a] p-6"
    >
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
            >
              {icon}
            </div>
          )}
          <div>
            <h3 className="font-serif text-lg font-semibold text-white">{title}</h3>
            {description && <p className="text-sm text-gray-400">{description}</p>}
          </div>
        </div>
      </div>

      {/* 에러 메시지 + 재분석 버튼 */}
      <div className="rounded-xl border border-amber-900/30 bg-amber-900/10 p-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{t('errorMessage')}</p>
          </div>

          <Button
            onClick={onReanalyze}
            disabled={isReanalyzing}
            size="sm"
            className="h-9 bg-[#d4af37] text-[#0a0a0a] hover:bg-[#e5c048]"
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
            {isReanalyzing ? t('analyzing') : t('reanalyze')}
          </Button>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500 sm:text-left">
          {t('freeNote')}
        </p>
      </div>
    </motion.div>
  );
}
