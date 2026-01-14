/**
 * GET /api/analysis/compatibility/list
 * 사용자의 궁합 분석 목록 조회 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { AUTH_ERRORS, API_ERRORS, createErrorResponse, getStatusCode } from '@/lib/errors/codes';

interface CompatibilityListItem {
  id: string;
  status: string;
  totalScore: number | null;
  createdAt: string;
  analysisType: string;
  profileA: {
    id: string;
    name: string;
  };
  profileB: {
    id: string;
    name: string;
  };
}

/**
 * GET /api/analysis/compatibility/list
 * 사용자의 궁합 분석 목록 조회
 */
export async function GET(_request: NextRequest) {
  try {
    // 1. 인증 확인 (필수)
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
    }

    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 2. 궁합 분석 목록 조회 (최신순, 프로필 정보 포함)
    const { data: analyses, error: analysesError } = await supabase
      .from('compatibility_analyses')
      .select(
        `
        id,
        status,
        total_score,
        created_at,
        analysis_type,
        profile_id_a,
        profile_id_b
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (analysesError) {
      console.error('[API] 궁합 분석 목록 조회 실패:', analysesError);
      return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
        status: getStatusCode(API_ERRORS.SERVER_ERROR),
      });
    }

    // 3. 프로필 ID 목록 추출 (중복 제거)
    const profileIds = new Set<string>();
    analyses?.forEach((a) => {
      if (a.profile_id_a) profileIds.add(a.profile_id_a);
      if (a.profile_id_b) profileIds.add(a.profile_id_b);
    });

    // 4. 프로필 정보 일괄 조회
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', Array.from(profileIds));

    // 프로필 맵 생성
    const profileMap = new Map<string, { id: string; name: string }>();
    profiles?.forEach((p) => {
      profileMap.set(p.id, { id: p.id, name: p.name });
    });

    // 5. 응답 데이터 변환
    const items: CompatibilityListItem[] =
      analyses?.map((a) => ({
        id: a.id,
        status: a.status,
        totalScore: a.total_score,
        createdAt: a.created_at,
        analysisType: a.analysis_type,
        profileA: profileMap.get(a.profile_id_a) || { id: a.profile_id_a, name: '삭제된 프로필' },
        profileB: profileMap.get(a.profile_id_b) || { id: a.profile_id_b, name: '삭제된 프로필' },
      })) || [];

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error('[API] /api/analysis/compatibility/list 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

export const dynamic = 'force-dynamic';
