'use client';

/**
 * 유저 검색 섹션 컴포넌트
 */
import { useState, useEffect } from 'react';
import { Search, Loader2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { UserSearchResult } from '@/admin/api/users';

/** debounce 훅 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface UserSearchSectionProps {
  onSelectUser: (userId: string) => void;
  selectedUserId: string | null;
}

export function UserSearchSection({ onSelectUser, selectedUserId }: UserSearchSectionProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/users?q=${encodeURIComponent(debouncedQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('유저 검색 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [debouncedQuery]);

  return (
    <div className="rounded-2xl bg-[#1a1a1a] p-6">
      <h2 className="mb-4 font-serif text-lg font-semibold text-white">유저 검색</h2>

      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          type="text"
          placeholder="user_id 또는 이메일로 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-[#333] bg-[#242424] pl-10 text-white placeholder:text-gray-500"
        />
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="mt-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#d4af37]" />
        </div>
      )}

      {/* 검색 결과 */}
      {!isLoading && users.length > 0 && (
        <div className="mt-4 max-h-80 divide-y divide-[#333] overflow-y-auto rounded-lg border border-[#333]">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelectUser(user.id)}
              className={`w-full px-4 py-3 text-left transition-colors hover:bg-[#242424] ${
                selectedUserId === user.id ? 'bg-[#242424]' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#333]">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{user.email}</p>
                  <p className="truncate text-xs text-gray-500">{user.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#d4af37]">{user.credits}C</p>
                  {user.subscription_status === 'active' && (
                    <span className="text-xs text-green-400">구독중</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {!isLoading && query.length >= 2 && users.length === 0 && (
        <p className="mt-4 text-center text-sm text-gray-500">검색 결과가 없습니다</p>
      )}

      {/* 안내 메시지 */}
      {query.length < 2 && (
        <p className="mt-4 text-center text-sm text-gray-500">2자 이상 입력하세요</p>
      )}
    </div>
  );
}
