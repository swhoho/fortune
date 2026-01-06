'use client';

/**
 * 비밀번호 찾기 페이지
 * 이메일로 비밀번호 재설정 링크 발송
 */
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setIsSent(true);
      }
    } catch {
      setError('비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 발송 완료 화면
  if (isSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">이메일을 확인해주세요</CardTitle>
            <CardDescription className="text-gray-400">
              비밀번호 재설정 링크가 발송되었습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-[#242424] p-4 text-center">
              <p className="text-sm text-gray-400">발송된 이메일 주소</p>
              <p className="mt-1 font-medium text-white">{email}</p>
            </div>

            <div className="space-y-2 text-sm text-gray-400">
              <p>1. 이메일 수신함을 확인해주세요</p>
              <p>2. 재설정 링크를 클릭하면 새 비밀번호를 설정할 수 있습니다</p>
              <p>3. 스팸 폴더도 확인해보세요</p>
            </div>

            <Button
              onClick={() => setIsSent(false)}
              variant="outline"
              className="w-full border-[#333] bg-transparent text-white hover:bg-[#242424]"
            >
              다른 이메일로 재시도
            </Button>

            <div className="pt-2 text-center">
              <Link href="/auth/signin" className="text-sm text-[#d4af37] hover:underline">
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 이메일 입력 폼
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <Card className="w-full max-w-md border-[#333] bg-[#1a1a1a]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/10">
            <Mail className="h-8 w-8 text-[#d4af37]" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">비밀번호 찾기</CardTitle>
          <CardDescription className="text-gray-400">
            가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-900/30 p-3 text-sm text-red-400">{error}</div>
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
              {isLoading ? '발송 중...' : '재설정 링크 발송'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              로그인으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
