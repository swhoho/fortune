/**
 * 사주 팔자(Pillars) 유효성 검증 유틸리티
 *
 * 기본 사주 분석이 완료되었는지 확인하기 위한 함수들
 * - 궁합 분석, 신년 분석, 오늘의 운세 등에서 SAJU_REQUIRED 체크에 사용
 */

export interface PillarData {
  stem?: string;
  branch?: string;
  element?: string;
}

export interface PillarsData {
  year?: PillarData;
  month?: PillarData;
  day?: PillarData;
  hour?: PillarData;
}

/**
 * 단일 기둥(Pillar) 유효성 검사
 * @param pillar - 검사할 기둥 데이터
 * @returns stem과 branch가 모두 있으면 true
 */
export function isValidPillar(pillar: unknown): pillar is PillarData {
  if (!pillar || typeof pillar !== 'object') return false;
  const p = pillar as Record<string, unknown>;
  return (
    typeof p.stem === 'string' &&
    typeof p.branch === 'string' &&
    p.stem.length > 0 &&
    p.branch.length > 0
  );
}

/**
 * 전체 사주 팔자(Pillars) 유효성 검사
 * @param pillars - 검사할 사주 데이터
 * @returns year, month, day, hour 모두 유효하면 true
 */
export function isValidPillars(pillars: unknown): pillars is PillarsData {
  if (!pillars || typeof pillars !== 'object') return false;
  const p = pillars as Record<string, unknown>;

  return (
    isValidPillar(p.year) &&
    isValidPillar(p.month) &&
    isValidPillar(p.day) &&
    isValidPillar(p.hour)
  );
}

/**
 * profile_reports에서 유효한 사주 분석이 완료되었는지 확인
 * @param report - profile_reports 레코드
 * @returns status가 completed이고 pillars가 유효하면 true
 */
export function hasCompletedSajuAnalysis(
  report: { pillars?: unknown; status?: string } | null
): boolean {
  if (!report) return false;
  if (report.status !== 'completed') return false;
  return isValidPillars(report.pillars);
}
