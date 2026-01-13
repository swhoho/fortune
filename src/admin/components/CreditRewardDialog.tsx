'use client';

/**
 * 크레딧 보상 지급 다이얼로그 컴포넌트
 */
import { useState } from 'react';
import { Loader2, Gift } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreditRewardDialogProps {
  userId: string;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreditRewardDialog({
  userId,
  userEmail,
  open,
  onOpenChange,
  onSuccess,
}: CreditRewardDialogProps) {
  const [amount, setAmount] = useState('');
  const [expiresInMonths, setExpiresInMonths] = useState('24');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amountNum = parseInt(amount);
    if (!amountNum || amountNum < 1 || amountNum > 10000) {
      toast.error('크레딧은 1 ~ 10000 사이여야 합니다');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: amountNum,
          expiresInMonths: parseInt(expiresInMonths),
          description: description.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.grantedTo}에게 ${data.amount}C 지급 완료`);
        onOpenChange(false);
        onSuccess();
        // 폼 초기화
        setAmount('');
        setExpiresInMonths('24');
        setDescription('');
      } else {
        const data = await res.json();
        toast.error(`지급 실패: ${data.code || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('크레딧 지급 오류:', error);
      toast.error('크레딧 지급 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#333] bg-[#1a1a1a] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Gift className="h-5 w-5 text-[#d4af37]" />
            크레딧 보상 지급
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 대상 유저 */}
          <div className="rounded-lg bg-[#242424] p-3">
            <p className="text-xs text-gray-500">지급 대상</p>
            <p className="text-sm font-medium text-white">{userEmail}</p>
          </div>

          {/* 지급 크레딧 */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-gray-400">
              지급 크레딧 <span className="text-red-400">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="예: 100"
              min={1}
              max={10000}
              className="border-[#333] bg-[#242424] text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500">1 ~ 10,000 크레딧</p>
          </div>

          {/* 만료 기간 */}
          <div className="space-y-2">
            <Label htmlFor="expires" className="text-gray-400">
              만료 기간
            </Label>
            <Select value={expiresInMonths} onValueChange={setExpiresInMonths}>
              <SelectTrigger className="border-[#333] bg-[#242424] text-white">
                <SelectValue placeholder="만료 기간 선택" />
              </SelectTrigger>
              <SelectContent className="border-[#333] bg-[#242424]">
                <SelectItem value="1" className="text-white hover:bg-[#333]">
                  1개월
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
                <SelectItem value="24" className="text-white hover:bg-[#333]">
                  24개월 (2년) - 기본값
                </SelectItem>
                <SelectItem value="36" className="text-white hover:bg-[#333]">
                  36개월 (3년)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 지급 사유 */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-400">
              지급 사유 (선택)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 버그 신고 보상, 이벤트 당첨"
              maxLength={200}
              className="min-h-[80px] border-[#333] bg-[#242424] text-white placeholder:text-gray-500"
            />
            <p className="text-right text-xs text-gray-500">{description.length}/200</p>
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
            disabled={!amount || isSubmitting}
            className="bg-[#d4af37] text-white hover:bg-[#c19a2e]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                지급 중...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                지급하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
