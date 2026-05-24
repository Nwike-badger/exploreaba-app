/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        serif: ['PlayfairDisplay_700Bold'],
        display: ['Fraunces_600SemiBold'],
    'display-italic': ['Fraunces_400Regular_Italic'],
    sans: ['DMSans_400Regular'],
      },
    },
  },
  plugins: [],
};