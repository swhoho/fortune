'use client';

/**
 * 채팅 영역 컴포넌트 (비동기/폴링 지원)
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Menu, Loader2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import {
  useConsultationMessages,
  useSendMessage,
  useInvalidateConsultation,
} from '@/hooks/use-consultation';
import type { ConsultationMessage } from '@/types/consultation';

/** 폴링 간격 (ms) */
const POLLING_INTERVAL = 2000;
/** 최대 폴링 횟수 (2분 = 60회 × 2초) */
const MAX_POLL_ATTEMPTS = 60;

interface ChatAreaProps {
  /** 프로필 ID */
  profileId: string;
  /** 세션 ID */
  sessionId: string | null;
  /** 모바일 메뉴 열기 */
  onOpenMobileMenu: () => void;
  /** 새 세션 생성 */
  onCreateSession: () => void;
  /** 세션 생성 중 */
  isCreatingSession?: boolean;
}

export function ChatArea({
  profileId,
  sessionId,
  onOpenMobileMenu,
  onCreateSession,
  isCreatingSession = false,
}: ChatAreaProps) {
  const t = useTranslations('consultation');

  // 메시지 조회
  const { data, isLoading, error, refetch } = useConsultationMessages(profileId, sessionId);
  const sendMessage = useSendMessage();
  const { invalidateSessions } = useInvalidateConsultation();

  // 스크롤 ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // clarification 대기 상태
  const [awaitingClarification, setAwaitingClarification] = useState(false);

  // 폴링 상태
  const [isPolling, setIsPolling] = useState(false);
  const pollAttemptsRef = useRef(0);

  // 타임아웃 에러 상태
  const [timeoutError, setTimeoutError] = useState<string | null>(null);

  // 재생성 중인 메시지 ID
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // generating 상태 메시지 확인
  const generatingMessage = data?.messages?.find(
    (m: ConsultationMessage) => m.status === 'generating'
  );

  // 실패한 메시지 (DB에서 가져온 것)
  const failedMessage = data?.messages?.find((m: ConsultationMessage) => m.status === 'failed');

  // 새 메시지 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  // clarification 상태 추적 (generating 상태 고려)
  useEffect(() => {
    if (data?.messages) {
      // generating 메시지가 있으면 상태 변경하지 않음 (응답 대기 중)
      if (generatingMessage) {
        return;
      }

      const completedMessages = data.messages.filter(
        (m: ConsultationMessage) => m.status !== 'generating' && m.status !== 'failed'
      );
      const lastMessage = completedMessages[completedMessages.length - 1];
      setAwaitingClarification(lastMessage?.type === 'ai_clarification');
    }
  }, [data?.messages, generatingMessage]);

  // 폴링 로직: generating 상태 메시지가 있으면 주기적으로 refetch (타임아웃 포함)
  useEffect(() => {
    if (!generatingMessage) {
      pollAttemptsRef.current = 0;
      setIsPolling(false);
      setTimeoutError(null);
      return;
    }

    setIsPolling(true);
    setTimeoutError(null);

    const pollInterval = setInterval(async () => {
      pollAttemptsRef.current++;

      // 타임아웃 체크 (2분 = 60회)
      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        clearInterval(pollInterval);
        setTimeoutError(t('timeoutMessage'));
        setIsPolling(false);
        return;
      }

      await refetch();
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(pollInterval);
    };
  }, [generatingMessage, refetch, t]);

  // 폴링 완료 시 세션 목록도 갱신 (question_count 업데이트)
  useEffect(() => {
    if (!generatingMessage && isPolling && sessionId) {
      // 폴링이 끝났으면 세션 목록 갱신
      invalidateSessions(profileId);
    }
  }, [generatingMessage, isPolling, sessionId, profileId, invalidateSessions]);

  /**
   * 메시지 전송 (중복 방지 + 낙관적 업데이트)
   */
  const handleSendMessage = useCallback(
    async (content: string, skipClarification = false) => {
      // 중복 요청 방지
      if (!sessionId || sendMessage.isPending) return;

      const messageType = awaitingClarification ? 'user_clarification' : 'user_question';

      // 낙관적 상태 업데이트: clarification 응답 시 즉시 false로 설정
      if (messageType === 'user_clarification') {
        setAwaitingClarification(false);
      }

      try {
        await sendMessage.mutateAsync({
          profileId,
          sessionId,
          content,
          messageType,
          skipClarification,
        });
      } catch (err) {
        console.error('[ChatArea] 메시지 전송 실패:', err);
        // 실패 시 상태 복원
        if (messageType === 'user_clarification') {
          setAwaitingClarification(true);
        }
      }
    },
    [sessionId, profileId, awaitingClarification, sendMessage]
  );

  /**
   * 실패한 메시지 재생성 (PATCH API - 크레딧 차감 없음)
   */
  const handleRegenerate = useCallback(
    async (messageId: string) => {
      if (!profileId || !sessionId) return;

      setRegeneratingId(messageId);
      setTimeoutError(null);

      try {
        const res = await fetch(
          `/api/profiles/${profileId}/consultation/sessions/${sessionId}/messages`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId }),
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || '재생성에 실패했습니다.');
        }

        // 폴링 카운터 리셋
        pollAttemptsRef.current = 0;

        // 폴링 재시작 (generating 상태 감지)
        await refetch();
      } catch (err) {
        console.error('[ChatArea] 재생성 실패:', err);
      } finally {
        setRegeneratingId(null);
      }
    },
    [profileId, sessionId, refetch]
  );

  /**
   * 실패한 메시지 재시도 (재생성 API 호출)
   */
  const handleRetry = useCallback(async () => {
    if (!failedMessage || !sessionId) return;
    await handleRegenerate(failedMessage.id);
  }, [failedMessage, sessionId, handleRegenerate]);

  // 세션 미선택 상태
  if (!sessionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Sparkles className="mb-4 h-12 w-12 text-[#d4af37]/50" />
        <p className="text-gray-400">{t('noSession')}</p>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
        <p className="text-gray-400">{t('loadError')}</p>
      </div>
    );
  }

  const session = data?.session;
  const messages = data?.messages || [];
  const canAskMore = (session?.questionCount || 0) < 2;
  const isCompleted = session?.status === 'completed';

  // generating/failed 상태가 아닌 메시지만 표시 (generating은 로딩 UI로, failed는 에러 UI로)
  const displayMessages = messages.filter(
    (m: ConsultationMessage) => m.status !== 'generating' && m.status !== 'failed'
  );

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-[#333] px-4 py-3">
        <div className="flex items-center gap-3">
          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={onOpenMobileMenu}
            className="rounded-md p-1.5 text-gray-400 hover:bg-[#242424] hover:text-white md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <h4 className="font-medium text-white">{session?.title || t('newSession')}</h4>
            <p className="text-xs text-gray-500">
              {t('question')} {session?.questionCount || 0}/2
            </p>
          </div>
        </div>

        {isCompleted && (
          <span className="rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400">
            {t('complete')}
          </span>
        )}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4">
        {displayMessages.length === 0 && !generatingMessage ? (
          // 빈 상태 (첫 메시지 안내)
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full flex-col items-center justify-center text-center"
          >
            <div className="mb-4 rounded-full bg-[#d4af37]/10 p-4">
              <Sparkles className="h-8 w-8 text-[#d4af37]" />
            </div>
            <h4 className="mb-2 font-medium text-white">{t('askAnything')}</h4>
            <p className="max-w-sm whitespace-pre-line text-sm text-gray-400">
              {t('askAnythingDesc')}
            </p>
          </motion.div>
        ) : (
          // 메시지 목록
          <div className="space-y-4">
            {displayMessages.map((message: ConsultationMessage, index: number) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLatest={index === displayMessages.length - 1 && !generatingMessage}
              />
            ))}

            {/* AI 응답 생성 중 (폴링) */}
            {generatingMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-gray-400"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{t('generating')}</span>
              </motion.div>
            )}

            {/* 타임아웃 에러 UI */}
            {timeoutError && !failedMessage && !generatingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-yellow-900/50 bg-yellow-950/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-400">{t('timeout')}</p>
                    <p className="mt-1 text-xs text-gray-400">{timeoutError}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 에러 발생 시 재생성 UI */}
            {failedMessage && !generatingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-900/50 bg-red-950/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-400">{t('failed')}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {failedMessage.errorMessage || t('failedDefault')}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleRetry}
                        disabled={regeneratingId === failedMessage.id}
                        className="flex items-center gap-1.5 rounded-md bg-[#d4af37] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#c19a2e] disabled:opacity-50"
                      >
                        {regeneratingId === failedMessage.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {t('regenerating')}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5" />
                            {t('regenerate')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-[#333] p-4 pb-8 md:pb-4">
        {isCompleted ? (
          // 세션 완료 상태
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-gray-400">{t('roundLimit')}</p>
            <button
              onClick={onCreateSession}
              disabled={isCreatingSession}
              className="flex items-center gap-2 rounded-lg bg-[#d4af37] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c19a2e] disabled:opacity-50"
            >
              {isCreatingSession ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {t('newSessionCost')}
            </button>
          </div>
        ) : (
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={sendMessage.isPending || !!generatingMessage || !!regeneratingId}
            disabled={!canAskMore || !!generatingMessage || !!failedMessage || !!regeneratingId}
            placeholder={
              generatingMessage || regeneratingId
                ? t('generating')
                : awaitingClarification
                  ? t('clarificationPlaceholder')
                  : t('inputPlaceholder')
            }
            showSkipButton={awaitingClarification && !generatingMessage && !regeneratingId}
            questionCount={session?.questionCount || 0}
            maxQuestions={2}
          />
        )}
      </div>
    </div>
  );
}
