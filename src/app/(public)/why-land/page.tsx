'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Banknote, Scale, Map } from 'lucide-react';
import { site } from '@/lib/config';

const CHECKLIST = [
  { title: 'Layout approval', body: 'DTCP, CMDA or a panchayat NOC. An unapproved layout cannot be regularised cheaply and banks will not lend against it.' },
  { title: 'Parent document trail', body: 'A 30-year title trace showing every owner in the chain. Gaps in the chain are the single most common reason a land deal collapses later.' },
  { title: 'Encumbrance certificate', body: 'The EC lists every registered charge on the land. Ask for 30 years, not the 13 years most sellers offer.' },
  { title: 'Patta and chitta', body: 'Patta proves revenue ownership. Confirm the survey number on the patta matches the plot you are being shown on the ground.' },
  { title: 'Road access', body: 'The approach road must appear in the approved layout plan. A private mud road that a neighbour can close is not access.' },
  { title: 'Guideline value', body: 'Compare the asking rate against the government guideline value for that survey number. A huge gap either way is worth explaining.' },
  { title: 'Water and soil', body: 'Ask for the borewell depth and yield, and whether the soil bears construction load without piling.' },
  { title: 'Flood and CRZ status', body: 'Check the plot against the local flood map, and for coastal land, its CRZ classification.' },
];

const APPROVALS = [
  { name: 'CMDA', scope: 'Inside the Chennai Metropolitan Area', note: 'The strictest standard. Road widths, open space reservation and drainage are all enforced. Banks sanction fastest against CMDA layouts.' },
  { name: 'DTCP', scope: 'Outside metro limits, across Tamil Nadu', note: 'The Directorate of Town and Country Planning approves layouts in the districts. Equivalent legal standing to CMDA for lending purposes.' },
  { name: 'RERA', scope: 'Any layout sold as plots to the public', note: 'Registration under TNRERA makes the promoter legally accountable for the promised infrastructure and handover date.' },
  { name: 'Panchayat', scope: 'Village panchayat land, typically farmland', note: 'Adequate for agricultural and farm plots. Not sufficient for residential construction without a land use conversion.' },
];

const HIDDEN_COSTS = [
  { label: 'Stamp duty & registration', value: '7% of guideline value', note: 'Payable at the sub-registrar office on the day of registration.' },
  { label: 'Layout development charges', value: '₹90,000 – ₹5,00,000', note: 'Covers roads, drains, power and water already laid in the layout.' },
  { label: 'Legal & documentation', value: '₹25,000 – ₹80,000', note: 'Title search, drafting and advocate fees.' },
  { label: 'Compound wall (optional)', value: '₹400 – ₹650 / running ft', note: 'Most buyers fence the plot within the first year.' },
  { label: 'Corpus / maintenance', value: '₹0 – ₹75,000 one time', note: 'Only in layouts with a clubhouse or shared amenities.' },
];

