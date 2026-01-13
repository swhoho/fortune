# 상담 AI 프롬프트

> 사주 기반 1:1 상담 (다회 명확화 + 가정의 법칙)

**소스 코드**: `python/prompts/consultation.py`

---

## 크레딧 및 세션 정책

| 항목 | 값 |
|------|-----|
| 세션 생성 비용 | **10C** |
| 세션당 질문 라운드 | **2라운드** |
| 라운드당 최대 명확화 | **3회** |
| 라운드 추가 비용 | 무료 |

### 1라운드 구조 (v2.0)
```
사용자 질문 → AI 정보평가 → [부족] → 추가질문 1
                              ↓
                        사용자 답변 1 → AI 정보평가 → [부족] → 추가질문 2
                                                       ↓
                                                 사용자 답변 2 → AI 정보평가 → [충분 또는 3회 도달]
                                                                              ↓
                                                                        AI 최종 답변
```

**특징**:
- 정보 충분도 80% 이상이면 바로 답변
- 사용자가 "바로 답변 받기" 선택 시 즉시 답변
- 최대 3회 명확화 후 강제 답변

### 크레딧 확인 플로우
1. "상담 시작" 클릭
2. 크레딧 부족 → `InsufficientCreditsDialog` (충전 안내)
3. 크레딧 충분 → `CreditDeductionDialog` (확인 팝업)
4. 확인 → 10C 차감 후 세션 생성

---

## 철학: 가정의 법칙 (Law of Assumption)

v2.0부터 상담 철학에 "가정의 법칙"을 적용합니다.

> **사주(四柱)**: 우리가 타고난 '에너지의 지도'이자 기상예보
> **가정의 법칙(LoA)**: "소망이 이미 이루어졌음을 느끼는 감각"을 통해 사주의 흐름을 유리하게 이용하거나 초월하는 힘

### 핵심 원칙
- 사주 분석은 객관적으로 운의 흐름이 좋다/나쁘다 평가 가능
- 불리한 부분이 있어도 대비책과 개선 방향을 함께 제시
- 긍정적 사고와 구체적 실천이 미래를 바꿀 수 있다는 희망의 메시지

### 참고 스승 (내부 가이드라인)

| 스승 | 비고 |
|------|------|
| 네빌 고다드 (Neville Goddard) | 이미 이루어진 상태의 느낌 |
| 조셉 머피 (Joseph Murphy) | 잠재의식의 힘 |
| 플로렌스 스코블 신 (Florence Scovel Shinn) | 말과 선언의 마법 |
| 루이스 헤이 (Louise Hay) | 자기 사랑과 확언 |
| 에이브러햄 힉스 (Abraham Hicks) | 좋은 기분이 좋은 현실 |
| 에크하르트 톨레 (Eckhart Tolle) | 현재 순간의 힘 |
| 웨인 다이어 (Wayne Dyer) | 의도의 힘 |
| 디팩 초프라 (Deepak Chopra) | 순수 잠재성 |

**중요 금지 사항**:
- 출력에 스승 이름 언급 금지
- 서적 이름 언급 금지
- 철학만 창의적으로 녹여내기

---

## Stage 1: 정보 평가/명확화 (Assessment)

### 함수
```python
def build_assessment_prompt(
    question: str,
    pillars_summary: str,
    history: List[Dict[str, str]],
    recent_consultations: List[Dict[str, str]],
    language: str = "ko"
) -> str
```

### 입력 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `question` | str | 사용자 원래 질문 |
| `pillars_summary` | str | 사주 요약 (일간, 용신, 격국) |
| `history` | List[Dict] | 현재 세션 내 명확화 기록 |
| `recent_consultations` | List[Dict] | 최근 5개 완료된 상담 기록 |
| `language` | str | 언어 코드 (ko, en, ja, zh-CN, zh-TW) |

### 판단 기준

| 질문 유형 | 확인할 정보 |
|----------|------------|
| 직장/이직 | 현재 직종, 이직 여부, 이상적인 직장 모습 |
| 연애/결혼 | 현재 관계 상태, 구체적 갈등, 원하는 관계 |
| 재물/투자 | 현재 수입 구조, 투자 성향, 목표 경제 상태 |
| 건강 | 현재 증상, 우려 부위, 원하는 건강 상태 |
| 학업/진로 | 현재 상황, 목표하는 결과 |
| 공통 | "어떤 결과를 기대하는가?" (단순 "운세 알려줘" 지양) |

