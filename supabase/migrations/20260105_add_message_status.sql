-- ============================================
-- 상담 메시지 비동기 처리를 위한 status 컬럼 추가
-- 2026-01-05
-- ============================================

-- 1. status 컬럼 추가 (generating: 생성 중, completed: 완료, failed: 실패)
ALTER TABLE consultation_messages
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed'
CHECK (status IN ('generating', 'completed', 'failed'));

-- 2. error_message 컬럼 추가 (실패 시 에러 메시지)
ALTER TABLE consultation_messages
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 3. 인덱스 추가 (폴링 최적화)
CREATE INDEX IF NOT EXISTS idx_consultation_messages_status
ON consultation_messages(status)
WHERE status = 'generating';
