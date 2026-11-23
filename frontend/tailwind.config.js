/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // RajWorthman palette (sprint 2: deeper navy + burnt orange)
        brand: {
          navy: '#0A1A33',
          ink: '#050E1F',
          deep: '#071327',
          orange: '#E8650A',
          ember: '#C2410C',
          sand: '#FFF3E8',
          asphalt: '#1C2433',
        },
        // "gold" class names from sprint 1 now map to the darker brand orange
        gold: {
          50: '#FFF4EC',
          100: '#FFE3CC',
          200: '#FFC499',
          300: '#FF9F5C',
          400: '#F58226',
          500: '#E8650A',
          600: '#C2510A',
          700: '#9A3C07',
          800: '#6B2905',
          900: '#3D1703',
        },
        navy: {
          50: '#E7EBF2',
          100: '#C2CCDD',
          200: '#8597B6',
          300: '#4B6390',
          400: '#22396A',
          500: '#0F2246',
          600: '#0A1A33',
          700: '#071327',
          800: '#050E1F',
          900: '#020611',
        },
      },
      keyframes: {
        'slide-up': { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'lane': { from: { backgroundPosition: '0 0' }, to: { backgroundPosition: '-120px 0' } },
      },
      animation: {
        'slide-up': 'slide-up .35s cubic-bezier(.2,.8,.2,1) both',
        'fade-in': 'fade-in .3s ease both',
        'sheet-up': 'sheet-up .3s cubic-bezier(.2,.8,.2,1) both',
        'lane': 'lane 1.2s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(20, 33, 61, 0.08)',
        'glass-hover': '0 12px 40px rgba(20, 33, 61, 0.14)',
        'gold': '0 6px 24px rgba(232, 101, 10, 0.35)',
        'card': '0 2px 12px rgba(10, 26, 51, 0.08)',
        'sheet': '0 -8px 30px rgba(5, 14, 31, 0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
