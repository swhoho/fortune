'use client';

/**
 * 인증 에러 페이지
 */
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'Configuration':
        return '서버 설정에 문제가 있습니다. 관리자에게 문의하세요.';
      case 'AccessDenied':
        return '접근이 거부되었습니다.';
      case 'Verification':
        return '인증 링크가 만료되었거나 이미 사용되었습니다.';
      case 'CredentialsSignin':
        return '이메일 또는 비밀번호가 올바르지 않습니다.';
      default:
        return '인증 중 오류가 발생했습니다.';
    }
  };

  return (
    <Card className="w-full max-w-md border-red-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-red-600">인증 오류</CardTitle>
        <CardDescription>{getErrorMessage(error)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button asChild className="w-full bg-[#d4af37] text-white hover:bg-[#b8972f]">
          <Link href="/auth/signin">다시 로그인</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="w-full max-w-md border-gray-200">
      <CardHeader className="text-center">
        <div className="mx-auto h-8 w-32 animate-pulse rounded bg-gray-100" />
        <div className="mx-auto mt-2 h-4 w-48 animate-pulse rounded bg-gray-100" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
      </CardContent>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-4">
      <Suspense fallback={<LoadingFallback />}>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}
