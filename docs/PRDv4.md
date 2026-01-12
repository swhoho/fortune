# PRD v4.0 - Master's Insight AI 기능 확장

> 작성일: 2026-01-12
> 버전: 4.0

---

## 개요

5가지 신규 기능 개발을 통한 사용자 경험 및 수익화 개선

| 기능 | 설명 | 우선순위 |
|------|------|----------|
| 최초 무료 사주 분석 | 계정 생성 후 첫 프로필 첫 리포트 무료 | 높음 |
| 대표 프로필 시스템 | 오늘의 운세 기본 프로필 설정 | 높음 |
| 프로필 삭제 시 리포트 삭제 | CASCADE 삭제 + 사용자 안내 | 중간 |
| 크레딧 유효기간 시스템 | 유료 2년, 구독 1개월 만료 | 높음 |
| 오늘의 운세 + 구독 시스템 | 3,900원/월 구독 + 월 50C | 높음 |

---

## 병렬 작업 그룹

```
┌─────────────────────────────────────────────────────────────────┐
│                         Group 1 (병렬) ✅                        │
│  Task 1: 대표 프로필    Task 2: 최초 무료    Task 3: 프로필 삭제  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (완료 후)
┌─────────────────────────────────────────────────────────────────┐
│                         Group 2 (병렬) ✅                        │
│      Task 4: 크레딧 유효기간        Task 5: 구독 시스템 (Mock)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (완료 후)
┌─────────────────────────────────────────────────────────────────┐
│                         Group 3 (순차) ✅                        │
│                     Task 6: 오늘의 운세 시스템                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (완료 후)
┌─────────────────────────────────────────────────────────────────┐
│                         Group 4 (순차)                           │
│        Task 7-11: 오늘의 운세 고도화 (고전 명리학 기반)           │
└─────────────────────────────────────────────────────────────────┘
```

---

# Group 1: 프로필 시스템 개선 (병렬 가능) ✅ 완료

## Task 1: 대표 프로필 시스템 ✅

### 요구사항
- 사용자당 1개의 대표 프로필 설정
- 오늘의 운세에서 기본 프로필로 사용
- 최초 프로필 생성 시 자동으로 대표 설정
- 대표 프로필 삭제 시 가장 오래된 프로필로 자동 전환
- 사용자가 수동으로 대표 프로필 변경 가능

### Task 1.1: DB 스키마 수정
**파일**: `supabase/migrations/YYYYMMDD_add_is_primary_to_profiles.sql`

```sql
-- profiles 테이블에 is_primary 컬럼 추가
ALTER TABLE profiles ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;

-- 기존 사용자별 첫 번째 프로필을 대표로 설정
UPDATE profiles p
SET is_primary = TRUE
WHERE p.id = (
  SELECT id FROM profiles
  WHERE user_id = p.user_id
  ORDER BY created_at ASC
  LIMIT 1
);

-- 사용자당 하나의 대표 프로필만 허용하는 트리거
CREATE OR REPLACE FUNCTION ensure_single_primary_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE profiles
    SET is_primary = FALSE
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ensure_single_primary
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_profile();
```

### Task 1.2: 프로필 생성 시 자동 대표 설정
**파일**: `src/app/api/profiles/route.ts`

```typescript
// POST /api/profiles - 수정 사항
// 1. 해당 사용자의 첫 번째 프로필인지 확인
// 2. 첫 번째면 is_primary = true로 설정
const existingProfiles = await supabase
  .from('profiles')
  .select('id')
  .eq('user_id', user.id);

const isFirst = !existingProfiles.data?.length;

const { data, error } = await supabase
  .from('profiles')
  .insert({
    ...profileData,
    is_primary: isFirst,
  });
```

### Task 1.3: 프로필 삭제 시 대표 자동 전환
**파일**: `src/app/api/profiles/[id]/route.ts`

```typescript
// DELETE /api/profiles/:id - 수정 사항
// 1. 삭제할 프로필이 대표인지 확인
// 2. 대표라면 가장 오래된 다른 프로필을 대표로 설정

if (profile.is_primary) {
  const { data: nextPrimary } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .neq('id', id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (nextPrimary) {
    await supabase
      .from('profiles')
      .update({ is_primary: true })
      .eq('id', nextPrimary.id);
  }
}
```

### Task 1.4: 대표 프로필 수동 변경 API
**파일**: `src/app/api/profiles/[id]/set-primary/route.ts`

```typescript
// POST /api/profiles/:id/set-primary
// 1. 해당 프로필을 대표로 설정
// 2. 트리거가 기존 대표 해제 처리
```

### Task 1.5: UI 업데이트
**파일**:
- `src/components/profile/ProfileCard.tsx` - 대표 프로필 뱃지 표시
- `src/app/[locale]/profiles/page.tsx` - 대표 설정 버튼 추가

---

## Task 2: 최초 무료 사주 분석 ✅

### 요구사항
- **user_id당 최초 1회** 전체 사주 분석 무료 (70C → 0C)
- 프로필 상관없이 user_id 기준으로 추적 (`users.first_free_used`)
- 무료 분석 시 안내 문구 표시: "최초 1회에 한해서 무료제공 됩니다. 이후 분석에는 크레딧이 소모됩니다."

### Task 2.1: DB 스키마 수정
**파일**: `supabase/migrations/YYYYMMDD_add_first_free_used.sql`

```sql
-- users 테이블에 first_free_used 컬럼 추가
ALTER TABLE users ADD COLUMN first_free_used BOOLEAN DEFAULT FALSE;

-- 기존 사용자 중 리포트가 있는 경우 true로 설정
UPDATE users u
SET first_free_used = TRUE
WHERE EXISTS (
  SELECT 1 FROM profile_reports pr
  WHERE pr.user_id = u.id AND pr.status = 'completed'
);
```

### Task 2.2: 리포트 생성 API 수정
**파일**: `src/app/api/profiles/[id]/report/route.ts`

