# Master's Insight AI - API 명세

**Base URL**: `https://api.mastersinsight.ai` (Production)  
**Local**: `http://localhost:3000/api` (Next.js) / `http://localhost:8000` (Python)

---

## 인증 (Authentication)

Supabase Auth를 사용하여 인증을 처리합니다 (`@supabase/ssr`).

### 인증 방식

- **Provider**:
  - Email/Password
  - Google OAuth
- **Session**: JWT (Supabase Access Token) + Cookie
- **Client**: `src/lib/supabase/client.ts`
- **Server**: `src/lib/supabase/server.ts`
- **Middleware**: `src/middleware.ts` (세션 리프레시 + 라우트 보호)

### 관련 API Route

#### GET /api/auth/callback

OAuth 로그인 (Google 등) 및 이메일 확인 후 리다이렉트되는 콜백 엔드포인트입니다.
PKCE 흐름을 처리하고 세션을 교환합니다.

### 인증 필요 라우트

다음 경로는 미들웨어에서 인증 여부를 확인합니다:
- `/analysis/*` (분석 페이지)
- `/mypage/*` (마이페이지)
- `/payment/*` (결제 페이지)
- `/api/analysis/*` (분석 API)
- `/api/user/*` (사용자 API)
- `/api/payment/*` (결제 API)

---

## 사주 분석 API

### POST /api/analysis/gemini ✅

Gemini AI 사주 분석 (Task 6 구현 완료)

**모델**: `gemini-3-pro-preview` (Gemini 3.0 Pro)
**타임아웃**: 30초 | **재시도**: 2회 | **인증**: 필수

**Request**:
```json
{
  "pillars": {
    "year": { "stem": "庚", "branch": "午", "element": "火", "stemElement": "金", "branchElement": "火" },
    "month": { "stem": "辛", "branch": "巳", "element": "火", "stemElement": "金", "branchElement": "火" },
    "day": { "stem": "甲", "branch": "子", "element": "水", "stemElement": "木", "branchElement": "水" },
    "hour": { "stem": "辛", "branch": "未", "element": "土", "stemElement": "金", "branchElement": "土" }
  },
  "daewun": [{ "startAge": 1, "endAge": 10, "stem": "庚", "branch": "辰" }],
  "focusArea": "overall",
  "question": "2026년 운세가 궁금합니다",
  "language": "ko"
}
```

**language 파라미터** (Task 14, 18 추가):
| 값 | 설명 |
|----|------|
| `ko` | 한국어 (기본값, 자평진전/궁통보감 용어) |
| `en` | 영어 (PRD/The Destiny Code 스타일) |
| `ja` | 일본어 (四柱推命 용어) |
| `zh-CN` | 중국어 간체 (八字命理, 简体字) |
| `zh-TW` | 중국어 번체 (八字命理, 繁體字) |
| `zh` | 레거시 (→ `zh-CN`으로 자동 변환) |
```

**Response** (성공):
```json
{
  "success": true,
  "data": {
    "summary": "한여름의 거목(甲)이 강한 금(金)의 기운에...",
    "personality": { "keywords": ["책임감", "완벽주의"], "description": "..." },
    "wealth": { "score": 65, "analysis": "...", "advice": "..." },
    "love": { "score": 70, "analysis": "...", "advice": "..." },
    "career": { "score": 85, "analysis": "...", "advice": "..." },
    "health": { "score": 60, "analysis": "...", "advice": "..." },
    "yearly_flow": [{ "year": 2026, "theme": "변화", "score": 55, "advice": "..." }],
    "classical_references": [{ "source": "궁통보감", "content": "...", "interpretation": "..." }]
  }
}
```

**에러**: `TIMEOUT` (504), `RATE_LIMIT` (429), `INVALID_INPUT` (400), `INVALID_API_KEY` (500)

---

### POST /api/analysis/create

사주 분석 생성 (크레딧 차감)

**Request**:
```json
{
  "birthDatetime": "1990-05-15T14:30:00",
  "timezone": "GMT+9",
  "isLunar": false,
  "gender": "male",
  "focusArea": "comprehensive",
  "question": "사업 확장 시기가 궁금합니다"
}
```

**Response**:
```json
{
  "id": "analysis_xxx",
  "status": "processing",
  "creditsUsed": 30
}
```

---

### POST /api/analysis/save ✅

분석 결과 DB 저장 (Task 16 구현)

**인증**: 필수 | **크레딧 차감**: 30C

**Request**:
```json
{
  "sajuInput": {
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "isLunar": false,
    "gender": "male",
    "timezone": "GMT+9"
  },
  "pillars": { ... },
  "daewun": [ ... ],
  "jijanggan": { ... },
  "analysis": { ... },
  "pillarImage": "data:image/png;base64,...",
  "focusArea": "overall",
  "question": "..."
}
```

**Response**:
```json
{
  "success": true,
  "analysisId": "cuid_xxx"
}
```

---

### GET /api/analysis/:id ✅

분석 결과 + 질문 히스토리 조회 (Task 16 구현)

**인증**: 필수 (본인 분석만 조회 가능)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "analysis_xxx",
    "birthDatetime": "1990-05-15T14:30:00",
    "timezone": "GMT+9",
    "pillars": { ... },
    "daewun": [ ... ],
    "analysis": { ... },
    "pillarImage": "data:image/png;base64,...",
    "questions": [
      {
        "id": "q_xxx",
        "question": "재물운이 좋아지는 시기는?",
        "answer": "...",
        "credits_used": 10,
        "created_at": "2026-01-02T11:00:00Z"
      }
    ],
    "createdAt": "2026-01-02T10:00:00Z"
  }
}
```

