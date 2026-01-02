/**
 * 온보딩 레이아웃
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* 상단 로고 */}
      <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center py-4">
        <h1 className="font-serif text-lg font-bold tracking-widest text-[#1a1a1a]">
          Master&apos;s Insight AI
        </h1>
      </header>

      {/* 콘텐츠 */}
      <main className="pt-16">{children}</main>
    </div>
  );
}
