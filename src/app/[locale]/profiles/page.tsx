'use client';

/**
 * 프로필 목록 페이지
 * Task 4.1: /[locale]/profiles/page.tsx
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ProfileList } from '@/components/profile';
import { useProfiles } from '@/hooks/use-profiles';
import { Link, useRouter } from '@/i18n/routing';
import type { ProfileResponse } from '@/types/profile';

export default function ProfilesPage() {
  const t = useTranslations('profile');
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState<'name' | 'created'>('created');
  const { data: profiles, isLoading } = useProfiles(sortOrder);

  /**
   * 프로필 선택 핸들러
   */
  const handleSelectProfile = (profile: ProfileResponse) => {
    router.push(`/profiles/${profile.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/home">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-semibold text-[#1a1a1a]">
            {t('pageTitle.list')}
          </h1>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profiles/new">
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* 목록 */}
      <main className="mx-auto max-w-2xl px-6 py-8">
        <ProfileList
          profiles={profiles || []}
          isLoading={isLoading}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          onSelectProfile={handleSelectProfile}
        />
      </main>

      {/* FAB (모바일) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 md:hidden"
      >
        <Button
          size="lg"
          asChild
          className="h-14 w-14 rounded-full bg-gradient-to-r from-[#d4af37] to-[#c19a2e] shadow-lg"
        >
          <Link href="/profiles/new">
            <Plus className="h-6 w-6" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
