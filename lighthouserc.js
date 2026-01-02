/**
 * Lighthouse CI 설정
 * Task 11.3: 성능 테스트 (Lighthouse 점수 90+ 목표)
 *
 * 실행: npm run test:lighthouse
 */
module.exports = {
  ci: {
    collect: {
      // 테스트할 URL 목록
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/ko/onboarding/step1',
        'http://localhost:3000/ko/onboarding/step2',
        'http://localhost:3000/ko/analysis/focus',
      ],
      // 각 URL당 실행 횟수 (평균값 사용)
      numberOfRuns: 3,
      // 개발 서버 설정
      startServerCommand: 'npm run build && npm run start',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 60000,
    },
    assert: {
      // 성능 기준 설정
      assertions: {
        // 성능 점수 90점 이상 필수
        'categories:performance': ['error', { minScore: 0.9 }],
        // 접근성 점수 90점 이상 권장
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        // 모범 사례 점수 90점 이상 권장
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        // SEO 점수 90점 이상 권장
        'categories:seo': ['warn', { minScore: 0.9 }],

        // 개별 메트릭 기준
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        interactive: ['warn', { maxNumericValue: 3500 }],
      },
    },
    upload: {
      // 임시 공개 저장소에 업로드 (CI용)
      target: 'temporary-public-storage',
    },
  },
}
