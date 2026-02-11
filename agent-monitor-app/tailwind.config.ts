import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        healthy: '#22c55e',
        warning: '#eab308',
        critical: '#ef4444',
        surface: '#0a0a0f',
        'surface-2': '#12121a',
        'surface-3': '#1a1a25',
        border: '#2a2a3a',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
