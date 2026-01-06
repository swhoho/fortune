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
  const callbackUrl = searchParams.get('callbackUrl') || '/home';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsEmailNotConfirmed(false);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // 이메일 미확인 에러 처리
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setIsEmailNotConfirmed(true);
          setError('이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.');
        } else if (error.message.toLowerCase().includes('invalid login credentials')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          setError(error.message);
        }
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

  // handleGoogleSignIn은 GoogleSignInButton 컴포넌트에서 처리됨

  return (
    <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white">로그인</CardTitle>
        <CardDescription className="text-gray-400">
          Master&apos;s Insight AI에 오신 것을 환영합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message === 'signup_success' && (
          <div className="mb-4 rounded-md bg-green-900/30 p-3 text-sm text-green-400">
            회원가입이 완료되었습니다. 로그인해주세요.
          </div>
        )}

        <div className="space-y-4">
          <GoogleSignInButton callbackUrl={callbackUrl} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#333]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a1a1a] px-2 text-gray-500">또는 이메일로 계속</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-900/30 p-3 text-sm text-red-400">
                {error}
                {isEmailNotConfirmed && (
                  <Link
                    href={`/auth/verify-email?email=${encodeURIComponent(email)}`}
                    className="mt-2 block text-[#d4af37] hover:underline"
                  >
                    인증 메일 재전송하기
                  </Link>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || isGoogleLoading}
                className="border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-300">
                  비밀번호
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-gray-400 hover:text-[#d4af37]"
                >
                  비밀번호 찾기
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || isGoogleLoading}
                className="border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500"
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

          <div className="mt-4 text-center text-sm text-gray-400">
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
    <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
      <CardHeader className="text-center">
        <div className="mx-auto h-8 w-24 animate-pulse rounded bg-[#242424]" />
        <div className="mx-auto mt-2 h-4 w-48 animate-pulse rounded bg-[#242424]" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-10 w-full animate-pulse rounded bg-[#242424]" />
        <div className="h-10 w-full animate-pulse rounded bg-[#242424]" />
        <div className="h-10 w-full animate-pulse rounded bg-[#242424]" />
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <Suspense fallback={<LoadingFallback />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
