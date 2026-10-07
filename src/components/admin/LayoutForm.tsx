'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import BrandSelect from '@/components/BrandSelect';
import { api, type FieldErrors } from '@/lib/admin-api';
import { corridors, INFRA } from '@/lib/data';
import { FACINGS, type LayoutRecord, type MediaItem } from '@/lib/types';
import { PageHeader, Card, Field, Alert, useToast } from './ui';

type FormState = Omit<LayoutRecord, 'id' | 'createdAt' | 'updatedAt'>;

const STATUS_OPTIONS = ['Ready to Register', 'Development in Progress', 'New Launch'].map((v) => ({ value: v, label: v }));
const USE_OPTIONS = ['Residential', 'Commercial', 'Farmland', 'Industrial'].map((v) => ({ value: v, label: v }));
const APPROVALS = ['DTCP', 'RERA', 'CMDA', 'Panchayat'] as const;
const NEARBY_TYPES = ['Metro', 'School', 'Hospital', 'IT Park', 'Airport', 'Mall', 'Highway', 'Beach', 'Park'];

export const EMPTY_LAYOUT: FormState = {
  slug: '', name: '', builder: 'Imperium Realtors', location: '', corridor: corridors[0].name, city: 'Chennai', address: '',
  lat: 13.0, lng: 80.2, status: 'New Launch', possession: '', description: '', priceLakhs: 0, priceLabel: '', pricePerSqft: 0,
  landArea: '', landUse: 'Residential', approvals: ['DTCP'], approvalId: '', roadWidth: '', facingOptions: ['East', 'North'],
  appreciation: '', soil: '', waterSource: '', loanEligible: true, gated: true, highlights: [], infrastructure: [],
  photos: [], videoUrl: null, nearby: [], priceBreakdown: [], documents: [], featured: false, newLaunch: false, active: true,
};

interface Props {
  mode: 'create' | 'edit';
  layoutId?: string;
  initial: FormState;
  media?: MediaItem[];
}

