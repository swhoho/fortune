'use client';

/**
 * 회원가입 페이지
 */
import { useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

/**
 * Supabase Auth 오류 메시지를 번역 키로 변환
 */
function getAuthErrorKey(message: string): string {
  const lowerMessage = message.toLowerCase();

  // 이미 가입된 이메일
  if (
    lowerMessage.includes('user already registered') ||
    lowerMessage.includes('already been registered')
  ) {
    return 'userAlreadyRegistered';
  }

  // 이메일 형식 오류
  if (lowerMessage.includes('invalid email') || lowerMessage.includes('unable to validate email')) {
    return 'invalidEmail';
  }

  // 비밀번호 정책 오류 (영문자, 숫자 필요 등)
  if (lowerMessage.includes('password should contain')) {
    if (
      lowerMessage.includes('abcdefghijklmnopqrstuvwxyz') &&
      lowerMessage.includes('0123456789')
    ) {
      return 'passwordRequiresLetter';
    }
    if (lowerMessage.includes('uppercase')) {
      return 'passwordRequiresUppercase';
    }
    if (lowerMessage.includes('lowercase')) {
      return 'passwordRequiresLowercase';
    }
    if (
      lowerMessage.includes('0123456789') ||
      lowerMessage.includes('digit') ||
      lowerMessage.includes('number')
    ) {
      return 'passwordRequiresNumber';
    }
    if (lowerMessage.includes('symbol') || lowerMessage.includes('special')) {
      return 'passwordRequiresSymbol';
    }
    return 'weakPassword';
  }

  // 비밀번호 약함
  if (lowerMessage.includes('weak password') || lowerMessage.includes('password is too weak')) {
    return 'weakPassword';
  }

  // Rate limit
  if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
    return 'rateLimitExceeded';
  }

  // 이메일 rate limit
  if (lowerMessage.includes('email rate limit')) {
    return 'emailRateLimitExceeded';
  }

  // 네트워크 오류
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return 'networkError';
  }

  return 'unknownError';
}

export default function SignUpPage() {
  const router = useRouter();
  const t = useTranslations('auth.signup');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('errors.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      // Supabase Auth로 회원가입
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (signUpError) {
        // Supabase 오류를 번역된 메시지로 변환
        const errorKey = getAuthErrorKey(signUpError.message);
        setError(t(`errors.${errorKey}`));
        return;
      }

      if (data.user) {
        // users 테이블은 DB 트리거가 자동 생성
        // 이메일 확인이 필요한 경우 (session이 null)
        if (!data.session) {
          router.push('/auth/verify-email?email=' + encodeURIComponent(email));
        } else {
          // 이메일 확인이 비활성화된 경우 바로 홈으로
          router.push('/home');
        }
      }
    } catch {
      setError(t('errors.signupFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const tSocial = useTranslations('auth.social');

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">{t('title')}</CardTitle>
          <CardDescription className="text-gray-400">{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <GoogleSignInButton text={tSocial('googleStart')} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#333]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1a1a1a] px-2 text-gray-500">{t('separator')}</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignUp} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-900/30 p-3 text-sm text-red-400">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  {t('name')}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading || isGoogleLoading}
                  className="border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500"
                />
              </div>

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
                <Label htmlFor="password" className="text-gray-300">
                  {t('password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || isGoogleLoading}
                  className="border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  {t('confirmPassword')}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {t('hasAccount')}{' '}
              <Link href="/auth/signin" className="text-[#d4af37] hover:underline">
                {t('signinLink')}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
