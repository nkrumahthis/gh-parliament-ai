/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            p: {
              marginTop: '0.75em',
              marginBottom: '0.75em',
            },
            strong: {
              color: 'inherit',
              fontWeight: '600',
            },
            li: {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
            'ol > li': {
              paddingLeft: '0.25em',
            },
            'ul > li': {
              paddingLeft: '0.25em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}