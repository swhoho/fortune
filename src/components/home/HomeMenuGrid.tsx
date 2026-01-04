'use client';

/**
 * 홈 메뉴 그리드 컨테이너
 * 섹션별로 메뉴 카드를 2열 그리드로 배치
 */
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { HomeMenuCard } from './HomeMenuCard';
import { BRAND_COLORS } from '@/lib/constants/colors';
import {
  UserPlus,
  Users,
  Sparkles,
  Calendar,
  Heart,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** 메뉴 아이템 정의 */
interface MenuItem {
  titleKey: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  disabledLabelKey?: string;
}

/** 메뉴 섹션 정의 */
interface MenuSection {
  titleKey: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    titleKey: 'sections.profile',
    items: [
      { titleKey: 'menu.registerProfile', href: '/profiles/new', icon: UserPlus },
      { titleKey: 'menu.profileList', href: '/profiles', icon: Users },
    ],
  },
  {
    titleKey: 'sections.analysis',
    items: [
      { titleKey: 'menu.fullAnalysis', href: '/analysis/full', icon: Sparkles },
      { titleKey: 'menu.yearlyFortune', href: '/analysis/yearly', icon: Calendar },
    ],
  },
  {
    titleKey: 'sections.compatibility',
    items: [
      {
        titleKey: 'menu.compatibility',
        href: '/analysis/compatibility',
        icon: Heart,
        disabled: true,
        disabledLabelKey: 'comingSoon',
      },
    ],
  },
  {
    titleKey: 'sections.account',
    items: [
      { titleKey: 'menu.mypage', href: '/mypage', icon: User },
    ],
  },
];

export function HomeMenuGrid() {
  const t = useTranslations('home');

  let cardIndex = 0;

  return (
    <div className="space-y-8 px-5 pb-12">
      {menuSections.map((section, sectionIndex) => (
        <motion.div
          key={section.titleKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: sectionIndex * 0.1,
          }}
        >
          {/* 섹션 제목 */}
          <div className="mb-4 flex items-center gap-2">
            {/* 금색 장식 마커 */}
            <span
              className="text-sm font-light"
              style={{ color: BRAND_COLORS.primary }}
            >
              ✦
            </span>
            <h2 className="text-sm font-medium tracking-widest text-gray-400 uppercase">
              {t(section.titleKey)}
            </h2>
            {/* 장식 라인 */}
            <div
              className="flex-1 h-px ml-3"
              style={{
                background: `linear-gradient(to right, ${BRAND_COLORS.primary}30, transparent)`,
              }}
            />
          </div>

          {/* 카드 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            {section.items.map((item) => {
              const delay = 0.15 + cardIndex * 0.08;
              cardIndex++;

              return (
                <HomeMenuCard
                  key={item.titleKey}
                  title={t(item.titleKey)}
                  href={item.href}
                  icon={item.icon}
                  disabled={item.disabled}
                  disabledLabel={
                    item.disabledLabelKey ? t(item.disabledLabelKey) : undefined
                  }
                  delay={delay}
                />
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
