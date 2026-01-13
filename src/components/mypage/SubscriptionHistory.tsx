'use client';

/**
 * 구독 기록 컴포넌트
 * 마이페이지 - 크레딧 기록 탭 하단에 표시
 * v1.0: subscriptions 테이블 + 무료체험 기록 표시
 */
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, addDays, differenceInDays } from 'date-fns';
import { Crown, Gift, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { getDateLocale } from '@/lib/date-locale';

/** 구독 상태 타입 */
type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due';

/** 구독 기록 아이템 타입 */
interface SubscriptionRecord {
  id: string;
  status: SubscriptionStatus;
  periodStart: string;
  periodEnd: string;
  price: number;
  paymentMethod: string | null;
  createdAt: string;
  canceledAt: string | null;
}

/** 무료체험 정보 타입 */
interface TrialInfo {
  startedAt: string | null;
  endedAt: string | null;
  isActive: boolean;
}

/** 통합 기록 아이템 (구독 + 무료체험) */
interface HistoryItem {
  id: string;
  type: 'subscription' | 'trial';
  date: string;
  status?: SubscriptionStatus;
  price?: number;
  paymentMethod?: string | null;
  trialEndDate?: string;
}

/**
 * subscriptions 테이블에서 구독 기록 조회
 */
async function fetchSubscriptions(userId: string): Promise<SubscriptionRecord[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, status, current_period_start, current_period_end, price, payment_method, created_at, canceled_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[SubscriptionHistory] 구독 조회 오류:', error);
    return [];
  }

  return (data || []).map((s) => ({
    id: s.id,
    status: s.status as SubscriptionStatus,
    periodStart: s.current_period_start,
    periodEnd: s.current_period_end,
    price: s.price,
    paymentMethod: s.payment_method,
    createdAt: s.created_at,
    canceledAt: s.canceled_at,
  }));
}

/**
 * users 테이블에서 무료체험 정보 조회
 */
async function fetchTrialInfo(userId: string): Promise<TrialInfo> {
  const { data, error } = await supabase
    .from('users')
    .select('daily_fortune_trial_started_at')
    .eq('id', userId)
    .single();

  if (error || !data?.daily_fortune_trial_started_at) {
    return { startedAt: null, endedAt: null, isActive: false };
  }

  const startedAt = data.daily_fortune_trial_started_at;
  const endedAt = addDays(new Date(startedAt), 3).toISOString();
  const now = new Date();
  const trialEnd = new Date(endedAt);
  const isActive = now < trialEnd;

  return { startedAt, endedAt, isActive };
}

/**
 * 금액 포맷팅 (1000 -> 1,000원)
 */
function formatPrice(price: number): string {
  return `${price.toLocaleString()}원`;
}

export function SubscriptionHistory() {
  const t = useTranslations('subscription.history');
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

  // 구독 기록 조회
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ['subscriptionHistory', userId],
    queryFn: () => fetchSubscriptions(userId!),
    enabled: !!userId,
  });

  // 무료체험 정보 조회
  const { data: trialInfo, isLoading: isLoadingTrial } = useQuery({
    queryKey: ['trialInfo', userId],
    queryFn: () => fetchTrialInfo(userId!),
    enabled: !!userId,
  });

  const isLoading = isLoadingSubscriptions || isLoadingTrial;

  // 현재 활성 구독 찾기
  const activeSubscription = subscriptions.find((s) => s.status === 'active');

  // 통합 기록 목록 생성 (구독 + 무료체험, 날짜순 정렬)
  const historyItems: HistoryItem[] = [];

  // 구독 기록 추가
  subscriptions.forEach((sub) => {
    historyItems.push({
      id: sub.id,
      type: 'subscription',
      date: sub.createdAt,
      status: sub.status,
      price: sub.price,
      paymentMethod: sub.paymentMethod,
    });
  });

  // 무료체험 기록 추가
  if (trialInfo?.startedAt) {
    historyItems.push({
      id: 'trial',
      type: 'trial',
      date: trialInfo.startedAt,
      trialEndDate: trialInfo.endedAt || undefined,
    });
  }

  // 날짜순 정렬 (최신순)
  historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  // 기록이 없는 경우
  if (historyItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8"
      >
        <div className="mb-4">
          <h2 className="font-serif text-xl font-bold text-white">{t('title')}</h2>
          <p className="mt-1 text-sm text-gray-400">{t('subtitle')}</p>
        </div>
        <div className="rounded-2xl bg-[#1a1a1a] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#242424]">
            <Crown className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="mb-2 font-serif text-lg font-semibold text-white">{t('empty')}</h3>
          <p className="text-gray-400">{t('emptyDescription')}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 space-y-4"
    >
      <div className="mb-4">
        <h2 className="font-serif text-xl font-bold text-white">{t('title')}</h2>
        <p className="mt-1 text-sm text-gray-400">{t('subtitle')}</p>
      </div>

      {/* 현재 구독 상태 카드 */}
      <div className={cn(
        'rounded-xl p-4',
        activeSubscription ? 'bg-[#d4af37]/10 border border-[#d4af37]/30' : 'bg-[#242424]'
      )}>
        <div className="flex items-center gap-3">
          {activeSubscription ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37]/20">
                <CheckCircle className="h-5 w-5 text-[#d4af37]" />
              </div>
              <div>
                <p className="font-medium text-[#d4af37]">{t('subscribing')}</p>
                <p className="text-sm text-gray-400">
                  {t('nextPayment', {
                    date: format(new Date(activeSubscription.periodEnd), 'yyyy.MM.dd', { locale: dateLocale }),
                  })}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#333]">
                <XCircle className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-400">{t('notSubscribing')}</p>
              </div>
            </>
          )}
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
                    item.type === 'subscription' ? 'bg-[#d4af37]/20' : 'bg-purple-900/30'
                  )}
                >
                  {item.type === 'subscription' ? (
                    <Crown className="h-4 w-4 text-[#d4af37]" />
                  ) : (
                    <Gift className="h-4 w-4 text-purple-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">
                      {item.type === 'subscription' ? t('premiumMembership') : t('freeTrial')}
                    </p>
                    {/* 구독 상태 배지 */}
                    {item.type === 'subscription' && item.status && item.status !== 'active' && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs',
                          item.status === 'canceled' && 'bg-amber-900/40 text-amber-400',
                          item.status === 'expired' && 'bg-gray-800 text-gray-400'
                        )}
                      >
                        {t(`status.${item.status}`)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {format(new Date(item.date), 'yyyy.MM.dd HH:mm', { locale: dateLocale })}
                    </span>
                    {/* 무료체험 종료일 */}
                    {item.type === 'trial' && item.trialEndDate && (
                      <span className="text-purple-400">
                        {t('freeTrialDays', { days: 3 })} ({t('freeTrialEnded', {
                          date: format(new Date(item.trialEndDate), 'yyyy.MM.dd', { locale: dateLocale }),
                        })})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* 구독: 결제 수단 + 금액 */}
              {item.type === 'subscription' && (
                <div className="text-right">
                  <span className="font-semibold text-[#d4af37]">
                    {formatPrice(item.price || 3900)}
                  </span>
                  {item.paymentMethod && (
                    <p className="text-xs text-gray-500">
                      {t(`paymentMethod.${item.paymentMethod}`)}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
