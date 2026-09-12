/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Refined Luxury Palette: Light Olive Green, Cream & Light Brown
        palette: {
          // Cream Palette (Zero pure white)
          cream: '#FAF7F0',
          creamLight: '#FAF7F0',
          creamWarm: '#FAF7F0',
          creamSoft: '#EDE6D6',
          creamCard: '#EFE8D8',
          creamBorder: '#DACDB3',

          // Light Olive Green Palette (Airy, luxurious, no dark muddy tones)
          olive: '#6D7F62',
          oliveLight: '#85977A',
          olivePale: '#A3B498',
          oliveTint: '#E8EDE3',
          oliveDeep: '#4C5D41',
          oliveHero: '#45563D',
          oliveDark: '#3F4F36',
          darkCard: '#45563D',

          // Light Brown / Warm Sand / Camel Palette
          lightBrown: '#BA9977',
          lightBrownSoft: '#D4BC9F',
          lightBrownDark: '#997654',
          brownDeep: '#544131',
          brownText: '#362B21',
          deepBrown: '#362B21',
          brownMuted: '#4E3C2B',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Jost"', '"Manrope"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
