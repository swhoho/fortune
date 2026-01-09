# 궁합 분석 v2.0 PRD

> 고전 명리학 기반 궁합 분석 고도화 - **구현 완료**

## 구현 현황

| Task | 내용 | 상태 | 파일 |
|------|------|------|------|
| Task 1 | 삼합/방합 국(局) 형성 | ✅ 완료 | `compatibility_engine.py` |
| Task 2 | 원진(元辰) 분석 | ✅ 완료 | `compatibility_engine.py` |
| Task 3 | 도화살 매력도 분석 | ✅ 완료 | `compatibility_engine.py` |
| Task 4 | 12신살 분석 | ⏸️ 후순위 | - |
| Task 5 | 조후(調候) 색채 | ✅ 완료 | `compatibility_service.py` |
| Task 6 | 물상론 DB | ✅ 완료 | `compatibility_prompts.py` |
| Task 7 | 충 물상 강화 | ✅ 완료 | `compatibility_service.py` |
| Task 8 | UI 표시 | ✅ 완료 | `[id]/page.tsx` |
| Task 9 | DB 스키마 | ✅ 불필요 | JSONB 활용 |

---

## 참조 문서

| 문서 | 핵심 내용 |
|------|----------|
| `docs/txt/사주분석마스터.txt` | 삼합/방합, 원진, 12신살, 형충배수 |
| `docs/txt/窮通寶鑑.txt` | 조후(한/난/조/습), 월령 용신 |
| `docs/txt/子平真诠评.txt` | 용신론, 합화 조건 |
| `docs/txt/Bazi-The-Destiny-Code.txt` | 도화살, Palace Method |

---

## 핵심 구현 요약

### 점수 체계 (6개 항목)

```
천간 조화 24% + 지지 조화 24% + 오행 균형 19% +
십신 호환 19% + 12운성 시너지 9% + 삼합/방합 5% = 100%
```

### 추가된 상수

```python
# compatibility_engine.py
WONJIN, SAMHAP, BANHAP, BANGHAP, DOHWA

# compatibility_service.py
JOHU_MAP, JOHU_TUNE_WORDS, JOHU_COMPATIBILITY

# compatibility_prompts.py
MUSANG_DATABASE, TENSHIN_COMPATIBILITY_MUSANG, CHUNG_MUSANG
```

### Gemini 프롬프트 강화

- Step 5 (relationship_type): 조후 색채 컨텍스트
- Step 7 (conflict_analysis): 6충 물상 + 원진 정보
- Step 9 (mutual_influence): 십신 물상론

---

## 후속 작업 (선택)

- [ ] Task 4: 12신살 분석 (복잡도 높음, 영향도 낮음)
- [ ] 조후 점수를 총점에 반영 (현재는 프롬프트만 활용)

---

**최종 수정**: 2026-01-09 (v2.0 구현 완료)
