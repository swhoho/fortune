/**
 * /api/profiles/[id]/report API
 * Task 22-23: 리포트 생성 및 조회
 *
 * POST: 리포트 생성 시작 (50C 크레딧 차감)
 * GET: 완료된 리포트 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { SERVICE_CREDITS } from '@/lib/stripe';
import { logAiUsage } from '@/lib/ai/usage-logger';
import { z } from 'zod';

/** 리포트 생성 요청 스키마 */
const generateReportSchema = z.object({
  retryFromStep: z.string().optional(),
});

/**
 * DB personality 데이터를 클라이언트 PersonalitySectionData 형식으로 변환
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformPersonality(personality: any) {
  if (!personality) return null;

  return {
    willpower: {
      score: personality.willpower_analysis?.score || 0,
      description: personality.willpower_analysis?.description || '',
    },
    outerPersonality: {
      label: personality.outer_personality?.impression || '외면',
      summary: personality.outer_personality?.basis || '',
      description: personality.outer_personality?.social_persona || '',
    },
    innerPersonality: {
      label: personality.inner_personality?.true_nature || '내면',
      summary: personality.inner_personality?.basis || '',
      description: personality.inner_personality?.emotional_processing || '',
    },
    socialStyle: {
      label: personality.interpersonal_style?.type || '대인관계',
      summary: personality.interpersonal_style?.strengths?.join(', ') || '',
      description: personality.interpersonal_style?.weaknesses?.join(', ') || '',
    },
  };
}

/**
 * DB basicAnalysis 데이터를 클라이언트 CharacteristicsSectionData 형식으로 변환
 * NOTE: DB에서 basicAnalysis.basic_analysis 중첩 구조로 저장될 수 있음
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformCharacteristics(basicAnalysis: any) {
  if (!basicAnalysis) return null;

  // 중첩 구조 처리: basicAnalysis.basic_analysis가 있으면 사용
  const data = basicAnalysis.basic_analysis || basicAnalysis;

  const paragraphs: string[] = [];

  // 격국 설명
  if (data.structure?.description) {
    paragraphs.push(data.structure.description);
  }

  // 일간 특성
  if (data.day_master?.characteristics) {
    paragraphs.push(data.day_master.characteristics);
  }

  // 용신 분석
  if (data.yongshin_analysis?.reason) {
    paragraphs.push(data.yongshin_analysis.reason);
  }

  return {
    title: data.structure?.type || '사주 특성',
    subtitle: data.day_master?.gan
      ? `${data.day_master.gan}(${data.day_master.element || ''}) 일간`
      : '',
    paragraphs,
  };
}

/**
 * DB aptitude 데이터를 클라이언트 AptitudeSectionData 형식으로 변환
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformAptitude(aptitude: any, scores: any) {
  if (!aptitude) return null;

  // 키워드 추출
  const keywords: string[] = aptitude.analysis_summary?.keywords || [];

  // 주 재능 (첫 번째 talent 사용)
  const firstTalent = aptitude.talents?.[0];
  const mainTalent = {
    label: '주 재능',
    title: firstTalent?.name || '재능 분석',
    content: firstTalent?.description || '',
  };

  // 재능의 상태
  const talentUtil = aptitude.talent_utilization;
  const talentStatus = {
    label: '재능의 상태',
    title: talentUtil
      ? `현재 ${talentUtil.current_level || 0}% → 잠재력 ${talentUtil.potential_level || 0}%`
      : '재능 활용 상태',
    content: talentUtil?.advice || '',
  };

  // 진로선택 (analysis_summary.core_logic 사용)
  const careerChoice = {
    label: '진로선택',
    title: '진로 선택 가이드',
    content: aptitude.analysis_summary?.core_logic || '',
  };

  // 추천직종
  const recommendedJobs: string[] = (aptitude.recommended_fields || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (field: any) => (typeof field === 'string' ? field : field.name || field.field || '')
  );

  // 회피직종 정보도 업무스타일에 포함
  const avoidedFields = (aptitude.avoided_fields || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((field: any) => (typeof field === 'string' ? field : field.name || field.field || ''))
    .filter(Boolean);

  // 업무스타일
  const workStyle = {
    label: '업무스타일',
    title: '나의 업무 스타일',
    content: avoidedFields.length > 0 ? `피해야 할 분야: ${avoidedFields.join(', ')}` : '',
  };

  // 학업스타일 (기본값)
  const studyStyle = {
    label: '학업스타일',
    title: '나의 학습 방식',
    content: aptitude.study_style?.description || '',
  };

  // 일자리 능력 그래프 (scores.work에서 생성)
  // NOTE: calculator.ts 필드명 사용 (drive, execution, completion, management, planning)
  const workScores = scores?.work || {};
  const jobAbilityTraits = [
    { label: '기획/연구', value: workScores.planning || 0 },
    { label: '끈기/정력', value: workScores.drive || 0 }, // perseverance → drive
    { label: '실천/수단', value: workScores.execution || 0 },
    { label: '완성/판매', value: workScores.completion || 0 },
    { label: '관리/평가', value: workScores.management || 0 },
  ];

  return {
    keywords,
    mainTalent,
    talentStatus,
    careerChoice,
    recommendedJobs,
    workStyle,
    studyStyle,
    jobAbilityTraits,
  };
}

/**
 * DB wealth 데이터를 클라이언트 WealthSectionData 형식으로 변환
 * FortuneResult.wealth 구조: { pattern, strengths, risks, advice }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformWealth(wealth: any, scores: any) {
  // 기본값으로 빈 데이터 반환 (null이 아님)
  const defaultWealth = {
    wealthFortune: {
      label: '재물복',
      title: '내안에 존재하는 재물복',
      content: '재물운 분석 데이터가 없습니다.',
    },
  };

  if (!wealth) return defaultWealth;

  // FortuneResult.wealth 구조에서 content 생성
  let content = '';
  if (wealth.pattern) {
    content += `재물 패턴: ${wealth.pattern}\n\n`;
  }
  if (wealth.strengths?.length > 0) {
    content += `강점: ${wealth.strengths.join(', ')}\n\n`;
  }
  if (wealth.risks?.length > 0) {
    content += `주의사항: ${wealth.risks.join(', ')}\n\n`;
  }
  if (wealth.advice) {
    content += wealth.advice;
  }
  // 기존 구조도 지원 (하위 호환)
  if (!content && (wealth.description || wealth.content)) {
    content = wealth.description || wealth.content || '';
  }

  // 재물복 카드
  const wealthFortune = {
    label: wealth.label || '재물복',
    title: wealth.title || wealth.pattern || '내안에 존재하는 재물복',
    content: content || '재물운 분석 데이터가 없습니다.',
  };

  // 이성의 존재 카드 (선택)
  const partnerInfluence = wealth.partner_influence
    ? {
        label: '이성의 존재',
        title: wealth.partner_influence.title || '내안에 있는 이성의 존재형태',
        content: wealth.partner_influence.description || wealth.partner_influence.content || '',
      }
    : undefined;

  // 재물 특성 그래프 (선택, scores에서 생성 가능)
  const wealthTraits = scores?.wealth
    ? Object.entries(scores.wealth).map(([key, value]) => ({
        label: key,
        value: typeof value === 'number' ? value : 0,
      }))
    : undefined;

  return {
    wealthFortune,
    partnerInfluence,
    wealthTraits,
    score: wealth.score,
  };
}

/**
 * DB love 데이터를 클라이언트 RomanceSectionData 형식으로 변환
 * FortuneResult.love 구조: { style, idealPartner, compatibilityPoints, warnings }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRomance(love: any, scores: any) {
  // 기본값으로 빈 데이터 반환 (null이 아님)
  const loveScores = scores?.love || {};

  // NOTE: calculator.ts 필드명 → RomanceSectionData 필드명 매핑
  // love: consideration, humor, emotion, selfEsteem, adventure, sincerity, sociability, finance, trustworthiness, expressiveness
  // aptitude: artistry
  const aptitudeScores = scores?.aptitude || {};
  const defaultRomanceTraits = {
    consideration: loveScores.consideration || 50,
    humor: loveScores.humor || 50,
    artistry: aptitudeScores.artistry || 50, // aptitude에서 가져오기
    vanity: loveScores.selfEsteem || 50, // selfEsteem → vanity (개념 유사)
    adventure: loveScores.adventure || 50,
    sincerity: loveScores.sincerity || 50,
    sociability: loveScores.sociability || 50,
    financial: loveScores.finance || 50, // finance → financial
    reliability: loveScores.trustworthiness || 50, // trustworthiness → reliability
    expression: loveScores.expressiveness || 50, // expressiveness → expression
  };

  const defaultRomance = {
    datingPsychology: {
      label: '연애심리',
      title: '결혼전 연애/데이트 심리',
      content: '연애운 분석 데이터가 없습니다.',
    },
    spouseView: {
      label: '배우자관',
      title: '결혼후 배우자를 보는 눈',
      content: '',
    },
    romanceTraits: defaultRomanceTraits,
  };

  if (!love) return defaultRomance;

  // FortuneResult.love 구조에서 content 생성
  let datingContent = '';
  if (love.style) {
    datingContent += `연애 스타일: ${love.style}\n\n`;
  }
  if (love.idealPartner?.length > 0) {
    datingContent += `이상형: ${love.idealPartner.join(', ')}\n\n`;
  }
  if (love.compatibilityPoints?.length > 0) {
    datingContent += `궁합 포인트: ${love.compatibilityPoints.join(', ')}`;
  }

  let spouseContent = '';
  if (love.warnings?.length > 0) {
    spouseContent = `주의사항: ${love.warnings.join(', ')}`;
  }

  // 연애심리 카드 - FortuneResult.love 구조 사용
  // 기존 구조(dating_psychology)도 하위 호환 지원
  const datingPsychology = {
    label: love.dating_psychology?.label || '연애심리',
    title: love.dating_psychology?.title || love.style || '결혼전 연애/데이트 심리',
    content:
      love.dating_psychology?.description ||
      love.dating_psychology?.content ||
      datingContent ||
      '연애운 분석 데이터가 없습니다.',
  };

  // 배우자관 카드
  const spouseView = {
    label: love.spouse_view?.label || '배우자관',
    title: love.spouse_view?.title || '결혼후 배우자를 보는 눈',
    content: love.spouse_view?.description || love.spouse_view?.content || spouseContent || '',
  };

  // 성격패턴 카드 (선택)
  const personalityPattern = love.personality_pattern
    ? {
        label: love.personality_pattern.label || '성격패턴',
        title: love.personality_pattern.title || '결혼후 성격인 패턴',
        content: love.personality_pattern.description || love.personality_pattern.content || '',
      }
    : undefined;

  // 연애 특성 (scores에서 생성) - defaultRomanceTraits와 동일한 매핑 사용
  const romanceTraits = {
    consideration: loveScores.consideration || 50,
    humor: loveScores.humor || 50,
    artistry: aptitudeScores.artistry || 50,
    vanity: loveScores.selfEsteem || 50,
    adventure: loveScores.adventure || 50,
    sincerity: loveScores.sincerity || 50,
    sociability: loveScores.sociability || 50,
    financial: loveScores.finance || 50,
    reliability: loveScores.trustworthiness || 50,
    expression: loveScores.expressiveness || 50,
  };

  return {
    datingPsychology,
    spouseView,
    personalityPattern,
    romanceTraits,
    score: love.score,
  };
}

/**
 * GET /api/profiles/[id]/report
 * 완료된 리포트 조회
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id: profileId } = await params;
    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 1. 프로필 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 });
    }

    if (profile.user_id !== userId) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
    }

    // 2. 리포트 조회 (profile 정보 JOIN)
    const { data: report, error: reportError } = await supabase
      .from('profile_reports')
      .select(
        `
        *,
        profiles!profile_reports_profile_id_fkey (
          id,
          name,
          birth_date,
          birth_time,
          gender,
          calendar_type
        )
      `
      )
      .eq('profile_id', profileId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reportError) {
      console.error('[API] 리포트 조회 실패:', reportError);
      return NextResponse.json({ error: '리포트 조회에 실패했습니다' }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({ error: '리포트가 없습니다' }, { status: 404 });
    }

    // 3. 클라이언트 ReportData 형식으로 변환
    const profileInfo = report.profiles as {
      id: string;
      name: string;
      birth_date: string;
      birth_time: string | null;
      gender: string;
      calendar_type: string;
    };

    const reportData = {
      // 프로필 정보
      profile: {
        name: profileInfo?.name || '이름 없음',
        birthDate: profileInfo?.birth_date || '',
        birthTime: profileInfo?.birth_time || '',
        gender: profileInfo?.gender || '',
        calendarType: profileInfo?.calendar_type || 'solar',
      },
      // 사주 데이터
      pillars: report.pillars,
      daewun: report.daewun || [],
      jijanggan: report.jijanggan,
      // 분석 결과 (analysis JSONB에서 추출 및 클라이언트 형식 변환)
      personality: transformPersonality(report.analysis?.personality),
      characteristics: transformCharacteristics(report.analysis?.basicAnalysis),
      aptitude: transformAptitude(report.analysis?.aptitude, report.scores),
      wealth: transformWealth(report.analysis?.fortune?.wealth, report.scores),
      romance: transformRomance(report.analysis?.fortune?.love, report.scores), // FortuneResult.love 사용
      // 점수 및 시각화
      scores: report.scores,
      visualizationUrl: report.visualization_url,
      // 메타 정보
      status: report.status,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error('[API] GET /api/profiles/[id]/report 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * POST /api/profiles/[id]/report
 * 리포트 생성 시작 (백그라운드 작업)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { id: profileId } = await params;
    const userId = user.id;
    const supabase = getSupabaseAdmin();

    // 요청 본문 파싱
    let body = {};
    try {
      body = await request.json();
    } catch {
      // 빈 본문 허용
    }

    const validationResult = generateReportSchema.safeParse(body);
    const retryFromStep = validationResult.success
      ? validationResult.data.retryFromStep
      : undefined;

    // 1. 프로필 조회 및 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: '프로필을 찾을 수 없습니다' }, { status: 404 });
    }

    if (profile.user_id !== userId) {
      return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
    }

    // 2. 기존 리포트 확인 (pending, in_progress, failed 모두)
    const { data: existingReport } = await supabase
      .from('profile_reports')
      .select('id, status, credits_used, current_step')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 이미 진행 중인 리포트가 있는 경우 (재시도 요청이 아닐 때)
    if (existingReport?.status === 'in_progress' && !retryFromStep) {
      return NextResponse.json({
        success: true,
        message: '이미 리포트 생성이 진행 중입니다',
        reportId: existingReport.id,
        pollUrl: `/api/profiles/${profileId}/report/status`,
      });
    }

    // 3. 크레딧 무료 재시도 조건 확인
    // - 기존 리포트가 있고 credits_used > 0이면 크레딧 차감 없이 재시도
    // - 재시도 요청(retryFromStep)인 경우도 무료
    const isRetryWithCredits =
      existingReport &&
      existingReport.credits_used > 0 &&
      (existingReport.status === 'failed' || existingReport.status === 'pending');

    const shouldDeductCredits = !retryFromStep && !isRetryWithCredits;

    // 4. 크레딧 확인 및 차감 (신규 생성인 경우에만)
    if (shouldDeductCredits) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다' }, { status: 404 });
      }

      if (user.credits < SERVICE_CREDITS.profileReport) {
        return NextResponse.json(
          {
            error: '크레딧이 부족합니다',
            code: 'INSUFFICIENT_CREDITS',
            required: SERVICE_CREDITS.profileReport,
            current: user.credits,
          },
          { status: 402 }
        );
      }

      // 크레딧 차감
      const newCredits = user.credits - SERVICE_CREDITS.profileReport;
      await supabase
        .from('users')
        .update({
          credits: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    // 5. 리포트 레코드 생성/업데이트
    let reportId: string;

    // 기존 리포트가 있으면 재사용 (failed, pending 상태)
    if (
      existingReport &&
      (existingReport.status === 'failed' || existingReport.status === 'pending')
    ) {
      // 재시도: 기존 레코드 상태 업데이트
      reportId = existingReport.id;
      const startStep = retryFromStep || existingReport.current_step || 'manseryeok';

      await supabase
        .from('profile_reports')
        .update({
          status: 'pending',
          current_step: startStep,
          progress_percent: 0,
          error: null,
          step_statuses: {
            manseryeok: 'pending',
            jijanggan: 'pending',
            basic_analysis: 'pending',
            personality: 'pending',
            aptitude: 'pending',
            fortune: 'pending',
            scoring: 'pending',
            visualization: 'pending',
            saving: 'pending',
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      console.log(`[API] 리포트 재시도 (무료): ${reportId}, 시작 단계: ${startStep}`);
    } else {
      // 신규 생성
      const { data: newReport, error: insertError } = await supabase
        .from('profile_reports')
        .insert({
          profile_id: profileId,
          user_id: userId,
          status: 'pending',
          current_step: 'manseryeok',
          progress_percent: 0,
          step_statuses: {
            manseryeok: 'pending',
            jijanggan: 'pending',
            basic_analysis: 'pending',
            personality: 'pending',
            aptitude: 'pending',
            fortune: 'pending',
            scoring: 'pending',
            visualization: 'pending',
            saving: 'pending',
          },
          credits_used: SERVICE_CREDITS.profileReport,
        })
        .select('id')
        .single();

      if (insertError || !newReport) {
        console.error('[API] 리포트 생성 실패:', insertError);
        return NextResponse.json({ error: '리포트 생성에 실패했습니다' }, { status: 500 });
      }

      reportId = newReport.id;
    }

    // 6. 파이프라인 동기 실행 (Vercel Serverless에서 완료 대기)
    await startPipelineAsync(supabase, reportId, profile, retryFromStep);

    return NextResponse.json({
      success: true,
      message: '리포트 생성이 완료되었습니다',
      reportId,
      pollUrl: `/api/profiles/${profileId}/report/status`,
    });
  } catch (error) {
    console.error('[API] POST /api/profiles/[id]/report 에러:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

/**
 * 파이프라인 동기 실행
 * Vercel Serverless에서 완료까지 대기
 * v2.2: 만세력 재사용 + 단계별 즉시 저장
 */
