import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

/**
 * 지원 언어 목록
 * - ko: 한국어 (기본)
 * - en: 영어
 * - ja: 일본어
 * - zh-CN: 중국어 간체
 * - zh-TW: 중국어 번체
 */
export const locales = ['ko', 'en', 'ja', 'zh-CN', 'zh-TW'] as const;
export type Locale = (typeof locales)[number];

/**
 * i18n 라우팅 설정
 */
export const routing = defineRouting({
  locales,
  defaultLocale: 'ko',
  // 기본 언어(ko)는 URL prefix 없이 접근 가능
  // /en, /ja, /zh-CN, /zh-TW는 prefix 필요
  localePrefix: 'as-needed',
});

/**
 * 국제화된 네비게이션 헬퍼
 * next/link, next/navigation 대신 사용
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
