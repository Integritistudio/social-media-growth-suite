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
        'bg-base':    'var(--bg-base)',
        'bg-card':    'var(--bg-card)',
        'bg-input':   'var(--bg-input)',
        'border-base':'var(--border-base)',
        'text-base':  'var(--text-base)',
        'text-muted': 'var(--text-muted)',
      },
      fontFamily: {
        sans:    ['var(--font-brand)', 'Montserrat', 'sans-serif'],
        heading: ['var(--font-brand)', 'Montserrat', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
      },
    },
  },
  plugins: [],
};