---

### POST /api/analysis/yearly ✅

신년 사주 분석 (Task 20 구현)

특정 연도에 대한 월별 상세 운세 분석을 제공합니다.

**모델**: `gemini-3-pro-preview` | **타임아웃**: 60초 | **인증**: 필수 | **크레딧**: 30C

**Request**:
```json
{
  "targetYear": 2026,
  "sajuInput": {
    "birthDate": "1990-05-15",
    "birthTime": "14:30",
    "timezone": "Asia/Seoul",
    "isLunar": false,
    "gender": "male"
  },
  "existingAnalysisId": "cuid_xxx",
  "language": "ko"
}
```

**Request 파라미터**:
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| targetYear | number | O | 분석 대상 연도 (2000-2100) |
| sajuInput | object | △ | 새로운 사주 입력 (existingAnalysisId가 없을 때 필수) |
| existingAnalysisId | string | △ | 기존 분석 ID (기존 사주 정보 재사용) |
| language | string | X | 언어 (ko, en, ja, zh-CN, zh-TW) 기본값: ko |

**Response** (성공):
```json
{
  "success": true,
  "analysisId": "cuid_yearly_xxx",
  "year": 2026,
  "data": {
    "year": 2026,
    "summary": "2026년은 변화와 도약의 해입니다...",
    "yearlyTheme": "변화와 성장",
    "overallScore": 75,
    "monthlyFortunes": [
      {
        "month": 1,
        "theme": "새로운 시작",
        "score": 70,
        "overview": "1월은...",
        "luckyDays": [
          { "date": "2026-01-08", "dayOfWeek": "목", "reason": "...", "suitableFor": ["계약", "미팅"] }
        ],
        "unluckyDays": [
          { "date": "2026-01-15", "dayOfWeek": "목", "reason": "...", "avoid": ["큰 결정"] }
        ],
        "advice": "...",
        "keywords": ["시작", "준비"]
      }
    ],
    "quarterlyHighlights": [
      { "quarter": 1, "theme": "준비", "score": 68, "overview": "...", "keywords": [...], "advice": "..." }
    ],
    "keyDates": [
      { "date": "2026-03-21", "type": "lucky", "description": "...", "advice": "..." }
    ],
    "yearlyAdvice": {
      "wealth": { "overview": "...", "strengths": [...], "cautions": [...] },
      "love": { "overview": "...", "strengths": [...], "cautions": [...] },
      "career": { "overview": "...", "strengths": [...], "cautions": [...] },
      "health": { "overview": "...", "strengths": [...], "cautions": [...] }
    },
    "classicalReferences": [
      { "source": "궁통보감", "quote": "...", "interpretation": "..." }
    ]
  },
  "creditsUsed": 30,
  "remainingCredits": 70
}
```

**에러**:
- `INSUFFICIENT_CREDITS` (402): 크레딧 부족
- `TIMEOUT` (504): AI 분석 타임아웃
- `INVALID_INPUT` (400): 잘못된 입력

---

### GET /api/analysis/yearly/:id ✅

신년 분석 결과 조회 (Task 20 구현)

