import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			/* 오행(五行) 색상 */
  			wood: '#4ade80',
  			fire: '#ef4444',
  			earth: '#f59e0b',
  			metal: '#e5e7eb',
  			water: '#1e3a8a',
  			/* 브랜드 색상 */
  			gold: '#d4af37',
  			ink: '#1a1a1a',
  			/* 다크 테마 색상 계층 */
  			dark: {
  				page: '#0a0a0a',      // L0: 페이지 배경
  				section: '#111111',   // L1: 섹션 배경
  				card: '#1a1a1a',      // L2: 카드 배경
  				hover: '#242424',     // L3: 호버/강조
  				input: '#2a2a2a',     // L4: 입력 필드
  				border: '#333333',    // 구분선/테두리
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		/* 성능 최적화: framer-motion 대체 CSS 애니메이션 */
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-out forwards',
  			'fade-in-slow': 'fadeIn 1.5s ease-out forwards',
  			'slide-up': 'slideUp 0.5s ease-out forwards',
  			'scale-in': 'scaleIn 0.5s ease-out forwards',
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' },
  			},
  			slideUp: {
  				'0%': { opacity: '0', transform: 'translateY(20px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			scaleIn: {
  				'0%': { opacity: '0', transform: 'scale(0.8)' },
  				'100%': { opacity: '1', transform: 'scale(1)' },
  			},
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
