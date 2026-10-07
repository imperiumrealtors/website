import { site } from '@/lib/config';

const LOGO_SRC = {
  dark: '/brand/imperium-logo-dark.png',
  light: '/brand/imperium-logo-white.png',
};

export function LogoMark({ size = 40, tone = 'dark' }: { size?: number; tone?: 'light' | 'dark' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC[tone]}
      alt={`${site.name} monogram`}
      style={{ display: 'block', flexShrink: 0, height: size, width: 'auto' }}
    />
  );
}

interface LogoProps {
  size?: number;
  tone?: 'light' | 'dark';
  withWordmark?: boolean;
}

export default function Logo({ size = 40, tone = 'dark', withWordmark = true }: LogoProps) {
  const nameColor = tone === 'light' ? '#FFFFFF' : 'var(--brand-deep)';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
      <LogoMark size={size} tone={tone} />
      {withWordmark && (
        <span style={{ display: 'block' }}>
          <span
            style={{
              display: 'block',
              fontFamily: "var(--font-serif)",
              fontWeight: 700,
              fontSize: size * 0.46,
              letterSpacing: '0.2px',
              color: nameColor,
              lineHeight: 1.1,
              transition: 'color var(--transition-base)',
            }}
          >
            {site.name}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: Math.max(8.5, size * 0.23),
              letterSpacing: '1.9px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--brand-gold)',
              lineHeight: 1.2,
            }}
          >
            {site.tagline}
          </span>
        </span>
      )}
    </span>
  );
}
