'use client';

/**
 * 프로필 빈 상태 컴포넌트
 * Task 4.6: 빈 상태 UI
 */
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

/**
 * 프로필이 없을 때 표시되는 빈 상태 UI
 */
export function EmptyProfiles() {
  const t = useTranslations('profile');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      {/* 아이콘 */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f8f6f0] to-[#ebe8e0]">
        <UserPlus className="h-10 w-10 text-[#d4af37]" />
      </div>

      {/* 제목 */}
      <h3 className="mb-2 font-serif text-xl font-semibold text-[#1a1a1a]">{t('list.empty')}</h3>

      {/* 설명 */}
      <p className="mb-8 max-w-sm text-gray-500">{t('list.emptyDescription')}</p>

      {/* CTA 버튼 */}
      <Button
        asChild
        className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
      >
        <Link href="/profiles/new">{t('list.addFirst')}</Link>
      </Button>
    </motion.div>
  );
}
