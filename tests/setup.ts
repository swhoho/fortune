/**
 * Vitest 테스트 환경 설정
 */
import '@testing-library/jest-dom'

// 전역 fetch 모킹이 필요한 경우 여기에 추가
// global.fetch = vi.fn()

// 환경 변수 설정
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret'
