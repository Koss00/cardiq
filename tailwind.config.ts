import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        wide: '1200px',
      },
      colors: {
        navy: {
          950: '#060E1C',
          900: '#0A1628',
          800: '#0F1E38',
          700: '#152645',
          600: '#1C3058',
        },
        gold: {
          300: '#FAE07A',
          400: '#F5C842',
          500: '#D4A017',
          600: '#A07810',
        },
        chrome: {
          100: '#F0F2F5',
          200: '#D8DCE5',
          300: '#B8C0D0',
          400: '#8A96AB',
          500: '#626E82',
          600: '#4A5568',
          700: '#2D3748',
          800: '#1A2235',
        },
        electric: {
          DEFAULT: '#00D4AA',
          dim: '#00997A',
          glow: 'rgba(0,212,170,0.15)',
        },
        teal: {
          DEFAULT: '#00D4AA',
          dim: '#00997A',
          glow: 'rgba(0,212,170,0.15)',
        },
        surface: '#111D33',
        'border-base': '#1E2D45',
        muted: '#8892A4',
        prizm: {
          red: '#FF4D4D',
          purple: '#7B2FFF',
          green: '#00FF88',
          pink: '#FF69B4',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        card: ['var(--font-card)', 'sans-serif'],
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'holo-sweep': 'holo-sweep 3s ease-in-out infinite',
        'chrome-sweep': 'chrome-sweep 4s linear infinite',
        'pack-rip': 'pack-rip 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'prizm-shift': 'prizm-shift 5s ease infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'holo-sweep': {
          '0%':   { backgroundPosition: '-200% 50%' },
          '60%':  { backgroundPosition: '200% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'chrome-sweep': {
          from: { backgroundPosition: '200% center' },
          to:   { backgroundPosition: '-200% center' },
        },
        'pack-rip': {
          '0%':   { opacity: '0', transform: 'translateY(-24px) scale(0.94) rotateX(8deg)', filter: 'brightness(2) saturate(0)' },
          '35%':  { filter: 'brightness(1.4) saturate(0.6)' },
          '70%':  { transform: 'translateY(3px) scale(1.015) rotateX(-1deg)', filter: 'brightness(1.05) saturate(1.3)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1) rotateX(0)', filter: 'brightness(1) saturate(1)' },
        },
        'prizm-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%', opacity: '0.35' },
          '25%':      { opacity: '0.55' },
          '50%':      { backgroundPosition: '100% 50%', opacity: '0.35' },
          '75%':      { opacity: '0.55' },
        },
      },
      backgroundImage: {
        'gold-shimmer':
          'linear-gradient(105deg, transparent 40%, rgba(245,200,66,0.18) 50%, transparent 60%)',
        'navy-gradient':
          'linear-gradient(135deg, #0A1628 0%, #0F1E38 100%)',
        'chrome-gradient':
          'linear-gradient(90deg, #C0C8D8 0%, #FFFFFF 20%, #F5C842 35%, #00D4FF 50%, #FFFFFF 65%, #7B2FFF 80%, #C0C8D8 100%)',
        'prizm-gradient':
          'linear-gradient(135deg, #00D4FF 0%, #7B2FFF 25%, #FF3366 50%, #F5C842 75%, #00FF88 100%)',
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(245,200,66,0.25), 0 4px 24px rgba(245,200,66,0.08)',
        'gold-lg': '0 0 0 1px rgba(245,200,66,0.35), 0 8px 40px rgba(245,200,66,0.15)',
        navy: '0 4px 24px rgba(6,14,28,0.6)',
        'chrome-card': '0 0 0 1px rgba(192,200,216,0.2), 0 8px 32px rgba(6,14,28,0.5)',
        'chrome-card-hover': '0 20px 50px rgba(6,14,28,0.6), 0 0 40px rgba(0,212,255,0.1), 0 0 20px rgba(245,200,66,0.06)',
        electric: '0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(0,212,255,0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
