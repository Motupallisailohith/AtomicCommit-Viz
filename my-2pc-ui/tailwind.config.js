/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#300924',
          text: '#e6e6e6',
          accent: '#ff79c6',
          success: '#50fa7b',
          warning: '#ffb86c',
          error: '#ff5555',
          muted: '#6272a4',
          border: '#44475a',
          highlight: '#3b1930'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'cursor-blink': 'cursor-blink 1.5s steps(2) infinite'
      },
      keyframes: {
        'cursor-blink': {
          '0%, 100%': { opacity: 0 },
          '50%': { opacity: 1 }
        }
      }
    },
  },
  plugins: [],
};