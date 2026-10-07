'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Ruler, IndianRupee, ArrowRight, ShieldCheck, TrendingUp,
  FileCheck2, Landmark, Hammer, CalendarCheck, Handshake, Quote, LandPlot, Sprout,
} from 'lucide-react';
import { corridors } from '@/lib/data';
import PlotCard from '@/components/PlotCard';
import BrandSelect from '@/components/BrandSelect';
import { site } from '@/lib/config';
import type { Property } from '@/lib/types';

interface HomePageProps {
  featured: Property[];
  launches: Property[];
  layoutCount: number;
  availablePlots: number;
}

const BUDGETS = [
  { value: '', label: 'Any budget' },
  { value: '0-40', label: 'Under ₹40 L' },
  { value: '40-75', label: '₹40 L – ₹75 L' },
  { value: '75-150', label: '₹75 L – ₹1.5 Cr' },
  { value: '150-9999', label: '₹1.5 Cr and above' },
];

const SIZES = [
  { value: '', label: 'Any plot size' },
  { value: '0-1200', label: 'Up to 1,200 sq.ft' },
  { value: '1200-2400', label: '1,200 – 2,400 sq.ft' },
  { value: '2400-99999', label: '2,400 sq.ft and above' },
];

const LAND_VS_BUILT = [
  { metric: 'Appreciation', land: '12–16% p.a. on land value', built: '4–7% p.a., building depreciates' },
  { metric: 'Maintenance', land: 'Nil until you build', built: '₹3–6 per sq.ft every month' },
  { metric: 'Design freedom', land: 'Build exactly what you want', built: 'Fixed layout, fixed finishes' },
  { metric: 'Ageing', land: 'Land does not age', built: 'Structure ages from day one' },
  { metric: 'Entry ticket', land: 'From ₹27 Lakhs', built: 'From ₹68 Lakhs' },
];

const PROCESS = [
  { icon: Search, title: 'Shortlist', body: 'Filter by corridor, budget, plot size and facing. Compare up to three layouts side by side.' },
  { icon: CalendarCheck, title: 'Walk the land', body: 'We drive you out, walk the actual plot boundaries and show you the survey stones.' },
  { icon: FileCheck2, title: 'Verify the title', body: 'Our panel advocate hands you the 30-year title trace, EC and approval numbers before you pay.' },
  { icon: Landmark, title: 'Arrange funding', body: 'Plot loans pre-approved with SBI, HDFC and LIC Housing. Sanction usually closes in 7–10 days.' },
  { icon: Handshake, title: 'Register', body: 'Sub-registrar appointment, stamp duty, patta transfer — handled end to end by our team.' },
];

const TESTIMONIALS = [
  {
    name: 'Karthik Subramaniam',
    plot: 'Imperium Emerald Acres, Sholinganallur',
    quote: 'They walked me to the survey stones and handed over the 30-year title trace before I paid a rupee. I have bought land twice before and never had that.',
  },
  {
    name: 'Priya Rajan',
    plot: 'Imperium Green Meadows, Thiruporur',
    quote: 'I wanted land, not a flat, and every other site kept pushing apartments at me. Imperium Realtors only does plots, and it shows in how much they know about each corridor.',
  },
  {
    name: 'Srinivasan Iyer',
    plot: 'Imperium Gold Coast, Uthandi',
    quote: 'The plot-by-plot availability list was the thing that sold me. I could see exactly which plot, which facing, and what was still open.',
  },
];

