/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", 'sans-serif'],
        body:    ["'DM Sans'", 'sans-serif'],
        mono:    ["'JetBrains Mono'", 'monospace'],
      },
      colors: {
        bg:      '#080c14',
        surface: '#0e1420',
        card:    '#131a28',
        border:  '#1e2a3d',
        accent:  '#3b82f6',
        glow:    '#60a5fa',
        muted:   '#4a5568',
        text:    '#e2e8f0',
        dim:     '#94a3b8',
      },
      boxShadow: {
        glow:  '0 0 24px rgba(59,130,246,0.25)',
        card:  '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'pulse-slow':'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