```typescript
// POST /api/profiles/:id/report - 수정 사항

// 1. 무료 대상인지 확인
const { data: userData } = await supabase
  .from('users')
  .select('first_free_used, credits')
  .eq('id', user.id)
  .single();

// 2. 첫 번째 프로필인지 확인
const { data: profile } = await supabase
  .from('profiles')
  .select('is_primary, created_at')
  .eq('id', profileId)
  .single();

const isFirstProfile = profile.is_primary; // 대표 프로필 = 첫 번째 프로필
const isFreeEligible = !userData.first_free_used && isFirstProfile;

// 3. 크레딧 차감 (무료 대상이 아닌 경우만)
const creditsToUse = isFreeEligible ? 0 : SERVICE_CREDITS.profileReport;

if (!isFreeEligible && userData.credits < creditsToUse) {
  return insufficientCreditsError();
}

// 4. 무료 사용 완료 표시
if (isFreeEligible) {
  await supabase
    .from('users')
    .update({ first_free_used: true })
    .eq('id', user.id);
}

// 5. 응답에 무료 여부 포함
return NextResponse.json({
  success: true,
  isFreeAnalysis: isFreeEligible,
  message: isFreeEligible
    ? '최초 1회에 한해서 무료제공 됩니다. 새로운 프로필 등록 시 크레딧이 소모됩니다.'
    : null,
});
```

### Task 2.3: 무료 대상 확인 API
**파일**: `src/app/api/user/free-analysis-check/route.ts`

```typescript
// GET /api/user/free-analysis-check
// 응답: { eligible: boolean, reason?: string }
```

### Task 2.4: UI 안내 문구 추가
**파일**:
- `src/components/credits/CreditDeductionDialog.tsx` - 무료 분석 시 별도 안내
- `src/app/[locale]/profiles/[id]/page.tsx` - 분석 시작 전 무료 여부 표시

---

## Task 3: 프로필 삭제 시 리포트 삭제 ✅

### 요구사항
- 프로필 삭제 시 관련 모든 데이터 CASCADE 삭제
- 삭제 확인 모달에 경고 문구 표시
- 삭제 대상: profile_reports, yearly_analyses, compatibility_analyses, consultation_sessions, report_questions

### Task 3.1: Supabase CASCADE 설정 확인/수정
**파일**: `supabase/migrations/YYYYMMDD_add_cascade_delete.sql`

```sql
-- profile_reports FK CASCADE 설정
ALTER TABLE profile_reports
DROP CONSTRAINT IF EXISTS profile_reports_profile_id_fkey,
ADD CONSTRAINT profile_reports_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- yearly_analyses FK CASCADE 설정
ALTER TABLE yearly_analyses
DROP CONSTRAINT IF EXISTS yearly_analyses_profile_id_fkey,
ADD CONSTRAINT yearly_analyses_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- compatibility_analyses FK CASCADE 설정 (양쪽)
ALTER TABLE compatibility_analyses
DROP CONSTRAINT IF EXISTS compatibility_analyses_profile_id_a_fkey,
ADD CONSTRAINT compatibility_analyses_profile_id_a_fkey
  FOREIGN KEY (profile_id_a) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE compatibility_analyses
DROP CONSTRAINT IF EXISTS compatibility_analyses_profile_id_b_fkey,
ADD CONSTRAINT compatibility_analyses_profile_id_b_fkey
  FOREIGN KEY (profile_id_b) REFERENCES profiles(id) ON DELETE CASCADE;

-- consultation_sessions FK CASCADE 설정
ALTER TABLE consultation_sessions
DROP CONSTRAINT IF EXISTS consultation_sessions_profile_id_fkey,
ADD CONSTRAINT consultation_sessions_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- report_questions FK CASCADE 설정
ALTER TABLE report_questions
DROP CONSTRAINT IF EXISTS report_questions_profile_id_fkey,
ADD CONSTRAINT report_questions_profile_id_fkey
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

### Task 3.2: 삭제 확인 모달 UI 업데이트
**파일**: `src/components/profile/DeleteProfileDialog.tsx`

```typescript
// 경고 문구 추가
const warningMessage = t('profile.deleteWarning');
// "해당 프로필로 생성된 모든 리포트, 신년분석, 궁합분석, 상담 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
```

### Task 3.3: 다국어 메시지 추가
**파일**: `messages/ko.json`, `messages/en.json` 등

```json
{
  "profile": {
    "deleteWarning": "해당 프로필로 생성된 모든 리포트, 신년분석, 궁합분석, 상담 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
  }
}
```

---

# Group 2: 크레딧 및 구독 시스템 (병렬 가능) ✅ 완료

## Task 4: 크레딧 유효기간 시스템 ✅

### 요구사항
- 유료 크레딧: 결제일로부터 2년 만료
- 구독 크레딧: 지급일로부터 1개월 만료
- 크레딧 차감 시 만료일 가까운 순서로 사용 (FIFO)
- 만료된 크레딧 자동 정리

### Task 4.1: DB 스키마 설계
**파일**: `supabase/migrations/YYYYMMDD_create_credit_transactions.sql`

```sql
-- credit_transactions 테이블 생성
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 트랜잭션 유형
  type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'subscription', 'usage', 'expiry', 'bonus')),

  -- 크레딧 변동
  amount INTEGER NOT NULL, -- 양수: 충전, 음수: 사용/만료
  balance_after INTEGER NOT NULL, -- 트랜잭션 후 잔액

  -- 만료 관련
  expires_at TIMESTAMPTZ, -- NULL이면 만료 없음 (레거시)
  remaining INTEGER, -- 남은 크레딧 (충전 시에만 사용)

  -- 참조
  purchase_id TEXT REFERENCES purchases(id),
  subscription_id UUID, -- subscriptions 테이블 참조 (추후)
  service_type VARCHAR(30), -- 사용 시: report, yearly, compatibility, question, consultation

  -- 메타
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_credit_transactions_user_expires
ON credit_transactions(user_id, expires_at)
WHERE remaining > 0 AND (expires_at IS NULL OR expires_at > NOW());

-- 기존 users.credits를 credit_transactions로 마이그레이션
INSERT INTO credit_transactions (user_id, type, amount, balance_after, remaining, description)
SELECT id, 'bonus', credits, credits, credits, '기존 크레딧 마이그레이션'
FROM users
WHERE credits > 0;
```

### Task 4.2: 크레딧 충전 로직 수정
**파일**: `src/app/api/payment/webhook/route.ts`, `src/app/api/payment/portone/verify/route.ts`

```typescript
// 결제 완료 시 credit_transactions에 기록
const expiresAt = new Date();
expiresAt.setFullYear(expiresAt.getFullYear() + 2); // 2년 후

await supabase.from('credit_transactions').insert({
  user_id: userId,
  type: 'purchase',
  amount: credits,
  balance_after: currentCredits + credits,
  remaining: credits,
  expires_at: expiresAt,
  purchase_id: purchaseId,
  description: `${packageId} 패키지 구매`,
});

// users.credits도 업데이트 (하위 호환)
await supabase
  .from('users')
  .update({ credits: currentCredits + credits })
  .eq('id', userId);
