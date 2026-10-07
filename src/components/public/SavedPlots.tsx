'use client';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import PlotCard from '@/components/PlotCard';
import { clearSavedPlots, removeSavedPlot, useHydrated, useSavedPlots } from '@/lib/savedPlots';
import type { Property } from '@/lib/types';

export default function SavedPlots({ properties }: { properties: Property[] }) {
  const savedIds = useSavedPlots();
  const ready = useHydrated();

  const savedPlots = properties.filter((p) => savedIds.includes(p.id));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-raised)', paddingBottom: 90 }}>
      <div style={{ background: 'var(--gradient-hero)', position: 'relative', paddingTop: 'calc(var(--nav-height) + 44px)', paddingBottom: 44 }}>
        <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        <div className="shell" style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h1 className="font-display" style={{ color: 'white', fontSize: 'clamp(28px, 4.4vw, 44px)', margin: 0 }}>Saved plots</h1>
            {ready && (
              <p style={{ color: 'rgba(255,255,255,0.72)', marginTop: 10 }}>
                {savedIds.length === 0 ? 'Nothing saved yet' : `${savedIds.length} layout${savedIds.length === 1 ? '' : 's'} on your shortlist`}
              </p>
            )}
          </div>
          {ready && savedIds.length > 0 && (
            <button onClick={clearSavedPlots} className="btn btn-secondary btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)' }}>
              Clear shortlist
            </button>
          )}
        </div>
      </div>

      <div className="shell" style={{ marginTop: 36 }}>
        {!ready ? null : savedPlots.length === 0 ? (
          <div className="card card-static" style={{ padding: '76px 24px', textAlign: 'center' }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'var(--brand-deep-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
              <Heart size={34} color="var(--brand-deep)" />
            </div>
            <h2 className="font-display" style={{ fontSize: 24, color: 'var(--brand-deep)', marginBottom: 12 }}>Your shortlist is empty</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 30, maxWidth: 420, marginInline: 'auto' }}>
              Tap the heart on any layout to keep it here while you compare corridors.
            </p>
            <Link href="/plots" className="btn btn-primary btn-lg">Browse plots</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28 }}>
            {savedPlots.map((p) => (
              <PlotCard key={p.id} plot={p} saved onSave={removeSavedPlot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
