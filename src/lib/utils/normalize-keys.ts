/**
 * JSON 키 정규화 유틸리티
 * Python normalizers.py의 KOREAN_KEY_MAPPING과 동기화
 */

/**
 * 한글 키 → 영문 camelCase 매핑
 * Python normalizers.py와 동일하게 유지
 */
const KOREAN_KEY_MAPPING: Record<string, string> = {
  // personality
  겉성격: 'outerPersonality',
  속성격: 'innerPersonality',
  대인관계_스타일: 'socialStyle',
  의지력: 'willpower',
  본성: 'trueNature',
  근거: 'basis',
  인상: 'impression',
  사회적_페르소나: 'socialPersona',
  감정_처리방식: 'emotionalProcessing',
  유형: 'type',
  강점: 'strengths',
  약점: 'weaknesses',
  설명: 'description',
  점수: 'score',
  특성: 'traits',
  // aptitude
  핵심_키워드: 'keywords',
  타고난_재능: 'talents',
  추천_분야: 'recommendedFields',
  회피_분야: 'avoidFields',
  재능_활용_상태: 'talentUsage',
  현재_수준: 'currentLevel',
  잠재력: 'potential',
  조언: 'advice',
  // fortune
  재물운: 'wealth',
  연애운: 'love',
  패턴_유형: 'pattern',
  재물_점수: 'wealthScore',
  연애_점수: 'loveScore',
  재물운_강점: 'strengths',
  재물운_리스크: 'risks',
  스타일_유형: 'style',
  이상형_특성: 'idealPartner',
  궁합_포인트: 'compatibilityPoints',
  연애_조언: 'loveAdvice',
  // yearly
  상반기: 'firstHalf',
  하반기: 'secondHalf',
  월별_운세: 'monthlyFortune',
  주요_키워드: 'mainKeywords',
  총운: 'overallFortune',
  재물: 'wealth',
  연애: 'love',
  건강: 'health',
  직업: 'career',
};

/**
 * snake_case를 camelCase로 변환
 * @example "social_persona" → "socialPersona"
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * 객체의 모든 키를 표준 camelCase로 정규화
 * 한글 키, snake_case 모두 처리
 *
 * @param obj 정규화할 객체
 * @returns 키가 camelCase로 변환된 객체
 *
 * @example
 * normalizeKeys({ '겉성격': { social_persona: 'test' } })
 * // => { outerPersonality: { socialPersona: 'test' } }
 */
export function normalizeKeys<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeKeys(item)) as T;
  }

  if (typeof obj !== 'object') return obj;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    let camelKey: string;

    // 1. 한글 키 → 영문 camelCase
    if (KOREAN_KEY_MAPPING[key]) {
      camelKey = KOREAN_KEY_MAPPING[key];
    }
    // 2. snake_case → camelCase
    else if (key.includes('_') && !key.startsWith('_')) {
      camelKey = snakeToCamel(key);
    }
    // 3. 이미 camelCase
    else {
      camelKey = key;
    }

    // 재귀 적용
    result[camelKey] = normalizeKeys(value);
  }

  return result as T;
}
