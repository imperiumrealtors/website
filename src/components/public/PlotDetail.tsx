'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  MapPin, Phone, MessageCircle, ChevronLeft, ChevronRight, Play, X, CheckCircle2,
  Train, GraduationCap, Stethoscope, Building2, Plane, ShoppingBag, TreePine, Waves,
  Route, Ruler, Compass, ShieldCheck, TrendingUp, Droplets, Layers,
} from 'lucide-react';
import { FALLBACK_PHOTO } from '@/lib/data';
import { Infrastructure, NearbyPlace, PlotUnit, Property } from '@/lib/types';
import { site, whatsappLink } from '@/lib/config';
import { PLOT_SIZE_OPTIONS, PURPOSE_OPTIONS, VISIT_SLOT_OPTIONS } from '@/lib/options';
import BrandSelect from '@/components/BrandSelect';
import { postPublic } from '@/lib/public-api';

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'inventory', label: 'Available Plots' },
  { id: 'legal', label: 'Legal & Approvals' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'pricing', label: 'Pricing & Loan' },
  { id: 'location', label: 'Location' },
  { id: 'enquire', label: 'Enquire' },
];

const nearbyIcon = (type: NearbyPlace['type']) => {
  switch (type) {
    case 'Metro': return <Train size={17} />;
    case 'School': return <GraduationCap size={17} />;
    case 'Hospital': return <Stethoscope size={17} />;
    case 'IT Park': return <Building2 size={17} />;
    case 'Airport': return <Plane size={17} />;
    case 'Mall': return <ShoppingBag size={17} />;
    case 'Beach': return <Waves size={17} />;
    case 'Highway': return <Route size={17} />;
    default: return <TreePine size={17} />;
  }
};

const availabilityStyle: Record<PlotUnit['availability'], { dot: string; color: string }> = {
  Available: { dot: 'avail-available', color: 'var(--status-available)' },
  'On Hold': { dot: 'avail-hold', color: 'var(--status-hold)' },
  Sold: { dot: 'avail-sold', color: 'var(--status-sold)' },
};

