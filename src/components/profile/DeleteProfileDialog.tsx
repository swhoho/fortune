'use client';

/**
 * 프로필 삭제 확인 다이얼로그
 * Task 5.5: 삭제 액션
 */
import { Loader2, AlertTriangle } from 'lucide-react';
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

interface DeleteProfileDialogProps {
  /** 다이얼로그 열림 상태 */
  open: boolean;
  /** 다이얼로그 상태 변경 핸들러 */
  onOpenChange: (open: boolean) => void;
  /** 삭제할 프로필 이름 */
  profileName: string;
  /** 확인 핸들러 */
  onConfirm: () => void;
  /** 삭제 중 여부 */
  isDeleting?: boolean;
}

/**
 * 프로필 삭제 확인 다이얼로그
 */
export function DeleteProfileDialog({
  open,
  onOpenChange,
  profileName,
  onConfirm,
  isDeleting = false,
}: DeleteProfileDialogProps) {
  const t = useTranslations('profile');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <AlertDialogTitle className="text-center">{t('delete.title')}</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            <span className="block">{t('delete.message', { name: profileName })}</span>
            <span className="mt-2 block text-sm text-red-500">{t('delete.warning')}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel disabled={isDeleting}>{t('delete.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('delete.confirm')}...
              </>
            ) : (
              t('delete.confirm')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
