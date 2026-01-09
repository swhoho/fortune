'use client';

/**
 * 궁합 분석 - 우주적 배경 효과
 * 별빛과 미묘한 그라데이션으로 신비로운 분위기 연출
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 2; // 스크롤 고려
    };
    resize();
    window.addEventListener('resize', resize);

    // 별 생성
    const starCount = 80;
    starsRef.current = Array.from({ length: starCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      speed: Math.random() * 0.0003 + 0.0001,
    }));

    // 애니메이션 루프
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 별 그리기
      starsRef.current.forEach((star) => {
        // 반짝임 효과
        const twinkle = Math.sin(time * star.speed) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${star.opacity * twinkle})`;
        ctx.fill();

        // 별 빛 번짐 효과
        const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3);
        gradient.addColorStop(0, `rgba(212, 175, 55, ${star.opacity * twinkle * 0.5})`);
        gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <>
      {/* 메인 그라데이션 배경 */}
      <div className="pointer-events-none fixed inset-0 -z-20">
        {/* 기본 배경 */}
        <div className="absolute inset-0 bg-[#050508]" />

        {/* 상단 그라데이션 - 깊은 자주색 */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(75, 20, 50, 0.8), transparent)',
          }}
        />

        {/* 하단 그라데이션 - 깊은 남색 */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 100% 50% at 50% 120%, rgba(20, 30, 80, 0.8), transparent)',
          }}
        />

        {/* 중앙 금빛 하이라이트 */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(212, 175, 55, 0.3), transparent)',
          }}
        />
      </div>

      {/* 별 캔버스 */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ opacity: 0.8 }}
      />

      {/* 상단 빛 효과 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[400px] w-[600px] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.08) 0%, transparent 70%)',
        }}
      />
    </>
  );
}
