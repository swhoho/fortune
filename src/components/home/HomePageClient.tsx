'use client';

/**
 * 홈 페이지 클라이언트 컴포넌트
 * 서버에서 인증 확인 후 렌더링 (클라이언트 워터폴 제거)
 * CSS 애니메이션 사용 (framer-motion 제거로 FCP 개선)
 */
import { useTranslations } from 'next-intl';
import { HomeMenuGrid } from '@/components/home/HomeMenuGrid';
import { ConsultationBanner } from '@/components/home/ConsultationBanner';
import { AppHeader, Footer } from '@/components/layout';
import { DailyFortuneCard } from '@/components/daily-fortune';
import { BRAND_COLORS } from '@/lib/constants/colors';

export function HomePageClient() {
  const tCommon = useTranslations('common');

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: BRAND_COLORS.secondary }}>
      {/* 메인 컨텐츠 */}
      <main className="relative flex-1">
        {/* 배경 그래디언트 장식 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* 우상단 금색 글로우 (정적 - 애니메이션 불필요) */}
          <div
            className="absolute -right-32 -top-32 h-80 w-80 rounded-full blur-3xl opacity-40"
            style={{
              background: `radial-gradient(circle, ${BRAND_COLORS.primary}30 0%, transparent 70%)`,
            }}
          />
          {/* 좌하단 금색 글로우 (정적 - 애니메이션 불필요) */}
          <div
            className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full blur-3xl opacity-25"
            style={{
              background: `radial-gradient(circle, ${BRAND_COLORS.primary}20 0%, transparent 70%)`,
            }}
          />
        </div>

        {/* 컨텐츠 */}
        <div className="relative z-10 mx-auto max-w-3xl">
          {/* 헤더 */}
          <AppHeader sticky={false} className="border-b-0 bg-transparent" />

          {/* 로고 영역 */}
          <div
            className="px-6 py-8 opacity-0 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-center gap-4">
              {/* 로고 아이콘 (한자 '命') */}
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl opacity-0 animate-scale-in"
                style={{
                  backgroundColor: `${BRAND_COLORS.primary}15`,
                  boxShadow: `0 0 40px ${BRAND_COLORS.primary}20`,
                  animationDelay: '0.2s',
                }}
              >
                <span className="font-serif text-3xl" style={{ color: BRAND_COLORS.primary }}>
                  命
                </span>
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-white">{tCommon('appName')}</h1>
                <p className="text-sm text-gray-500">Version 2.0</p>
              </div>
            </div>
          </div>

          {/* 오늘의 운세 카드 - 최상단 */}
          <section
            className="px-6 pb-4 opacity-0 animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <DailyFortuneCard />
          </section>

          {/* AI 상담 배너 */}
          <section className="px-6 pb-6">
            <ConsultationBanner delay={0.4} />
          </section>

          {/* 메뉴 그리드 */}
          <HomeMenuGrid />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
