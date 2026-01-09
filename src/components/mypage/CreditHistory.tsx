'use client';

/**
 * 크레딧 충전/사용 기록 컴포넌트
 * 마이페이지 - 크레딧 기록 탭
 * 프로필 이름, 연도 등 상세 정보 포함
 */
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { getDateLocale } from '@/lib/date-locale';

/** 크레딧 기록 아이템 타입 */
interface CreditHistoryItem {
  id: string;
  type: 'charge' | 'usage';
  amount: number;
  /** 번역 키 */
  descriptionKey: string;
  /** 동적 설명 (프로필 이름 등 포함) */
  description?: string;
  /** 충전 금액 (달러) - 충전 기록에만 존재 */
  chargeAmount?: string;
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

/** 프로필 이름 추출 헬퍼 */
function getProfileName(profile: { name: string } | { name: string }[] | null): string {
  if (!profile) return '';
  if (Array.isArray(profile)) return profile[0]?.name || '';
  return profile.name || '';
}

/** 모든 크레딧 사용 기록 조회 (여러 테이블에서) */
async function fetchAllUsageLogs(
  userId: string,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  const results: CreditHistoryItem[] = [];

  // 1. 리포트 생성 (profile_reports) - 프로필 이름 조인
  const { data: reports } = await supabase
    .from('profile_reports')
    .select('id, credits_used, created_at, status, profiles(name)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('credits_used', 0)
    .order('created_at', { ascending: false })
    .limit(50);

  if (reports) {
    results.push(
      ...reports.map((r) => {
        const profileName = getProfileName(
          r.profiles as { name: string } | { name: string }[] | null
        );
        return {
          id: `report-${r.id}`,
          type: 'usage' as const,
          amount: r.credits_used,
          descriptionKey: 'report',
          description: profileName ? t('usage.report', { name: profileName }) : undefined,
          createdAt: r.created_at,
        };
      })
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
        descriptionKey: 'session',
        createdAt: s.created_at,
      }))
    );
  }

  // 3. 신년 분석 (yearly_analyses) - 프로필 이름 + 연도 조인
  const { data: yearly } = await supabase
    .from('yearly_analyses')
    .select('id, credits_used, created_at, status, target_year, profiles(name)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('credits_used', 0)
    .order('created_at', { ascending: false })
    .limit(50);

  if (yearly) {
    results.push(
      ...yearly.map((y) => {
        const profileName = getProfileName(
          y.profiles as { name: string } | { name: string }[] | null
        );
        return {
          id: `yearly-${y.id}`,
          type: 'usage' as const,
          amount: y.credits_used,
          descriptionKey: 'yearly',
          description:
            profileName && y.target_year
              ? t('usage.yearly', { year: y.target_year, name: profileName })
              : undefined,
          createdAt: y.created_at,
        };
      })
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
        descriptionKey: 'reanalysis',
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
        descriptionKey: 'question',
        createdAt: q.created_at,
      }))
    );
  }

  // 6. 궁합 분석 (compatibility_analyses) - 두 프로필 이름 조인
  const { data: compatibility } = await supabase
    .from('compatibility_analyses')
    .select(
      `
      id, credits_used, created_at, status,
      profile_a:profiles!compatibility_analyses_profile_id_a_fkey(name),
      profile_b:profiles!compatibility_analyses_profile_id_b_fkey(name)
    `
    )
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('credits_used', 0)
    .order('created_at', { ascending: false })
    .limit(50);

  if (compatibility) {
    results.push(
      ...compatibility.map((c) => {
        const nameA = getProfileName(
          c.profile_a as { name: string } | { name: string }[] | null
        );
        const nameB = getProfileName(
          c.profile_b as { name: string } | { name: string }[] | null
        );
        return {
          id: `compatibility-${c.id}`,
          type: 'usage' as const,
          amount: c.credits_used,
          descriptionKey: 'compatibility',
          description:
            nameA && nameB ? t('usage.compatibility', { nameA, nameB }) : undefined,
          createdAt: c.created_at,
        };
      })
    );
  }

  return results;
}

export function CreditHistory() {
  const t = useTranslations('credits.history');
  const locale = useLocale();
  const dateLocale = getDateLocale(locale);

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
    queryFn: () => fetchAllUsageLogs(userId!, t),
    enabled: !!userId,
  });

  // 기록 통합 및 정렬
  const historyItems: CreditHistoryItem[] = [
    ...purchases.map((p) => ({
      id: p.id,
      type: 'charge' as const,
      amount: p.credits,
      descriptionKey: 'charge',
      chargeAmount: `$${(p.amount / 100).toFixed(2)}`,
      createdAt: p.created_at,
    })),
    ...usageLogs,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  /** 아이템 설명 (동적 설명 우선) */
  const getItemDescription = (item: CreditHistoryItem): string => {
    if (item.type === 'charge') {
      return `${t('charge')} (${item.chargeAmount})`;
    }
    // 동적 설명이 있으면 사용, 없으면 기본 번역
    if (item.description) {
      return item.description;
    }
    return t(`usage.${item.descriptionKey}`);
  };

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
        <h3 className="mb-2 font-serif text-lg font-semibold text-white">{t('empty')}</h3>
        <p className="text-gray-400">{t('emptyDescription')}</p>
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
        <h2 className="font-serif text-xl font-bold text-white">{t('title')}</h2>
        <p className="mt-1 text-sm text-gray-400">{t('subtitle')}</p>
      </div>

      {/* 통계 요약 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-green-900/30 p-4">
          <div className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-green-400" />
            <span className="text-sm text-green-400">{t('totalCharge')}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-400">
            {purchases.reduce((sum, p) => sum + p.credits, 0)}C
          </p>
        </div>
        <div className="rounded-xl bg-red-900/30 p-4">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-400">{t('totalUsage')}</span>
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
                  <p className="font-medium text-white">{getItemDescription(item)}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(item.createdAt), 'yyyy.MM.dd HH:mm', { locale: dateLocale })}
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
