'use client';

/**
 * 유저 상세 섹션 컴포넌트
 */
import { useState, useEffect } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { UserInfoCard } from './UserInfoCard';
import { PurchaseHistoryTable } from './PurchaseHistoryTable';
import { CreditHistoryTable } from './CreditHistoryTable';
import { AIUsageTable } from './AIUsageTable';
import { CreditRewardDialog } from './CreditRewardDialog';
import { SubscriptionGrantDialog } from './SubscriptionGrantDialog';
import type { AdminTab, UserDetailResponse } from '@/admin/api/user-detail';

interface UserDetailSectionProps {
  userId: string;
}

export function UserDetailSection({ userId }: UserDetailSectionProps) {
  const [tab, setTab] = useState<AdminTab>('purchases');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRewardOpen, setIsRewardOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}?tab=${tab}&page=${page}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('유저 상세 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId, tab, page]);

  const handleTabChange = (value: string) => {
    setTab(value as AdminTab);
    setPage(1);
  };

  const handleRewardSuccess = () => {
    fetchData();
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] p-6 text-center text-gray-500">
        유저 정보를 불러올 수 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 유저 정보 카드 */}
      <UserInfoCard
        user={data.user}
        onReward={() => setIsRewardOpen(true)}
        onSubscription={() => setIsSubscriptionOpen(true)}
      />

      {/* 탭 */}
      <div className="rounded-2xl bg-[#1a1a1a] p-6">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="mb-4 grid w-full grid-cols-3 bg-[#242424]">
            <TabsTrigger
              value="purchases"
              className="data-[state=active]:bg-[#333] data-[state=active]:text-white"
            >
              결제 기록
            </TabsTrigger>
            <TabsTrigger
              value="credits"
              className="data-[state=active]:bg-[#333] data-[state=active]:text-white"
            >
              크레딧 기록
            </TabsTrigger>
            <TabsTrigger
              value="ai_usage"
              className="data-[state=active]:bg-[#333] data-[state=active]:text-white"
            >
              AI 사용
            </TabsTrigger>
          </TabsList>

          {/* 로딩 표시 */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#d4af37]" />
            </div>
          )}

          {/* 탭 콘텐츠 */}
          {!isLoading && (
            <>
              <TabsContent value="purchases">
                <PurchaseHistoryTable records={data.records as any} />
              </TabsContent>
              <TabsContent value="credits">
                <CreditHistoryTable records={data.records as any} />
              </TabsContent>
              <TabsContent value="ai_usage">
                <AIUsageTable records={data.records as any} />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* 페이지네이션 */}
        {data.pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-[#333] pt-4">
            <p className="text-sm text-gray-500">
              총 {data.pagination.totalCount}건 중 {(page - 1) * 20 + 1}-
              {Math.min(page * 20, data.pagination.totalCount)}건
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-gray-400 hover:bg-[#242424] hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </Button>
              <span className="text-sm text-gray-400">
                {page} / {data.pagination.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="text-gray-400 hover:bg-[#242424] hover:text-white disabled:opacity-50"
              >
                다음
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 크레딧 보상 다이얼로그 */}
      <CreditRewardDialog
        userId={userId}
        userEmail={data.user.email}
        open={isRewardOpen}
        onOpenChange={setIsRewardOpen}
        onSuccess={handleRewardSuccess}
      />

      {/* 구독 부여 다이얼로그 */}
      <SubscriptionGrantDialog
        userId={userId}
        userEmail={data.user.email}
        currentSubscription={{
          status: data.user.subscription_status,
        }}
        open={isSubscriptionOpen}
        onOpenChange={setIsSubscriptionOpen}
        onSuccess={handleRewardSuccess}
      />
    </div>
  );
}
