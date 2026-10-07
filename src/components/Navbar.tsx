'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, Heart } from 'lucide-react';
import Logo from './Logo';
import { site } from '@/lib/config';

const links = [
  { href: '/plots', label: 'Find Plots' },
  { href: '/layouts', label: 'Our Layouts' },
  { href: '/why-land', label: 'Why Land' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const solid = scrolled || open;

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 500,
          height: 'var(--nav-height)',
          transition: 'background var(--transition-base), box-shadow var(--transition-base)',
          background: solid ? 'rgba(255,255,255,0.97)' : 'transparent',
          backdropFilter: solid ? 'blur(20px)' : 'none',
          boxShadow: solid ? 'var(--shadow-md)' : 'none',
          borderBottom: solid ? '1px solid var(--border-subtle)' : 'none',
        }}
      >
        <div className="shell" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }} aria-label={`${site.name} home`}>
            <Logo size={40} tone={solid ? 'dark' : 'light'} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 30 }} className="hidden-mobile">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    color: active
                      ? 'var(--brand-gold)'
                      : solid ? 'var(--text-primary)' : 'rgba(255,255,255,0.92)',
                    paddingBottom: 3,
                    borderBottom: active ? '2px solid var(--brand-gold)' : '2px solid transparent',
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  {l.label}
                </Link>
              );
            })}

            <Link
              href="/saved"
              aria-label="Saved plots"
              style={{ display: 'flex', color: solid ? 'var(--text-secondary)' : 'rgba(255,255,255,0.85)' }}
            >
              <Heart size={18} />
            </Link>

            <Link href="/book-visit" className="btn btn-primary btn-sm">
              Book a Site Visit
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="show-mobile"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: solid ? 'var(--brand-deep)' : 'white',
              display: 'none', padding: 4,
            }}
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {open && (
        <div
          className="parcel-grid"
          style={{
            position: 'fixed', inset: 0, zIndex: 499,
            background: 'var(--gradient-hero)',
            display: 'flex', flexDirection: 'column',
            padding: 'calc(var(--nav-height) + 24px) 24px 32px',
            animation: 'fadeIn 0.2s ease',
            overflowY: 'auto',
          }}
        >
          {[...links, { href: '/saved', label: 'Saved Plots' }].map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
              textDecoration: 'none', fontSize: 26, fontWeight: 600,
              color: 'white', padding: '18px 0',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
              fontFamily: "var(--font-serif)",
            }}>{l.label}</Link>
          ))}

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/book-visit" onClick={() => setOpen(false)} className="btn btn-primary btn-lg">Book a Site Visit</Link>
            <a href={site.phoneHref} className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(255,255,255,0.35)', color: 'white' }}>
              <Phone size={16} /> {site.phone}
            </a>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 32, color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
            © {new Date().getFullYear()} {site.legalName} · {site.city}, {site.state}
          </div>
        </div>
      )}
    </>
  );
}
