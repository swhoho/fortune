'use client';

/**
 * 크레딧 차감 확인 다이얼로그
 * 리포트 생성 전 사용자에게 크레딧 차감을 안내하고 확인받음
 */
import { Coins, Sparkles, Gift } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

interface CreditDeductionDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 다이얼로그 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 필요한 크레딧 */
  required: number;
  /** 현재 보유 크레딧 */
  current: number;
  /** 확인 버튼 클릭 핸들러 */
  onConfirm: () => void;
  /** 최초 무료 분석 대상 여부 */
  isFreeEligible?: boolean;
}

/**
 * 크레딧 차감 확인 다이얼로그
 * 분석 시작 전 크레딧 차감 안내 (무료 분석 대상 시 별도 UI)
 */
export function CreditDeductionDialog({
  open,
  onOpenChange,
  required,
  current,
  onConfirm,
  isFreeEligible = false,
}: CreditDeductionDialogProps) {
  const t = useTranslations('credits');
  const tCommon = useTranslations('common');
  const afterDeduction = current - required;

  const handleConfirm = () => {
    onConfirm();
  };

  // 무료 분석 대상인 경우
  if (isFreeEligible) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <Gift className="h-6 w-6 text-green-500" />
            </div>
            <AlertDialogTitle className="text-center">{t('freeAnalysis.title')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-center">
                <p className="text-gray-400">{t('freeAnalysis.message')}</p>

                {/* 무료 안내 배지 */}
                <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-green-400">
                  <Gift className="h-4 w-4" />
                  <span className="font-medium">{tCommon('free')}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel>{t('deductionDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-600"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {t('freeAnalysis.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // 일반 크레딧 차감 UI
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37]/10">
            <Coins className="h-6 w-6 text-[#d4af37]" />
          </div>
          <AlertDialogTitle className="text-center">{t('deductionDialog.title')}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-center">
              <p className="text-gray-400">{t('deductionDialog.message', { required })}</p>

              {/* 크레딧 현황 */}
              <div className="mx-auto flex max-w-xs justify-between rounded-lg bg-[#242424] p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">{t('deductionDialog.currentBalance')}</p>
                  <p className="text-lg font-semibold text-white">{current}C</p>
                </div>
                <div className="flex items-center text-gray-500">→</div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">{t('deductionDialog.afterDeduction')}</p>
                  <p className="text-lg font-semibold text-[#d4af37]">{afterDeduction}C</p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel>{t('deductionDialog.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className="bg-[#d4af37] text-white hover:bg-[#c9a02f] focus:ring-[#d4af37]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {t('deductionDialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
