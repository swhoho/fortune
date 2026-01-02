'use client';

/**
 * 알림 설정 탭 컴포넌트
 * PRD Task 17.3 - 이메일 알림 On/Off, 신년 사주 리마인더
 */
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { useUserProfile, useUpdateProfile } from '@/hooks/use-user';
import { toast } from 'sonner';

/** 알림 설정 항목 */
interface NotificationItem {
  id: 'emailNotificationsEnabled' | 'yearlyReminderEnabled';
  title: string;
  description: string;
  icon: React.ReactNode;
}

const NOTIFICATION_ITEMS: NotificationItem[] = [
  {
    id: 'emailNotificationsEnabled',
    title: '이메일 알림',
    description: '서비스 업데이트, 이벤트 소식을 이메일로 받아보세요',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
        />
      </svg>
    ),
  },
  {
    id: 'yearlyReminderEnabled',
    title: '신년 사주 리마인더',
    description: '매년 새해가 되면 신년 사주 분석을 알려드려요',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
        />
      </svg>
    ),
  },
];

/** 로딩 스켈레톤 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gray-200" />
              <div>
                <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-48 rounded bg-gray-200" />
              </div>
            </div>
            <div className="h-6 w-11 rounded-full bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationSettings() {
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();

  const handleToggle = async (
    id: 'emailNotificationsEnabled' | 'yearlyReminderEnabled',
    newValue: boolean
  ) => {
    try {
      await updateProfile.mutateAsync({ [id]: newValue });
      toast.success('알림 설정이 변경되었습니다');
    } catch {
      toast.error('설정 변경에 실패했습니다');
    }
  };

  if (isLoading) {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">알림 설정</h2>
          <p className="mt-1 text-sm text-gray-500">이메일 알림 및 리마인더를 관리하세요</p>
        </motion.div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">알림 설정</h2>
        <p className="mt-1 text-sm text-gray-500">이메일 알림 및 리마인더를 관리하세요</p>
      </motion.div>

      {/* 알림 설정 목록 */}
      <div className="space-y-4">
        {NOTIFICATION_ITEMS.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[#d4af37]/20 hover:shadow-md"
          >
            {/* 장식적 배경 */}
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-[#d4af37]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* 아이콘 */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#f8f6f0] to-[#f0ebe0] text-[#d4af37]">
                  {item.icon}
                </div>
                {/* 텍스트 */}
                <div>
                  <h3 className="font-medium text-[#1a1a1a]">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
              {/* 토글 */}
              <Switch
                checked={profile?.[item.id] ?? true}
                onCheckedChange={(checked) => handleToggle(item.id, checked)}
                disabled={updateProfile.isPending}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* 추가 정보 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 rounded-2xl bg-gradient-to-br from-[#f8f6f0] to-[#f0ebe0] p-6"
      >
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#d4af37]">
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
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-[#1a1a1a]">알림 수신 동의</h4>
            <p className="mt-1 text-sm text-gray-600">
              이메일 알림은 언제든 해제할 수 있으며, 중요한 서비스 공지는 알림 설정과 관계없이
              발송될 수 있습니다.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
