/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "blue-mid": "#2563eb",
        "blue-dim": "rgba(59,130,246,0.1)",
        "blue-xdim": "rgba(59,130,246,0.03)",
        "border-blue": "rgba(59,130,246,0.15)",
        "surface": "#ffffff",
        "surface-2": "#f8fafc",
        "text": "#0f172a",
        "t2": "#475569",
        "t3": "#94a3b8",
        "border": "#e2e8f0",
        "err": "#ef4444"
      }
    },
  },
  plugins: [],
}
