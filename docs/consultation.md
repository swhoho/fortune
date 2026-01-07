# 상담 AI 프롬프트

> 사주 기반 1:1 상담 (2단계 프롬프트)

**소스 코드**: `python/prompts/consultation.py`

---

## 크레딧 및 세션 정책

| 항목 | 값 |
|------|-----|
| 세션 생성 비용 | **10C** |
| 세션당 질문 라운드 | **2라운드** |
| 라운드 추가 비용 | 무료 |

### 1라운드 구조
```
사용자 질문 → AI 추가질문(선택) → 사용자 답변(선택) → AI 최종 답변
```

### 크레딧 확인 플로우
1. "상담 시작" 클릭
2. 크레딧 부족 → `InsufficientCreditsDialog` (충전 안내)
3. 크레딧 충분 → `CreditDeductionDialog` (확인 팝업)
4. 확인 → 10C 차감 후 세션 생성

---

## 2단계 흐름

```
[사용자 질문] → [Stage 1: 명확화] → [추가 정보 필요?]
                                         ↓ No
                      Yes ←──────────────┘
                       ↓
              [사용자 추가 입력] → [Stage 2: 답변] → [최종 응답]
```

---

## Stage 1: 명확화 (Clarification)

### 함수
```python
def build_clarification_prompt(question: str, language: str = "ko") -> str
```

### 판단 기준

| 질문 유형 | 확인할 정보 |
|----------|------------|
| 직장/이직 | 현재 직종, 고민하는 시기, 이직 이유 |
| 연애/결혼 | 현재 연애 상태, 구체적인 고민 |
| 재물/투자 | 직장 수입/사업/투자 중 관심사 |
| 건강 | 특정 증상, 걱정되는 부위 |
| 대인관계 | 가족/친구/직장 중 어느 관계 |
| 진로/적성 | 현재 상황, 고민의 구체적 내용 |

### 응답 스키마
```json
{
  "isValidQuestion": true,
  "needsClarification": false,
  "clarificationQuestions": [],
  "invalidReason": null
}
```

| 필드 | 설명 |
|------|------|
| `isValidQuestion` | 사주 관련 질문인지 (날씨/뉴스 등은 false) |
| `needsClarification` | 추가 정보 필요 여부 |
| `clarificationQuestions` | 추가 질문 (최대 2개) |
| `invalidReason` | 유효하지 않은 이유 |

---

## Stage 2: 답변 (Answer)

### 함수
```python
def build_answer_prompt(
    question: str,
    pillars: dict,
    daewun: List[dict],
    analysis_summary: Optional[str] = None,
    session_history: Optional[List[Dict[str, str]]] = None,
    clarification_response: Optional[str] = None,
    language: str = "ko",
    today: Optional[str] = None
) -> str
```

### 입력 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `question` | str | 사용자 원래 질문 |
| `pillars` | dict | 사주 팔자 (year/month/day/hour) |
| `daewun` | List[dict] | 대운 목록 (최대 8개) |
| `analysis_summary` | str | 기본 분석 요약 (선택) |
| `session_history` | List | 이전 대화 기록 (선택) |
| `clarification_response` | str | 사용자 추가 정보 (선택) |
| `today` | str | 오늘 날짜 YYYY-MM-DD |

### 응답 가이드라인

- **분량**: 500-800자 상세 답변
- **시작 문구**: "분석된 사주와 대운을 바탕으로 상담을 진행하겠습니다."
- **내용**:
  - 명리학적 근거 제시
  - 대운/세운 흐름 고려한 시기 제안
  - 일간(日干) 특성 반영 개인 맞춤 조언
  - 고전 인용 (자평진전, 궁통보감)
- **톤**: 따뜻하고 전문적, 미신적 표현 지양

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

### 필수 전달 정보
```python
# 오늘 날짜 전달 (시기 관련 질문 정확도 향상)
today = datetime.now().strftime("%Y-%m-%d")
prompt = build_answer_prompt(..., today=today)
```

### 세션 히스토리 형식
```python
session_history = [
    {"question": "이직 시기가 궁금합니다", "answer": "..."},
    {"question": "어떤 업종이 좋을까요?", "answer": "..."}
]
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
    async def process_message(
        session_id: str,
        message_id: str,
        user_content: str,
        pillars: dict,
        daewun: list,
        language: str
    ) -> dict
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
  "language": "ko"
}
```

**Response**:
```json
{
  "message_id": "uuid",
  "content": "분석된 사주와 대운을 바탕으로...",
  "role": "assistant",
  "needs_clarification": false
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

## 관련 문서

- [fortune_engine.md](./fortune_engine.md) - 만세력 엔진, 점수 시스템
- [report_analysis.md](./report_analysis.md) - 리포트 분석 파이프라인
- [yearly_analysis.md](./yearly_analysis.md) - 신년 분석 파이프라인

---

**최종 수정**: 2026-01-07 (v1.32 중복 요청 방지 3계층 방어)
