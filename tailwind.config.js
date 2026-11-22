/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#080B09',
        surface: {
          0: '#101512',
          1: '#121A16',
          2: '#18221D',
          3: '#1F2E27',
          subtle: '#141C18',
        },
        bp: {
          void: '#080B09',
          surface0: '#101512',
          surface1: '#121A16',
          surface2: '#18221D',
          surface3: '#1F2E27',
          textPrimary: '#F5F7F5',
          textSecondary: '#A3ADA6',
          textMuted: '#737F77',
          mint: '#43D6A0',
          emerald: '#13A879',
          deepEmerald: '#063B2D',
          borderSubtle: 'rgba(255, 255, 255, 0.09)',
        },
        pulse: {
          mint: '#43D6A0',
          emerald: '#13A879',
          deepEmerald: '#063B2D',
          cyan: '#43D6A0', // alias for compatibility
          blue: '#13A879',
          amber: '#F59E0B',
          orange: '#F97316',
          crimson: '#EF4444',
          violet: '#8B5CF6',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.09)',
          default: 'rgba(255, 255, 255, 0.14)',
          prominent: 'rgba(255, 255, 255, 0.22)',
          emerald: 'rgba(19, 168, 121, 0.3)',
          mint: 'rgba(67, 214, 160, 0.4)',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'surface': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      transitionTimingFunction: {
        'craft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
