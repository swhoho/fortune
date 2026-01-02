/**
 * 사용자 프로필 API
 * GET /api/user/profile - 프로필 조회
 * PATCH /api/user/profile - 프로필 수정
 *
 * 인증된 사용자의 프로필 정보를 관리합니다.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/** 프로필 조회 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
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
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
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
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
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
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body: ProfileUpdateData = await request.json();

    // 유효성 검사
    if (body.preferredLanguage && !['ko', 'en', 'ja', 'zh'].includes(body.preferredLanguage)) {
      return NextResponse.json({ error: '지원하지 않는 언어입니다' }, { status: 400 });
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
      return NextResponse.json({ error: '수정할 데이터가 없습니다' }, { status: 400 });
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
      return NextResponse.json({ error: '프로필 수정에 실패했습니다' }, { status: 500 });
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
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}
