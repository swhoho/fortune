'use client';

/**
 * 대표 프로필 변경 시 오늘의 운세 재생성 경고 다이얼로그
 */
import { AlertTriangle } from 'lucide-react';
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

interface FortuneWarningDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 다이얼로그 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 확인 핸들러 */
  onConfirm: () => void;
}

/**
 * 대표 프로필 변경 시 운세 재생성 경고 다이얼로그
 */
export function FortuneWarningDialog({ open, onOpenChange, onConfirm }: FortuneWarningDialogProps) {
  const t = useTranslations('profile');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-950/50">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
          </div>
          <AlertDialogTitle className="text-center">
            {t('primary.fortuneWarningTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            <span className="block text-gray-300">{t('primary.fortuneWarningMessage')}</span>
            <span className="mt-3 block text-sm text-yellow-400">
              {t('primary.fortuneWarningNote')}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel>{t('primary.fortuneWarningCancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className="bg-[#d4af37] text-white hover:bg-[#c19a2e]"
          >
            {t('primary.fortuneWarningConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