### 응답 스키마
```json
{
  "isValid": true,
  "isInfoSufficient": false,
  "confidenceLevel": 65,
  "category": "직장",
  "missingInfo": ["현재 직종", "이직 희망 시기"],
  "nextQuestions": ["현재 어떤 일을 하고 계신가요?", "이직을 고민하는 구체적인 이유가 있으신가요?"],
  "assessmentReason": "이직 시기 판단을 위해 현재 직종과 고민 배경을 파악해야 합니다."
}
```

| 필드 | 설명 |
|------|------|
| `isValid` | 사주 관련 질문 여부 (날씨/뉴스 등은 false) |
| `isInfoSufficient` | 답변 가능한 정보 충분 여부 |
| `confidenceLevel` | 정보 충분도 (0-100, 80 이상이면 답변) |
| `category` | 질문 분류 (직장/연애/재물/건강/학업/기타) |
| `missingInfo` | 부족한 정보 목록 |
| `nextQuestions` | 추가 질문 (최대 2개) |
| `assessmentReason` | 평가 근거 |

---

## Stage 2: 답변 (Answer)

### 함수
```python
def build_answer_prompt(
    question: str,
    pillars: dict,
    daewun: List[dict],
    clarification_responses: List[Dict[str, str]],
    today: str,
    analysis_summary: Optional[str] = None,
    yearly_summary: Optional[dict] = None,
    recent_consultations: List[Dict[str, str]] = None,
    confidence_level: int = 80,
    language: str = "ko"
) -> str
```

### 입력 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `question` | str | 사용자 원래 질문 |
| `pillars` | dict | 사주 팔자 (year/month/day/hour) |
| `daewun` | List[dict] | 대운 목록 (최대 8개) |
| `clarification_responses` | List[Dict] | 수집된 명확화 정보 (1-3회) |
| `today` | str | 오늘 날짜 YYYY-MM-DD |
| `analysis_summary` | str | 기본 분석 요약 (선택) |
| `yearly_summary` | dict | 신년 운세 요약 (선택) |
| `recent_consultations` | List[Dict] | 최근 5개 상담 (일관성 검토용) |
| `confidence_level` | int | 정보 충분도 (평가 단계에서 전달) |
| `language` | str | 언어 코드 |

### 응답 구조 (5단계)

1. **[도입]**: "분석된 사주와 대운을 바탕으로, 당신의 내면이 창조할 미래를 함께 설계하겠습니다."
2. **[사주 해석]**: 격국/용신 기반 현재 환경을 자연 현상 비유로 설명
3. **[시기와 흐름]**: 대운/세운 분석, 에너지 집중 시기 제시
4. **[가정의 법칙 적용]**: 사용자가 가정해야 할 '상태' 처방, 개선 가능성 전달
5. **[실행 플랜]**: 사주 에너지에 맞는 실질적 조언, 주의점은 '대비책'으로

### 응답 가이드라인

- **분량**: 800-1300자 (상세하고 깊이 있게)
- **어조**: 우아하고 품격 있으며, 영혼을 고양시키는 톤
- **고전 인용**: 자평진전, 궁통보감, 적천수 적절히 인용
- **한자 비유 필수**: 천간/지지를 일상 비유로 풀이
  - 천간: 甲木(큰 나무), 乙木(풀/덩굴), 丙火(태양), 丁火(촛불), 戊土(산/대지), 己土(논밭), 庚金(바위/쇠), 辛金(보석/칼날), 壬水(바다/큰물), 癸水(이슬/샘물)
  - 지지: 寅卯(봄/나무기운), 巳午(여름/불기운), 申酉(가을/금속기운), 亥子(겨울/물기운), 辰戌丑未(환절기/흙기운)
- **일관성 검토**: 기존 분석, 신년 운세, 최근 상담과 모순되지 않도록

---

## 핵심 규칙

### 절대 금지 (재질문 금지)
```
- 생년월일시
- 양력/음력 여부
- 성별
- 사주 명식
```

**이유**: 사주 정보는 이미 시스템에 저장되어 있음

### 이미 확인된 정보 재질문 금지
- 현재 세션 내 명확화 기록(history)에 있는 정보
- 최근 상담 기록(recent_consultations)에 있는 정보

