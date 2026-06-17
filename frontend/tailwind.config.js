/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a4bcfd',
          400: '#7f96fa',
          500: '#6172f5',
          600: '#4f54ea',
          700: '#4241d1',
          800: '#3637a8',
          900: '#303485',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#080e1a',
        },
        accent: {
          cyan: '#06b6d4',
          purple: '#8b5cf6',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
        'count-up': 'countUp 0.5s ease-out',
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: 0, transform: 'translateX(-16px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(97, 114, 245, 0.4)' },
          '50%': { boxShadow: '0 0 20px 8px rgba(97, 114, 245, 0.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(97, 114, 245, 0.35)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 20px rgba(244, 63, 94, 0.35)',
        card: '0 4px 24px rgba(0,0,0,0.08)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
