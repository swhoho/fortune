import { LanguageSwitcher } from '@/components/language-switcher';

/**
 * 온보딩 레이아웃
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* 상단 헤더 - Safe Area 적용 (Capacitor 앱용) */}
      <header
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 pb-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))' }}
      >
        <div /> {/* 공간 확보용 */}
        <h1 className="font-serif text-lg font-bold tracking-widest text-[#1a1a1a]">
          사주 30년
        </h1>
        <LanguageSwitcher />
      </header>

      {/* 콘텐츠 - Safe Area 고려한 padding */}
      <main style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>{children}</main>
    </div>
  );
}
