/**
 * POST /api/analysis/save
 * 분석 결과 DB 저장 API
 * Task 16: 후속 질문을 위한 Long-term Memory 저장
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { z } from 'zod';

/** 분석 크레딧 비용 */
const ANALYSIS_CREDIT_COST = 30;

/**
 * 요청 검증 스키마
 */
const saveRequestSchema = z.object({
  // 사주 입력 정보
  sajuInput: z.object({
    birthDate: z.string(), // ISO 문자열
    birthTime: z.string(),
    timezone: z.string(),
    isLunar: z.boolean(),
    gender: z.enum(['male', 'female']),
  }),
  // 만세력 계산 결과
  pillars: z.record(z.string(), z.any()),
  daewun: z.array(z.any()),
  jijanggan: z.record(z.string(), z.any()).optional(),
  // AI 분석 결과
  analysis: z.record(z.string(), z.any()),
  // 시각화 이미지 (Base64)
  pillarImage: z.string().optional(),
  // 추가 정보
  focusArea: z.string().optional(),
  question: z.string().optional(),
});

/**
 * POST /api/analysis/save
 * 분석 결과를 Supabase에 저장
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = getSupabaseAdmin();

    // 2. 요청 본문 파싱 및 검증
    const body = await request.json();
    const validationResult = saveRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: '요청 데이터가 올바르지 않습니다',
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 3. 사용자 크레딧 확인
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('[API] 사용자 조회 실패:', userError);
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    if (user.credits < ANALYSIS_CREDIT_COST) {
      return NextResponse.json(
        {
          error: '크레딧이 부족합니다',
          code: 'INSUFFICIENT_CREDITS',
          required: ANALYSIS_CREDIT_COST,
          current: user.credits,
        },
        { status: 402 }
      );
    }

    // 4. birthDate 문자열을 DateTime으로 변환
    const birthDatetime = new Date(data.sajuInput.birthDate);
    // birthTime을 적용 (HH:mm 형식)
    const timeParts = data.sajuInput.birthTime.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    birthDatetime.setHours(hours, minutes, 0, 0);

    // 5. 분석 결과 저장
    const { data: analysis, error: insertError } = await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        type: 'full',
        birth_datetime: birthDatetime.toISOString(),
        timezone: data.sajuInput.timezone,
        is_lunar: data.sajuInput.isLunar,
        gender: data.sajuInput.gender,
        question: data.question || null,
        focus_area: data.focusArea || null,
        pillars: data.pillars,
        daewun: data.daewun,
        analysis: data.analysis,
        pillar_card_url: data.pillarImage || null, // Base64 직접 저장 (추후 Storage 업로드)
        credits_used: ANALYSIS_CREDIT_COST,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[API] 분석 저장 실패:', insertError);
      return NextResponse.json({ error: '분석 결과 저장에 실패했습니다' }, { status: 500 });
    }

    // 6. 크레딧 차감
    const newCredits = user.credits - ANALYSIS_CREDIT_COST;
    const { error: creditError } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (creditError) {
      console.error('[API] 크레딧 차감 실패:', creditError);
      // 크레딧 차감 실패해도 분석은 저장됨 - 로그만 남김
    }

    // 7. 성공 응답
    console.log('[API] 분석 저장 완료', {
      userId,
      analysisId: analysis.id,
      creditsUsed: ANALYSIS_CREDIT_COST,
      remainingCredits: newCredits,
    });

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      creditsUsed: ANALYSIS_CREDIT_COST,
      remainingCredits: newCredits,
    });
  } catch (error) {
    console.error('[API] /api/analysis/save 에러:', error);
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
