/**
 * Profile Detail API Routes
 * GET /api/profiles/:id - 프로필 상세 조회
 * PUT /api/profiles/:id - 프로필 수정
 * DELETE /api/profiles/:id - 프로필 삭제
 *
 * Task 2.4, 2.5, 2.6
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { updateProfileSchema } from '@/lib/validations/profile';
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
  };
}

/**
 * GET /api/profiles/:id
 * 프로필 상세 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. 프로필 조회 (소유권 확인 포함)
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, gender, birth_date, birth_time, calendar_type, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: '프로필을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. 응답
    return NextResponse.json({
      success: true,
      data: toProfileResponse(profile),
    });
  } catch (error) {
    console.error('[API] /api/profiles/:id GET 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profiles/:id
 * 프로필 수정
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. 요청 파싱 및 검증
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: '입력 데이터가 올바르지 않습니다',
          code: 'INVALID_INPUT',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // 3. 업데이트 데이터가 있는지 확인
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '수정할 데이터가 없습니다', code: 'NO_UPDATES' },
        { status: 400 }
      );
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
      .eq('user_id', session.user.id)
      .select('id, name, gender, birth_date, birth_time, calendar_type, created_at, updated_at')
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: '프로필을 찾을 수 없거나 수정에 실패했습니다', code: 'UPDATE_ERROR' },
        { status: 404 }
      );
    }

    // 6. 응답
    return NextResponse.json({
      success: true,
      data: toProfileResponse(profile),
    });
  } catch (error) {
    console.error('[API] /api/profiles/:id PUT 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profiles/:id
 * 프로필 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. 프로필 삭제 (소유권 확인 포함)
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select('id')
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: '프로필을 찾을 수 없거나 삭제에 실패했습니다', code: 'DELETE_ERROR' },
        { status: 404 }
      );
    }

    // 3. 응답
    return NextResponse.json({
      success: true,
      message: '프로필이 삭제되었습니다',
    });
  } catch (error) {
    console.error('[API] /api/profiles/:id DELETE 에러:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
