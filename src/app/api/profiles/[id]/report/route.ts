/**
 * /api/profiles/[id]/report API
 * Task 22-23: 리포트 생성 및 조회
 *
 * POST: 리포트 생성 시작 (70C 크레딧 차감)
 * GET: 완료된 리포트 조회
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { SERVICE_CREDITS } from '@/lib/stripe';
import { PIPELINE_STEPS } from '@/lib/ai/pipeline/types';
import type { PipelineStep, StepStatus } from '@/lib/ai/types';
import { z } from 'zod';
import {
  AUTH_ERRORS,
  API_ERRORS,
  PROFILE_ERRORS,
  CREDIT_ERRORS,
  createErrorResponse,
  getStatusCode,
} from '@/lib/errors/codes';
import { normalizeKeys } from '@/lib/utils/normalize-keys';

/**
 * 재시도 시 단계 상태 생성
 * retryFromStep 이전 단계는 completed, 이후는 pending
 */
function getRetryStepStatuses(retryFromStep: string): Record<PipelineStep, StepStatus> {
  const statuses = {} as Record<PipelineStep, StepStatus>;
  const retryIndex = PIPELINE_STEPS.indexOf(retryFromStep as PipelineStep);

  PIPELINE_STEPS.forEach((step, index) => {
    if (index < retryIndex) {
      statuses[step] = 'completed'; // 이전 단계는 완료 상태 유지
    } else {
      statuses[step] = 'pending';
    }
  });

  return statuses;
}

/** 리포트 생성 요청 스키마 */
const generateReportSchema = z.object({
  retryFromStep: z.string().optional(),
});

