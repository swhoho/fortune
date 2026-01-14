# Android 앱 출시 가이드

Master's Insight AI의 Capacitor Android 앱 구현 및 출시 가이드입니다.

## 아키텍처

```
┌─────────────────────────────────────────┐
│     Android App (Capacitor WebView)     │
│  Package: app.fortune30.saju            │
├─────────────────────────────────────────┤
│ - WebView: Vercel 웹사이트 로드         │
│ - 네이티브: Google Play Billing         │
│ - 플러그인: @capgo/native-purchases     │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ↓
┌─────────────────────────────────────────┐
│      Vercel (Next.js Frontend)          │
│  URL: https://masters-insight.ai        │
├─────────────────────────────────────────┤
│ - 모든 UI/UX 웹에서 처리                │
│ - API Routes 정상 작동                  │
│ - SSR/ISR 지원                          │
└─────────────────────────────────────────┘
```

**원격 서버 모드 장점:**
- 웹과 앱 동일한 코드베이스
- SSR, API Routes 모두 정상 작동
- 앱 업데이트 없이 기능 추가 가능
- 빌드 및 배포 단순화

## 파일 구조

```
fortune/
├── capacitor.config.ts           # Capacitor 설정 (원격 서버 URL)
├── www/                          # 플레이스홀더 (원격 서버 사용시 무시됨)
│   └── index.html
├── android/                      # Android 네이티브 프로젝트
│   ├── app/
│   │   └── src/main/
│   │       └── AndroidManifest.xml  # BILLING 권한 포함
│   └── gradle/
├── src/
│   ├── lib/
│   │   └── google-billing.ts     # Google Play Billing 클라이언트
│   └── app/api/payment/google/
│       └── verify/route.ts       # 구매 검증 API
└── package.json                  # cap:* 스크립트
```

## 설정 파일

### capacitor.config.ts

```typescript
const config: CapacitorConfig = {
  appId: 'app.fortune30.saju',
  appName: "Master's Insight",
  webDir: 'www',
  server: {
    url: 'https://masters-insight.ai',  // 프로덕션 URL
    cleartext: false,
  },
  android: {
    buildOptions: {
      releaseType: 'AAB',
    },
  },
};
```

### package.json 스크립트

```json
{
  "cap:sync": "npx cap sync android",
  "cap:open": "npx cap open android",
  "cap:build": "cd android && ./gradlew bundleRelease",
  "cap:build:debug": "cd android && ./gradlew assembleDebug"
}
```

## Google Play Billing

### 상품 ID 매핑

**크레딧 패키지 (일회성 구매)**:

| 패키지 | Google 상품 ID | 크레딧 | 가격 (KRW) |
|--------|----------------|--------|------------|
| basic | credits_30 | 30 | ₩3,000 |
| starter | credits_50 | 50 | ₩5,000 |
| popular | credits_100 | 110 (+10 보너스) | ₩10,000 |
| premium | credits_200 | 230 (+30 보너스) | ₩20,000 |

**구독 상품**:

| 플랜 | Google 상품 ID | 가격 | 혜택 |
|------|----------------|------|------|
| 프리미엄 | `subscription_premium_monthly` | ₩3,900/월 | 오늘의 운세 무제한 + 월 50C |

### 결제 플로우

```
1. 사용자가 크레딧 패키지 선택
2. isNativeApp() 확인
   ├─ true: purchaseGoogleCredits() 호출
   └─ false: PortOne 결제 (기존)
3. Google Play 결제 UI 표시
4. 결제 완료 → purchaseToken 반환
5. /api/payment/google/verify 호출
   ├─ Google Play Developer API로 검증
   ├─ purchases 테이블에 기록
   └─ users.credits 업데이트
6. 성공 응답 → UI 업데이트
```

### 클라이언트 코드 (src/lib/google-billing.ts)

```typescript
import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

// 네이티브 앱 여부 확인
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

// 크레딧 결제 실행
export async function purchaseGoogleCredits(packageInfo, userId) {
  const result = await NativePurchases.purchaseProduct({
    productIdentifier: productId,
    productType: PURCHASE_TYPE.INAPP,
    quantity: 1,
  });

  // 서버 검증
  await verifyGooglePurchase({
    purchaseToken: result.purchaseToken,
    productId,
    userId,
  });
}

// 구독 결제 실행
export async function purchaseGoogleSubscription(userId) {
  const result = await NativePurchases.purchaseProduct({
    productIdentifier: 'subscription_premium_monthly',
    productType: PURCHASE_TYPE.SUBS,
    quantity: 1,
  });

  // 서버 검증
  await verifyGoogleSubscription({
    purchaseToken: result.purchaseToken,
    productId: 'subscription_premium_monthly',
    userId,
  });
}
```

### 구독 결제 플로우

```
1. 사용자가 구독 시작 버튼 클릭
2. isNativeApp() 확인
   ├─ true: purchaseGoogleSubscription() 호출
   └─ false: PayApp 정기결제 (기존)
3. Google Play 구독 UI 표시
4. 결제 완료 → purchaseToken 반환
5. /api/payment/google/subscription 호출
   ├─ Google Play Developer API로 검증
   ├─ subscriptions 테이블에 기록
   ├─ users.subscription_status 업데이트
   └─ 월 50C 크레딧 지급
6. 성공 응답 → UI 업데이트
```

### 파일 구조

```
src/
├── lib/
│   └── google-billing.ts              # Google Play Billing 클라이언트
└── app/api/payment/google/
    ├── verify/route.ts                # 크레딧 구매 검증 API
    └── subscription/route.ts          # 구독 검증 API
```

---

## 앞으로 할 일 (TODO)

