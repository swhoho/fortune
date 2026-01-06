/**
 * Profile API Routes
 * POST /api/profiles - 프로필 생성
 * GET /api/profiles - 프로필 목록 조회
 *
 * Task 2.2, 2.3
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { createProfileSchema } from '@/lib/validations/profile';
import type { ProfileResponse, ReportStatus } from '@/types/profile';
import {
  AUTH_ERRORS,
  API_ERRORS,
  PROFILE_ERRORS,
  VALIDATION_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';

/**
 * DB 레코드를 API 응답 형식으로 변환 (snake_case → camelCase)
 */
function toProfileResponse(
  record: {
    id: string;
    name: string;
    gender: string;
    birth_date: string;
    birth_time: string | null;
    calendar_type: string;
    created_at: string;
    updated_at: string;
  },
  reportStatus?: ReportStatus
): ProfileResponse {
  return {
    id: record.id,
    name: record.name,
    gender: record.gender as 'male' | 'female',
    birthDate: record.birth_date,
    birthTime: record.birth_time,
    calendarType: record.calendar_type as 'solar' | 'lunar' | 'lunar_leap',
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    reportStatus,
  };
}

/**
 * POST /api/profiles
 * 프로필 생성
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인 (Supabase Auth)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    const userId = user.id;

    // 2. 요청 파싱 및 검증
    const body = await request.json();
    const validation = createProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          ...createErrorResponse(VALIDATION_ERRORS.REQUIRED_FIELD_MISSING),
          details: validation.error.flatten(),
        },
        { status: getStatusCode(VALIDATION_ERRORS.REQUIRED_FIELD_MISSING) }
      );
    }

    const { name, gender, birthDate, birthTime, calendarType } = validation.data;

    // 3. 프로필 생성
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        name,
        gender,
        birth_date: birthDate,
        birth_time: birthTime || null,
        calendar_type: calendarType,
      })
      .select('id, name, gender, birth_date, birth_time, calendar_type, created_at, updated_at')
      .single();

    if (error) {
      console.error('[API] 프로필 생성 실패:', error);
      return NextResponse.json(createErrorResponse(PROFILE_ERRORS.CREATE_FAILED), {
        status: getStatusCode(PROFILE_ERRORS.CREATE_FAILED),
      });
    }

    // 4. 응답
    return NextResponse.json({
      success: true,
      data: toProfileResponse(profile),
    });
  } catch (error) {
    console.error('[API] /api/profiles POST 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

/**
 * GET /api/profiles
 * 프로필 목록 조회 (본인 소유만, 리포트 상태 포함)
 */
export async function GET() {
  try {
    // 1. 인증 확인 (Supabase Auth)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    const supabase = getSupabaseAdmin();

    // 2. 프로필 목록 조회
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, gender, birth_date, birth_time, calendar_type, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] 프로필 목록 조회 실패:', error);
      return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
        status: getStatusCode(API_ERRORS.SERVER_ERROR),
      });
    }

    // 3. 각 프로필의 최신 리포트 상태 조회
    const profileIds = (data || []).map((p) => p.id);
    const { data: reports } = await supabase
      .from('profile_reports')
      .select('profile_id, status')
      .in('profile_id', profileIds)
      .order('created_at', { ascending: false });

    // 프로필별 최신 리포트 상태 매핑 (첫 번째가 최신)
    const reportStatusMap = new Map<string, ReportStatus>();
    if (reports) {
      for (const report of reports) {
        if (!reportStatusMap.has(report.profile_id)) {
          reportStatusMap.set(report.profile_id, report.status as ReportStatus);
        }
      }
    }

    // 4. 응답
    const profiles = (data || []).map((profile) =>
      toProfileResponse(profile, reportStatusMap.get(profile.id) || null)
    );

    return NextResponse.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('[API] /api/profiles GET 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

export const dynamic = 'force-dynamic';
