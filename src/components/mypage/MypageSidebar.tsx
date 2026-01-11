'use client';

/**
 * 마이페이지 사이드바 컴포넌트
 * PRD 섹션 5.9 - 사이드바 메뉴 (분석 기록, 질문 기록, 알림, 설정)
 */
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Crisp } from 'crisp-sdk-web';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/hooks/use-user';

/** 사이드바 탭 타입 */
export type MypageTab = 'analysis' | 'credits' | 'notifications' | 'settings';

/** 탭 메뉴 아이템 */
interface TabMenuItem {
  id: MypageTab;
  labelKey: string;
  icon: React.ReactNode;
}

/** 탭 메뉴 목록 */
const TAB_MENU: TabMenuItem[] = [
  {
    id: 'analysis',
    labelKey: 'analysis',
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
    id: 'credits',
    labelKey: 'credits',
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
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    id: 'notifications',
    labelKey: 'notifications',
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
    labelKey: 'settings',
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
  const t = useTranslations('mypage');
  const tNav = useTranslations('nav');

  return (
    <aside className="w-full shrink-0 md:w-64">
      {/* 프로필 카드 - 다크 테마 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative mb-6 overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-[#1a1a1a] p-6"
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
            <p className="truncate font-serif text-lg font-semibold text-white">
              {profile?.name || t('profile.user')}
            </p>
            <p className="truncate text-sm text-gray-400">{profile?.email}</p>
          </div>
        </div>

        {/* 크레딧 표시 */}
        <div className="relative flex items-center justify-between rounded-xl bg-[#242424] px-4 py-3">
          <span className="text-sm text-gray-400">{t('profile.credits')}</span>
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
          {t('profile.chargeCredits')}
        </Link>
      </motion.div>

      <motion.nav
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-[#1a1a1a] p-2"
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
                    : 'text-gray-400 hover:bg-[#242424] hover:text-white'
                )}
              >
                <span
                  className={cn(
                    'transition-colors',
                    activeTab === item.id
                      ? 'text-[#d4af37]'
                      : 'text-gray-500 group-hover:text-gray-300'
                  )}
                >
                  {item.icon}
                </span>
                <span className="font-medium">{t(`sidebar.${item.labelKey}`)}</span>
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
            className="border-t border-[#333] pt-2"
          >
            <Link
              href="/profiles"
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-gray-400 transition-all hover:bg-[#242424] hover:text-white"
            >
              <span className="text-gray-500 transition-colors group-hover:text-gray-300">
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
              <span className="font-medium">{t('sidebar.profiles')}</span>
              <svg
                className="ml-auto h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </motion.li>

          {/* 고객센터 버튼 */}
          <motion.li
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.37 }}
          >
            <button
              onClick={() => {
                Crisp.chat.open();
              }}
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-gray-400 transition-all hover:bg-[#242424] hover:text-white"
            >
              <span className="text-gray-500 transition-colors group-hover:text-gray-300">
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
                    d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                  />
                </svg>
              </span>
              <span className="font-medium">{t('sidebar.customerService')}</span>
              <span className="ml-auto text-xs text-gray-500">{t('sidebar.chatSupport')}</span>
            </button>
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
              className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-gray-400 transition-all hover:bg-red-900/30 hover:text-red-400"
            >
              <span className="text-gray-500 transition-colors group-hover:text-red-400">
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
              <span className="font-medium">{tNav('logout')}</span>
            </button>
          </motion.li>
        </ul>

        {/* 안내 텍스트 - 중앙 정렬, 모바일 친화적 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 px-4 py-3 text-center"
        >
          <p className="whitespace-pre-line text-xs leading-relaxed text-gray-500">
            {t('sidebar.contactHint')}
          </p>
        </motion.div>
      </motion.nav>
    </aside>
  );
}
