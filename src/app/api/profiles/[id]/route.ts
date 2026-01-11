/**
 * Profile Detail API Routes
 * GET /api/profiles/:id - 프로필 상세 조회
 * PUT /api/profiles/:id - 프로필 수정
 * DELETE /api/profiles/:id - 프로필 삭제
 *
 * Task 2.4, 2.5, 2.6
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { updateProfileSchema } from '@/lib/validations/profile';
import {
  AUTH_ERRORS,
  API_ERRORS,
  PROFILE_ERRORS,
  VALIDATION_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';
import type { ProfileResponse } from '@/types/profile';

/**
 * DB 레코드를 API 응답 형식으로 변환 (snake_case → camelCase)
 */
function toProfileResponse(record: {
  id: string;
  name: string;
  gender: string;
  birth_date: string;
  birth_time: string | null;
  calendar_type: string;
  created_at: string;
  updated_at: string;
  is_primary?: boolean;
}): ProfileResponse {
  return {
    id: record.id,
    name: record.name,
    gender: record.gender as 'male' | 'female',
    birthDate: record.birth_date,
    birthTime: record.birth_time,
    calendarType: record.calendar_type as 'solar' | 'lunar' | 'lunar_leap',
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    isPrimary: record.is_primary ?? false,
  };
}

/**
 * GET /api/profiles/:id
 * 프로필 상세 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. 인증 확인 (Supabase Auth)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    // 2. 프로필 조회 (소유권 확인 포함)
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        'id, name, gender, birth_date, birth_time, calendar_type, created_at, updated_at, is_primary'
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json(createErrorResponse(PROFILE_ERRORS.NOT_FOUND), {
        status: getStatusCode(PROFILE_ERRORS.NOT_FOUND),
      });
    }

    // 3. 응답
    return NextResponse.json({
      success: true,
      data: toProfileResponse(profile),
    });
  } catch (error) {
    console.error('[API] /api/profiles/:id GET 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

/**
 * PUT /api/profiles/:id
 * 프로필 수정
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. 인증 확인 (Supabase Auth)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    // 2. 요청 파싱 및 검증
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          ...createErrorResponse(VALIDATION_ERRORS.INVALID_INPUT),
          details: validation.error.flatten(),
        },
        { status: getStatusCode(VALIDATION_ERRORS.INVALID_INPUT) }
      );
    }

    const updates = validation.data;

    // 3. 업데이트 데이터가 있는지 확인
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(createErrorResponse(VALIDATION_ERRORS.NO_UPDATES), {
        status: getStatusCode(VALIDATION_ERRORS.NO_UPDATES),
      });
    }

    // 4. snake_case로 변환
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.birthDate !== undefined) updateData.birth_date = updates.birthDate;
    if (updates.birthTime !== undefined) updateData.birth_time = updates.birthTime;
    if (updates.calendarType !== undefined) updateData.calendar_type = updates.calendarType;
    updateData.updated_at = new Date().toISOString();

    // 5. 프로필 수정 (소유권 확인 포함)
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(
        'id, name, gender, birth_date, birth_time, calendar_type, created_at, updated_at, is_primary'
      )
      .single();

    if (error || !profile) {
      return NextResponse.json(createErrorResponse(PROFILE_ERRORS.UPDATE_FAILED), {
        status: getStatusCode(PROFILE_ERRORS.UPDATE_FAILED),
      });
    }

    // 6. 응답
    return NextResponse.json({
      success: true,
      data: toProfileResponse(profile),
    });
  } catch (error) {
    console.error('[API] /api/profiles/:id PUT 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

/**
 * DELETE /api/profiles/:id
 * 프로필 삭제 (대표 프로필 삭제 시 자동 전환)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 인증 확인 (Supabase Auth)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    const supabase = getSupabaseAdmin();

    // 2. 삭제할 프로필 조회 (대표 여부 확인)
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('id, is_primary')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!targetProfile) {
      return NextResponse.json(createErrorResponse(PROFILE_ERRORS.NOT_FOUND), {
        status: getStatusCode(PROFILE_ERRORS.NOT_FOUND),
      });
    }

    // 3. 대표 프로필 삭제 시 다음 프로필을 대표로 설정
    if (targetProfile.is_primary) {
      const { data: nextPrimary } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .neq('id', id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (nextPrimary) {
        await supabase.from('profiles').update({ is_primary: true }).eq('id', nextPrimary.id);
      }
    }

    // 4. 프로필 삭제
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .single();

    if (error || !data) {
      return NextResponse.json(createErrorResponse(PROFILE_ERRORS.DELETE_FAILED), {
        status: getStatusCode(PROFILE_ERRORS.DELETE_FAILED),
      });
    }

    // 5. 응답
    return NextResponse.json({
      success: true,
      message: '프로필이 삭제되었습니다',
    });
  } catch (error) {
    console.error('[API] /api/profiles/:id DELETE 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

export const dynamic = 'force-dynamic';
