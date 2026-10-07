'use client';
import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import Logo from './Logo';
import { site, whatsappLink } from '@/lib/config';
import { corridors } from '@/lib/data';

const WhatsAppGlyph = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const socials = [
  { label: 'Instagram', path: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></> },
  { label: 'Facebook', path: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
  { label: 'YouTube', path: <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></> },
  { label: 'LinkedIn', path: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></> },
];

const quickLinks = [
  { href: '/plots', label: 'All Plots' },
  { href: '/layouts', label: 'Our Layouts' },
  { href: '/why-land', label: 'Why Buy Land' },
  { href: '/book-visit', label: 'Book a Site Visit' },
  { href: '/compare', label: 'Compare Plots' },
  { href: '/saved', label: 'Saved Plots' },
];

const linkStyle: React.CSSProperties = {
  display: 'block',
  color: 'rgba(255,255,255,0.62)',
  textDecoration: 'none',
  fontSize: 14,
  marginBottom: 11,
  transition: 'color var(--transition-fast)',
};

const headingStyle: React.CSSProperties = {
  color: 'var(--brand-gold)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 2,
  textTransform: 'uppercase',
  marginBottom: 20,
};

export default function Footer() {
  return (
    <footer style={{ background: 'var(--brand-deep)', color: 'white', paddingTop: 76 }}>
      <div className="shell">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 48, paddingBottom: 56 }}>
          <div>
            <div style={{ marginBottom: 20 }}>
              <Logo size={44} tone="light" />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
              {site.city}&apos;s land and plot specialists since {site.since}. Approved layouts,
              verified titles, and honest advice on where the ground under your feet is headed.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {socials.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.6)', transition: 'all var(--transition-fast)',
                    textDecoration: 'none',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {s.path}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 style={headingStyle}>Explore</h4>
            {quickLinks.map((l) => (
              <Link key={l.href} href={l.href} style={linkStyle}>{l.label}</Link>
            ))}
          </div>

          <div>
            <h4 style={headingStyle}>Growth Corridors</h4>
            {corridors.map((c) => (
              <Link key={c.id} href={`/plots?corridor=${encodeURIComponent(c.name)}`} style={linkStyle}>
                {c.name.split('—')[0].trim()} Plots
              </Link>
            ))}
          </div>

          <div>
            <h4 style={headingStyle}>Talk to Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <a href={site.phoneHref} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', color: 'rgba(255,255,255,0.72)', fontSize: 14 }}>
                <Phone size={16} style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }} />
                {site.phone}
              </a>
              <a href={`mailto:${site.email}`} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textDecoration: 'none', color: 'rgba(255,255,255,0.72)', fontSize: 14 }}>
                <Mail size={16} style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }} />
                {site.email}
              </a>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'rgba(255,255,255,0.72)', fontSize: 14 }}>
                <MapPin size={16} style={{ color: 'var(--brand-gold)', flexShrink: 0, marginTop: 2 }} />
                <span>{site.addressLines.map((line) => <span key={line} style={{ display: 'block' }}>{line}</span>)}</span>
              </div>
            </div>

            <a
              href={whatsappLink(`Hello ${site.name}, I would like details on your plot layouts.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-sm"
              style={{ marginTop: 24 }}
            >
              <WhatsAppGlyph /> WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '20px 0' }}>
        <div className="shell" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13 }}>
            © {new Date().getFullYear()} {site.legalName} · RERA {site.reraId}
          </p>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            {['Privacy Policy', 'Terms of Use', 'RERA Disclosure'].map((t) => (
              <a key={t} href="#" style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13, textDecoration: 'none' }}>{t}</a>
            ))}
          </div>
        </div>
      </div>

      <a
        href={whatsappLink(`Hello ${site.name}, I am interested in your plots.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="Chat on WhatsApp"
      >
        <WhatsAppGlyph size={26} />
      </a>
    </footer>
  );
}
