'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X, Plus, Check, Minus } from 'lucide-react';
import { Property } from '@/lib/types';

const MAX_COMPARE = 3;

type Row = {
  label: string;
  value: (p: Property) => React.ReactNode;
  best?: 'low' | 'high';
  metric?: (p: Property) => number;
};

const ROWS: Row[] = [
  { label: 'Starting price', value: (p) => p.priceLabel, best: 'low', metric: (p) => p.price },
  { label: 'Rate per sq.ft', value: (p) => (p.land ? `₹${p.land.pricePerSqft.toLocaleString('en-IN')}` : '—'), best: 'low', metric: (p) => p.land?.pricePerSqft ?? Infinity },
  { label: 'Corridor', value: (p) => p.corridor },
  { label: 'Locality', value: (p) => p.location },
  { label: 'Land use', value: (p) => p.land?.use ?? '—' },
  {
    label: 'Plot sizes',
    value: (p) => {
      const areas = p.land?.units.map((u) => u.area) ?? [p.area];
      return `${Math.min(...areas).toLocaleString('en-IN')} – ${Math.max(...areas).toLocaleString('en-IN')} sq.ft`;
    },
  },
  { label: 'Facing options', value: (p) => p.land?.facingOptions.join(', ') ?? '—' },
  {
    label: 'Approvals',
    value: (p) => (
      <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {p.land?.approvals.map((a) => <span key={a} className="chip chip-gold" style={{ fontSize: 10.5, padding: '2px 8px' }}>{a}</span>)}
      </span>
    ),
  },
  { label: 'Internal roads', value: (p) => p.land?.roadWidth ?? '—' },
  {
    label: 'Plots available',
    value: (p) => (p.land ? `${p.land.availablePlots} of ${p.land.totalPlots}` : '—'),
    best: 'high',
    metric: (p) => p.land?.availablePlots ?? 0,
  },
  { label: 'Appreciation', value: (p) => p.land?.appreciation ?? '—' },
  { label: 'Layout status', value: (p) => p.status },
  { label: 'Handover', value: (p) => p.possession },
  {
    label: 'Plot loan eligible',
    value: (p) => (p.land?.loanEligible
      ? <Check size={17} color="var(--status-available)" />
      : <Minus size={17} color="var(--text-muted)" />),
  },
  {
    label: 'Gated & secured',
    value: (p) => (p.land?.gatedCommunity
      ? <Check size={17} color="var(--status-available)" />
      : <Minus size={17} color="var(--text-muted)" />),
  },
];

