-- Task 24.3: 기존 분석 기록 → 프로필 연결 마이그레이션
-- 날짜: 2026-01-04 (수정)
-- 설명: 기존 analyses 및 yearly_analyses 레코드에 profile_id 자동 매칭

-- ========================================
-- 0. 스키마 변경: profile_id 컬럼 추가 (Step 1 - 먼저 실행!)
-- ========================================

-- 0-1. analyses 테이블에 profile_id 컬럼 추가
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL;

-- 0-2. yearly_analyses 테이블에 profile_id 컬럼 추가
ALTER TABLE yearly_analyses
ADD COLUMN IF NOT EXISTS profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL;

-- 0-3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_analyses_profile_id ON analyses(profile_id);
CREATE INDEX IF NOT EXISTS idx_yearly_analyses_profile_id ON yearly_analyses(profile_id);

-- ========================================
-- 1. DRY RUN: 매칭 가능한 레코드 확인 (analyses)
-- ========================================
-- (Step 2 - 스키마 변경 후 실행)
SELECT
  a.user_id,
  p.id AS profile_id,
  DATE(a.birth_datetime) AS birth_date,
  a.gender,
  p.name AS profile_name,
  a.created_at AS analysis_date
FROM analyses a
JOIN profiles p ON a.user_id = p.user_id
  AND DATE(a.birth_datetime) = p.birth_date
  AND a.gender = p.gender
WHERE a.profile_id IS NULL
ORDER BY a.created_at DESC;

-- 매칭 가능 개수 확인
SELECT
  COUNT(*) AS total_matchable,
  COUNT(DISTINCT a.user_id) AS unique_users
FROM analyses a
JOIN profiles p ON a.user_id = p.user_id
  AND DATE(a.birth_datetime) = p.birth_date
  AND a.gender = p.gender
WHERE a.profile_id IS NULL;

-- ========================================
-- 2. DRY RUN: 매칭 가능한 레코드 확인 (yearly_analyses)
-- ========================================
SELECT
  ya.id AS yearly_analysis_id,
  p.id AS profile_id,
  ya.user_id,
  ya.target_year,
  ya.gender,
  p.name AS profile_name,
  ya.created_at AS analysis_date
FROM yearly_analyses ya
JOIN profiles p ON ya.user_id = p.user_id
  AND ya.gender = p.gender
WHERE ya.profile_id IS NULL
ORDER BY ya.created_at DESC
LIMIT 20;

-- ========================================
-- 3. 실제 마이그레이션: analyses 테이블 업데이트
-- ========================================
-- (Step 3 - DRY RUN 확인 후 실행)
-- ⚠️ 주의: 백업 후 실행!
-- 매칭 기준: user_id + birth_date + gender

UPDATE analyses a
SET profile_id = (
  SELECT p.id
  FROM profiles p
  WHERE a.user_id = p.user_id
    AND DATE(a.birth_datetime) = p.birth_date
    AND a.gender = p.gender
  LIMIT 1
)
WHERE a.profile_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM profiles p
    WHERE a.user_id = p.user_id
      AND DATE(a.birth_datetime) = p.birth_date
      AND a.gender = p.gender
  );

-- ========================================
-- 4. 실제 마이그레이션: yearly_analyses 테이블 업데이트
-- ========================================
-- yearly_analyses는 birth_datetime이 없으므로 user_id + gender로 매칭
-- (같은 사용자의 같은 성별 프로필과 연결)

UPDATE yearly_analyses ya
SET profile_id = (
  SELECT p.id
  FROM profiles p
  WHERE ya.user_id = p.user_id
    AND ya.gender = p.gender
  LIMIT 1
)
WHERE ya.profile_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM profiles p
    WHERE ya.user_id = p.user_id
      AND ya.gender = p.gender
  );

-- ========================================
-- 5. 마이그레이션 결과 확인
-- ========================================
-- (Step 4 - 마이그레이션 후 실행)

-- analyses 테이블 결과
SELECT
  COUNT(*) FILTER (WHERE profile_id IS NOT NULL) AS matched,
  COUNT(*) FILTER (WHERE profile_id IS NULL) AS unmatched,
  COUNT(*) AS total
FROM analyses;

-- yearly_analyses 테이블 결과
SELECT
  COUNT(*) FILTER (WHERE profile_id IS NOT NULL) AS matched,
  COUNT(*) FILTER (WHERE profile_id IS NULL) AS unmatched,
  COUNT(*) AS total
FROM yearly_analyses;

-- ========================================
-- 6. 롤백 (필요시)
-- ========================================
-- UPDATE analyses SET profile_id = NULL WHERE profile_id IS NOT NULL;
-- UPDATE yearly_analyses SET profile_id = NULL WHERE profile_id IS NOT NULL;
