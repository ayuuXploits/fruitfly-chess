/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        abyss: '#0a0e17',
        glass: 'rgba(13, 19, 33, 0.75)',
        'neon-cyan': '#00f0ff',
        'neon-purple': '#bd00ff',
        'neon-green': '#00ff66',
      },
    },
  },
  plugins: [],
}
