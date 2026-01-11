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
│                         Group 1 (병렬)                           │
│  Task 1: 대표 프로필    Task 2: 최초 무료    Task 3: 프로필 삭제  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (완료 후)
┌─────────────────────────────────────────────────────────────────┐
│                         Group 2 (병렬)                           │
│      Task 4: 크레딧 유효기간        Task 5: 구독 시스템 (Mock)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (완료 후)
┌─────────────────────────────────────────────────────────────────┐
│                         Group 3 (순차)                           │
│                     Task 6: 오늘의 운세 시스템                    │
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

### Group 3 검증
- [ ] 구독자만 오늘의 운세 접근 가능
- [ ] 대표 프로필 기준 운세 생성 확인
- [ ] 히스토리 1년간 조회 확인
- [ ] 비구독자 구독 유도 UI 확인

---

## 타임라인 (예상)

| Group | 작업 | 예상 작업량 |
|-------|------|------------|
| Group 1 | Task 1, 2, 3 (병렬) | 각 1-2일 |
| Group 2 | Task 4, 5 (병렬) | 각 2-3일 |
| Group 3 | Task 6 (순차) | 3-4일 |
| 문서화 | 전체 문서 업데이트 | 1일 |

---

**버전**: 4.0
**최종 수정**: 2026-01-12 (Group 1 + Group 2 완료)
