/**
 * 온보딩 플로우 E2E 테스트
 * Task 11.1: 온보딩 플로우 테스트
 */
import { test, expect } from '@playwright/test'
import { TEST_SAJU_INPUT } from './fixtures/test-data'

test.describe('온보딩 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 랜딩 페이지 방문 (기본 로케일: ko)
    await page.goto('/')
  })

  test('랜딩 페이지 로드 및 CTA 버튼 클릭', async ({ page }) => {
    // 페이지 로드 확인
    await expect(page).toHaveTitle(/Master's Insight|명리/)

    // CTA 버튼 확인 및 클릭
    const ctaButton = page.getByRole('link', { name: /시작|분석|운세/i })
    await expect(ctaButton).toBeVisible()
    await ctaButton.click()

    // step1으로 이동 확인
    await expect(page).toHaveURL(/onboarding\/step1/)
  })

  test('Step1 스토리텔링 페이지', async ({ page }) => {
    await page.goto('/ko/onboarding/step1')

    // 페이지 요소 확인
    await expect(page.getByText(/Step 1/)).toBeVisible()

    // 다음 버튼 확인
    const nextButton = page.getByRole('button', { name: /다음|계속|시작/i }).or(
      page.getByRole('link', { name: /다음|계속|시작/i })
    )
    await expect(nextButton).toBeVisible()
    await nextButton.click()

    // step2로 이동 확인
    await expect(page).toHaveURL(/onboarding\/step2/)
  })

  test('Step2 생년월일 폼 입력 - 정상 케이스', async ({ page }) => {
    await page.goto('/ko/onboarding/step2')

    // 페이지 로드 확인
    await expect(page.getByText(/사주 정보/)).toBeVisible()

    // 폼 입력
    const { valid } = TEST_SAJU_INPUT

    // 연/월/일 입력
    await page.getByPlaceholder('년 (YYYY)').fill(valid.year)
    await page.getByPlaceholder('월 (MM)').fill(valid.month)
    await page.getByPlaceholder('일 (DD)').fill(valid.day)

    // 시간 입력 (선택)
    await page.getByPlaceholder('시 (HH)').fill(valid.hour)
    await page.getByPlaceholder('분 (MM)').fill(valid.minute)

    // 양력 선택 (기본값)
    await page.getByLabel('양력').check()

    // 성별 선택
    await page.getByLabel('남성').check()

    // 제출
    await page.getByRole('button', { name: /다음/i }).click()

    // step3으로 이동 확인
    await expect(page).toHaveURL(/onboarding\/step3/)
  })

  test('Step2 음력 입력', async ({ page }) => {
    await page.goto('/ko/onboarding/step2')

    const { lunar } = TEST_SAJU_INPUT

    // 연/월/일 입력
    await page.getByPlaceholder('년 (YYYY)').fill(lunar.year)
    await page.getByPlaceholder('월 (MM)').fill(lunar.month)
    await page.getByPlaceholder('일 (DD)').fill(lunar.day)

    // 음력 선택
    await page.getByLabel('음력').check()
    await expect(page.getByLabel('음력')).toBeChecked()

    // 성별 선택
    await page.getByLabel('여성').check()

    // 제출
    await page.getByRole('button', { name: /다음/i }).click()

    // step3으로 이동 확인
    await expect(page).toHaveURL(/onboarding\/step3/)
  })

  test('Step2 유효성 검사 - 필수 필드 누락', async ({ page }) => {
    await page.goto('/ko/onboarding/step2')

    // 빈 폼 제출 시도
    await page.getByRole('button', { name: /다음/i }).click()

    // 에러 메시지 확인
    await expect(page.getByText(/연도|올바른/)).toBeVisible()
    await expect(page.getByText(/성별/)).toBeVisible()

    // 같은 페이지에 머무름
    await expect(page).toHaveURL(/onboarding\/step2/)
  })

  test('Step2 유효성 검사 - 잘못된 날짜', async ({ page }) => {
    await page.goto('/ko/onboarding/step2')

    // 잘못된 날짜 입력 (2월 30일)
    await page.getByPlaceholder('년 (YYYY)').fill('1990')
    await page.getByPlaceholder('월 (MM)').fill('13') // 잘못된 월
    await page.getByPlaceholder('일 (DD)').fill('15')
    await page.getByLabel('남성').check()

    // 제출
    await page.getByRole('button', { name: /다음/i }).click()

    // 에러 메시지 확인
    await expect(page.getByText(/올바른 월/)).toBeVisible()
  })

  test('Step2 시간대 선택', async ({ page }) => {
    await page.goto('/ko/onboarding/step2')

    // 시간대 드롭다운 클릭
    await page.getByRole('combobox').click()

    // 옵션들 확인
    await expect(page.getByText(/한국.*일본|Seoul.*Tokyo/)).toBeVisible()
    await expect(page.getByText(/미국 동부|New York/)).toBeVisible()
    await expect(page.getByText(/미국 서부|Los Angeles/)).toBeVisible()

    // 미국 동부 선택
    await page.getByText(/미국 동부|New York/).click()

    // 선택 확인
    await expect(page.getByRole('combobox')).toContainText(/미국 동부|New York/)
  })

  test('Step3 완료 페이지 확인', async ({ page }) => {
    await page.goto('/ko/onboarding/step3')

    // Step 3 진행 바 확인
    await expect(page.getByText(/Step 3/)).toBeVisible()

    // 분석 시작 버튼 확인
    const startButton = page.getByRole('button', { name: /분석|시작|결제/i }).or(
      page.getByRole('link', { name: /분석|시작|결제/i })
    )
    await expect(startButton).toBeVisible()
  })

  test('전체 온보딩 플로우 (Step1 → Step2 → Step3)', async ({ page }) => {
    // Step 1
    await page.goto('/ko/onboarding/step1')
    await page.getByRole('button', { name: /다음|계속|시작/i }).or(
      page.getByRole('link', { name: /다음|계속|시작/i })
    ).click()

    // Step 2
    await expect(page).toHaveURL(/onboarding\/step2/)

    const { valid } = TEST_SAJU_INPUT
    await page.getByPlaceholder('년 (YYYY)').fill(valid.year)
    await page.getByPlaceholder('월 (MM)').fill(valid.month)
    await page.getByPlaceholder('일 (DD)').fill(valid.day)
    await page.getByLabel('남성').check()
    await page.getByRole('button', { name: /다음/i }).click()

    // Step 3
    await expect(page).toHaveURL(/onboarding\/step3/)
    await expect(page.getByText(/Step 3/)).toBeVisible()
  })
})

test.describe('온보딩 반응형 테스트', () => {
  test('모바일 뷰포트에서 폼 렌더링', async ({ page, isMobile }) => {
    test.skip(!isMobile, '모바일 전용 테스트')

    await page.goto('/ko/onboarding/step2')

    // 모바일에서 폼 요소들이 보이는지 확인
    await expect(page.getByPlaceholder('년 (YYYY)')).toBeVisible()
    await expect(page.getByRole('button', { name: /다음/i })).toBeVisible()
  })
})
