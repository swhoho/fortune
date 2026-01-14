import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // 압축 활성화
  compress: true,

  // 빌드 출력 최적화 (Vercel 배포용)
  output: 'standalone',

  // lucide-react 트리쉐이킹 최적화 (FCP 개선)
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  // 실험적 기능
  experimental: {
    // CSS 최적화
    optimizeCss: true,
  },
};

export default withNextIntl(nextConfig);
