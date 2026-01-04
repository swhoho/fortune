'use client';

/**
 * 크레딧 차감 확인 다이얼로그
 * 리포트 생성 전 사용자에게 크레딧 차감을 안내하고 확인받음
 */
import { Coins, Sparkles } from 'lucide-react';
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
}

/**
 * 크레딧 차감 확인 다이얼로그
 * 분석 시작 전 크레딧 차감 안내
 */
export function CreditDeductionDialog({
  open,
  onOpenChange,
  required,
  current,
  onConfirm,
}: CreditDeductionDialogProps) {
  const t = useTranslations('credits');
  const afterDeduction = current - required;

  const handleConfirm = () => {
    onConfirm();
  };

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
              <p className="text-gray-600">{t('deductionDialog.message', { required })}</p>

              {/* 크레딧 현황 */}
              <div className="mx-auto flex max-w-xs justify-between rounded-lg bg-gray-50 p-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500">{t('deductionDialog.currentBalance')}</p>
                  <p className="text-lg font-semibold text-gray-900">{current}C</p>
                </div>
                <div className="flex items-center text-gray-400">→</div>
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
