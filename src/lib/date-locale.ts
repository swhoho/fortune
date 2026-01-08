/**
 * date-fns 로케일 매핑 유틸리티
 * next-intl 로케일을 date-fns 로케일로 변환
 */
import { ko, enUS, ja, zhCN, zhTW } from 'date-fns/locale';
import type { Locale } from 'date-fns';

/** 지원 로케일 매핑 */
const localeMap: Record<string, Locale> = {
  ko,
  en: enUS,
  ja,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

/**
 * next-intl 로케일 코드를 date-fns Locale 객체로 변환
 * @param locale - next-intl 로케일 코드 (ko, en, ja, zh-CN, zh-TW)
 * @returns date-fns Locale 객체
 */
export function getDateLocale(locale: string): Locale {
  return localeMap[locale] || ko;
}
