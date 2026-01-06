# 리포트 분석 파이프라인

> 사용자 프로필 기반 사주 분석 (비동기 11단계)

**소스 코드**: `python/services/report_analysis.py`

---

## 파이프라인 단계

| 단계 | 이름 | 설명 | 엔진 | 진행률 |
|------|------|------|------|--------|
| 1 | `manseryeok` | 만세력 계산 | Python | 10% |
| 2 | `jijanggan` | 지장간 추출 | Python | 15% |
| 3 | `basic_analysis` | 기본 분석 (일간/격국/용신) | Gemini | 30% |
| 4 | `personality` | 성격 분석 | Gemini | 45% |
| 5 | `aptitude` | 적성 분석 | Gemini | 55% |
| 6 | `fortune` | 재물/연애 분석 | Gemini | 65% |
| 7 | `daewun_analysis` | 대운 상세 분석 (8개) | Gemini | 75% |
| 8 | `scoring` | 십신 기반 점수 계산 | Python | 85% |
| 9 | `visualization` | 명반 이미지 생성 | Python | 92% |
| 10 | `saving` | Supabase DB 저장 | - | 97% |
| 11 | `complete` | 완료 | - | 100% |

---

## API 엔드포인트

### 분석 시작
```
POST /api/analysis/report
```

**Request**:
```json
{
  "report_id": "uuid",
  "user_id": "uuid",
  "birth_date": "1990-01-15",
  "birth_time": "14:30",
  "calendar_type": "solar",
  "gender": "male",
  "language": "ko"
}
```

**Response**:
```json
{
  "job_id": "uuid"
}
```

### 상태 폴링
```
GET /api/analysis/report/{job_id}
```

**Response**:
```json
{
  "job_id": "uuid",
  "status": "in_progress",
  "progress_percent": 45,
  "current_step": "personality",
  "step_statuses": {
    "manseryeok": "completed",
    "jijanggan": "completed",
    "basic_analysis": "completed",
    "personality": "in_progress",
    "aptitude": "pending",
    ...
  },
  "pillars": { ... },
  "daewun": [ ... ],
  "analysis": { ... },
  "error": null
}
```

---

## Job Store 패턴

인메모리 작업 저장소 (Railway 단일 인스턴스 환경)

```python
class JobStore:
    def create(job_id, report_id, user_id) -> Dict
    def get(job_id) -> Optional[Dict]
    def get_by_report_id(report_id) -> Optional[Dict]
    def update(job_id, **kwargs) -> Optional[Dict]
    def update_step_status(job_id, step, status) -> None
    def cleanup_old_jobs(max_age_hours=24) -> None
```

**상태 값**:
- `pending`: 대기 중
- `in_progress`: 진행 중
- `completed`: 완료
- `failed`: 실패

---

## 재시도 전략

각 Gemini 분석 단계에서 **3회 재시도**:

```python
for attempt in range(1, max_retries + 1):
    try:
        result = await self._call_gemini(prompt)
        # 성공 시 DB 중간 저장
        break
    except Exception as e:
        logger.warning(f"실패 ({attempt}/{max_retries}): {e}")

# 3회 실패 시 다음 단계로 진행 (부분 결과 허용)
```

**실패 처리**:
- Gemini 단계 실패 → 다음 단계로 진행 (해당 필드 없음)
- 만세력/기본분석 실패 → 전체 중단
- 최소 1개 분석 성공 시 → `completed` 상태로 완료

---

## DB 중간 저장

각 Gemini 단계 성공 시 Supabase `profile_reports` 테이블 업데이트:

```python
await self._update_db_status(
    report_id,
    status="in_progress",
    analysis=analysis,
    step_statuses=step_statuses,
    progress_percent=45
)
```

**크래시 복구**:
- 서버 재시작 시 마지막 저장 시점부터 재개 가능
- `retry_from_step` 파라미터로 특정 단계부터 재시도

---

## JSON 정규화

Gemini 응답의 키를 TypeScript 호환 camelCase로 변환:

```python
from services.normalizers import normalize_response, normalize_all_keys

# 단계별 정규화 + 전역 camelCase 변환
normalized = normalize_all_keys(normalize_response(step_name, result))
```

**매핑 예시**:
| Gemini 응답 | 정규화 후 |
|-------------|----------|
| `겉성격` | `outerPersonality` |
| `속성격` | `innerPersonality` |
| `재능_활용_상태` | `talentUsage` |

---

## 리포트 UI 컴포넌트 (v2.3)

### 신규 컴포넌트

| 컴포넌트 | 설명 |
|---------|------|
| `BasicAnalysisSection` | 일간 특성, 격국, 용신/기신 카드 |
| `DetailedScoresSection` | 연애/업무 점수 레이더 차트 (Recharts) |

### 섹션별 확장 데이터

각 섹션은 `extended` prop으로 DB에 저장된 상세 데이터를 표시:

```
SajuTable         → jijanggan (지장간 3개 표시)
AptitudeSection   → talents basis/level, avoidFields, talentUsage, suitability
RomanceSection    → style, idealPartner, warnings, compatibilityPoints, loveAdvice
WealthSection     → pattern, strengths, risks, advice
PersonalitySection → socialStyleDetail (type/strengths/weaknesses)
```

---

## 관련 문서

- [fortune_engine.md](./fortune_engine.md) - 만세력 엔진, 점수 시스템
- [yearly_analysis.md](./yearly_analysis.md) - 신년 분석 파이프라인
- [consultation.md](./consultation.md) - 상담 AI 프롬프트

---

**최종 수정**: 2026-01-07
