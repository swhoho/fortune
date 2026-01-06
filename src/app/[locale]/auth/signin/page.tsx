'use client';

/**
 * 로그인 페이지
 * Supabase Auth (Email + Google) 사용
 */
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Supabase 로그인 오류 메시지를 번역 키로 변환
 */
function getSignInErrorKey(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('email not confirmed')) {
    return 'emailNotConfirmed';
  }
  if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid credentials')) {
    return 'invalidCredentials';
  }
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    return 'rateLimitExceeded';
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'networkError';
  }

  return 'unknownError';
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.signin');
  const tSocial = useTranslations('auth.social');
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const errorKey = getSignInErrorKey(signInError.message);
        if (errorKey === 'emailNotConfirmed') {
          setIsEmailNotConfirmed(true);
        }
        setError(t(`errors.${errorKey}`));
      } else if (data.user) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError(t('errors.signinFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // handleGoogleSignIn은 GoogleSignInButton 컴포넌트에서 처리됨

  return (
    <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white">{t('title')}</CardTitle>
        <CardDescription className="text-gray-400">
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message === 'signup_success' && (
          <div className="mb-4 rounded-md bg-green-900/30 p-3 text-sm text-green-400">
            {t('signupSuccess')}
          </div>
        )}

        <div className="space-y-4">
          <GoogleSignInButton callbackUrl={callbackUrl} text={tSocial('google')} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#333]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#1a1a1a] px-2 text-gray-500">{t('separator')}</span>
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
                    {t('resendVerification')}
                  </Link>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                {t('email')}
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
                  {t('password')}
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-gray-400 hover:text-[#d4af37]"
                >
                  {t('forgotPassword')}
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
              {isLoading ? t('submitting') : t('submit')}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-400">
            {t('noAccount')}{' '}
            <Link href="/auth/signup" className="text-[#d4af37] hover:underline">
              {t('signupLink')}
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
