/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#14AE5C',
          light: '#CFF7D3',
          dark: '#009951',
        },
        button: {
          primary: {
            bg: '#14AE5C',
            text: '#EBFFEE',
            hover: '#0D8A4A',
          },
          secondary: {
            bg: '#CFF7D3',
            text: '#009951',
            hover: '#B5E5BC',
          },
        },
      },
    },
  },
  plugins: [],
} 