```

### Task 4.3: 크레딧 차감 로직 수정 (FIFO)
**파일**: `src/lib/credits/deduct.ts` (신규)

```typescript
/**
 * FIFO 방식 크레딧 차감
 * 만료일 가까운 순서로 차감
 */
export async function deductCredits(
  userId: string,
  amount: number,
  serviceType: string,
  supabase: SupabaseClient
): Promise<{ success: boolean; error?: string }> {
  // 1. 사용 가능한 크레딧 조회 (만료 전, remaining > 0, 만료일 오름차순)
  const { data: availableCredits } = await supabase
    .from('credit_transactions')
    .select('id, remaining, expires_at')
    .eq('user_id', userId)
    .gt('remaining', 0)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order('expires_at', { ascending: true, nullsFirst: false });

  // 2. 총 사용 가능 크레딧 확인
  const totalAvailable = availableCredits?.reduce((sum, c) => sum + c.remaining, 0) || 0;
  if (totalAvailable < amount) {
    return { success: false, error: 'INSUFFICIENT_CREDITS' };
  }

  // 3. FIFO 차감
  let remainingToDeduct = amount;
  for (const credit of availableCredits!) {
    if (remainingToDeduct <= 0) break;

    const deductFromThis = Math.min(credit.remaining, remainingToDeduct);
    await supabase
      .from('credit_transactions')
      .update({ remaining: credit.remaining - deductFromThis })
      .eq('id', credit.id);

    remainingToDeduct -= deductFromThis;
  }

  // 4. 사용 기록 추가
  const newBalance = totalAvailable - amount;
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'usage',
    amount: -amount,
    balance_after: newBalance,
    service_type: serviceType,
  });

  // 5. users.credits 동기화
  await supabase
    .from('users')
    .update({ credits: newBalance })
    .eq('id', userId);

  return { success: true };
}
```

### Task 4.4: 크레딧 조회 API 수정
**파일**: `src/app/api/user/credits/check/route.ts`

```typescript
// GET /api/user/credits/check
// 응답에 만료 예정 크레딧 정보 추가

const { data: expiringCredits } = await supabase
  .from('credit_transactions')
  .select('remaining, expires_at')
  .eq('user_id', user.id)
  .gt('remaining', 0)
  .not('expires_at', 'is', null)
  .lte('expires_at', thirtyDaysLater)
  .order('expires_at', { ascending: true });

return NextResponse.json({
  current: totalCredits,
  required,
  sufficient: totalCredits >= required,
  expiringSoon: expiringCredits?.reduce((sum, c) => sum + c.remaining, 0) || 0,
  nearestExpiry: expiringCredits?.[0]?.expires_at || null,
});
```

### Task 4.5: 만료 크레딧 정리 (Cron Job)
**파일**: `src/app/api/cron/expire-credits/route.ts`

```typescript
// Vercel Cron: 매일 자정 실행
// vercel.json: { "crons": [{ "path": "/api/cron/expire-credits", "schedule": "0 0 * * *" }] }

export async function GET() {
  // 만료된 크레딧 처리
  const { data: expiredCredits } = await supabase
    .from('credit_transactions')
    .select('id, user_id, remaining')
    .gt('remaining', 0)
    .lt('expires_at', new Date().toISOString());

  for (const credit of expiredCredits || []) {
    // 만료 기록 추가
    await supabase.from('credit_transactions').insert({
      user_id: credit.user_id,
      type: 'expiry',
      amount: -credit.remaining,
      balance_after: 0, // 별도 계산 필요
      description: '크레딧 만료',
    });

    // remaining을 0으로 설정
    await supabase
      .from('credit_transactions')
      .update({ remaining: 0 })
      .eq('id', credit.id);
  }

  // users.credits 동기화
  // ...
}
```

### Task 4.6: 문서 업데이트
**파일**: `docs/payment.md` (신규)

---

## Task 5: 구독 시스템 (Mock 구현) ✅

### 요구사항
- 월 3,900원 구독
- 구독 혜택: 오늘의 운세 + 월 50C 크레딧
- **v4.0에서는 Mock 구현** (결제 버튼 클릭 시 DB만 수정)
- **추후 개발**: PortOne 정기결제, Google Play 구독

### Task 5.1: DB 스키마 설계
**파일**: `supabase/migrations/YYYYMMDD_create_subscriptions.sql`

```sql
-- subscriptions 테이블 생성
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 구독 상태
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),

  -- 구독 기간
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,

  -- 결제 정보 (추후 사용)
  payment_provider VARCHAR(20), -- 'portone', 'google_play'
  provider_subscription_id TEXT,

  -- 가격
  price INTEGER NOT NULL DEFAULT 3900, -- KRW

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ
);

-- users 테이블에 구독 상태 컬럼 추가
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(20) DEFAULT NULL;
ALTER TABLE users ADD COLUMN subscription_id UUID REFERENCES subscriptions(id);

