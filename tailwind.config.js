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
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'mint-sm': '0 0 15px rgba(67, 214, 160, 0.25)',
        'mint-md': '0 0 25px rgba(67, 214, 160, 0.35)',
        'mint-lg': '0 0 40px rgba(67, 214, 160, 0.5)',
        'emerald-card': '0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(19, 168, 121, 0.08)',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'beacon': 'beaconPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'float-reverse': 'floatReverse 7s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        beaconPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(6px)' },
        },
      },
    },
  },
  plugins: [],
}
