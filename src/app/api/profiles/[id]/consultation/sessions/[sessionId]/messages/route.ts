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
import { CONSULTATION_CONSTANTS } from '@/types/consultation';

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
      (msg: ConsultationMessageRow & { status?: string; error_message?: string }) => {
        // Stale 메시지 감지: 1분 이상 generating 상태
        const isStale =
          msg.status === 'generating' &&
          msg.created_at &&
          new Date().getTime() - new Date(msg.created_at).getTime() > 60000;

        // Stale 메시지 자동 실패 처리 (비동기 DB 업데이트)
        if (isStale) {
          supabase
            .from('consultation_messages')
            .update({
              status: 'failed',
              error_message: '응답 생성 시간이 초과되었습니다. 다시 시도해주세요.',
            })
            .eq('id', msg.id)
            .then(() => console.log(`[ConsultationMessages] Stale 메시지 처리: ${msg.id}`));
        }

        return {
          id: msg.id,
          sessionId: msg.session_id,
          type: msg.message_type,
          content: msg.content,
          questionRound: msg.question_round,
          createdAt: msg.created_at,
          status: isStale ? 'failed' : msg.status || 'completed',
          errorMessage: isStale
            ? '응답 생성 시간이 초과되었습니다. 다시 시도해주세요.'
            : msg.error_message,
          clarificationRound: msg.clarification_round || 0,
        };
      }
    );

    const response: GetMessagesResponse = {
      success: true,
      data: {
        session: {
          id: session.id,
          title: session.title,
          status: session.status,
          questionCount: session.question_count,
          maxQuestions: CONSULTATION_CONSTANTS.MAX_QUESTIONS_PER_SESSION,
          clarificationCount: session.clarification_count || 0,
          maxClarifications:
            session.max_clarifications || CONSULTATION_CONSTANTS.MAX_CLARIFICATIONS,
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

    if (session.question_count >= CONSULTATION_CONSTANTS.MAX_QUESTIONS_PER_SESSION) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.BAD_REQUEST) },
        { status: getStatusCode(API_ERRORS.BAD_REQUEST) }
      );
    }

    const currentRound = session.question_count + 1;
    const isUserClarification = body.messageType === 'user_clarification';
    const skipClarification = body.skipClarification || false;
    const currentClarificationCount = session.clarification_count || 0;
    const maxClarifications =
      session.max_clarifications || CONSULTATION_CONSTANTS.MAX_CLARIFICATIONS;

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

    // 3. 프로필 정보 조회 (질문자 이름 전달용)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', profileId)
      .single();

    // 4. Python 백엔드에 AI 생성 요청 (Railway - 타임아웃 제한 없음)
    // URL 프로토콜 자동 추가 (리포트 시스템과 동일한 패턴)
    let pythonApiUrl = process.env.PYTHON_API_URL || '';
    if (
      pythonApiUrl &&
      !pythonApiUrl.startsWith('http://') &&
      !pythonApiUrl.startsWith('https://')
    ) {
      pythonApiUrl = `https://${pythonApiUrl}`;
    }
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
            profile_id: profileId,
            profile_name: profile?.name || '사용자',
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
          clarificationRound: isUserClarification ? currentClarificationCount + 1 : 0,
        },
        sessionStatus: session.status as 'active' | 'completed',
        questionCount: session.question_count,
        canAskMore: session.question_count < CONSULTATION_CONSTANTS.MAX_QUESTIONS_PER_SESSION,
        clarificationRound: isUserClarification ? currentClarificationCount + 1 : 0,
        maxClarifications: maxClarifications,
        isLastClarification:
          isUserClarification && currentClarificationCount + 1 >= maxClarifications,
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

/**
 * PATCH /api/profiles/[id]/consultation/sessions/[sessionId]/messages
 * 실패한 AI 메시지 재생성 (크레딧 차감 없음)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.BAD_REQUEST) },
        { status: getStatusCode(API_ERRORS.BAD_REQUEST) }
      );
    }

    // 1. 메시지 조회 및 검증
    const { data: aiMessage, error: msgError } = await supabase
      .from('consultation_messages')
      .select('*, consultation_sessions!inner(user_id, profile_report_id)')
      .eq('id', messageId)
      .eq('session_id', sessionId)
      .single();

    if (msgError || !aiMessage) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(API_ERRORS.NOT_FOUND) },
        { status: getStatusCode(API_ERRORS.NOT_FOUND) }
      );
    }

    // 소유권 확인
    if (aiMessage.consultation_sessions.user_id !== user.id) {
      return NextResponse.json(
        { success: false, ...createErrorResponse(AUTH_ERRORS.FORBIDDEN) },
        { status: getStatusCode(AUTH_ERRORS.FORBIDDEN) }
      );
    }

    // failed 상태만 재생성 가능
    if (aiMessage.status !== 'failed') {
      return NextResponse.json(
        { success: false, error: '실패한 메시지만 재생성할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 2. 이전 사용자 질문 찾기 (같은 question_round)
    const { data: userQuestion } = await supabase
      .from('consultation_messages')
      .select('content, message_type')
      .eq('session_id', sessionId)
      .eq('question_round', aiMessage.question_round)
      .in('message_type', ['user_question', 'user_clarification'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!userQuestion) {
      return NextResponse.json(
        { success: false, error: '원본 질문을 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    // 3. AI 메시지 상태를 generating으로 리셋
    await supabase
      .from('consultation_messages')
      .update({
        status: 'generating',
        content: '',
        error_message: null,
      })
      .eq('id', messageId);

    // 4. 프로필 정보 조회 (질문자 이름 전달용)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', profileId)
      .single();

    // 5. Python 백엔드에 재생성 요청
    let pythonApiUrl = process.env.PYTHON_API_URL || '';
    if (
      pythonApiUrl &&
      !pythonApiUrl.startsWith('http://') &&
      !pythonApiUrl.startsWith('https://')
    ) {
      pythonApiUrl = `https://${pythonApiUrl}`;
    }

    const acceptLanguage = request.headers.get('accept-language') || 'ko';
    const language = acceptLanguage.split(',')[0]?.split('-')[0] || 'ko';

    if (pythonApiUrl) {
      try {
        await fetch(`${pythonApiUrl}/api/consultation/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message_id: messageId,
            session_id: sessionId,
            profile_report_id: aiMessage.consultation_sessions.profile_report_id,
            user_content: userQuestion.content,
            message_type: userQuestion.message_type,
            skip_clarification: true,
            question_round: aiMessage.question_round,
            language: language,
            profile_id: profileId,
            profile_name: profile?.name || '사용자',
          }),
        });
        console.log(`[ConsultationMessages] 재생성 요청 전송: ${messageId}`);
      } catch (err) {
        console.error('[ConsultationMessages] 재생성 Python 호출 실패:', err);
        await supabase
          .from('consultation_messages')
          .update({
            status: 'failed',
            error_message: 'AI 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
          })
          .eq('id', messageId);
      }
    } else {
      await supabase
        .from('consultation_messages')
        .update({
          status: 'failed',
          error_message: '서버 구성 오류입니다. 관리자에게 문의해주세요.',
        })
        .eq('id', messageId);
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        status: 'generating',
      },
    });
  } catch (error) {
    console.error('[ConsultationMessages] PATCH 오류:', error);
    return NextResponse.json(
      { success: false, ...createErrorResponse(API_ERRORS.SERVER_ERROR) },
      { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
    );
  }
}
