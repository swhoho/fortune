-- ============================================
-- AI 상담(컨설팅) 기능 테이블
-- 2026-01-05
-- ============================================

-- 1. 상담 세션 테이블
CREATE TABLE IF NOT EXISTS consultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  profile_report_id UUID REFERENCES profile_reports(id) ON DELETE SET NULL,

  -- 세션 메타데이터
  title TEXT,  -- 자동 생성 (첫 질문 기반)
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  question_count INT DEFAULT 0 CHECK (question_count >= 0 AND question_count <= 5),
  credits_used INT DEFAULT 10,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_profile_id ON consultation_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_user_id ON consultation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_status ON consultation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_created_at ON consultation_sessions(created_at DESC);

-- RLS 정책
ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consultation sessions" ON consultation_sessions;
CREATE POLICY "Users can view own consultation sessions"
  ON consultation_sessions FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own consultation sessions" ON consultation_sessions;
CREATE POLICY "Users can insert own consultation sessions"
  ON consultation_sessions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own consultation sessions" ON consultation_sessions;
CREATE POLICY "Users can update own consultation sessions"
  ON consultation_sessions FOR UPDATE
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role has full access to consultation sessions" ON consultation_sessions;
CREATE POLICY "Service role has full access to consultation sessions"
  ON consultation_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- 2. 상담 메시지 테이블
CREATE TABLE IF NOT EXISTS consultation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES consultation_sessions(id) ON DELETE CASCADE,

  -- 메시지 내용
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user_question', 'ai_clarification', 'user_clarification', 'ai_answer')),
  content TEXT NOT NULL,
  question_round INT CHECK (question_round >= 1 AND question_round <= 5),

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_consultation_messages_session_id ON consultation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_created_at ON consultation_messages(created_at);

-- RLS 정책 (세션을 통해 접근 제어)
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages of own sessions" ON consultation_messages;
CREATE POLICY "Users can view messages of own sessions"
  ON consultation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM consultation_sessions cs
      WHERE cs.id = consultation_messages.session_id
      AND cs.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can insert messages to own sessions" ON consultation_messages;
CREATE POLICY "Users can insert messages to own sessions"
  ON consultation_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM consultation_sessions cs
      WHERE cs.id = consultation_messages.session_id
      AND cs.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Service role has full access to consultation messages" ON consultation_messages;
CREATE POLICY "Service role has full access to consultation messages"
  ON consultation_messages FOR ALL
  USING (auth.role() = 'service_role');

-- 3. updated_at 트리거 (기존 함수 재사용)
DROP TRIGGER IF EXISTS update_consultation_sessions_updated_at ON consultation_sessions;
CREATE TRIGGER update_consultation_sessions_updated_at
  BEFORE UPDATE ON consultation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 세션 완료 자동 처리 함수
CREATE OR REPLACE FUNCTION auto_complete_consultation_session()
RETURNS TRIGGER AS $$
BEGIN
  -- question_count가 5에 도달하면 status를 completed로 변경
  IF NEW.question_count >= 5 AND OLD.question_count < 5 THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_complete_session_trigger ON consultation_sessions;
CREATE TRIGGER auto_complete_session_trigger
  BEFORE UPDATE ON consultation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_consultation_session();
