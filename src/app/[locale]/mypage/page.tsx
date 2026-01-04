'use client';

/**
 * 마이페이지
 * PRD 섹션 5.9 참고
 * Task 17: 마이페이지 확장 (사이드바, 질문 기록, 알림 설정, 프로필 수정)
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfile } from '@/hooks/use-user';
import {
  MypageSidebar,
  AnalysisHistory,
  QuestionHistory,
  NotificationSettings,
  ProfileSettings,
  type MypageTab,
} from '@/components/mypage';

/** 로딩 스켈레톤 */
function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col px-6 py-24 md:flex-row md:gap-8">
      <div className="w-full animate-pulse md:w-64">
        <div className="mb-6 h-48 rounded-2xl bg-gray-200" />
        <div className="h-56 rounded-2xl bg-gray-200" />
      </div>
      <div className="mt-8 flex-1 md:mt-0">
        <div className="mb-6 h-12 w-48 rounded-lg bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 rounded-2xl bg-gray-200" />
          <div className="h-40 rounded-2xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

/** 에러 상태 */
function ErrorState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-10 w-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="mb-2 font-serif text-xl font-semibold text-[#1a1a1a]">
          계정 정보를 불러오는데 실패했습니다
        </h2>
        <p className="mb-6 text-gray-500">잠시 후 다시 시도해주세요</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c19a2e] px-6 py-3 font-medium text-white shadow-md transition-all hover:shadow-lg"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

/** 탭 콘텐츠 컴포넌트 */
function TabContent({ tab }: { tab: MypageTab }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        {tab === 'analysis' && <AnalysisHistory />}
        {tab === 'questions' && <QuestionHistory />}
        {tab === 'notifications' && <NotificationSettings />}
        {tab === 'settings' && <ProfileSettings />}
      </motion.div>
    </AnimatePresence>
  );
}

export default function MyPage() {
  const { data: profile, isLoading, error } = useUserProfile();
  const [activeTab, setActiveTab] = useState<MypageTab>('analysis');

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f8f8] via-[#fefdfb] to-[#f8f6f0]">
        <div className="mx-auto max-w-6xl">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f8f8] via-[#fefdfb] to-[#f8f6f0]">
        <ErrorState />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f8f8] via-[#fefdfb] to-[#f8f6f0]">
      {/* 장식적 배경 요소 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-[#d4af37]/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-[#d4af37]/5 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24">
        {/* 페이지 타이틀 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-2xl font-bold text-[#1a1a1a] md:text-3xl">마이페이지</h1>
          <p className="mt-2 text-gray-500">분석 기록과 계정 설정을 관리하세요</p>
        </motion.div>

        {/* 메인 레이아웃 */}
        <div className="flex flex-col gap-8 md:flex-row">
          {/* 사이드바 */}
          <MypageSidebar profile={profile} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* 메인 콘텐츠 */}
          <main className="flex-1">
            <TabContent tab={activeTab} />
          </main>
        </div>
      </div>
    </div>
  );
}
