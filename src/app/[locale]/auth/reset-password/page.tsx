'use client';

/**
 * 비밀번호 재설정 페이지
 * 이메일 링크 클릭 후 새 비밀번호 설정
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // 세션 확인 (이메일 링크로 접근했는지)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
    };
    checkSession();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setIsSuccess(true);
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      }
    } catch {
      setError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중
  if (isValidSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 유효하지 않은 세션 (직접 접근 또는 링크 만료)
  if (!isValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">링크가 유효하지 않습니다</CardTitle>
            <CardDescription className="text-gray-400">
              비밀번호 재설정 링크가 만료되었거나 이미 사용되었습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/forgot-password" className="block">
              <Button className="w-full bg-[#d4af37] text-white hover:bg-[#b8972f]">
                새 재설정 링크 요청
              </Button>
            </Link>
            <div className="text-center">
              <Link href="/auth/signin" className="text-sm text-gray-400 hover:text-white">
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 비밀번호 변경 성공
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">비밀번호가 변경되었습니다</CardTitle>
            <CardDescription className="text-gray-400">
              잠시 후 로그인 페이지로 이동합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/signin" className="block">
              <Button className="w-full bg-[#d4af37] text-white hover:bg-[#b8972f]">
                지금 로그인하기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 새 비밀번호 입력 폼
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/10">
            <Lock className="h-8 w-8 text-[#d4af37]" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">새 비밀번호 설정</CardTitle>
          <CardDescription className="text-gray-400">
            사용할 새 비밀번호를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-900/30 p-3 text-sm text-red-400">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                새 비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="최소 6자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300">
                비밀번호 확인
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="border-[#333] bg-[#2a2a2a] text-white placeholder:text-gray-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#d4af37] text-white hover:bg-[#b8972f]"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
