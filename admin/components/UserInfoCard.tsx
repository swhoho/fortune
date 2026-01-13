'use client';

/**
 * 유저 정보 카드 컴포넌트
 */
import { User, Mail, Calendar, Coins, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserDetail } from '@/admin/api/user-detail';

interface UserInfoCardProps {
  user: UserDetail;
  onReward: () => void;
}

export function UserInfoCard({ user, onReward }: UserInfoCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#333]">
            <User className="h-7 w-7 text-gray-400" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-white">
              {user.name || '이름 없음'}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        <Button
          onClick={onReward}
          className="bg-[#d4af37] text-white hover:bg-[#c19a2e]"
        >
          <Gift className="mr-2 h-4 w-4" />
          크레딧 보상
        </Button>
      </div>

      {/* 상세 정보 그리드 */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* 크레딧 */}
        <div className="rounded-lg bg-[#242424] p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Coins className="h-4 w-4" />
            <span className="text-xs">크레딧</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-[#d4af37]">{user.credits}C</p>
        </div>

        {/* 구독 상태 */}
        <div className="rounded-lg bg-[#242424] p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-xs">구독 상태</span>
          </div>
          <p className="mt-1 text-lg font-semibold">
            {user.subscription_status === 'active' ? (
              <span className="text-green-400">활성</span>
            ) : (
              <span className="text-gray-500">비활성</span>
            )}
          </p>
        </div>

        {/* 가입일 */}
        <div className="rounded-lg bg-[#242424] p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">가입일</span>
          </div>
          <p className="mt-1 text-sm font-medium text-white">{formatDate(user.created_at)}</p>
        </div>

        {/* 무료 분석 사용 */}
        <div className="rounded-lg bg-[#242424] p-4">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-xs">무료 분석</span>
          </div>
          <p className="mt-1 text-sm font-medium">
            {user.first_free_used ? (
              <span className="text-gray-500">사용함</span>
            ) : (
              <span className="text-green-400">미사용</span>
            )}
          </p>
        </div>
      </div>

      {/* User ID (복사 가능) */}
      <div className="mt-4 rounded-lg bg-[#242424] px-4 py-2">
        <p className="text-xs text-gray-500">User ID</p>
        <p className="font-mono text-sm text-gray-400">{user.id}</p>
      </div>
    </div>
  );
}
