import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'terminal-green': '#00FF00',
        'terminal-cyan': '#00FFFF',
        'neon-magenta': '#FF00FF',
        'deep-black': '#0D0D0D',
        'dark-bg': '#1A1A2E',
      },
      fontFamily: {
        mono: ['Courier New', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
