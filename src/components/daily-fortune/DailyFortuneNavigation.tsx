'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Sun, MessageCircle } from 'lucide-react';

/** 탭 타입 정의 */
export type DailyFortuneTabType = 'fortune' | 'consultation';

/** 탭 정의 */
interface TabItem {
  id: DailyFortuneTabType;
  labelKey: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { id: 'fortune', labelKey: 'fortune', icon: Sun },
  { id: 'consultation', labelKey: 'consultation', icon: MessageCircle },
];

interface DailyFortuneNavigationProps {
  /** 현재 활성 탭 */
  activeTab: DailyFortuneTabType;
  /** 탭 변경 핸들러 */
  onTabChange: (tab: DailyFortuneTabType) => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 오늘의 운세 탭 네비게이션 컴포넌트
 * 운세/상담 2탭 구조
 */
export function DailyFortuneNavigation({
  activeTab,
  onTabChange,
  className = '',
}: DailyFortuneNavigationProps) {
  const t = useTranslations('dailyFortune.tabs');

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`sticky top-16 z-20 border-b border-[#333] bg-[#0a0a0a]/90 backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex items-center justify-center gap-4 py-3">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-2 px-6 py-2 text-base font-medium transition-all ${
                  isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#d4af37]' : ''}`} />
                <span>{t(tab.labelKey)}</span>
                {isActive && (
                  <motion.div
                    layoutId="dailyFortuneActiveTab"
                    className="absolute inset-x-0 -bottom-3 h-0.5 bg-[#d4af37]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
