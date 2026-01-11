/**
 * 상담 세션 API
 * GET: 세션 목록 조회
 * POST: 새 세션 생성 (크레딧 10C 차감, FIFO)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { SERVICE_CREDITS } from '@/lib/stripe';
import { deductCredits, refundCredits } from '@/lib/credits';
import {
  AUTH_ERRORS,
  API_ERRORS,
  PROFILE_ERRORS,
  CREDIT_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';
import type {
  ConsultationSessionRow,
  GetSessionsResponse,
  CreateSessionResponse,
} from '@/types/consultation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/profiles/[id]/consultation/sessions
 * 프로필의 상담 세션 목록 조회
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(AUTH_ERRORS.UNAUTHORIZED) },
        { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) }
      );
    }

    const { id: profileId } = await context.params;
    const supabase = createClient();

    // 2. 프로필 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(PROFILE_ERRORS.NOT_FOUND) },
        { status: getStatusCode(PROFILE_ERRORS.NOT_FOUND) }
      );
    }

    if (profile.user_id !== user.id) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(AUTH_ERRORS.FORBIDDEN) },
        { status: getStatusCode(AUTH_ERRORS.FORBIDDEN) }
      );
    }

    // 3. 세션 목록 조회 (최신순)
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('consultation_sessions')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('[ConsultationSessions] 조회 오류:', sessionsError);
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.SERVER_ERROR) },
        { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
      );
    }

    // 4. 각 세션의 마지막 메시지 조회
    const sessions = await Promise.all(
      (sessionsData || []).map(async (session: ConsultationSessionRow) => {
        // 마지막 메시지 조회
        const { data: lastMessageData } = await supabase
          .from('consultation_messages')
          .select('content')
          .eq('session_id', session.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: session.id,
          profileId: session.profile_id,
          title: session.title,
          status: session.status as 'active' | 'completed',
          questionCount: session.question_count,
          creditsUsed: session.credits_used,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
          lastMessage: lastMessageData?.content?.slice(0, 50) || undefined,
        };
      })
    );

    const response: GetSessionsResponse = {
      success: true,
      data: { sessions },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[ConsultationSessions] GET 오류:', error);
    return NextResponse.json(
      { success: false, ...createErrorResponse(API_ERRORS.SERVER_ERROR) },
      { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
    );
  }
}

/**
 * POST /api/profiles/[id]/consultation/sessions
 * 새 상담 세션 생성 (크레딧 10C 차감)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(AUTH_ERRORS.UNAUTHORIZED) },
        { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) }
      );
    }

    const { id: profileId } = await context.params;
    const supabase = createClient();

    // 2. 요청 본문 파싱
    let body: { title?: string } = {};
    try {
      body = await request.json();
    } catch {
      // 빈 본문 허용
    }

    // 3. 프로필 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, name')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(PROFILE_ERRORS.NOT_FOUND) },
        { status: getStatusCode(PROFILE_ERRORS.NOT_FOUND) }
      );
    }

    if (profile.user_id !== user.id) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(AUTH_ERRORS.FORBIDDEN) },
        { status: getStatusCode(AUTH_ERRORS.FORBIDDEN) }
      );
    }

    // 4. 완료된 리포트 확인
    const { data: report, error: reportError } = await supabase
      .from('profile_reports')
      .select('id')
      .eq('profile_id', profileId)
      .eq('status', 'completed')
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { success: false, error: '완료된 사주 분석 리포트가 필요합니다', code: 'NO_REPORT' },
        { status: 400 }
      );
    }

    // 5. 크레딧 확인 및 차감 (FIFO)
    const supabaseAdmin = getSupabaseAdmin();
    const creditsRequired = SERVICE_CREDITS.question; // 10C

    const deductResult = await deductCredits({
      userId: user.id,
      amount: creditsRequired,
      serviceType: 'consultation',
      description: '상담 세션 생성',
      supabase: supabaseAdmin,
    });

    if (!deductResult.success) {
      if (deductResult.error === 'INSUFFICIENT_CREDITS') {
        return NextResponse.json(
          { success: false, ...createErrorResponse(CREDIT_ERRORS.INSUFFICIENT) },
          { status: getStatusCode(CREDIT_ERRORS.INSUFFICIENT) }
        );
      }
      console.error('[ConsultationSessions] 크레딧 차감 오류:', deductResult.error);
      return NextResponse.json(
        { success: false, ...createErrorResponse(CREDIT_ERRORS.DEDUCTION_FAILED) },
        { status: getStatusCode(CREDIT_ERRORS.DEDUCTION_FAILED) }
      );
    }

    // 7. 세션 생성
    const sessionTitle = body.title || `${profile.name}님과의 상담`;

    const { data: newSession, error: createError } = await supabase
      .from('consultation_sessions')
      .insert({
        profile_id: profileId,
        user_id: user.id,
        profile_report_id: report.id,
        title: sessionTitle,
        status: 'active',
        question_count: 0,
        credits_used: creditsRequired,
      })
      .select()
      .single();

    if (createError || !newSession) {
      // 세션 생성 실패 시 크레딧 환불
      await refundCredits({
        userId: user.id,
        amount: creditsRequired,
        serviceType: 'consultation',
        description: '세션 생성 실패 환불',
        supabase: supabaseAdmin,
      });

      console.error('[ConsultationSessions] 세션 생성 오류:', createError);
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.SERVER_ERROR) },
        { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
      );
    }

    const response: CreateSessionResponse = {
      success: true,
      data: {
        sessionId: newSession.id,
        title: newSession.title,
        creditsUsed: creditsRequired,
        remainingCredits: deductResult.newCredits,
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[ConsultationSessions] POST 오류:', error);
    return NextResponse.json(
      { success: false, ...createErrorResponse(API_ERRORS.SERVER_ERROR) },
      { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
    );
  }
}
