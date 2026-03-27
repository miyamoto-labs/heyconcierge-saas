import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // === NEW: Professional SaaS palette (used by landing page) ===
        'saas-dark': '#0F172A',
        'saas-text': '#334155',
        'saas-muted': '#64748B',
        'saas-light': '#94A3B8',
        'saas-border': '#E2E8F0',
        'saas-bg': '#FAF9F7',
        'saas-subtle': '#F5F3F0',
        'saas-success': '#10B981',
        'primary-dark': '#5A4BD1',

        // === NEW: Earthy/olive redesign palette ===
        'grove': {
          DEFAULT: '#4A5D23',
          dark: '#3B4A1C',
          light: '#6B7F3A',
          lighter: '#8FA855',
          subtle: '#F4F5EF',
          bg: '#FAFAF7',
        },
        'earth-dark': '#1A1A1A',
        'earth-text': '#2C2C2C',
        'earth-muted': '#6B6B6B',
        'earth-light': '#9B9B9B',
        'earth-border': '#E5E5E0',

        // === LEGACY: Keep all old colors for dashboard/auth/admin pages ===
        bg: '#FFF8F0',
        'bg-alt': '#F0F4FF',
        dark: '#2D2B55',
        primary: '#6C5CE7',
        'primary-light': '#A29BFE',
        accent: '#FF6B6B',
        'accent-soft': '#FFE0E0',
        mint: '#55EFC4',
        'mint-dark': '#00B894',
        'mint-soft': '#E8F8F0',
        yellow: '#FDCB6E',
        'yellow-soft': '#FFF5E8',
        blue: '#74B9FF',
        pink: '#FD79A8',
        'pink-soft': '#FFF0F5',
        orange: '#E17055',
        muted: '#8B7FA8',
        'text-light': '#A0A0C0',
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
        quicksand: ['Quicksand', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
      },
      keyframes: {
        // === NEW: Subtle professional animations ===
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        typing: {
          '0%, 80%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
        // === LEGACY: Keep old animations for other pages ===
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(30px, -30px) scale(1.05)' },
          '50%': { transform: 'translate(-20px, 20px) scale(0.95)' },
          '75%': { transform: 'translate(15px, 10px) scale(1.02)' },
        },
        bounce_slow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulse_dot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.3)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          from: { opacity: '0', transform: 'scale(0.5)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        // === NEW ===
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
        'fade-in-up-1': 'fadeInUp 0.6s ease-out 0.1s both',
        'fade-in-up-2': 'fadeInUp 0.6s ease-out 0.2s both',
        'fade-in-up-3': 'fadeInUp 0.6s ease-out 0.3s both',
        'fade-in': 'fadeIn 0.5s ease-out both',
        'slide-in-right': 'slideInRight 0.7s ease-out 0.3s both',
        'typing-1': 'typing 1.4s infinite 0s',
        'typing-2': 'typing 1.4s infinite 0.2s',
        'typing-3': 'typing 1.4s infinite 0.4s',
        // === LEGACY ===
        float: 'float 20s infinite ease-in-out',
        'float-slow': 'float 8s infinite ease-in-out',
        'bounce-slow': 'bounce_slow 3s infinite ease-in-out',
        'pulse-dot': 'pulse_dot 2s infinite',
        'slide-up': 'slideUp 0.8s ease-out',
        'slide-up-delay': 'slideUp 1s ease-out 0.2s both',
        'pop-in': 'popIn 0.5s ease-out both',
        'pop-in-1': 'popIn 0.5s ease-out 1s both',
        'pop-in-2': 'popIn 0.5s ease-out 1.5s both',
        'pop-in-3': 'popIn 0.5s ease-out 2s both',
        sparkle: 'sparkle 3s infinite',
        'sparkle-1': 'sparkle 3s infinite 1s',
        'sparkle-2': 'sparkle 3s infinite 2s',
        'sparkle-3': 'sparkle 3s infinite 0.5s',
      },
      boxShadow: {
        card: '0 8px 30px rgba(45, 43, 85, 0.06)',
        'card-hover': '0 12px 40px rgba(108, 92, 231, 0.12)',
        // NEW
        'saas-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'saas-md': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'saas-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
        'saas-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'saas-primary': '0 4px 14px rgba(108, 92, 231, 0.25)',
        'saas-primary-lg': '0 8px 25px rgba(108, 92, 231, 0.35)',
      },
    },
  },
  plugins: [],
}
export default config
