'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, ArrowRight, Scale, Ruler, Compass, LandPlot } from 'lucide-react';
import { Property } from '@/lib/types';
import { FALLBACK_PHOTO } from '@/lib/data';

interface PlotCardProps {
  plot: Property;
  onSave?: (id: string) => void;
  onCompare?: (id: string) => void;
  saved?: boolean;
  inCompare?: boolean;
  layout?: 'grid' | 'row';
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  'Ready to Register': { bg: 'rgba(255,255,255,0.95)', color: '#0B7A4C' },
  'Development in Progress': { bg: 'rgba(255,255,255,0.95)', color: '#A9640F' },
  'New Launch': { bg: 'rgba(255,255,255,0.95)', color: '#9E7B2E' },
};

export function sizeRange(plot: Property) {
  const units = plot.land?.units ?? [];
  if (units.length === 0) return `${plot.area.toLocaleString('en-IN')} sq.ft`;
  const areas = units.map((u) => u.area);
  const min = Math.min(...areas);
  const max = Math.max(...areas);
  return min === max
    ? `${min.toLocaleString('en-IN')} sq.ft`
    : `${min.toLocaleString('en-IN')} – ${max.toLocaleString('en-IN')} sq.ft`;
}

export default function PlotCard({ plot, onSave, onCompare, saved = false, inCompare = false, layout = 'grid' }: PlotCardProps) {
  const [imgError, setImgError] = useState(false);
  const land = plot.land;
  const badge = statusStyle[plot.status] ?? statusStyle['New Launch'];
  const isRow = layout === 'row';

  return (
    <div
      className="card card-plot"
      style={{ display: 'flex', flexDirection: isRow ? 'row' : 'column', height: '100%' }}
    >
      <div
        className="img-zoom-container"
        style={{
          position: 'relative',
          aspectRatio: isRow ? undefined : '4/3',
          width: isRow ? '38%' : '100%',
          minHeight: isRow ? 240 : undefined,
          flexShrink: 0,
          background: '#0D1B2A',
        }}
      >
        <Image
          src={imgError ? FALLBACK_PHOTO : plot.photos[0]}
          alt={plot.title}
          fill
          style={{ objectFit: 'cover' }}
          onError={() => setImgError(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="card-overlay" style={{ position: 'absolute', inset: 0 }} />

        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 'calc(100% - 70px)' }}>
          <span className="badge" style={{ background: badge.bg, color: badge.color, backdropFilter: 'blur(8px)' }}>
            {plot.status}
          </span>
          {plot.newLaunch && <span className="badge badge-launch">New</span>}
        </div>

        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
          {onSave && (
            <button
              onClick={(e) => { e.preventDefault(); onSave(plot.id); }}
              aria-label={saved ? 'Remove from saved' : 'Save plot'}
              style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.95)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Heart size={15} fill={saved ? '#B4453C' : 'none'} color={saved ? '#B4453C' : '#5A6B63'} />
            </button>
          )}
          {onCompare && (
            <button
              onClick={(e) => { e.preventDefault(); onCompare(plot.id); }}
              aria-label={inCompare ? 'Remove from comparison' : 'Add to comparison'}
              style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none',
                background: inCompare ? 'var(--brand-gold)' : 'rgba(255,255,255,0.95)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Scale size={15} color={inCompare ? 'var(--brand-deep)' : '#5A6B63'} />
            </button>
          )}
        </div>

        <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>From</div>
            <div className="price-tag price-tag-sm">{plot.priceLabel}</div>
          </div>
          {land && (
            <div style={{
              background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white', fontSize: 11, fontWeight: 700,
              padding: '4px 10px', borderRadius: 99,
            }}>
              ₹{land.pricePerSqft.toLocaleString('en-IN')}/sq.ft
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-serif)", color: 'var(--brand-deep)', marginBottom: 5, lineHeight: 1.3 }}>
          {plot.title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
          <MapPin size={13} /> {plot.location}
        </p>

        {land && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {land.approvals.map((a) => (
              <span key={a} className="chip chip-gold" style={{ padding: '3px 9px', fontSize: 11 }}>{a}</span>
            ))}
            <span className="chip chip-outline" style={{ padding: '3px 9px', fontSize: 11 }}>{land.use}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Ruler size={11} /> Sizes
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-deep)' }}>{sizeRange(plot)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Compass size={11} /> Facing
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-deep)' }}>
              {land ? `${land.facingOptions.length} options` : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
              <LandPlot size={11} /> Available
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: land && land.availablePlots < 10 ? 'var(--status-hold)' : 'var(--status-available)' }}>
              {land ? `${land.availablePlots} of ${land.totalPlots}` : '—'}
            </div>
          </div>
        </div>

        <Link
          href={`/plots/${plot.slug}`}
          className="btn btn-dark"
          style={{ width: '100%', marginTop: 'auto' }}
        >
          View Plot Details <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
