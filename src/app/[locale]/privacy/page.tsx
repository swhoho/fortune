import { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: "Master's Insight AI 개인정보처리방침",
};

/**
 * 개인정보처리방침 페이지
 */
export default function PrivacyPage() {
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

          <h1 className="mb-8 text-2xl font-bold text-white">개인정보처리방침</h1>

          <div className="space-y-8 text-sm leading-relaxed text-gray-300">
            {/* 서문 */}
            <section>
              <p>
                갓생제조기(이하 &quot;회사&quot;)는 개인정보보호법에 따라 이용자의 개인정보 보호 및
                권익을 보호하고 개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과
                같은 처리방침을 두고 있습니다.
              </p>
            </section>

            {/* 제1조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">
                제1조 (수집하는 개인정보 항목)
              </h2>
              <p className="mb-3">회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다:</p>
              <div className="space-y-4">
                <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
                  <h3 className="mb-2 font-semibold text-white">필수 수집 항목</h3>
                  <ul className="list-inside list-disc space-y-1 text-gray-400">
                    <li>이메일 주소 (회원가입, 로그인)</li>
                    <li>생년월일, 출생시간, 성별 (사주 분석)</li>
                    <li>이름 또는 닉네임 (프로필 관리)</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
                  <h3 className="mb-2 font-semibold text-white">자동 수집 항목</h3>
                  <ul className="list-inside list-disc space-y-1 text-gray-400">
                    <li>서비스 이용 기록, 접속 로그</li>
                    <li>기기 정보 (브라우저 종류, OS)</li>
                    <li>쿠키, 접속 IP 정보</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
                  <h3 className="mb-2 font-semibold text-white">결제 시 수집 항목</h3>
                  <ul className="list-inside list-disc space-y-1 text-gray-400">
                    <li>결제 기록 (결제 대행사를 통해 처리)</li>
                    <li>회사는 카드번호 등 결제 정보를 직접 저장하지 않습니다</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">
                제2조 (개인정보의 수집 및 이용 목적)
              </h2>
              <ul className="list-inside list-disc space-y-2">
                <li>
                  <strong className="text-white">서비스 제공:</strong> 사주 분석 리포트 생성, AI
                  상담 제공
                </li>
                <li>
                  <strong className="text-white">회원 관리:</strong> 회원제 서비스 이용, 본인 확인,
                  부정 이용 방지
                </li>
                <li>
                  <strong className="text-white">결제 처리:</strong> 크레딧 구매, 환불 처리
                </li>
                <li>
                  <strong className="text-white">서비스 개선:</strong> 신규 기능 개발, 서비스 품질
                  향상
                </li>
                <li>
                  <strong className="text-white">고객 지원:</strong> 문의 응대, 공지사항 전달
                </li>
              </ul>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">
                제3조 (개인정보의 보유 및 이용 기간)
              </h2>
              <p className="mb-3">
                회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이
                파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는 경우 아래와 같이 보관합니다:
              </p>
              <ul className="list-inside list-disc space-y-2 text-gray-400">
                <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
                <li>웹사이트 방문기록: 3개월 (통신비밀보호법)</li>
              </ul>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">
                제4조 (개인정보의 제3자 제공)
              </h2>
              <p>
                회사는 이용자의 개인정보를 제1조에서 명시한 목적 범위 내에서만 처리하며, 이용자의
                사전 동의 없이는 본래의 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다. 단,
                다음의 경우는 예외로 합니다:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-gray-400">
                <li>이용자가 사전에 동의한 경우</li>
                <li>
                  법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라
                  수사기관의 요구가 있는 경우
                </li>
              </ul>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제5조 (개인정보처리의 위탁)</h2>
              <p className="mb-3">
                회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="px-4 py-2 text-left text-white">수탁업체</th>
                      <th className="px-4 py-2 text-left text-white">위탁 업무</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-400">
                    <tr className="border-b border-[#222]">
                      <td className="px-4 py-2">Supabase Inc.</td>
                      <td className="px-4 py-2">데이터베이스 호스팅, 인증 서비스</td>
                    </tr>
                    <tr className="border-b border-[#222]">
                      <td className="px-4 py-2">Stripe, Inc.</td>
                      <td className="px-4 py-2">결제 처리</td>
                    </tr>
                    <tr className="border-b border-[#222]">
                      <td className="px-4 py-2">Google LLC</td>
                      <td className="px-4 py-2">AI 분석 처리 (Gemini API)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">Vercel Inc.</td>
                      <td className="px-4 py-2">웹 호스팅</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제6조 (이용자의 권리)</h2>
              <p className="mb-3">
                이용자(또는 법정대리인)는 언제든지 다음의 권리를 행사할 수 있습니다:
              </p>
              <ul className="list-inside list-disc space-y-2">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리정지 요구</li>
              </ul>
              <p className="mt-3 text-gray-400">
                위 권리 행사는 이메일(asolid@gmail.com)을 통해 요청하실 수 있으며, 회사는 지체 없이
                조치하겠습니다.
              </p>
            </section>

            {/* 제7조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">
                제7조 (개인정보의 파기 절차 및 방법)
              </h2>
              <ol className="list-inside list-decimal space-y-2">
                <li>
                  <strong className="text-white">파기 절차:</strong> 이용자의 개인정보는 목적 달성
                  후 별도의 DB에 옮겨져 내부 방침 및 관련 법령에 따라 일정 기간 저장된 후
                  파기됩니다.
                </li>
                <li>
                  <strong className="text-white">파기 방법:</strong> 전자적 파일 형태의 정보는
                  복구할 수 없는 방법으로 영구 삭제하며, 종이에 출력된 개인정보는 분쇄기로
                  분쇄하거나 소각합니다.
                </li>
              </ol>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">
                제8조 (개인정보의 안전성 확보 조치)
              </h2>
              <p className="mb-3">
                회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
              </p>
              <ul className="list-inside list-disc space-y-2 text-gray-400">
                <li>개인정보의 암호화</li>
                <li>해킹 등에 대비한 기술적 대책</li>
                <li>개인정보에 대한 접근 제한</li>
                <li>접속기록의 보관 및 위변조 방지</li>
              </ul>
            </section>

            {/* 제9조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제9조 (쿠키의 사용)</h2>
              <p className="mb-3">
                회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 쿠키(cookie)를 사용합니다.
              </p>
              <ul className="list-inside list-disc space-y-2 text-gray-400">
                <li>쿠키는 웹사이트가 이용자의 브라우저에 보내는 소량의 정보입니다.</li>
                <li>이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.</li>
                <li>쿠키 저장을 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.</li>
              </ul>
            </section>

            {/* 제10조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">
                제10조 (개인정보 보호책임자)
              </h2>
              <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-4">
                <ul className="space-y-2 text-gray-400">
                  <li>성명: 박유민</li>
                  <li>직책: 대표</li>
                  <li>이메일: asolid@gmail.com</li>
                  <li>전화: 070-7954-2284</li>
                </ul>
              </div>
            </section>

            {/* 제11조 */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-white">제11조 (권익침해 구제방법)</h2>
              <p className="mb-3">
                이용자는 개인정보침해로 인한 피해를 구제받기 위해 아래 기관에 분쟁 해결이나 상담을
                신청할 수 있습니다:
              </p>
              <ul className="list-inside list-disc space-y-2 text-gray-400">
                <li>개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)</li>
                <li>개인정보분쟁조정위원회 (www.kopico.go.kr / 1833-6972)</li>
                <li>대검찰청 사이버수사과 (www.spo.go.kr / 국번없이 1301)</li>
                <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 국번없이 182)</li>
              </ul>
            </section>

            {/* 시행일 */}
            <section className="border-t border-[#333] pt-6">
              <p className="text-gray-500">본 개인정보처리방침은 2026년 1월 6일부터 시행합니다.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
