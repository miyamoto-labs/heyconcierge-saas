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
        bg: '#FFF8F0',
        'bg-alt': '#F0F4FF',
        dark: '#2D2B55',
        primary: '#6C5CE7',
        'primary-light': '#A29BFE',
        accent: '#FF6B6B',
        'accent-soft': '#FFE0E0',
        mint: '#55EFC4',
        'mint-dark': '#00B894',
        yellow: '#FDCB6E',
        blue: '#74B9FF',
        pink: '#FD79A8',
        'pink-soft': '#FFF0F5',
        orange: '#E17055',
        muted: '#8B7FA8',
        'text-light': '#A0A0C0',
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
        quicksand: ['Quicksand', 'sans-serif'],
      },
      keyframes: {
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
      },
    },
  },
  plugins: [],
}
export default config
