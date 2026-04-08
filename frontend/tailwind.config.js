/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif']
      },
      colors: {
        surface: {
          DEFAULT: '#0d0f14',
          1: '#13161e',
          2: '#1a1e28',
          3: '#222736'
        },
        accent: {
          red: '#ff3b3b',
          orange: '#ff7b29',
          yellow: '#f5c518',
          green: '#00d68f',
          blue: '#3b82f6',
          purple: '#a855f7',
          cyan: '#06b6d4'
        },
        border: {
          DEFAULT: '#ffffff0f',
          strong: '#ffffff1a'
        }
      },
      animation: {
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'blink': 'blink 1s step-end infinite'
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 }
        },
        slideIn: {
          from: { opacity: 0, transform: 'translateY(-8px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        },
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 }
        }
      }
    }
  },
  plugins: []
}
