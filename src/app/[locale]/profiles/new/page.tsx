'use client';

/**
 * 프로필 등록 페이지
 * Task 3.1: /[locale]/profiles/new/page.tsx
 */
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/components/profile';
import { useCreateProfile } from '@/hooks/use-profiles';
import { Link, useRouter } from '@/i18n/routing';
import type { CreateProfileInput } from '@/lib/validations/profile';

export default function NewProfilePage() {
  const t = useTranslations('profile');
  const router = useRouter();
  const { mutate: createProfile, isPending } = useCreateProfile();

  /**
   * 프로필 생성 핸들러
   */
  const handleSubmit = (data: CreateProfileInput) => {
    createProfile(data, {
      onSuccess: (response) => {
        toast.success(t('toast.createSuccess'));
        router.push(`/profiles/${response.data.id}`);
      },
      onError: (error) => {
        toast.error(error.message || t('toast.error'));
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-[#333] bg-[#111111]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Button variant="ghost" size="icon" asChild className="text-white hover:bg-[#242424]">
            <Link href="/profiles">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-semibold text-white">{t('pageTitle.new')}</h1>
          <div className="w-10" /> {/* 균형을 위한 빈 공간 */}
        </div>
      </header>

      {/* 폼 */}
      <main className="mx-auto max-w-2xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[#1a1a1a] p-6"
        >
          <ProfileForm
            isSubmitting={isPending}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </motion.div>
      </main>
    </div>
  );
}
