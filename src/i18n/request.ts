import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

/**
 * 서버 요청 시 로케일 설정
 * next-intl 플러그인에 의해 자동으로 호출됨
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // 요청된 로케일 확인
  const requested = await requestLocale;

  // 유효한 로케일인지 검증, 아니면 기본 로케일 사용
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // 해당 언어의 번역 파일 로드
    messages: (await import(`../../locales/${locale}.json`)).default,
  };
});
