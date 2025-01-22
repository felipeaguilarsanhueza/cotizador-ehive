/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // Para Next.js 13 con App Router
    "./pages/**/*.{js,ts,jsx,tsx}", // Para archivos en /pages/
    "./components/**/*.{js,ts,jsx,tsx}", // Para componentes
    // Agrega otras rutas o extensiones según tu proyecto
  ],
  theme: {
    extend: {
      colors: {
        green: {
          lightest: '#D3F4EB',
          lighter: '#AFEEDB',
          primary: '#5AD2AF',
          dark: '#2C9979',
        },
        gray: {
          lightest: '#F1F7FF',
          lighter: '#DDE9F8',
          primary: '#BFC9D4',
          dark: '#A4AEBB',
          moredark: '#6F7984',
          colddark: '#4A5056',
        },
      },
    },
  },
  plugins: [],
};