### 필수 전달 정보
```python
# 오늘 날짜 전달 (시기 관련 질문 정확도 향상)
today = datetime.now().strftime("%Y-%m-%d")
prompt = build_answer_prompt(..., today=today)
```

---

## 데이터 형식

### 사주 요약 (pillars_summary)
```
일간: 丁火(촛불처럼 섬세한 불), 용신: 甲木(큰 나무), 격국: 식신격
```

### 명확화 기록 (history)
```python
[
  {"round": 1, "ai_question": "현재 직종은 무엇인가요?", "user_answer": "IT 개발자입니다"},
  {"round": 2, "ai_question": "이직을 고민하는 이유는?", "user_answer": "성장 정체와 연봉"}
]
```

### 최근 상담 기록 (recent_consultations)
```python
[
  {"date": "2026-01-10", "question": "올해 이직 운이 어떤가요?", "summary": "2026년 하반기 이직 유리..."},
  {"date": "2026-01-05", "question": "연애운이 궁금합니다", "summary": "2026년 봄 새로운 인연 가능성..."}
]
```

### 명확화 응답 (clarification_responses)
```python
[
  {"round": 1, "ai_question": "현재 직종은 무엇인가요?", "user_answer": "IT 개발자입니다"},
  {"round": 2, "ai_question": "이직을 고민하는 이유는?", "user_answer": "성장 정체와 연봉 불만족입니다"}
]
```

---

## DB 스키마 (v2.0)

### consultation_sessions
```sql
ALTER TABLE consultation_sessions
ADD COLUMN clarification_count INT DEFAULT 0,
ADD COLUMN max_clarifications INT DEFAULT 3;
```

### consultation_messages
```sql
ALTER TABLE consultation_messages
ADD COLUMN clarification_round INT DEFAULT 0;
```

---

## 다국어 지원

| 코드 | 언어 | 특징 |
|------|------|------|
| `ko` | 한국어 | 존댓말, 한자 병기 |
| `en` | 영어 | Four Pillars 용어, PRD 스타일 |
| `ja` | 일본어 | 四柱推命 용어, 敬語 |
| `zh-CN` | 중국어 간체 | 八字命理, 简体字 |
| `zh-TW` | 중국어 번체 | 八字命理, 繁體字 |

---

## 서비스 연동

**파일**: `python/services/consultation_service.py`

```python
class ConsultationService:
    MAX_CLARIFICATIONS = 3

    async def _call_gemini(self, request, report, history, previous_error=None) -> tuple:
        # 1. 최근 상담 기록 조회
        recent_consultations = self._get_recent_consultations(supabase, profile_id)

        # 2. 사주 요약 생성
        pillars_summary = self._build_pillars_summary(pillars, analysis)

        # 3. 현재 명확화 라운드 확인
        current_round = len(collected_info)

        # 4. 최대 횟수 도달 또는 건너뛰기 → 바로 답변
        if current_round >= self.MAX_CLARIFICATIONS or skip_clarification:
            return await self._generate_final_answer(...)

        # 5. 정보 평가
        assessment = await self._assess_info_sufficiency(...)

        # 6. 충분하면 답변, 부족하면 추가 질문
        if assessment['isInfoSufficient'] or assessment['confidenceLevel'] >= 80:
            return await self._generate_final_answer(...)
        else:
            return self._format_clarification_questions(...), 'ai_clarification', current_round + 1
```

### API 엔드포인트
```
POST /api/consultation/generate
```

**Request**:
```json
{
  "session_id": "uuid",
  "message_id": "uuid",
  "user_content": "이직 시기가 궁금합니다",
  "message_type": "user_question",
  "skip_clarification": false,
  "question_round": 1,
  "language": "ko"
}
```

**Response**:
```json
{
  "message_id": "uuid",
  "content": "분석된 사주와 대운을 바탕으로...",
  "message_type": "ai_answer",
  "clarification_round": 2
}
```

---

## 중복 요청 방지 (v1.32)

3계층 방어로 중복 응답 버그 방지:

### 1. 프론트엔드 (useSendMessage 훅)
```typescript
const isSubmittingRef = useRef(false);

mutationFn: async (...) => {
  if (isSubmittingRef.current) throw new Error('이미 요청 중');
  isSubmittingRef.current = true;
  try { ... } finally { isSubmittingRef.current = false; }
}
```

