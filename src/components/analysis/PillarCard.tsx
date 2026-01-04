'use client';

/**
 * 사주 명반 카드 컴포넌트
 * Python API에서 생성된 Base64 이미지를 표시
 * Phase 2: 각 기둥 클릭 시 상세 모달 표시
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { PillarDetailModal } from './PillarDetailModal';
import type { PillarsHanja, Jijanggan } from '@/types/saju';

/** 기둥 키 타입 */
type PillarKey = 'year' | 'month' | 'day' | 'hour';

/** 기둥 순서 (명반 이미지에서 왼쪽→오른쪽: 시→일→월→연) */
const PILLAR_ORDER: PillarKey[] = ['hour', 'day', 'month', 'year'];

interface PillarCardProps {
  /** Base64 이미지 데이터 (data:image/png;base64,...) */
  imageBase64: string;
  /** 4개 기둥 데이터 (상세 모달용) */
  pillarsData?: PillarsHanja | null;
  /** 지장간 데이터 (상세 모달용) */
  jijangganData?: Jijanggan | null;
}

export function PillarCard({ imageBase64, pillarsData, jijangganData }: PillarCardProps) {
  const [selectedPillar, setSelectedPillar] = useState<PillarKey | null>(null);
  const hasDetailData = pillarsData && jijangganData;

  const handlePillarClick = (pillarKey: PillarKey) => {
    if (hasDetailData) {
      setSelectedPillar(pillarKey);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
      >
        {/* 헤더 */}
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-center font-serif text-lg font-semibold text-gray-900">
            사주팔자 명반
          </h3>
          <p className="mt-1 text-center text-xs text-gray-500">시주 · 일주 · 월주 · 연주</p>
        </div>

        {/* 명반 이미지 + 클릭 영역 */}
        <div className="relative aspect-[2/1] w-full bg-[#f8f8f8]">
          <Image
            src={imageBase64}
            alt="사주팔자 명반"
            fill
            className="object-contain p-4"
            priority
            unoptimized
          />

          {/* 클릭 영역 오버레이 (4등분) */}
          {hasDetailData && (
            <div className="absolute inset-0 flex p-4">
              {PILLAR_ORDER.map((pillarKey) => (
                <button
                  key={pillarKey}
                  onClick={() => handlePillarClick(pillarKey)}
                  className="group relative flex-1 transition-colors hover:bg-primary/5"
                  aria-label={`${pillarKey === 'year' ? '연주' : pillarKey === 'month' ? '월주' : pillarKey === 'day' ? '일주' : '시주'} 상세 보기`}
                >
                  {/* 호버 시 테두리 표시 */}
                  <div className="absolute inset-1 rounded-lg border-2 border-transparent transition-colors group-hover:border-primary/30" />
                  {/* 호버 시 안내 텍스트 */}
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {pillarKey === 'year'
                      ? '연주'
                      : pillarKey === 'month'
                        ? '월주'
                        : pillarKey === 'day'
                          ? '일주'
                          : '시주'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 하단 안내 */}
        {hasDetailData && (
          <div className="border-t border-gray-100 px-6 py-3">
            <p className="text-center text-xs text-gray-400">
              각 기둥을 클릭하면 상세 해설을 볼 수 있습니다
            </p>
          </div>
        )}
      </motion.div>

      {/* 상세 모달 */}
      {hasDetailData && selectedPillar && (
        <PillarDetailModal
          pillar={pillarsData[selectedPillar]}
          jijanggan={jijangganData[selectedPillar]}
          pillarKey={selectedPillar}
          open={!!selectedPillar}
          onOpenChange={(open) => !open && setSelectedPillar(null)}
        />
      )}
    </>
  );
}
