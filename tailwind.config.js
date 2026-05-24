/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1a1a2e',
        'bg-secondary': '#16213e',
        'bg-card': '#0f3460',
        'text-primary': '#eaeaea',
        'text-secondary': '#a0a0a0',
        'accent': '#e94560',
        'ball-red': '#ff4757',
        'ball-blue': '#3742fa',
      }
    },
  },
  plugins: [],
}