**인증**: 필수 (본인 분석만 조회 가능)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "cuid_yearly_xxx",
    "targetYear": 2026,
    "pillars": { ... },
    "daewun": [ ... ],
    "currentDaewun": { ... },
    "gender": "male",
    "analysis": { ... },
    "language": "ko",
    "creditsUsed": 30,
    "existingAnalysisId": null,
    "createdAt": "2026-01-02T10:00:00Z"
  }
}
```

---

### GET /api/analysis/list

사용자 분석 목록 (날짜 내림차순 정렬)

**Response**:
```json
{
  "analyses": [
    {
      "id": "analysis_xxx",
      "type": "full",
      "focusArea": "overall",
      "createdAt": "2026-01-02T10:00:00Z",
      "creditsUsed": 30
    }
  ]
}
```

---

### POST /api/analysis/:id/question ✅

AI 후속 질문 (Task 16 구현)

**인증**: 필수 | **크레딧 차감**: 10C | **타임아웃**: 30초

**Request**:
```json
{
  "question": "재물운이 좋아지는 시기는 언제인가요?"
}
```

**Response** (성공):
```json
{
  "success": true,
  "data": {
    "questionId": "q_xxx",
    "answer": "...",
    "creditsUsed": 10,
    "remainingCredits": 40
  }
}
```

**에러**:
| 코드 | HTTP | 설명 |
|------|------|------|
| `INSUFFICIENT_CREDITS` | 402 | 크레딧 부족 (10C 미만) |
| `INVALID_INPUT` | 400 | 질문 없음 또는 500자 초과 |
| `NOT_FOUND` | 404 | 분석 결과 없음 |
| `UNAUTHORIZED` | 401 | 인증 필요 |

---

### POST /api/analysis/yearly

신년 사주 분석 (30 크레딧)

**Request**:
```json
{
  "analysisId": "analysis_xxx",
  "year": 2026
}
```

---

### POST /api/analysis/compatibility

궁합 분석 (50 크레딧)

**Request**:
```json
{
  "person1": {
    "birthDatetime": "1990-05-15T14:30:00",
    "timezone": "GMT+9",
    "gender": "male"
  },
  "person2": {
    "birthDatetime": "1992-08-20T09:00:00",
    "timezone": "GMT+9",
    "gender": "female"
  }
}
```

---

## 결제 API

### POST /api/payment/create-checkout-session

Stripe Checkout 세션 생성 (Stripe pre-built UI 사용)

**Request**:
```json
{
  "packageId": "popular",
  "credits": 110,
  "amount": 1000
}
```

**Response**:
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_xxx..."
}
```

**크레딧 패키지**:
| Package ID | 이름 | 크레딧 | 가격 (USD) | 보너스 |
|------------|------|--------|-----------|--------|
| starter | 스타터 | 50C | $5.00 | - |
| popular | 인기 | 100C | $10.00 | +10C |
| premium | 프리미엄 | 300C | $30.00 | +50C |

---

### POST /api/payment/webhook

Stripe 웹훅 (Stripe 서버에서 호출)

**Headers**:
- `stripe-signature`: Stripe 서명 헤더 (필수)

**처리 이벤트**:
- `checkout.session.completed`: 결제 완료 처리
  - purchases 테이블에 레코드 생성
  - users 테이블의 credits 업데이트

**Webhook Secret**: `STRIPE_WEBHOOK_SECRET` 환경 변수로 설정

---

### 결제 성공 페이지

**URL**: `/payment/success?session_id={CHECKOUT_SESSION_ID}`

결제 완료 후 Stripe가 리다이렉트하는 페이지

---

## 사용자 API

### GET /api/user/profile ✅

사용자 프로필 조회

