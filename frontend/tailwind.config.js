/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'reliability': '#22c55e',
        'security': '#ef4444',
        'cost': '#f59e0b',
        'operations': '#3b82f6',
        'performance': '#8b5cf6',
      }
    },
  },
  plugins: [],
}
