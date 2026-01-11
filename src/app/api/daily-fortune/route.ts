/**
 * GET/POST /api/daily-fortune
 * 오늘의 운세 조회/생성 API
 * 구독자 전용 + 최초 3일 무료체험
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

/** Python API URL */
function getPythonApiUrl(): string {
  let pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
  if (!pythonApiUrl.startsWith('http://') && !pythonApiUrl.startsWith('https://')) {
    pythonApiUrl = `https://${pythonApiUrl}`;
  }
  return pythonApiUrl;
}

/** 무료체험 유효 여부 확인 (3일) */
function isTrialValid(trialStartedAt: string | null): boolean {
  if (!trialStartedAt) return false;
  const trialStart = new Date(trialStartedAt);
  const now = new Date();
  const diffDays = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < 3;
}

/** 무료체험 남은 일수 */
function getTrialRemainingDays(trialStartedAt: string | null): number {
  if (!trialStartedAt) return 0;
  const trialStart = new Date(trialStartedAt);
  const now = new Date();
  const diffDays = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(3 - diffDays));
}

/**
 * GET /api/daily-fortune
 * 오늘의 운세 조회 (캐시 확인)
 */
export async function GET() {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. 사용자 정보 조회 (구독 상태 + 무료체험)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_status, daily_fortune_trial_started_at')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[DailyFortune] 사용자 조회 오류:', userError);
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    const isSubscribed = userData.subscription_status === 'active';
    const isTrialActive = isTrialValid(userData.daily_fortune_trial_started_at);
    const trialRemainingDays = getTrialRemainingDays(userData.daily_fortune_trial_started_at);

    // 3. 접근 권한 확인 (구독자 또는 무료체험 중)
    if (!isSubscribed && !isTrialActive) {
      // 무료체험을 아직 사용하지 않았으면 시작 가능
      const canStartTrial = !userData.daily_fortune_trial_started_at;

      return NextResponse.json({
        success: false,
        requireSubscription: true,
        canStartTrial,
        message: canStartTrial
          ? '3일 무료체험을 시작해보세요!'
          : '무료체험이 종료되었습니다. 구독을 시작해주세요.',
      }, { status: 403 });
    }

    // 4. 대표 프로필 조회
    const { data: primaryProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, gender, birth_date, birth_time, calendar_type')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single();

    if (profileError || !primaryProfile) {
      return NextResponse.json({
        success: false,
        error: 'NO_PRIMARY_PROFILE',
        message: '대표 프로필을 먼저 설정해주세요.',
      }, { status: 400 });
    }

    // 5. 대표 프로필의 사주 리포트 확인
    const { data: report } = await supabase
      .from('profile_reports')
      .select('pillars, daewun')
      .eq('profile_id', primaryProfile.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!report?.pillars) {
      return NextResponse.json({
        success: false,
        error: 'SAJU_REQUIRED',
        message: '기본 사주 분석을 먼저 완료해주세요.',
      }, { status: 400 });
    }

    // 6. 오늘 날짜 운세 캐시 확인
    const today = new Date().toISOString().split('T')[0];
    const { data: cachedFortune } = await supabase
      .from('daily_fortunes')
      .select('*')
      .eq('profile_id', primaryProfile.id)
      .eq('fortune_date', today)
      .single();

    if (cachedFortune) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: cachedFortune,
        profile: {
          id: primaryProfile.id,
          name: primaryProfile.name,
          gender: primaryProfile.gender,
          birthDate: primaryProfile.birth_date,
        },
        subscription: {
          isSubscribed,
          isTrialActive,
          trialRemainingDays,
        },
      });
    }

    // 7. 캐시 없음 - 생성 필요
    return NextResponse.json({
      success: true,
      cached: false,
      data: null,
      needsGeneration: true,
      profile: {
        id: primaryProfile.id,
        name: primaryProfile.name,
        gender: primaryProfile.gender,
        birthDate: primaryProfile.birth_date,
      },
      pillars: report.pillars,
      daewun: report.daewun,
      subscription: {
        isSubscribed,
        isTrialActive,
        trialRemainingDays,
      },
    });
  } catch (error) {
    console.error('[DailyFortune] GET 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * POST /api/daily-fortune
 * 오늘의 운세 생성 (Python 파이프라인 호출)
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. 사용자 정보 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_status, daily_fortune_trial_started_at')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
    }

    const isSubscribed = userData.subscription_status === 'active';
    let isTrialActive = isTrialValid(userData.daily_fortune_trial_started_at);

    // 3. 무료체험 시작 처리 (최초 접근 시)
    if (!isSubscribed && !userData.daily_fortune_trial_started_at) {
      // 무료체험 시작
      await supabase
        .from('users')
        .update({
          daily_fortune_trial_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      isTrialActive = true;
      console.log(`[DailyFortune] 무료체험 시작: user=${user.id}`);
    }

    // 4. 접근 권한 확인
    if (!isSubscribed && !isTrialActive) {
      return NextResponse.json({
        success: false,
        requireSubscription: true,
        message: '무료체험이 종료되었습니다. 구독을 시작해주세요.',
      }, { status: 403 });
    }

    // 5. 요청 본문 파싱
    const body = await request.json();
    const { profileId, pillars, daewun, language = 'ko' } = body;

    if (!profileId || !pillars) {
      return NextResponse.json({ error: '프로필 ID와 사주 정보가 필요합니다' }, { status: 400 });
    }

    // 6. 오늘 날짜 운세 중복 확인
    const today = new Date().toISOString().split('T')[0];
    const { data: existingFortune } = await supabase
      .from('daily_fortunes')
      .select('*')
      .eq('profile_id', profileId)
      .eq('fortune_date', today)
      .single();

    if (existingFortune) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: existingFortune,
        message: '이미 오늘의 운세가 있습니다.',
      });
    }

    // 7. Python API 호출
    const pythonApiUrl = getPythonApiUrl();
    console.log(`[DailyFortune] Python API 호출: ${pythonApiUrl}/api/daily-fortune`);

    const pythonResponse = await fetch(`${pythonApiUrl}/api/daily-fortune`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        profile_id: profileId,
        target_date: today,
        pillars,
        daewun: daewun || [],
        language,
      }),
    });

    if (!pythonResponse.ok) {
      const errorData = await pythonResponse.json().catch(() => ({}));
      console.error('[DailyFortune] Python API 오류:', errorData);
      return NextResponse.json({
        success: false,
        error: errorData.detail || '운세 생성에 실패했습니다',
      }, { status: 500 });
    }

    const pythonResult = await pythonResponse.json();

    // 8. DB에서 저장된 운세 조회 (Python이 이미 저장함)
    const { data: savedFortune } = await supabase
      .from('daily_fortunes')
      .select('*')
      .eq('profile_id', profileId)
      .eq('fortune_date', today)
      .single();

    return NextResponse.json({
      success: true,
      cached: false,
      data: savedFortune,
      message: pythonResult.message || '오늘의 운세가 생성되었습니다.',
    });
  } catch (error) {
    console.error('[DailyFortune] POST 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
