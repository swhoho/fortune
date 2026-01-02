'use client';

/**
 * AI 분석 탭 메뉴 컴포넌트
 * shadcn/ui Tabs 사용
 */

import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisSection } from './AnalysisSection';
import { BRAND_COLORS } from '@/lib/constants/colors';
import type { SajuAnalysisResult } from '@/lib/ai/types';

type TabId = 'summary' | 'personality' | 'wealth' | 'love' | 'career' | 'health';

interface TabConfig {
  id: TabId;
  label: string;
  emoji: string;
}

const TABS: TabConfig[] = [
  { id: 'summary', label: '총운', emoji: '🔮' },
  { id: 'personality', label: '성격', emoji: '🧠' },
  { id: 'wealth', label: '재물', emoji: '💰' },
  { id: 'love', label: '사랑', emoji: '❤️' },
  { id: 'career', label: '직장', emoji: '💼' },
  { id: 'health', label: '건강', emoji: '🏥' },
];

interface AnalysisTabsProps {
  /** AI 분석 결과 */
  result: SajuAnalysisResult;
}

export function AnalysisTabs({ result }: AnalysisTabsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full rounded-xl border border-gray-200 bg-white shadow-lg"
    >
      <Tabs defaultValue="summary" className="w-full">
        {/* 탭 리스트 */}
        <div className="border-b border-gray-200">
          <TabsList className="flex h-auto w-full justify-start gap-0 overflow-x-auto rounded-none bg-transparent p-0">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 data-[state=active]:border-[#d4af37] data-[state=active]:text-[#d4af37]"
              >
                <span className="mr-1.5">{tab.emoji}</span>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="p-6">
          {/* 총운 */}
          <TabsContent value="summary" className="mt-0">
            <AnalysisSection title="종합 운세" content={result.summary} />
            {/* 고전 인용 */}
            {result.classical_references && result.classical_references.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-serif text-lg font-semibold text-gray-900">고전 해석</h4>
                {result.classical_references.map((ref, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500">{ref.source}</p>
                    <p
                      className="mt-1 font-serif text-sm italic"
                      style={{ color: BRAND_COLORS.secondary }}
                    >
                      &ldquo;{ref.quote}&rdquo;
                    </p>
                    <p className="mt-2 text-sm text-gray-700">{ref.interpretation}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 성격 */}
          <TabsContent value="personality" className="mt-0">
            <AnalysisSection
              title={result.personality.title}
              content={result.personality.content}
              keywords={result.personality.keywords}
            />
          </TabsContent>

          {/* 재물 */}
          <TabsContent value="wealth" className="mt-0">
            <AnalysisSection
              title={result.wealth.title}
              content={result.wealth.content}
              score={result.wealth.score}
              advice={result.wealth.advice}
            />
          </TabsContent>

          {/* 사랑 */}
          <TabsContent value="love" className="mt-0">
            <AnalysisSection
              title={result.love.title}
              content={result.love.content}
              score={result.love.score}
              advice={result.love.advice}
            />
          </TabsContent>

          {/* 직장 */}
          <TabsContent value="career" className="mt-0">
            <AnalysisSection
              title={result.career.title}
              content={result.career.content}
              score={result.career.score}
              advice={result.career.advice}
            />
          </TabsContent>

          {/* 건강 */}
          <TabsContent value="health" className="mt-0">
            <AnalysisSection
              title={result.health.title}
              content={result.health.content}
              score={result.health.score}
              advice={result.health.advice}
            />
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  );
}
