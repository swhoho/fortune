/**
 * 유저 검색 API
 *
 * GET /api/admin/users?q={검색어}
 */
import { handleUsersSearch } from '@/admin/api/users';

export const GET = handleUsersSearch;
