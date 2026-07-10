/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    // Spacing scale is locked to 4 / 8 / 12 / 16 / 24 / 32 / 48 (plus 0).
    // If you need another value, that is a design decision — add it here first.
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
    },
    // Minimum touch target (min-h-touch / min-w-touch) — accessibility rule.
    minHeight: { touch: '44px' },
    minWidth: { touch: '44px' },
    borderRadius: {
      none: '0px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      full: '9999px',
    },
    fontSize: {
      caption: ['13px', { lineHeight: '18px' }],
      body: ['16px', { lineHeight: '24px' }],
      title: ['22px', { lineHeight: '28px', fontWeight: '600' }],
      display: ['32px', { lineHeight: '38px', fontWeight: '700' }],
    },
    // Semantic colors only. Values live in global.css as CSS variables so
    // dark mode works without dark: variants sprinkled through the app.
    colors: {
      transparent: 'transparent',
      background: 'var(--color-background)',
      surface: 'var(--color-surface)',
      'surface-raised': 'var(--color-surface-raised)',
      border: 'var(--color-border)',
      primary: 'var(--color-primary)',
      'primary-pressed': 'var(--color-primary-pressed)',
      'on-primary': 'var(--color-on-primary)',
      foreground: 'var(--color-foreground)',
      'foreground-secondary': 'var(--color-foreground-secondary)',
      'foreground-muted': 'var(--color-foreground-muted)',
      danger: 'var(--color-danger)',
      'on-danger': 'var(--color-on-danger)',
      success: 'var(--color-success)',
    },
  },
  plugins: [],
};
