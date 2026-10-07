'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, Grid3x3, Rows3, X, Search, RotateCcw } from 'lucide-react';
import { corridors } from '@/lib/data';
import { Approval, Facing, LandUse, Property } from '@/lib/types';
import PlotCard from '@/components/PlotCard';
import BrandSelect from '@/components/BrandSelect';
import { toggleSavedPlot, useSavedPlots } from '@/lib/savedPlots';

const USES: LandUse[] =['Residential', 'Commercial', 'Farmland', 'Industrial'];
const APPROVALS: Approval[] = ['DTCP', 'CMDA', 'RERA', 'Panchayat'];
const FACINGS: Facing[] = ['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'];
const STATUSES: Property['status'][] = ['Ready to Register', 'Development in Progress', 'New Launch'];

const BUDGET_BANDS = [
  { value: '0-40', label: 'Under ₹40 L' },
  { value: '40-75', label: '₹40 L – ₹75 L' },
  { value: '75-150', label: '₹75 L – ₹1.5 Cr' },
  { value: '150-9999', label: '₹1.5 Cr +' },
];

const SIZE_BANDS = [
  { value: '0-1200', label: 'Up to 1,200 sq.ft' },
  { value: '1200-2400', label: '1,200 – 2,400' },
  { value: '2400-99999', label: '2,400 sq.ft +' },
];

type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'rate-asc' | 'newest';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rate-asc', label: 'Rate: ₹/sq.ft low to high' },
  { value: 'newest', label: 'Newest first' },
];

