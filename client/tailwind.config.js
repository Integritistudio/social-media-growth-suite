/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: 'var(--color-primary)',
        'color-secondary': 'var(--color-secondary)',
        'bg-base': 'var(--bg-base)',
        'bg-card': 'var(--bg-card)',
        'bg-input': 'var(--bg-input)',
        'bg-sidebar': 'var(--bg-sidebar)',
        'bg-elevated': 'var(--bg-elevated)',
        'border-base': 'var(--border-base)',
        'text-base': 'var(--text-base)',
        'text-muted': 'var(--text-muted)',
      },
      fontFamily: {
        sans: ['var(--font-brand)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        heading: ['var(--font-brand)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '650' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      backgroundImage: {
        'gradient-accent':
          'linear-gradient(145deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
        'gradient-subtle':
          'linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 100%, transparent) 0%, var(--bg-base) 100%)',
      },
    },
  },
  plugins: [],
};