export default function PlotDetail({ plot }: { plot: Property }) {
  const [tab, setTab] = useState<'Photos' | 'Video'>('Photos');
  const [photoIdx, setPhotoIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [stickyBar, setStickyBar] = useState(false);
  const [visitModal, setVisitModal] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [wantedSize, setWantedSize] = useState('');
  const [visitSlot, setVisitSlot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [loanAmount, setLoanAmount] = useState(() => Math.max(5, Math.round(plot.price * 0.75)));
  const [rate, setRate] = useState(9);
  const [tenure, setTenure] = useState(15);

  useEffect(() => {
    const onScroll = () => {
      setStickyBar(window.scrollY > 520);
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el) {
          const { top } = el.getBoundingClientRect();
          if (top >= 0 && top <= 320) { setActiveSection(s.id); break; }
        }
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const emi = useMemo(() => {
    const principal = loanAmount * 100000;
    const monthlyRate = rate / 12 / 100;
    const months = tenure * 12;
    if (monthlyRate === 0) return Math.round(principal / months);
    return Math.round((principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1));
  }, [loanAmount, rate, tenure]);

  const units = useMemo(() => {
    const all = plot.land?.units ?? [];
    return availableOnly ? all.filter((u) => u.availability !== 'Sold') : all;
  }, [plot, availableOnly]);

  const infraGroups = useMemo(() => {
    const groups = new Map<string, Infrastructure[]>();
    plot.infrastructure.forEach((item) => {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    });
    return [...groups.entries()];
  }, [plot]);

  const land = plot.land;
  const enquiryText = `Hi ${site.name}, I am interested in ${plot.title} at ${plot.location}.`;

  const submitEnquiry = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    setSubmitting(true);
    setFormError(null);
    const result = await postPublic('/api/public/leads', {
      name: data.get('name'), phone: data.get('phone'), purpose, size: wantedSize,
      layoutSlug: plot.slug, source: 'Website — plot enquiry', website: data.get('website'),
    });
    setSubmitting(false);
    if (result.ok) setEnquirySent(true);
    else setFormError(result.error);
  };

  const submitVisit = async (form: HTMLFormElement) => {
    const data = new FormData(form);
    setSubmitting(true);
    setFormError(null);
    const result = await postPublic('/api/public/site-visits', {
      name: data.get('name'), phone: data.get('phone'), date: data.get('date'), time: visitSlot,
      layoutSlug: plot.slug, website: data.get('website'),
    });
    setSubmitting(false);
    if (result.ok) { setVisitModal(false); setEnquirySent(true); }
    else setFormError(result.error);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 150, behavior: 'smooth' });
  };

  return (
    <div style={{ background: 'var(--surface-raised)', minHeight: '100vh', paddingBottom: 80 }}>
      {/* STICKY ACTION BAR */}
      <div
        style={{
          position: 'fixed', top: 'var(--nav-height)', left: 0, right: 0, zIndex: 40,
          background: 'white', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--border-subtle)',
          transform: stickyBar ? 'translateY(0)' : 'translateY(-130%)',
          opacity: stickyBar ? 1 : 0,
          pointerEvents: stickyBar ? 'auto' : 'none',
          transition: 'transform var(--transition-base), opacity var(--transition-base)',
          padding: '11px 0',
        }}
      >
        <div className="shell" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, minWidth: 0 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-deep)', fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {plot.title}
            </h2>
            <span className="price-tag price-tag-sm hidden-mobile">{plot.priceLabel}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <a href={whatsappLink(enquiryText)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm hidden-mobile">
              <MessageCircle size={14} /> WhatsApp
            </a>
            <button className="btn btn-primary btn-sm" onClick={() => setVisitModal(true)}>Book Site Visit</button>
          </div>
        </div>
      </div>

      {/* GALLERY */}
      <div style={{ paddingTop: 'calc(var(--nav-height) + 14px)', background: '#0D1B2A' }}>
        <div className="shell-lg" style={{ padding: '0 12px' }}>
          <div className="gallery-main" style={{ aspectRatio: '16/7', maxHeight: '68vh' }}>
            {tab === 'Photos' ? (
              <>
                <Image
                  src={plot.photos[photoIdx] ?? FALLBACK_PHOTO}
                  alt={`${plot.title} — view ${photoIdx + 1}`}
                  fill
                  style={{ objectFit: 'cover', cursor: 'zoom-in' }}
                  onClick={() => setLightbox(true)}
                  preload
                  sizes="100vw"
                />
                <button
                  onClick={() => setPhotoIdx((i) => (i > 0 ? i - 1 : plot.photos.length - 1))}
                  aria-label="Previous photo"
                  style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={() => setPhotoIdx((i) => (i < plot.photos.length - 1 ? i + 1 : 0))}
                  aria-label="Next photo"
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                >
                  <ChevronRight size={22} />
                </button>
                <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 12px', borderRadius: 99, fontSize: 12.5, backdropFilter: 'blur(4px)' }}>
                  {photoIdx + 1} / {plot.photos.length}
                </div>
              </>
            ) : (
              <iframe
                width="100%" height="100%" src={plot.videoUrl}
                title={`${plot.title} walkthrough`} allowFullScreen
                style={{ position: 'absolute', inset: 0, border: 'none' }}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`tab-btn ${tab === 'Photos' ? 'active' : ''}`} style={{ color: tab === 'Photos' ? 'var(--brand-deep)' : 'rgba(255,255,255,0.75)' }} onClick={() => setTab('Photos')}>
                Photos
              </button>
              {plot.videoUrl && (
                <button className={`tab-btn ${tab === 'Video' ? 'active' : ''}`} style={{ color: tab === 'Video' ? 'var(--brand-deep)' : 'rgba(255,255,255,0.75)' }} onClick={() => setTab('Video')}>
                  <Play size={13} style={{ display: 'inline', marginRight: 5 }} /> Site walkthrough
                </button>
              )}
            </div>

            {tab === 'Photos' && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {plot.photos.map((photo, i) => (
                  <button
                    key={photo + i}
                    onClick={() => setPhotoIdx(i)}
                    aria-label={`View photo ${i + 1}`}
                    className={`gallery-thumb ${photoIdx === i ? 'active' : ''}`}
                    style={{ width: 82, height: 60, position: 'relative', flexShrink: 0, padding: 0, background: 'none' }}
                  >
                    <Image src={photo} alt="" fill style={{ objectFit: 'cover' }} sizes="82px" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION NAV */}
      <div style={{ position: 'sticky', top: stickyBar ? 'calc(var(--nav-height) + 52px)' : 'var(--nav-height)', zIndex: 39, background: 'var(--surface-raised)', borderBottom: '1px solid var(--border-subtle)', transition: 'top var(--transition-base)' }}>
        <div className="shell" style={{ display: 'flex', gap: 26, overflowX: 'auto' }}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '15px 0', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap',
                color: activeSection === s.id ? 'var(--brand-gold-dark)' : 'var(--text-secondary)',
                borderBottom: `2px solid ${activeSection === s.id ? 'var(--brand-gold)' : 'transparent'}`,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="shell" style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 62%', minWidth: 300, display: 'flex', flexDirection: 'column', gap: 44 }}>

            {/* OVERVIEW */}
            <section id="overview">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 18, marginBottom: 26 }}>
                <div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span className="chip chip-gold">{plot.corridor}</span>
                    {land && <span className="chip">{land.use} land</span>}
                  </div>
                  <h1 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--brand-deep)', marginBottom: 10, lineHeight: 1.15 }}>
                    {plot.title}
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14.5, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <MapPin size={16} style={{ flexShrink: 0, marginTop: 2 }} /> {plot.address}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="price-tag price-tag-lg">{plot.priceLabel}</div>
                  {land && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
                      ₹{land.pricePerSqft.toLocaleString('en-IN')} per sq.ft
                    </div>
                  )}
                </div>
              </div>

              {land && (
                <div className="spec-grid">
                  <div className="spec-item">
                    <div className="spec-label">Plot sizes</div>
                    <div className="spec-value">
                      {Math.min(...land.units.map((u) => u.area)).toLocaleString('en-IN')} – {Math.max(...land.units.map((u) => u.area)).toLocaleString('en-IN')} sq.ft
                    </div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Approvals</div>
                    <div className="spec-value">{land.approvals.join(' · ')}</div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Facing options</div>
                    <div className="spec-value">{land.facingOptions.join(', ')}</div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Internal roads</div>
                    <div className="spec-value">{land.roadWidth}</div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Availability</div>
                    <div className="spec-value" style={{ color: land.availablePlots < 10 ? 'var(--status-hold)' : 'var(--status-available)' }}>
                      {land.availablePlots} of {land.totalPlots} open
                    </div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Appreciation</div>
                    <div className="spec-value">{land.appreciation}</div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Water source</div>
                    <div className="spec-value">{land.waterSource}</div>
                  </div>
                  <div className="spec-item">
                    <div className="spec-label">Handover</div>
                    <div className="spec-value">{plot.possession}</div>
                  </div>
                </div>
              )}

              <div className="prose-content" style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 21, color: 'var(--brand-deep)', marginBottom: 14, fontFamily: "'Inter', sans-serif" }}>About this layout</h3>
                <p>{plot.description}</p>

                <h4 style={{ fontSize: 17, color: 'var(--brand-deep)', marginTop: 26, marginBottom: 14 }}>Why buyers pick it</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {plot.highlights.map((h) => (
                    <li key={h} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
                      <CheckCircle2 size={19} color="var(--status-available)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ lineHeight: 1.6 }}>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* PLOT INVENTORY */}
            {land && (
              <section id="inventory">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontSize: 22, color: 'var(--brand-deep)', fontFamily: "'Inter', sans-serif", marginBottom: 6 }}>Plot-by-plot availability</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                      Live inventory for {plot.title}. Held plots release back if the token lapses.
                    </p>
                  </div>
                  <button className={`filter-pill ${availableOnly ? 'active' : ''}`} onClick={() => setAvailableOnly(!availableOnly)}>
                    Hide sold plots
                  </button>
                </div>

                <div className="card card-static" style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th>Plot</th>
                        <th>Extent</th>
                        <th>Dimensions</th>
                        <th>Facing</th>
                        <th style={{ textAlign: 'right' }}>Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((u) => {
                        const style = availabilityStyle[u.availability];
                        const sold = u.availability === 'Sold';
                        return (
                          <tr key={u.id} style={{ opacity: sold ? 0.55 : 1 }}>
                            <td style={{ fontWeight: 700, color: 'var(--brand-deep)' }}>
                              {u.number}
                              {u.corner && <span className="chip chip-gold" style={{ marginLeft: 8, fontSize: 10, padding: '2px 8px' }}>Corner</span>}
                            </td>
                            <td>{u.area.toLocaleString('en-IN')} sq.ft</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{u.dimensions}</td>
                            <td>{u.facing}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{u.priceLabel}</td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600, color: style.color, fontSize: 13 }}>
                                <span className={`avail-dot ${style.dot}`} /> {u.availability}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 12 }}>
                  Prices shown are plot value only and exclude registration, stamp duty and development charges.
                </p>
              </section>
            )}

            {/* LEGAL */}
            {land && (
              <section id="legal">
                <h3 style={{ fontSize: 22, color: 'var(--brand-deep)', fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>Legal &amp; approvals</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
                  Approval numbers below are public record — verify them on the DTCP and TNRERA portals before you pay anything.
                </p>

                <div className="card card-static" style={{ padding: 22, marginBottom: 18, background: 'var(--brand-deep)', color: 'white' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <ShieldCheck size={26} color="var(--brand-gold)" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, letterSpacing: 1.3, textTransform: 'uppercase', color: 'var(--brand-gold)', fontWeight: 700, marginBottom: 6 }}>
                        Approval reference
                      </div>
                      <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: 1.6 }}>{land.approvalId}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 14 }}>
                  {land.documents.map((doc) => (
                    <div key={doc.name} className="infra-item" style={{ alignItems: 'flex-start' }}>
                      <CheckCircle2 size={20} color={doc.verified ? 'var(--status-available)' : 'var(--text-muted)'} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-deep)', marginBottom: 3 }}>{doc.name}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{doc.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 20 }}>
                  <div className="card card-static" style={{ flex: '1 1 200px', padding: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Layers size={20} color="var(--brand-gold-dark)" />
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.9 }}>Soil</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand-deep)' }}>{land.soil}</div>
                    </div>
                  </div>
                  <div className="card card-static" style={{ flex: '1 1 200px', padding: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Droplets size={20} color="var(--brand-gold-dark)" />
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.9 }}>Water</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand-deep)' }}>{land.waterSource}</div>
                    </div>
                  </div>
                  <div className="card card-static" style={{ flex: '1 1 200px', padding: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <TrendingUp size={20} color="var(--brand-gold-dark)" />
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.9 }}>Loan</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand-deep)' }}>
                        {land.loanEligible ? 'Plot loan eligible' : 'Self-funded only'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* INFRASTRUCTURE */}
            <section id="infrastructure">
              <h3 style={{ fontSize: 22, color: 'var(--brand-deep)', fontFamily: "'Inter', sans-serif", marginBottom: 20 }}>What is already in the ground</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {infraGroups.map(([category, items]) => (
                  <div key={category}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                      {category}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
                      {items.map((item) => (
                        <div key={item.id} className="infra-item">
                          <div className="infra-icon">{item.icon}</div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--brand-deep)' }}>{item.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* PRICING */}
            <section id="pricing">
              <h3 style={{ fontSize: 22, color: 'var(--brand-deep)', fontFamily: "'Inter', sans-serif", marginBottom: 20 }}>What it actually costs</h3>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div className="card card-static" style={{ flex: '1 1 320px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)', fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Cost breakdown
                  </div>
                  <table className="data-table">
                    <tbody>
                      {plot.priceBreakdown.map((item, i) => {
                        const isTotal = i === plot.priceBreakdown.length - 1;
                        return (
                          <tr key={item.label} style={{ background: isTotal ? 'var(--surface-raised)' : 'white' }}>
                            <td style={{ fontWeight: isTotal ? 700 : 400 }}>{item.label}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: isTotal ? 'var(--brand-gold-dark)' : 'inherit' }}>{item.amount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="card card-static" style={{ flex: '1 1 300px', padding: 24 }}>
                  <h4 style={{ fontSize: 17, color: 'var(--brand-deep)', marginBottom: 6 }}>Plot loan calculator</h4>
                  <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20 }}>
                    Banks typically fund 70–80% of plot value on approved layouts.
                  </p>

                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label">Loan amount</label>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brand-gold-dark)' }}>₹{loanAmount} L</span>
                    </div>
                    <input type="range" min={5} max={Math.round(plot.price * 0.8)} value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label">Interest rate</label>
                      <span style={{ fontSize: 13.5, fontWeight: 700 }}>{rate.toFixed(1)}%</span>
                    </div>
                    <input type="range" min={7} max={14} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label">Tenure</label>
                      <span style={{ fontSize: 13.5, fontWeight: 700 }}>{tenure} years</span>
                    </div>
                    <input type="range" min={5} max={20} value={tenure} onChange={(e) => setTenure(Number(e.target.value))} />
                  </div>

                  <div style={{ background: 'var(--brand-deep)', color: 'white', padding: 18, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Estimated EMI</div>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>
                      ₹{emi.toLocaleString('en-IN')}
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}> /month</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* LOCATION */}
            <section id="location">
              <h3 style={{ fontSize: 22, color: 'var(--brand-deep)', fontFamily: "'Inter', sans-serif", marginBottom: 20 }}>Where it sits</h3>
              <div className="card card-static" style={{ padding: 22, marginBottom: 22 }}>
                <div style={{ height: 380, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <iframe
                    width="100%" height="100%" style={{ border: 'none' }}
                    title={`Map of ${plot.title}`} loading="lazy"
                    src={`https://maps.google.com/maps?q=${plot.coordinates.lat},${plot.coordinates.lng}&z=14&output=embed`}
                  />
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, display: 'flex', gap: 7, alignItems: 'flex-start', flex: '1 1 260px' }}>
                    <MapPin size={16} color="var(--brand-gold-dark)" style={{ flexShrink: 0, marginTop: 2 }} /> {plot.address}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${plot.coordinates.lat},${plot.coordinates.lng}`}
                    target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm"
                  >
                    Get directions
                  </a>
                </div>
              </div>

              <h4 style={{ fontSize: 16, color: 'var(--brand-deep)', marginBottom: 14 }}>What is nearby</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 12 }}>
                {plot.nearbyPlaces.map((place) => (
                  <div key={place.name} className="nearby-pill">
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--brand-deep-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-deep)', flexShrink: 0 }}>
                      {nearbyIcon(place.type)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--brand-deep)' }}>{place.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{place.distance} · {place.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CONTACT BANNER */}
            <section style={{ marginBottom: 20 }}>
              <div className="card card-static" style={{ padding: 40, background: 'var(--brand-deep)', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.35 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 className="font-display" style={{ fontSize: 'clamp(24px, 3.4vw, 32px)', marginBottom: 14 }}>
                    Want to walk {plot.title}?
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.72)', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.65 }}>
                    We will pick you up, walk the boundaries with the survey sketch in hand, and answer
                    every question about the title on site.
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a href={whatsappLink(enquiryText)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-lg">
                      <MessageCircle size={19} /> WhatsApp us
                    </a>
                    <a href={site.phoneHref} className="btn btn-white btn-lg"><Phone size={19} /> {site.phone}</a>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* SIDEBAR */}
          <div style={{ flex: '1 1 300px', minWidth: 290 }} id="enquire">
            <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + 76px)' }}>
              <div className="card card-static" style={{ padding: 24, borderTop: '4px solid var(--brand-gold)', overflow: 'visible' }}>
                {enquirySent ? (
                  <div style={{ padding: '28px 0', textAlign: 'center' }}>
                    <CheckCircle2 size={46} color="var(--status-available)" style={{ margin: '0 auto 16px' }} />
                    <h4 style={{ fontSize: 18, color: 'var(--brand-deep)', marginBottom: 8 }}>Enquiry received</h4>
                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 20 }}>
                      A land advisor will call you within 30 minutes with the plot sketch and availability.
                    </p>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEnquirySent(false)}>Send another</button>
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-deep)', marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
                      Get the plot sketch
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Layout plan, available plot numbers and the price sheet — sent within the hour.
                    </p>

                    <form
                      onSubmit={(e) => { e.preventDefault(); submitEnquiry(e.currentTarget); }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                    >
                      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, opacity: 0 }} />
                      <div className="form-group">
                        <label className="form-label" htmlFor="enq-name">Your name</label>
                        <input id="enq-name" name="name" type="text" className="form-input" required placeholder="Full name" />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="enq-mobile">Mobile number</label>
                        <input id="enq-mobile" name="phone" type="tel" className="form-input" required placeholder="+91 98765 43210" />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="enq-purpose">What is the plot for?</label>
                        <BrandSelect id="enq-purpose" required placeholder="Select purpose" value={purpose} onChange={setPurpose} options={PURPOSE_OPTIONS} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="enq-size">Plot size you want</label>
                        <BrandSelect id="enq-size" required placeholder="Select size" value={wantedSize} onChange={setWantedSize} options={PLOT_SIZE_OPTIONS} />
                      </div>
                      {formError && !visitModal && (
                        <p role="alert" style={{ fontSize: 13, color: 'var(--status-sold)', background: 'rgba(180,69,60,0.08)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>{formError}</p>
                      )}
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={submitting}>
                        {submitting ? 'Sending…' : 'Send me the details'}
                      </button>
                      <button type="button" className="btn btn-dark" style={{ width: '100%' }} onClick={() => setVisitModal(true)}>
                        Book a site visit
                      </button>
                    </form>
                  </>
                )}

                <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0 18px', color: 'var(--text-muted)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 1 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                  <span style={{ padding: '0 12px' }}>or reach us directly</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <a href={whatsappLink(enquiryText)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ width: '100%' }}>
                    <MessageCircle size={17} /> WhatsApp
                  </a>
                  <a href={site.phoneHref} className="btn btn-secondary" style={{ width: '100%' }}>
                    <Phone size={17} /> {site.phone}
                  </a>
                </div>
              </div>

              {land && (
                <div className="card card-static" style={{ padding: 20, marginTop: 18 }}>
                  <div style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 14 }}>
                    At a glance
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { icon: Ruler, label: 'Entry size', value: `${Math.min(...land.units.map((u) => u.area)).toLocaleString('en-IN')} sq.ft` },
                      { icon: Compass, label: 'Facings', value: land.facingOptions.join(', ') },
                      { icon: ShieldCheck, label: 'Approved by', value: land.approvals.join(' · ') },
                      { icon: TrendingUp, label: 'Growth', value: land.appreciation },
                    ].map((row) => (
                      <div key={row.label} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                        <row.icon size={16} color="var(--brand-gold-dark)" style={{ flexShrink: 0, marginTop: 3 }} />
                        <div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{row.label}</div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--brand-deep)' }}>{row.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="modal-overlay" style={{ background: 'rgba(5,20,15,0.96)', padding: 0 }} onClick={() => setLightbox(false)}>
          <button
            aria-label="Close"
            onClick={() => setLightbox(false)}
            style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'white', cursor: 'pointer', zIndex: 2 }}
          >
            <X size={30} />
          </button>
          <div style={{ position: 'relative', width: '92vw', height: '88vh' }} onClick={(e) => e.stopPropagation()}>
            <Image src={plot.photos[photoIdx]} alt={plot.title} fill style={{ objectFit: 'contain' }} sizes="92vw" />
          </div>
        </div>
      )}

      {/* SITE VISIT MODAL */}
      {visitModal && (
        <div className="modal-overlay" onClick={() => setVisitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h3 className="font-display" style={{ fontSize: 23, color: 'var(--brand-deep)' }}>Book a site visit</h3>
              <button onClick={() => setVisitModal(false)} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={22} />
              </button>
            </div>

            <div style={{ background: 'var(--surface-raised)', padding: 14, borderRadius: 'var(--radius-md)', display: 'flex', gap: 14, alignItems: 'center', marginBottom: 22 }}>
              <div style={{ width: 58, height: 58, position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0 }}>
                <Image src={plot.photos[0]} alt="" fill style={{ objectFit: 'cover' }} sizes="58px" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--brand-deep)' }}>{plot.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{plot.location}</div>
              </div>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); submitVisit(e.currentTarget); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, opacity: 0 }} />
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 150px' }}>
                  <label className="form-label" htmlFor="visit-date">Date</label>
                  <input id="visit-date" name="date" type="date" className="form-input" required min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group" style={{ flex: '1 1 150px' }}>
                  <label className="form-label" htmlFor="visit-time">Time slot</label>
                  <BrandSelect id="visit-time" required placeholder="Pick a slot" value={visitSlot} onChange={setVisitSlot} options={VISIT_SLOT_OPTIONS} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="visit-name">Your name</label>
                <input id="visit-name" name="name" type="text" className="form-input" required placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="visit-mobile">Mobile number</label>
                <input id="visit-mobile" name="phone" type="tel" className="form-input" required placeholder="+91 98765 43210" />
              </div>
              {formError && (
                <p role="alert" style={{ fontSize: 13, color: 'var(--status-sold)', background: 'rgba(180,69,60,0.08)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>{formError}</p>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 15 }} disabled={submitting}>
                {submitting ? 'Sending…' : 'Confirm site visit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
