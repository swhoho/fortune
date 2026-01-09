'use client';

/**
 * 궁합 분석 - 탭 네비게이션
 * 부드러운 애니메이션과 글로우 효과
 */

import { motion } from 'framer-motion';
import { Heart, BarChart3, GitCompare, type LucideIcon } from 'lucide-react';

type TabType = 'score' | 'analysis' | 'compare';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface TabConfig {
  id: TabType;
  icon: LucideIcon;
  label: string;
}

const tabs: TabConfig[] = [
  { id: 'score', icon: BarChart3, label: '궁합점수' },
  { id: 'analysis', icon: Heart, label: '궁합분석' },
  { id: 'compare', icon: GitCompare, label: '사주비교' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="relative">
      {/* 배경 블러 효과 */}
      <div className="absolute inset-0 -z-10 backdrop-blur-xl" />

      {/* 상단 라인 */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />

      {/* 탭 컨테이너 */}
      <div className="relative mx-auto flex max-w-2xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-1 flex-col items-center justify-center py-4 transition-colors"
            >
              {/* 활성 탭 배경 */}
              {isActive && (
                <motion.div
                  layoutId="tabBackground"
                  className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/10 to-transparent"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* 아이콘과 라벨 */}
              <motion.div
                className="relative z-10 flex items-center gap-2"
                animate={{
                  color: isActive ? '#d4af37' : '#6b7280',
                }}
                transition={{ duration: 0.2 }}
              >
                <Icon
                  className={`h-4 w-4 transition-all ${isActive ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : ''}`}
                />
                <span
                  className={`text-sm font-medium ${isActive ? 'text-[#d4af37]' : 'text-gray-500'}`}
                >
                  {tab.label}
                </span>
              </motion.div>

              {/* 활성 탭 인디케이터 */}
              {isActive && (
                <motion.div
                  layoutId="tabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, #d4af37 30%, #d4af37 70%, transparent)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 하단 라인 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
