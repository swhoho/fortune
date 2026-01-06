/**
 * 상담 메시지 API (비동기/폴링 방식)
 * GET: 세션 메시지 조회 (status 포함)
 * POST: 메시지 전송 → 즉시 응답 → Python 백엔드에서 AI 생성
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { AUTH_ERRORS, API_ERRORS, createErrorResponse, getStatusCode } from '@/lib/errors/codes';
import type {
  ConsultationMessageRow,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
} from '@/types/consultation';

// Vercel serverless 캐시 비활성화
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string; sessionId: string }>;
}

/**
 * GET /api/profiles/[id]/consultation/sessions/[sessionId]/messages
 * 세션 메시지 목록 조회 (status 포함)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(AUTH_ERRORS.UNAUTHORIZED) },
        { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) }
      );
    }

    const { id: profileId, sessionId } = await context.params;
    const supabase = createClient();

    // 세션 조회 및 소유권 확인
    const { data: session, error: sessionError } = await supabase
      .from('consultation_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('profile_id', profileId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.NOT_FOUND) },
        { status: getStatusCode(API_ERRORS.NOT_FOUND) }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(AUTH_ERRORS.FORBIDDEN) },
        { status: getStatusCode(AUTH_ERRORS.FORBIDDEN) }
      );
    }

    // 메시지 목록 조회 (status, error_message 포함)
    const { data: messagesData, error: messagesError } = await supabase
      .from('consultation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[ConsultationMessages] 조회 오류:', messagesError);
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.SERVER_ERROR) },
        { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
      );
    }

    const messages = (messagesData || []).map(
      (msg: ConsultationMessageRow & { status?: string; error_message?: string }) => ({
        id: msg.id,
        sessionId: msg.session_id,
        type: msg.message_type,
        content: msg.content,
        questionRound: msg.question_round,
        createdAt: msg.created_at,
        status: msg.status || 'completed',
        errorMessage: msg.error_message,
      })
    );

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
      { success: false, ...createErrorResponse(API_ERRORS.SERVER_ERROR) },
      { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
    );
  }
}

/**
 * POST /api/profiles/[id]/consultation/sessions/[sessionId]/messages
 * 메시지 전송 → 즉시 응답 → 백그라운드에서 AI 생성
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(AUTH_ERRORS.UNAUTHORIZED) },
        { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) }
      );
    }

    const { id: profileId, sessionId } = await context.params;
    const supabase = createClient();
    const body: SendMessageRequest = await request.json();

    // 유효성 검사
    if (!body.content || body.content.trim() === '') {
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.BAD_REQUEST) },
        { status: getStatusCode(API_ERRORS.BAD_REQUEST) }
      );
    }

    if (body.content.length > 500) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.BAD_REQUEST) },
        { status: getStatusCode(API_ERRORS.BAD_REQUEST) }
      );
    }

    // 세션 조회 및 소유권 확인
    const { data: session, error: sessionError } = await supabase
      .from('consultation_sessions')
      .select('*, profile_report_id')
      .eq('id', sessionId)
      .eq('profile_id', profileId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.NOT_FOUND) },
        { status: getStatusCode(API_ERRORS.NOT_FOUND) }
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(AUTH_ERRORS.FORBIDDEN) },
        { status: getStatusCode(AUTH_ERRORS.FORBIDDEN) }
      );
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.BAD_REQUEST) },
        { status: getStatusCode(API_ERRORS.BAD_REQUEST) }
      );
    }

    if (session.question_count >= 5) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.BAD_REQUEST) },
        { status: getStatusCode(API_ERRORS.BAD_REQUEST) }
      );
    }

    const currentRound = session.question_count + 1;
    const isUserClarification = body.messageType === 'user_clarification';
    const skipClarification = body.skipClarification || false;

    // 1. 사용자 메시지 저장
    const { data: userMessage, error: userMsgError } = await supabase
      .from('consultation_messages')
      .insert({
        session_id: sessionId,
        message_type: body.messageType,
        content: body.content,
        question_round: currentRound,
        status: 'completed',
      })
      .select()
      .single();

    if (userMsgError || !userMessage) {
      console.error('[ConsultationMessages] 사용자 메시지 저장 오류:', userMsgError);
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.SERVER_ERROR) },
        { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
      );
    }

    // 2. AI placeholder 메시지 저장 (status: generating)
    const aiResponseType = isUserClarification || skipClarification ? 'ai_answer' : 'ai_answer';
    const { data: aiMessage, error: aiMsgError } = await supabase
      .from('consultation_messages')
      .insert({
        session_id: sessionId,
        message_type: aiResponseType,
        content: '',
        question_round: currentRound,
        status: 'generating',
      })
      .select()
      .single();

    if (aiMsgError || !aiMessage) {
      console.error('[ConsultationMessages] AI placeholder 저장 오류:', aiMsgError);
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.SERVER_ERROR) },
        { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
      );
    }

    // 3. Python 백엔드에 AI 생성 요청 (Railway - 타임아웃 제한 없음)
    const pythonApiUrl = process.env.PYTHON_API_URL;
    if (!pythonApiUrl) {
      console.error('[ConsultationMessages] PYTHON_API_URL 환경변수가 설정되지 않았습니다');
      // Python URL 미설정 시 AI 메시지를 failed로 업데이트
      await supabase
        .from('consultation_messages')
        .update({
          status: 'failed',
          error_message: '서버 구성 오류입니다. 관리자에게 문의해주세요.',
        })
        .eq('id', aiMessage.id);
    } else {
      // 언어 코드 추출 (Accept-Language 헤더 또는 기본값)
      const acceptLanguage = request.headers.get('accept-language') || 'ko';
      const language = acceptLanguage.split(',')[0]?.split('-')[0] || 'ko';

      try {
        await fetch(`${pythonApiUrl}/api/consultation/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message_id: aiMessage.id,
            session_id: sessionId,
            profile_report_id: session.profile_report_id,
            user_content: body.content,
            message_type: body.messageType,
            skip_clarification: skipClarification,
            question_round: currentRound,
            language: language,
          }),
        });
      } catch (err) {
        console.error('[ConsultationMessages] Python 백엔드 호출 실패:', err);
        // Python 호출 실패 시 AI 메시지를 failed로 업데이트
        await supabase
          .from('consultation_messages')
          .update({
            status: 'failed',
            error_message: 'AI 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
          })
          .eq('id', aiMessage.id);
      }
    }

    // 4. 즉시 응답 반환
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
          content: '',
          questionRound: currentRound,
          status: 'generating',
        },
        sessionStatus: session.status as 'active' | 'completed',
        questionCount: session.question_count,
        canAskMore: session.question_count < 5,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[ConsultationMessages] POST 오류:', error);
    return NextResponse.json(
      { success: false, ...createErrorResponse(API_ERRORS.SERVER_ERROR) },
      { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
    );
  }
}
