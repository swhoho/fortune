'use client';

/**
 * 오늘의 운세 점수 게이지 컴포넌트
 * 0-100 점수를 시각적 원형 게이지로 표시
 */
import { motion } from 'framer-motion';

interface FortuneScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

const SIZE_CONFIG = {
  sm: { width: 80, strokeWidth: 6, fontSize: 'text-xl' },
  md: { width: 120, strokeWidth: 8, fontSize: 'text-3xl' },
  lg: { width: 160, strokeWidth: 10, fontSize: 'text-4xl' },
};

/**
 * 점수에 따른 색상 반환
 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#4ade80'; // 녹색 (木)
  if (score >= 60) return '#d4af37'; // 금색
  if (score >= 40) return '#f59e0b'; // 주황 (土)
  if (score >= 20) return '#ef4444'; // 빨강 (火)
  return '#6b7280'; // 회색
}

/**
 * 점수에 따른 라벨 반환
 */
function getScoreLabel(score: number): string {
  if (score >= 90) return '대길';
  if (score >= 75) return '길';
  if (score >= 55) return '보통';
  if (score >= 35) return '흉';
  return '대흉';
}

export function FortuneScoreGauge({
  score,
  size = 'md',
  showLabel = true,
  label,
}: FortuneScoreGaugeProps) {
  const config = SIZE_CONFIG[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        {/* 배경 원 */}
        <svg width={config.width} height={config.width} className="rotate-[-90deg]">
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="#333"
            strokeWidth={config.strokeWidth}
          />
          {/* 진행 원 */}
          <motion.circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              filter: `drop-shadow(0 0 8px ${color}50)`,
            }}
          />
        </svg>
        {/* 중앙 점수 */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <span className={`font-bold ${config.fontSize}`} style={{ color }}>
            {score}
          </span>
          {showLabel && (
            <span className="text-xs text-gray-400">{label || getScoreLabel(score)}</span>
          )}
        </motion.div>
      </div>
    </div>
  );
}