export default function HomePage({ featured, launches, layoutCount, availablePlots }: HomePageProps) {
  const router = useRouter();
  const [corridor, setCorridor] = useState('');
  const [budget, setBudget] = useState('');
  const [size, setSize] = useState('');

  const runSearch = () => {
    const params = new URLSearchParams();
    if (corridor) params.set('corridor', corridor);
    if (budget) params.set('budget', budget);
    if (size) params.set('size', size);
    router.push(`/plots${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div style={{ background: 'var(--surface-base)' }}>
      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 'calc(var(--nav-height) + 40px)', paddingBottom: 64 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Image
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=80"
            alt="Open land at sunrise"
            fill
            style={{ objectFit: 'cover' }}
            preload
          />
          <div style={{ position: 'absolute', inset: 0, background: 'var(--gradient-hero)', opacity: 0.62 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(7,17,28,0.92) 0%, rgba(7,17,28,0.66) 48%, rgba(7,17,28,0.30) 100%)' }} />
          <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        </div>

        <div className="shell" style={{ position: 'relative', zIndex: 1, color: 'white' }}>
          <div className="animate-fadeInUp" style={{ maxWidth: 880 }}>
            <span className="section-label section-label-light">
              {site.city}&apos;s Land &amp; Plot Specialists
            </span>
            <h1 className="font-display" style={{ fontSize: 'clamp(32px, 6vw, 74px)', margin: '20px 0 22px', lineHeight: 1.08 }}>
              Buy the ground,<br />not someone else&apos;s ceiling.
            </h1>
            <p style={{ fontSize: 'clamp(16px, 1.9vw, 20px)', color: 'rgba(255,255,255,0.82)', maxWidth: 660, lineHeight: 1.65, marginBottom: 36 }}>
              {site.name} sells one thing and sells it properly — approved, title-verified plots
              across {site.city}&apos;s fastest-moving corridors. Residential, commercial and farmland.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link href="/plots" className="btn btn-primary btn-lg">Browse {layoutCount} Layouts</Link>
              <Link href="/why-land" className="btn btn-secondary btn-lg" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
                Why Land Beats Built
              </Link>
            </div>
          </div>

          {/* PLOT SEARCH */}
          <div
            className="animate-fadeInUp search-bar"
            style={{ animationDelay: '0.2s', flexWrap: 'wrap', gap: 8, padding: 10, color: 'var(--text-primary)', position: 'relative', zIndex: 5 }}
          >
            <div style={{ flex: '1 1 220px', padding: '0 6px' }}>
              <BrandSelect
                variant="bare"
                ariaLabel="Corridor"
                icon={<MapPin size={19} />}
                value={corridor}
                onChange={setCorridor}
                options={[{ value: '', label: 'All corridors' }, ...corridors.map((c) => ({ value: c.name, label: c.name }))]}
              />
            </div>

            <div className="search-divider hidden-mobile" />

            <div style={{ flex: '1 1 190px', padding: '0 6px' }}>
              <BrandSelect
                variant="bare"
                ariaLabel="Budget"
                icon={<IndianRupee size={19} />}
                value={budget}
                onChange={setBudget}
                options={BUDGETS}
              />
            </div>

            <div className="search-divider hidden-mobile" />

            <div style={{ flex: '1 1 190px', padding: '0 6px' }}>
              <BrandSelect
                variant="bare"
                ariaLabel="Plot size"
                icon={<Ruler size={19} />}
                value={size}
                onChange={setSize}
                options={SIZES}
              />
            </div>

            <button onClick={runSearch} className="btn btn-primary" style={{ padding: '15px 30px', flex: '0 0 auto' }}>
              <Search size={18} /> Find Plots
            </button>
          </div>

          <div
            className="animate-fadeInUp"
            style={{ animationDelay: '0.35s', display: 'flex', gap: 'clamp(20px, 5vw, 56px)', marginTop: 44, flexWrap: 'wrap' }}
          >
            {[
              { value: `${availablePlots}`, label: 'Plots available now' },
              { value: `${corridors.length}`, label: 'Growth corridors' },
              { value: '100%', label: 'Title-verified layouts' },
              { value: `${new Date().getFullYear() - site.since} yrs`, label: 'Selling land in Chennai' },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display" style={{ fontSize: 30, fontWeight: 700, color: 'var(--brand-gold)', lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PLOTS */}
      <section className="section" style={{ background: 'var(--surface-base)' }}>
        <div className="shell">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 44 }}>
            <div style={{ maxWidth: 620 }}>
              <div className="section-label">Open for booking</div>
              <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--brand-deep)', margin: '14px 0 12px' }}>
                Featured plot layouts
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Every layout below is approved, title-traced and ready to walk. Availability updates as plots are booked.
              </p>
            </div>
            <Link href="/plots" className="btn btn-secondary">View all layouts <ArrowRight size={16} /></Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
            {featured.map((p) => <PlotCard key={p.id} plot={p} />)}
          </div>
        </div>
      </section>

      {/* LAND VS BUILT */}
      <section className="section" style={{ background: 'var(--brand-deep)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.35 }} />
        <div className="shell" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 640, marginBottom: 48 }}>
            <div className="section-label section-label-light">The case for land</div>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '14px 0 14px' }}>
              A building starts dying the day it is finished. Land doesn&apos;t.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }}>
              When you buy an apartment, most of your money buys concrete that depreciates. When you buy
              a plot, all of it buys the one component that has never stopped appreciating in {site.city}.
            </p>
          </div>

          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1.4fr', background: 'rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              <div style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.6)' }}>&nbsp;</div>
              <div style={{ padding: '14px 18px', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', gap: 7 }}><LandPlot size={14} /> A plot</div>
              <div style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.6)' }}>A built flat</div>
            </div>
            {LAND_VS_BUILT.map((row, i) => (
              <div
                key={row.metric}
                style={{
                  display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1.4fr',
                  background: i % 2 ? 'rgba(255,255,255,0.03)' : 'transparent',
                  fontSize: 14,
                }}
              >
                <div style={{ padding: '16px 18px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{row.metric}</div>
                <div style={{ padding: '16px 18px', color: 'white', fontWeight: 600 }}>{row.land}</div>
                <div style={{ padding: '16px 18px', color: 'rgba(255,255,255,0.55)' }}>{row.built}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <Link href="/why-land" className="btn btn-primary">Read the full land buyer&apos;s guide <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      {/* CORRIDORS */}
      <section className="section" style={{ background: 'var(--surface-raised)' }}>
        <div className="shell">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
            <div className="section-label">Where the growth is</div>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--brand-deep)', margin: '14px 0 12px' }}>
              Explore by corridor
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Land is a location bet before it is anything else. These are the five stretches we track, and why.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 24 }}>
            {corridors.map((c) => (
              <Link key={c.id} href={`/plots?corridor=${encodeURIComponent(c.name)}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div className="img-zoom-container" style={{ position: 'relative', height: 170, background: '#0D1B2A' }}>
                    <Image src={c.image} alt={c.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 33vw" />
                    <div className="card-overlay" style={{ position: 'absolute', inset: 0 }} />
                    <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
                      <div className="font-display" style={{ color: 'white', fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                        {c.name.split('—')[0].trim()}
                      </div>
                      <div style={{ color: 'var(--brand-gold)', fontSize: 12, fontWeight: 600, letterSpacing: 0.6 }}>
                        {c.name.split('—')[1]?.trim()}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.65, marginBottom: 16 }}>{c.blurb}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                      {c.drivers.slice(0, 2).map((d) => (
                        <span key={d} className="chip chip-outline" style={{ fontSize: 11, padding: '4px 10px' }}>{d}</span>
                      ))}
                    </div>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>From</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-deep)' }}>{c.startingPrice}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Appreciation</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--status-available)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <TrendingUp size={14} /> {c.appreciation}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEW LAUNCHES */}
      {launches.length > 0 && (
        <section className="section" style={{ background: 'var(--surface-base)' }}>
          <div className="shell">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
              <div>
                <div className="section-label">Just released</div>
                <h2 className="font-display" style={{ fontSize: 'clamp(26px, 3.6vw, 38px)', color: 'var(--brand-deep)', margin: '14px 0 0' }}>
                  New launch layouts
                </h2>
              </div>
              <Link href="/plots?status=New Launch" className="btn btn-secondary">All new launches <ArrowRight size={16} /></Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 28 }}>
              {launches.map((p) => (
                <div key={p.id} className="card" style={{ display: 'flex', flexWrap: 'wrap' }}>
                  <div className="img-zoom-container" style={{ position: 'relative', flex: '1 1 200px', minHeight: 250, background: '#0D1B2A' }}>
                    <Image src={p.photos[0]} alt={p.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 40vw" />
                    <span className="badge badge-launch" style={{ position: 'absolute', top: 14, left: 14 }}>Launch pricing</span>
                  </div>
                  <div style={{ flex: '1 1 260px', padding: 26, display: 'flex', flexDirection: 'column' }}>
                    <h3 className="font-display" style={{ fontSize: 23, color: 'var(--brand-deep)', marginBottom: 6 }}>{p.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={13} /> {p.location}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                      <span className="price-tag">{p.priceLabel}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                        · ₹{p.land?.pricePerSqft.toLocaleString('en-IN')}/sq.ft
                      </span>
                    </div>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                      {p.highlights.slice(0, 2).map((h) => (
                        <li key={h} style={{ display: 'flex', gap: 9, color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.5 }}>
                          <Sprout size={16} color="var(--status-available)" style={{ flexShrink: 0, marginTop: 2 }} />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/plots/${p.slug}`} className="btn btn-dark btn-sm" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
                      View layout <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PROCESS */}
      <section className="section" style={{ background: 'var(--brand-sand)' }}>
        <div className="shell">
          <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 52px' }}>
            <div className="section-label">How it works</div>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--brand-deep)', margin: '14px 0 12px' }}>
              Five steps from shortlist to patta
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Buying land has more paperwork than buying a flat. We do that part for you.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 20 }}>
            {PROCESS.map((step, i) => (
              <div key={step.title} className="card card-static" style={{ padding: 26, background: 'white', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--brand-deep-soft)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <step.icon size={22} />
                  </div>
                  <span className="font-display" style={{ fontSize: 30, fontWeight: 700, color: 'rgba(13,27,42,0.12)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-deep)', fontFamily: "var(--font-sans)" }}>{step.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.65 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="section" style={{ background: 'var(--surface-base)' }}>
        <div className="shell">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
            {[
              { icon: ShieldCheck, title: 'Title traced 30 years back', body: 'Every layout goes through a parent document search by our panel advocate. You get the report, not a summary of it.' },
              { icon: FileCheck2, title: 'Approval numbers published', body: 'DTCP, CMDA and RERA numbers are printed on every listing. Check them against the registry yourself.' },
              { icon: Hammer, title: 'Handed over ready to build', body: 'Roads, drains, power and water go in before we hand over. You are not waiting on infrastructure promises.' },
              { icon: Landmark, title: 'Plot loans arranged', body: 'Tie-ups with SBI, HDFC and LIC Housing Finance. We prepare the file and follow the sanction through.' },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(201,168,76,0.14)', color: 'var(--brand-gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={25} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-deep)', fontFamily: "var(--font-sans)" }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" style={{ background: 'var(--surface-raised)' }}>
        <div className="shell">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="section-label">Land owners</div>
            <h2 className="font-display" style={{ fontSize: 'clamp(26px, 3.6vw, 38px)', color: 'var(--brand-deep)', marginTop: 14 }}>
              What buyers say
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card card-static" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <Quote size={26} color="var(--brand-gold)" />
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.75, flex: 1 }}>{t.quote}</p>
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-deep)' }}>{t.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Registered · {t.plot}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '84px 0', background: 'var(--gradient-gold)' }}>
        <div className="shell" style={{ textAlign: 'center' }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(30px, 4.4vw, 46px)', color: 'var(--brand-deep)', marginBottom: 18 }}>
            Not sure which corridor is right for you?
          </h2>
          <p style={{ color: 'rgba(13,27,42,0.78)', fontSize: 17, maxWidth: 620, margin: '0 auto 36px', lineHeight: 1.6 }}>
            Tell us your budget and what you plan to do with the land. We will tell you honestly which
            of our layouts fits — and which ones do not.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/book-visit" className="btn btn-dark btn-lg">Book a Site Visit</Link>
            <Link href="/contact" className="btn btn-white btn-lg">Talk to a Land Advisor</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