export default function LayoutForm({ mode, layoutId, initial, media = [] }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: keyof FormState) => ({
    value: String(form[key] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value as never),
    className: `form-input ${errors[key] ? 'invalid' : ''}`,
  });
  const num = (key: keyof FormState) => ({
    value: form[key] === 0 ? '' : String(form[key] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, (e.target.value === '' ? 0 : Number(e.target.value)) as never),
    className: `form-input ${errors[key] ? 'invalid' : ''}`,
    type: 'number',
  });

  const toggleIn = <T extends string>(key: 'approvals' | 'facingOptions' | 'infrastructure', value: T) => {
    const list = form[key] as string[];
    set(key, (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]) as never);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setTopError(null);
    const res = mode === 'create'
      ? await api.post<LayoutRecord>('/api/admin/layouts', form)
      : await api.put<LayoutRecord>(`/api/admin/layouts/${layoutId}`, form);
    setBusy(false);
    if (!res.ok) {
      setErrors(res.details ?? {});
      setTopError(res.error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    toast('success', mode === 'create' ? 'Layout created. Add plots to it next.' : 'Layout saved. The website is updated.');
    router.push(mode === 'create' ? `/admin/plots?layoutId=${res.data.id}` : '/admin/layouts');
    router.refresh();
  };

  const publicImages = media.filter((m) => m.kind === 'image' && m.isPublic);

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <PageHeader
        title={mode === 'create' ? 'New layout' : `Edit ${initial.name}`}
        subtitle="Everything here is what buyers see on the public listing."
        actions={
          <>
            <Link href="/admin/layouts" className="btn btn-secondary btn-sm"><ArrowLeft size={14} /> Back</Link>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}><Save size={14} /> {busy ? 'Saving…' : mode === 'create' ? 'Create layout' : 'Save changes'}</button>
          </>
        }
      />

      {topError && <Alert kind="error">{topError}{Object.keys(errors).length > 0 && ' Check the fields marked below.'}</Alert>}

      <Card title="Basics">
        <div className="admin-grid-form">
          <Field label="Layout name" htmlFor="l-name" error={errors.name}><input id="l-name" {...text('name')} required /></Field>
          <Field label="URL slug" htmlFor="l-slug" error={errors.slug} hint="Leave blank to generate from the name."><input id="l-slug" {...text('slug')} placeholder="imperium-emerald-acres" /></Field>
          <Field label="Locality" htmlFor="l-location" error={errors.location}><input id="l-location" {...text('location')} required placeholder="Sholinganallur, Chennai" /></Field>
          <Field label="Corridor" htmlFor="l-corridor" error={errors.corridor}>
            <BrandSelect id="l-corridor" value={form.corridor} onChange={(v) => set('corridor', v)} options={corridors.map((c) => ({ value: c.name, label: c.name }))} />
          </Field>
          <Field label="Status" htmlFor="l-status" error={errors.status}>
            <BrandSelect id="l-status" value={form.status} onChange={(v) => set('status', v as FormState['status'])} options={STATUS_OPTIONS} />
          </Field>
          <Field label="Handover" htmlFor="l-possession" error={errors.possession}><input id="l-possession" {...text('possession')} placeholder="Immediate registration" /></Field>
          <Field label="Land use" htmlFor="l-use" error={errors.landUse}>
            <BrandSelect id="l-use" value={form.landUse} onChange={(v) => set('landUse', v as FormState['landUse'])} options={USE_OPTIONS} />
          </Field>
          <Field label="Extent" htmlFor="l-area" error={errors.landArea}><input id="l-area" {...text('landArea')} placeholder="6.4 acres" /></Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field label="Full address" htmlFor="l-address" error={errors.address}><input id="l-address" {...text('address')} required /></Field>
        </div>
        <div className="admin-grid-form" style={{ marginTop: 16 }}>
          <Field label="Latitude" htmlFor="l-lat" error={errors.lat}><input id="l-lat" {...num('lat')} step="any" /></Field>
          <Field label="Longitude" htmlFor="l-lng" error={errors.lng}><input id="l-lng" {...num('lng')} step="any" /></Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field label="Description" htmlFor="l-desc" error={errors.description}><textarea id="l-desc" {...text('description')} rows={5} /></Field>
        </div>
      </Card>

      <Card title="Pricing">
        <div className="admin-grid-form">
          <Field label="Starting price (lakhs)" htmlFor="l-price" error={errors.priceLakhs} hint="e.g. 48 for ₹48 L, 185 for ₹1.85 Cr"><input id="l-price" {...num('priceLakhs')} step="0.01" min={0} required /></Field>
          <Field label="Price label" htmlFor="l-pricelabel" error={errors.priceLabel} hint="Leave blank to auto-format."><input id="l-pricelabel" {...text('priceLabel')} placeholder="₹48 Lakhs" /></Field>
          <Field label="Rate per sq.ft (₹)" htmlFor="l-rate" error={errors.pricePerSqft}><input id="l-rate" {...num('pricePerSqft')} min={0} /></Field>
          <Field label="Appreciation" htmlFor="l-appr" error={errors.appreciation}><input id="l-appr" {...text('appreciation')} placeholder="12–14% p.a. over the last 3 years" /></Field>
        </div>
        <ListEditor
          label="Cost breakdown rows"
          rows={form.priceBreakdown}
          columns={[{ key: 'label', placeholder: 'Plot value (₹4,000 / sq.ft × 1,200)' }, { key: 'amount', placeholder: '₹48,00,000', width: 160 }]}
          onChange={(rows) => set('priceBreakdown', rows as FormState['priceBreakdown'])}
          empty={{ label: '', amount: '' }}
          error={errors.priceBreakdown}
        />
      </Card>

      <Card title="Approvals & land">
        <div className="admin-grid-form">
          <Field label="Approvals" error={errors.approvals}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {APPROVALS.map((a) => (
                <button type="button" key={a} className={`filter-pill ${form.approvals.includes(a) ? 'active' : ''}`} onClick={() => toggleIn('approvals', a)}>{a}</button>
              ))}
            </div>
          </Field>
          <Field label="Approval reference" htmlFor="l-appid" error={errors.approvalId}><input id="l-appid" {...text('approvalId')} placeholder="DTCP/CHN/1184/2024 · TN/29/Layout/0418/2024" /></Field>
          <Field label="Internal roads" htmlFor="l-roads" error={errors.roadWidth}><input id="l-roads" {...text('roadWidth')} placeholder="30 ft & 40 ft blacktop" /></Field>
          <Field label="Soil" htmlFor="l-soil" error={errors.soil}><input id="l-soil" {...text('soil')} /></Field>
          <Field label="Water source" htmlFor="l-water" error={errors.waterSource}><input id="l-water" {...text('waterSource')} /></Field>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field label="Facing options offered" error={errors.facingOptions}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FACINGS.map((f) => (
                <button type="button" key={f} className={`filter-pill ${form.facingOptions.includes(f) ? 'active' : ''}`} onClick={() => toggleIn('facingOptions', f)}>{f}</button>
              ))}
            </div>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginTop: 16 }}>
          <Check label="Plot loan eligible" checked={form.loanEligible} onChange={(v) => set('loanEligible', v)} />
          <Check label="Gated with security" checked={form.gated} onChange={(v) => set('gated', v)} />
        </div>
        <ListEditor
          label="Legal documents"
          rows={form.documents}
          columns={[{ key: 'name', placeholder: 'Parent document search' }, { key: 'detail', placeholder: '30-year title trace by panel advocate' }]}
          onChange={(rows) => set('documents', rows.map((r) => ({ ...r, verified: r.verified ?? true })) as FormState['documents'])}
          empty={{ name: '', detail: '', verified: true }}
          error={errors.documents}
        />
      </Card>

      <Card title="Highlights & infrastructure">
        <Field label="Highlights (one per line)" htmlFor="l-high" error={errors.highlights}>
          <textarea id="l-high" className={`form-input ${errors.highlights ? 'invalid' : ''}`} rows={5} value={form.highlights.join('\n')} onChange={(e) => set('highlights', e.target.value.split('\n'))} />
        </Field>
        <div style={{ marginTop: 16 }}>
          <Field label="Infrastructure in place" error={errors.infrastructure}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.values(INFRA).map((i) => (
                <button type="button" key={i.id} className={`filter-pill ${form.infrastructure.includes(i.id) ? 'active' : ''}`} onClick={() => toggleIn('infrastructure', i.id)}>{i.icon} {i.name}</button>
              ))}
            </div>
          </Field>
        </div>
        <ListEditor
          label="Nearby landmarks"
          rows={form.nearby}
          columns={[
            { key: 'name', placeholder: 'Sholinganallur Metro' },
            { key: 'type', placeholder: 'Type', options: NEARBY_TYPES, width: 140 },
            { key: 'distance', placeholder: '1.5 km', width: 100 },
            { key: 'duration', placeholder: '5 min', width: 100 },
          ]}
          onChange={(rows) => set('nearby', rows as FormState['nearby'])}
          empty={{ name: '', type: 'Metro', distance: '', duration: '' }}
          error={errors.nearby}
        />
      </Card>

      <Card title="Media & visibility">
        <Field label="Photo URLs (one per line)" htmlFor="l-photos" error={errors.photos} hint="Paste image links, or pick from uploaded public media below. The first photo is the cover.">
          <textarea id="l-photos" className={`form-input ${errors.photos ? 'invalid' : ''}`} rows={4} value={form.photos.join('\n')} onChange={(e) => set('photos', e.target.value.split('\n'))} />
        </Field>
        {publicImages.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {publicImages.map((m) => {
              const used = form.photos.includes(m.url);
              return (
                <button type="button" key={m.id} onClick={() => set('photos', used ? form.photos.filter((p) => p !== m.url) : [...form.photos, m.url])} title={m.title}
                  style={{ width: 72, height: 54, borderRadius: 8, overflow: 'hidden', border: `2px solid ${used ? 'var(--brand-gold)' : 'var(--border-subtle)'}`, padding: 0, cursor: 'pointer', background: '#0D1B2A' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <Field label="Walkthrough video (YouTube embed URL)" htmlFor="l-video" error={errors.videoUrl}>
            <input id="l-video" className="form-input" value={form.videoUrl ?? ''} onChange={(e) => set('videoUrl', e.target.value || null)} placeholder="https://www.youtube.com/embed/…" />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginTop: 16 }}>
          <Check label="Featured on home page" checked={form.featured} onChange={(v) => set('featured', v)} />
          <Check label="Show 'New launch' badge" checked={form.newLaunch} onChange={(v) => set('newLaunch', v)} />
          <Check label="Live on the website" checked={form.active} onChange={(v) => set('active', v)} />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Link href="/admin/layouts" className="btn btn-secondary">Cancel</Link>
        <button type="submit" className="btn btn-primary" disabled={busy}><Save size={15} /> {busy ? 'Saving…' : mode === 'create' ? 'Create layout' : 'Save changes'}</button>
      </div>
    </form>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--brand-deep)' }} />
      {label}
    </label>
  );
}

interface ListColumn { key: string; placeholder: string; width?: number; options?: string[] }

function ListEditor<T extends Record<string, unknown>>({ label, rows, columns, onChange, empty, error }: {
  label: string; rows: T[]; columns: ListColumn[]; onChange: (rows: T[]) => void; empty: T; error?: string;
}) {
  const update = (i: number, key: string, value: string) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span className="form-label">{label}</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange([...rows, empty])}><Plus size={13} /> Add row</button>
      </div>
      {error && <span className="form-error">{error}</span>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.length === 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>None added.</span>}
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {columns.map((c) => c.options ? (
              <select key={c.key} className="form-input form-select" value={String(row[c.key] ?? '')} onChange={(e) => update(i, c.key, e.target.value)} style={{ flex: `0 0 ${c.width ?? 140}px`, padding: '9px 30px 9px 12px', fontSize: 13.5 }}>
                {c.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input key={c.key} className="form-input" value={String(row[c.key] ?? '')} placeholder={c.placeholder} onChange={(e) => update(i, c.key, e.target.value)} style={{ flex: c.width ? `0 0 ${c.width}px` : '1 1 180px', padding: '9px 12px', fontSize: 13.5 }} />
            ))}
            <button type="button" className="admin-icon-btn danger" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} aria-label="Remove row"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
