/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#0077b6',
            100: '#001825',
            200: '#003049',
            300: '#00486e',
            400: '#005f93',
            500: '#0077b6',
            600: '#00a2f9',
            700: '#3bbaff',
            800: '#7cd1ff',
            900: '#bee8ff'
          },
          secondary: {
            DEFAULT: '#0096c7',
            100: '#001e28',
            200: '#003c50',
            300: '#005a77',
            400: '#00779f',
            500: '#0096c7',
            600: '#06c1ff',
            700: '#44d0ff',
            800: '#83e0ff',
            900: '#c1efff'
          },
          federal_blue: {
            DEFAULT: '#03045e',
            100: '#010113',
            200: '#010226',
            300: '#020338',
            400: '#02044b',
            500: '#03045e',
            600: '#0508ae',
            700: '#0f12f8',
            800: '#5f61fa',
            900: '#afb0fd'
          },
          marian_blue: {
            DEFAULT: '#023e8a',
            100: '#000c1b',
            200: '#011836',
            300: '#012451',
            400: '#02306d',
            500: '#023e8a',
            600: '#035cd1',
            700: '#2381fc',
            800: '#6cabfd',
            900: '#b6d5fe'
          },
          honolulu_blue: {
            DEFAULT: '#0077b6',
            100: '#001825',
            200: '#003049',
            300: '#00486e',
            400: '#005f93',
            500: '#0077b6',
            600: '#00a2f9',
            700: '#3bbaff',
            800: '#7cd1ff',
            900: '#bee8ff'
          },
          blue_green: {
            DEFAULT: '#0096c7',
            100: '#001e28',
            200: '#003c50',
            300: '#005a77',
            400: '#00779f',
            500: '#0096c7',
            600: '#06c1ff',
            700: '#44d0ff',
            800: '#83e0ff',
            900: '#c1efff'
          },
          pacific_cyan: {
            DEFAULT: '#00b4d8',
            100: '#00242b',
            200: '#004756',
            300: '#006b81',
            400: '#008fab',
            500: '#00b4d8',
            600: '#12d8ff',
            700: '#4ee1ff',
            800: '#89ebff',
            900: '#c4f5ff'
          },
          vivid_sky_blue: {
            DEFAULT: '#48cae4',
            100: '#082d34',
            200: '#105a69',
            300: '#17879d',
            400: '#1fb4d1',
            500: '#48cae4',
            600: '#6dd5e9',
            700: '#92dfef',
            800: '#b6eaf4',
            900: '#dbf4fa'
          },
          non_photo_blue: {
            DEFAULT: '#90e0ef',
            100: '#0a3a43',
            200: '#137586',
            300: '#1dafc9',
            400: '#4ccfe6',
            500: '#90e0ef',
            600: '#a6e7f2',
            700: '#bcedf5',
            800: '#d2f3f9',
            900: '#e9f9fc'
          },
          light_cyan: {
            DEFAULT: '#caf0f8',
            100: '#0a444f',
            200: '#15889f',
            300: '#2ac4e3',
            400: '#79daee',
            500: '#caf0f8',
            600: '#d4f3f9',
            700: '#dff6fb',
            800: '#e9f9fc',
            900: '#f4fcfe'
          }
        },
        fontFamily: {
          sans: ["Satoshi", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],       // default body font
          heading: ["Archivo", "sans-serif"],                  // for headings
          mono: ["Roboto Mono", "ui-monospace", "monospace"],  // for code/inputs
          alt: ["Inconsolata", "monospace"],                   // optional alt font
        },
        animation: {
          'fade-in': 'fadeIn 0.3s ease-out',
          'slide-up': 'slideUp 0.3s ease-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          slideUp: {
            '0%': { opacity: '0', transform: 'translateY(20px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
        },
      },
    },
    plugins: [],
  };
  