/**
 * POST /api/analysis/:id/question
 * 후속 질문 API
 * Task 16: AI에게 추가 질문 (10 크레딧)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { sajuAnalyzer } from '@/lib/ai/analyzer';
import type { SajuAnalysisResult } from '@/lib/ai/types';
import type { SajuPillarsData, QuestionHistoryItem } from '@/lib/ai/types';

/** 질문당 차감 크레딧 */
const QUESTION_CREDITS = 10;

/** 요청 스키마 */
const questionSchema = z.object({
  question: z.string().min(1, '질문을 입력해주세요').max(500, '질문은 500자 이내로 입력해주세요'),
});

/**
 * POST /api/analysis/:id/question
 * 후속 질문 처리
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const analysisId = params.id;
    const userId = session.user.id;
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

    // 3. 분석 결과 조회 (권한 확인 포함)
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('id, pillars, analysis, user_id')
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (analysisError || !analysis) {
      console.error('[API] 분석 조회 실패:', analysisError);
      return NextResponse.json(
        { error: '분석 결과를 찾을 수 없습니다', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 4. 사용자 크레딧 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('[API] 프로필 조회 실패:', profileError);
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다', code: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (profile.credits < QUESTION_CREDITS) {
      return NextResponse.json(
        {
          error: `크레딧이 부족합니다. 필요: ${QUESTION_CREDITS}C, 보유: ${profile.credits}C`,
          code: 'INSUFFICIENT_CREDITS',
          required: QUESTION_CREDITS,
          current: profile.credits,
        },
        { status: 402 }
      );
    }

    // 5. 이전 질문 히스토리 조회 (최근 5개)
    const { data: prevQuestions } = await supabase
      .from('questions')
      .select('question, answer, created_at')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: true })
      .limit(5);

    const questionHistory: QuestionHistoryItem[] = (prevQuestions || []).map((q) => ({
      question: q.question,
      answer: q.answer,
      createdAt: q.created_at,
    }));

    // 6. AI 후속 질문 실행
    const aiResponse = await sajuAnalyzer.followUp({
      analysisId,
      question,
      previousAnalysis: analysis.analysis as SajuAnalysisResult,
      pillars: analysis.pillars as SajuPillarsData,
      questionHistory,
    });

    if (!aiResponse.success || !aiResponse.data) {
      console.error('[API] AI 후속 질문 실패:', aiResponse.error);
      return NextResponse.json(
        {
          error: aiResponse.error?.message || 'AI 응답 생성에 실패했습니다',
          code: aiResponse.error?.code || 'AI_ERROR',
        },
        { status: 500 }
      );
    }

    // 7. 질문 레코드 저장
    const { data: savedQuestion, error: saveError } = await supabase
      .from('questions')
      .insert({
        analysis_id: analysisId,
        user_id: userId,
        question,
        answer: aiResponse.data.answer,
        credits_used: QUESTION_CREDITS,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('[API] 질문 저장 실패:', saveError);
      return NextResponse.json(
        { error: '질문 저장에 실패했습니다', code: 'SAVE_ERROR' },
        { status: 500 }
      );
    }

    // 8. 크레딧 차감
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - QUESTION_CREDITS })
      .eq('id', userId);

    if (creditError) {
      console.error('[API] 크레딧 차감 실패:', creditError);
      // 크레딧 차감 실패해도 답변은 반환 (로그로 추적)
    }

    // 9. 크레딧 사용 로그 기록
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: -QUESTION_CREDITS,
      type: 'question',
      description: `후속 질문 (분석 ID: ${analysisId})`,
      reference_id: savedQuestion.id,
    });

    // 10. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        questionId: savedQuestion.id,
        answer: aiResponse.data.answer,
        creditsUsed: QUESTION_CREDITS,
        remainingCredits: profile.credits - QUESTION_CREDITS,
      },
    });
  } catch (error) {
    console.error('[API] /api/analysis/:id/question 에러:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
