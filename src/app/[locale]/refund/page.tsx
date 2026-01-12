import { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/routing';
import { ArrowLeft, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: '환불정책',
  description: "Master's Insight AI 서비스 환불정책",
};

/**
 * 환불정책 페이지
 */
export default function RefundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          {/* 뒤로가기 */}
          <Link
            href="/home"
            className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Link>

          <h1 className="mb-8 text-2xl font-bold text-white">환불정책</h1>

          <div className="space-y-8 text-sm leading-relaxed text-gray-300">
            {/* 핵심 안내 박스 */}
            <div className="rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#d4af37]" />
                <div>
                  <h2 className="mb-2 font-semibold text-white">환불 핵심 원칙</h2>
                  <p className="text-gray-300">
                    구매하신 크레딧은{' '}
                    <strong className="text-white">콘텐츠를 이용하지 않은 경우에만</strong> 환불이
                    가능합니다. 사주 분석 리포트, AI 상담 등 콘텐츠를 1회라도 이용하신 경우 해당
                    크레딧은 환불되지 않습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 환불 가능/불가 */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-white">환불 가능 여부</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* 환불 가능 */}
                <div className="rounded-lg border border-green-900/50 bg-green-950/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">환불 가능</span>
                  </div>
                  <ul className="space-y-2 text-gray-300">
                    <li>• 크레딧 구매 후 콘텐츠 미이용</li>
                    <li>• 결제 오류로 인한 중복 결제</li>
                  </ul>
                </div>

                {/* 환불 불가 */}
                <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-red-400">
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">환불 불가</span>
                  </div>
                  <ul className="space-y-2 text-gray-300">
                    <li>• 사주 분석 리포트 생성 후</li>
                    <li>• AI 상담 크레딧 사용 후</li>
                    <li>• 궁합/신년 분석 이용 후</li>
                    <li>• 일부 크레딧 사용 후 잔여분</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 환불 절차 */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-white">환불 절차</h2>
              <ol className="list-inside list-decimal space-y-3">
                <li>
                  <strong className="text-white">환불 신청:</strong> 고객센터 이메일
                  (goblincallcontact@gmail.com)로 환불 요청
                  <ul className="ml-6 mt-2 list-inside list-disc text-gray-400">
                    <li>성함, 이메일, 결제일, 결제금액, 환불 사유 기재</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-white">검토:</strong> 영업일 기준 1~3일 내 환불 가능 여부
                  검토
                </li>
                <li>
                  <strong className="text-white">환불 처리:</strong> 승인 시 결제 수단에 따라 3~7
                  영업일 내 환불 완료
                  <ul className="ml-6 mt-2 list-inside list-disc text-gray-400">
                    <li>신용카드: 카드사에 따라 3~7 영업일</li>
                    <li>해외결제: 최대 14 영업일 소요 가능</li>
                  </ul>
                </li>
              </ol>
            </section>

            {/* 환불 금액 */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-white">환불 금액 산정</h2>
              <div className="space-y-3">
                <p>환불 금액은 아래와 같이 산정됩니다:</p>
                <ul className="list-inside list-disc space-y-2">
                  <li>
                    <strong className="text-white">전액 환불:</strong> 크레딧 미사용 시 결제금액
                    전액
                  </li>
                  <li>
                    <strong className="text-white">부분 환불:</strong> 콘텐츠 이용 시 환불 불가
                    (잔여 크레딧 포함)
                  </li>
                  <li>
                    <strong className="text-white">보너스 크레딧:</strong> 프로모션으로 지급된
                    보너스 크레딧은 환불 대상에서 제외
                  </li>
                </ul>
              </div>
            </section>

            {/* 주의사항 */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-white">주의사항</h2>
              <ul className="list-inside list-disc space-y-2 text-gray-400">
                <li>환불 신청 전 반드시 크레딧 사용 내역을 확인해 주세요.</li>
                <li>콘텐츠 이용 여부는 서비스 이용 기록으로 확인됩니다.</li>
                <li>허위 또는 부정한 환불 신청 시 서비스 이용이 제한될 수 있습니다.</li>
                <li>본 환불정책은 관련 법령 및 회사 정책에 따라 변경될 수 있습니다.</li>
              </ul>
            </section>

            {/* 문의 */}
            <section className="rounded-lg border border-[#333] bg-[#1a1a1a] p-6">
              <h2 className="mb-3 text-lg font-semibold text-white">환불 문의</h2>
              <div className="space-y-2 text-gray-400">
                <p>전화: 070-7954-2284</p>
                <p className="text-xs">운영시간: 평일 10:00 ~ 18:00 (주말/공휴일 휴무)</p>
              </div>
            </section>

            {/* 시행일 */}
            <section className="border-t border-[#333] pt-6">
              <p className="text-gray-500">본 환불정책은 2026년 1월 6일부터 시행합니다.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
