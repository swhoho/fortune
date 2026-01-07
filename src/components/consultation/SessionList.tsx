'use client';

/**
 * 상담 세션 목록 컴포넌트
 */
import { motion } from 'framer-motion';
import { Plus, MessageCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ConsultationSession } from '@/types/consultation';

interface SessionListProps {
  /** 세션 목록 */
  sessions: ConsultationSession[];
  /** 현재 선택된 세션 ID */
  activeSessionId: string | null;
  /** 세션 선택 핸들러 */
  onSelectSession: (sessionId: string) => void;
  /** 새 세션 생성 핸들러 */
  onCreateSession: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 세션 생성 중 */
  isCreating?: boolean;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  isLoading = false,
  isCreating = false,
}: SessionListProps) {
  /**
   * 날짜 포맷
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-[#333] px-4 py-3">
        <h3 className="font-medium text-white">상담 내역</h3>
        <button
          onClick={onCreateSession}
          disabled={isCreating}
          className="flex items-center gap-1.5 rounded-md bg-[#d4af37] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#c19a2e] disabled:opacity-50"
        >
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span>새 상담</span>
        </button>
      </div>

      {/* 세션 목록 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          // 로딩 스켈레톤
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-[#242424]" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          // 빈 상태
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="mb-3 h-10 w-10 text-gray-600" />
            <p className="text-sm text-gray-500">아직 상담 내역이 없습니다</p>
          </div>
        ) : (
          // 세션 목록
          <div className="space-y-1 p-2">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isCompleted = session.status === 'completed';

              return (
                <motion.button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full rounded-lg p-3 text-left transition-colors ${
                    isActive ? 'border-l-2 border-[#d4af37] bg-[#1a1a1a]' : 'hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`truncate text-sm font-medium ${
                            isActive ? 'text-white' : 'text-gray-300'
                          }`}
                        >
                          {session.title || '새 상담'}
                        </p>
                        {isCompleted && (
                          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                        )}
                      </div>
                      {session.lastMessage && (
                        <p className="mt-1 truncate text-xs text-gray-500">{session.lastMessage}</p>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <span className="text-xs text-gray-500">{formatDate(session.updatedAt)}</span>
                      <span
                        className={`text-xs ${isCompleted ? 'text-gray-500' : 'text-[#d4af37]'}`}
                      >
                        {session.questionCount}/2
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
