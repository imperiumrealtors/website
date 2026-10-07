'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import BrandSelect from '@/components/BrandSelect';
import { api, type FieldErrors } from '@/lib/admin-api';
import { FACINGS, PLOT_STATUSES, type PlotRecord, type PlotStatus } from '@/lib/types';
import { PageHeader, Card, StatusPill, EmptyState, ConfirmDialog, Modal, Field, SearchInput, Alert, LoadingRows, useToast } from './ui';

interface Props {
  layouts: { id: string; name: string }[];
  initialLayoutId: string;
  initialPlots: PlotRecord[];
  canWrite: boolean;
}

type Draft = { layoutId: string; number: string; area: string; dimensions: string; facing: string; corner: boolean; priceLakhs: string; status: PlotStatus; notes: string };

const emptyDraft = (layoutId: string): Draft => ({ layoutId, number: '', area: '', dimensions: '', facing: 'East', corner: false, priceLakhs: '', status: 'Available', notes: '' });

export default function PlotsManager({ layouts, initialLayoutId, initialPlots, canWrite }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [layoutId, setLayoutId] = useState(initialLayoutId);
  const [status, setStatus] = useState<string>('');
  const [q, setQ] = useState('');
  const [plots, setPlots] = useState(initialPlots);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ plot: PlotRecord | null; draft: Draft } | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PlotRecord | null>(null);

  const load = async (nextLayout: string, nextStatus: string) => {
    setLoading(true);
    setLoadError(null);
    const sp = new URLSearchParams();
    if (nextLayout) sp.set('layoutId', nextLayout);
    if (nextStatus) sp.set('status', nextStatus);
    const res = await api.get<PlotRecord[]>(`/api/admin/plots?${sp}`);
    setLoading(false);
    if (!res.ok) { setLoadError(res.error); return; }
    setPlots(res.data);
  };

  const changeLayout = (v: string) => { setLayoutId(v); load(v, status); };
  const changeStatus = (v: string) => { setStatus(v); load(layoutId, v); };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? plots.filter((p) => `${p.number} ${p.layoutName} ${p.facing}`.toLowerCase().includes(s)) : plots;
  }, [plots, q]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { Available: 0, Reserved: 0, Sold: 0, Blocked: 0 };
    plots.forEach((p) => { out[p.status] = (out[p.status] ?? 0) + 1; });
    return out;
  }, [plots]);

  const quickStatus = async (plot: PlotRecord, next: PlotStatus) => {
    if (next === plot.status) return;
    setBusyId(plot.id);
    const res = await api.patch<PlotRecord>(`/api/admin/plots/${plot.id}`, { status: next });
    setBusyId(null);
    if (!res.ok) { toast('error', res.error); return; }
    setPlots((all) => all.map((p) => (p.id === plot.id ? res.data : p)));
    toast('success', `Plot ${plot.number} marked ${next}. Website updated.`);
    router.refresh();
  };

  const openCreate = () => { setErrors({}); setEditing({ plot: null, draft: emptyDraft(layoutId || layouts[0]?.id || '') }); };
  const openEdit = (p: PlotRecord) => {
    setErrors({});
    setEditing({ plot: p, draft: { layoutId: p.layoutId, number: p.number, area: String(p.area), dimensions: p.dimensions, facing: p.facing, corner: p.corner, priceLakhs: String(p.priceLakhs), status: p.status, notes: p.notes } });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setErrors({});
    const body = { ...editing.draft, area: Number(editing.draft.area), priceLakhs: Number(editing.draft.priceLakhs) };
    const res = editing.plot
      ? await api.patch<PlotRecord>(`/api/admin/plots/${editing.plot.id}`, body)
      : await api.post<PlotRecord>('/api/admin/plots', body);
    setSaving(false);
    if (!res.ok) { setErrors(res.details ?? { _: res.error }); return; }
    setPlots((all) => (editing.plot ? all.map((p) => (p.id === res.data.id ? res.data : p)) : [res.data, ...all]));
    toast('success', editing.plot ? `Plot ${res.data.number} updated.` : `Plot ${res.data.number} added.`);
    setEditing(null);
    router.refresh();
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    const res = await api.del(`/api/admin/plots/${pendingDelete.id}`);
    setBusyId(null);
    if (!res.ok) { toast('error', res.error); return; }
    setPlots((all) => all.filter((p) => p.id !== pendingDelete.id));
    toast('success', `Plot ${pendingDelete.number} deleted.`);
    setPendingDelete(null);
    router.refresh();
  };

  const layoutOptions = [{ value: '', label: 'All layouts' }, ...layouts.map((l) => ({ value: l.id, label: l.name }))];
  const statusOptions = [{ value: '', label: 'Any status' }, ...PLOT_STATUSES.map((s) => ({ value: s, label: s }))];

  return (
    <>
      <PageHeader
        title="Plots"
        subtitle={`${plots.length} plots · ${counts.Available} available · ${counts.Reserved} reserved · ${counts.Sold} sold · ${counts.Blocked} blocked`}
        actions={canWrite && <button className="btn btn-primary btn-sm" onClick={openCreate} disabled={layouts.length === 0}><Plus size={15} /> Add plot</button>}
      />

      <Card padded={false} title="Plot inventory" actions={
        <div className="admin-toolbar">
          <div style={{ width: 220 }}><BrandSelect ariaLabel="Layout" value={layoutId} onChange={changeLayout} options={layoutOptions} /></div>
          <div style={{ width: 160 }}><BrandSelect ariaLabel="Status" value={status} onChange={changeStatus} options={statusOptions} /></div>
          <SearchInput value={q} onChange={setQ} placeholder="Plot number…" />
        </div>
      }>
        {loadError && <div style={{ padding: 16 }}><Alert kind="error">{loadError} <button className="btn btn-secondary btn-sm" style={{ marginLeft: 10 }} onClick={() => load(layoutId, status)}>Retry</button></Alert></div>}
        {!loading && !loadError && filtered.length === 0 ? (
          <EmptyState title={plots.length === 0 ? 'No plots here yet' : 'No plots match'} body={plots.length === 0 ? 'Add plots to a layout so buyers can see availability.' : 'Try clearing the search or status filter.'} action={canWrite && plots.length === 0 && <button className="btn btn-primary btn-sm" onClick={openCreate}>Add a plot</button>} />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Plot</th><th>Layout</th><th>Area</th><th>Facing</th><th>Price</th><th>Status</th><th>Notes</th>{canWrite && <th style={{ textAlign: 'right' }}>Actions</th>}</tr>
              </thead>
              <tbody>
                {loading ? <LoadingRows cols={canWrite ? 8 : 7} rows={6} /> : filtered.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: 'var(--brand-deep)', whiteSpace: 'nowrap' }}>{p.number}{p.corner && <span className="chip chip-gold" style={{ marginLeft: 8, fontSize: 10, padding: '2px 7px' }}>Corner</span>}</td>
                    <td>{p.layoutName}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{p.area.toLocaleString('en-IN')} sq.ft{p.dimensions && <span style={{ color: 'var(--text-muted)' }}> · {p.dimensions}</span>}</td>
                    <td>{p.facing}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{p.priceLabel}</td>
                    <td>
                      {canWrite ? (
                        <div style={{ width: 150 }}>
                          <BrandSelect ariaLabel={`Status for plot ${p.number}`} value={p.status} onChange={(v) => quickStatus(p, v as PlotStatus)} options={PLOT_STATUSES.map((s) => ({ value: s, label: s }))} />
                        </div>
                      ) : <StatusPill value={p.status} />}
                    </td>
                    <td style={{ maxWidth: 220, color: 'var(--text-secondary)', fontSize: 13 }}>{p.notes ? <span title={p.notes}>{p.notes.length > 60 ? `${p.notes.slice(0, 60)}…` : p.notes}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    {canWrite && (
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="admin-icon-btn" title="Edit" onClick={() => openEdit(p)} disabled={busyId === p.id}><Pencil size={14} /></button>
                          <button className="admin-icon-btn danger" title="Delete" onClick={() => setPendingDelete(p)} disabled={busyId === p.id}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <Modal title={editing.plot ? `Edit plot ${editing.plot.number}` : 'Add plot'} onClose={() => setEditing(null)} width={560}>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {errors._ && <Alert kind="error">{errors._}</Alert>}
            <Field label="Layout" htmlFor="p-layout" error={errors.layoutId}>
              <BrandSelect id="p-layout" value={editing.draft.layoutId} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, layoutId: v } })} options={layouts.map((l) => ({ value: l.id, label: l.name }))} />
            </Field>
            <div className="admin-grid-form">
              <Field label="Plot number" htmlFor="p-number" error={errors.number}><input id="p-number" className={`form-input ${errors.number ? 'invalid' : ''}`} required value={editing.draft.number} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, number: e.target.value } })} placeholder="A-12" /></Field>
              <Field label="Area (sq.ft)" htmlFor="p-area" error={errors.area}><input id="p-area" type="number" min={1} required className={`form-input ${errors.area ? 'invalid' : ''}`} value={editing.draft.area} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, area: e.target.value } })} /></Field>
              <Field label="Dimensions" htmlFor="p-dim" error={errors.dimensions}><input id="p-dim" className="form-input" value={editing.draft.dimensions} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, dimensions: e.target.value } })} placeholder="30 × 40 ft" /></Field>
              <Field label="Facing" htmlFor="p-facing" error={errors.facing}>
                <BrandSelect id="p-facing" value={editing.draft.facing} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, facing: v } })} options={FACINGS.map((f) => ({ value: f, label: f }))} />
              </Field>
              <Field label="Price (lakhs)" htmlFor="p-price" error={errors.priceLakhs}><input id="p-price" type="number" step="0.01" min={0} required className={`form-input ${errors.priceLakhs ? 'invalid' : ''}`} value={editing.draft.priceLakhs} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, priceLakhs: e.target.value } })} /></Field>
              <Field label="Status" htmlFor="p-status" error={errors.status}>
                <BrandSelect id="p-status" value={editing.draft.status} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, status: v as PlotStatus } })} options={PLOT_STATUSES.map((s) => ({ value: s, label: s }))} />
              </Field>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.draft.corner} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, corner: e.target.checked } })} style={{ width: 16, height: 16, accentColor: 'var(--brand-deep)' }} /> Corner plot
            </label>
            <Field label="Notes (internal)" htmlFor="p-notes" error={errors.notes}><textarea id="p-notes" className="form-input" rows={3} value={editing.draft.notes} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, notes: e.target.value } })} /></Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : editing.plot ? 'Save plot' : 'Add plot'}</button>
            </div>
          </form>
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog title={`Delete plot ${pendingDelete.number}?`} body="This removes the plot from the layout and from the public listing. Leads linked to it will be unlinked." busy={busyId === pendingDelete.id} onConfirm={remove} onCancel={() => setPendingDelete(null)} />
      )}
    </>
  );
}
