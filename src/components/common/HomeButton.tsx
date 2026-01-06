'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

interface HomeButtonProps {
  /** 추가 클래스 */
  className?: string;
}

/**
 * 홈으로 이동하는 버튼
 * 페이지 헤더에서 재사용
 */
export function HomeButton({ className = '' }: HomeButtonProps) {
  return (
    <Link
      href="/home"
      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a1a1a] text-gray-400 transition-all hover:bg-[#242424] hover:text-white ${className}`}
      title="홈으로"
    >
      <Home className="h-5 w-5" />
    </Link>
  );
}
