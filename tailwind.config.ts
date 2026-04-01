import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        '3xl': '1920px', // Full HD
        '4xl': '2560px', // 2K / WQHD
        '5xl': '3840px', // 4K / UHD
      },
      boxShadow: {
        'shadow-m':
          '0px 0px 0px 1px rgba(152, 161, 178, 0.10), 0px 15px 35px -5px rgba(17, 24, 38, 0.15), 0px 5px 15px 0px rgba(0, 0, 0, 0.08)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 40px rgba(37, 99, 235, 0.15)',
        'glow-purple': '0 0 40px rgba(124, 58, 237, 0.15)',
      },
      fontFamily: {
        averta: 'var(--averta)',
        inter: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        jakarta: ['var(--font-jakarta)', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)',
        'hero-gradient-dark': 'linear-gradient(135deg, #1e40af 0%, #5b21b6 50%, #1e40af 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)',
        'cta-gradient': 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
      },
      colors: {
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        icon: {
          DEFAULT: 'var(--icon-color)',
        },
        surface: {
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          modal: 'var(--surface-modal)',
        },
        skeleton: {
          primary: 'var(--skeleton-primary)',
        },
        input: {
          fill: {
            enabled: 'var(--input-fill-enabled)',
            disabled: 'var(--input-fill-disabled)',
          },
        },
        button: {
          primary: {
            fill: {
              enabled: 'var(--button-primary-fill-enabled)',
              active: 'var(--button-primary-fill-active)',
            },
            label: {
              all: 'var(--button-primary-label-all)',
            },
          },
          outline: {
            stroke: {
              enabled: 'var(--button-outline-stroke-enabled)',
              disabled: 'var(--button-outline-stroke-disabled)',
              active: 'var(--button-outline-stroke-active)',
            },
            label: {
              enabled: 'var(--button-outline-label-enabled)',
            },
          },
          tertiary: {
            fill: {
              pressed: 'var(--button-tertiary-fill-pressed)',
            },
          },
        },
        brand: {
          blue: 'var(--interswitch-blue)',
          red: 'var(--interswitch-red)',
          highlight: 'var(--highlight)',
        },
        neutral: {
          100: 'var(--neutral-100)',
          200: 'var(--neutral-200)',
          300: 'var(--neutral-300)',
          400: 'var(--neutral-400)',
          500: 'var(--neutral-500)',
          600: 'var(--neutral-600)',
          700: 'var(--neutral-700)',
          900: 'var(--neutral-900)',
        },
        'active-blue': {
          100: 'var(--active-blue-100)',
          200: 'var(--active-blue-200)',
          300: 'var(--active-blue-300)',
          400: 'var(--active-blue-400)',
          500: 'var(--active-blue-500)',
        },
        'active-yellow': {
          100: 'var(--active-yellow-100)',
          200: 'var(--active-yellow-200)',
          300: 'var(--active-yellow-300)',
          400: 'var(--active-yellow-400)',
          500: 'var(--active-yellow-500)',
          600: 'var(--active-yellow-600)',
        },
        'active-red': {
          100: 'var(--active-red-100)',
          200: 'var(--active-red-200)',
          300: 'var(--active-red-300)',
          400: 'var(--active-red-400)',
        },
        'active-green': {
          100: 'var(--active-green-100)',
          200: 'var(--active-green-200)',
          300: 'var(--active-green-300)',
          400: 'var(--active-green-400)',
          500: 'var(--active-green-500)',
          600: 'var(--active-green-600)',
        },
        'primary-blue': {
          100: 'var(--primary-blue-100)',
          200: 'var(--primary-blue-200)',
          300: 'var(--primary-blue-300)',
          400: 'var(--primary-blue-400)',
          500: 'var(--primary-blue-500)',
          600: 'var(--primary-blue-600)',
        },
        'primary-red': {
          100: 'var(--primary-red-100)',
          200: 'var(--primary-red-200)',
          300: 'var(--primary-red-300)',
          400: 'var(--primary-red-400)',
          500: 'var(--primary-red-500)',
        },
        pop: {
          blue: 'var(--pop-blue)',
        },
        selection: {
          DEFAULT: 'var(--selection-color)',
        },
        // New homepage color scheme
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(-0.5%)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-25%)' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.5s ease-in-out forwards',
        slideOut: 'slideOut 0.5s ease-in-out forwards',
        float: 'float 3s ease-in-out infinite',
        fadeIn: 'fadeIn 0.6s ease-out forwards',
        pulse: 'pulse 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
};
export default config;
