'use client';

import { motion } from 'framer-motion';

/** 탭 타입 정의 */
export type ReportTabType = 'saju' | 'daewun';

/** 탭 정의 */
interface TabItem {
  id: ReportTabType;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'saju', label: '사주' },
  { id: 'daewun', label: '대운' },
];

interface ReportNavigationProps {
  /** 현재 활성 탭 */
  activeTab: ReportTabType;
  /** 탭 변경 핸들러 */
  onTabChange: (tab: ReportTabType) => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 리포트 탭 네비게이션 컴포넌트
 * Task 21: 사주/대운 탭 분리
 */
export function ReportNavigation({ activeTab, onTabChange, className = '' }: ReportNavigationProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`sticky top-16 z-20 border-b border-[#333] bg-[#0a0a0a]/90 backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex items-center justify-center gap-2 py-3">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative px-6 py-2 text-base font-medium transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
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
