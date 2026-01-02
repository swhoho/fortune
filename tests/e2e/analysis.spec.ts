/**
 * 분석 요청 플로우 E2E 테스트
 * Task 11.1: 분석 요청 플로우 테스트
 */
import { test, expect } from '@playwright/test'

test.describe('분석 요청 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 분석 포커스 페이지 방문
    await page.goto('/ko/analysis/focus')
  })

  test('분석 영역 선택 페이지 로드', async ({ page }) => {
    // 페이지 요소 확인
    await expect(page.getByText(/어떤 분야/)).toBeVisible()
    await expect(page.getByText(/Step 1/)).toBeVisible()

    // 5개 영역 카드 확인
    await expect(page.getByText('💰')).toBeVisible() // wealth
    await expect(page.getByText('❤️')).toBeVisible() // love
    await expect(page.getByText('💼')).toBeVisible() // career
    await expect(page.getByText('🏥')).toBeVisible() // health
    await expect(page.getByText('🌟')).toBeVisible() // overall
  })

  test('재물운 선택', async ({ page }) => {
    // 재물운 카드 클릭
    await page.getByText('재물운').click()

    // 선택 표시 확인
    await expect(page.getByText('선택됨')).toBeVisible()
    await expect(page.getByText(/선택한 분야.*재물운/)).toBeVisible()

    // 다음 버튼 활성화 확인
    const nextButton = page.getByRole('button', { name: /다음/i })
    await expect(nextButton).toBeEnabled()
  })

  test('연애운 선택', async ({ page }) => {
    await page.getByText('연애운').click()
    await expect(page.getByText('선택됨')).toBeVisible()
    await expect(page.getByText(/선택한 분야.*연애운/)).toBeVisible()
  })

  test('종합 분석 선택', async ({ page }) => {
    // 종합 분석 카드 클릭
    await page.getByText('종합 분석').click()

    // 선택 표시 확인
    await expect(page.getByText('선택됨')).toBeVisible()
    await expect(page.getByText(/선택한 분야.*종합 분석/)).toBeVisible()
  })

  test('선택 없이 다음 버튼 비활성화', async ({ page }) => {
    // 다음 버튼 비활성화 확인
    const nextButton = page.getByRole('button', { name: /다음/i })
    await expect(nextButton).toBeDisabled()
  })

  test('분석 영역 선택 후 질문 페이지로 이동', async ({ page }) => {
    // 재물운 선택
    await page.getByText('재물운').click()

    // 다음 버튼 클릭
    await page.getByRole('button', { name: /다음/i }).click()

    // 질문 페이지로 이동 확인
    await expect(page).toHaveURL(/analysis\/question/)
  })
})

test.describe('질문 입력 페이지', () => {
  test.beforeEach(async ({ page }) => {
    // 포커스 선택 후 질문 페이지로 이동
    await page.goto('/ko/analysis/focus')
    await page.getByText('종합 분석').click()
    await page.getByRole('button', { name: /다음/i }).click()
    await expect(page).toHaveURL(/analysis\/question/)
  })

  test('질문 페이지 로드', async ({ page }) => {
    // 페이지 요소 확인
    await expect(page.getByText(/고민|질문/)).toBeVisible()
    await expect(page.getByText(/Step 2/)).toBeVisible()
  })

  test('질문 입력', async ({ page }) => {
    // 텍스트 영역 찾기
    const textarea = page.getByRole('textbox').or(page.locator('textarea'))
    await expect(textarea).toBeVisible()

    // 질문 입력
    const testQuestion = '올해 재물운이 어떨까요? 투자를 해도 될까요?'
    await textarea.fill(testQuestion)

    // 입력값 확인
    await expect(textarea).toHaveValue(testQuestion)
  })

  test('질문 500자 제한 확인', async ({ page }) => {
    const textarea = page.getByRole('textbox').or(page.locator('textarea'))

    // 500자 이상 입력 시도
    const longText = 'a'.repeat(600)
    await textarea.fill(longText)

    // 500자 제한 표시 또는 실제 길이 제한 확인
    const value = await textarea.inputValue()
    expect(value.length).toBeLessThanOrEqual(500)
  })

  test('고민 없음 체크박스', async ({ page }) => {
    // 고민 없음 체크박스 찾기 및 클릭
    const noQuestionCheckbox = page.getByLabel(/고민 없|건너뛰|skip/i).or(
      page.getByRole('checkbox')
    )

    if (await noQuestionCheckbox.isVisible()) {
      await noQuestionCheckbox.check()
      await expect(noQuestionCheckbox).toBeChecked()
    }
  })
})

test.describe('전체 분석 플로우', () => {
  test('포커스 선택 → 질문 입력 → 결제 페이지', async ({ page }) => {
    // Step 1: 분석 영역 선택
    await page.goto('/ko/analysis/focus')
    await page.getByText('종합 분석').click()
    await page.getByRole('button', { name: /다음/i }).click()

    // Step 2: 질문 입력
    await expect(page).toHaveURL(/analysis\/question/)
    const textarea = page.getByRole('textbox').or(page.locator('textarea'))
    if (await textarea.isVisible()) {
      await textarea.fill('2025년 전반적인 운세가 궁금합니다.')
    }

    // 다음 버튼 클릭 (결제로 이동)
    await page.getByRole('button', { name: /다음|결제|분석/i }).click()

    // Step 3: 결제 페이지 확인
    await expect(page).toHaveURL(/payment/)
  })
})
