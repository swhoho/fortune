'use client';

/**
 * 고민 입력 페이지
 * PRD 섹션 5.5 참고
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { FocusArea, FocusAreaLabel } from '@/types/saju';

/** 분석 영역별 예시 질문 */
const exampleQuestions: Record<FocusArea, string[]> = {
  wealth: [
    '올해 부동산 매수 타이밍은 언제인가요?',
    '현재 하는 사업, 확장해도 될까요?',
    '주식 투자 적기는 언제인가요?',
  ],
  love: [
    '현재 만나는 사람과의 궁합은 어떤가요?',
    '올해 결혼해도 괜찮을까요?',
    '인연을 만날 시기는 언제인가요?',
  ],
  career: [
    '올해 이직해도 괜찮을까요?',
    '승진 가능성은 어떻게 되나요?',
    '창업하기 좋은 시기는 언제인가요?',
  ],
  health: [
    '건강에 특별히 주의해야 할 시기가 있나요?',
    '어떤 부분의 건강을 조심해야 하나요?',
    '운동이나 식이요법 추천이 있나요?',
  ],
  overall: [
    '올해 가장 중요하게 봐야 할 점은 무엇인가요?',
    '대운의 흐름에서 주의할 점이 있나요?',
    '인생에서 가장 좋은 시기는 언제인가요?',
  ],
};

const MAX_LENGTH = 500;

export default function AnalysisQuestion() {
  const router = useRouter();
  const { focusArea, setQuestion, setStep } = useOnboardingStore();
  const [text, setText] = useState('');
  const [noQuestion, setNoQuestion] = useState(false);

  // focusArea가 없으면 focus 페이지로 리다이렉트
  useEffect(() => {
    if (!focusArea) {
      router.push('/analysis/focus');
    }
  }, [focusArea, router]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setText(value);
    }
  };

  const handleExampleClick = (example: string) => {
    if (!noQuestion && text.length + example.length <= MAX_LENGTH) {
      setText(text ? `${text}\n${example}` : example);
    }
  };

  const handleNoQuestionChange = (checked: boolean) => {
    setNoQuestion(checked);
    if (checked) {
      setText('');
    }
  };

  const handleNext = () => {
    setQuestion(noQuestion ? '' : text);
    setStep('payment');
    router.push('/payment');
  };

  if (!focusArea) {
    return null;
  }

  const examples = exampleQuestions[focusArea];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      {/* 진행 바 */}
      <div className="fixed left-0 right-0 top-16 px-6">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Step 2/3</span>
            <span>고민 입력</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <motion.div
              initial={{ width: '33%' }}
              animate={{ width: '66%' }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e]"
            />
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* 타이틀 */}
        <h2 className="mb-2 text-center font-serif text-2xl font-bold text-[#1a1a1a] md:text-3xl">
          현재 직면한 고민이나
          <br />
          구체적인 질문을 적어주세요
        </h2>
        <p className="mb-2 text-center text-gray-500">
          선택한 분석 영역:{' '}
          <span className="font-medium text-[#d4af37]">{FocusAreaLabel[focusArea]}</span>
        </p>
        <p className="mb-8 text-center text-sm text-gray-400">
          구체적일수록 AI의 답변이 더 정확해집니다
        </p>

        {/* 예시 질문 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="mb-3 text-sm font-medium text-gray-600">예시 질문 (클릭하여 추가)</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => handleExampleClick(example)}
                disabled={noQuestion}
                className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/5 px-4 py-2 text-sm text-gray-600 transition-all hover:border-[#d4af37] hover:bg-[#d4af37]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {example}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 텍스트 입력 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="relative">
            <textarea
              value={text}
              onChange={handleTextChange}
              disabled={noQuestion}
              placeholder="예: 올해 퇴사하고 창업해도 될까요? 현재 만나는 사람과 결혼해도 괜찮을까요?"
              rows={6}
              className={`w-full resize-none rounded-xl border-2 p-4 text-gray-700 transition-all focus:border-[#d4af37] focus:outline-none ${
                noQuestion
                  ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-50'
                  : 'border-gray-200 bg-white'
              }`}
            />
            <div className="absolute bottom-3 right-3 text-sm text-gray-400">
              {text.length}/{MAX_LENGTH}
            </div>
          </div>
        </motion.div>

        {/* 고민 없음 체크박스 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#d4af37]/50">
            <input
              type="checkbox"
              checked={noQuestion}
              onChange={(e) => handleNoQuestionChange(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-[#d4af37] focus:ring-[#d4af37]"
            />
            <span className="text-gray-600">고민 사항 없이 종합 분석만 원해요</span>
          </label>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center"
        >
          <Button
            onClick={handleNext}
            disabled={!noQuestion && text.trim().length < 10}
            size="lg"
            className="w-full max-w-md bg-gradient-to-r from-[#d4af37] to-[#c19a2e] py-6 text-lg font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
          >
            다음: 결제하기
          </Button>
          <p className="mt-4 text-center text-sm text-gray-400">
            {noQuestion
              ? '종합 분석으로 진행합니다'
              : text.trim().length < 10
                ? '최소 10자 이상 입력해주세요'
                : '결제 후 분석이 시작됩니다'}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
