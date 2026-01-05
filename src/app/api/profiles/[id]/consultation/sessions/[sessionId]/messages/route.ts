/**
 * 상담 메시지 API
 * GET: 세션 메시지 조회
 * POST: 메시지 전송 (질문 → AI 응답)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { consultationAI } from '@/lib/ai/consultation';
import type {
  ConsultationMessageRow,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
} from '@/types/consultation';
import type { ReportDaewunItem } from '@/types/report';
import type { PillarsHanja } from '@/types/saju';

interface RouteContext {
  params: Promise<{ id: string; sessionId: string }>;
}

/**
 * GET /api/profiles/[id]/consultation/sessions/[sessionId]/messages
 * 세션 메시지 목록 조회
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id: profileId, sessionId } = await context.params;
    const supabase = createClient();

    // 2. 세션 조회 및 소유권 확인
    const { data: session, error: sessionError } = await supabase
      .from('consultation_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('profile_id', profileId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: '세션을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 });
    }

    // 3. 메시지 목록 조회
    const { data: messagesData, error: messagesError } = await supabase
      .from('consultation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[ConsultationMessages] 조회 오류:', messagesError);
      return NextResponse.json(
        { success: false, error: '메시지를 불러올 수 없습니다' },
        { status: 500 }
      );
    }

    const messages = (messagesData || []).map((msg: ConsultationMessageRow) => ({
      id: msg.id,
      sessionId: msg.session_id,
      type: msg.message_type,
      content: msg.content,
      questionRound: msg.question_round,
      createdAt: msg.created_at,
    }));

    const response: GetMessagesResponse = {
      success: true,
      data: {
        session: {
          id: session.id,
          title: session.title,
          status: session.status,
          questionCount: session.question_count,
          maxQuestions: 5,
        },
        messages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[ConsultationMessages] GET 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profiles/[id]/consultation/sessions/[sessionId]/messages
 * 메시지 전송 (질문 → AI 응답)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id: profileId, sessionId } = await context.params;
    const supabase = createClient();

    // 2. 요청 본문 파싱
    const body: SendMessageRequest = await request.json();

    if (!body.content || body.content.trim() === '') {
      return NextResponse.json({ success: false, error: '메시지를 입력해주세요' }, { status: 400 });
    }

    if (body.content.length > 500) {
      return NextResponse.json(
        { success: false, error: '메시지는 500자 이내로 입력해주세요' },
        { status: 400 }
      );
    }

    // 3. 세션 조회 및 소유권 확인
    const { data: session, error: sessionError } = await supabase
      .from('consultation_sessions')
      .select('*, profile_report_id')
      .eq('id', sessionId)
      .eq('profile_id', profileId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: '세션을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ success: false, error: '권한이 없습니다' }, { status: 403 });
    }

    // 4. 세션 상태 확인
    if (session.status === 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: '이 세션은 완료되었습니다. 새 상담을 시작해주세요.',
          code: 'SESSION_COMPLETED',
        },
        { status: 400 }
      );
    }

    if (session.question_count >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: '이 세션의 질문 한도(5개)에 도달했습니다.',
          code: 'QUESTION_LIMIT',
        },
        { status: 400 }
      );
    }

    // 5. 리포트 데이터 조회 (사주, 대운 정보)
    const { data: report, error: reportError } = await supabase
      .from('profile_reports')
      .select('pillars, daewun, analysis')
      .eq('id', session.profile_report_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { success: false, error: '사주 분석 데이터를 불러올 수 없습니다' },
        { status: 500 }
      );
    }

    // 6. 이전 메시지 조회 (세션 히스토리)
    const { data: previousMessages } = await supabase
      .from('consultation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // 세션 히스토리 구성 (질문-답변 쌍)
    const sessionHistory: Array<{ question: string; answer: string }> = [];
    let currentQuestion: string | null = null;

    for (const msg of previousMessages || []) {
      if (msg.message_type === 'user_question') {
        currentQuestion = msg.content;
      } else if (msg.message_type === 'ai_answer' && currentQuestion) {
        sessionHistory.push({ question: currentQuestion, answer: msg.content });
        currentQuestion = null;
      }
    }

    // 7. 메시지 처리 분기
    const isUserQuestion = body.messageType === 'user_question';
    const isUserClarification = body.messageType === 'user_clarification';
    const skipClarification = body.skipClarification || false;

    // 현재 질문 라운드 계산
    const currentRound = session.question_count + 1;

    // 8. 사용자 메시지 저장
    const { data: userMessage, error: userMsgError } = await supabase
      .from('consultation_messages')
      .insert({
        session_id: sessionId,
        message_type: body.messageType,
        content: body.content,
        question_round: currentRound,
      })
      .select()
      .single();

    if (userMsgError || !userMessage) {
      console.error('[ConsultationMessages] 사용자 메시지 저장 오류:', userMsgError);
      return NextResponse.json(
        { success: false, error: '메시지 저장 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 9. AI 응답 생성
    let aiResponseType: 'ai_clarification' | 'ai_answer';
    let aiContent: string;
    let clarificationQuestions: string[] | undefined;

    // 마지막 clarification 메시지 찾기
    const lastClarification = (previousMessages || [])
      .filter((m) => m.message_type === 'ai_clarification')
      .pop();

    if (isUserQuestion && !skipClarification && !lastClarification) {
      // 첫 질문: 추가 정보 요청 생성
      const clarificationResult = await consultationAI.generateClarification(body.content);

      if (!clarificationResult.success || !clarificationResult.data) {
        // clarification 실패 시 바로 답변 생성으로 전환
        console.warn('[ConsultationMessages] Clarification 실패, 바로 답변 생성');
        aiResponseType = 'ai_answer';

        const answerResult = await consultationAI.generateAnswer({
          question: body.content,
          pillars: report.pillars as PillarsHanja,
          daewun: (report.daewun || []) as ReportDaewunItem[],
          analysisSummary: report.analysis?.summary,
          sessionHistory,
        });

        if (!answerResult.success || !answerResult.data) {
          console.error('[ConsultationMessages] AI 응답 생성 실패:', answerResult.error);
          return NextResponse.json(
            {
              success: false,
              error: answerResult.error?.message || 'AI 상담 응답 생성에 실패했습니다',
              code: answerResult.error?.code,
            },
            { status: 500 }
          );
        }

        aiContent = answerResult.data.answer;
      } else if (
        clarificationResult.data.needsClarification &&
        clarificationResult.data.clarificationQuestions.length > 0
      ) {
        // 추가 정보 필요
        aiResponseType = 'ai_clarification';
        clarificationQuestions = clarificationResult.data.clarificationQuestions;
        aiContent = `더 정확한 상담을 위해 몇 가지 여쭤볼게요:\n\n${clarificationQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
      } else if (!clarificationResult.data.isValidQuestion) {
        // 유효하지 않은 질문
        aiResponseType = 'ai_answer';
        aiContent =
          clarificationResult.data.invalidReason ||
          '죄송합니다. 사주 상담과 관련된 질문을 부탁드립니다.';
      } else {
        // 충분히 구체적인 질문: 바로 답변 생성
        aiResponseType = 'ai_answer';

        const answerResult = await consultationAI.generateAnswer({
          question: body.content,
          pillars: report.pillars as PillarsHanja,
          daewun: (report.daewun || []) as ReportDaewunItem[],
          analysisSummary: report.analysis?.summary,
          sessionHistory,
        });

        if (!answerResult.success || !answerResult.data) {
          console.error('[ConsultationMessages] AI 응답 생성 실패 (구체적 질문):', answerResult.error);
          return NextResponse.json(
            {
              success: false,
              error: answerResult.error?.message || 'AI 상담 응답 생성에 실패했습니다',
              code: answerResult.error?.code,
            },
            { status: 500 }
          );
        }

        aiContent = answerResult.data.answer;
      }
    } else {
      // 추가 정보 응답 또는 건너뛰기: 최종 답변 생성
      aiResponseType = 'ai_answer';

      // 원래 질문 찾기
      const originalQuestion =
        (previousMessages || [])
          .filter((m) => m.message_type === 'user_question' && m.question_round === currentRound)
          .pop()?.content || body.content;

      const answerResult = await consultationAI.generateAnswer({
        question: originalQuestion,
        pillars: report.pillars as PillarsHanja,
        daewun: (report.daewun || []) as ReportDaewunItem[],
        analysisSummary: report.analysis?.summary,
        sessionHistory,
        clarificationResponse: isUserClarification ? body.content : undefined,
      });

      if (!answerResult.success || !answerResult.data) {
        console.error('[ConsultationMessages] AI 최종 응답 생성 실패:', answerResult.error);
        return NextResponse.json(
          {
            success: false,
            error: answerResult.error?.message || 'AI 상담 응답 생성에 실패했습니다',
            code: answerResult.error?.code,
          },
          { status: 500 }
        );
      }

      aiContent = answerResult.data.answer;
    }

    // 10. AI 응답 저장
    const { data: aiMessage, error: aiMsgError } = await supabase
      .from('consultation_messages')
      .insert({
        session_id: sessionId,
        message_type: aiResponseType,
        content: aiContent,
        question_round: currentRound,
      })
      .select()
      .single();

    if (aiMsgError || !aiMessage) {
      console.error('[ConsultationMessages] AI 메시지 저장 오류:', aiMsgError);
      return NextResponse.json(
        { success: false, error: 'AI 응답 저장 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    // 11. 최종 답변인 경우 세션 업데이트
    let newQuestionCount = session.question_count;
    let newStatus = session.status;

    if (aiResponseType === 'ai_answer') {
      newQuestionCount = session.question_count + 1;
      newStatus = newQuestionCount >= 5 ? 'completed' : 'active';

      // 첫 답변이면 세션 제목 업데이트
      const shouldUpdateTitle = session.question_count === 0 && !session.title?.includes('상담');

      const updateData: Record<string, unknown> = {
        question_count: newQuestionCount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (shouldUpdateTitle) {
        // 첫 질문 기반 제목 생성 (30자 제한)
        const originalQuestion =
          (previousMessages || []).filter((m) => m.message_type === 'user_question').pop()
            ?.content || body.content;
        updateData.title =
          originalQuestion.slice(0, 30) + (originalQuestion.length > 30 ? '...' : '');
      }

      await supabase.from('consultation_sessions').update(updateData).eq('id', sessionId);
    }

    // 12. 응답 반환
    const response: SendMessageResponse = {
      success: true,
      data: {
        userMessage: {
          id: userMessage.id,
          content: userMessage.content,
          createdAt: userMessage.created_at,
        },
        aiResponse: {
          id: aiMessage.id,
          type: aiResponseType,
          content: aiContent,
          questionRound: currentRound,
          clarificationQuestions,
        },
        sessionStatus: newStatus as 'active' | 'completed',
        questionCount: newQuestionCount,
        canAskMore: newQuestionCount < 5,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[ConsultationMessages] POST 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
