'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import BrandSelect from '@/components/BrandSelect';
import { api, formatDate, type FieldErrors } from '@/lib/admin-api';
import { LEAD_STATUSES, type Lead, type LeadStatus } from '@/lib/types';
import { PageHeader, Card, StatusPill, EmptyState, ConfirmDialog, Modal, Field, SearchInput, Alert, useToast } from './ui';

interface Props {
  initial: Lead[];
  layouts: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  canWrite: boolean;
  currentUserId: string;
}

type Draft = { name: string; phone: string; email: string; layoutId: string; budget: string; source: string; status: LeadStatus; assignedTo: string; notes: string };
const EMPTY: Draft = { name: '', phone: '', email: '', layoutId: '', budget: '', source: 'Manual', status: 'New', assignedTo: '', notes: '' };

type Sort = 'newest' | 'oldest' | 'name' | 'status';

export default function LeadsManager({ initial, layouts, staff, canWrite, currentUserId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [leads, setLeads] = useState(initial);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [assigned, setAssigned] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [editing, setEditing] = useState<{ lead: Lead | null; draft: Draft } | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null);

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    let rows = leads.filter((l) =>
      (!s || `${l.name} ${l.phone} ${l.email} ${l.layoutName ?? ''}`.toLowerCase().includes(s)) &&
      (!status || l.status === status) &&
      (!assigned || (assigned === 'me' ? l.assignedTo === currentUserId : assigned === 'none' ? !l.assignedTo : l.assignedTo === assigned)),
    );
    rows = [...rows].sort((a, b) => {
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      if (sort === 'name') return a.name.localeCompare(b.name);
      return LEAD_STATUSES.indexOf(a.status) - LEAD_STATUSES.indexOf(b.status) || b.createdAt.localeCompare(a.createdAt);
    });
    return rows;
  }, [leads, q, status, assigned, sort, currentUserId]);

  const openCreate = () => { setErrors({}); setEditing({ lead: null, draft: EMPTY }); };
  const openEdit = (l: Lead) => {
    setErrors({});
    setEditing({ lead: l, draft: { name: l.name, phone: l.phone, email: l.email, layoutId: l.layoutId ?? '', budget: l.budget, source: l.source, status: l.status, assignedTo: l.assignedTo ?? '', notes: l.notes } });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setErrors({});
    const body = { ...editing.draft, layoutId: editing.draft.layoutId || null, assignedTo: editing.draft.assignedTo || null };
    const res = editing.lead ? await api.patch<Lead>(`/api/admin/leads/${editing.lead.id}`, body) : await api.post<Lead>('/api/admin/leads', body);
    setSaving(false);
    if (!res.ok) { setErrors(res.details ?? { _: res.error }); return; }
    setLeads((all) => (editing.lead ? all.map((l) => (l.id === res.data.id ? res.data : l)) : [res.data, ...all]));
    toast('success', editing.lead ? 'Lead updated.' : 'Lead added.');
    setEditing(null);
    router.refresh();
  };

  const quickStatus = async (lead: Lead, next: LeadStatus) => {
    if (next === lead.status) return;
    setBusyId(lead.id);
    const res = await api.patch<Lead>(`/api/admin/leads/${lead.id}`, { status: next });
    setBusyId(null);
    if (!res.ok) { toast('error', res.error); return; }
    setLeads((all) => all.map((l) => (l.id === lead.id ? res.data : l)));
    router.refresh();
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    const res = await api.del(`/api/admin/leads/${pendingDelete.id}`);
    setBusyId(null);
    if (!res.ok) { toast('error', res.error); return; }
    setLeads((all) => all.filter((l) => l.id !== pendingDelete.id));
    toast('success', 'Lead deleted.');
    setPendingDelete(null);
    router.refresh();
  };

  const counts = useMemo(() => ({ total: leads.length, fresh: leads.filter((l) => l.status === 'New').length, mine: leads.filter((l) => l.assignedTo === currentUserId).length }), [leads, currentUserId]);
  const statusOptions = LEAD_STATUSES.map((s) => ({ value: s, label: s }));

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={`${counts.total} leads · ${counts.fresh} new · ${counts.mine} assigned to you`}
        actions={canWrite && <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={15} /> Add lead</button>}
      />

      <Card padded={false} title="Pipeline" actions={
        <div className="admin-toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="Name, phone, email…" />
          <div style={{ width: 190 }}><BrandSelect ariaLabel="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'Any status' }, ...statusOptions]} /></div>
          <div style={{ width: 180 }}><BrandSelect ariaLabel="Assigned" value={assigned} onChange={setAssigned} options={[{ value: '', label: 'Anyone' }, { value: 'me', label: 'Assigned to me' }, { value: 'none', label: 'Unassigned' }, ...staff.map((s) => ({ value: s.id, label: s.name }))]} /></div>
          <div style={{ width: 160 }}><BrandSelect ariaLabel="Sort" value={sort} onChange={(v) => setSort(v as Sort)} options={[{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name', label: 'Name A–Z' }, { value: 'status', label: 'By status' }]} /></div>
        </div>
      }>
        {visible.length === 0 ? (
          <EmptyState title={leads.length === 0 ? 'No leads yet' : 'No leads match these filters'} body={leads.length === 0 ? 'Website enquiries and site-visit requests land here automatically.' : 'Try clearing the search or filters.'} />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Lead</th><th>Interested in</th><th>Budget</th><th>Source</th><th>Status</th><th>Assigned</th><th>Received</th>{canWrite && <th style={{ textAlign: 'right' }}>Actions</th>}</tr></thead>
              <tbody>
                {visible.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--brand-deep)' }}>{l.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
                        <a href={`tel:${l.phone}`} style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', gap: 4, alignItems: 'center' }}><Phone size={11} /> {l.phone}</a>
                        {l.email && <a href={`mailto:${l.email}`} style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', gap: 4, alignItems: 'center' }}><Mail size={11} /> {l.email}</a>}
                      </div>
                    </td>
                    <td>{l.layoutName ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}{l.plotNumber && <span style={{ color: 'var(--text-muted)' }}> · Plot {l.plotNumber}</span>}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{l.budget || '—'}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{l.source}</td>
                    <td>
                      {canWrite ? (
                        <div style={{ width: 190 }}><BrandSelect ariaLabel={`Status for ${l.name}`} value={l.status} onChange={(v) => quickStatus(l, v as LeadStatus)} options={statusOptions} /></div>
                      ) : <StatusPill value={l.status} />}
                    </td>
                    <td>{l.assignedName ?? <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(l.createdAt, true)}</td>
                    {canWrite && (
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="admin-icon-btn" title="Edit" onClick={() => openEdit(l)} disabled={busyId === l.id}><Pencil size={14} /></button>
                          <button className="admin-icon-btn danger" title="Delete" onClick={() => setPendingDelete(l)} disabled={busyId === l.id}><Trash2 size={14} /></button>
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
        <Modal title={editing.lead ? `Edit ${editing.lead.name}` : 'Add lead'} onClose={() => setEditing(null)} width={620}>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {errors._ && <Alert kind="error">{errors._}</Alert>}
            <div className="admin-grid-form">
              <Field label="Name" htmlFor="ld-name" error={errors.name}><input id="ld-name" required className={`form-input ${errors.name ? 'invalid' : ''}`} value={editing.draft.name} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, name: e.target.value } })} /></Field>
              <Field label="Phone" htmlFor="ld-phone" error={errors.phone}><input id="ld-phone" required className={`form-input ${errors.phone ? 'invalid' : ''}`} value={editing.draft.phone} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, phone: e.target.value } })} /></Field>
              <Field label="Email" htmlFor="ld-email" error={errors.email}><input id="ld-email" type="email" className={`form-input ${errors.email ? 'invalid' : ''}`} value={editing.draft.email} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, email: e.target.value } })} /></Field>
              <Field label="Budget" htmlFor="ld-budget" error={errors.budget}><input id="ld-budget" className="form-input" value={editing.draft.budget} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, budget: e.target.value } })} placeholder="₹40 L – ₹75 L" /></Field>
              <Field label="Interested layout" htmlFor="ld-layout" error={errors.layoutId}>
                <BrandSelect id="ld-layout" value={editing.draft.layoutId} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, layoutId: v } })} options={[{ value: '', label: 'Not specified' }, ...layouts.map((l) => ({ value: l.id, label: l.name }))]} />
              </Field>
              <Field label="Source" htmlFor="ld-source" error={errors.source}><input id="ld-source" className="form-input" value={editing.draft.source} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, source: e.target.value } })} placeholder="Walk-in, Referral, Website…" /></Field>
              <Field label="Status" htmlFor="ld-status" error={errors.status}>
                <BrandSelect id="ld-status" value={editing.draft.status} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, status: v as LeadStatus } })} options={statusOptions} />
              </Field>
              <Field label="Assigned to" htmlFor="ld-assigned" error={errors.assignedTo}>
                <BrandSelect id="ld-assigned" value={editing.draft.assignedTo} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, assignedTo: v } })} options={[{ value: '', label: 'Unassigned' }, ...staff.map((s) => ({ value: s.id, label: s.name }))]} />
              </Field>
            </div>
            <Field label="Notes" htmlFor="ld-notes" error={errors.notes}><textarea id="ld-notes" className="form-input" rows={4} value={editing.draft.notes} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, notes: e.target.value } })} /></Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : editing.lead ? 'Save lead' : 'Add lead'}</button>
            </div>
          </form>
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog title={`Delete lead ${pendingDelete.name}?`} body="Site visits linked to this lead are kept but unlinked. This cannot be undone." busy={busyId === pendingDelete.id} onConfirm={remove} onCancel={() => setPendingDelete(null)} />
      )}
    </>
  );
}
