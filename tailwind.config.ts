import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9f6',
          100: '#d9efe6',
          200: '#b3dfce',
          300: '#82c8ae',
          400: '#54ab8c',
          500: '#358f71',
          600: '#26735b',
          700: '#215c4a',
          800: '#1d4a3d',
          900: '#193e34',
        },
      },
    },
  },
  plugins: [],
}
export default config
