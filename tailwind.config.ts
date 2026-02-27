import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'forge-black': '#0d0d0d',
        'forge-dark': '#1a1a1a',
        'grid-line': '#2a2a2a',
        'accent-orange': '#ff6b35',
        'accent-cyan': '#00d4ff',
        'text-primary': '#f5f5f5',
        'text-secondary': '#999999',
        'text-dim': '#666666',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
        display: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        'glow-orange': '0 0 30px rgba(255, 107, 53, 0.4)',
        'glow-cyan': '0 0 30px rgba(0, 212, 255, 0.3)',
      },
    },
  },
  plugins: [],
};
export default config;
