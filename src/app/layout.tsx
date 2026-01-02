import type { Metadata } from 'next';
import './globals.css';

/**
 * 루트 레이아웃 (최소화)
 * 실제 레이아웃은 [locale]/layout.tsx에서 처리
 */
export const metadata: Metadata = {
  title: "Master's Insight AI",
  description: '30년 명리학 거장이 인정한 AI 사주 분석',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
