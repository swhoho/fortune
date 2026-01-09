'use client';

import { useEffect } from 'react';

/**
 * 모바일 키보드 높이를 고려한 뷰포트 높이 관리
 * visualViewport API를 사용하여 키보드가 올라오면 --vh CSS 변수 업데이트
 */
export function useViewportHeight() {
  useEffect(() => {
    const updateHeight = () => {
      // visualViewport는 키보드가 올라오면 높이가 줄어듦
      const vh = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // 초기 설정
    updateHeight();

    // visualViewport 리사이즈 감지 (키보드 올라올 때)
    window.visualViewport?.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('scroll', updateHeight);
    window.addEventListener('resize', updateHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('scroll', updateHeight);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);
}
