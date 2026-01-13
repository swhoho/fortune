/**
 * PayApp 정기결제 상태 확인 API
 * POST /api/subscription/payapp/verify
 *
 * success 페이지에서 rebill_no로 구독 상태를 DB에서 확인
 * (PayApp rebillInformation API는 존재하지 않으므로 DB만 조회)
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Service role 클라이언트
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 2. 요청 데이터 파싱
    const body = await request.json();
    const { rebillNo } = body;

    if (!rebillNo) {
      return NextResponse.json(
        { success: false, error: '결제 번호가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('[PayApp Verify] DB 조회 시작:', { rebillNo, userId: user.id });

    // 3. DB에서 구독 조회 (rebill_no로)
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status, user_id, current_period_start, current_period_end')
      .eq('payapp_rebill_no', rebillNo)
      .single();

    if (subscription) {
      // 구독 존재 - 상태에 따라 응답
      console.log('[PayApp Verify] 구독 발견:', {
        subscriptionId: subscription.id,
        status: subscription.status,
      });

      if (subscription.status === 'active') {
        return NextResponse.json({
          success: true,
          status: 'active',
          rebillNo,
          subscriptionId: subscription.id,
          message: '구독이 활성화되어 있습니다.',
        });
      } else if (subscription.status === 'past_due') {
        return NextResponse.json({
          success: true,
          status: 'pending',
          rebillNo,
          message: '결제 확인 중입니다. 잠시만 기다려주세요.',
        });
      } else if (subscription.status === 'canceled') {
        return NextResponse.json({
          success: false,
          status: 'canceled',
          rebillNo,
          error: '해지된 구독입니다.',
        });
      }
    }

    // 4. 구독이 없으면 user_id로 활성 구독 확인 (callback이 다른 rebill_no로 저장했을 수 있음)
    const { data: userSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status, payapp_rebill_no')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (userSubscription) {
      console.log('[PayApp Verify] 사용자의 활성 구독 발견:', userSubscription);
      return NextResponse.json({
        success: true,
        status: 'active',
        rebillNo: userSubscription.payapp_rebill_no || rebillNo,
        subscriptionId: userSubscription.id,
        message: '구독이 활성화되어 있습니다.',
      });
    }

    // 5. 구독 없음 - callback 대기 중
    console.log('[PayApp Verify] 구독 없음, callback 대기 중:', rebillNo);
    return NextResponse.json({
      success: true,
      status: 'pending',
      rebillNo,
      message: '결제 확인 중입니다. 잠시만 기다려주세요.',
    });
  } catch (error) {
    console.error('[PayApp Verify] 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '결제 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
