'use client';

/**
 * 로그인 페이지
 * Supabase Auth (Email + Google) 사용
 */
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  const callbackUrl = searchParams.get('callbackUrl') || '/onboarding/step1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        },
      });

      if (error) {
        setError(error.message);
        setIsGoogleLoading(false);
      }
      // 성공 시 자동 리다이렉트되므로 로딩 상태 유지
    } catch {
      setError('Google 로그인 중 오류가 발생했습니다.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-[#d4af37]/20">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-[#1a1a1a]">로그인</CardTitle>
        <CardDescription>Master&apos;s Insight AI에 오신 것을 환영합니다</CardDescription>
      </CardHeader>
      <CardContent>
        {message === 'signup_success' && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">
            회원가입이 완료되었습니다. 로그인해주세요.
          </div>
        )}

        <div className="space-y-4">
          <GoogleSignInButton callbackUrl={callbackUrl} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">또는 이메일로 계속</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
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
                disabled={isLoading || isGoogleLoading}
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
                disabled={isLoading || isGoogleLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#d4af37] text-white hover:bg-[#b8972f]"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link href="/auth/signup" className="text-[#d4af37] hover:underline">
              회원가입
            </Link>
          </div>
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
