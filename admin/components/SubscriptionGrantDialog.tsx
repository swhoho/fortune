'use client';

/**
 * 구독 부여 다이얼로그 컴포넌트
 */
import { useState } from 'react';
import { Loader2, Crown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface SubscriptionGrantDialogProps {
  userId: string;
  userEmail: string;
  currentSubscription?: {
    status: string | null;
    periodEnd?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SubscriptionGrantDialog({
  userId,
  userEmail,
  currentSubscription,
  open,
  onOpenChange,
  onSuccess,
}: SubscriptionGrantDialogProps) {
  const [months, setMonths] = useState('1');
  const [grantCredits, setGrantCredits] = useState(true);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthsNum = parseInt(months);
  const creditsToGrant = grantCredits ? monthsNum * 50 : 0;

  const isActive = currentSubscription?.status === 'active';
  const periodEndStr = currentSubscription?.periodEnd
    ? new Date(currentSubscription.periodEnd).toLocaleDateString('ko-KR')
    : null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          months: monthsNum,
          grantCredits,
          description: description.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const endDate = new Date(data.subscription.periodEnd).toLocaleDateString('ko-KR');
        toast.success(`${data.grantedTo}에게 구독 ${data.months}개월 부여 완료 (~ ${endDate})`);
        onOpenChange(false);
        onSuccess();
        // 폼 초기화
        setMonths('1');
        setGrantCredits(true);
        setDescription('');
      } else {
        const data = await res.json();
        toast.error(`부여 실패: ${data.code || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('구독 부여 오류:', error);
      toast.error('구독 부여 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#333] bg-[#1a1a1a] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Crown className="h-5 w-5 text-[#d4af37]" />
            구독 권한 부여
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 대상 유저 */}
          <div className="rounded-lg bg-[#242424] p-3">
            <p className="text-xs text-gray-500">부여 대상</p>
            <p className="text-sm font-medium text-white">{userEmail}</p>
            {isActive && periodEndStr && (
              <p className="mt-1 text-xs text-green-400">
                현재 구독 중 (~ {periodEndStr})
              </p>
            )}
          </div>

          {/* 구독 기간 */}
          <div className="space-y-2">
            <Label htmlFor="months" className="text-gray-400">
              구독 기간 <span className="text-red-400">*</span>
            </Label>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger className="border-[#333] bg-[#242424] text-white">
                <SelectValue placeholder="기간 선택" />
              </SelectTrigger>
              <SelectContent className="border-[#333] bg-[#242424]">
                <SelectItem value="1" className="text-white hover:bg-[#333]">
                  1개월
                </SelectItem>
                <SelectItem value="2" className="text-white hover:bg-[#333]">
                  2개월
                </SelectItem>
                <SelectItem value="3" className="text-white hover:bg-[#333]">
                  3개월
                </SelectItem>
                <SelectItem value="6" className="text-white hover:bg-[#333]">
                  6개월
                </SelectItem>
                <SelectItem value="12" className="text-white hover:bg-[#333]">
                  12개월 (1년)
                </SelectItem>
              </SelectContent>
            </Select>
            {isActive && (
              <p className="text-xs text-gray-500">
                기존 만료일({periodEndStr})부터 {monthsNum}개월 연장됩니다
              </p>
            )}
          </div>

          {/* 크레딧 지급 옵션 */}
          <div className="flex items-center justify-between rounded-lg bg-[#242424] p-3">
            <div>
              <Label htmlFor="grantCredits" className="text-gray-400">
                구독 크레딧 함께 지급
              </Label>
              <p className="text-xs text-gray-500">월 50C × {monthsNum}개월 = {creditsToGrant}C</p>
            </div>
            <Switch
              id="grantCredits"
              checked={grantCredits}
              onCheckedChange={setGrantCredits}
            />
          </div>

          {/* 부여 사유 */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-400">
              부여 사유 (선택)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: VIP 고객 서비스, 이벤트 당첨"
              maxLength={200}
              className="min-h-[80px] border-[#333] bg-[#242424] text-white placeholder:text-gray-500"
            />
            <p className="text-right text-xs text-gray-500">{description.length}/200</p>
          </div>

          {/* 요약 */}
          <div className="rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 p-3">
            <p className="text-sm text-[#d4af37]">
              {isActive ? '기간 연장' : '신규 구독'}: <strong>{monthsNum}개월</strong>
              {grantCredits && (
                <span className="ml-2">+ {creditsToGrant}C 지급</span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-gray-400 hover:bg-[#242424] hover:text-white"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#d4af37] text-white hover:bg-[#c19a2e]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                부여 중...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                구독 부여
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
