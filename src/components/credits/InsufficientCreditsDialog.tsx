'use client';

/**
 * 크레딧 부족 안내 다이얼로그
 * Task 23.3: 크레딧 부족 시 안내
 */
import { useState } from 'react';
import { Coins, CreditCard, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InsufficientCreditsDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 다이얼로그 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 필요한 크레딧 */
  required: number;
  /** 현재 보유 크레딧 */
  current: number;
  /** 결제 페이지 이동 핸들러 (optional, 기본값: /payment로 이동) */
  onCharge?: () => void;
}

/**
 * 크레딧 부족 안내 다이얼로그
 * 결제 페이지로 이동하여 크레딧 충전 유도
 */
export function InsufficientCreditsDialog({
  open,
  onOpenChange,
  required,
  current,
  onCharge,
}: InsufficientCreditsDialogProps) {
  const t = useTranslations('credits');
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  // 방어적 코딩: shortfall이 음수가 되지 않도록 보호
  const shortfall = Math.max(0, required - current);

  const handleCharge = () => {
    setIsNavigating(true);
    if (onCharge) {
      onCharge();
      onOpenChange(false);
    } else {
      // router.push 시에는 다이얼로그를 열어둬서 로딩 스피너 표시
      router.push('/payment');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Coins className="h-6 w-6 text-amber-600" />
          </div>
          <AlertDialogTitle className="text-center">{t('insufficient.title')}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-center">
              <p className="text-gray-600">{t('insufficient.message', { required, current })}</p>

              {/* 크레딧 현황 */}
              <div className="mx-auto flex max-w-xs justify-between rounded-lg bg-gray-50 p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">{t('required')}</p>
                  <p className="text-lg font-semibold text-gray-900">{required}C</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">{t('balance')}</p>
                  <p className="text-lg font-semibold text-gray-900">{current}C</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">{t('insufficient.shortfallLabel')}</p>
                  <p className="text-lg font-semibold text-red-600">{shortfall}C</p>
                </div>
              </div>

              <p className="text-sm text-amber-600">
                {t('insufficient.shortfall', { amount: shortfall })}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel>{t('insufficient.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleCharge();
            }}
            disabled={isNavigating}
            className="bg-[#d4af37] text-white hover:bg-[#c9a02f] focus:ring-[#d4af37] disabled:cursor-wait disabled:opacity-70"
          >
            {isNavigating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {t('insufficient.chargeCredits')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
