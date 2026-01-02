import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from '@/lib/providers';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: "Master's Insight AI | 30년 명리학 거장이 인정한 AI 사주 분석",
  description:
    '동양 명리학의 지혜와 최신 AI 기술이 만나 당신의 사주를 분석합니다. 운명의 흐름을 읽고, 더 나은 선택을 하세요.',
  keywords: ['사주', '명리학', 'AI 사주', '운세', '사주팔자', 'Four Pillars', 'BaZi'],
  openGraph: {
    title: "Master's Insight AI",
    description: '30년 명리학 거장이 인정한 AI 사주 분석 서비스',
    type: 'website',
    locale: 'ko_KR',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
