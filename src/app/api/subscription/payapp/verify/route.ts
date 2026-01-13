/**
 * PayApp 정기결제 상태 확인 및 구독 활성화 API
 * POST /api/subscription/payapp/verify
 *
 * success 페이지에서 rebill_no로 결제 상태를 확인하고
 * 결제가 완료되었으면 구독 레코드 생성
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getPayAppRebillInfo, SUBSCRIPTION_PLAN } from '@/lib/payapp';
import { addCredits } from '@/lib/credits/add';

// Service role 클라이언트 (구독 생성용)
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

    console.log('[PayApp Verify] 조회 시작:', { rebillNo, userId: user.id });

    // 3. 이미 처리된 구독인지 확인
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status')
      .eq('payapp_rebill_no', rebillNo)
      .single();

    if (existingSubscription) {
      console.log('[PayApp Verify] 이미 존재하는 구독:', existingSubscription);
      return NextResponse.json({
        success: true,
        status: existingSubscription.status,
        rebillNo,
        message: '이미 처리된 결제입니다.',
      });
    }

    // 4. PayApp API로 정기결제 상태 조회
    const rebillInfo = await getPayAppRebillInfo(rebillNo);
    console.log('[PayApp Verify] PayApp 응답:', rebillInfo);

    if (rebillInfo.state !== '1') {
      return NextResponse.json({
        success: false,
        error: rebillInfo.errorMessage || '결제 정보 조회에 실패했습니다.',
        rebillNo,
      });
    }

    // 5. userId 검증 (var1에 저장된 userId와 현재 사용자 일치 확인)
    if (rebillInfo.var1 && rebillInfo.var1 !== user.id) {
      console.error('[PayApp Verify] userId 불일치:', { expected: user.id, received: rebillInfo.var1 });
      return NextResponse.json({
        success: false,
        error: '결제 정보가 일치하지 않습니다.',
        rebillNo,
      }, { status: 403 });
    }

    // 6. rebill_state 확인
    // rebill_state: 1=대기, 4=진행중(결제 완료), 8=해지
    const rebillState = rebillInfo.rebill_state;

    if (rebillState === '4') {
      // 결제 진행중 (카드 등록 및 결제 완료)
      // 구독 레코드 생성
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: user.id,
          status: 'active',
          price: SUBSCRIPTION_PLAN.price,
          payapp_rebill_no: rebillNo,
          payapp_recvphone: rebillInfo.recvphone || '',
          payment_method: 'payapp',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .select('id')
        .single();

      if (subError) {
        console.error('[PayApp Verify] 구독 생성 실패:', subError);
        return NextResponse.json({
          success: false,
          error: '구독 생성에 실패했습니다.',
          rebillNo,
        }, { status: 500 });
      }

      // users 테이블 업데이트
      await supabaseAdmin
        .from('users')
        .update({
          subscription_status: 'active',
          subscription_id: subscription.id,
        })
        .eq('id', user.id);

      // 크레딧 지급
      await addCredits({
        userId: user.id,
        amount: SUBSCRIPTION_PLAN.credits,
        type: 'subscription',
        subscriptionId: subscription.id,
        description: `${SUBSCRIPTION_PLAN.name} 최초 크레딧`,
        supabase: supabaseAdmin,
      });

      console.log('[PayApp Verify] 구독 활성화 완료:', {
        userId: user.id,
        rebillNo,
        subscriptionId: subscription.id,
        credits: SUBSCRIPTION_PLAN.credits,
      });

      return NextResponse.json({
        success: true,
        status: 'active',
        rebillNo,
        subscriptionId: subscription.id,
        message: '구독이 성공적으로 활성화되었습니다.',
      });
    } else if (rebillState === '1') {
      // 대기 상태 (카드 등록만 완료, 결제 미완료)
      return NextResponse.json({
        success: true,
        status: 'pending',
        rebillNo,
        message: '결제 대기 중입니다. 잠시 후 다시 확인해주세요.',
      });
    } else if (rebillState === '8') {
      // 해지됨
      return NextResponse.json({
        success: false,
        status: 'canceled',
        rebillNo,
        error: '해지된 결제입니다.',
      });
    } else {
      // 알 수 없는 상태
      return NextResponse.json({
        success: false,
        rebillNo,
        rebillState,
        error: `알 수 없는 결제 상태입니다: ${rebillState}`,
      });
    }
  } catch (error) {
    console.error('[PayApp Verify] 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '결제 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
