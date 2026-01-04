/**
 * 날짜 관련 유틸리티 함수
 */

/**
 * 나이 계산 유틸리티 (타임존 안전)
 * @param birthDate 생년월일 (YYYY-MM-DD)
 * @returns 만 나이
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  // YYYY-MM-DD를 로컬 타임존으로 안전하게 파싱
  const parts = birthDate.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const birth = new Date(year, month - 1, day);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