**Response**:
```json
{
  "id": "user_xxx",
  "email": "user@example.com",
  "name": "홍길동",
  "credits": 150,
  "emailNotificationsEnabled": true,
  "yearlyReminderEnabled": true,
  "preferredLanguage": "ko",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### PATCH /api/user/profile ✅

프로필 수정 (Task 17.4 구현 완료)

**Request**:
```json
{
  "name": "홍길동",
  "preferredLanguage": "ko",
  "emailNotificationsEnabled": true,
  "yearlyReminderEnabled": false
}
```

**Response**:
```json
{
  "id": "user_xxx",
  "email": "user@example.com",
  "name": "홍길동",
  "credits": 150,
  "emailNotificationsEnabled": true,
  "yearlyReminderEnabled": false,
  "preferredLanguage": "ko",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### GET /api/user/questions ✅

질문 기록 조회 (Task 17.2 구현 완료)

**Query Parameters**:
- `search` (optional): 질문/답변 내용 검색
- `analysisId` (optional): 특정 분석의 질문만 조회

**Response**:
```json
{
  "totalCount": 15,
  "groupedByAnalysis": [
    {
      "analysis": {
        "id": "analysis_xxx",
        "type": "full",
        "focusArea": "overall",
        "createdAt": "2026-01-02T10:00:00Z"
      },
      "questions": [
        {
          "id": "q_xxx",
          "question": "재물운이 좋아지는 시기는 언제인가요?",
          "answer": "2027년 상반기에 재물운이 상승합니다...",
          "creditsUsed": 10,
          "createdAt": "2026-01-02T11:00:00Z"
        }
      ]
    }
  ]
}
```

---

## Python API (만세력 엔진)

### POST /api/manseryeok/calculate

만세력 계산

**Request**:
```json
{
  "birthDatetime": "1990-05-15T14:30:00",
  "timezone": "GMT+9",
  "isLunar": false,
  "gender": "male"
}
```

**Response**:
```json
{
  "pillars": {
    "year": { "stem": "庚", "branch": "午", "element": "金" },
    "month": { "stem": "辛", "branch": "巳", "element": "金" },
    "day": { "stem": "甲", "branch": "子", "element": "木" },
    "hour": { "stem": "辛", "branch": "未", "element": "金" }
  },
  "daewun": [
    { "age": 1, "stem": "壬", "branch": "午", "startYear": 1991 },
    { "age": 11, "stem": "癸", "branch": "未", "startYear": 2001 }
  ],
  "jijanggan": {
    "year": ["己", "丁"],
    "month": ["戊", "庚", "丙"],
    "day": ["癸"],
    "hour": ["己", "丁", "乙"]
  }
}
```

---

### POST /api/visualization/pillar

사주 명반 이미지 생성 (800x400px PNG)

**Request**:
```json
{
  "pillars": {
    "year": { "stem": "庚", "branch": "午", "element": "金" },
    "month": { "stem": "辛", "branch": "巳", "element": "金" },
    "day": { "stem": "甲", "branch": "子", "element": "木" },
    "hour": { "stem": "辛", "branch": "未", "element": "金" }
  }
}
```

**Response (Phase 1 - Base64)**:
```json
{
  "imageBase64": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Response (Phase 2 - S3 URL, 추후 구현)**:
```json
{
  "imageUrl": "https://cdn.../pillar_xxx.png"
}
```

**오행 색상 매핑**:
| 오행 | 배경색 |
|------|--------|
| 木 | `#4ade80` (Green) |
| 火 | `#ef4444` (Red) |
| 土 | `#f59e0b` (Amber) |
| 金 | `#e5e7eb` (Gray) |
| 水 | `#1e3a8a` (Blue) |

---

### POST /api/prompts/build ✅

AI 프롬프트 빌드 (Task 14 구현)

다국어 명리학 프롬프트를 생성합니다. 자평진전, 궁통보감, The Destiny Code 기반.

**Request**:
```json
{
  "language": "ko",
  "pillars": {
    "year": { "stem": "庚", "branch": "午", "element": "金" },
    "month": { "stem": "辛", "branch": "巳", "element": "金" },
    "day": { "stem": "甲", "branch": "子", "element": "木" },
    "hour": { "stem": "辛", "branch": "未", "element": "金" }
  },
  "daewun": [{ "age": 1, "stem": "壬", "branch": "午", "startYear": 1991 }],
  "focusArea": "career",
  "question": "올해 이직해도 괜찮을까요?",
  "options": {
    "includeZiping": true,
    "includeQiongtong": true,
    "includeWestern": true
  }
}
```

**Response**:
```json
{
  "systemPrompt": "당신은 30년 경력의 명리학 거장입니다...",
  "userPrompt": "## 사주 팔자\n...",
  "outputSchema": { "type": "object", "properties": { ... } },
  "metadata": {
    "version": "1.0.0",
    "language": "ko",
    "includedModules": ["master", "ziping", "qiongtong", "western"],
    "generatedAt": "2026-01-02T12:00:00Z"
  }
}
```

**options 파라미터**:
| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `includeZiping` | true | 자평진전 원리 포함 (용신/격국/십신) |
| `includeQiongtong` | true | 궁통보감 조후론 포함 |
| `includeWestern` | true | The Destiny Code 프레임워크 포함 |

---

## RAG API

### POST /api/rag/search

고전 문헌 검색 (내부용)

**Request**:
```json
{
  "query": "甲木 일간 재성 분석",
  "topK": 5
}
```

**Response**:
```json
{
  "results": [
    {
      "content": "甲木者, 陽木也, 參天雄壯之木...",
      "source": "자평진전",
      "score": 0.92
    }
  ]
}
```

---

## 에러 코드

| Code | Message | 설명 |
|------|---------|------|
| 400 | INVALID_INPUT | 입력값 오류 |
| 401 | UNAUTHORIZED | 인증 필요 |
| 402 | INSUFFICIENT_CREDITS | 크레딧 부족 |
| 404 | NOT_FOUND | 리소스 없음 |
| 500 | INTERNAL_ERROR | 서버 오류 |
| 504 | TIMEOUT | Gemini API 타임아웃 (30초) |
| 429 | RATE_LIMIT | API 요청 한도 초과 |

---

**최종 수정**: 2026-01-02 (Task 18: 다국어 프롬프트 최적화 - zh-CN/zh-TW 분리, 5개 언어 지원)
