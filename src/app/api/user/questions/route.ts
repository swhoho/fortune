/**
 * GET /api/user/questions
 * 사용자의 전체 질문 히스토리 조회 (v2.0)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/** 질문 조인 결과 타입 */
interface QuestionWithProfile {
  id: string;
  question: string;
  answer: string;
  created_at: string;
  profile_id: string;
  profiles: { name: string }[] | null;
}

/**
 * GET /api/user/questions
 * 모든 프로필의 질문 히스토리 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const userId = session.user.id;
    const supabase = getSupabaseAdmin();

    // 사용자의 모든 질문 조회 (프로필 정보 포함)
    const { data: questions, error } = await supabase
      .from('report_questions')
      .select(`
        id,
        question,
        answer,
        created_at,
        profile_id,
        profiles:profile_id (
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] 질문 조회 실패:', error);
      return NextResponse.json({ error: '질문 조회에 실패했습니다' }, { status: 500 });
    }

    // 응답 형식 정리 (타입 안전하게 캐스팅)
    const questionsData = (questions || []) as QuestionWithProfile[];
    const formattedQuestions = questionsData.map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      createdAt: q.created_at,
      profileId: q.profile_id,
      profileName: q.profiles?.[0]?.name || '알 수 없음',
    }));

    return NextResponse.json({
      success: true,
      data: formattedQuestions,
    });
  } catch (error) {
    console.error('[API] GET /api/user/questions 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
