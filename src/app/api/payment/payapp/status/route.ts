/**
 * PayApp 결제 상태 확인 API
 * GET /api/payment/payapp/status?paymentId=xxx&packageId=xxx
 *
 * 콜백이 처리되었는지 DB에서 확인
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPackageById } from '@/lib/portone';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const packageId = searchParams.get('packageId');

    if (!paymentId || !packageId) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 없습니다.' },
        { status: 400 }
      );
    }

    // 패키지 정보 확인
    const pkg = getPackageById(packageId);
    if (!pkg) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 패키지입니다.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 사용자 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // PayApp 결제는 콜백에서 `payapp_${mulNo}` 형태로 저장됨
    // paymentId는 `payapp-timestamp-random` 형태
    // 콜백에서 mulNo로 저장하므로, 사용자의 최근 결제를 확인
    const { data: purchase } = await supabase
      .from('purchases')
      .select('id, credits, created_at, stripe_session_id')
      .eq('user_id', user.id)
      .like('stripe_session_id', 'payapp_%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 최근 5분 이내의 PayApp 결제가 있는지 확인
    if (purchase) {
      const purchaseTime = new Date(purchase.created_at).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (now - purchaseTime < fiveMinutes) {
        return NextResponse.json({
          success: true,
          status: 'completed',
          credits: purchase.credits,
          message: '결제가 완료되었습니다.',
        });
      }
    }

    // 아직 콜백이 처리되지 않음
    return NextResponse.json({
      success: true,
      status: 'pending',
      credits: pkg.credits + (pkg.bonus || 0),
      message: '결제 확인 중입니다. 잠시만 기다려주세요.',
    });
  } catch (error) {
    console.error('PayApp status check error:', error);
    return NextResponse.json(
      { success: false, error: '상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
