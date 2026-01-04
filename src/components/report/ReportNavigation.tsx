'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Calendar, User, Star, Briefcase, Coins, Heart } from 'lucide-react';

/** 네비게이션 섹션 정의 */
interface NavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: NavSection[] = [
  { id: 'saju', label: '사주', icon: Calendar },
  { id: 'personality', label: '성격', icon: User },
  { id: 'characteristics', label: '특성', icon: Star },
  { id: 'aptitude', label: '적성', icon: Briefcase },
  { id: 'wealth', label: '재물', icon: Coins },
  { id: 'romance', label: '연애', icon: Heart },
];

interface ReportNavigationProps {
  /** 추가 클래스 */
  className?: string;
}

/**
 * 리포트 스크롤 네비게이션 컴포넌트
 * Task 20: 섹션별 빠른 이동 네비게이션
 */
export function ReportNavigation({ className = '' }: ReportNavigationProps) {
  const [activeSection, setActiveSection] = useState('saju');

  // 스크롤 이벤트 핸들러 - 현재 보이는 섹션 감지
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // 헤더 높이 보정

      for (const section of SECTIONS) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 초기 상태 설정

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 섹션 클릭 핸들러
  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 120; // 헤더 + 네비게이션 높이
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`sticky top-16 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto max-w-4xl px-4">
        <div className="scrollbar-hide flex items-center gap-1 overflow-x-auto py-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <motion.button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#1a1a1a] text-white' : 'text-gray-600 hover:bg-gray-100'
                } `}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#d4af37]' : ''}`} />
                <span>{section.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
