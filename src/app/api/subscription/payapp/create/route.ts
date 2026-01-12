/**
 * PayApp 정기결제 요청 생성 API
 * POST /api/subscription/payapp/create
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPayAppRebill, calculateRebillExpireDate, SUBSCRIPTION_PLAN } from '@/lib/payapp';

export async function POST(request: Request) {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 2. 요청 데이터 파싱
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: '휴대폰 번호가 필요합니다.' },
        { status: 400 }
      );
    }

    // 3. 기존 활성 구독 확인
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: '이미 활성 구독이 있습니다.' },
        { status: 400 }
      );
    }

    // 4. PayApp 정기결제 요청 생성
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const today = new Date();
    const payDay = today.getDate(); // 오늘 날짜를 결제일로 설정

    const result = await createPayAppRebill({
      goodname: SUBSCRIPTION_PLAN.name,
      goodprice: SUBSCRIPTION_PLAN.price,
      recvphone: phoneNumber.replace(/[^0-9]/g, ''),
      rebillCycleType: 'Month',
      rebillCycleMonth: payDay > 28 ? 28 : payDay, // 28일 초과 시 28일로 설정
      rebillExpire: calculateRebillExpireDate(),
      feedbackurl: `${appUrl}/api/subscription/payapp/callback`,
      returnurl: `${appUrl}/ko/daily-fortune/subscribe/success`,
      userId: user.id,
    });

    // 5. 응답 확인
    if (result.state !== '1' || !result.payurl) {
      console.error('PayApp rebill request failed:', result);
      return NextResponse.json(
        {
          success: false,
          error: result.errorMessage || '정기결제 요청 생성에 실패했습니다.',
          errno: result.errno,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payUrl: result.payurl,
      rebillNo: result.rebill_no,
    });
  } catch (error) {
    console.error('PayApp rebill create error:', error);
    return NextResponse.json(
      { success: false, error: '정기결제 요청 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
