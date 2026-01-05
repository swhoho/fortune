'use client';

/**
 * Crisp 실시간 채팅 위젯
 * - 고객 지원용 라이브 채팅
 * - 마이페이지에서만 노출
 * - 다국어 지원 (next-intl 로케일 연동)
 */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Crisp } from 'crisp-sdk-web';
import { useLocale } from 'next-intl';

/** Crisp Website ID */
const CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

export function CrispChat() {
  const locale = useLocale();
  const pathname = usePathname();

  /** 마이페이지 경로인지 확인 */
  const isMypage = pathname?.includes('/mypage');

  useEffect(() => {
    if (!CRISP_WEBSITE_ID) {
      console.warn('[Crisp] NEXT_PUBLIC_CRISP_WEBSITE_ID 환경변수가 설정되지 않았습니다.');
      return;
    }

    // Crisp 초기화 (최초 1회)
    if (!window.$crisp) {
      Crisp.configure(CRISP_WEBSITE_ID, {
        autoload: false,
        locale: locale,
      });
    }

    // 마이페이지에서만 채팅 위젯 표시
    if (isMypage) {
      Crisp.load();
      Crisp.chat.show();
    } else {
      Crisp.chat.hide();
    }
  }, [locale, isMypage]);

  return null;
}