### 2. 백엔드 (consultation_service.py)
```python
# 처리 전 상태 확인
if status != 'generating': return

# 업데이트 시 상태 조건 (OCC 패턴)
.eq('id', message_id).eq('status', 'generating').execute()

# 0 rows 영향 시 조기 종료
if not result.data: return
```

### 3. UI 컴포넌트 (ChatArea.tsx)
```typescript
// generating 상태 시 awaitingClarification 변경 방지
if (generatingMessage) return;

// 낙관적 업데이트 + 실패 시 롤백
setAwaitingClarification(false);
try { ... } catch { setAwaitingClarification(true); }
```

---

## 신년분석 연동 (v1.38)

상담 시 사용자의 신년분석 요약이 자동으로 포함됩니다.

### 데이터 조회 로직
```python
# consultation_service.py - _get_report_data()
yearly_result = supabase.table('yearly_analyses').select(
    'target_year, overview'
).eq('profile_id', profile_id).eq(
    'status', 'completed'
).order('target_year', desc=True).limit(1).execute()
```

### 프롬프트 포함 형식
```
2025년 신년 운세 요약:
[overview.summary 내용]
```

### 처리 규칙
| 상황 | 처리 |
|------|------|
| 신년분석 없음 | 프롬프트에 포함 안함 (기존 동작 유지) |
| 여러 연도 존재 | 최신 연도만 사용 |
| status != completed | 제외 |

---

## 최근 상담 기록 연동 (v2.0)

신규 상담 시 최근 5개 완료된 상담 기록을 자동으로 포함합니다.

### 데이터 조회 로직
```python
def _get_recent_consultations(self, supabase, profile_id, limit=5):
    result = supabase.table('consultation_sessions').select(
        'id, title, created_at'
    ).eq('profile_id', profile_id).eq(
        'status', 'completed'
    ).order('created_at', desc=True).limit(limit).execute()

    consultations = []
    for session in result.data or []:
        # 각 세션의 마지막 AI 답변 조회
        messages = supabase.table('consultation_messages').select(
            'content'
        ).eq('session_id', session['id']).eq(
            'message_type', 'ai_answer'
        ).eq('status', 'completed').order('created_at', desc=True).limit(1).execute()

        if messages.data:
            consultations.append({
                'date': session['created_at'][:10],
                'question': session['title'],
                'summary': messages.data[0]['content'][:200] + '...'
            })

    return consultations
```

### 용도
- **정보 평가**: 이미 확인된 정보 재질문 방지
- **답변 생성**: 일관성 검토 (이전 상담과 모순되지 않도록)

---

## 오늘의 운세 상담 탭 (v1.46)

오늘의 운세 상세 페이지에서도 상담 탭을 통해 AI 상담을 이용할 수 있습니다.

### 탭 구조
```
/[locale]/daily-fortune/[id]?tab=fortune     # 운세 탭 (기본)
/[locale]/daily-fortune/[id]?tab=consultation # 상담 탭
```

### 컴포넌트 구조
```
DailyFortuneNavigation      # 탭 네비게이션 (2탭)
├── 운세 (Sun 아이콘)        # fortune 탭
└── 상담 (MessageCircle 아이콘)  # consultation 탭 → ConsultationTab 재사용
```

### 접근 제어
| 사용자 | 운세 탭 | 상담 탭 |
|--------|---------|---------|
| 본인 | ✅ | ✅ |
| 타인 (공유 링크) | ✅ | ❌ 차단 |
| 비로그인 | ✅ | ❌ 로그인 리다이렉트 |

### ConsultationTab 연동
```typescript
// daily-fortune/[id]/page.tsx
{activeTab === 'consultation' && profileId && (
  <ConsultationTab profileId={profileId} />
)}
```

기존 ConsultationTab 컴포넌트를 그대로 재사용하며, `profileId`를 전달하여 해당 프로필 기준으로 상담 세션을 관리합니다.

---

## 관련 문서

- [fortune_engine.md](./fortune_engine.md) - 만세력 엔진, 점수 시스템
- [report_analysis.md](./report_analysis.md) - 리포트 분석 파이프라인
- [yearly_analysis.md](./yearly_analysis.md) - 신년 분석 파이프라인
- [daily_analysis.md](./daily_analysis.md) - 오늘의 운세 시스템

---

**최종 수정**: 2026-01-13 (v2.0 다회 명확화 + 가정의 법칙)
