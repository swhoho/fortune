'use client';

/**
 * AI 사용 기록 테이블 컴포넌트
 */
import { Bot, Cpu } from 'lucide-react';
import type { AIUsageRecord } from '@/admin/api/user-detail';

interface AIUsageTableProps {
  records: AIUsageRecord[];
}

export function AIUsageTable({ records }: AIUsageTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getFeatureText = (featureType: string) => {
    switch (featureType) {
      case 'report':
        return '사주 분석';
      case 'yearly':
        return '신년 운세';
      case 'compatibility':
        return '궁합 분석';
      case 'consultation':
        return 'AI 상담';
      case 'reanalysis':
        return '재분석';
      case 'daily':
        return '오늘의 운세';
      default:
        return featureType;
    }
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Bot className="mb-2 h-8 w-8" />
        <p>AI 사용 기록이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#333] text-left text-sm text-gray-400">
            <th className="px-4 py-3">일시</th>
            <th className="px-4 py-3">기능</th>
            <th className="px-4 py-3">모델</th>
            <th className="px-4 py-3">입력 토큰</th>
            <th className="px-4 py-3">출력 토큰</th>
            <th className="px-4 py-3">총 토큰</th>
            <th className="px-4 py-3">크레딧</th>
            <th className="px-4 py-3">비용</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#333]">
          {records.map((record) => (
            <tr key={record.id} className="text-sm hover:bg-[#242424]">
              <td className="px-4 py-3 text-gray-300">{formatDate(record.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-400" />
                  <span className="text-white">{getFeatureText(record.feature_type)}</span>
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{record.model}</td>
              <td className="px-4 py-3 text-gray-300">{formatNumber(record.input_tokens)}</td>
              <td className="px-4 py-3 text-gray-300">{formatNumber(record.output_tokens)}</td>
              <td className="px-4 py-3 font-medium text-white">
                {formatNumber(record.total_tokens || record.input_tokens + record.output_tokens)}
              </td>
              <td className="px-4 py-3 text-[#d4af37]">{record.credits_used}C</td>
              <td className="px-4 py-3 text-gray-500">
                {record.cost_usd ? `$${record.cost_usd.toFixed(4)}` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
