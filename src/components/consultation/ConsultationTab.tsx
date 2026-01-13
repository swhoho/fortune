'use client';

/**
 * 상담 탭 메인 컴포넌트
 * 데스크톱: 왼쪽 세션 목록 + 오른쪽 채팅 영역
 * 모바일: 채팅 영역 + 슬라이드 메뉴
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SessionList } from './SessionList';
import { ChatArea } from './ChatArea';
import { useConsultationSessions, useCreateSession } from '@/hooks/use-consultation';
import { useCreditsCheck } from '@/hooks/use-credits';
import { InsufficientCreditsDialog } from '@/components/credits/InsufficientCreditsDialog';
import { CreditDeductionDialog } from '@/components/credits/CreditDeductionDialog';
import { Button } from '@/components/ui/button';
import { SERVICE_CREDITS } from '@/lib/stripe';

interface ConsultationTabProps {
  /** 프로필 ID */
  profileId: string;
}

export function ConsultationTab({ profileId }: ConsultationTabProps) {
  const router = useRouter();
  const t = useTranslations('consultation');
  const tCommon = useTranslations('common');

  // 세션 목록 조회
  const { data: sessions = [], isLoading: isLoadingSessions } = useConsultationSessions(profileId);
  const createSession = useCreateSession();

  // 활성 세션 ID
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // 모바일 세션 목록 슬라이드 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 크레딧 부족 다이얼로그
  const [showCreditsDialog, setShowCreditsDialog] = useState(false);

  // 크레딧 차감 확인 다이얼로그
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);

  // 사주 분석 미완료 에러 상태
  const [noReportError, setNoReportError] = useState(false);

  // 크레딧 확인
  const { data: creditsCheck, refetch: refetchCredits } = useCreditsCheck(SERVICE_CREDITS.question);

  // 첫 로드 시 가장 최근 active 세션 선택
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      const activeSession = sessions.find((s) => s.status === 'active');
      const firstSession = sessions[0];
      setActiveSessionId(activeSession?.id || firstSession?.id || null);
    }
  }, [sessions, activeSessionId]);

  /**
   * 새 세션 생성 버튼 클릭
   */
  const handleCreateSession = () => {
    // 크레딧 부족 시 충전 안내
    if (!creditsCheck?.sufficient) {
      setShowCreditsDialog(true);
      return;
    }

    // 크레딧 충분 시 확인 팝업
    setShowDeductionDialog(true);
  };

  /**
   * 크레딧 차감 확인 후 세션 생성
   */
  const handleConfirmCreateSession = async () => {
    setShowDeductionDialog(false);

    try {
      const result = await createSession.mutateAsync({ profileId });
      if (result?.sessionId) {
        setActiveSessionId(result.sessionId);
        setIsMobileMenuOpen(false);
        // 크레딧 잔액 갱신
        refetchCredits();
      }
    } catch (error) {
      const err = error as Error & { code?: string };
      // 크레딧 부족 에러 처리
      if (err.code === 'INSUFFICIENT_CREDITS') {
        setShowCreditsDialog(true);
        return;
      }
      // 사주 분석 미완료 에러 처리
      if (err.code === 'NO_REPORT') {
        setNoReportError(true);
        return;
      }
      console.error('[ConsultationTab] 세션 생성 실패:', error);
    }
  };

  /**
   * 세션 선택
   */
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setIsMobileMenuOpen(false);
  };

  // 사주 분석 미완료 에러 화면
  if (noReportError) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <AlertCircle className="mb-4 h-16 w-16 text-red-400" />
        <h3 className="mb-2 text-xl font-semibold text-white">{t('noReportError.title')}</h3>
        <p className="mb-6 max-w-sm text-gray-400">{t('noReportError.description')}</p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setNoReportError(false)}
            className="border-[#333] bg-[#1a1a1a] text-white hover:bg-[#242424]"
          >
            {tCommon('back')}
          </Button>
          <Button
            onClick={() => router.push(`/profiles/${profileId}/generating`)}
            style={{ backgroundColor: '#d4af37', color: '#000' }}
            className="hover:opacity-90"
          >
            {t('noReportError.goToAnalysis')}
          </Button>
        </div>
      </motion.div>
    );
  }

  // 세션이 없을 때 빈 상태
  if (!isLoadingSessions && sessions.length === 0) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="mb-6 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 p-6">
            <MessageCircle className="h-12 w-12 text-[#d4af37]" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-white">AI 상담을 시작해보세요</h3>
          <p className="mb-6 max-w-md text-gray-400">
            분석된 사주와 대운을 기반으로 전문가 AI에게 상담을 받아보세요.
            <br />
            진로, 연애, 재물 등 궁금한 것을 물어보세요.
          </p>
          <button
            onClick={handleCreateSession}
            disabled={createSession.isPending}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#c19a2e] px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5" />
            {createSession.isPending ? '세션 생성 중...' : '상담 시작하기 (10C)'}
          </button>
          <p className="mt-3 text-sm text-gray-500">세션당 2라운드 질문 가능</p>
        </motion.div>

        <InsufficientCreditsDialog
          open={showCreditsDialog}
          onOpenChange={setShowCreditsDialog}
          required={SERVICE_CREDITS.question}
          current={creditsCheck?.current || 0}
        />

        <CreditDeductionDialog
          open={showDeductionDialog}
          onOpenChange={setShowDeductionDialog}
          required={SERVICE_CREDITS.question}
          current={creditsCheck?.current || 0}
          onConfirm={handleConfirmCreateSession}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex h-full overflow-hidden rounded-none border-0 bg-[#111111] md:h-[calc(100vh-200px)] md:min-h-[500px] md:rounded-lg md:border md:border-[#333]">
        {/* 데스크톱 세션 목록 */}
        <div className="hidden w-72 flex-shrink-0 border-r border-[#333] md:block">
          <SessionList
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateSession}
            isLoading={isLoadingSessions}
            isCreating={createSession.isPending}
          />
        </div>

        {/* 채팅 영역 */}
        <div className="min-h-0 flex-1">
          <ChatArea
            profileId={profileId}
            sessionId={activeSessionId}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onCreateSession={handleCreateSession}
            isCreatingSession={createSession.isPending}
          />
        </div>
      </div>

      {/* 모바일 슬라이드 메뉴 */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* 백드롭 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />

            {/* 슬라이드 메뉴 */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[#111111] md:hidden"
            >
              <SessionList
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onCreateSession={handleCreateSession}
                isLoading={isLoadingSessions}
                isCreating={createSession.isPending}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <InsufficientCreditsDialog
        open={showCreditsDialog}
        onOpenChange={setShowCreditsDialog}
        required={SERVICE_CREDITS.question}
        current={creditsCheck?.current || 0}
      />

      <CreditDeductionDialog
        open={showDeductionDialog}
        onOpenChange={setShowDeductionDialog}
        required={SERVICE_CREDITS.question}
        current={creditsCheck?.current || 0}
        onConfirm={handleConfirmCreateSession}
      />
    </>
  );
}
