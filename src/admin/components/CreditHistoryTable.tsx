'use client';

/**
 * 크레딧 기록 테이블 컴포넌트
 */
import { Coins, Plus, Minus, Gift, Calendar, AlertCircle } from 'lucide-react';
import type { CreditRecord } from '@/admin/api/user-detail';

interface CreditHistoryTableProps {
  records: CreditRecord[];
}

export function CreditHistoryTable({ records }: CreditHistoryTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Plus className="h-4 w-4 text-green-400" />;
      case 'subscription':
        return <Calendar className="h-4 w-4 text-blue-400" />;
      case 'bonus':
        return <Gift className="h-4 w-4 text-purple-400" />;
      case 'usage':
        return <Minus className="h-4 w-4 text-red-400" />;
      case 'expiry':
        return <AlertCircle className="h-4 w-4 text-orange-400" />;
      default:
        return <Coins className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'purchase':
        return '구매';
      case 'subscription':
        return '구독';
      case 'bonus':
        return '보너스';
      case 'usage':
        return '사용';
      case 'expiry':
        return '만료';
      case 'refund':
        return '환불';
      default:
        return type;
    }
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const now = new Date();
    const expires = new Date(expiresAt);
    const daysUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Coins className="mb-2 h-8 w-8" />
        <p>크레딧 기록이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#333] text-left text-sm text-gray-400">
            <th className="px-4 py-3">일시</th>
            <th className="px-4 py-3">유형</th>
            <th className="px-4 py-3">변동</th>
            <th className="px-4 py-3">잔여</th>
            <th className="px-4 py-3">잔액</th>
            <th className="px-4 py-3">만료일</th>
            <th className="px-4 py-3">설명</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#333]">
          {records.map((record) => (
            <tr key={record.id} className="text-sm hover:bg-[#242424]">
              <td className="px-4 py-3 text-gray-300">{formatDate(record.created_at)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(record.type)}
                  <span className="text-gray-300">{getTypeText(record.type)}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`font-medium ${
                    record.amount >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {record.amount >= 0 ? '+' : ''}
                  {record.amount}C
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400">{record.remaining}C</td>
              <td className="px-4 py-3 font-medium text-white">{record.balance_after}C</td>
              <td className="px-4 py-3">
                {record.expires_at ? (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">
                      {new Date(record.expires_at).toLocaleDateString('ko-KR')}
                    </span>
                    {isExpiringSoon(record.expires_at) && (
                      <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-xs text-orange-400">
                        곧 만료
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-600">-</span>
                )}
              </td>
              <td className="max-w-[200px] truncate px-4 py-3 text-gray-500">
                {record.description || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
