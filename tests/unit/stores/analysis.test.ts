/**
 * Analysis Store 단위 테스트
 * Task 11.2: Zustand 스토어 테스트
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis Store', () => {
  // 각 테스트 전 스토어 리셋
  beforeEach(() => {
    useAnalysisStore.getState().reset()
  })

  describe('초기 상태', () => {
    it('초기 상태가 올바르게 설정됨', () => {
      const state = useAnalysisStore.getState()

      expect(state.currentStep).toBe('info')
      expect(state.sajuInput).toBeNull()
      expect(state.focusArea).toBeNull()
      expect(state.question).toBe('')
      expect(state.isLoading).toBe(false)
      expect(state.loadingStep).toBeNull()
      expect(state.analysisResult).toBeNull()
      expect(state.error).toBeNull()
    })
  })

  describe('setStep', () => {
    it('단계를 변경할 수 있음', () => {
      const { setStep } = useAnalysisStore.getState()

      setStep('focus')
      expect(useAnalysisStore.getState().currentStep).toBe('focus')

      setStep('question')
      expect(useAnalysisStore.getState().currentStep).toBe('question')

      setStep('payment')
      expect(useAnalysisStore.getState().currentStep).toBe('payment')

      setStep('processing')
      expect(useAnalysisStore.getState().currentStep).toBe('processing')

      setStep('result')
      expect(useAnalysisStore.getState().currentStep).toBe('result')
    })
  })

  describe('setSajuInput', () => {
    it('사주 입력 데이터를 저장할 수 있음', () => {
      const { setSajuInput } = useAnalysisStore.getState()

      const testInput = {
        birthDate: new Date('1990-05-15'),
        birthTime: '14:30',
        timezone: 'GMT+9',
        isLunar: false,
        gender: 'male' as const,
      }

      setSajuInput(testInput)

      const state = useAnalysisStore.getState()
      expect(state.sajuInput).toEqual(testInput)
      expect(state.sajuInput?.birthDate.getFullYear()).toBe(1990)
      expect(state.sajuInput?.gender).toBe('male')
    })
  })

  describe('setFocusArea', () => {
    it('분석 영역을 설정할 수 있음', () => {
      const { setFocusArea } = useAnalysisStore.getState()

      setFocusArea('wealth')
      expect(useAnalysisStore.getState().focusArea).toBe('wealth')

      setFocusArea('love')
      expect(useAnalysisStore.getState().focusArea).toBe('love')

      setFocusArea('career')
      expect(useAnalysisStore.getState().focusArea).toBe('career')

      setFocusArea('health')
      expect(useAnalysisStore.getState().focusArea).toBe('health')

      setFocusArea('overall')
      expect(useAnalysisStore.getState().focusArea).toBe('overall')
    })
  })

  describe('setQuestion', () => {
    it('질문을 저장할 수 있음', () => {
      const { setQuestion } = useAnalysisStore.getState()

      const testQuestion = '2025년 재물운이 어떨까요?'
      setQuestion(testQuestion)

      expect(useAnalysisStore.getState().question).toBe(testQuestion)
    })

    it('빈 문자열로 초기화할 수 있음', () => {
      const { setQuestion } = useAnalysisStore.getState()

      setQuestion('테스트 질문')
      setQuestion('')

      expect(useAnalysisStore.getState().question).toBe('')
    })
  })

  describe('setLoading', () => {
    it('로딩 상태를 설정할 수 있음', () => {
      const { setLoading } = useAnalysisStore.getState()

      setLoading(true, 'manseryeok')
      const state1 = useAnalysisStore.getState()
      expect(state1.isLoading).toBe(true)
      expect(state1.loadingStep).toBe('manseryeok')

      setLoading(true, 'ai_analysis')
      const state2 = useAnalysisStore.getState()
      expect(state2.loadingStep).toBe('ai_analysis')

      setLoading(false)
      const state3 = useAnalysisStore.getState()
      expect(state3.isLoading).toBe(false)
      expect(state3.loadingStep).toBeNull()
    })
  })

  describe('setError', () => {
    it('에러를 설정하면 로딩 상태가 false가 됨', () => {
      const { setLoading, setError } = useAnalysisStore.getState()

      setLoading(true, 'manseryeok')
      setError('API 호출 실패')

      const state = useAnalysisStore.getState()
      expect(state.error).toBe('API 호출 실패')
      expect(state.isLoading).toBe(false)
    })

    it('에러를 null로 초기화할 수 있음', () => {
      const { setError } = useAnalysisStore.getState()

      setError('테스트 에러')
      setError(null)

      expect(useAnalysisStore.getState().error).toBeNull()
    })
  })

  describe('setAnalysisResult', () => {
    it('분석 결과를 저장할 수 있음', () => {
      const { setAnalysisResult } = useAnalysisStore.getState()

      const mockResult = {
        summary: '테스트 요약',
        personality: {
          title: '성격 분석',
          content: '성격 내용',
          keywords: ['키워드1', '키워드2'],
        },
        wealth: {
          title: '재물운',
          content: '재물운 내용',
          score: 80,
          advice: '조언',
        },
        love: {
          title: '연애운',
          content: '연애운 내용',
          score: 75,
          advice: '조언',
        },
        career: {
          title: '직업운',
          content: '직업운 내용',
          score: 85,
          advice: '조언',
        },
        health: {
          title: '건강운',
          content: '건강운 내용',
          score: 70,
          advice: '조언',
        },
        yearly_flow: [],
        classical_references: [],
      }

      setAnalysisResult(mockResult)

      const state = useAnalysisStore.getState()
      expect(state.analysisResult).toEqual(mockResult)
      expect(state.analysisResult?.summary).toBe('테스트 요약')
    })
  })

  describe('setPillarImage', () => {
    it('명반 이미지를 저장할 수 있음', () => {
      const { setPillarImage } = useAnalysisStore.getState()

      const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...'
      setPillarImage(mockBase64)

      expect(useAnalysisStore.getState().pillarImage).toBe(mockBase64)
    })
  })

  describe('setPillarsData', () => {
    it('사주 팔자 데이터를 저장할 수 있음', () => {
      const { setPillarsData } = useAnalysisStore.getState()

      const mockPillars = {
        year: { stem: '庚', branch: '午', element: '金' },
        month: { stem: '辛', branch: '巳', element: '金' },
        day: { stem: '壬', branch: '申', element: '水' },
        hour: { stem: '丁', branch: '未', element: '火' },
      }

      const mockDaewun = [
        { age: 1, stem: '壬', branch: '午', startYear: 1991 },
        { age: 11, stem: '癸', branch: '未', startYear: 2001 },
      ]

      const mockJijanggan = {
        year: ['己', '丁'],
        month: ['戊', '庚', '丙'],
        day: ['戊', '庚', '壬'],
        hour: ['己', '丁', '乙'],
      }

      setPillarsData(mockPillars, mockDaewun, mockJijanggan)

      const state = useAnalysisStore.getState()
      expect(state.pillarsData).toEqual(mockPillars)
      expect(state.daewunData).toEqual(mockDaewun)
      expect(state.jijangganData).toEqual(mockJijanggan)
    })
  })

  describe('reset', () => {
    it('모든 상태를 초기화함', () => {
      const store = useAnalysisStore.getState()

      // 상태 변경
      store.setStep('result')
      store.setSajuInput({
        birthDate: new Date(),
        birthTime: '12:00',
        timezone: 'GMT+9',
        isLunar: false,
        gender: 'male',
      })
      store.setFocusArea('wealth')
      store.setQuestion('테스트 질문')
      store.setLoading(true, 'ai_analysis')
      store.setError('테스트 에러')

      // 리셋
      store.reset()

      const state = useAnalysisStore.getState()
      expect(state.currentStep).toBe('info')
      expect(state.sajuInput).toBeNull()
      expect(state.focusArea).toBeNull()
      expect(state.question).toBe('')
      expect(state.isLoading).toBe(false)
      expect(state.loadingStep).toBeNull()
      expect(state.error).toBeNull()
    })
  })

  describe('resetAnalysis', () => {
    it('분석 관련 상태만 초기화함', () => {
      const store = useAnalysisStore.getState()

      // 온보딩 상태 설정
      store.setStep('result')
      store.setSajuInput({
        birthDate: new Date(),
        birthTime: '12:00',
        timezone: 'GMT+9',
        isLunar: false,
        gender: 'male',
      })
      store.setFocusArea('wealth')

      // 분석 상태 설정
      store.setLoading(true, 'ai_analysis')
      store.setPillarImage('test-image')
      store.setError('테스트 에러')

      // 분석 상태만 리셋
      store.resetAnalysis()

      const state = useAnalysisStore.getState()
      // 온보딩 상태는 유지
      expect(state.currentStep).toBe('result')
      expect(state.sajuInput).not.toBeNull()
      expect(state.focusArea).toBe('wealth')

      // 분석 상태는 초기화
      expect(state.isLoading).toBe(false)
      expect(state.loadingStep).toBeNull()
      expect(state.analysisResult).toBeNull()
      expect(state.pillarImage).toBeNull()
      expect(state.error).toBeNull()
    })
  })
})
