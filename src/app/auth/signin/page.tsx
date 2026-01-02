'use client';

/**
 * 로그인 페이지
 */
import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-[#d4af37]/20">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-[#1a1a1a]">로그인</CardTitle>
        <CardDescription>Master&apos;s Insight AI에 오신 것을 환영합니다</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#d4af37] text-white hover:bg-[#b8972f]"
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link href="/auth/signup" className="text-[#d4af37] hover:underline">
            회원가입
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="w-full max-w-md border-[#d4af37]/20">
      <CardHeader className="text-center">
        <div className="mx-auto h-8 w-24 animate-pulse rounded bg-gray-100" />
        <div className="mx-auto mt-2 h-4 w-48 animate-pulse rounded bg-gray-100" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-4">
      <Suspense fallback={<LoadingFallback />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
