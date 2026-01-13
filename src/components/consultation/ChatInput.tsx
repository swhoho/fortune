'use client';

/**
 * 채팅 입력창 컴포넌트
 */
import { useState, useRef, useEffect } from 'react';
import { Send, SkipForward, Loader2 } from 'lucide-react';

interface ChatInputProps {
  /** 메시지 전송 핸들러 */
  onSendMessage: (content: string, skipClarification?: boolean) => void;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 비활성화 */
  disabled?: boolean;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 건너뛰기 버튼 표시 */
  showSkipButton?: boolean;
  /** 현재 질문 수 */
  questionCount?: number;
  /** 최대 질문 수 */
  maxQuestions?: number;
}

const MAX_LENGTH = 500;

export function ChatInput({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = '질문을 입력하세요...',
  showSkipButton = false,
  questionCount = 0,
  maxQuestions = 2,
}: ChatInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // textarea 높이 자동 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [content]);

  /**
   * 모바일 키보드 올라올 때 입력창 보이게 스크롤
   */
  const handleFocus = () => {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  /**
   * 전송 핸들러
   */
  const handleSubmit = (e?: React.FormEvent, skipClarification = false) => {
    e?.preventDefault();

    const trimmedContent = content.trim();
    if (!trimmedContent || isLoading || disabled) return;

    onSendMessage(trimmedContent, skipClarification);
    setContent('');

    // 높이 리셋
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  /**
   * 키 핸들러 (Enter로 전송, Shift+Enter로 줄바꿈)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  /**
   * 건너뛰기 핸들러
   */
  const handleSkip = () => {
    // 빈 내용으로 건너뛰기
    onSendMessage('(건너뛰기)', true);
  };

  const remainingChars = MAX_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 질문 카운터 */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          질문 {questionCount}/{maxQuestions}
        </span>
        <span
          className={`${
            isOverLimit
              ? 'text-red-400'
              : remainingChars <= 50
                ? 'text-yellow-400'
                : 'text-gray-500'
          }`}
        >
          {remainingChars}자 남음
        </span>
      </div>

      {/* 입력 영역 */}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            className="w-full resize-none rounded-xl border border-[#333] bg-[#1a1a1a] px-4 py-3 pr-12 text-sm text-white placeholder-gray-500 focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37] disabled:opacity-50"
          />

          {/* 전송 버튼 (입력창 내부) */}
          <button
            type="submit"
            disabled={!content.trim() || isLoading || disabled || isOverLimit}
            className="absolute bottom-2 right-2 rounded-lg bg-[#d4af37] p-2 text-white transition-colors hover:bg-[#c19a2e] disabled:bg-gray-600 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* 건너뛰기 버튼 (추가 정보 요청 시) */}
      {showSkipButton && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-[#242424] hover:text-white disabled:opacity-50"
          >
            <SkipForward className="h-4 w-4" />
            <span>바로 답변 받기</span>
          </button>
        </div>
      )}
    </form>
  );
}
