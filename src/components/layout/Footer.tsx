'use client';

/**
 * Footer 컴포넌트
 * - 토글형 사업자 정보
 * - 정책 링크 (이용약관, 환불정책, 개인정보처리방침)
 */
import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { ChevronUp, ChevronDown } from 'lucide-react';

/** 사업자 정보 */
const BUSINESS_INFO = {
  companyName: '갓생제조기',
  representative: '박유민',
  businessNumber: '761-23-01990',
  address: '경기도 용인시 수지구 신봉2로 154, 104동 2003호(신봉동, 힐스테이트 광교산)',
  phone: '070-2325-2325',
  email: 'asolid@gmail.com',
  // 통신판매업번호는 신고 후 추가 예정
  // sellerRegistration: '제 2026-용인수지-XXXX호',
};

/** 정책 링크 */
const POLICY_LINKS = [
  { href: '/terms', label: '이용약관' },
  { href: '/refund', label: '환불정책' },
  { href: '/privacy', label: '개인정보처리방침' },
];

export function Footer() {
  // 기본 펼친 상태 (나중에 false로 변경)
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <footer className="border-t border-[#333] bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* 사업자 정보 토글 버튼 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-400"
        >
          <span>{BUSINESS_INFO.companyName} 사업자 정보</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* 사업자 정보 (토글) */}
        {isExpanded && (
          <div className="mt-4 space-y-1.5 text-xs text-gray-500">
            <p>
              상호: {BUSINESS_INFO.companyName} | 대표: {BUSINESS_INFO.representative}
            </p>
            <p>주소: {BUSINESS_INFO.address}</p>
            <p>
              사업자등록번호: {BUSINESS_INFO.businessNumber}
              {/* 통신판매업번호 추가 시 아래 주석 해제 */}
              {/* {' | '}통신판매업번호: {BUSINESS_INFO.sellerRegistration} */}
            </p>
            <p>
              이메일: {BUSINESS_INFO.email} | 대표전화: {BUSINESS_INFO.phone}
            </p>
          </div>
        )}

        {/* 정책 링크 */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#222] pt-4">
          {POLICY_LINKS.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-gray-500 transition-colors hover:text-gray-400"
            >
              {link.label}
            </Link>
          ))}
          <span className="text-xs text-gray-600">
            © {new Date().getFullYear()} {BUSINESS_INFO.companyName}. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
