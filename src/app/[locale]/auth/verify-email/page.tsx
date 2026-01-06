'use client';

/**
 * 이메일 확인 안내 페이지
 * 회원가입 후 이메일 인증이 필요한 경우 표시
 */
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, CheckCircle } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [isLoading, setIsLoading] = useState(false);
  const [isResent, setIsResent] = useState(false);
  const [error, setError] = useState('');

  const handleResendEmail = async () => {
    if (!email) {
      setError('이메일 주소가 없습니다.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setIsResent(true);
      }
    } catch {
      setError('이메일 재전송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/10">
            <Mail className="h-8 w-8 text-[#d4af37]" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">이메일을 확인해주세요</CardTitle>
          <CardDescription className="text-gray-400">
            회원가입을 완료하려면 이메일 인증이 필요합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-[#242424] p-4 text-center">
            <p className="text-sm text-gray-400">인증 메일이 발송된 주소</p>
            <p className="mt-1 font-medium text-white">{email || '(이메일 주소 없음)'}</p>
          </div>

          <div className="space-y-2 text-sm text-gray-400">
            <p>1. 이메일 수신함을 확인해주세요</p>
            <p>2. 인증 링크를 클릭하면 가입이 완료됩니다</p>
            <p>3. 스팸 폴더도 확인해보세요</p>
          </div>

          {error && (
            <div className="rounded-md bg-red-900/30 p-3 text-sm text-red-400">{error}</div>
          )}

          {isResent ? (
            <div className="flex items-center justify-center gap-2 rounded-md bg-green-900/30 p-3 text-sm text-green-400">
              <CheckCircle className="h-4 w-4" />
              이메일이 재전송되었습니다
            </div>
          ) : (
            <Button
              onClick={handleResendEmail}
              disabled={isLoading || !email}
              variant="outline"
              className="w-full border-[#333] bg-transparent text-white hover:bg-[#242424]"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? '전송 중...' : '인증 메일 재전송'}
            </Button>
          )}

          <div className="pt-4 text-center">
            <Link href="/auth/signin" className="text-sm text-[#d4af37] hover:underline">
              로그인 페이지로 이동
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VerifyEmailLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/10">
            <Mail className="h-8 w-8 text-[#d4af37]" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">이메일을 확인해주세요</CardTitle>
          <CardDescription className="text-gray-400">로딩 중...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
