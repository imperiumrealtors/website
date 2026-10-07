import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ArrowRight, LandPlot, Ruler, CalendarClock } from 'lucide-react';
import { getPublicLayouts, getPublicProperties } from '@/lib/public-data';
import { site } from '@/lib/config';

export const dynamic = 'force-dynamic';

const statusStyle: Record<string, { bg: string; color: string }> = {
  'New Launch': { bg: 'var(--gradient-gold)', color: 'var(--brand-deep)' },
  'Development in Progress': { bg: 'rgba(199,123,22,0.9)', color: '#fff' },
  'Fully Sold': { bg: 'rgba(18,140,90,0.9)', color: '#fff' },
};

export default function LayoutsPage() {
  const activeLayouts = getPublicLayouts();
  const properties = getPublicProperties();
  const totalPlots = activeLayouts.reduce((sum, l) => sum + l.totalPlots, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-raised)', paddingBottom: 90 }}>
      <div style={{ background: 'var(--gradient-hero)', position: 'relative', paddingTop: 'calc(var(--nav-height) + 56px)', paddingBottom: 96 }}>
        <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        <div className="shell" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, color: 'var(--brand-gold)', fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 14 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> / Our Layouts
          </div>
          <h1 className="font-display" style={{ color: 'white', fontSize: 'clamp(32px, 5vw, 54px)', margin: 0, lineHeight: 1.1 }}>
            Layouts we have developed
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.74)', maxWidth: 600, margin: '18px auto 0', fontSize: 16.5, lineHeight: 1.65 }}>
            {totalPlots} plots across {activeLayouts.length} approved layouts. Every one surveyed,
            fenced and serviced by {site.name} before a single plot went on sale.
          </p>
        </div>
      </div>

      <div className="shell" style={{ marginTop: -56, position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 32 }}>
          {activeLayouts.map((layout) => {
            const badge = statusStyle[layout.status];
            const listing = properties.find((p) => p.projectName === layout.name);

            return (
              <div key={layout.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="img-zoom-container" style={{ position: 'relative', height: 300, background: '#0D1B2A' }}>
                  <Image src={layout.coverImage} alt={layout.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 50vw" />
                  <div className="card-overlay" style={{ position: 'absolute', inset: 0 }} />

                  <span
                    className="badge"
                    style={{ position: 'absolute', top: 18, left: 18, background: badge.bg, color: badge.color, padding: '6px 14px' }}
                  >
                    {layout.status}
                  </span>

                  <div style={{ position: 'absolute', bottom: 22, left: 22, right: 22 }}>
                    <h2 className="font-display" style={{ color: 'white', fontSize: 28, marginBottom: 7, lineHeight: 1.15 }}>{layout.name}</h2>
                    <p style={{ color: 'var(--brand-gold)', fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                      <MapPin size={15} /> {layout.location}
                    </p>
                  </div>
                </div>

                <div style={{ padding: 28, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 22, paddingBottom: 22, borderBottom: '1px solid var(--border-subtle)' }}>
                    {[
                      { icon: LandPlot, label: 'Plots', value: `${layout.totalPlots}` },
                      { icon: Ruler, label: 'Extent', value: layout.landArea },
                      { icon: CalendarClock, label: 'Handover', value: layout.completionDate },
                    ].map((stat) => (
                      <div key={stat.label} style={{ flex: '1 1 90px' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <stat.icon size={12} /> {stat.label}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-deep)' }}>{stat.value}</div>
                      </div>
                    ))}
                    <div style={{ flex: '1 1 90px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>From</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-gold-dark)' }}>{layout.startingPrice}</div>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.7, marginBottom: 20 }}>
                    {layout.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 26 }}>
                    {layout.features.map((f) => (
                      <span key={f} className="chip chip-outline" style={{ fontSize: 12 }}>{f}</span>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {listing ? (
                      <Link href={`/plots/${listing.slug}`} className="btn btn-dark" style={{ flex: '1 1 180px' }}>
                        View available plots <ArrowRight size={15} />
                      </Link>
                    ) : (
                      <span className="btn btn-secondary" style={{ flex: '1 1 180px', cursor: 'default', opacity: 0.7 }}>
                        Sold out
                      </span>
                    )}
                    <Link href="/book-visit" className="btn btn-secondary" style={{ flex: '0 1 auto' }}>Book a visit</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="shell" style={{ marginTop: 72 }}>
        <div style={{ padding: 'clamp(40px, 6vw, 64px) 40px', background: 'var(--gradient-gold)', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(26px, 4vw, 40px)', color: 'var(--brand-deep)', marginBottom: 16 }}>
            Looking for land we haven&apos;t listed?
          </h2>
          <p style={{ color: 'rgba(13,27,42,0.78)', fontSize: 16.5, maxWidth: 580, margin: '0 auto 32px', lineHeight: 1.6 }}>
            We source off-market parcels for buyers with a specific corridor, extent or budget in mind.
            Tell us what you are after.
          </p>
          <Link href="/contact" className="btn btn-dark btn-lg">Talk to a land advisor</Link>
        </div>
      </div>
    </div>
  );
}
