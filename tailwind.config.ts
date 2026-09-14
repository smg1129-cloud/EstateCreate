import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy — a serious, trust-forward palette for a law-firm product.
        brand: {
          50: '#eef2f9',
          100: '#d6e0ef',
          200: '#adc1df',
          300: '#7f9ccb',
          400: '#5478b4',
          500: '#3a5c98',
          600: '#2d477a',
          700: '#263a63',
          800: '#1f2f4f',
          900: '#152238',
        },
      },
    },
  },
  plugins: [],
}
export default config
