'use client';

/**
 * 후속 질문 컴포넌트
 * Task 16: AI에게 추가 질문하기
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageCircle, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAnalysisStore } from '@/stores/analysis';
import { BRAND_COLORS } from '@/lib/constants/colors';

/** 질문 아이템 타입 */
interface QuestionItem {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
}

/** Props */
interface FollowUpQuestionProps {
  analysisId: string;
  userCredits: number;
  onCreditUpdate?: (newCredits: number) => void;
}

/** 질문당 크레딧 */
const QUESTION_CREDITS = 10;

/** 최대 질문 길이 */
const MAX_QUESTION_LENGTH = 500;

export function FollowUpQuestion({
  analysisId,
  userCredits,
  onCreditUpdate,
}: FollowUpQuestionProps) {
  const [question, setQuestion] = useState('');
  const [credits, setCredits] = useState(userCredits);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Zustand 스토어
  const {
    questions,
    isQuestionLoading,
    questionError,
    addQuestion,
    setQuestionLoading,
    setQuestionError,
  } = useAnalysisStore();

  // 크레딧 동기화
  useEffect(() => {
    setCredits(userCredits);
  }, [userCredits]);

  // 새 질문 추가 시 스크롤
  useEffect(() => {
    if (questions.length > 0) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [questions.length]);

  // 질문 제출
  const handleSubmit = async () => {
    if (!question.trim() || isQuestionLoading) return;
    if (credits < QUESTION_CREDITS) {
      setQuestionError('크레딧이 부족합니다');
      return;
    }

    setQuestionLoading(true);
    setQuestionError(null);

    try {
      const response = await fetch(`/api/analysis/${analysisId}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '질문 처리에 실패했습니다');
      }

      // 성공 시 스토어에 추가
      addQuestion({
        id: result.data.questionId,
        question: question.trim(),
        answer: result.data.answer,
        createdAt: new Date().toISOString(),
      });

      // 크레딧 업데이트
      setCredits(result.data.remainingCredits);
      onCreditUpdate?.(result.data.remainingCredits);

      // 입력 초기화
      setQuestion('');
    } catch (error) {
      console.error('[FollowUpQuestion] 에러:', error);
      setQuestionError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setQuestionLoading(false);
    }
  };

  // Enter 키 처리 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 남은 글자 수
  const remainingChars = MAX_QUESTION_LENGTH - question.length;
  const isOverLimit = remainingChars < 0;
  const canSubmit =
    question.trim().length > 0 && !isOverLimit && !isQuestionLoading && credits >= QUESTION_CREDITS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
    >
      {/* 헤더 */}
      <div className="border-b px-6 py-4" style={{ backgroundColor: `${BRAND_COLORS.primary}10` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" style={{ color: BRAND_COLORS.primary }} />
            <h3 className="font-serif text-lg font-semibold text-gray-900">AI에게 추가 질문하기</h3>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              질문당 <strong>{QUESTION_CREDITS}C</strong>
            </span>
            <span className="text-gray-400">|</span>
            <span className={credits < QUESTION_CREDITS ? 'text-red-500' : 'text-gray-600'}>
              보유: <strong>{credits}C</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Q&A 스레드 */}
      {questions.length > 0 && (
        <div className="max-h-96 space-y-4 overflow-y-auto bg-gray-50 px-6 py-4">
          <AnimatePresence>
            {questions.map((item: QuestionItem, index: number) => (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {/* 질문 */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#d4af37] px-4 py-3 text-black">
                    <p className="whitespace-pre-wrap text-sm">{item.question}</p>
                  </div>
                </div>

                {/* 답변 */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                      {item.answer}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={threadEndRef} />
        </div>
      )}

      {/* 에러 메시지 */}
      {questionError && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{questionError}</span>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="p-6">
        {credits < QUESTION_CREDITS ? (
          <div className="py-4 text-center">
            <p className="mb-3 text-gray-500">크레딧이 부족합니다. 충전 후 질문해주세요.</p>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/mypage/credits')}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              크레딧 충전하기
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="사주에 대해 더 궁금한 점을 질문해보세요..."
                className="min-h-[100px] resize-none pb-8 pr-4"
                disabled={isQuestionLoading}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
                  {remainingChars}자
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Shift + Enter로 줄바꿈, Enter로 전송</p>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="gap-2"
                style={{
                  backgroundColor: canSubmit ? BRAND_COLORS.primary : undefined,
                  color: canSubmit ? 'black' : undefined,
                }}
              >
                {isQuestionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    답변 생성 중...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    질문하기 ({QUESTION_CREDITS}C)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
