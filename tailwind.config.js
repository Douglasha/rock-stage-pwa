/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oled: '#000000',
        stage: {
          bg: '#000000',
          surface: '#0d0e12',
          surfaceHover: '#171922',
          border: '#272935',
          textMuted: '#9ca3af',
          accent: '#eab308', // High visibility amber/gold for stage lighting
          cyan: '#06b6d4',
          green: '#22c55e',
          red: '#ef4444',
        }
      },
      fontSize: {
        'stage-sm': '1rem',
        'stage-base': '1.35rem',
        'stage-lg': '1.75rem',
        'stage-xl': '2.25rem',
        'stage-2xl': '3rem',
      },
      animation: {
        'pulse-subtle': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
