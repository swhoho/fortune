'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const EXAMPLES = [
  '/images/examples/example-1.png',
  '/images/examples/example-2.png',
  '/images/examples/example-3.png',
  '/images/examples/example-4.png',
  '/images/examples/example-5.png',
  '/images/examples/example-6.png',
  '/images/examples/example-7.png',
] as const;

/**
 * 결제 페이지 예시 리포트 캐러셀
 * - focusArea가 없을 때 빈 카드 영역에 표시
 * - 오버레이 + 블러 처리로 고급스러운 미리보기 제공
 */
export function ExampleCarousel() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? EXAMPLES.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === EXAMPLES.length - 1 ? 0 : c + 1));

  return (
    <div className="relative flex h-full flex-col rounded-2xl border border-white/5 bg-[#1a1a1a] p-4">
      {/* 이미지 컨테이너 */}
      <div className="relative flex-1 overflow-hidden rounded-xl">
        {/* 원본 이미지 */}
        <Image
          src={EXAMPLES[current]!}
          alt={`예시 리포트 ${current + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* 오버레이 + 블러 레이어 */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
          }}
        >
          {/* 가이드 텍스트 */}
          <span
            className="text-xs uppercase tracking-[0.2em]"
            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            Sample Report
          </span>
        </div>
      </div>

      {/* 좌/우 화살표 */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/70 transition-colors hover:bg-black/70 hover:text-white"
        aria-label="이전 예시"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/70 transition-colors hover:bg-black/70 hover:text-white"
        aria-label="다음 예시"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* 인디케이터 dots */}
      <div className="mt-3 flex justify-center gap-1.5">
        {EXAMPLES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? 'w-4 bg-[#d4af37]' : 'w-1.5 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`예시 ${i + 1}번으로 이동`}
          />
        ))}
      </div>
    </div>
  );
}
