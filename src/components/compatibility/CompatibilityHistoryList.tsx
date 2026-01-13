'use client';

/**
 * 궁합 분석 히스토리 목록 컴포넌트
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Heart, Clock, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { BRAND_COLORS } from '@/lib/constants/colors';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS, ja, zhCN, zhTW, Locale } from 'date-fns/locale';

interface CompatibilityListItem {
  id: string;
  status: string;
  totalScore: number | null;
  createdAt: string;
  analysisType: string;
  profileA: {
    id: string;
    name: string;
  };
  profileB: {
    id: string;
    name: string;
  };
}

interface CompatibilityHistoryListProps {
  locale: string;
}

/**
 * 점수 등급 색상 반환
 */
function getScoreColor(score: number | null): string {
  if (score === null) return '#6b7280';
  if (score >= 85) return '#ef4444';
  if (score >= 70) return '#22c55e';
  if (score >= 55) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#dc2626';
}

/**
 * 상태 배지 컴포넌트
 */
function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof useTranslations> }) {
  const getStatusStyle = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-900/50';
      case 'processing':
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50';
      case 'failed':
        return 'bg-red-900/30 text-red-400 border-red-900/50';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Heart className="h-3 w-3" />;
      case 'processing':
      case 'pending':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return t('history.status.completed', { defaultValue: '완료' });
      case 'processing':
        return t('history.status.processing', { defaultValue: '분석 중' });
      case 'pending':
        return t('history.status.pending', { defaultValue: '대기 중' });
      case 'failed':
        return t('history.status.failed', { defaultValue: '실패' });
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${getStatusStyle()}`}
    >
      {getStatusIcon()}
      {getStatusText()}
    </span>
  );
}

export function CompatibilityHistoryList({ locale }: CompatibilityHistoryListProps) {
  const router = useRouter();
  const t = useTranslations('compatibility');
  const [items, setItems] = useState<CompatibilityListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // date-fns 로케일 매핑
  const dateLocaleMap: Record<string, Locale> = {
    ko,
    en: enUS,
    ja,
    'zh-CN': zhCN,
    'zh-TW': zhTW,
  };
  const dateLocale = dateLocaleMap[locale] || ko;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/analysis/compatibility/list');
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch');
        }

        setItems(data.data || []);
      } catch (err) {
        console.error('히스토리 조회 실패:', err);
        setError(t('history.error', { defaultValue: '분석 기록을 불러오지 못했습니다' }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [t]);

  const handleItemClick = (item: CompatibilityListItem) => {
    if (item.status === 'completed') {
      router.push(`/compatibility/romance/${item.id}`);
    } else if (item.status === 'processing' || item.status === 'pending') {
      router.push(`/compatibility/romance/${item.id}/generating`);
    }
    // failed 상태는 클릭 시 새 분석으로 유도 (현재는 무시)
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="mt-3 text-sm text-gray-500">
          {t('history.loading', { defaultValue: '분석 기록을 불러오는 중...' })}
        </p>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="mt-3 text-sm text-red-400">{error}</p>
      </div>
    );
  }

  // 빈 상태
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${BRAND_COLORS.primary}20` }}
        >
          <Heart className="h-8 w-8 text-gray-500" />
        </div>
        <p className="mt-4 text-gray-400">
          {t('history.empty', { defaultValue: '아직 궁합 분석 기록이 없습니다' })}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {t('history.emptyHint', { defaultValue: '새 분석 탭에서 궁합 분석을 시작해보세요' })}
        </p>
      </div>
    );
  }

  // 목록 렌더링
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <motion.button
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => handleItemClick(item)}
          disabled={item.status === 'failed'}
          className={`w-full rounded-xl border border-[#333] bg-[#1a1a1a] p-4 text-left transition-all ${
            item.status === 'failed'
              ? 'cursor-not-allowed opacity-60'
              : 'hover:border-[#d4af37] hover:bg-[#242424]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* 프로필 이름 */}
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" style={{ color: BRAND_COLORS.primary }} />
                <span className="font-medium text-white">
                  {item.profileA.name} & {item.profileB.name}
                </span>
              </div>

              {/* 하단 정보 */}
              <div className="mt-2 flex items-center gap-3">
                <StatusBadge status={item.status} t={t} />

                {/* 총점 (완료된 경우만) */}
                {item.status === 'completed' && item.totalScore !== null && (
                  <span
                    className="text-sm font-semibold"
                    style={{ color: getScoreColor(item.totalScore) }}
                  >
                    {item.totalScore}
                    {t('history.scoreUnit', { defaultValue: '점' })}
                  </span>
                )}

                {/* 날짜 */}
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </span>
              </div>
            </div>

            {/* 화살표 (클릭 가능한 경우) */}
            {item.status !== 'failed' && <ChevronRight className="h-5 w-5 text-gray-500" />}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
