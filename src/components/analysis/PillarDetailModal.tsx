'use client';

/**
 * 기둥 상세 모달 컴포넌트
 * 각 기둥(연/월/일/시주)의 상세 정보를 표시
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ELEMENT_COLORS,
  ELEMENT_TEXT_COLORS,
  ELEMENT_NAMES,
  type ElementKey,
} from '@/lib/constants/colors';
import type { PillarHanja } from '@/types/saju';

/** 천간 → 오행 매핑 */
const STEM_ELEMENT: Record<string, ElementKey> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
};

/** 천간 → 음양 매핑 */
const STEM_YINYANG: Record<string, string> = {
  甲: '양',
  乙: '음',
  丙: '양',
  丁: '음',
  戊: '양',
  己: '음',
  庚: '양',
  辛: '음',
  壬: '양',
  癸: '음',
};

/** 지지 → 오행 매핑 */
const BRANCH_ELEMENT: Record<string, ElementKey> = {
  寅: '木',
  卯: '木',
  巳: '火',
  午: '火',
  辰: '土',
  戌: '土',
  丑: '土',
  未: '土',
  申: '金',
  酉: '金',
  亥: '水',
  子: '水',
};

/** 지지 → 음양 매핑 */
const BRANCH_YINYANG: Record<string, string> = {
  子: '양',
  丑: '음',
  寅: '양',
  卯: '음',
  辰: '양',
  巳: '음',
  午: '양',
  未: '음',
  申: '양',
  酉: '음',
  戌: '양',
  亥: '음',
};

/** 기둥 이름 매핑 */
const PILLAR_NAMES: Record<string, { ko: string; hanja: string }> = {
  year: { ko: '연주', hanja: '年柱' },
  month: { ko: '월주', hanja: '月柱' },
  day: { ko: '일주', hanja: '日柱' },
  hour: { ko: '시주', hanja: '時柱' },
};

interface PillarDetailModalProps {
  /** 기둥 데이터 */
  pillar: PillarHanja | null;
  /** 지장간 데이터 (3개 천간) */
  jijanggan: string[];
  /** 기둥 키 (year, month, day, hour) */
  pillarKey: string;
  /** 모달 열림 상태 */
  open: boolean;
  /** 모달 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
}

export function PillarDetailModal({
  pillar,
  jijanggan,
  pillarKey,
  open,
  onOpenChange,
}: PillarDetailModalProps) {
  if (!pillar) return null;

  const pillarName = PILLAR_NAMES[pillarKey] || { ko: pillarKey, hanja: '' };
  const stemElement = STEM_ELEMENT[pillar.stem] || '土';
  const stemYinyang = STEM_YINYANG[pillar.stem] || '양';
  const branchElement = BRANCH_ELEMENT[pillar.branch] || '土';
  const branchYinyang = BRANCH_YINYANG[pillar.branch] || '양';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {pillarName.ko} ({pillarName.hanja})
          </DialogTitle>
          <DialogDescription>사주팔자의 {pillarName.ko} 상세 정보</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 천간 섹션 */}
          <div>
            <h4 className="mb-3 text-sm font-medium text-gray-500">천간 (天干)</h4>
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-lg text-3xl font-bold shadow-md"
                style={{
                  backgroundColor: ELEMENT_COLORS[stemElement],
                  color: ELEMENT_TEXT_COLORS[stemElement],
                }}
              >
                {pillar.stem}
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium">{ELEMENT_NAMES[stemElement]}</p>
                <p className="text-sm text-gray-500">
                  {stemYinyang === '양' ? '양(陽)' : '음(陰)'}
                </p>
              </div>
            </div>
          </div>

          {/* 지지 섹션 */}
          <div>
            <h4 className="mb-3 text-sm font-medium text-gray-500">지지 (地支)</h4>
            <div className="flex items-center gap-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-lg text-3xl font-bold shadow-md"
                style={{
                  backgroundColor: ELEMENT_COLORS[branchElement],
                  color: ELEMENT_TEXT_COLORS[branchElement],
                }}
              >
                {pillar.branch}
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium">{ELEMENT_NAMES[branchElement]}</p>
                <p className="text-sm text-gray-500">
                  {branchYinyang === '양' ? '양(陽)' : '음(陰)'}
                </p>
              </div>
            </div>
          </div>

          {/* 지장간 섹션 */}
          <div>
            <h4 className="mb-3 text-sm font-medium text-gray-500">
              지장간 (支藏干)
              <span className="ml-2 text-xs text-gray-400">지지 속에 숨겨진 천간</span>
            </h4>
            <div className="flex gap-3">
              {jijanggan.map((char, index) => {
                const element = STEM_ELEMENT[char] || '土';
                return (
                  <div
                    key={index}
                    className="flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold shadow-sm"
                    style={{
                      backgroundColor: ELEMENT_COLORS[element],
                      color: ELEMENT_TEXT_COLORS[element],
                    }}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {jijanggan.map((char) => ELEMENT_NAMES[STEM_ELEMENT[char] || '土']).join(' · ')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