const parseBand = (band: string) => {
  const [min, max] = band.split('-').map(Number);
  return { min, max };
};

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`filter-pill ${active ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '6px 13px' }}>
      {label}
    </button>
  );
}

export default function PlotsBrowser({ plots: properties }: { plots: Property[] }) {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [selectedCorridors, setSelectedCorridors] = useState<string[]>(
    () => (searchParams.get('corridor') ? [searchParams.get('corridor') as string] : []),
  );
  const [budgets, setBudgets] = useState<string[]>(
    () => (searchParams.get('budget') ? [searchParams.get('budget') as string] : []),
  );
  const [sizes, setSizes] = useState<string[]>(
    () => (searchParams.get('size') ? [searchParams.get('size') as string] : []),
  );
  const [uses, setUses] = useState<LandUse[]>(() => {
    const use = searchParams.get('use') as LandUse | null;
    return use && USES.includes(use) ? [use] : [];
  });
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [facings, setFacings] = useState<Facing[]>([]);
  const [statuses, setStatuses] = useState<Property['status'][]>(() => {
    const status = searchParams.get('status') as Property['status'] | null;
    return status && STATUSES.includes(status) ? [status] : [];
  });
  const [cornerOnly, setCornerOnly] = useState(false);
  const [loanOnly, setLoanOnly] = useState(false);
  const [gatedOnly, setGatedOnly] = useState(false);

  const [sort, setSort] = useState<SortKey>('recommended');
  const [view, setView] = useState<'grid' | 'row'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const savedIds = useSavedPlots();
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [filtersOpen]);

  const toggle = <T,>(list: T[], setList: (v: T[]) => void, value: T) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const clearAll = () => {
    setQuery('');
    setSelectedCorridors([]); setBudgets([]); setSizes([]); setUses([]);
    setApprovals([]); setFacings([]); setStatuses([]);
    setCornerOnly(false); setLoanOnly(false); setGatedOnly(false);
  };

  const activeFilterCount =
    selectedCorridors.length + budgets.length + sizes.length + uses.length +
    approvals.length + facings.length + statuses.length +
    (cornerOnly ? 1 : 0) + (loanOnly ? 1 : 0) + (gatedOnly ? 1 : 0) + (query ? 1 : 0);

  const results = useMemo(() => {
    const filtered = properties.filter((p) => {
      const land = p.land;

      if (query) {
        const haystack = `${p.title} ${p.location} ${p.corridor} ${p.address}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      if (selectedCorridors.length && !selectedCorridors.includes(p.corridor)) return false;
      if (statuses.length && !statuses.includes(p.status)) return false;

      if (budgets.length) {
        const match = budgets.some((b) => {
          const { min, max } = parseBand(b);
          return p.price >= min && p.price <= max;
        });
        if (!match) return false;
      }

      if (sizes.length) {
        const areas = land?.units.map((u) => u.area) ?? [p.area];
        const match = sizes.some((s) => {
          const { min, max } = parseBand(s);
          return areas.some((a) => a >= min && a <= max);
        });
        if (!match) return false;
      }

      if (uses.length && (!land || !uses.includes(land.use))) return false;
      if (approvals.length && (!land || !approvals.some((a) => land.approvals.includes(a)))) return false;
      if (facings.length && (!land || !facings.some((f) => land.facingOptions.includes(f)))) return false;

      if (cornerOnly && !land?.units.some((u) => u.corner && u.availability !== 'Sold')) return false;
      if (loanOnly && !land?.loanEligible) return false;
      if (gatedOnly && !land?.gatedCommunity) return false;

      return true;
    });

    const sorted = [...filtered];
    switch (sort) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'rate-asc': sorted.sort((a, b) => (a.land?.pricePerSqft ?? 0) - (b.land?.pricePerSqft ?? 0)); break;
      case 'newest': sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      default: sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return sorted;
  }, [properties, query, selectedCorridors, budgets, sizes, uses, approvals, facings, statuses, cornerOnly, loanOnly, gatedOnly, sort]);

  const filterPanel = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-deep)', fontFamily: "var(--font-sans)" }}>
          Filters {activeFilterCount > 0 && <span style={{ color: 'var(--brand-gold-dark)' }}>({activeFilterCount})</span>}
        </h3>
        <button
          onClick={clearAll}
          style={{ background: 'none', border: 'none', color: 'var(--brand-gold-dark)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <FilterSection title="Search">
        <div style={{ position: 'relative' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Layout or locality"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 34, fontSize: 13.5 }}
          />
        </div>
      </FilterSection>

      <FilterSection title="Corridor">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {corridors.map((c) => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedCorridors.includes(c.name)}
                onChange={() => toggle(selectedCorridors, setSelectedCorridors, c.name)}
                style={{ width: 16, height: 16, accentColor: 'var(--brand-deep)', cursor: 'pointer' }}
              />
              {c.name.split('—')[0].trim()}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Budget">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {BUDGET_BANDS.map((b) => (
            <Toggle key={b.value} label={b.label} active={budgets.includes(b.value)} onClick={() => toggle(budgets, setBudgets, b.value)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Plot size">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {SIZE_BANDS.map((s) => (
            <Toggle key={s.value} label={s.label} active={sizes.includes(s.value)} onClick={() => toggle(sizes, setSizes, s.value)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Land use">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {USES.map((u) => (
            <Toggle key={u} label={u} active={uses.includes(u)} onClick={() => toggle(uses, setUses, u)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Approval">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {APPROVALS.map((a) => (
            <Toggle key={a} label={a} active={approvals.includes(a)} onClick={() => toggle(approvals, setApprovals, a)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Plot facing">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {FACINGS.map((f) => (
            <Toggle key={f} label={f} active={facings.includes(f)} onClick={() => toggle(facings, setFacings, f)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Layout status">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {STATUSES.map((s) => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={statuses.includes(s)}
                onChange={() => toggle(statuses, setStatuses, s)}
                style={{ width: 16, height: 16, accentColor: 'var(--brand-deep)', cursor: 'pointer' }}
              />
              {s}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Must have">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[
            { label: 'Corner plot available', value: cornerOnly, set: setCornerOnly },
            { label: 'Plot loan eligible', value: loanOnly, set: setLoanOnly },
            { label: 'Gated with security', value: gatedOnly, set: setGatedOnly },
          ].map((item) => (
            <label key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={item.value}
                onChange={(e) => item.set(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--brand-deep)', cursor: 'pointer' }}
              />
              {item.label}
            </label>
          ))}
        </div>
      </FilterSection>

      {filtersOpen && (
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setFiltersOpen(false)}>
          Show {results.length} layout{results.length === 1 ? '' : 's'}
        </button>
      )}
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-raised)', paddingBottom: 96 }}>
      <div style={{ background: 'var(--gradient-hero)', position: 'relative', paddingTop: 'calc(var(--nav-height) + 44px)', paddingBottom: 44 }}>
        <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        <div className="shell" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12.5, color: 'var(--brand-gold)', fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 12 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> / Plots
          </div>
          <h1 className="font-display" style={{ color: 'white', fontSize: 'clamp(30px, 4.6vw, 48px)', margin: 0, lineHeight: 1.1 }}>
            Find your plot
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', marginTop: 12, maxWidth: 560, fontSize: 15.5 }}>
            Every layout here is approved and title-verified. Filter by corridor, budget, size,
            facing or approval body.
          </p>
        </div>
      </div>

      <div className="shell" style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          <aside className="plot-filters hidden-mobile" style={{ width: 272, flexShrink: 0 }}>
            <div
              className="card card-static"
              style={{ padding: 24, position: 'sticky', top: 'calc(var(--nav-height) + 20px)', maxHeight: 'calc(100vh - var(--nav-height) - 40px)', overflowY: 'auto' }}
            >
              {filterPanel}
            </div>
          </aside>

          <main style={{ flex: 1, minWidth: 0 }}>
            <div
              className="card card-static"
              style={{ padding: '14px 18px', marginBottom: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap', overflow: 'visible', position: 'relative', zIndex: 5 }}
            >
              <div style={{ fontSize: 14.5, color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--brand-deep)', fontSize: 16 }}>{results.length}</strong> layout{results.length === 1 ? '' : 's'}
                {activeFilterCount > 0 && <span style={{ color: 'var(--text-muted)' }}> · {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'}</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn btn-secondary btn-sm show-mobile" style={{ display: 'none' }} onClick={() => setFiltersOpen(true)}>
                  <SlidersHorizontal size={15} /> Filters
                </button>

                <div style={{ width: 230 }}>
                  <BrandSelect
                    ariaLabel="Sort results"
                    value={sort}
                    onChange={(v) => setSort(v as SortKey)}
                    options={SORTS}
                  />
                </div>

                <div className="hidden-mobile" style={{ display: 'flex', gap: 4, background: 'var(--surface-raised)', padding: 4, borderRadius: 'var(--radius-md)' }}>
                  <button
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                    style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: view === 'grid' ? 'white' : 'transparent', color: view === 'grid' ? 'var(--brand-deep)' : 'var(--text-muted)', boxShadow: view === 'grid' ? 'var(--shadow-sm)' : 'none' }}
                  >
                    <Grid3x3 size={17} />
                  </button>
                  <button
                    onClick={() => setView('row')}
                    aria-label="List view"
                    style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: view === 'row' ? 'white' : 'transparent', color: view === 'row' ? 'var(--brand-deep)' : 'var(--text-muted)', boxShadow: view === 'row' ? 'var(--shadow-sm)' : 'none' }}
                  >
                    <Rows3 size={17} />
                  </button>
                </div>
              </div>
            </div>

            {results.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: view === 'grid' ? 'repeat(auto-fill, minmax(305px, 1fr))' : '1fr',
                  gap: 24,
                }}
              >
                {results.map((p) => (
                  <PlotCard
                    key={p.id}
                    plot={p}
                    layout={view}
                    onSave={toggleSavedPlot}
                    saved={savedIds.includes(p.id)}
                    onCompare={handleCompare}
                    inCompare={compareIds.includes(p.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="card card-static" style={{ padding: '72px 24px', textAlign: 'center' }}>
                <Search size={44} color="var(--border-medium)" style={{ margin: '0 auto 18px' }} />
                <h3 style={{ fontSize: 20, color: 'var(--brand-deep)', marginBottom: 10 }}>No layouts match those filters</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 26 }}>
                  Try widening the budget or clearing the facing filter — plot facing is the most restrictive one.
                </p>
                <button className="btn btn-secondary" onClick={clearAll}>Reset all filters</button>
              </div>
            )}
          </main>
        </div>
      </div>

      {filtersOpen && (
        <div className="modal-overlay" style={{ alignItems: 'stretch', justifyContent: 'flex-start', padding: 0 }} onClick={() => setFiltersOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(90vw, 340px)', background: 'white', height: '100%', overflowY: 'auto', padding: 24, animation: 'fadeIn 0.2s ease' }}
          >
            <button
              onClick={() => setFiltersOpen(false)}
              aria-label="Close filters"
              style={{ position: 'absolute', top: 16, right: 16, background: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
            {filterPanel}
          </div>
        </div>
      )}

      <div className={`compare-bar ${compareIds.length > 0 ? 'visible' : ''}`}>
        <div style={{ fontSize: 14 }}>
          <strong>{compareIds.length}</strong> of 3 layouts selected
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)' }} onClick={() => setCompareIds([])}>
            Clear
          </button>
          <Link href={`/compare?ids=${compareIds.join(',')}`} className="btn btn-primary btn-sm">
            Compare now
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .plot-filters { display: none !important; }
        }
      `}</style>
    </div>
  );
}
