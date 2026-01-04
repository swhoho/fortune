'use client';

/**
 * 마이페이지 사이드바 컴포넌트
 * PRD 섹션 5.9 - 사이드바 메뉴 (분석 기록, 질문 기록, 알림, 설정)
 */
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/hooks/use-user';

/** 사이드바 탭 타입 */
export type MypageTab = 'analysis' | 'questions' | 'notifications' | 'settings';

/** 탭 메뉴 아이템 */
interface TabMenuItem {
  id: MypageTab;
  label: string;
  icon: React.ReactNode;
}

/** 탭 메뉴 목록 */
const TAB_MENU: TabMenuItem[] = [
  {
    id: 'analysis',
    label: '분석 기록',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
        />
      </svg>
    ),
  },
  {
    id: 'questions',
    label: '질문 기록',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
        />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: '알림 설정',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: '프로필 설정',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

interface MypageSidebarProps {
  profile: UserProfile | undefined;
  activeTab: MypageTab;
  onTabChange: (tab: MypageTab) => void;
}

export function MypageSidebar({ profile, activeTab, onTabChange }: MypageSidebarProps) {
  return (
    <aside className="w-full shrink-0 md:w-64">
      {/* 프로필 카드 - 한지 질감 배경 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative mb-6 overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-gradient-to-br from-white via-[#fefdfb] to-[#f8f6f0] p-6 shadow-lg"
      >
        {/* 장식적 요소 - 우측 상단 금색 원 */}
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#d4af37]/10 to-transparent" />
        <div className="absolute -right-4 -top-4 h-12 w-12 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-transparent" />

        {/* 프로필 아바타 */}
        <div className="relative mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37] to-[#c19a2e] text-xl font-bold text-white shadow-md">
            {profile?.name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-lg font-semibold text-[#1a1a1a]">
              {profile?.name || '사용자'}
            </p>
            <p className="truncate text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>

        {/* 크레딧 표시 */}
        <div className="relative flex items-center justify-between rounded-xl bg-[#1a1a1a]/5 px-4 py-3">
          <span className="text-sm text-gray-600">보유 크레딧</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl font-bold text-[#d4af37]">
              {profile?.credits || 0}
            </span>
            <span className="text-sm font-medium text-[#d4af37]">C</span>
          </div>
        </div>

        {/* 크레딧 충전 버튼 */}
        <Link
          href="/payment"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#c19a2e] px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg hover:brightness-105"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          크레딧 충전
        </Link>
      </motion.div>

      <motion.nav
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gray-100 bg-white p-2 shadow-sm"
      >
        <ul className="space-y-1">
          {TAB_MENU.map((item, index) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              <button
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-[#d4af37]/10 to-[#d4af37]/5 text-[#d4af37]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#1a1a1a]'
                )}
              >
                <span
                  className={cn(
                    'transition-colors',
                    activeTab === item.id
                      ? 'text-[#d4af37]'
                      : 'text-gray-400 group-hover:text-gray-600'
                  )}
                >
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="ml-auto h-2 w-2 rounded-full bg-[#d4af37]"
                  />
                )}
              </button>
            </motion.li>
          ))}

          {/* Task 24.2: 프로필 관리 링크 */}
          <motion.li
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="border-t border-gray-100 pt-2"
          >
            <Link
              href="/profiles"
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-gray-600 transition-all hover:bg-gray-50 hover:text-[#1a1a1a]"
            >
              <span className="text-gray-400 transition-colors group-hover:text-gray-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
              </span>
              <span className="font-medium">프로필 관리</span>
              <svg
                className="ml-auto h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </motion.li>

          {/* 로그아웃 버튼 */}
          <motion.li
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-2"
          >
            <button
              onClick={async () => {
                const { supabase } = await import('@/lib/supabase/client');
                await supabase.auth.signOut();
                window.location.href = '/';
              }}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-gray-600 transition-all hover:bg-red-50 hover:text-red-500"
            >
              <span className="text-gray-400 transition-colors group-hover:text-red-500">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
              </span>
              <span className="font-medium">로그아웃</span>
            </button>
          </motion.li>
        </ul>
      </motion.nav>
    </aside>
  );
}