export default function ComparePlots({ properties }: { properties: Property[] }) {
  const searchParams = useSearchParams();
  const [ids, setIds] = useState<string[]>(() => {
    const param = searchParams.get('ids');
    if (!param) return [];
    return param.split(',').filter((id) => properties.some((p) => p.id === id)).slice(0, MAX_COMPARE);
  });
  const [picker, setPicker] = useState(false);

  const selected = ids.map((id) => properties.find((p) => p.id === id)).filter((p): p is Property => Boolean(p));

  const bestValue = (row: Row) => {
    if (!row.metric || !row.best || selected.length < 2) return null;
    const values = selected.map(row.metric);
    return row.best === 'low' ? Math.min(...values) : Math.max(...values);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-raised)', paddingBottom: 90 }}>
      <div style={{ background: 'var(--gradient-hero)', position: 'relative', paddingTop: 'calc(var(--nav-height) + 44px)', paddingBottom: 44 }}>
        <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        <div className="shell" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12.5, color: 'var(--brand-gold)', fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 12 }}>
            <Link href="/plots" style={{ color: 'inherit', textDecoration: 'none' }}>Plots</Link> / Compare
          </div>
          <h1 className="font-display" style={{ color: 'white', fontSize: 'clamp(28px, 4.4vw, 44px)', margin: 0 }}>Compare layouts</h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', marginTop: 10, maxWidth: 520 }}>
            Up to three layouts side by side. Best value in each row is highlighted.
          </p>
        </div>
      </div>

      <div className="shell-lg" style={{ marginTop: 36 }}>
        {selected.length === 0 ? (
          <div className="card card-static" style={{ padding: '76px 24px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
            <h2 className="font-display" style={{ fontSize: 24, color: 'var(--brand-deep)', marginBottom: 12 }}>Nothing to compare yet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>
              Pick up to three layouts and we will line up price, rate, approvals and availability.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => setPicker(true)}>Choose layouts</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
            <div style={{ minWidth: 760, display: 'grid', gridTemplateColumns: `200px repeat(${MAX_COMPARE}, minmax(220px, 1fr))`, gap: 14 }}>
              {/* header row */}
              <div />
              {Array.from({ length: MAX_COMPARE }).map((_, col) => {
                const plot = selected[col];
                if (!plot) {
                  return (
                    <div key={`empty-${col}`} style={{ border: '2px dashed var(--border-medium)', borderRadius: 'var(--radius-md)', minHeight: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setPicker(true)}>
                        <Plus size={15} /> Add layout
                      </button>
                    </div>
                  );
                }
                return (
                  <div key={plot.id} className="card card-static" style={{ overflow: 'hidden' }}>
                    <div style={{ position: 'relative', height: 140, background: '#0D1B2A' }}>
                      <Image src={plot.photos[0]} alt={plot.title} fill style={{ objectFit: 'cover' }} sizes="240px" />
                      <button
                        onClick={() => setIds(ids.filter((id) => id !== plot.id))}
                        aria-label={`Remove ${plot.title}`}
                        style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}
                      >
                        <X size={15} color="var(--status-sold)" />
                      </button>
                    </div>
                    <div style={{ padding: 16 }}>
                      <h3 style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--brand-deep)', marginBottom: 4, fontFamily: "var(--font-sans)" }}>{plot.title}</h3>
                      <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{plot.location}</p>
                    </div>
                  </div>
                );
              })}

              {/* data rows */}
              {ROWS.map((row) => {
                const best = bestValue(row);
                return (
                  <div key={row.label} style={{ display: 'contents' }}>
                    <div style={{ padding: '14px 4px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center' }}>
                      {row.label}
                    </div>
                    {Array.from({ length: MAX_COMPARE }).map((_, col) => {
                      const plot = selected[col];
                      const isBest = plot && best !== null && row.metric?.(plot) === best;
                      return (
                        <div
                          key={`${row.label}-${col}`}
                          style={{
                            padding: '14px 14px',
                            fontSize: 13.5,
                            borderTop: '1px solid var(--border-subtle)',
                            background: isBest ? 'rgba(18,140,90,0.07)' : 'transparent',
                            color: isBest ? 'var(--status-available)' : 'var(--text-primary)',
                            fontWeight: isBest ? 700 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            lineHeight: 1.5,
                          }}
                        >
                          {plot ? row.value(plot) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* CTA row */}
              <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
              {Array.from({ length: MAX_COMPARE }).map((_, col) => {
                const plot = selected[col];
                return (
                  <div key={`cta-${col}`} style={{ padding: '18px 0', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plot && (
                      <>
                        <Link href={`/plots/${plot.slug}`} className="btn btn-dark btn-sm">View layout</Link>
                        <Link href="/book-visit" className="btn btn-secondary btn-sm">Book a visit</Link>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {picker && (
        <div className="modal-overlay" onClick={() => setPicker(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 580 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 19, color: 'var(--brand-deep)', fontFamily: "var(--font-sans)" }}>Add a layout</h3>
              <button onClick={() => setPicker(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ maxHeight: '58vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {properties.filter((p) => !ids.includes(p.id)).map((p) => (
                <div key={p.id} style={{ display: 'flex', gap: 14, padding: 10, border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
                  <div style={{ width: 74, height: 56, position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={p.photos[0]} alt="" fill style={{ objectFit: 'cover' }} sizes="74px" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--brand-deep)', fontSize: 14 }}>{p.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{p.location} · {p.priceLabel}</div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={ids.length >= MAX_COMPARE}
                    onClick={() => { setIds([...ids, p.id]); setPicker(false); }}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