/**
 * DB daewun 데이터를 클라이언트 ReportDaewunItem 형식으로 변환
 * 기본값 없음 - AI 분석 결과만 사용 (summary 없으면 빈 문자열)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformDaewun(daewunList: any[]) {
  if (!daewunList || !Array.isArray(daewunList)) return [];

  return daewunList.map((dw) => ({
    age: dw.age || 0,
    endAge: dw.endAge || dw.age + 9,
    stem: dw.stem || '',
    branch: dw.branch || '',
    startYear: dw.startYear || 0,
    startDate: dw.startDate || `${dw.startYear || 0}-01-01`,
    tenGod: dw.tenGod || '알수없음',
    tenGodType: dw.tenGodType || '알수없음',
    favorablePercent: dw.favorablePercent ?? 50,
    unfavorablePercent: dw.unfavorablePercent ?? 50,
    // AI 분석 결과 (기본값 없음 - 빈 문자열이면 프론트엔드에서 처리)
    scoreReasoning: dw.scoreReasoning || '',
    summary: dw.summary || '',
    description: dw.description || dw.summary || '',
  }));
}

/**
 * DB personality 데이터를 클라이언트 PersonalitySectionData 형식으로 변환
 *
 * 유연한 키 구조 지원 (Gemini 응답 변동 대응):
 * - willpower / willpower_analysis / 의지력
 * - outerPersonality / outer_personality / 겉성격
 * - innerPersonality / inner_personality / 속성격
 * - socialStyle / interpersonal_style / 대인관계_스타일
 * - 문자열 또는 객체 형태 모두 지원
 *
 * @param personality AI 분석 결과
 * @param calculatedWillpower 십신 기반 계산된 의지력 점수 (scores.willpower)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformPersonality(personality: any, calculatedWillpower?: number) {
  if (!personality) return null;

  // 1. 한글/snake_case 키를 camelCase로 정규화
  const normalized = normalizeKeys(personality);
  const data = normalized.outerPersonality ? normalized : normalized.성격분석 || normalized;

  // 의지력: 계산된 점수 우선 사용, 없으면 AI 응답 사용
  const willpowerData = data.willpower || {};
  const willpower = {
    score: calculatedWillpower ?? willpowerData.score ?? 50,
    description: willpowerData.description || '',
  };

  // 겉성격 (정규화 후 camelCase만 조회)
  const outerRaw = data.outerPersonality;
  let outerPersonality;
  if (typeof outerRaw === 'string') {
    outerPersonality = { label: '외면', summary: '', description: outerRaw };
  } else if (outerRaw && typeof outerRaw === 'object') {
    outerPersonality = {
      label: outerRaw.impression || outerRaw.type || '외면',
      summary: outerRaw.basis || outerRaw.traits || '',
      description: outerRaw.socialPersona || outerRaw.description || '',
    };
  } else {
    outerPersonality = { label: '외면', summary: '', description: '' };
  }

  // 속성격 (정규화 후 camelCase만 조회)
  const innerRaw = data.innerPersonality;
  let innerPersonality;
  if (typeof innerRaw === 'string') {
    innerPersonality = { label: '내면', summary: '', description: innerRaw };
  } else if (innerRaw && typeof innerRaw === 'object') {
    innerPersonality = {
      label: innerRaw.trueNature || innerRaw.type || '내면',
      summary: innerRaw.basis || innerRaw.traits || '',
      description: innerRaw.emotionalProcessing || innerRaw.description || '',
    };
  } else {
    innerPersonality = { label: '내면', summary: '', description: '' };
  }

  // 대인관계 (정규화 후 camelCase만 조회)
  const socialRaw = data.socialStyle || {};
  const strengths = socialRaw.strengths || [];
  const weaknesses = socialRaw.weaknesses || [];
  const socialStyle = {
    label: socialRaw.type || socialRaw.style || '대인관계',
    summary: Array.isArray(strengths) ? strengths.join(', ') : strengths || '',
    description: Array.isArray(weaknesses) ? weaknesses.join(', ') : weaknesses || '',
  };

  // Task 25: 확장 데이터 (대인관계 상세)
  const strengthsArray = Array.isArray(strengths) ? strengths : strengths ? [strengths] : [];
  const weaknessesArray = Array.isArray(weaknesses) ? weaknesses : weaknesses ? [weaknesses] : [];
  const socialStyleType = socialRaw.type || socialRaw.style || undefined;

  return {
    willpower,
    outerPersonality,
    innerPersonality,
    socialStyle,
    // Task 25: 확장 데이터
    extended: {
      socialStyleDetail: {
        type: socialStyleType,
        strengths: strengthsArray.length > 0 ? strengthsArray : undefined,
        weaknesses: weaknessesArray.length > 0 ? weaknessesArray : undefined,
      },
    },
  };
}

/**
 * DB basicAnalysis 데이터를 클라이언트 BasicAnalysisData 형식으로 변환
 * Task 25: 용신/기신/격국/일간 특성 표시용
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformBasicAnalysis(basicAnalysis: any) {
  if (!basicAnalysis) return null;

  // 중첩 구조 처리
  const data = basicAnalysis.basic_analysis || basicAnalysis;

  // 일간 특성
  const dayMasterRaw = data.day_master || data.dayMaster || {};
  const dayMaster = {
    stem: dayMasterRaw.gan || dayMasterRaw.stem || '',
    element: dayMasterRaw.element || dayMasterRaw.오행 || '',
    yinYang: dayMasterRaw.yin_yang || dayMasterRaw.yinYang || dayMasterRaw.음양 || '',
    characteristics: Array.isArray(dayMasterRaw.characteristics)
      ? dayMasterRaw.characteristics
      : typeof dayMasterRaw.characteristics === 'string'
        ? [dayMasterRaw.characteristics]
        : dayMasterRaw.특성 || [],
  };

  // 격국
  const structureRaw = data.structure || data.격국 || {};
  const structure = {
    type: structureRaw.type || structureRaw.격국명 || '',
    quality: structureRaw.quality || structureRaw.품질 || '中',
    description: structureRaw.description || structureRaw.설명 || '',
  };

  // 용신/기신
  const usefulGodRaw = data.yongshin_analysis || data.usefulGod || data.용신분석 || {};
  const usefulGod = {
    primary: usefulGodRaw.yongshin || usefulGodRaw.primary || usefulGodRaw.용신 || '',
    secondary: usefulGodRaw.heeshin || usefulGodRaw.secondary || usefulGodRaw.희신 || '',
    harmful: usefulGodRaw.kishin || usefulGodRaw.harmful || usefulGodRaw.기신 || '',
    reasoning: usefulGodRaw.reason || usefulGodRaw.reasoning || usefulGodRaw.근거 || '',
  };

  // 사주 요약
  const summary = data.summary || data.요약 || '';

  // 데이터가 모두 비어있으면 null 반환
  if (!dayMaster.stem && !structure.type && !usefulGod.primary && !summary) {
    return null;
  }

  return {
    summary,
    dayMaster,
    structure,
    usefulGod,
  };
}

/**
 * DB scores 데이터를 클라이언트 DetailedScoresData 형식으로 변환
 * Task 25: 레이더 차트용 세부 점수
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformDetailedScores(scores: any) {
  if (!scores) return null;

  // 연애 점수 (10개)
  const loveRaw = scores.love || {};
  const love = {
    humor: loveRaw.humor ?? 50,
    emotion: loveRaw.emotion ?? 50,
    finance: loveRaw.finance ?? 50,
    adventure: loveRaw.adventure ?? 50,
    sincerity: loveRaw.sincerity ?? 50,
    selfEsteem: loveRaw.selfEsteem ?? 50,
    sociability: loveRaw.sociability ?? 50,
    consideration: loveRaw.consideration ?? 50,
    expressiveness: loveRaw.expressiveness ?? 50,
    trustworthiness: loveRaw.trustworthiness ?? 50,
  };

  // 업무 점수 (5개)
  const workRaw = scores.work || {};
  const work = {
    drive: workRaw.drive ?? 50,
    planning: workRaw.planning ?? 50,
    execution: workRaw.execution ?? 50,
    completion: workRaw.completion ?? 50,
    management: workRaw.management ?? 50,
  };

  // 재물 점수 (2개)
  const wealthRaw = scores.wealth || {};
  const wealth = {
    growth: wealthRaw.growth ?? 50,
    stability: wealthRaw.stability ?? 50,
  };

  // 적성 점수 (2개)
  const aptitudeRaw = scores.aptitude || {};
  const aptitude = {
    artistry: aptitudeRaw.artistry ?? 50,
    business: aptitudeRaw.business ?? 50,
  };

  return {
    love,
    work,
    wealth,
    aptitude,
    willpower: scores.willpower,
  };
}

/**
 * DB aptitude 데이터를 클라이언트 AptitudeSectionData 형식으로 변환
 *
 * 지원 구조:
 * 1. 영문 키: { talents, recommended_fields, analysis_summary, talent_utilization }
 * 2. 한글 키: { 타고난_재능, 추천_분야, 핵심_키워드, 재능_활용_상태 }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformAptitude(aptitude: any, scores: any) {
  if (!aptitude) return null;

  // 한글 키 vs 영문 키 감지
  const isKoreanKeys = aptitude.타고난_재능 || aptitude.추천_분야 || aptitude.핵심_키워드;

  let keywords: string[] = [];
  let mainTalent = { label: '주 재능', title: '재능 분석', content: '' };
  let talentStatus = { label: '재능의 상태', title: '재능 활용 상태', content: '' };
  let careerChoice = { label: '진로선택', title: '진로 선택 가이드', content: '' };
  let recommendedJobs: string[] = [];
  let avoidedFields: string[] = [];

  if (isKoreanKeys) {
    // 한글 키 구조 (Gemini 한글 응답)
    keywords = aptitude.핵심_키워드 || [];

    // 주 재능
    const talents = aptitude.타고난_재능 || [];
    if (talents.length > 0) {
      const firstTalent = talents[0];
      mainTalent = {
        label: '주 재능',
        title:
          typeof firstTalent === 'string'
            ? firstTalent
            : firstTalent.이름 || firstTalent.name || '재능 분석',
        content:
          typeof firstTalent === 'string' ? '' : firstTalent.설명 || firstTalent.description || '',
      };
    }

    // 재능 활용 상태
    const talentUtil = aptitude.재능_활용_상태 || {};
    if (talentUtil.현재_수준 !== undefined || talentUtil.잠재력 !== undefined) {
      talentStatus = {
        label: '재능의 상태',
        title: `현재 ${talentUtil.현재_수준 || 0}% → 잠재력 ${talentUtil.잠재력 || 0}%`,
        content: talentUtil.조언 || talentUtil.advice || '',
      };
    }

    // 진로 선택 (분석 요약에서 추출)
    const summary = aptitude.분석_요약 || aptitude.analysis_summary || {};
    careerChoice = {
      label: '진로선택',
      title: '진로 선택 가이드',
      content: summary.핵심_논리 || summary.core_logic || '',
    };

    // 추천 직종
    recommendedJobs = (aptitude.추천_분야 || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (field: any) =>
        typeof field === 'string' ? field : field.이름 || field.분야 || field.name || ''
    );

    // 회피 직종
    avoidedFields = (aptitude.회피_분야 || [])
      .map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (field: any) =>
          typeof field === 'string' ? field : field.이름 || field.분야 || field.name || ''
      )
      .filter(Boolean);
  } else {
    // 영문 키 구조 (기존 호환 + talentName/currentLevel/potential 등 새 필드 지원)
    keywords = aptitude.keywords || aptitude.analysis_summary?.keywords || [];

    const firstTalent = aptitude.talents?.[0];
    mainTalent = {
      label: '주 재능',
      // talentName 우선 지원 (새 Gemini 응답)
      title: firstTalent?.talentName || firstTalent?.name || '재능 분석',
      content: firstTalent?.description || '',
    };

    // talentUsage > talentUsageStatus > talent_utilization (키 이름 변동 대응)
    const talentUtil =
      aptitude.talentUsage || aptitude.talentUsageStatus || aptitude.talent_utilization;
    talentStatus = {
      label: '재능의 상태',
      title: talentUtil
        ? // currentLevel/potential 우선 지원
          `현재 ${talentUtil.currentLevel || talentUtil.current_level || 0}% → 잠재력 ${talentUtil.potential || talentUtil.potential_level || 0}%`
        : '재능 활용 상태',
      content: talentUtil?.advice || '',
    };

    careerChoice = {
      label: '진로선택',
      title: '진로 선택 가이드',
      // analysis_summary > talentUsage.advice 폴백
      content: aptitude.analysis_summary?.core_logic || talentUtil?.advice || '',
    };

    // recommendedFields 우선 지원 (새 Gemini 응답) + 한글 키 폴백
    recommendedJobs = (aptitude.recommendedFields || aptitude.recommended_fields || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (field: any) =>
        typeof field === 'string'
          ? field
          : field.fieldName || field.name || field.이름 || field.field || field.분야 || ''
    );

    // avoidFields 우선 지원 (새 Gemini 응답) + 한글 키 폴백
    avoidedFields = (aptitude.avoidFields || aptitude.avoided_fields || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((field: any) =>
        typeof field === 'string'
          ? field
          : field.fieldName ||
            field.reason ||
            field.name ||
            field.이름 ||
            field.field ||
            field.분야 ||
            ''
      )
      .filter(Boolean);
  }

  // 업무스타일
  const workStyle = {
    label: '업무스타일',
    title: '나의 업무 스타일',
    content: avoidedFields.length > 0 ? `피해야 할 분야: ${avoidedFields.join(', ')}` : '',
  };

  // 학업스타일 (snake_case, camelCase, 한글 키 모두 지원)
  const studyStyleRaw = aptitude.study_style || aptitude.studyStyle || aptitude.학습_스타일;
  const studyStyle = {
    label: '학업스타일',
    title: '나의 학습 방식',
    content: studyStyleRaw?.description || studyStyleRaw?.설명 || '',
  };

  // 일자리 능력 그래프 (scores.work에서 생성)
  const workScores = scores?.work || {};
  const jobAbilityTraits = [
    { label: '기획/연구', value: workScores.planning || 0 },
    { label: '끈기/정력', value: workScores.drive || 0 },
    { label: '실천/수단', value: workScores.execution || 0 },
    { label: '완성/판매', value: workScores.completion || 0 },
    { label: '관리/평가', value: workScores.management || 0 },
  ];

  // Task 25: 확장 데이터 추출
  // 타입 정의 (Gemini 응답 - 한/영 키 혼용)
  type TalentRaw =
    | string
    | {
        talentName?: string;
        name?: string;
        이름?: string;
        basis?: string;
        근거?: string;
        십신?: string;
        level?: number;
        점수?: number;
        수준?: number;
        description?: string;
        설명?: string;
      };
  type FieldRaw =
    | string
    | {
        fieldName?: string;
        name?: string;
        분야?: string;
        이름?: string;
        reason?: string;
        사유?: string;
        이유?: string;
        suitability?: number;
        적합도?: number;
        점수?: number;
        description?: string;
        설명?: string;
      };

  // 재능 상세 (basis, level 포함)
  const talentsRaw = isKoreanKeys ? aptitude.타고난_재능 || [] : aptitude.talents || [];
  const talentsExtended = (talentsRaw as TalentRaw[])
    .map((t) => ({
      name: typeof t === 'string' ? t : t.talentName || t.name || t.이름 || '',
      basis: typeof t === 'string' ? undefined : t.basis || t.근거 || t.십신 || undefined,
      level: typeof t === 'string' ? undefined : t.level || t.점수 || t.수준 || undefined,
      description: typeof t === 'string' ? undefined : t.description || t.설명 || undefined,
    }))
    .filter((t) => t.name);

  // 피해야 할 분야 (사유 포함)
  const avoidRaw = isKoreanKeys
    ? aptitude.회피_분야 || []
    : aptitude.avoidFields || aptitude.avoided_fields || [];
  const avoidFieldsExtended = (avoidRaw as FieldRaw[])
    .map((f) => ({
      name: typeof f === 'string' ? f : f.fieldName || f.name || f.분야 || f.이름 || '',
      reason: typeof f === 'string' ? '' : f.reason || f.사유 || f.이유 || '',
    }))
    .filter((f) => f.name);

  // 재능 활용 상태 상세
  const talentUtilRaw = isKoreanKeys
    ? aptitude.재능_활용_상태 || {}
    : aptitude.talentUsage || aptitude.talentUsageStatus || aptitude.talent_utilization || {};
  const talentUsageExtended = {
    currentLevel:
      talentUtilRaw.currentLevel || talentUtilRaw.current_level || talentUtilRaw.현재_수준 || 0,
    potential:
      talentUtilRaw.potential || talentUtilRaw.potential_level || talentUtilRaw.잠재력 || 0,
    advice: talentUtilRaw.advice || talentUtilRaw.조언 || '',
  };

  // 추천 분야 상세 (적합도 포함)
  const recRaw = isKoreanKeys
    ? aptitude.추천_분야 || []
    : aptitude.recommendedFields || aptitude.recommended_fields || [];
  const recommendedFieldsExtended = (recRaw as FieldRaw[])
    .map((f) => ({
      name: typeof f === 'string' ? f : f.fieldName || f.name || f.분야 || f.이름 || '',
      suitability:
        typeof f === 'string' ? undefined : f.suitability || f.적합도 || f.점수 || undefined,
      description: typeof f === 'string' ? undefined : f.description || f.설명 || undefined,
    }))
    .filter((f) => f.name);

  return {
    keywords,
    mainTalent,
    talentStatus,
    careerChoice,
    recommendedJobs,
    workStyle,
    studyStyle,
    jobAbilityTraits,
    // Task 25: 확장 데이터
    extended: {
      talents: talentsExtended,
      avoidFields: avoidFieldsExtended,
      talentUsage:
        talentUsageExtended.currentLevel || talentUsageExtended.potential
          ? talentUsageExtended
          : undefined,
      recommendedFields: recommendedFieldsExtended,
    },
  };
}

/**
 * DB wealth 데이터를 클라이언트 WealthSectionData 형식으로 변환
 *
 * 지원 구조:
 * 1. 영문 키: fortune.wealth { pattern, strengths, risks, advice }
 * 2. 한글 키: fortune.재물운 { 패턴_유형, 재물운_강점, 재물운_리스크, 조언, 재물_점수, 패턴_상세_설명 }
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

  // 한글 키 vs 영문 키 감지
  const isKoreanKeys = wealth.패턴_유형 || wealth.재물운_강점 || wealth.조언;

  let content = '';
  let patternTitle = '';
  // calculator.py에서 계산된 점수 우선 사용
  let wealthScore = scores?.wealthScore ?? wealth.score ?? 50;

  if (isKoreanKeys) {
    // 한글 키 구조 (Gemini 한글 응답)
    patternTitle = wealth.패턴_유형 || '';
    // Gemini 점수는 폴백으로만 사용
    if (!scores?.wealthScore) {
      wealthScore = wealth.재물_점수 || wealthScore;
    }

    if (wealth.패턴_상세_설명) {
      content += `${wealth.패턴_상세_설명}\n\n`;
    }
    if (wealth.재물운_강점?.length > 0) {
      content += `**강점**\n${wealth.재물운_강점.join('\n')}\n\n`;
    }
    if (wealth.재물운_리스크?.length > 0) {
      content += `**주의사항**\n${wealth.재물운_리스크.join('\n')}\n\n`;
    }
    if (wealth.조언) {
      content += `**조언**\n${wealth.조언}`;
    }
  } else {
    // 영문 키 구조 (기존 호환)
    patternTitle = wealth.pattern || '';
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
  }

  // 재물복 카드
  const wealthFortune = {
    label: wealth.label || '재물복',
    title: wealth.title || patternTitle || '내안에 존재하는 재물복',
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

  // 재물 특성 키 한글 매핑
  const WEALTH_LABELS: Record<string, string> = {
    stability: '안정성',
    growth: '성장성',
  };

  // 재물 특성 그래프 (선택, scores에서 생성 가능)
  const wealthTraits = scores?.wealth
    ? Object.entries(scores.wealth).map(([key, value]) => ({
        label: WEALTH_LABELS[key] || key,
        value: typeof value === 'number' ? value : 0,
      }))
    : undefined;

  // Task 25: 확장 데이터 추출
  const pattern = isKoreanKeys ? wealth.패턴_유형 : wealth.pattern || undefined;
  const strengths = isKoreanKeys ? wealth.재물운_강점 || [] : wealth.strengths || [];
  const risks = isKoreanKeys ? wealth.재물운_리스크 || [] : wealth.risks || [];
  const advice = isKoreanKeys ? wealth.조언 || '' : wealth.advice || '';

  return {
    wealthFortune,
    partnerInfluence,
    wealthTraits,
    score: wealthScore,
    // Task 25: 확장 데이터
    extended: {
      pattern: pattern || undefined,
      strengths: strengths.length > 0 ? strengths : undefined,
      risks: risks.length > 0 ? risks : undefined,
      advice: advice || undefined,
    },
  };
}

/**
 * DB love 데이터를 클라이언트 RomanceSectionData 형식으로 변환
 *
 * 지원 구조:
 * 1. 영문 키: fortune.love { style, idealPartner, compatibilityPoints, warnings }
 * 2. 한글 키: fortune.연애운 { 스타일_유형, 이상형_특성, 궁합_점수, 주의사항, 결혼관, 연애_조언 }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRomance(love: any, scores: any) {
  // 기본값으로 빈 데이터 반환 (null이 아님)
  const loveScores = scores?.love || {};

  // NOTE: calculator.ts 필드명 → RomanceSectionData 필드명 매핑
  const aptitudeScores = scores?.aptitude || {};
  const defaultRomanceTraits = {
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

  // 한글 키 vs 영문 키 감지
  const isKoreanKeys = love.스타일_유형 || love.이상형_특성 || love.연애_조언;

  let datingContent = '';
  let spouseContent = '';
  let styleTitle = '';
  // calculator.py에서 계산된 점수 우선 사용
  let romanceScore = scores?.loveScore ?? love.score ?? 50;

  if (isKoreanKeys) {
    // 한글 키 구조 (Gemini 한글 응답)
    styleTitle = love.스타일_유형 || '';
    // Gemini 점수는 폴백으로만 사용
    if (!scores?.loveScore) {
      romanceScore = love.궁합_점수 || romanceScore;
    }

    if (love.스타일_유형) {
      datingContent += `**연애 스타일**: ${love.스타일_유형}\n\n`;
    }
    if (love.이상형_특성 && typeof love.이상형_특성 === 'object') {
      // 객체 구조인 경우
      const idealPartner = love.이상형_특성;
      if (idealPartner.외모_선호) {
        datingContent += `**외모 선호**: ${idealPartner.외모_선호}\n`;
      }
      if (idealPartner.성격_선호) {
        datingContent += `**성격 선호**: ${idealPartner.성격_선호}\n`;
      }
      if (idealPartner.가치관_선호) {
        datingContent += `**가치관 선호**: ${idealPartner.가치관_선호}\n\n`;
      }
    } else if (typeof love.이상형_특성 === 'string') {
      // 문자열로 반환된 경우
      datingContent += `**이상형**: ${love.이상형_특성}\n\n`;
    }
    if (love.연애_조언) {
      datingContent += `**조언**\n${love.연애_조언}`;
    }

    // 배우자관/결혼관
    if (love.결혼관) {
      spouseContent += `${love.결혼관}\n\n`;
    }
    if (love.주의사항?.length > 0) {
      spouseContent += `**주의사항**\n${love.주의사항.join('\n')}`;
    }
  } else {
    // 영문 키 구조 (기존 호환)
    styleTitle = love.style || '';
    if (love.style) {
      datingContent += `연애 스타일: ${love.style}\n\n`;
    }
    if (love.idealPartner?.length > 0) {
      datingContent += `이상형: ${love.idealPartner.join(', ')}\n\n`;
    }
    if (love.compatibilityPoints?.length > 0) {
      datingContent += `궁합 포인트: ${love.compatibilityPoints.join(', ')}`;
    }

    if (love.warnings?.length > 0) {
      spouseContent = `주의사항: ${love.warnings.join(', ')}`;
    }
  }

  // 연애심리 카드 - 기존 구조(dating_psychology)도 하위 호환 지원
  const datingPsychology = {
    label: love.dating_psychology?.label || '연애심리',
    title: love.dating_psychology?.title || styleTitle || '결혼전 연애/데이트 심리',
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

  // 연애 특성 (scores에서 생성)
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

  // Task 25: 확장 데이터 추출
  // 연애 스타일
  const style = isKoreanKeys ? love.스타일_유형 : love.style || undefined;

  // 이상형 특성
  let idealPartnerList: string[] = [];
  if (isKoreanKeys && love.이상형_특성) {
    if (typeof love.이상형_특성 === 'object' && !Array.isArray(love.이상형_특성)) {
      const ip = love.이상형_특성;
      if (ip.외모_선호) idealPartnerList.push(ip.외모_선호);
      if (ip.성격_선호) idealPartnerList.push(ip.성격_선호);
      if (ip.가치관_선호) idealPartnerList.push(ip.가치관_선호);
    } else if (typeof love.이상형_특성 === 'string') {
      idealPartnerList = [love.이상형_특성];
    }
  } else if (Array.isArray(love.idealPartner)) {
    idealPartnerList = love.idealPartner;
  }

  // 주의사항
  const warnings = isKoreanKeys ? love.주의사항 || [] : love.warnings || [];

  // 궁합 포인트
  const compatibilityPoints = isKoreanKeys
    ? love.궁합_포인트 || []
    : love.compatibilityPoints || [];

  // 연애 조언
  const loveAdvice = isKoreanKeys ? love.연애_조언 || '' : love.advice || love.loveAdvice || '';

  return {
    datingPsychology,
    spouseView,
    personalityPattern,
    romanceTraits,
    score: romanceScore,
    // Task 25: 확장 데이터
    extended: {
      style,
      idealPartner: idealPartnerList.length > 0 ? idealPartnerList : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      compatibilityPoints: compatibilityPoints.length > 0 ? compatibilityPoints : undefined,
      loveAdvice: loveAdvice || undefined,
    },
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
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
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
      return NextResponse.json(createErrorResponse(PROFILE_ERRORS.NOT_FOUND), {
        status: getStatusCode(PROFILE_ERRORS.NOT_FOUND),
      });
    }

    if (profile.user_id !== userId) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.FORBIDDEN), {
        status: getStatusCode(AUTH_ERRORS.FORBIDDEN),
      });
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
      return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
        status: getStatusCode(API_ERRORS.SERVER_ERROR),
      });
    }

    if (!report) {
      return NextResponse.json(createErrorResponse(API_ERRORS.NOT_FOUND), {
        status: getStatusCode(API_ERRORS.NOT_FOUND),
      });
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
      // 리포트 ID (재분석 API용)
      reportId: report.id,
      // 실패한 단계 목록 (재분석 UI용)
      failedSteps: report.failed_steps || [],
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
      daewun: transformDaewun(report.daewun || []),
      jijanggan: report.jijanggan,
      // Task 25: 기본 분석 (용신/기신/격국/일간)
      // v2.5: 개별 컬럼 우선, analysis 폴백 (롤백 안전성)
      basicAnalysis: transformBasicAnalysis(
        report.basic_analysis || report.analysis?.basicAnalysis
      ),
      // 분석 결과: 개별 컬럼 우선, analysis JSONB 폴백
      // willpower 점수는 십신 기반 계산 값 사용 (scores.willpower)
      personality: transformPersonality(
        report.personality || report.analysis?.personality,
        report.scores?.willpower
      ),
      // NOTE: characteristics 삭제됨 (BasicAnalysisSection과 중복)
      aptitude: transformAptitude(report.aptitude || report.analysis?.aptitude, report.scores),
      // fortune 데이터: 개별 컬럼 우선, analysis 폴백
      wealth: transformWealth(
        report.fortune?.재물운 ||
          report.fortune?.wealth ||
          report.analysis?.fortune?.재물운 ||
          report.analysis?.fortune?.wealth,
        report.scores
      ),
      romance: transformRomance(
        report.fortune?.연애운 ||
          report.fortune?.love ||
          report.analysis?.fortune?.연애운 ||
          report.analysis?.fortune?.love,
        report.scores
      ),
      // 점수 및 시각화
      scores: report.scores,
      // Task 25: 세부 점수 (레이더 차트용)
      detailedScores: transformDetailedScores(report.scores),
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
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

/**
 * POST /api/profiles/[id]/report
 * 리포트 생성 시작 (비동기 - Python 백엔드에 작업 위임)
 *
 * v2.0: Vercel 30초 타임아웃 문제 해결
 * - Python 백엔드에 작업을 위임하고 즉시 응답
 * - 클라이언트는 /status 엔드포인트로 폴링
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.UNAUTHORIZED), {
        status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED),
      });
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
      return NextResponse.json(createErrorResponse(PROFILE_ERRORS.NOT_FOUND), {
        status: getStatusCode(PROFILE_ERRORS.NOT_FOUND),
      });
    }

    if (profile.user_id !== userId) {
      return NextResponse.json(createErrorResponse(AUTH_ERRORS.FORBIDDEN), {
        status: getStatusCode(AUTH_ERRORS.FORBIDDEN),
      });
    }

    // 2. 기존 리포트 확인 (pending, in_progress, failed 모두)
    const { data: existingReport } = await supabase
      .from('profile_reports')
      .select('id, status, credits_used, current_step, pillars, daewun, analysis')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 이미 완료된 리포트가 있는 경우 (재시도 요청이 아닐 때) → 리다이렉트 안내
    if (existingReport?.status === 'completed' && !retryFromStep) {
      return NextResponse.json({
        success: true,
        message: '이미 완료된 리포트가 있습니다',
        reportId: existingReport.id,
        status: 'completed',
        redirectUrl: `/profiles/${profileId}/report`,
      });
    }

    // pending/in_progress 상태 모두 체크 (재시도 요청이 아닐 때)
    if (
      (existingReport?.status === 'in_progress' || existingReport?.status === 'pending') &&
      !retryFromStep
    ) {
      return NextResponse.json({
        success: true,
        message: '이미 리포트 생성이 진행 중입니다',
        reportId: existingReport.id,
        status: existingReport.status,
        pollUrl: `/api/profiles/${profileId}/report/status`,
      });
    }

    // 3. 크레딧 무료 재시도 조건 확인
    const isRetryWithCredits =
      existingReport &&
      existingReport.credits_used > 0 &&
      (existingReport.status === 'failed' || existingReport.status === 'pending');

    const shouldDeductCredits = !retryFromStep && !isRetryWithCredits;

    // 4. 크레딧 확인 및 차감 (신규 생성인 경우에만)
    let currentUserCredits = 0;
    if (shouldDeductCredits) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return NextResponse.json(createErrorResponse(API_ERRORS.NOT_FOUND), {
          status: getStatusCode(API_ERRORS.NOT_FOUND),
        });
      }

      currentUserCredits = userData.credits;

      if (userData.credits < SERVICE_CREDITS.profileReport) {
        return NextResponse.json(
          createErrorResponse(CREDIT_ERRORS.INSUFFICIENT, {
            required: SERVICE_CREDITS.profileReport,
            current: userData.credits,
          }),
          { status: getStatusCode(CREDIT_ERRORS.INSUFFICIENT) }
        );
      }

      // 크레딧 차감
      const newCredits = userData.credits - SERVICE_CREDITS.profileReport;
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
          step_statuses: getRetryStepStatuses(startStep),
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
        // 크레딧 환불
        if (shouldDeductCredits) {
          await supabase
            .from('users')
            .update({ credits: currentUserCredits, updated_at: new Date().toISOString() })
            .eq('id', userId);
        }
        return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
          status: getStatusCode(API_ERRORS.SERVER_ERROR),
        });
      }

      reportId = newReport.id;
    }

    // 6. Python 백엔드에 작업 위임 (비동기 - 즉시 반환)
    let pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    if (!pythonApiUrl.startsWith('http://') && !pythonApiUrl.startsWith('https://')) {
      pythonApiUrl = `https://${pythonApiUrl}`;
    }

    try {
      const pythonResponse = await fetch(`${pythonApiUrl}/api/analysis/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          profile_id: profileId,
          user_id: userId,
          birth_date: profile.birth_date,
          birth_time: profile.birth_time || '12:00',
          gender: profile.gender,
          calendar_type: profile.calendar_type || 'solar',
          language: 'ko',
          retry_from_step: retryFromStep,
          existing_pillars: existingReport?.pillars,
          existing_daewun: existingReport?.daewun,
          existing_analysis: existingReport?.analysis,
        }),
      });

      if (!pythonResponse.ok) {
        const errorData = await pythonResponse.json().catch(() => ({}));
        console.error('[API] Python API 호출 실패:', errorData);

        // 실패 시 크레딧 환불
        if (shouldDeductCredits) {
          await supabase
            .from('users')
            .update({ credits: currentUserCredits, updated_at: new Date().toISOString() })
            .eq('id', userId);
        }

        // DB에 실패 상태 저장
        await supabase
          .from('profile_reports')
          .update({
            status: 'failed',
            error: { message: errorData.detail || 'Python API 호출 실패', retryable: true },
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        return NextResponse.json(createErrorResponse(API_ERRORS.EXTERNAL_SERVICE_ERROR), {
          status: getStatusCode(API_ERRORS.EXTERNAL_SERVICE_ERROR),
        });
      }

      const pythonResult = await pythonResponse.json();
      console.log('[API] Python 백엔드에 작업 위임 완료:', {
        reportId,
        jobId: pythonResult.job_id,
      });

      // DB에 job_id 저장
      await supabase
        .from('profile_reports')
        .update({
          job_id: pythonResult.job_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);
    } catch (pythonError) {
      console.error('[API] Python API 연결 실패:', pythonError);

      // 실패 시 크레딧 환불
      if (shouldDeductCredits) {
        await supabase
          .from('users')
          .update({ credits: currentUserCredits, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }

      // DB에 실패 상태 저장
      await supabase
        .from('profile_reports')
        .update({
          status: 'failed',
          error: { message: 'Python 백엔드 연결 실패', retryable: true },
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      return NextResponse.json(createErrorResponse(API_ERRORS.EXTERNAL_SERVICE_ERROR), {
        status: 503,
      });
    }

    // 7. 즉시 응답 반환
    return NextResponse.json({
      success: true,
      message: '리포트 생성이 시작되었습니다',
      reportId,
      pollUrl: `/api/profiles/${profileId}/report/status`,
    });
  } catch (error) {
    console.error('[API] POST /api/profiles/[id]/report 에러:', error);
    return NextResponse.json(createErrorResponse(API_ERRORS.SERVER_ERROR), {
      status: getStatusCode(API_ERRORS.SERVER_ERROR),
    });
  }
}

/**
 * API 라우트 설정
 * v2.0: 비동기 방식으로 변경 - Python에 작업 위임 후 즉시 반환
 * 10초면 충분 (Python 백엔드에 작업 위임 후 즉시 반환)
 */
export const maxDuration = 10;
export const dynamic = 'force-dynamic';