const FAQS = [
  {
    q: 'Can I get a bank loan to buy a plot?',
    a: 'Yes. SBI, HDFC, LIC Housing and most private banks offer plot loans against approved layouts, typically funding 70–80% of the plot value over 10–15 years. Rates run about 0.25–0.75% above a regular home loan. A composite plot-plus-construction loan gets you home-loan rates and the Section 24 tax benefit, but you have to start building within a set window — usually three years.',
  },
  {
    q: 'What is the real difference between DTCP and CMDA approval?',
    a: 'It is a question of jurisdiction, not quality. CMDA approves layouts inside the Chennai Metropolitan Area; DTCP approves them in the districts outside it. Both are statutory approvals and both are accepted by lenders. CMDA norms on road width and open space are marginally stricter, which is why CMDA layouts often sanction faster at the bank.',
  },
  {
    q: 'Is buying farmland a good idea if I only want investment returns?',
    a: 'Only with your eyes open. Farmland is cheaper per square foot and appreciates well near growing corridors, but it is harder to finance — most banks will not lend against it — and converting it to residential use takes time and money. If you want a pure investment with an easy exit, an approved residential plot is the simpler instrument.',
  },
  {
    q: 'How long does registration actually take?',
    a: 'Once the title is verified and funds are ready, registration itself is a single appointment at the sub-registrar office and takes a few hours. The work before it — title search, EC, bank sanction if you are borrowing — is what takes two to six weeks. We handle the paperwork end to end and give you a date you can plan around.',
  },
  {
    q: 'Should I fence the plot immediately after buying?',
    a: 'Yes, and mark the survey stones while you are at it. A fenced, visibly maintained plot is far less likely to attract encroachment, and it makes resale easier because the buyer can see exactly what they are getting. Budget roughly ₹400–650 per running foot for a basic compound wall.',
  },
  {
    q: 'What if I never build on it?',
    a: 'That is a perfectly normal outcome — a large share of plot buyers hold the land and sell it on. There is no maintenance cost of consequence, no structure to depreciate, and no association dues. Property tax on vacant land is nominal. Just keep the patta current and the boundary visible.',
  },
];

