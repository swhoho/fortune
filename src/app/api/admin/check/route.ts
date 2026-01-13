/**
 * 관리자 권한 확인 API
 *
 * GET /api/admin/check
 */
import { handleAdminCheck } from '@/admin/api/check';

export const GET = handleAdminCheck;
