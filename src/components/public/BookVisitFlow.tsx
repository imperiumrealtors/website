'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Calendar, Clock, Users, MapPin, CheckCircle2, ChevronRight, Car } from 'lucide-react';
import { site } from '@/lib/config';
import { postPublic } from '@/lib/public-api';
import type { Property } from '@/lib/types';

const TIME_SLOTS = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];

export default function BookVisitFlow({ plots: properties }: { plots: Property[] }) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [plotId, setPlotId] = useState(
    () => properties.find((p) => p.slug === searchParams.get('plot'))?.id ?? '',
  );
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [visitors, setVisitors] = useState(2);
  const [pickup, setPickup] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plot = properties.find((p) => p.id === plotId);

  const confirmVisit = async () => {
    if (!plot) return;
    setSubmitting(true);
    setError(null);
    const result = await postPublic('/api/public/site-visits', {
      name, phone: mobile, layoutSlug: plot.slug, date, time: slot, visitors, pickup,
    });
    setSubmitting(false);
    if (result.ok) setStep(3);
    else setError(result.error);
  };

  const stepLabels = ['Layout', 'Date & details', 'Confirmed'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-raised)', paddingBottom: 90 }}>
      <div style={{ background: 'var(--gradient-hero)', position: 'relative', paddingTop: 'calc(var(--nav-height) + 48px)', paddingBottom: 90 }}>
        <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        <div className="shell" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h1 className="font-display" style={{ color: 'white', fontSize: 'clamp(28px, 4.4vw, 44px)', margin: 0 }}>Walk the land</h1>
          <p style={{ color: 'rgba(255,255,255,0.74)', marginTop: 12, fontSize: 16, maxWidth: 520, marginInline: 'auto' }}>
            We meet you at the layout gate with the survey sketch and walk the actual plot boundaries with you.
          </p>
        </div>
      </div>

      <div className="shell" style={{ marginTop: -54, position: 'relative', zIndex: 10, maxWidth: 820 }}>
        <div className="card card-static" style={{ padding: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
            {stepLabels.map((label, i) => {
              const index = i + 1;
              const reached = step >= index;
              return (
                <div
                  key={label}
                  style={{
                    flex: 1, padding: '18px 12px', textAlign: 'center',
                    borderBottom: `3px solid ${reached ? 'var(--brand-gold)' : 'transparent'}`,
                    color: reached ? 'var(--brand-deep)' : 'var(--text-muted)',
                    fontWeight: 600, fontSize: 14,
                  }}
                >
                  {index}. {label}
                </div>
              );
            })}
          </div>

          <div style={{ padding: 'clamp(24px, 4vw, 40px)' }}>
            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                <h2 style={{ fontSize: 22, color: 'var(--brand-deep)', marginBottom: 20, fontFamily: "var(--font-sans)" }}>
                  Which layout would you like to see?
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {properties.map((p) => {
                    const active = plotId === p.id;
                    return (
                      <label
                        key={p.id}
                        style={{
                          display: 'flex', gap: 14, alignItems: 'center', padding: 12, cursor: 'pointer',
                          border: `1.5px solid ${active ? 'var(--brand-gold)' : 'var(--border-subtle)'}`,
                          background: active ? 'rgba(201,168,76,0.07)' : 'white',
                          borderRadius: 'var(--radius-md)', transition: 'all var(--transition-fast)',
                        }}
                      >
                        <input
                          type="radio"
                          name="plot"
                          value={p.id}
                          checked={active}
                          onChange={() => setPlotId(p.id)}
                          style={{ width: 17, height: 17, accentColor: 'var(--brand-deep)', flexShrink: 0 }}
                        />
                        <div style={{ width: 70, height: 54, position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                          <Image src={p.photos[0]} alt="" fill style={{ objectFit: 'cover' }} sizes="70px" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--brand-deep)', fontSize: 15 }}>{p.title}</div>
                          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={12} /> {p.location}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-gold-dark)' }}>{p.priceLabel}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{p.land?.availablePlots} open</div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={!plotId}>
                    Next <ChevronRight size={17} />
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); confirmVisit(); }}>
                <h2 style={{ fontSize: 22, color: 'var(--brand-deep)', marginBottom: 20, fontFamily: "var(--font-sans)" }}>
                  When suits you?
                </h2>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 22 }}>
                  <div className="form-group" style={{ flex: '1 1 220px' }}>
                    <label className="form-label" htmlFor="visit-date">
                      <Calendar size={13} style={{ display: 'inline', marginRight: 5 }} /> Date
                    </label>
                    <input
                      id="visit-date" type="date" className="form-input" required
                      value={date} onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group" style={{ flex: '1 1 220px' }}>
                    <label className="form-label">
                      <Users size={13} style={{ display: 'inline', marginRight: 5 }} /> Visitors
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setVisitors(n)}
                          className={`filter-pill ${visitors === n ? 'active' : ''}`}
                          style={{ flex: 1, padding: '11px 0' }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 26 }}>
                  <label className="form-label">
                    <Clock size={13} style={{ display: 'inline', marginRight: 5 }} /> Time slot
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSlot(t)}
                        className={`filter-pill ${slot === t ? 'active' : ''}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <label
                  style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16, marginBottom: 26,
                    border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-raised)', cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)}
                    style={{ width: 17, height: 17, accentColor: 'var(--brand-deep)', marginTop: 2 }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Car size={15} /> Pick me up
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                      Free cab from anywhere in {site.city}. Most layouts are 40–70 minutes out of the city.
                    </div>
                  </div>
                </label>

                <hr className="rule" style={{ marginBottom: 24 }} />

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
                  <div className="form-group" style={{ flex: '1 1 220px' }}>
                    <label className="form-label" htmlFor="visit-name">Your name</label>
                    <input id="visit-name" type="text" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="form-group" style={{ flex: '1 1 220px' }}>
                    <label className="form-label" htmlFor="visit-mobile">Mobile number</label>
                    <input id="visit-mobile" type="tel" className="form-input" required value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                </div>

                {error && (
                  <p role="alert" style={{ fontSize: 13.5, color: 'var(--status-sold)', background: 'rgba(180,69,60,0.08)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 18 }}>{error}</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                  <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || !date || !slot || !name || !mobile}>
                    {submitting ? 'Booking…' : 'Confirm visit'}
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <CheckCircle2 size={70} color="var(--status-available)" style={{ margin: '0 auto 22px' }} />
                <h2 className="font-display" style={{ fontSize: 'clamp(26px, 4vw, 34px)', color: 'var(--brand-deep)', marginBottom: 14 }}>
                  Site visit confirmed
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15.5, marginBottom: 32, maxWidth: 460, marginInline: 'auto', lineHeight: 1.65 }}>
                  Thanks {name.split(' ')[0]}. A land advisor will call {mobile} within the hour to confirm
                  {pickup ? ' your pickup point and' : ''} the meeting spot.
                </p>

                <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', padding: 26, maxWidth: 420, margin: '0 auto 34px', textAlign: 'left' }}>
                  <div style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 16 }}>
                    Your appointment
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Layout', value: plot?.title ?? '—' },
                      { label: 'Locality', value: plot?.location ?? '—' },
                      { label: 'Date', value: date },
                      { label: 'Time', value: slot },
                      { label: 'Visitors', value: `${visitors} person${visitors === 1 ? '' : 's'}` },
                      { label: 'Pickup', value: pickup ? 'Cab arranged' : 'Self drive' },
                    ].map((row) => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 14 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                        <strong style={{ color: 'var(--brand-deep)', textAlign: 'right' }}>{row.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {plot && <Link href={`/plots/${plot.slug}`} className="btn btn-dark">View this layout</Link>}
                  <Link href="/plots" className="btn btn-secondary">Browse more plots</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
