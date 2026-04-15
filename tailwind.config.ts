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
        'accent':        '#DA7756',
        'accent-bright': '#E8985C',
        'accent-dim':    '#B85D3A',
        'deep-black':    '#0A0908',
        'dark-bg':       '#141210',
      },
      fontFamily: {
        mono: ['Courier New', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
