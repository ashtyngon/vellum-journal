/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "var(--color-primary)",
        "primary-dark": "#b05d0e",
        "primary-soft": "#fcd34d",
        "background-light": "var(--color-bg)",
        "background-dark": "#221910",
        "background-cream": "#F9F5F0",
        "surface-light": "var(--color-surface)",
        "surface-dark": "#2d241b",
        "wood-light": "var(--color-border)",
        "wood-dark": "#3e3226",
        "vellum": "#fcfaf8",
        "paper": "var(--color-paper)",
        "ink": "var(--color-ink)",
        "ink-light": "var(--color-ink-light)",
        "ink-navy": "#1e293b",
        "ink-sepia": "#5d4037",
        "ink-charcoal": "#333333",
        "pencil": "var(--color-pencil)",
        "warm-grey": "#2c2621",
        "bronze": "#a87b51",
        "sage": "#8fa88f",
        "rose": "#C47C7C",
        "tension": "#C47C7C",
        "graphite": "#A8A29E",
        "accent": "#9c6644",
      },
      fontFamily: {
        "header": ["'Sorts Mill Goudy'", "serif"],
        "handwriting": ["'Architects Daughter'", "cursive"],
        "body": ["'Crimson Pro'", "serif"],
        "sans": ["'Noto Sans'", "sans-serif"],
        "display": ["'Newsreader'", "serif"], // Used in screens 5, 6, 7, 8
        "mono": ["'Space Mono'", "monospace"],
        "spline": ["'Spline Sans'", "sans-serif"],
        "jakarta": ["'Plus Jakarta Sans'", "sans-serif"],
      },
      boxShadow: {
        "book": "2px 0px 5px rgba(0,0,0,0.1), inset 3px 0px 5px rgba(255,255,255,0.2), inset -3px 0px 5px rgba(0,0,0,0.1)",
        "shelf": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 8px 6px -6px rgba(0,0,0,0.1)",
        "card": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "open-book": "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(0,0,0,0.1)",
        "paper": "2px 4px 12px rgba(0,0,0,0.08), 0 0 2px rgba(0,0,0,0.04)",
        "polaroid": "2px 4px 12px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.1)",
        "soft": "var(--shadow-soft)",
        "hover": "0 10px 25px -5px rgba(236, 127, 19, 0.15), 0 8px 10px -6px rgba(236, 127, 19, 0.1)",
        "float": "0 10px 40px -10px rgba(60, 50, 40, 0.1), 0 0 0 1px rgba(255,255,255,0.6) inset",
        "vellum-card": "0 12px 24px -6px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02), inset 0 0 0 1px rgba(255, 255, 255, 0.8)",
        "inner-glow": "inset 0 0 20px rgba(217, 119, 6, 0.05)",
        "lifted": "0 10px 30px -4px rgba(61, 58, 54, 0.12)",
        "inner-shallow": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
      },
      backgroundImage: {
        'warm-wood': "url('https://images.unsplash.com/photo-1579273166152-d725a4e2b755?q=80&w=2548&auto=format&fit=crop&ixlib=rb-4.0.3')",
        'grid-pattern': "radial-gradient(#e7e5e4 1px, transparent 1px)",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s linear infinite',
        'focus-pulse': 'pulse-glow 3s infinite cubic-bezier(0.4, 0, 0.6, 1)',
      },
      keyframes: {
        float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
        },
        sparkle: {
            '0%, 100%': { opacity: 0 },
            '50%': { opacity: 1 },
        },
        'pulse-glow': {
            '0%': { boxShadow: '0 0 0 0 rgba(217, 119, 6, 0.3)' },
            '70%': { boxShadow: '0 0 0 8px rgba(217, 119, 6, 0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(217, 119, 6, 0)' },
        }
      }
    },
  },
  plugins: [],
}