-- 인덱스
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);
```

### Task 5.2: 구독 시작 API (Mock)
**파일**: `src/app/api/subscription/start/route.ts`

```typescript
// POST /api/subscription/start
// Mock 구현: 결제 없이 바로 구독 활성화

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();

  // 이미 구독 중인지 확인
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (existingSub) {
    return NextResponse.json({ error: '이미 구독 중입니다.' }, { status: 400 });
  }

  // 구독 생성
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: subscription } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      status: 'active',
      current_period_end: periodEnd.toISOString(),
      price: 3900,
    })
    .select()
    .single();

  // 월 50C 크레딧 지급
  const creditExpiresAt = new Date(periodEnd);
  await supabase.from('credit_transactions').insert({
    user_id: user.id,
    type: 'subscription',
    amount: 50,
    balance_after: currentCredits + 50,
    remaining: 50,
    expires_at: creditExpiresAt.toISOString(),
    subscription_id: subscription.id,
    description: '구독 월간 크레딧',
  });

  // users 테이블 업데이트
  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_id: subscription.id,
      credits: currentCredits + 50,
    })
    .eq('id', user.id);

  return NextResponse.json({
    success: true,
    subscription,
    message: '구독이 시작되었습니다. (테스트 모드)',
  });
}
```

### Task 5.3: 구독 상태 확인 API
**파일**: `src/app/api/subscription/status/route.ts`

```typescript
// GET /api/subscription/status
// 응답: { active: boolean, subscription?: Subscription }
```

### Task 5.4: 구독 취소 API (Mock)
**파일**: `src/app/api/subscription/cancel/route.ts`

```typescript
// POST /api/subscription/cancel
// Mock: 즉시 취소 (실제로는 기간 종료 시까지 유지)
```

### Task 5.5: 구독 갱신 Cron Job
**파일**: `src/app/api/cron/renew-subscriptions/route.ts`

```typescript
// 매일 실행: 만료된 구독 처리
// Mock 모드에서는 자동 갱신 없이 만료 처리
```

### Task 5.6: 구독 UI
**파일**:
- `src/components/subscription/SubscriptionCard.tsx`
- `src/components/subscription/SubscribeButton.tsx`

### 추후 개발 (v4.1+)
- [ ] PortOne 정기결제 연동
- [ ] Google Play Billing 구독 연동
- [ ] 결제 실패 시 재시도 로직
- [ ] 구독 갱신 알림 이메일

---

# Group 3: 오늘의 운세 시스템 (순차) ✅ 완료

## Task 6: 오늘의 운세 시스템 ✅

### 요구사항
- 홈 화면 최상단에 배치
- 구독자 전용 서비스
- 대표 프로필 기준 분석
- DB 저장으로 최근 1년간 히스토리 조회 가능
- 레퍼런스: `docs/reference/today1.jpeg`

### Task 6.1: DB 스키마 설계
**파일**: `supabase/migrations/YYYYMMDD_create_daily_fortunes.sql`

```sql
-- daily_fortunes 테이블 생성
CREATE TABLE daily_fortunes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 날짜
  fortune_date DATE NOT NULL,

  -- 기본 정보 (레퍼런스 기반)
  day_element VARCHAR(10), -- 오행 (火, 水, 木, 金, 土)
  day_animal VARCHAR(20), -- 일주 동물 (붉은 원숭이 등)
  day_ten_god VARCHAR(10), -- 타고난 성향 (편관 등)

  -- 사주 정보 (당일 기준)
  day_pillars JSONB, -- 당일 사주 (시주/일주/월주/년주)

  -- AI 분석 결과
  overall_score INTEGER, -- 종합 점수 (0-100)
  overall_summary TEXT, -- 종합 운세 요약 (200-300자)

  -- 분야별 운세
  wealth_fortune JSONB, -- 재물운: { score, summary, advice }
  love_fortune JSONB, -- 연애운
  career_fortune JSONB, -- 직장운
  health_fortune JSONB, -- 건강운
  relationship_fortune JSONB, -- 대인관계운

  -- 길흉 정보
  lucky_time VARCHAR(20), -- 길한 시간대
  lucky_direction VARCHAR(10), -- 길한 방위
  lucky_color VARCHAR(20), -- 길한 색상
  lucky_number INTEGER, -- 행운의 숫자

  -- 주의사항
  caution TEXT, -- 오늘 주의할 점

  -- 메타
  language VARCHAR(10) DEFAULT 'ko',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 (사용자별 날짜 조회 최적화)
CREATE UNIQUE INDEX idx_daily_fortunes_user_date
ON daily_fortunes(user_id, profile_id, fortune_date);

-- 히스토리 조회용 인덱스
CREATE INDEX idx_daily_fortunes_user_history
ON daily_fortunes(user_id, fortune_date DESC);
```

### Task 6.2: Python 분석 파이프라인
**파일**: `python/services/daily_analysis.py`

```python
class DailyAnalysisService:
    """오늘의 운세 분석 파이프라인"""

    async def analyze(
        self,
        user_id: str,
        profile_id: str,
        pillars: dict,
        daewun: list,
        language: str = "ko"
    ) -> dict:
        """
        단계:
        1. 당일 천간/지지 계산
        2. 사주와 당일 간지 상호작용 분석
        3. Gemini 분야별 운세 생성
        4. DB 저장
        """
```

**파일**: `python/prompts/daily_prompts.py`

```python
def build_daily_fortune_prompt(
    pillars: dict,
    daewun: list,
    today_stem: str,
    today_branch: str,
    language: str
) -> str:
    """오늘의 운세 Gemini 프롬프트"""
```

### Task 6.3: Next.js API 엔드포인트
**파일**: `src/app/api/daily-fortune/route.ts`

```typescript
// GET /api/daily-fortune
// 오늘의 운세 조회 (없으면 생성)

