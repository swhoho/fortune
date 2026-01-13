'use client';

/**
 * 크레딧 충전/사용 기록 컴포넌트
 * 마이페이지 - 크레딧 기록 탭
 * v2.0: credit_transactions 테이블 기반, 만료 정보 표시
 * v2.2: SubscriptionHistory 분리 (별도 탭으로 이동)
 */
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { getDateLocale } from '@/lib/date-locale';

/** 크레딧 트랜잭션 타입 */
type TransactionType = 'purchase' | 'subscription' | 'usage' | 'expiry' | 'bonus' | 'refund';

/** 크레딧 기록 아이템 타입 */
interface CreditHistoryItem {
  id: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  /** 설명 텍스트 */
  description: string | null;
  /** 만료일 (충전 기록에만) */
  expiresAt: string | null;
  /** 잔여 크레딧 (충전 기록에만) */
  remaining: number;
  createdAt: string;
}

/**
 * credit_transactions에서 기록 조회
 * v2.0: 통합 테이블에서 모든 기록 조회
 */
async function fetchCreditTransactions(userId: string): Promise<CreditHistoryItem[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('id, type, amount, balance_after, description, expires_at, remaining, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[CreditHistory] 조회 오류:', error);
    return [];
  }

  return (data || []).map((t) => ({
    id: t.id,
    type: t.type as TransactionType,
    amount: t.amount,
    balanceAfter: t.balance_after,
    description: t.description,
    expiresAt: t.expires_at,
    remaining: t.remaining || 0,
    createdAt: t.created_at,
  }));
}

/** 만료 경고 배지 컴포넌트 */
function ExpiryBadge({
  expiresAt,
  remaining,
  t,
}: {
  expiresAt: string | null;
  remaining: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  if (!expiresAt || remaining <= 0) return null;

  const daysLeft = differenceInDays(new Date(expiresAt), new Date());

  // 이미 만료
  if (daysLeft < 0) return null;

  // 30일 이내 만료 예정
  if (daysLeft <= 30) {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-400">
        <AlertTriangle className="h-3 w-3" />
        {t('expiringSoon', { days: daysLeft })}
      </span>
    );
  }

  return null;
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

  // credit_transactions에서 기록 조회
  const { data: historyItems = [], isLoading } = useQuery({
    queryKey: ['creditTransactions', userId],
    queryFn: () => fetchCreditTransactions(userId!),
    enabled: !!userId,
  });

  /** 트랜잭션 유형에 따른 설명 */
  const getItemDescription = (item: CreditHistoryItem): string => {
    // DB에 저장된 설명이 있으면 우선 사용
    if (item.description) return item.description;

    // 유형별 기본 설명
    switch (item.type) {
      case 'purchase':
        return t('type.purchase');
      case 'subscription':
        return t('type.subscription');
      case 'usage':
        return t('type.usage');
      case 'expiry':
        return t('type.expiry');
      case 'bonus':
        return t('type.bonus');
      case 'refund':
        return t('type.refund');
      default:
        return t('type.unknown');
    }
  };

  /** 양수/음수 판별 (충전 vs 사용) */
  const isPositive = (item: CreditHistoryItem): boolean => {
    return item.amount > 0;
  };

  // 통계 계산
  const totalCharge = historyItems
    .filter((item) => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);

  const totalUsage = historyItems
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

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
            <p className="mt-2 text-2xl font-bold text-green-400">{totalCharge}C</p>
          </div>
          <div className="rounded-xl bg-red-900/30 p-4">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-red-400" />
              <span className="text-sm text-red-400">{t('totalUsage')}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-red-400">{totalUsage}C</p>
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
                      isPositive(item) ? 'bg-green-900/30' : 'bg-red-900/30'
                    )}
                  >
                    {isPositive(item) ? (
                      <ArrowUpCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium text-white">{getItemDescription(item)}</p>
                      {/* 충전 타입에만 만료 경고 표시 */}
                      {['purchase', 'subscription', 'bonus', 'refund'].includes(item.type) && (
                        <ExpiryBadge expiresAt={item.expiresAt} remaining={item.remaining} t={t} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {format(new Date(item.createdAt), 'yyyy.MM.dd HH:mm', { locale: dateLocale })}
                      </span>
                      {/* 만료일 표시 (충전 기록에만) */}
                      {item.expiresAt &&
                        ['purchase', 'subscription', 'bonus'].includes(item.type) && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock className="h-3 w-3" />
                            {t('expiresOn', {
                              date: format(new Date(item.expiresAt), 'yyyy.MM.dd', {
                                locale: dateLocale,
                              }),
                            })}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'font-semibold',
                      isPositive(item) ? 'text-green-400' : 'text-red-400'
                    )}
                  >
                    {isPositive(item) ? '+' : ''}
                    {item.amount}C
                  </span>
                  {/* 잔액 표시 */}
                  <p className="text-xs text-gray-500">
                    {t('balance', { amount: item.balanceAfter })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
    </motion.div>
  );
}
