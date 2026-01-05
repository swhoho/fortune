'use client';

/**
 * Crisp 실시간 채팅 위젯
 * - 고객 지원용 라이브 채팅
 * - 다국어 지원 (next-intl 로케일 연동)
 */
import { useEffect } from 'react';
import { Crisp } from 'crisp-sdk-web';
import { useLocale } from 'next-intl';

/** Crisp Website ID */
const CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

export function CrispChat() {
  const locale = useLocale();

  useEffect(() => {
    if (!CRISP_WEBSITE_ID) {
      console.warn('[Crisp] NEXT_PUBLIC_CRISP_WEBSITE_ID 환경변수가 설정되지 않았습니다.');
      return;
    }

    // Crisp 초기화
    Crisp.configure(CRISP_WEBSITE_ID, {
      autoload: true,
      locale: locale,
    });
  }, [locale]);

  return null;
}
