/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    theme: {
      extend: {
        colors: {
          brand: {
            10: '#CBE4DE',
            50: '#2A816C',
            100: '#1E6462',
            200: '#114658',
            300: '#0B373C',
            400: '#052326',
          }
        }
      }
    },
    plugins: [import('tailwindcss-primeui')]
  }