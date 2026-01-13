/**
 * 크레딧 보상 지급 API
 *
 * POST /api/admin/credits
 */
import { handleGrantCredits } from '@/admin/api/credits';

export const POST = handleGrantCredits;
