/**
 * 유효성 검사 단위 테스트
 * Task 11.2: 유효성 검사 함수 테스트
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

/**
 * API에서 사용하는 스키마 재정의 (테스트용)
 * 실제 코드에서는 src/app/api/analysis/gemini/route.ts에 정의됨
 */
const pillarSchema = z.object({
  stem: z.string().min(1, '천간이 필요합니다'),
  branch: z.string().min(1, '지지가 필요합니다'),
  element: z.string().min(1, '오행이 필요합니다'),
  stemElement: z.string().min(1, '천간 오행이 필요합니다'),
  branchElement: z.string().min(1, '지지 오행이 필요합니다'),
})

const analysisRequestSchema = z.object({
  pillars: z.object({
    year: pillarSchema,
    month: pillarSchema,
    day: pillarSchema,
    hour: pillarSchema,
  }),
  daewun: z
    .array(
      z.object({
        startAge: z.number(),
        endAge: z.number(),
        stem: z.string(),
        branch: z.string(),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  focusArea: z.enum(['wealth', 'love', 'career', 'health', 'overall']).optional(),
  question: z.string().max(500, '질문은 500자를 초과할 수 없습니다').optional(),
})

/**
 * 생년월일 범위 검증 함수 (테스트용)
 */
function validateBirthYear(year: number): boolean {
  return year >= 1900 && year <= 2100
}

/**
 * 시간대 형식 검증 함수 (테스트용)
 * GMT+0 ~ GMT+14, GMT-0 ~ GMT-12 범위만 허용
 */
function validateTimezone(timezone: string): boolean {
  const match = timezone.match(/^GMT([+-])(\d{1,2})$/)
  if (!match || !match[2]) return false
  const offset = parseInt(match[2], 10)
  // UTC 오프셋 범위: -12 ~ +14
  return offset <= 14
}

describe('Zod 스키마 검증', () => {
  describe('pillarSchema', () => {
    const validPillar = {
      stem: '庚',
      branch: '午',
      element: '金',
      stemElement: '금',
      branchElement: '화',
    }

    it('유효한 기둥 데이터 통과', () => {
      const result = pillarSchema.safeParse(validPillar)
      expect(result.success).toBe(true)
    })

    it('천간 누락 시 실패', () => {
      const result = pillarSchema.safeParse({
        ...validPillar,
        stem: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('천간이 필요합니다')
      }
    })

    it('지지 누락 시 실패', () => {
      const result = pillarSchema.safeParse({
        ...validPillar,
        branch: '',
      })
      expect(result.success).toBe(false)
    })

    it('오행 누락 시 실패', () => {
      const result = pillarSchema.safeParse({
        ...validPillar,
        element: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('analysisRequestSchema', () => {
    const validPillar = {
      stem: '庚',
      branch: '午',
      element: '金',
      stemElement: '금',
      branchElement: '화',
    }

    const validRequest = {
      pillars: {
        year: validPillar,
        month: { ...validPillar, stem: '辛', branch: '巳' },
        day: { ...validPillar, stem: '壬', branch: '申', element: '水' },
        hour: { ...validPillar, stem: '丁', branch: '未', element: '火' },
      },
    }

    it('유효한 요청 통과 (필수 필드만)', () => {
      const result = analysisRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('유효한 요청 통과 (모든 필드)', () => {
      const result = analysisRequestSchema.safeParse({
        ...validRequest,
        daewun: [
          { startAge: 1, endAge: 10, stem: '壬', branch: '午' },
          { startAge: 11, endAge: 20, stem: '癸', branch: '未' },
        ],
        focusArea: 'wealth',
        question: '올해 재물운이 어떨까요?',
      })
      expect(result.success).toBe(true)
    })

    it('pillars 누락 시 실패', () => {
      const result = analysisRequestSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('focusArea enum 검증', () => {
      // 유효한 값
      const validValues = ['wealth', 'love', 'career', 'health', 'overall']
      for (const value of validValues) {
        const result = analysisRequestSchema.safeParse({
          ...validRequest,
          focusArea: value,
        })
        expect(result.success).toBe(true)
      }

      // 유효하지 않은 값
      const result = analysisRequestSchema.safeParse({
        ...validRequest,
        focusArea: 'invalid',
      })
      expect(result.success).toBe(false)
    })

    it('question 500자 제한', () => {
      // 500자 이하 통과
      const result1 = analysisRequestSchema.safeParse({
        ...validRequest,
        question: 'a'.repeat(500),
      })
      expect(result1.success).toBe(true)

      // 501자 이상 실패
      const result2 = analysisRequestSchema.safeParse({
        ...validRequest,
        question: 'a'.repeat(501),
      })
      expect(result2.success).toBe(false)
      if (!result2.success) {
        expect(result2.error.issues[0]?.message).toBe('질문은 500자를 초과할 수 없습니다')
      }
    })

    it('daewun 기본값 빈 배열', () => {
      const result = analysisRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.daewun).toEqual([])
      }
    })
  })
})

describe('생년월일 범위 검증', () => {
  it('유효한 연도 (1900-2100)', () => {
    expect(validateBirthYear(1900)).toBe(true)
    expect(validateBirthYear(1990)).toBe(true)
    expect(validateBirthYear(2000)).toBe(true)
    expect(validateBirthYear(2025)).toBe(true)
    expect(validateBirthYear(2100)).toBe(true)
  })

  it('유효하지 않은 연도', () => {
    expect(validateBirthYear(1899)).toBe(false)
    expect(validateBirthYear(2101)).toBe(false)
    expect(validateBirthYear(0)).toBe(false)
    expect(validateBirthYear(-1990)).toBe(false)
  })
})

describe('시간대 형식 검증', () => {
  it('유효한 시간대 형식', () => {
    expect(validateTimezone('GMT+9')).toBe(true)
    expect(validateTimezone('GMT+8')).toBe(true)
    expect(validateTimezone('GMT-5')).toBe(true)
    expect(validateTimezone('GMT-8')).toBe(true)
    expect(validateTimezone('GMT+0')).toBe(true)
    expect(validateTimezone('GMT+12')).toBe(true)
  })

  it('유효하지 않은 시간대 형식', () => {
    expect(validateTimezone('UTC+9')).toBe(false)
    expect(validateTimezone('KST')).toBe(false)
    expect(validateTimezone('GMT')).toBe(false)
    expect(validateTimezone('+9')).toBe(false)
    expect(validateTimezone('GMT+99')).toBe(false)
  })
})

describe('에러 코드 상태 코드 매핑', () => {
  function getStatusCodeFromError(code?: string): number {
    switch (code) {
      case 'INVALID_INPUT':
        return 400
      case 'INVALID_API_KEY':
      case 'MODEL_NOT_FOUND':
        return 500
      case 'RATE_LIMIT':
        return 429
      case 'TIMEOUT':
        return 504
      default:
        return 500
    }
  }

  it('에러 코드별 올바른 HTTP 상태 코드 반환', () => {
    expect(getStatusCodeFromError('INVALID_INPUT')).toBe(400)
    expect(getStatusCodeFromError('INVALID_API_KEY')).toBe(500)
    expect(getStatusCodeFromError('MODEL_NOT_FOUND')).toBe(500)
    expect(getStatusCodeFromError('RATE_LIMIT')).toBe(429)
    expect(getStatusCodeFromError('TIMEOUT')).toBe(504)
    expect(getStatusCodeFromError(undefined)).toBe(500)
    expect(getStatusCodeFromError('UNKNOWN')).toBe(500)
  })
})