export default function WhyLandPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-base)' }}>
      <div style={{ background: 'var(--gradient-hero)', position: 'relative', paddingTop: 'calc(var(--nav-height) + 60px)', paddingBottom: 72 }}>
        <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.42 }} />
        <div className="shell" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 820 }}>
            <div style={{ fontSize: 12.5, color: 'var(--brand-gold)', fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 16 }}>
              <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link> / Why Land
            </div>
            <h1 className="font-display" style={{ color: 'white', fontSize: 'clamp(32px, 5vw, 54px)', margin: '0 0 20px', lineHeight: 1.12 }}>
              Everything you should check before you buy land
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 17, lineHeight: 1.7 }}>
              Land is the better asset and the harder purchase. The upside is real, but so is the paperwork —
              and almost every bad land deal in {site.city} traces back to a document nobody read. Here is the
              short version of what {site.name} checks on every layout, so you can check it too.
            </p>
          </div>
        </div>
      </div>

      {/* WHY LAND */}
      <section className="section">
        <div className="shell">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 28 }}>
            {[
              { icon: Scale, title: 'You own the appreciating half', body: 'In an apartment, a large share of the price is concrete that loses value every year. In a plot, all of it is land — the part that has never stopped rising in Chennai.' },
              { icon: Map, title: 'You control what gets built', body: 'Orientation, room sizes, Vastu, budget, timeline. None of it is decided for you by a builder trying to hit a per-square-foot target.' },
              { icon: Banknote, title: 'Almost nothing to carry', body: 'No monthly maintenance, no sinking fund, no association politics. Vacant land property tax is nominal, so holding costs stay close to zero.' },
              { icon: ShieldCheck, title: 'The exit stays simple', body: 'A clean-title plot in a known corridor sells to any buyer. A resale flat competes with every other flat in the same block, often with the builder still selling new ones.' },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--brand-deep-soft)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={24} />
                </div>
                <h3 style={{ fontSize: 17.5, fontWeight: 700, color: 'var(--brand-deep)', fontFamily: "var(--font-sans)" }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHECKLIST */}
      <section className="section" style={{ background: 'var(--brand-sand)' }}>
        <div className="shell">
          <div style={{ maxWidth: 640, marginBottom: 44 }}>
            <div className="section-label">The due diligence list</div>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--brand-deep)', margin: '14px 0 14px' }}>
              Eight things to verify before money moves
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Ask for all eight in writing. Any seller who hesitates on any one of them has told you
              something useful.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
            {CHECKLIST.map((item, i) => (
              <div key={item.title} className="card card-static" style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start', background: 'white' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--brand-deep)', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-deep)', marginBottom: 7, fontFamily: "var(--font-sans)" }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card card-static" style={{ marginTop: 26, padding: 24, display: 'flex', gap: 16, alignItems: 'flex-start', background: 'rgba(199,123,22,0.08)', border: '1px solid rgba(199,123,22,0.25)' }}>
            <AlertTriangle size={22} color="var(--status-hold)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--brand-deep)' }}>One rule worth keeping:</strong> never pay an advance
              before the title search is back. A token amount feels small until it is the reason you talk
              yourself into ignoring a gap in the document chain.
            </p>
          </div>
        </div>
      </section>

      {/* APPROVALS */}
      <section className="section">
        <div className="shell">
          <div style={{ maxWidth: 640, marginBottom: 40 }}>
            <div className="section-label">Approvals explained</div>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--brand-deep)', margin: '14px 0 14px' }}>
              CMDA, DTCP, RERA, panchayat
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              These get used interchangeably in brochures. They are not interchangeable.
            </p>
          </div>

          <div className="card card-static" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ width: 130 }}>Approval</th>
                  <th style={{ width: 250 }}>Where it applies</th>
                  <th>What it means for you</th>
                </tr>
              </thead>
              <tbody>
                {APPROVALS.map((a) => (
                  <tr key={a.name}>
                    <td><span className="chip chip-gold">{a.name}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.scope}</td>
                    <td style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{a.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* COSTS */}
      <section className="section" style={{ background: 'var(--brand-deep)', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div className="parcel-grid" style={{ position: 'absolute', inset: 0, opacity: 0.35 }} />
        <div className="shell" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 640, marginBottom: 40 }}>
            <div className="section-label section-label-light">Budget honestly</div>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '14px 0 14px' }}>
              The plot price is not the price
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }}>
              Budget roughly 10–12% on top of the plot value. Every one of our listings shows this
              breakdown on the page, so there is no reveal at the registrar&apos;s office.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 1, background: 'rgba(255,255,255,0.14)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)' }}>
            {HIDDEN_COSTS.map((c) => (
              <div key={c.label} style={{ background: 'var(--brand-deep)', padding: '20px 22px', display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }}>
                <div style={{ flex: '1 1 220px', fontWeight: 700, fontSize: 15 }}>{c.label}</div>
                <div style={{ flex: '0 0 auto', color: 'var(--brand-gold)', fontWeight: 700, fontSize: 15, minWidth: 190 }}>{c.value}</div>
                <div style={{ flex: '2 1 280px', color: 'rgba(255,255,255,0.6)', fontSize: 13.5, lineHeight: 1.6 }}>{c.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="shell-narrow">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="section-label">Common questions</div>
            <h2 className="font-display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--brand-deep)', marginTop: 14 }}>
              Straight answers
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q} className="card card-static" style={{ overflow: 'hidden', border: `1px solid ${open ? 'rgba(201,168,76,0.5)' : 'var(--border-subtle)'}` }}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    style={{
                      width: '100%', padding: '20px 22px', background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-deep)' }}>{faq.q}</span>
                    <ChevronDown
                      size={19}
                      color="var(--brand-gold-dark)"
                      style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}
                    />
                  </button>
                  {open && (
                    <div style={{ padding: '0 22px 22px', color: 'var(--text-secondary)', fontSize: 14.5, lineHeight: 1.8 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 0', background: 'var(--surface-raised)' }}>
        <div className="shell" style={{ textAlign: 'center' }}>
          <CheckCircle2 size={40} color="var(--brand-gold)" style={{ margin: '0 auto 20px' }} />
          <h2 className="font-display" style={{ fontSize: 'clamp(26px, 3.8vw, 40px)', color: 'var(--brand-deep)', marginBottom: 16 }}>
            Every layout we sell has already passed this list
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16.5, maxWidth: 580, margin: '0 auto 34px', lineHeight: 1.65 }}>
            Approval numbers, title trace, EC and patta are published on every listing — not held back
            until you turn up with a cheque.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/plots" className="btn btn-primary btn-lg">Browse verified plots <ArrowRight size={17} /></Link>
            <Link href="/contact" className="btn btn-secondary btn-lg">Ask an advisor</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
