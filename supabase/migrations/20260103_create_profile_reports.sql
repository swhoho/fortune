-- =============================================
-- Task 22-23: profile_reports 및 reanalysis_logs 테이블
-- =============================================

-- profile_reports 테이블: 프로필별 리포트 생성 상태 및 결과 저장
CREATE TABLE IF NOT EXISTS profile_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  current_step VARCHAR(50),
  progress_percent INT DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  step_statuses JSONB DEFAULT '{}',
  estimated_time_remaining INT DEFAULT 0,
  error JSONB,
  pillars JSONB,
  daewun JSONB,
  jijanggan JSONB,
  analysis JSONB,
  scores JSONB,
  visualization_url TEXT,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_profile_reports_profile_id ON profile_reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_reports_user_id ON profile_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_reports_status ON profile_reports(status);
CREATE INDEX IF NOT EXISTS idx_profile_reports_created_at ON profile_reports(created_at DESC);

-- RLS 정책
ALTER TABLE profile_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile reports" ON profile_reports;
CREATE POLICY "Users can view own profile reports"
  ON profile_reports FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own profile reports" ON profile_reports;
CREATE POLICY "Users can insert own profile reports"
  ON profile_reports FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own profile reports" ON profile_reports;
CREATE POLICY "Users can update own profile reports"
  ON profile_reports FOR UPDATE
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role has full access to profile reports" ON profile_reports;
CREATE POLICY "Service role has full access to profile reports"
  ON profile_reports FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- reanalysis_logs 테이블: 섹션 재분석 이력
-- =============================================

CREATE TABLE IF NOT EXISTS reanalysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES profile_reports(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  section_type VARCHAR(50) NOT NULL CHECK (section_type IN ('personality', 'aptitude', 'fortune')),
  credits_used INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_reanalysis_logs_report_id ON reanalysis_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_reanalysis_logs_user_id ON reanalysis_logs(user_id);

-- RLS 정책
ALTER TABLE reanalysis_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reanalysis logs" ON reanalysis_logs;
CREATE POLICY "Users can view own reanalysis logs"
  ON reanalysis_logs FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own reanalysis logs" ON reanalysis_logs;
CREATE POLICY "Users can insert own reanalysis logs"
  ON reanalysis_logs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role has full access to reanalysis logs" ON reanalysis_logs;
CREATE POLICY "Service role has full access to reanalysis logs"
  ON reanalysis_logs FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================
-- updated_at 자동 업데이트 트리거
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profile_reports_updated_at ON profile_reports;
CREATE TRIGGER update_profile_reports_updated_at
    BEFORE UPDATE ON profile_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
