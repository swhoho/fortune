'use client';

/**
 * 구독 기록 컴포넌트
 * 마이페이지 - 구독 관리 탭
 * v2.0: 구독 취소 버튼 및 확인 다이얼로그 추가
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { Crown, Gift, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { getDateLocale } from '@/lib/date-locale';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  periodEnd?: string;
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
  const queryClient = useQueryClient();

  // 취소 다이얼로그 상태
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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

  // 구독 취소 핸들러
  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    setCancelError(null);

    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        // 쿼리 리프레시
        queryClient.invalidateQueries({ queryKey: ['subscriptionHistory'] });
        queryClient.invalidateQueries({ queryKey: ['subscriptionStatus'] });
        setShowCancelDialog(false);
      } else {
        setCancelError(data.error || t('cancelError'));
      }
    } catch {
      setCancelError(t('cancelError'));
    } finally {
      setIsCanceling(false);
    }
  };

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
      periodEnd: sub.periodEnd,
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
      className="space-y-4"
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
        <div className="flex items-center justify-between">
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

          {/* 구독 취소 버튼 */}
          {activeSubscription && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-300"
            >
              {t('cancelButton')}
            </Button>
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
                    {/* 관리자 지급 배지 */}
                    {item.type === 'subscription' && item.price === 0 && (
                      <span className="rounded-full bg-purple-900/40 px-2 py-0.5 text-xs text-purple-400">
                        {t('adminGranted')}
                      </span>
                    )}
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
                  <span className={cn(
                    'font-semibold',
                    item.price === 0 ? 'text-purple-400' : 'text-[#d4af37]'
                  )}>
                    {item.price === 0 ? t('adminGranted') : formatPrice(item.price || 3900)}
                  </span>
                  {item.paymentMethod && item.price !== 0 && (
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

      {/* 구독 취소 확인 다이얼로그 */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="border-[#333] bg-[#1a1a1a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              {t('cancelDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {activeSubscription && t('cancelDialog.description', {
                date: format(new Date(activeSubscription.periodEnd), 'yyyy년 M월 d일', { locale: dateLocale }),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* 취소 후에도 이용 가능한 혜택 안내 */}
          {activeSubscription && (
            <div className="rounded-lg bg-[#242424] p-4">
              <p className="mb-2 text-sm font-medium text-gray-300">
                {t('cancelDialog.benefits')}
              </p>
              <ul className="space-y-1 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  {t('cancelDialog.benefitDailyFortune', {
                    date: format(new Date(activeSubscription.periodEnd), 'M월 d일', { locale: dateLocale }),
                  })}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  {t('cancelDialog.benefitCredits')}
                </li>
              </ul>
            </div>
          )}

          {/* 에러 메시지 */}
          {cancelError && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
              {cancelError}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isCanceling}
              className="border-[#333] bg-transparent text-gray-400 hover:bg-[#242424] hover:text-white"
            >
              {t('cancelDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelSubscription();
              }}
              disabled={isCanceling}
              className="bg-red-900 text-white hover:bg-red-800"
            >
              {isCanceling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('cancelDialog.confirm')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
