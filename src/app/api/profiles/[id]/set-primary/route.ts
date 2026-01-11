/**
 * Set Primary Profile API
 * POST /api/profiles/:id/set-primary - 대표 프로필 설정
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import {
  AUTH_ERRORS,
  API_ERRORS,
  PROFILE_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';

/**
 * POST /api/profiles/:id/set-primary
 * 해당 프로필을 대표 프로필로 설정
 * (DB 트리거가 기존 대표 해제 처리)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    const supabase = getSupabaseAdmin();

    // 2. 프로필 소유권 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_primary')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(createErrorResponse(PROFILE_ERRORS.NOT_FOUND), {
        status: getStatusCode(PROFILE_ERRORS.NOT_FOUND),
      });
    }

    // 3. 이미 대표인 경우
    if (profile.is_primary) {
      return NextResponse.json({
        success: true,
        message: '이미 대표 프로필입니다',
        alreadyPrimary: true,
      });
    }

    // 4. 대표 프로필로 설정 (트리거가 기존 대표 해제 처리)
    const { error } = await supabase
      .from('profiles')
      .update({ is_primary: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[API] 대표 프로필 설정 실패:', error);
      return NextResponse.json(createErrorResponse(PROFILE_ERRORS.UPDATE_FAILED), {
        status: getStatusCode(PROFILE_ERRORS.UPDATE_FAILED),
      });
    }

    // 5. 응답
    return NextResponse.json({
      success: true,
      message: '대표 프로필이 변경되었습니다',
    });
  } catch (error) {
    console.error('[API] /api/profiles/:id/set-primary POST 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

export const dynamic = 'force-dynamic';
