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

/** 모든 크레딧 사용 기록 조회 (여러 테이블에서) */
async function fetchAllUsageLogs(userId: string) {
  const results: CreditHistoryItem[] = [];

  // 1. 리포트 생성 (profile_reports)
  const { data: reports } = await supabase
    .from('profile_reports')
    .select('id, credits_used, created_at, status')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('credits_used', 0)
    .order('created_at', { ascending: false })
    .limit(50);

  if (reports) {
    results.push(
      ...reports.map((r) => ({
        id: `report-${r.id}`,
        type: 'usage' as const,
        amount: r.credits_used,
        description: '리포트 생성',
        createdAt: r.created_at,
      }))
    );
  }

  // 2. 상담 세션 (consultation_sessions)
  const { data: sessions } = await supabase
    .from('consultation_sessions')
    .select('id, credits_used, created_at')
    .eq('user_id', userId)
    .gt('credits_used', 0)
    .order('created_at', { ascending: false })
    .limit(50);

  if (sessions) {
    results.push(
      ...sessions.map((s) => ({
        id: `session-${s.id}`,
        type: 'usage' as const,
        amount: s.credits_used,
        description: '상담 세션',
        createdAt: s.created_at,
      }))
    );
  }

  // 3. 신년 분석 (yearly_analyses)
  const { data: yearly } = await supabase
    .from('yearly_analyses')
    .select('id, credits_used, created_at, status')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('credits_used', 0)
    .order('created_at', { ascending: false })
    .limit(50);

  if (yearly) {
    results.push(
      ...yearly.map((y) => ({
        id: `yearly-${y.id}`,
        type: 'usage' as const,
        amount: y.credits_used,
        description: '신년 분석',
        createdAt: y.created_at,
      }))
    );
  }

  // 4. 섹션 재분석 (reanalysis_logs)
  const { data: reanalysis } = await supabase
    .from('reanalysis_logs')
    .select('id, credits_used, created_at, status')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('credits_used', 0)
    .order('created_at', { ascending: false })
    .limit(50);

  if (reanalysis) {
    results.push(
      ...reanalysis.map((r) => ({
        id: `reanalysis-${r.id}`,
        type: 'usage' as const,
        amount: r.credits_used,
        description: '섹션 재분석',
        createdAt: r.created_at,
      }))
    );
  }

  // 5. 후속 질문 (report_questions)
  const { data: questions } = await supabase
    .from('report_questions')
    .select('id, credits_used, created_at, status')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('credits_used', 0)
    .order('created_at', { ascending: false })
    .limit(50);

  if (questions) {
    results.push(
      ...questions.map((q) => ({
        id: `question-${q.id}`,
        type: 'usage' as const,
        amount: q.credits_used,
        description: 'AI 질문',
        createdAt: q.created_at,
      }))
    );
  }

  return results;
}

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

  // 사용 기록 조회 (모든 테이블에서)
  const { data: usageLogs = [], isLoading: isUsageLoading } = useQuery({
    queryKey: ['allUsageLogs', userId],
    queryFn: () => fetchAllUsageLogs(userId!),
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
    ...usageLogs,
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
        className="rounded-2xl bg-[#1a1a1a] p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#242424]">
          <ArrowUpCircle className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="mb-2 font-serif text-lg font-semibold text-white">기록이 없습니다</h3>
        <p className="text-gray-400">크레딧 충전 및 사용 기록이 여기에 표시됩니다</p>
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
        <h2 className="font-serif text-xl font-bold text-white">크레딧 기록</h2>
        <p className="mt-1 text-sm text-gray-400">충전 및 사용 내역을 확인하세요</p>
      </div>

      {/* 통계 요약 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-green-900/30 p-4">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-green-400" />
            <span className="text-sm text-green-400">총 충전</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-400">
            {purchases.reduce((sum, p) => sum + p.credits, 0)}C
          </p>
        </div>
        <div className="rounded-xl bg-red-900/30 p-4">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-400">총 사용</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-400">
            {usageLogs.reduce((sum, u) => sum + u.amount, 0)}C
          </p>
        </div>
      </div>

      {/* 기록 목록 */}
      <div className="rounded-2xl bg-[#1a1a1a]">
        <div className="divide-y divide-[#333]">
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
                    item.type === 'charge' ? 'bg-green-900/30' : 'bg-red-900/30'
                  )}
                >
                  {item.type === 'charge' ? (
                    <ArrowUpCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">{item.description}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(item.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'font-semibold',
                  item.type === 'charge' ? 'text-green-400' : 'text-red-400'
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
