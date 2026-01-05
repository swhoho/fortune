'use client';

/**
 * 채팅 영역 컴포넌트 (비동기/폴링 지원)
 */
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Menu, Loader2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
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
  // 메시지 조회
  const { data, isLoading, error, refetch } = useConsultationMessages(profileId, sessionId);
  const sendMessage = useSendMessage();
  const { invalidateMessages, invalidateSessions } = useInvalidateConsultation();

  // 스크롤 ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // clarification 대기 상태
  const [awaitingClarification, setAwaitingClarification] = useState(false);

  // 폴링 상태
  const [isPolling, setIsPolling] = useState(false);

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

  // clarification 상태 추적
  useEffect(() => {
    if (data?.messages) {
      const completedMessages = data.messages.filter(
        (m: ConsultationMessage) => m.status !== 'generating' && m.status !== 'failed'
      );
      const lastMessage = completedMessages[completedMessages.length - 1];
      setAwaitingClarification(lastMessage?.type === 'ai_clarification');
    }
  }, [data?.messages]);

  // 폴링 로직: generating 상태 메시지가 있으면 주기적으로 refetch
  useEffect(() => {
    if (!generatingMessage) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    const pollInterval = setInterval(async () => {
      await refetch();
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(pollInterval);
    };
  }, [generatingMessage, refetch]);

  // 폴링 완료 시 세션 목록도 갱신 (question_count 업데이트)
  useEffect(() => {
    if (!generatingMessage && isPolling && sessionId) {
      // 폴링이 끝났으면 세션 목록 갱신
      invalidateSessions(profileId);
    }
  }, [generatingMessage, isPolling, sessionId, profileId, invalidateSessions]);

  /**
   * 메시지 전송
   */
  const handleSendMessage = useCallback(
    async (content: string, skipClarification = false) => {
      if (!sessionId) return;

      const messageType = awaitingClarification ? 'user_clarification' : 'user_question';

      try {
        await sendMessage.mutateAsync({
          profileId,
          sessionId,
          content,
          messageType,
          skipClarification,
        });

        // clarification 응답 후 상태 리셋
        if (messageType === 'user_clarification') {
          setAwaitingClarification(false);
        }
      } catch (err) {
        console.error('[ChatArea] 메시지 전송 실패:', err);
      }
    },
    [sessionId, profileId, awaitingClarification, sendMessage]
  );

  /**
   * 실패한 메시지 재시도
   */
  const handleRetry = useCallback(async () => {
    if (!failedMessage || !sessionId) return;

    // 실패한 AI 메시지를 삭제하고 새로 요청
    // (또는 generate API를 다시 호출하는 방식으로 구현 가능)
    // 간단히: 메시지 목록 갱신 후 마지막 사용자 질문 기반으로 재요청

    const userMessages = data?.messages?.filter(
      (m: ConsultationMessage) => m.type === 'user_question' || m.type === 'user_clarification'
    );
    const lastUserMessage = userMessages?.[userMessages.length - 1];

    if (lastUserMessage) {
      // invalidate 후 새로 전송
      await invalidateMessages(sessionId);
      await handleSendMessage(
        lastUserMessage.content,
        lastUserMessage.type === 'user_clarification'
      );
    }
  }, [failedMessage, sessionId, data?.messages, invalidateMessages, handleSendMessage]);

  // 세션 미선택 상태
  if (!sessionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Sparkles className="mb-4 h-12 w-12 text-[#d4af37]/50" />
        <p className="text-gray-400">세션을 선택하거나 새 상담을 시작하세요</p>
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
        <p className="text-gray-400">메시지를 불러올 수 없습니다</p>
      </div>
    );
  }

  const session = data?.session;
  const messages = data?.messages || [];
  const canAskMore = (session?.questionCount || 0) < 5;
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
            <h4 className="font-medium text-white">{session?.title || '새 상담'}</h4>
            <p className="text-xs text-gray-500">질문 {session?.questionCount || 0}/5</p>
          </div>
        </div>

        {isCompleted && (
          <span className="rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400">
            완료
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
            <h4 className="mb-2 font-medium text-white">무엇이든 물어보세요</h4>
            <p className="max-w-sm text-sm text-gray-400">
              분석된 사주와 대운을 바탕으로
              <br />
              진로, 연애, 재물, 건강 등 궁금한 것을 상담해드립니다.
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
                <span className="text-sm">답변 생성 중...</span>
              </motion.div>
            )}

            {/* 에러 발생 시 재시도 UI */}
            {failedMessage && !generatingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-900/50 bg-red-950/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-400">응답 생성 실패</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {failedMessage.errorMessage || 'AI 응답 생성에 실패했습니다'}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-1.5 rounded-md bg-[#d4af37] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#c19a2e]"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        재시도
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
      <div className="border-t border-[#333] p-4">
        {isCompleted ? (
          // 세션 완료 상태
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-gray-400">이 세션의 질문 한도(5개)에 도달했습니다.</p>
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
              새 상담 시작 (10C)
            </button>
          </div>
        ) : (
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={sendMessage.isPending || !!generatingMessage}
            disabled={!canAskMore || !!generatingMessage || !!failedMessage}
            placeholder={
              generatingMessage
                ? '답변 생성 중...'
                : awaitingClarification
                  ? '추가 정보를 입력해주세요...'
                  : '질문을 입력하세요... (최대 500자)'
            }
            showSkipButton={awaitingClarification && !generatingMessage}
            questionCount={session?.questionCount || 0}
            maxQuestions={5}
          />
        )}
      </div>
    </div>
  );
}
