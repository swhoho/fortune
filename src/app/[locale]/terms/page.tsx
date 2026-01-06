import { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: '이용약관',
  description: "Master's Insight AI 서비스 이용약관",
};

/**
 * 이용약관 페이지
 */
export default function TermsPage() {
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

          <h1 className="mb-8 text-2xl font-bold text-white">이용약관</h1>

          <div className="space-y-8 text-sm leading-relaxed text-gray-300">
            {/* 제1조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제1조 (목적)</h2>
              <p>
                본 약관은 갓생제조기(이하 &quot;회사&quot;)가 제공하는 Master&apos;s Insight AI
                서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및
                책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제2조 (정의)</h2>
              <ol className="list-inside list-decimal space-y-2">
                <li>
                  &quot;서비스&quot;란 회사가 제공하는 AI 기반 사주 분석 및 관련 콘텐츠 서비스를
                  의미합니다.
                </li>
                <li>&quot;이용자&quot;란 본 약관에 동의하고 서비스를 이용하는 자를 의미합니다.</li>
                <li>
                  &quot;크레딧&quot;이란 서비스 이용을 위해 구매하는 가상의 결제 수단을 의미합니다.
                </li>
                <li>
                  &quot;콘텐츠&quot;란 서비스를 통해 제공되는 사주 분석 리포트, AI 상담 내용 등 모든
                  정보를 의미합니다.
                </li>
              </ol>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제3조 (약관의 효력 및 변경)</h2>
              <ol className="list-inside list-decimal space-y-2">
                <li>
                  본 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력이 발생합니다.
                </li>
                <li>
                  회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있으며,
                  변경된 약관은 제1항과 같은 방법으로 공지합니다.
                </li>
                <li>
                  이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수
                  있습니다.
                </li>
              </ol>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제4조 (서비스의 제공)</h2>
              <ol className="list-inside list-decimal space-y-2">
                <li>
                  회사는 다음과 같은 서비스를 제공합니다:
                  <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
                    <li>AI 기반 사주 분석 리포트</li>
                    <li>연간/월간/일간 운세 분석</li>
                    <li>궁합 분석</li>
                    <li>AI 상담 서비스</li>
                    <li>기타 회사가 정하는 서비스</li>
                  </ul>
                </li>
                <li>
                  서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 단, 시스템 점검 등의
                  사유로 일시 중단될 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제5조 (크레딧 구매 및 사용)</h2>
              <ol className="list-inside list-decimal space-y-2">
                <li>이용자는 서비스 이용을 위해 크레딧을 구매할 수 있습니다.</li>
                <li>구매한 크레딧은 서비스 내에서만 사용 가능하며, 현금으로 환급되지 않습니다.</li>
                <li>크레딧의 유효기간은 구매일로부터 5년입니다.</li>
                <li>
                  각 서비스별 필요 크레딧은 서비스 화면에 명시되며, 회사는 이를 변경할 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제6조 (이용자의 의무)</h2>
              <ol className="list-inside list-decimal space-y-2">
                <li>이용자는 서비스 이용 시 정확한 정보를 제공해야 합니다.</li>
                <li>
                  이용자는 다음 행위를 해서는 안 됩니다:
                  <ul className="ml-6 mt-2 list-inside list-disc space-y-1">
                    <li>허위 정보 입력</li>
                    <li>타인의 정보 도용</li>
                    <li>서비스의 정상적인 운영 방해</li>
                    <li>콘텐츠의 무단 복제, 배포, 상업적 이용</li>
                    <li>기타 법령 또는 공서양속에 반하는 행위</li>
                  </ul>
                </li>
              </ol>
            </section>

            {/* 제7조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제7조 (면책사항)</h2>
              <ol className="list-inside list-decimal space-y-2">
                <li>
                  본 서비스에서 제공하는 사주 분석 결과는 참고용 정보이며, 의사결정의 최종 책임은
                  이용자에게 있습니다.
                </li>
                <li>
                  회사는 서비스 이용으로 인해 발생한 손해에 대해 법령에 특별한 규정이 없는 한 책임을
                  지지 않습니다.
                </li>
                <li>
                  천재지변, 시스템 장애 등 불가항력적인 사유로 서비스 제공이 불가능한 경우 회사는
                  책임을 지지 않습니다.
                </li>
              </ol>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제8조 (분쟁해결)</h2>
              <ol className="list-inside list-decimal space-y-2">
                <li>회사와 이용자 간에 발생한 분쟁은 상호 협의하여 해결합니다.</li>
                <li>
                  협의가 이루어지지 않을 경우 관할 법원은 회사의 소재지를 관할하는 법원으로 합니다.
                </li>
              </ol>
            </section>

            {/* 부칙 */}
            <section className="border-t border-[#333] pt-6">
              <h2 className="mb-3 text-lg font-semibold text-white">부칙</h2>
              <p>본 약관은 2026년 1월 6일부터 시행합니다.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
