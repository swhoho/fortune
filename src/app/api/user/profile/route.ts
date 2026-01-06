/**
 * 사용자 프로필 API
 * GET /api/user/profile - 프로필 조회
 * PATCH /api/user/profile - 프로필 수정
 *
 * 인증된 사용자의 프로필 정보를 관리합니다.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import {
  AUTH_ERRORS,
  API_ERRORS,
  PROFILE_ERRORS,
  VALIDATION_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';

/** 프로필 조회 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      const error = createErrorResponse(AUTH_ERRORS.UNAUTHORIZED);
      return NextResponse.json(error, { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) });
    }

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
      .from('users')
      .select(
        'id, email, name, credits, created_at, email_notifications_enabled, yearly_reminder_enabled, preferred_language'
      )
      .eq('id', user.id)
      .single();

    if (error || !data) {
      console.error('사용자 조회 실패:', error);
      const errorResponse = createErrorResponse(PROFILE_ERRORS.NOT_FOUND);
      return NextResponse.json(errorResponse, { status: getStatusCode(PROFILE_ERRORS.NOT_FOUND) });
    }

    return NextResponse.json({
      id: data.id,
      email: data.email,
      name: data.name,
      credits: data.credits,
      createdAt: data.created_at,
      emailNotificationsEnabled: data.email_notifications_enabled ?? true,
      yearlyReminderEnabled: data.yearly_reminder_enabled ?? true,
      preferredLanguage: data.preferred_language ?? 'ko',
    });
  } catch (error) {
    console.error('프로필 조회 오류:', error);
    const errorResponse = createErrorResponse(API_ERRORS.SERVER_ERROR);
    return NextResponse.json(errorResponse, { status: getStatusCode(API_ERRORS.SERVER_ERROR) });
  }
}

/** 프로필 수정 가능한 필드 */
interface ProfileUpdateData {
  name?: string;
  emailNotificationsEnabled?: boolean;
  yearlyReminderEnabled?: boolean;
  preferredLanguage?: string;
}

/** 프로필 수정 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      const error = createErrorResponse(AUTH_ERRORS.UNAUTHORIZED);
      return NextResponse.json(error, { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) });
    }

    const body: ProfileUpdateData = await request.json();

    // 유효성 검사
    if (body.preferredLanguage && !['ko', 'en', 'ja', 'zh'].includes(body.preferredLanguage)) {
      const error = createErrorResponse(VALIDATION_ERRORS.INVALID_INPUT);
      return NextResponse.json(error, { status: getStatusCode(VALIDATION_ERRORS.INVALID_INPUT) });
    }

    // Supabase 업데이트 데이터 구성 (snake_case로 변환)
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.emailNotificationsEnabled !== undefined)
      updateData.email_notifications_enabled = body.emailNotificationsEnabled;
    if (body.yearlyReminderEnabled !== undefined)
      updateData.yearly_reminder_enabled = body.yearlyReminderEnabled;
    if (body.preferredLanguage !== undefined)
      updateData.preferred_language = body.preferredLanguage;

    if (Object.keys(updateData).length === 0) {
      const error = createErrorResponse(VALIDATION_ERRORS.NO_UPDATES);
      return NextResponse.json(error, { status: getStatusCode(VALIDATION_ERRORS.NO_UPDATES) });
    }

    const adminClient = getSupabaseAdmin();
    const { data, error } = await adminClient
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select(
        'id, email, name, credits, created_at, email_notifications_enabled, yearly_reminder_enabled, preferred_language'
      )
      .single();

    if (error) {
      console.error('프로필 수정 실패:', error);
      const errorResponse = createErrorResponse(PROFILE_ERRORS.UPDATE_FAILED);
      return NextResponse.json(errorResponse, {
        status: getStatusCode(PROFILE_ERRORS.UPDATE_FAILED),
      });
    }

    return NextResponse.json({
      id: data.id,
      email: data.email,
      name: data.name,
      credits: data.credits,
      createdAt: data.created_at,
      emailNotificationsEnabled: data.email_notifications_enabled ?? true,
      yearlyReminderEnabled: data.yearly_reminder_enabled ?? true,
      preferredLanguage: data.preferred_language ?? 'ko',
    });
  } catch (error) {
    console.error('프로필 수정 오류:', error);
    const errorResponse = createErrorResponse(API_ERRORS.SERVER_ERROR);
    return NextResponse.json(errorResponse, { status: getStatusCode(API_ERRORS.SERVER_ERROR) });
  }
}
