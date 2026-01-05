'use client';

/**
 * 채팅 메시지 버블 컴포넌트
 */
import { motion } from 'framer-motion';
import { User, Sparkles, HelpCircle } from 'lucide-react';
import type { ConsultationMessage } from '@/types/consultation';

interface ChatMessageProps {
  /** 메시지 데이터 */
  message: ConsultationMessage;
  /** 가장 최근 메시지 여부 */
  isLatest?: boolean;
}

export function ChatMessage({ message, isLatest = false }: ChatMessageProps) {
  const isUser = message.type === 'user_question' || message.type === 'user_clarification';
  const isClarification = message.type === 'ai_clarification';

  /**
   * 시간 포맷
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* 아바타 */}
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-[#d4af37]/20' : isClarification ? 'bg-blue-500/20' : 'bg-[#242424]'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-[#d4af37]" />
        ) : isClarification ? (
          <HelpCircle className="h-4 w-4 text-blue-400" />
        ) : (
          <Sparkles className="h-4 w-4 text-[#d4af37]" />
        )}
      </div>

      {/* 메시지 버블 */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'rounded-tr-sm bg-[#d4af37]/20 text-white'
              : isClarification
                ? 'rounded-tl-sm border border-blue-500/30 bg-blue-500/10 text-gray-200'
                : 'rounded-tl-sm bg-[#1a1a1a] text-gray-200'
          }`}
        >
          {/* 추가 정보 요청 라벨 */}
          {isClarification && (
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-blue-400">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>추가 정보가 필요해요</span>
            </div>
          )}

          {/* 메시지 내용 */}
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        </div>

        {/* 시간 */}
        <p className={`mt-1 text-xs text-gray-500 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatTime(message.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}
