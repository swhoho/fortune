/**
 * 유저 상세 조회 API
 *
 * GET /api/admin/users/[id]?tab={tab}&page={page}&limit={limit}
 */
import { NextRequest, NextResponse } from 'next/server';
import { handleUserDetail } from '@/admin/api/user-detail';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  return handleUserDetail(request, id);
}
