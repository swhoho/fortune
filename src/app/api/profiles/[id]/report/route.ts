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
 * 십신 정보 및 기본값 채우기
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
    // 새 필드: 점수 근거 + 상세 요약
    scoreReasoning: dw.scoreReasoning || '',
    summary: dw.summary || dw.description || getDefaultDaewunDescription(dw.tenGod, dw.age),
    // 기존 호환용
    description: dw.description || getDefaultDaewunDescription(dw.tenGod, dw.age),
  }));
}

/**
 * 십신별 기본 대운 설명 생성
 */
function getDefaultDaewunDescription(tenGod: string | undefined, _age: number): string {
  const descriptions: Record<string, string> = {
    비견: '자립심과 경쟁심이 강해지는 시기, 동료와의 협력이 중요',
    겁재: '도전과 모험의 시기, 투자와 경쟁에 주의 필요',
    식신: '창의력과 표현력이 빛나는 시기, 재능 발휘의 기회',
    상관: '예술적 감성이 풍부해지는 시기, 구설에 주의',
    정재: '안정적인 수입과 저축의 시기, 근면성실이 빛을 발함',
    편재: '투자와 사업 기회의 시기, 부수입 가능성',
    정관: '승진과 명예의 시기, 책임감이 요구됨',
    편관: '변화와 도전의 시기, 스트레스 관리 필요',
    정인: '학업과 자기계발의 시기, 지식 습득에 유리',
    편인: '특수 기술 습득의 시기, 영감과 창의적 사고',
  };

  return descriptions[tenGod || ''] || '운의 흐름을 파악하여 대비하는 시기';
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
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformPersonality(personality: any) {
  if (!personality) return null;

  // 한글 래퍼 처리
  const data = personality.성격분석 || personality;

  // 의지력: willpower > willpower_analysis > 의지력
  const willpowerData = data.willpower || data.willpower_analysis || data.의지력 || {};
  const willpower = {
    score: willpowerData.score || willpowerData.점수 || 0,
    description: willpowerData.description || willpowerData.설명 || '',
  };

  // 겉성격: outerPersonality > outer_personality > 겉성격 (문자열 또는 객체)
  const outerRaw = data.outerPersonality || data.outer_personality || data.겉성격;
  let outerPersonality;
  if (typeof outerRaw === 'string') {
    // 문자열인 경우 description으로 사용
    outerPersonality = {
      label: '외면',
      summary: '',
      description: outerRaw,
    };
  } else if (outerRaw && typeof outerRaw === 'object') {
    outerPersonality = {
      label: outerRaw.impression || outerRaw.인상 || outerRaw.유형 || '외면',
      summary: outerRaw.basis || outerRaw.근거 || outerRaw.특성 || '',
      description: outerRaw.social_persona || outerRaw.사회적_페르소나 || outerRaw.설명 || '',
    };
  } else {
    outerPersonality = { label: '외면', summary: '', description: '' };
  }

  // 속성격: innerPersonality > inner_personality > 속성격 (문자열 또는 객체)
  const innerRaw = data.innerPersonality || data.inner_personality || data.속성격;
  let innerPersonality;
  if (typeof innerRaw === 'string') {
    innerPersonality = {
      label: '내면',
      summary: '',
      description: innerRaw,
    };
  } else if (innerRaw && typeof innerRaw === 'object') {
    innerPersonality = {
      label: innerRaw.true_nature || innerRaw.본성 || innerRaw.유형 || '내면',
      summary: innerRaw.basis || innerRaw.근거 || innerRaw.특성 || '',
      description: innerRaw.emotional_processing || innerRaw.감정_처리방식 || innerRaw.설명 || '',
    };
  } else {
    innerPersonality = { label: '내면', summary: '', description: '' };
  }

  // 대인관계: socialStyle > interpersonal_style > 대인관계_스타일
  const socialRaw = data.socialStyle || data.interpersonal_style || data.대인관계_스타일 || {};
  const strengths = socialRaw.strengths || socialRaw.강점 || [];
  const weaknesses = socialRaw.weaknesses || socialRaw.약점 || [];
  const socialStyle = {
    label: socialRaw.type || socialRaw.유형 || socialRaw.스타일 || '대인관계',
    summary: Array.isArray(strengths) ? strengths.join(', ') : strengths || '',
    description: Array.isArray(weaknesses) ? weaknesses.join(', ') : weaknesses || '',
  };

  return {
    willpower,
    outerPersonality,
    innerPersonality,
    socialStyle,
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

  // 학업스타일
  const studyStyle = {
    label: '학업스타일',
    title: '나의 학습 방식',
    content: aptitude.study_style?.description || aptitude.학습_스타일?.설명 || '',
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
  let wealthScore = wealth.score;

  if (isKoreanKeys) {
    // 한글 키 구조 (Gemini 한글 응답)
    patternTitle = wealth.패턴_유형 || '';
    wealthScore = wealth.재물_점수 || wealthScore;

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

  return {
    wealthFortune,
    partnerInfluence,
    wealthTraits,
    score: wealthScore,
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
  let romanceScore = love.score;

  if (isKoreanKeys) {
    // 한글 키 구조 (Gemini 한글 응답)
    styleTitle = love.스타일_유형 || '';
    romanceScore = love.궁합_점수 || romanceScore;

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

  return {
    datingPsychology,
    spouseView,
    personalityPattern,
    romanceTraits,
    score: romanceScore,
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
      return NextResponse.json(
        createErrorResponse(AUTH_ERRORS.UNAUTHORIZED),
        { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) }
      );
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
      return NextResponse.json(
        createErrorResponse(PROFILE_ERRORS.NOT_FOUND),
        { status: getStatusCode(PROFILE_ERRORS.NOT_FOUND) }
      );
    }

    if (profile.user_id !== userId) {
      return NextResponse.json(
        createErrorResponse(AUTH_ERRORS.FORBIDDEN),
        { status: getStatusCode(AUTH_ERRORS.FORBIDDEN) }
      );
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
      return NextResponse.json(
        createErrorResponse(API_ERRORS.SERVER_ERROR),
        { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
      );
    }

    if (!report) {
      return NextResponse.json(
        createErrorResponse(API_ERRORS.NOT_FOUND),
        { status: getStatusCode(API_ERRORS.NOT_FOUND) }
      );
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
      daewun: transformDaewun(report.daewun || []),
      jijanggan: report.jijanggan,
      // 분석 결과 (analysis JSONB에서 추출 및 클라이언트 형식 변환)
      // 한글 키(성격분석) 또는 영문 키(personality) 지원
      personality: transformPersonality(report.analysis?.personality),
      characteristics: transformCharacteristics(report.analysis?.basicAnalysis),
      aptitude: transformAptitude(report.analysis?.aptitude, report.scores),
      // fortune 데이터: 한글 키(재물운, 연애운) 또는 영문 키(wealth, love) 지원
      wealth: transformWealth(
        report.analysis?.fortune?.재물운 || report.analysis?.fortune?.wealth,
        report.scores
      ),
      romance: transformRomance(
        report.analysis?.fortune?.연애운 || report.analysis?.fortune?.love,
        report.scores
      ),
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
    return NextResponse.json(
      createErrorResponse(API_ERRORS.SERVER_ERROR),
      { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
    );
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
      return NextResponse.json(
        createErrorResponse(AUTH_ERRORS.UNAUTHORIZED),
        { status: getStatusCode(AUTH_ERRORS.UNAUTHORIZED) }
      );
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
      return NextResponse.json(
        createErrorResponse(PROFILE_ERRORS.NOT_FOUND),
        { status: getStatusCode(PROFILE_ERRORS.NOT_FOUND) }
      );
    }

    if (profile.user_id !== userId) {
      return NextResponse.json(
        createErrorResponse(AUTH_ERRORS.FORBIDDEN),
        { status: getStatusCode(AUTH_ERRORS.FORBIDDEN) }
      );
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
        return NextResponse.json(
          createErrorResponse(API_ERRORS.NOT_FOUND),
          { status: getStatusCode(API_ERRORS.NOT_FOUND) }
        );
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
        return NextResponse.json(
          createErrorResponse(API_ERRORS.SERVER_ERROR),
          { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
        );
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

        return NextResponse.json(
          createErrorResponse(API_ERRORS.EXTERNAL_SERVICE_ERROR),
          { status: getStatusCode(API_ERRORS.EXTERNAL_SERVICE_ERROR) }
        );
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

      return NextResponse.json(
        createErrorResponse(API_ERRORS.EXTERNAL_SERVICE_ERROR),
        { status: 503 }
      );
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
    return NextResponse.json(
      createErrorResponse(API_ERRORS.SERVER_ERROR),
      { status: getStatusCode(API_ERRORS.SERVER_ERROR) }
    );
  }
}

/**
 * API 라우트 설정
 * v2.0: 비동기 방식으로 변경 - Python에 작업 위임 후 즉시 반환
 * 10초면 충분 (Python 백엔드에 작업 위임 후 즉시 반환)
 */
export const maxDuration = 10;
export const dynamic = 'force-dynamic';
