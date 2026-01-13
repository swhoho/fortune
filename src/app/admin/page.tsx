'use client';

/**
 * 관리자 메인 페이지
 * 유저 검색 + 상세 조회 + 크레딧 보상 기능
 */
import { useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// 직접 import (동적 import 대신)
import { UserSearchSection } from '@/admin/components/UserSearchSection';
import { UserDetailSection } from '@/admin/components/UserDetailSection';

export default function AdminPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/home"
            className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            홈으로
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-white">관리자</h1>
              <p className="text-sm text-gray-500">유저 관리 및 크레딧 보상</p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        {/* 좌측: 유저 검색 */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <UserSearchSection onSelectUser={setSelectedUserId} selectedUserId={selectedUserId} />
        </div>

        {/* 우측: 유저 상세 */}
        <div>
          {selectedUserId ? (
            <UserDetailSection userId={selectedUserId} />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-[#1a1a1a] p-12 text-center">
              <Shield className="mb-4 h-12 w-12 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-400">유저를 선택하세요</h3>
              <p className="mt-2 text-sm text-gray-500">
                좌측에서 유저를 검색하고 선택하면
                <br />
                상세 정보를 확인할 수 있습니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
