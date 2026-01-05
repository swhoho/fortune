/**
 * POST /api/profiles/:id/report/question
 * 후속 질문 API (v2.1 - 비동기/폴링 방식)
 * 프로필 리포트 기반 AI 추가 질문 (10 크레딧)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { z } from 'zod';

import { getSupabaseAdmin } from '@/lib/supabase/client';
import { SERVICE_CREDITS } from '@/lib/stripe';
import type { SajuAnalysisResult, SajuPillarsData, QuestionHistoryItem } from '@/lib/ai/types';

/** 요청 스키마 */
const questionSchema = z.object({
  question: z.string().min(1, '질문을 입력해주세요').max(500, '질문은 500자 이내로 입력해주세요'),
});

/**
 * POST /api/profiles/:id/report/question
 * 후속 질문 처리 (비동기 - 즉시 반환)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id: profileId } = await params;
    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 2. 요청 파싱 및 검증
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const validation = questionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.issues[0]?.message || '입력 오류',
          code: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    const { question } = validation.data;

    // 3. 프로필 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '프로필을 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (profile.user_id !== userId) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // 4. 완료된 리포트 조회
    const { data: report, error: reportError } = await supabase
      .from('profile_reports')
      .select('id, pillars, analysis')
      .eq('profile_id', profileId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reportError || !report) {
      return NextResponse.json(
        { error: '완료된 리포트가 없습니다. 먼저 리포트를 생성해주세요.', code: 'NO_REPORT' },
        { status: 404 }
      );
    }

    // 5. 기존 generating 상태 질문 확인 (중복 방지)
    const { data: existingQuestion } = await supabase
      .from('report_questions')
      .select('id, status, question')
      .eq('profile_id', profileId)
      .eq('user_id', userId)
      .eq('question', question)
      .eq('status', 'generating')
      .maybeSingle();

    // 이미 같은 질문이 generating 중이면 기존 ID 반환
    if (existingQuestion) {
      return NextResponse.json({
        success: true,
        message: '이미 처리 중인 질문입니다',
        data: {
          questionId: existingQuestion.id,
          status: 'generating',
          pollUrl: `/api/profiles/${profileId}/report/question/${existingQuestion.id}`,
          creditsUsed: 0,
          remainingCredits: -1,
        },
      });
    }

    // 6. 크레딧 선차감 (원자적 연산으로 경쟁 조건 방지)
    const { data: creditResult, error: creditError } = await supabase.rpc('deduct_credits', {
      p_user_id: userId,
      p_amount: SERVICE_CREDITS.question,
    });

    if (creditError) {
      console.error('[API] 크레딧 차감 RPC 오류:', creditError);
      return NextResponse.json(
        { error: '크레딧 처리 중 오류가 발생했습니다', code: 'CREDIT_ERROR' },
        { status: 500 }
      );
    }

    const deductResult = creditResult?.[0];
    if (!deductResult?.success) {
      if (deductResult?.error_message === 'INSUFFICIENT_CREDITS') {
        return NextResponse.json(
          {
            error: `크레딧이 부족합니다. 필요: ${SERVICE_CREDITS.question}C, 보유: ${deductResult.new_credits}C`,
            code: 'INSUFFICIENT_CREDITS',
            required: SERVICE_CREDITS.question,
            current: deductResult.new_credits,
          },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const newCredits = deductResult.new_credits;

    // 7. 질문 레코드 생성 (status: generating)
    const { data: savedQuestion, error: saveError } = await supabase
      .from('report_questions')
      .insert({
        profile_report_id: report.id,
        profile_id: profileId,
        user_id: userId,
        question,
        answer: null, // 아직 생성 전
        status: 'generating',
        credits_used: SERVICE_CREDITS.question,
      })
      .select('id')
      .single();

    if (saveError || !savedQuestion) {
      console.error('[API] 질문 저장 실패:', saveError);
      // 크레딧 환불
      await supabase.rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: -SERVICE_CREDITS.question,
      });
      return NextResponse.json(
        { error: '질문 저장에 실패했습니다', code: 'SAVE_ERROR' },
        { status: 500 }
      );
    }

    // 8. 이전 질문 히스토리 조회 (최근 5개)
    const { data: prevQuestions } = await supabase
      .from('report_questions')
      .select('question, answer, created_at')
      .eq('profile_report_id', report.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: true })
      .limit(5);

    const questionHistory: QuestionHistoryItem[] = (prevQuestions || []).map((q) => ({
      question: q.question,
      answer: q.answer,
      createdAt: q.created_at,
    }));

    // 9. Python 백엔드에 비동기 작업 위임
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

    try {
      await fetch(`${pythonApiUrl}/api/analysis/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: savedQuestion.id,
          profile_id: profileId,
          user_id: userId,
          report_id: report.id,
          question,
          pillars: report.pillars as SajuPillarsData,
          previous_analysis: report.analysis as SajuAnalysisResult,
          question_history: questionHistory.map((q) => ({
            question: q.question,
            answer: q.answer,
            created_at: q.createdAt,
          })),
          language: 'ko',
        }),
      });
    } catch (pythonError) {
      console.error('[API] Python 백엔드 호출 실패:', pythonError);
      // Python 호출 실패해도 DB에는 저장되어 있으므로 진행
      // (나중에 수동으로 재시도 가능)
    }

    // 10. 크레딧 사용 로그 기록
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -SERVICE_CREDITS.question,
      type: 'question',
      description: `후속 질문 (프로필: ${profileId})`,
      reference_id: savedQuestion.id,
    });

    // 11. 즉시 응답 (폴링 URL 제공)
    return NextResponse.json({
      success: true,
      data: {
        questionId: savedQuestion.id,
        status: 'generating',
        pollUrl: `/api/profiles/${profileId}/report/question/${savedQuestion.id}`,
        creditsUsed: SERVICE_CREDITS.question,
        remainingCredits: newCredits,
      },
    });
  } catch (error) {
    console.error('[API] /api/profiles/:id/report/question 에러:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/profiles/:id/report/question
 * 질문 히스토리 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id: profileId } = await params;
    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 프로필 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 });
    }

    if (profile.user_id !== userId) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
    }

    // 질문 히스토리 조회 (status도 포함)
    const { data: questions, error: questionsError } = await supabase
      .from('report_questions')
      .select('id, question, answer, status, error_message, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (questionsError) {
      console.error('[API] 질문 조회 실패:', questionsError);
      return NextResponse.json({ error: '질문 조회에 실패했습니다' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: questions || [],
    });
  } catch (error) {
    console.error('[API] GET /api/profiles/:id/report/question 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