async function startPipelineAsync(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  reportId: string,
  profile: Record<string, unknown>,
  retryFromStep?: string
) {
  const { createAnalysisPipeline } = await import('@/lib/ai/pipeline');

  // PYTHON_API_URL에 프로토콜 없으면 https:// 자동 추가
  let pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
  if (pythonApiUrl && !pythonApiUrl.startsWith('http://') && !pythonApiUrl.startsWith('https://')) {
    pythonApiUrl = `https://${pythonApiUrl}`;
  }

  try {
    // 1. 기존 리포트에서 pillars 확인 (재시도 시 재사용)
    const { data: existingData } = await supabase
      .from('profile_reports')
      .select('pillars, daewun, jijanggan, analysis')
      .eq('id', reportId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let manseryeokData: { pillars: any; daewun: any };

    // 기존 pillars가 있고 재시도인 경우 재사용 (manseryeok 단계가 아닌 경우)
    if (existingData?.pillars && retryFromStep && retryFromStep !== 'manseryeok') {
      console.log('[Pipeline] 기존 만세력 데이터 재사용');
      manseryeokData = {
        pillars: existingData.pillars,
        daewun: existingData.daewun,
      };
    } else {
      // 만세력 API 호출 (신규 또는 manseryeok 단계 재시도)
      const birthDate = new Date(profile.birth_date as string);
      const birthTime = (profile.birth_time as string) || '12:00';
      const [hour, minute] = birthTime.split(':').map(Number);
      birthDate.setHours(hour || 12, minute || 0, 0, 0);

      console.log('[Pipeline] 만세력 API 호출 시작');
      const manseryeokRes = await fetch(`${pythonApiUrl}/api/manseryeok/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthDatetime: birthDate.toISOString(),
          timezone: 'GMT+9',
          isLunar: profile.calendar_type === 'lunar',
          gender: profile.gender,
        }),
      });

      if (!manseryeokRes.ok) {
        throw new Error('만세력 계산 실패');
      }

      manseryeokData = await manseryeokRes.json();

      // 만세력 계산 직후 DB에 즉시 저장
      await supabase
        .from('profile_reports')
        .update({
          pillars: manseryeokData.pillars,
          daewun: manseryeokData.daewun,
          current_step: 'jijanggan',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      console.log('[Pipeline] 만세력 데이터 DB 저장 완료');
    }

    // 2. 파이프라인 생성 및 실행
    const pipeline = createAnalysisPipeline({
      enableParallel: true,
      retryCount: 1,
      onProgress: async (progress) => {
        // 진행 상태 업데이트
        await supabase
          .from('profile_reports')
          .update({
            status: 'in_progress',
            current_step: progress.currentStep,
            progress_percent: progress.progressPercent,
            step_statuses: progress.stepStatuses,
            estimated_time_remaining: progress.estimatedTimeRemaining,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);
      },
      onStepComplete: async (step, result) => {
        console.log(`[Pipeline] ${step} 완료`);

        // 비-병렬 단계 데이터 저장
        // NOTE: basic_analysis, personality, aptitude, fortune (병렬 단계)은
        // 최종 저장에서 일괄 처리하여 race condition 방지
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (step === 'jijanggan' && result) {
          updateData.jijanggan = result;
        } else if (step === 'scoring' && result) {
          updateData.scores = result;
        } else if (step === 'visualization' && result) {
          updateData.visualization_url = (result as { pillarImage?: string })?.pillarImage;
        }

        // step_statuses 업데이트 (읽기-수정-쓰기, 순차 단계는 race condition 없음)
        const { data: current } = await supabase
          .from('profile_reports')
          .select('step_statuses')
          .eq('id', reportId)
          .single();

        updateData.step_statuses = {
          ...(current?.step_statuses || {}),
          [step]: 'completed',
        };

        await supabase.from('profile_reports').update(updateData).eq('id', reportId);

        console.log(`[Pipeline] ${step} step_statuses 업데이트 완료`);
      },
      onError: async (step, error) => {
        console.error(`[Pipeline] ${step} 실패:`, error);
      },
    });

    // 재시도인 경우 이전 결과 복원 (existingData 재사용)
    // 중요: analysis가 없으면 basic_analysis부터 다시 시작
    let effectiveRetryStep = retryFromStep;

    if (retryFromStep && existingData) {
      const hasAnalysis = existingData.analysis && existingData.analysis.basicAnalysis;

      // analysis가 없는데 saving 이후 단계부터 재시도하려면 basic_analysis부터 시작
      const laterSteps = ['scoring', 'visualization', 'saving', 'complete'];
      if (!hasAnalysis && laterSteps.includes(retryFromStep)) {
        console.log(
          `[Pipeline] analysis 데이터 없음, ${retryFromStep} 대신 basic_analysis부터 재시작`
        );
        effectiveRetryStep = 'basic_analysis';
      }

      pipeline.hydrate(
        {
          manseryeok: {
            pillars: existingData.pillars || manseryeokData.pillars,
            daewun: existingData.daewun || manseryeokData.daewun,
            jijanggan: existingData.jijanggan,
          },
          basicAnalysis: existingData.analysis?.basicAnalysis,
          personality: existingData.analysis?.personality,
          aptitude: existingData.analysis?.aptitude,
          fortune: existingData.analysis?.fortune,
        },
        effectiveRetryStep as import('@/lib/ai/types').PipelineStep
      );
    }

    // 파이프라인 실행
    const result = effectiveRetryStep
      ? await pipeline.executeFromStep(
          {
            pillars: manseryeokData.pillars,
            daewun: manseryeokData.daewun || [],
            language: 'ko',
          },
          effectiveRetryStep as import('@/lib/ai/types').PipelineStep
        )
      : await pipeline.execute({
          pillars: manseryeokData.pillars,
          daewun: manseryeokData.daewun || [],
          language: 'ko',
        });

    // 3. AI 사용량 로깅 (성공/실패 모두 기록)
    const tokenUsage = result.success
      ? result.data?.pipelineMetadata?.tokenUsage
      : result.tokenUsage;

    if (tokenUsage && (tokenUsage.inputTokens > 0 || tokenUsage.outputTokens > 0)) {
      await logAiUsage({
        userId: profile.user_id as string,
        featureType: 'report_generation',
        creditsUsed: result.success ? SERVICE_CREDITS.profileReport : 0, // 실패 시 크레딧 차감 없음
        inputTokens: tokenUsage.inputTokens,
        outputTokens: tokenUsage.outputTokens,
        model: 'gemini-3-pro-preview',
        profileId: profile.id as string,
        reportId,
        metadata: {
          success: result.success,
          failedStep: result.failedStep,
          parallelExecuted: result.data?.pipelineMetadata?.parallelExecuted,
          totalDuration: result.data?.pipelineMetadata?.totalDuration,
        },
      });
    }

    if (!result.success) {
      throw new Error(result.error?.message || '파이프라인 실행 실패');
    }

    // 4. 최종 결과 저장 (finalResult 추가)
    await supabase
      .from('profile_reports')
      .update({
        status: 'completed',
        current_step: null,
        progress_percent: 100,
        estimated_time_remaining: 0,
        analysis: {
          basicAnalysis: result.data?.intermediateResults?.basicAnalysis,
          personality: result.data?.intermediateResults?.personality,
          aptitude: result.data?.intermediateResults?.aptitude,
          fortune: result.data?.intermediateResults?.fortune,
          finalResult: result.data?.finalResult,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    console.log('[Pipeline] 리포트 생성 완료:', reportId);
  } catch (error) {
    console.error('[Pipeline] 리포트 생성 실패:', error);

    // DB에서 현재 단계 가져오기 (정확한 실패 단계 추적)
    const { data: currentReport } = await supabase
      .from('profile_reports')
      .select('current_step')
      .eq('id', reportId)
      .single();

    // 실패한 단계: DB의 current_step 우선, 없으면 에러 객체에서, 그것도 없으면 unknown
    const errorFailedStep = (error as { failedStep?: string })?.failedStep;
    const failedStep = currentReport?.current_step || errorFailedStep || 'unknown';

    console.log(`[Pipeline] 실패 단계: ${failedStep}`);

    // 에러 기록
    await supabase
      .from('profile_reports')
      .update({
        status: 'failed',
        error: {
          step: failedStep,
          message: error instanceof Error ? error.message : '알 수 없는 오류',
          retryable: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);
  }
}

export const dynamic = 'force-dynamic';
