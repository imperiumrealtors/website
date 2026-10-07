'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, MessageCircle, CheckCircle2 } from 'lucide-react';
import { corridors } from '@/lib/data';
import { site, whatsappLink } from '@/lib/config';
import { BUDGET_OPTIONS, PURPOSE_OPTIONS, TIMELINE_OPTIONS } from '@/lib/options';
import BrandSelect from '@/components/BrandSelect';
import { postPublic } from '@/lib/public-api';

const EMPTY_FORM = { corridor: '', budget: '', purpose: '', timeline: '' };

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (el: HTMLFormElement) => {
    const data = new FormData(el);
    setSubmitting(true);
    setError(null);
    const result = await postPublic('/api/public/leads', {
      name: data.get('name'), phone: data.get('phone'), email: data.get('email'),
      corridor: form.corridor, budget: form.budget, purpose: form.purpose, timeline: form.timeline,
      message: data.get('message'), website: data.get('website'), source: 'Website — contact form',
    });
    setSubmitting(false);
    if (result.ok) { setSent(true); setForm(EMPTY_FORM); }
    else setError(result.error);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-raised)', paddingBottom: 90 }}>
      <div style={{ background: 'var(--gradient-hero)', position: 'relative', paddingTop: 'calc(var(--nav-height) + 48px)', paddingBottom: 48 }}>
        <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
        <div className="shell" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12.5, color: 'var(--brand-gold)', fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 12 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> / Contact
          </div>
          <h1 className="font-display" style={{ color: 'white', fontSize: 'clamp(30px, 4.6vw, 48px)', margin: 0 }}>Talk to a land advisor</h1>
          <p style={{ color: 'rgba(255,255,255,0.74)', marginTop: 12, maxWidth: 560, fontSize: 15.5 }}>
            Tell us your budget and what you plan to do with the land. We will tell you which corridor
            fits — including when the answer is none of ours.
          </p>
        </div>
      </div>

      <div className="shell" style={{ marginTop: 36 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
          <div style={{ flex: '1 1 460px' }}>
            <div className="card card-static" style={{ padding: 'clamp(24px, 4vw, 38px)' }}>
              {sent ? (
                <div style={{ padding: '36px 0', textAlign: 'center' }}>
                  <CheckCircle2 size={58} color="var(--status-available)" style={{ margin: '0 auto 20px' }} />
                  <h2 className="font-display" style={{ fontSize: 26, color: 'var(--brand-deep)', marginBottom: 12 }}>Message received</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 26 }}>
                    An advisor will be in touch within one working day — usually much sooner.
                  </p>
                  <button className="btn btn-secondary" onClick={() => setSent(false)}>Send another message</button>
                </div>
              ) : (
                <>
                  <h2 className="font-display" style={{ fontSize: 28, color: 'var(--brand-deep)', marginBottom: 8 }}>Send us a message</h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
                    The more specific you are, the more useful our first reply will be.
                  </p>

                  <form onSubmit={(e) => { e.preventDefault(); submit(e.currentTarget); }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, opacity: 0 }} />
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: '1 1 200px' }}>
                        <label className="form-label" htmlFor="c-name">Full name</label>
                        <input id="c-name" name="name" type="text" className="form-input" required placeholder="Your name" />
                      </div>
                      <div className="form-group" style={{ flex: '1 1 200px' }}>
                        <label className="form-label" htmlFor="c-mobile">Mobile number</label>
                        <input id="c-mobile" name="phone" type="tel" className="form-input" required placeholder="+91 98765 43210" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="c-email">Email address</label>
                      <input id="c-email" name="email" type="email" className="form-input" required placeholder="you@example.com" />
                    </div>

                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: '1 1 200px' }}>
                        <label className="form-label" htmlFor="c-corridor">Preferred corridor</label>
                        <BrandSelect
                          id="c-corridor"
                          value={form.corridor}
                          onChange={(v) => setForm({ ...form, corridor: v })}
                          options={[{ value: '', label: 'Not decided yet' }, ...corridors.map((c) => ({ value: c.name, label: c.name }))]}
                        />
                      </div>
                      <div className="form-group" style={{ flex: '1 1 200px' }}>
                        <label className="form-label" htmlFor="c-budget">Budget</label>
                        <BrandSelect id="c-budget" required placeholder="Select a range" value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} options={BUDGET_OPTIONS} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: '1 1 200px' }}>
                        <label className="form-label" htmlFor="c-purpose">Purpose</label>
                        <BrandSelect id="c-purpose" required placeholder="Select purpose" value={form.purpose} onChange={(v) => setForm({ ...form, purpose: v })} options={PURPOSE_OPTIONS} />
                      </div>
                      <div className="form-group" style={{ flex: '1 1 200px' }}>
                        <label className="form-label" htmlFor="c-timeline">Timeline</label>
                        <BrandSelect id="c-timeline" required placeholder="Select timeline" value={form.timeline} onChange={(v) => setForm({ ...form, timeline: v })} options={TIMELINE_OPTIONS} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="c-message">Anything specific?</label>
                      <textarea
                        id="c-message" name="message" className="form-input" rows={4}
                        placeholder="e.g. Looking for a 1,200 sq.ft east-facing corner plot on OMR, ready to register."
                      />
                    </div>

                    {error && (
                      <p role="alert" style={{ fontSize: 13.5, color: 'var(--status-sold)', background: 'rgba(180,69,60,0.08)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>{error}</p>
                    )}

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
                      {submitting ? 'Sending…' : 'Send message'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card card-static" style={{ padding: 32, background: 'var(--brand-deep)', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.35 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 26, fontFamily: "var(--font-sans)" }}>Reach us directly</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  {[
                    { icon: MapPin, title: 'Head office', lines: site.addressLines },
                    { icon: Phone, title: 'Phone', lines: [site.phone, site.phoneAlt, site.phoneAlt2] },
                    { icon: Mail, title: 'Email', lines: [site.email] },
                    { icon: Clock, title: 'Open', lines: ['Mon – Sat: 9:00 AM – 7:00 PM', 'Sunday: 10:00 AM – 5:00 PM'] },
                  ].map((item) => (
                    <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(201,168,76,0.16)', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <item.icon size={21} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 4, color: 'white' }}>{item.title}</h4>
                        {item.lines.map((line) => (
                          <div key={line} style={{ color: 'rgba(255,255,255,0.68)', fontSize: 13.5, lineHeight: 1.7 }}>{line}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card card-static" style={{ height: 280, overflow: 'hidden', padding: 0 }}>
              <iframe
                width="100%" height="100%" style={{ border: 'none' }} loading="lazy"
                title={`${site.name} head office`}
                src={`https://maps.google.com/maps?q=${site.mapQuery}&z=15&output=embed`}
              />
            </div>

            <a
              href={whatsappLink(`Hello ${site.name}, I would like to speak to a land advisor.`)}
              target="_blank" rel="noopener noreferrer"
              className="btn btn-whatsapp btn-lg"
              style={{ width: '100%' }}
            >
              <MessageCircle size={19} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