export async function GET() {
  const user = await getAuthenticatedUser();

  // 1. 구독 상태 확인
  if (user.subscription_status !== 'active') {
    return NextResponse.json({
      error: '구독이 필요합니다.',
      errorCode: 'SUBSCRIPTION_REQUIRED',
    }, { status: 403 });
  }

  // 2. 대표 프로필 조회
  const { data: primaryProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .single();

  if (!primaryProfile) {
    return NextResponse.json({
      error: '대표 프로필을 설정해주세요.',
      errorCode: 'NO_PRIMARY_PROFILE',
    }, { status: 400 });
  }

  // 3. 오늘 날짜 운세 확인
  const today = new Date().toISOString().split('T')[0];
  const { data: existingFortune } = await supabase
    .from('daily_fortunes')
    .select('*')
    .eq('user_id', user.id)
    .eq('profile_id', primaryProfile.id)
    .eq('fortune_date', today)
    .single();

  if (existingFortune) {
    return NextResponse.json({ data: existingFortune });
  }

  // 4. 새로 생성 (Python API 호출)
  const fortune = await generateDailyFortune(user.id, primaryProfile);

  return NextResponse.json({ data: fortune });
}
```

**파일**: `src/app/api/daily-fortune/history/route.ts`

```typescript
// GET /api/daily-fortune/history?limit=30
// 최근 운세 히스토리 조회 (최대 1년)
```

### Task 6.4: 홈화면 UI 컴포넌트
**파일**: `src/components/daily-fortune/DailyFortuneCard.tsx`

레퍼런스(`docs/reference/today1.jpeg`) 기반 UI:
- 프로필 정보 (이름, 생년월일, 성별)
- 오행 아이콘 + 일주 동물 + 타고난 성향
- 사주 표 (시주/일주/월주/년주)
- "운세 풀이 보기" 버튼

**파일**: `src/components/daily-fortune/DailyFortuneDetail.tsx`

상세 운세 페이지:
- 종합 점수 (원형 프로그레스)
- 분야별 운세 카드 (재물/연애/직장/건강/대인관계)
- 길한 정보 (시간/방위/색상/숫자)
- 오늘의 조언

**파일**: `src/components/daily-fortune/FortuneHistory.tsx`

히스토리 페이지:
- 캘린더 뷰
- 리스트 뷰 (날짜별)
- 점수 그래프

### Task 6.5: 홈페이지 통합
**파일**: `src/app/[locale]/home/page.tsx`

```typescript
// 홈 화면 최상단에 DailyFortuneCard 배치
// 비구독자에게는 구독 유도 카드 표시
```

### Task 6.6: 다국어 지원
**파일**: `messages/ko.json`, `messages/en.json` 등

```json
{
  "dailyFortune": {
    "title": "오늘의 운세",
    "overallScore": "종합 점수",
    "wealth": "재물운",
    "love": "연애운",
    "career": "직장운",
    "health": "건강운",
    "relationship": "대인관계",
    "luckyTime": "길한 시간",
    "luckyDirection": "길한 방위",
    "luckyColor": "행운의 색상",
    "luckyNumber": "행운의 숫자",
    "caution": "오늘 주의할 점",
    "subscriptionRequired": "구독하고 매일 운세를 확인하세요",
    "viewDetail": "운세 풀이 보기",
    "history": "지난 운세 보기"
  }
}
```

### Task 6.7: 문서 생성
**파일**: `docs/daily_analysis.md`

---

## 문서 업데이트 체크리스트

| 문서 | 업데이트 내용 |
|------|-------------|
| `docs/fortune_engine.md` | 오늘의 운세 파이프라인 추가 |
| `docs/payment.md` (신규) | 크레딧 유효기간, 구독 시스템 |
| `docs/api.md` | 신규 API 엔드포인트 추가 |
| `docs/daily_analysis.md` (신규) | 오늘의 운세 시스템 상세 |
| `CLAUDE.md` | 서비스 크레딧, 구독 정보 업데이트 |

---

## 검증 방법

### Group 1 검증 ✅
- [x] 프로필 생성 시 is_primary 자동 설정 확인
- [x] 대표 프로필 삭제 시 자동 전환 확인
- [x] 첫 프로필 첫 리포트 무료 확인 (user_id당 최초 1회)
- [x] 프로필 삭제 시 관련 데이터 삭제 확인 (CASCADE)

### Group 2 검증 ✅
- [x] 크레딧 충전 시 만료일 설정 확인
- [x] 크레딧 차감 시 FIFO 순서 확인
- [x] 구독 시작/취소 Mock 동작 확인
- [x] 구독 크레딧 1개월 만료 확인

### Group 3 검증 ✅
- [x] 구독자/무료체험자만 오늘의 운세 접근 가능
- [x] 대표 프로필 기준 운세 생성 확인
- [x] 히스토리 1년간 조회 확인
- [x] 비구독자 구독 유도 UI 확인
- [x] 3일 무료체험 시스템 확인

### Group 4 검증
- [ ] Task 7: 12운성 점수 반영 확인
- [ ] Task 8: 복음/반음 감지 및 메시지 확인
- [ ] Task 9: 조후용신 계절 조절 확인
- [ ] Task 10: 삼합/방합 국 형성 확인
- [ ] Task 11: 용신 기반 행운 정보 확인
- [ ] Task 12: 형/파/해/원진 감지 및 경고 메시지 확인
- [ ] Task 13: 12신살 판단 및 메시지 확인
- [ ] Task 14: 물상론 키워드 영역별 적용 확인
- [ ] Task 15: 조후 튜닝 워드 계절별 적용 확인

---

## 타임라인 (예상)

| Group | 작업 | 예상 작업량 | 상태 |
|-------|------|------------|------|
| Group 1 | Task 1, 2, 3 (병렬) | 각 1-2일 | ✅ 완료 |
| Group 2 | Task 4, 5 (병렬) | 각 2-3일 | ✅ 완료 |
| Group 3 | Task 6 (순차) | 3-4일 | ✅ 완료 |
| Group 4 | Task 7-15 (순차) | 각 1-2일 | 🔄 진행 중 |
| 문서화 | 전체 문서 업데이트 | 1일 | - |

---

# Group 4: 오늘의 운세 고도화 (고전 명리학 기반)

> 레퍼런스: `docs/txt/사주분석마스터.txt`, `docs/txt/514192401-窮通寶鑑.txt`, `docs/txt/936561586-쳇gpt에서-사용할수-있는-코드로-만들어줘.txt` (SAJU v8.0)

## 개요

사주분석마스터 v7.0/v8.0과 궁통보감의 명리학 이론을 오늘의 운세에 적용하여 분석 정확도 향상

| Task | 내용 | 난이도 | 영향도 |
|------|------|--------|--------|
| Task 7 | 12운성 점수 반영 | ⭐⭐ | 점수 정확도 |
| Task 8 | 복음/반음 감지 | ⭐⭐ | 특별 이벤트 |
| Task 9 | 조후용신 적용 | ⭐⭐⭐ | 계절 맞춤 |
| Task 10 | 삼합/방합 국 형성 | ⭐⭐⭐ | 사건 규모 |
| Task 11 | 용신 기반 행운 정보 | ⭐⭐⭐⭐ | 개인화 |
| Task 12 | 형/파/해/원진 분석 | ⭐⭐⭐ | 갈등 감지 |
| Task 13 | 12신살 분석 | ⭐⭐⭐ | 특수 이벤트 |
| Task 14 | 물상론 DB | ⭐⭐⭐⭐ | 구체적 사건 |
| Task 15 | 조후 튜닝 워드 | ⭐⭐ | 계절 개인화 |

---

## Task 7: 12운성 점수 반영

### 요구사항
- [ ] 일간(日干)과 당일 지지(地支)의 12운성 계산
- [ ] 12운성 가중치를 종합점수에 반영
- [ ] 프롬프트에 12운성 정보 전달

### 레퍼런스 (사주분석마스터.txt)
```python
JIBYEON_12WUNSEONG = {
    '甲': {'子': '목욕', '丑': '관대', '寅': '건록', '卯': '제왕', ...},
    '乙': {'子': '병', '丑': '쇠', '寅': '제왕', ...},
    ...
}

WUNSEONG_WEIGHTS = {
    '건록': +0.6, '제왕': +0.6,  # 최강
    '장생': +0.4, '관대': +0.4, '목욕': +0.2,
    '쇠': -0.2, '병': -0.3,
    '사': -0.4, '묘': -0.4, '절': -0.4,  # 최약
    '태': +0.1, '양': +0.2
}
```

### 구현 파일
- `python/services/daily_fortune_service.py` - 12운성 계산 추가
- `python/prompts/daily_prompts.py` - 프롬프트에 12운성 정보 추가

---

## Task 8: 복음/반음 감지

### 요구사항
- [ ] 복음(伏吟) 감지: 당일 간지 = 원국 간지 → 사건 반복/고착
- [ ] 반음(反吟) 감지: 당일 간지 충(沖) 원국 간지 → 급변/충돌
- [ ] 감지 시 특별 메시지 및 점수 조정

### 레퍼런스 (사주분석마스터.txt)
```python
TIMING_WEIGHTS = {
    '복음(伏吟)': 0.4,   # 사건 반복 강도 ×1.4
    '반음(反吟)': 0.7,   # 급변 강도 ×1.7
}

JICHE_CHUNG = {
    '子': '午', '丑': '未', '寅': '申', '卯': '酉',
    '辰': '戌', '巳': '亥', '午': '子', '未': '丑',
    '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳'
}
```

### 예시
- 원국 일주 甲子 + 오늘 甲子 → 복음 감지 → "오늘은 과거 패턴이 반복될 수 있습니다"
- 원국 일주 甲子 + 오늘 庚午 → 반음 감지 → "급격한 변화가 예상됩니다"

### 구현 파일
- `python/services/daily_fortune_service.py` - 복음/반음 감지 로직
- `python/prompts/daily_prompts.py` - 감지 결과 프롬프트 반영

---

## Task 9: 조후용신 적용 (궁통보감)

### 요구사항
- [ ] 월령(月令)에 따른 조후 필요 오행 판단
- [ ] 당일 천간이 조후 필요 오행이면 점수 상승
- [ ] 계절별 맞춤 조언 생성

### 레퍼런스 (사주분석마스터.txt + 窮通寶鑑)
```python
JOHU_REQUIRED = {
    '寅': {'특징': '초봄, 寒氣 잔존', '필요': ['丙火', '癸水']},
    '卯': {'특징': '만춘, 濕氣 증가', '필요': ['庚金', '丁火']},
    '辰': {'특징': '늦봄, 濕하고 土 강함', '필요': ['甲木', '壬水']},
    '巳': {'특징': '초여름, 暑氣 시작', '필요': ['壬水', '庚金']},
    '午': {'특징': '한여름, 炎熱', '필요': ['壬水', '庚金']},
    '未': {'특징': '늦여름, 燥하고 土 강함', '필요': ['壬水', '甲木']},
    '申': {'특징': '초가을, 涼氣 시작', '필요': ['丁火', '甲木']},
    '酉': {'특징': '만추, 肅殺의 기운', '필요': ['丙火', '壬水']},
    '戌': {'특징': '늦가을, 燥하고 土 강함', '필요': ['甲木', '壬水']},
    '亥': {'특징': '초겨울, 寒氣 시작', '필요': ['丙火', '戊土']},
    '子': {'특징': '한겨울, 酷寒', '필요': ['丙火', '戊土']},
    '丑': {'특징': '늦겨울, 凍土', '필요': ['丙火', '甲木']},
}
```

### 예시
- 1월(丑월) + 오늘 천간 丙火 → "겨울철에 필요한 따뜻한 기운이 오늘 들어옵니다" (+10점)
- 7월(未월) + 오늘 천간 壬水 → "무더운 여름에 시원한 기운이 찾아옵니다" (+10점)

### 구현 파일
- `python/prompts/daily_prompts.py` - 조후용신 테이블 및 프롬프트 추가
- `python/services/daily_fortune_service.py` - 조후 점수 계산

---

## Task 10: 삼합/방합 국(局) 형성

### 요구사항
- [ ] 당일 지지가 원국 지지와 삼합/방합 형성 여부 판단
- [ ] 국(局) 형성 시 해당 오행 영역 점수 대폭 상승
- [ ] 사건 규모 확대 메시지 생성

### 레퍼런스 (사주분석마스터.txt)
```python
JICHE_COMBINATIONS = {
    'SANHAP': {
        ('申', '子', '辰'): '水',  # 신자진 수국
        ('亥', '卯', '未'): '木',  # 해묘미 목국
        ('寅', '午', '戌'): '火',  # 인오술 화국
        ('巳', '酉', '丑'): '金',  # 사유축 금국
    },
    'BANGHAP': {
        ('寅', '卯', '辰'): '木',  # 인묘진 동방목국
        ('巳', '午', '未'): '火',  # 사오미 남방화국
        ('申', '酉', '戌'): '金',  # 신유술 서방금국
        ('亥', '子', '丑'): '水',  # 해자축 북방수국
    }
}
```

### 예시
- 원국에 申, 辰 있고 오늘 지지 子 → 신자진 수국 형성 → 재물운 대폭 상승
- 원국에 寅, 午 있고 오늘 지지 戌 → 인오술 화국 형성 → 명예운 대폭 상승

### 구현 파일
- `python/services/daily_fortune_service.py` - 삼합/방합 감지
- `python/prompts/daily_prompts.py` - 국 형성 메시지

---

## Task 11: 용신 기반 행운 정보

### 요구사항
- [ ] 개인 사주의 용신(用神) 확인
- [ ] 행운 색상/방향/숫자를 용신 기반으로 개인화
- [ ] 당일 천간이 용신이면 추가 메시지

### 현재 문제
```python
# 현재: 당일 오행 = 모든 사람에게 동일한 행운 정보
day_element = '火' → lucky_color = '빨간색' (모든 사람 동일)
```

### 개선안
```python
# 개선: 개인 용신 기반
용신 = '水' (리포트에서 추출)
→ lucky_color = '검정색/파란색'
→ lucky_direction = '북쪽'
→ lucky_number = 1, 6 (水의 숫자)

# 당일 천간이 용신이면
오늘 천간 = '壬' (용신 水와 동일)
→ "오늘은 용신의 기운이 들어오는 특별한 날입니다" (+15점)
```

### 구현 파일
- `python/services/daily_fortune_service.py` - 용신 정보 활용
- `python/prompts/daily_prompts.py` - 개인화된 행운 정보

### 의존성
- profile_reports 테이블에서 용신 정보 조회 필요
- 용신 정보가 없으면 기존 방식(당일 오행) 사용

---

## Task 12: 형(刑)/파(破)/해(害)/원진(元辰) 분석

> 레퍼런스: `docs/txt/936561586-쳇gpt에서-사용할수-있는-코드로-만들어줘.txt` (SAJU v8.0)

### 요구사항
- [ ] 당일 지지와 원국 지지 간 형(刑) 관계 감지
- [ ] 당일 지지와 원국 지지 간 파(破)/해(害) 관계 감지
- [ ] 원진(元辰) 관계 감지 - 심리적 스트레스 지표
- [ ] 관계별 점수 조정 및 경고 메시지

### 레퍼런스 (SAJU v8.0)
```python
JICHE_HYEONG = {  # 형(刑) - 형벌, 손상
    '寅巳申': '무은지형(無恩之刑)',  # 은혜 없는 형벌
    '丑戌未': '지세지형(恃勢之刑)',  # 권세에 기댄 형벌
    '子卯': '무례지형(無禮之刑)',    # 예의 없는 형벌
    '辰辰': '자형(自刑)',  # 스스로를 해침
    '午午': '자형(自刑)',
    '酉酉': '자형(自刑)',
    '亥亥': '자형(自刑)',
}

JICHE_PA = {  # 파(破) - 파괴, 손해
    '子酉': True, '丑辰': True, '寅亥': True,
    '卯午': True, '巳申': True, '未戌': True,
}

JICHE_HAE = {  # 해(害) - 해침, 방해
    '子未': True, '丑午': True, '寅巳': True,
    '卯辰': True, '申亥': True, '酉戌': True,
}

JICHE_WONJIN = {  # 원진(元辰) - 원망, 심리적 갈등
    '子': '未', '丑': '午', '寅': '巳', '卯': '辰',
    '辰': '卯', '巳': '寅', '午': '丑', '未': '子',
    '申': '亥', '酉': '戌', '戌': '酉', '亥': '申',
}
```

### 점수 영향
| 관계 | 점수 조정 | 메시지 |
|------|----------|--------|
| 형(刑) | -15~-20점 | "충돌과 갈등이 예상되는 날입니다" |
| 파(破) | -10~-15점 | "계획이 틀어질 수 있으니 유연하게 대처하세요" |
| 해(害) | -10~-15점 | "예상치 못한 방해가 있을 수 있습니다" |
| 원진(元辰) | -5~-10점 | "심리적 불편함이 느껴질 수 있는 날입니다" |

### 구현 파일
- `python/services/daily_fortune_service.py` - 상호작용 감지
- `python/prompts/daily_prompts.py` - 경고 메시지 생성

---

## Task 13: 12신살 분석

> 레퍼런스: `docs/txt/936561586-쳇gpt에서-사용할수-있는-코드로-만들어줘.txt` (SAJU v8.0)

### 요구사항
- [ ] 당일 지지와 연지(年支) 기준 12신살 판단
- [ ] 길신살(역마, 장성, 화개) 적용 시 긍정 메시지
- [ ] 흉신살(겁살, 재살, 천살) 적용 시 주의 메시지

### 레퍼런스 (SAJU v8.0)
```python
SHINSSAL_TABLE = {
    # 연지(年支) 기준 → 당일 지지에 해당 신살 적용
    '역마살(驛馬)': {  # 이동, 변동
        '申子辰': '寅', '寅午戌': '申',
        '巳酉丑': '亥', '亥卯未': '巳',
    },
    '장성살(將星)': {  # 리더십, 권위
        '申子辰': '子', '寅午戌': '午',
        '巳酉丑': '酉', '亥卯未': '卯',
    },
    '화개살(華蓋)': {  # 학문, 예술, 영성
        '申子辰': '辰', '寅午戌': '戌',
        '巳酉丑': '丑', '亥卯未': '未',
    },
    '겁살(劫殺)': {  # 갑작스러운 변화, 주의 필요
        '申子辰': '巳', '寅午戌': '亥',
        '巳酉丑': '寅', '亥卯未': '申',
    },
    '재살(災殺)': {  # 재난 위험
        '申子辰': '午', '寅午戌': '子',
        '巳酉丑': '卯', '亥卯未': '酉',
    },
    '천살(天殺)': {  # 하늘의 재앙
        '申子辰': '未', '寅午戌': '丑',
        '巳酉丑': '辰', '亥卯未': '戌',
    },
}
```

### 점수 영향
| 신살 | 유형 | 점수 조정 | 메시지 |
|------|------|----------|--------|
| 역마살 | 길 | +10점 | "이동과 변화에 유리한 날입니다" |
| 장성살 | 길 | +12점 | "리더십을 발휘하기 좋은 날입니다" |
| 화개살 | 길 | +8점 | "학문과 예술 활동에 좋은 날입니다" |
| 겁살 | 흉 | -12점 | "갑작스러운 변화에 주의하세요" |
| 재살 | 흉 | -15점 | "안전에 각별히 주의하세요" |
| 천살 | 흉 | -10점 | "무리한 일정은 피하세요" |

### 구현 파일
- `python/services/daily_fortune_service.py` - 신살 계산
- `python/prompts/daily_prompts.py` - 신살 메시지

---

## Task 14: 물상론 키워드 데이터베이스

> 레퍼런스: `docs/txt/936561586-쳇gpt에서-사용할수-있는-코드로-만들어줘.txt` (SAJU v8.0)

### 요구사항
- [ ] 십신(十神)별 구체적 사건 키워드 DB 구축
- [ ] 긍정/부정 경향별 키워드 분류
- [ ] 영역별(직장/재물/연애/건강/대인관계) 키워드 매핑

### 레퍼런스 (SAJU v8.0)
```python
MULSANGRON_DB = {
    '비견': {
        '긍정': ['동료와 협력', '경쟁심 자극', '자기 발전'],
        '부정': ['재물 경쟁', '분쟁', '형제 문제'],
        '영역': {
            'career': '동료와 함께하는 프로젝트',
            'wealth': '공동 투자, 경쟁적 지출',
            'relationship': '친구 관계 활성화',
        }
    },
    '겁재': {
        '긍정': ['도전정신', '추진력', '결단력'],
        '부정': ['재물 손실', '배신', '충동적 행동'],
        '영역': {
            'career': '경쟁 상황, 도전적 과제',
            'wealth': '투기성 지출, 손재수',
            'relationship': '갈등, 주도권 다툼',
        }
    },
    '식신': {
        '긍정': ['창의력 발휘', '즐거운 활동', '맛있는 음식'],
        '부정': ['나태함', '과식', '게으름'],
        '영역': {
            'career': '창작 활동, 발표',
            'health': '소화기 관련, 식사 주의',
            'relationship': '사교 활동, 모임',
        }
    },
    '상관': {
        '긍정': ['표현력', '예술적 감각', '변화 추구'],
        '부정': ['반항심', '구설', '권위와 충돌'],
        '영역': {
            'career': '아이디어 제안, 상사와 마찰 주의',
            'relationship': '솔직한 표현, 논쟁 가능성',
        }
    },
    '정재': {
        '긍정': ['정당한 수입', '안정적 재물', '착실한 저축'],
        '부정': ['소심함', '인색함'],
        '영역': {
            'wealth': '월급, 정기 수입, 저축',
            'career': '실무적 업무, 정확성 요구',
        }
    },
    '편재': {
        '긍정': ['횡재', '투자 수익', '사업 확장'],
        '부정': ['투기 손실', '과소비', '유혹'],
        '영역': {
            'wealth': '투자, 부업 수입, 변동성 큰 재물',
            'love': '새로운 만남, 이성 인연',
        }
    },
    '정관': {
        '긍정': ['승진', '명예', '질서', '안정'],
        '부정': ['억압감', '틀에 갇힘', '스트레스'],
        '영역': {
            'career': '승진, 인정, 책임 증가',
            'relationship': '어른과의 관계, 공식적 자리',
        }
    },
    '편관': {
        '긍정': ['도전', '개혁', '용기', '결단'],
        '부정': ['압박', '갈등', '사고', '폭력성'],
        '영역': {
            'career': '도전적 과제, 경쟁 상황',
            'health': '과로, 사고 주의',
        }
    },
    '정인': {
        '긍정': ['학습', '지혜', '어머니의 도움', '안정감'],
        '부정': ['의존', '우유부단', '게으름'],
        '영역': {
            'career': '학습, 자격증, 조언자 등장',
            'relationship': '어른의 도움, 멘토',
        }
    },
    '편인': {
        '긍정': ['영감', '직관', '특별한 지식', '변화'],
        '부정': ['고독', '외로움', '비밀', '꼬임'],
        '영역': {
            'career': '특수 분야, 연구, 비밀 프로젝트',
            'health': '정신 건강, 수면',
        }
    },
}
```

### 구현 파일
- `python/prompts/mulsangron.py` - 물상론 DB (기존 확장)
- `python/prompts/daily_prompts.py` - 오늘의 운세에 물상론 적용

---

## Task 15: 조후 튜닝 워드 적용

> 레퍼런스: `docs/txt/936561586-쳇gpt에서-사용할수-있는-코드로-만들어줘.txt` (SAJU v8.0)

### 요구사항
- [ ] 계절별 기후 특성 워드 적용 (寒/暖/燥/濕)
- [ ] 사용자 사주의 조후 필요에 따른 개인화 조언
- [ ] 당일 천간이 조후 해결 시 특별 메시지

### 레퍼런스 (SAJU v8.0)
```python
JOHU_TUNING_WORDS = {
    '寒': {  # 추위 - 겨울/초봄
        '특징': '활동력 저하, 움츠림',
        '해결': '丙火(태양)', '丁火(불꽃)',
        '메시지': {
            '부족': '활력이 떨어지기 쉬운 날입니다. 따뜻한 환경을 유지하세요.',
            '해결': '오늘은 활력을 되찾기 좋은 날입니다!',
        }
    },
    '暖': {  # 더위 - 여름
        '특징': '과잉 활동, 소진',
        '해결': '壬水(큰물)', '癸水(비)',
        '메시지': {
            '부족': '무리하면 지치기 쉽습니다. 휴식을 취하세요.',
            '해결': '시원한 기운이 들어와 균형을 맞춰줍니다.',
        }
    },
    '燥': {  # 건조 - 가을/늦여름
        '특징': '날카로움, 긴장',
        '해결': '壬水(수분)', '癸水(촉촉함)',
        '메시지': {
            '부족': '예민해지기 쉬우니 여유를 가지세요.',
            '해결': '부드러운 기운이 긴장을 풀어줍니다.',
        }
    },
    '濕': {  # 습함 - 봄/장마
        '특징': '무거움, 정체',
        '해결': '甲木(뚫는 힘)', '丙火(건조함)',
        '메시지': {
            '부족': '무겁고 답답한 느낌이 들 수 있습니다.',
            '해결': '막힌 기운을 뚫어주는 날입니다!',
        }
    },
}

# 월지별 기후 특성
MONTH_CLIMATE = {
    '寅': '寒', '卯': '濕', '辰': '濕',  # 봄
    '巳': '暖', '午': '暖', '未': '燥',  # 여름
    '申': '燥', '酉': '燥', '戌': '燥',  # 가을
    '亥': '寒', '子': '寒', '丑': '寒',  # 겨울
}
```

### 예시
- 1월(子월, 寒) + 오늘 천간 丙火 → "한겨울에 따뜻한 태양이 비추는 날입니다! 활력이 넘칩니다." (+12점)
- 7월(午월, 暖) + 오늘 천간 壬水 → "무더운 여름에 시원한 비가 내리는 날입니다. 편안함을 느끼세요." (+12점)

### 구현 파일
- `python/prompts/daily_prompts.py` - 조후 튜닝 워드 테이블
- `python/services/daily_fortune_service.py` - 기후 점수 계산

---

## Group 4 구현 순서

```
┌─────────────────── 기본 분석 ───────────────────┐
│  Task 7 (12운성) → Task 8 (복음/반음)           │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────── 상호작용 ───────────────────┐
│  Task 12 (형/파/해/원진) → Task 13 (12신살)    │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────── 계절/환경 ───────────────────┐
│  Task 9 (조후용신) → Task 15 (조후 튜닝)        │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────── 고급 분석 ───────────────────┐
│  Task 10 (삼합/방합) → Task 14 (물상론)         │
│              ↓                                  │
│       Task 11 (용신 행운)                       │
└─────────────────────────────────────────────────┘
```

| 순서 | Task | 선행 조건 | 난이도 |
|------|------|----------|--------|
| 1 | Task 7: 12운성 | 없음 | ⭐⭐ |
| 2 | Task 8: 복음/반음 | 없음 | ⭐⭐ |
| 3 | Task 12: 형/파/해/원진 | Task 8 | ⭐⭐⭐ |
| 4 | Task 13: 12신살 | Task 12 | ⭐⭐⭐ |
| 5 | Task 9: 조후용신 | Task 7 | ⭐⭐⭐ |
| 6 | Task 15: 조후 튜닝 | Task 9 | ⭐⭐ |
| 7 | Task 10: 삼합/방합 | Task 8 | ⭐⭐⭐ |
| 8 | Task 14: 물상론 | Task 10 | ⭐⭐⭐⭐ |
| 9 | Task 11: 용신 행운 | Task 9, 10, 14 | ⭐⭐⭐⭐ |

---

**버전**: 4.2
**최종 수정**: 2026-01-12 (Group 1~3 완료, Group 4 확장 - Task 12-15 추가)
