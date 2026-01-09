'use client';

/**
 * 궁합 점수 원형 게이지
 * 황금빛 그라데이션 링과 애니메이션으로 점수 시각화
 */

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface ScoreGaugeProps {
  score: number;
  grade: {
    label: string;
    color: string;
  };
  size?: number;
}

export function ScoreGauge({ score, grade, size = 180 }: ScoreGaugeProps) {
  const [isVisible, setIsVisible] = useState(false);

  // 점수 애니메이션
  const springScore = useSpring(0, {
    stiffness: 50,
    damping: 15,
  });

  const displayScore = useTransform(springScore, (val) => Math.round(val));

  useEffect(() => {
    setIsVisible(true);
    springScore.set(score);
  }, [score, springScore]);

  // SVG 설정
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // 점수에 따른 색상
  const getGradientColors = () => {
    if (score >= 85) return ['#ff6b6b', '#ee5a5a', '#dc4444']; // 빨강 (천생연분)
    if (score >= 70) return ['#d4af37', '#c9a227', '#b8941f']; // 금색 (좋은 인연)
    if (score >= 55) return ['#f0c040', '#e0b030', '#d0a020']; // 연한 금색 (보통)
    if (score >= 40) return ['#f97316', '#ea6a0e', '#d85d06']; // 주황 (노력 필요)
    return ['#8b5cf6', '#7c4de6', '#6d3ed6']; // 보라 (주의)
  };

  const gradientColors = getGradientColors();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* 배경 글로우 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(circle, ${gradientColors[0]}20 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          {/* 메인 그라데이션 */}
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="50%" stopColor={gradientColors[1]} />
            <stop offset="100%" stopColor={gradientColors[2]} />
          </linearGradient>

          {/* 글로우 필터 */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 외곽 그라데이션 */}
          <linearGradient id="outerRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(212, 175, 55, 0.3)" />
            <stop offset="100%" stopColor="rgba(212, 175, 55, 0.1)" />
          </linearGradient>
        </defs>

        {/* 외곽 장식 링 */}
        <circle
          cx={center}
          cy={center}
          r={radius + 12}
          fill="none"
          stroke="url(#outerRingGradient)"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* 배경 트랙 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />

        {/* 점수 진행 바 */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: isVisible
              ? circumference - (circumference * score) / 100
              : circumference,
          }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
          filter="url(#glow)"
        />

        {/* 끝점 장식 */}
        {score > 5 && (
          <motion.circle
            cx={center}
            cy={center - radius}
            r={4}
            fill={gradientColors[0]}
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ delay: 1.5 }}
            style={{
              transformOrigin: `${center}px ${center}px`,
              transform: `rotate(${(score / 100) * 360}deg)`,
            }}
          />
        )}
      </svg>

      {/* 중앙 점수 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="bg-gradient-to-b from-white via-white to-gray-300 bg-clip-text text-5xl font-bold tracking-tight text-transparent"
          style={{
            fontFamily: "'Pretendard Variable', sans-serif",
            textShadow: '0 2px 20px rgba(212, 175, 55, 0.3)',
          }}
        >
          <motion.span>{displayScore}</motion.span>
        </motion.span>
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-1 text-sm font-medium"
          style={{ color: grade.color }}
        >
          {grade.label}
        </motion.span>
      </div>
    </div>
  );
}
