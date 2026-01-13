'use client';

/**
 * 결제 기록 테이블 컴포넌트
 */
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { PurchaseRecord } from '@/admin/api/user-detail';

interface PurchaseHistoryTableProps {
  records: PurchaseRecord[];
}

export function PurchaseHistoryTable({ records }: PurchaseHistoryTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'KRW') {
      return `₩${amount.toLocaleString()}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'failed':
        return '실패';
      case 'pending':
        return '대기';
      default:
        return status;
    }
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <CreditCard className="mb-2 h-8 w-8" />
        <p>결제 기록이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#333] text-left text-sm text-gray-400">
            <th className="px-4 py-3">결제일시</th>
            <th className="px-4 py-3">패키지</th>
            <th className="px-4 py-3">금액</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3">결제 ID</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#333]">
          {records.map((record) => (
            <tr key={record.id} className="text-sm hover:bg-[#242424]">
              <td className="px-4 py-3 text-gray-300">{formatDate(record.created_at)}</td>
              <td className="px-4 py-3 text-white">{record.package_id}</td>
              <td className="px-4 py-3 font-medium text-[#d4af37]">
                {formatAmount(record.amount, record.currency)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(record.status)}
                  <span className="text-gray-300">{getStatusText(record.status)}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs text-gray-500">
                  {record.stripe_session_id?.slice(0, 20) || '-'}...
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
