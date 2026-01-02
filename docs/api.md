# Master's Insight AI - API 명세

**Base URL**: `https://api.mastersinsight.ai` (Production)  
**Local**: `http://localhost:3000/api` (Next.js) / `http://localhost:8000` (Python)

---

## 인증 API (NextAuth.js)

### GET/POST /api/auth/[...nextauth]

NextAuth.js 인증 엔드포인트 (자동 생성)

- `GET /api/auth/session` - 현재 세션 조회
- `GET /api/auth/providers` - 사용 가능한 인증 제공자 목록
- `POST /api/auth/signin/credentials` - 이메일/비밀번호 로그인
- `POST /api/auth/signout` - 로그아웃
- `GET /api/auth/csrf` - CSRF 토큰

### 인증 방식

- **Provider**: Credentials (이메일 + 비밀번호)
- **Session**: JWT 기반 (30일 유효)
- **Backend**: Supabase Auth 연동

### 인증 필요 라우트 (미들웨어)

다음 경로는 인증이 필요합니다:
- `/analysis/*` - 분석 페이지
- `/mypage/*` - 마이페이지
- `/payment/*` - 결제 페이지
- `/api/analysis/*` - 분석 API
- `/api/user/*` - 사용자 API
- `/api/payment/*` - 결제 API

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
  "question": "2026년 운세가 궁금합니다"
}
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

### GET /api/analysis/:id

분석 결과 조회

**Response**:
```json
{
  "id": "analysis_xxx",
  "status": "completed",
  "pillars": {
    "year": { "stem": "庚", "branch": "午" },
    "month": { "stem": "辛", "branch": "巳" },
    "day": { "stem": "甲", "branch": "子" },
    "hour": { "stem": "辛", "branch": "未" }
  },
  "analysis": {
    "summary": "...",
    "personality": "...",
    "wealth": "...",
    "love": "...",
    "career": "...",
    "health": "..."
  },
  "visualizations": {
    "pillarCard": "https://cdn.../pillar.png",
    "elementGraph": "https://cdn.../element.png"
  },
  "createdAt": "2026-01-02T10:00:00Z"
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

### POST /api/analysis/:id/question

AI 추가 질문 (10 크레딧)

**Request**:
```json
{
  "question": "재물운이 좋아지는 시기는 언제인가요?"
}
```

**Response**:
```json
{
  "questionId": "q_xxx",
  "answer": "...",
  "creditsUsed": 10
}
```

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

### GET /api/user/profile

사용자 프로필 조회

**Response**:
```json
{
  "id": "user_xxx",
  "email": "user@example.com",
  "name": "홍길동",
  "credits": 150,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

### PATCH /api/user/profile

프로필 수정

**Request**:
```json
{
  "name": "홍길동",
  "language": "ko"
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

**최종 수정**: 2026-01-02 (Task 6: Gemini API 엔드포인트 추가)
