'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import Image from 'next/image';

interface InfoTooltipProps {
  /** 툴팁에 표시할 내용 */
  content: string;
  /** 선택적 제목 */
  title?: string;
  /** 선택적 이미지 경로 (예: /images/glossary/chungan.jpg) */
  image?: string;
  /** 아이콘 크기 (기본: 14) */
  iconSize?: number;
  /** 추가 클래스명 */
  className?: string;
}

/**
 * 정보 툴팁 컴포넌트
 * - 데스크톱: 호버 시 표시
 * - 모바일: 클릭/터치 시 표시
 * - 긴 설명: 스크롤 가능
 * - 이미지 지원: image prop으로 설명 이미지 표시
 */
export function InfoTooltip({ content, title, image, iconSize = 14, className = '' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  /**
   * 호버 시작 핸들러 (데스크톱)
   */
  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    // 약간의 딜레이 후 열기 (실수로 스쳐 지나가는 것 방지)
    hoverTimeoutRef.current = setTimeout(() => {
      if (isHoveringRef.current) {
        setOpen(true);
      }
    }, 100);
  };

  /**
   * 호버 종료 핸들러 (데스크톱)
   */
  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // 약간의 딜레이 후 닫기 (콘텐츠로 이동할 수 있도록)
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setOpen(false);
      }
    }, 150);
  };

  /**
   * 클릭 핸들러 (모바일)
   */
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  // 이미지가 있으면 더 넓은 팝오버 사용
  const hasImage = !!image;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`inline-flex items-center justify-center rounded-full p-0.5 text-gray-500 transition-colors hover:bg-[#333] hover:text-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]/50 ${className}`}
          aria-label="정보 보기"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <Info size={iconSize} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className={`z-50 max-h-[400px] overflow-y-auto rounded-lg border border-[#333] bg-[#1a1a1a] p-4 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 ${hasImage ? 'w-[320px] max-w-[90vw]' : 'max-w-sm'}`}
          sideOffset={8}
          align="center"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onInteractOutside={() => setOpen(false)}
        >
          {title && <p className="mb-2 text-sm font-semibold text-[#d4af37]">{title}</p>}

          {/* 이미지가 있으면 표시 */}
          {image && (
            <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg border border-[#333] bg-[#0f0f0f]">
              <Image
                src={image}
                alt={title || '설명 이미지'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 90vw, 320px"
              />
            </div>
          )}

          <p className="text-xs leading-relaxed text-gray-300">{content}</p>
          <Popover.Arrow className="fill-[#333]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
