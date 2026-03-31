import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0D0D0D',
        surface: '#161616',
        elevated: '#1F1F1F',
        border: '#2A2A2A',
        accent: '#FF4D00',       // Burn orange
        'accent-soft': '#FF6B35',
        'text-primary': '#F0F0F0',
        'text-secondary': '#9A9A9A',
        'text-muted': '#5A5A5A',
        'green-soft': '#22C55E',
        'red-soft': '#EF4444',
        'orange-soft': '#F97316',
        'purple-soft': '#A855F7',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        lg: '12px',
        xl: '16px'
      }
    }
  },
  plugins: []
} satisfies Config
