'use client';

/**
 * 크레딧 충전/사용 기록 컴포넌트
 * 마이페이지 - 크레딧 기록 탭
 */
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/** 크레딧 기록 아이템 타입 */
interface CreditHistoryItem {
  id: string;
  type: 'charge' | 'usage';
  amount: number;
  description: string;
  createdAt: string;
}

/** 충전 기록 조회 */
async function fetchPurchases(userId: string) {
  const { data, error } = await supabase
    .from('purchases')
    .select('id, credits, amount, created_at, status')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

/** 사용 기록 조회 */
async function fetchUsageLogs(userId: string) {
  const { data, error } = await supabase
    .from('ai_usage_logs')
    .select('id, credits_used, feature_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

/** 기능 타입 라벨 */
const featureTypeLabels: Record<string, string> = {
  report_generation: '리포트 생성',
  section_reanalysis: '섹션 재분석',
  follow_up_question: 'AI 질문',
  yearly_analysis: '연간 운세',
};

export function CreditHistory() {
  // 현재 사용자 ID 조회
  const { data: userId } = useQuery({
    queryKey: ['currentUserId'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id;
    },
  });

  // 충전 기록 조회
  const { data: purchases = [], isLoading: isPurchasesLoading } = useQuery({
    queryKey: ['purchases', userId],
    queryFn: () => fetchPurchases(userId!),
    enabled: !!userId,
  });

  // 사용 기록 조회
  const { data: usageLogs = [], isLoading: isUsageLoading } = useQuery({
    queryKey: ['usageLogs', userId],
    queryFn: () => fetchUsageLogs(userId!),
    enabled: !!userId,
  });

  // 기록 통합 및 정렬
  const historyItems: CreditHistoryItem[] = [
    ...purchases.map((p) => ({
      id: p.id,
      type: 'charge' as const,
      amount: p.credits,
      description: `크레딧 충전 ($${(p.amount / 100).toFixed(2)})`,
      createdAt: p.created_at,
    })),
    ...usageLogs.map((u) => ({
      id: u.id,
      type: 'usage' as const,
      amount: u.credits_used,
      description: featureTypeLabels[u.feature_type] || u.feature_type,
      createdAt: u.created_at || '',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isLoading = isPurchasesLoading || isUsageLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <ArrowUpCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mb-2 font-serif text-lg font-semibold text-[#1a1a1a]">기록이 없습니다</h3>
        <p className="text-gray-500">크레딧 충전 및 사용 기록이 여기에 표시됩니다</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="mb-6">
        <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">크레딧 기록</h2>
        <p className="mt-1 text-sm text-gray-500">충전 및 사용 내역을 확인하세요</p>
      </div>

      {/* 통계 요약 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-700">총 충전</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {purchases.reduce((sum, p) => sum + p.credits, 0)}C
          </p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-700">총 사용</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {usageLogs.reduce((sum, u) => sum + u.credits_used, 0)}C
          </p>
        </div>
      </div>

      {/* 기록 목록 */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="divide-y divide-gray-100">
          {historyItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    item.type === 'charge' ? 'bg-green-100' : 'bg-red-100'
                  )}
                >
                  {item.type === 'charge' ? (
                    <ArrowUpCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-[#1a1a1a]">{item.description}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(item.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'font-semibold',
                  item.type === 'charge' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {item.type === 'charge' ? '+' : '-'}
                {item.amount}C
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
