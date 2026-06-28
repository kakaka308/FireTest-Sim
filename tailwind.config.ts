import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        panel: '#1a1a2e',
        'panel-light': '#16213e',
        accent: '#e94560',
        'accent-green': '#00c853',
        'accent-yellow': '#ffd600',
        'accent-blue': '#2979ff',
      },
      fontFamily: {
        led: ['"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
