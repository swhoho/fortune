import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    test('Public pages should be accessible without login', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Master's Insight|명리/);
    });

    test('Protected pages should redirect to signin', async ({ page }) => {
        await page.goto('/mypage');
        await expect(page).toHaveURL(/\/auth\/signin/);
    });

    test('Sign Up with Email Flow', async ({ page }) => {
        await page.goto('/auth/signup');

        // Check for Google Button
        await expect(page.getByText('Google로 시작하기')).toBeVisible();

        // Fill Sign Up Form
        await page.getByPlaceholder('이름').fill('Test User');
        await page.getByPlaceholder('name@example.com').fill(testEmail);
        await page.getByPlaceholder('비밀번호 (6자 이상)').fill(testPassword);
        await page.getByPlaceholder('비밀번호 확인').fill(testPassword);

        await page.getByRole('button', { name: '가입하기' }).click();

        // Expect success message or redirection
        // Note: The actual behavior depends on whether email confirmation is enabled.
        // If enabled, it might show "Check your email".
        // For this test, we assume we might see a success message or be redirected.
        // Adjust expectation based on current implementation (it redirects to signin with message).
        await expect(page).toHaveURL(/\/auth\/signin/);
        await expect(page.getByText('가입이 완료되었습니다')).toBeVisible();
    });

    test('Sign In with Email Flow', async ({ page }) => {
        // Note: We cannot rely on the user created in the previous test if email confirmation is required.
        // So usually we mock or use a pre-verified user. 
        // For now, let's just test UI logic and failure case if we don't have a verified user.

        await page.goto('/auth/signin');

        // Check for Google Button
        await expect(page.getByText('Google로 계속하기')).toBeVisible();

        // Try Login with non-existent user
        await page.getByPlaceholder('name@example.com').fill('nonexistent@example.com');
        await page.getByPlaceholder('비밀번호').fill('wrongpassword');
        await page.getByRole('button', { name: '로그인' }).click();

        await expect(page.getByText('Invalid login credentials')).toBeVisible();
    });

    test('Google Sign In Redirection', async ({ page }) => {
        await page.goto('/auth/signin');

        // Setup a listener for the popup or navigation
        const popupPromise = page.waitForEvent('popup').catch(() => null); // Handle case where it's a redirect not popup

        await page.getByText('Google로 계속하기').click();

        // Since it's a redirect in current implementation:
        // We expect the URL to change to accounts.google.com or supabase auth url
        await page.waitForURL(/google|supabase/);
    });
});