### 1. Google Play Console 설정 (필수)

#### 1.1 앱 등록
- [x] Google Play Console에 앱 생성
- [x] 패키지명: `app.fortune30.saju`
- [x] 앱 카테고리: 라이프스타일

#### 1.2 인앱 상품 등록
```
Google Play Console > 수익 창출 > 인앱 상품 > 관리형 제품
```

| 상품 ID | 이름 | 가격 | 유형 |
|---------|------|------|------|
| credits_30 | 30 크레딧 | ₩3,000 | 관리형 제품 |
| credits_50 | 50 크레딧 | ₩5,000 | 관리형 제품 |
| credits_100 | 100+10 크레딧 | ₩10,000 | 관리형 제품 |
| credits_200 | 200+30 크레딧 | ₩20,000 | 관리형 제품 |

#### 1.2.1 구독 상품 등록
```
Google Play Console > 수익 창출 > 구독
```

| 상품 ID | 이름 | 가격 | 기간 |
|---------|------|------|------|
| subscription_premium_monthly | 프리미엄 구독 | ₩3,900 | 월간 |

> **구독 설정**: 기본 요금제 추가 필요 (₩3,900/월)

#### 1.3 서비스 계정 설정 (Google Play Developer API)

1. **Google Cloud Console에서 서비스 계정 생성:**
   ```
   Google Cloud Console > IAM > 서비스 계정 > 새 서비스 계정
   - 이름: masters-insight-billing
   - 역할: 없음 (Play Console에서 권한 부여)
   - 키 유형: JSON
   ```

2. **Play Console에서 API 접근 권한 부여:**
   ```
   Google Play Console > 설정 > API 액세스
   - 서비스 계정 연결
   - 권한: 앱 정보 보기, 주문 관리
   ```

3. **환경 변수에 JSON 키 추가:**
   ```bash
   # .env.local
   GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
   ```

### 2. 앱 자산 준비 (필수)

#### 2.1 아이콘 및 스크린샷

| 자산 | 규격 | 파일 |
|------|------|------|
| 앱 아이콘 | 512×512 PNG | android/app/src/main/res/mipmap-xxxhdpi/ |
| 기능 그래픽 | 1024×500 PNG | Play Console 업로드 |
| 스크린샷 | 최소 2장 | Play Console 업로드 |

#### 2.2 앱 아이콘 교체

```bash
# 아이콘 파일 위치
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png        # 72×72
├── mipmap-mdpi/ic_launcher.png        # 48×48
├── mipmap-xhdpi/ic_launcher.png       # 96×96
├── mipmap-xxhdpi/ic_launcher.png      # 144×144
└── mipmap-xxxhdpi/ic_launcher.png     # 192×192
```

### 3. 빌드 및 서명 (필수)

#### 3.1 서명 키스토어 생성

```bash
keytool -genkey -v -keystore masters-insight.keystore \
  -alias masters-insight \
  -keyalg RSA -keysize 2048 -validity 10000

# 정보 입력:
# - 이름: Master's Insight
# - 조직: Your Company
# - 국가 코드: KR
```

#### 3.2 android/app/build.gradle 서명 설정

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../masters-insight.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias "masters-insight"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

#### 3.3 릴리스 빌드

```bash
# 동기화
npm run cap:sync

# 릴리스 빌드 (AAB)
npm run cap:build

# 출력 파일
# android/app/build/outputs/bundle/release/app-release.aab
```

### 4. 테스트 (권장)

#### 4.1 라이선스 테스터 등록

```
Google Play Console > 설정 > 라이선스 테스트
- 테스트 이메일 추가
- 라이선스 응답: LICENSED
```

#### 4.2 내부 테스트 트랙

```
Google Play Console > 테스트 > 내부 테스트
1. 새 릴리스 만들기
2. app-release.aab 업로드
3. 테스터 이메일 추가
4. 출시 검토
```

### 5. 출시 (최종)

#### 5.1 스토어 등록정보

- [ ] 앱 이름 (30자): Master's Insight - AI 사주
- [ ] 간단한 설명 (80자): 30년 명리학 거장이 인정한 AI 사주 분석
- [ ] 상세 설명 (4000자): 앱 기능 설명
- [ ] 개인정보처리방침 URL: https://masters-insight.ai/privacy
- [ ] 카테고리: 라이프스타일

#### 5.2 콘텐츠 등급

```
Google Play Console > 콘텐츠 등급 > 설문지 작성
- 예상 등급: 전체 이용가
```

#### 5.3 프로덕션 출시

```
Google Play Console > 프로덕션 > 새 릴리스
1. AAB 업로드
2. 릴리스 노트 작성
3. 출시 검토 (1-7일 소요)
```

---

## 환경 변수

### Vercel에 추가 필요

```bash
# Google Play Billing (Android 앱)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### 로컬 개발 (.env.local)

```bash
# Capacitor 개발 서버 (선택)
CAPACITOR_SERVER_URL=http://localhost:3000
```

---

## 명령어 요약

```bash
# Capacitor 동기화
npm run cap:sync

# Android Studio에서 열기
npm run cap:open

# 디버그 APK 빌드
npm run cap:build:debug

# 릴리스 AAB 빌드
npm run cap:build

# 안드로이드 에뮬레이터에서 테스트
# 1. npm run cap:open
# 2. Android Studio에서 Run
```

---

## 참고 자료

- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [Google Play Billing 라이브러리](https://developer.android.com/google/play/billing)
- [@capgo/native-purchases](https://github.com/Cap-go/capacitor-purchases)
- [Google Play Console 가이드](https://support.google.com/googleplay/android-developer)

---

**Last Updated:** 2026-01-14
