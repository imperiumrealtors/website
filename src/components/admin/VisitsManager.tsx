'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Car } from 'lucide-react';
import BrandSelect from '@/components/BrandSelect';
import { api, formatDate, type FieldErrors } from '@/lib/admin-api';
import { VISIT_STATUSES, type SiteVisit, type VisitStatus } from '@/lib/types';
import { PageHeader, Card, StatusPill, EmptyState, ConfirmDialog, Modal, Field, SearchInput, Alert, useToast } from './ui';

interface Props {
  initial: SiteVisit[];
  layouts: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  canWrite: boolean;
}

type Draft = { customerName: string; phone: string; layoutId: string; preferredDate: string; preferredTime: string; visitors: string; pickup: boolean; assignedTo: string; status: VisitStatus; notes: string };
const EMPTY: Draft = { customerName: '', phone: '', layoutId: '', preferredDate: '', preferredTime: '10:00 AM', visitors: '2', pickup: false, assignedTo: '', status: 'Requested', notes: '' };

const OPEN: VisitStatus[] = ['Requested', 'Confirmed', 'Rescheduled'];

export default function VisitsManager({ initial, layouts, staff, canWrite }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [visits, setVisits] = useState(initial);
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<{ visit: SiteVisit | null; draft: Draft } | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SiteVisit | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rows = visits.filter((v) => {
      const isUpcoming = v.preferredDate >= today && OPEN.includes(v.status);
      if (tab === 'upcoming' ? !isUpcoming : isUpcoming) return false;
      if (status && v.status !== status) return false;
      return !s || `${v.customerName} ${v.phone} ${v.layoutName ?? ''}`.toLowerCase().includes(s);
    });
    return rows.sort((a, b) => tab === 'upcoming'
      ? `${a.preferredDate} ${a.preferredTime}`.localeCompare(`${b.preferredDate} ${b.preferredTime}`)
      : b.preferredDate.localeCompare(a.preferredDate));
  }, [visits, tab, q, status, today]);

  const upcomingCount = visits.filter((v) => v.preferredDate >= today && OPEN.includes(v.status)).length;

  const openCreate = () => { setErrors({}); setEditing({ visit: null, draft: { ...EMPTY, preferredDate: today } }); };
  const openEdit = (v: SiteVisit) => {
    setErrors({});
    setEditing({ visit: v, draft: { customerName: v.customerName, phone: v.phone, layoutId: v.layoutId ?? '', preferredDate: v.preferredDate, preferredTime: v.preferredTime, visitors: String(v.visitors), pickup: v.pickup, assignedTo: v.assignedTo ?? '', status: v.status, notes: v.notes } });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setErrors({});
    const body = { ...editing.draft, visitors: Number(editing.draft.visitors), layoutId: editing.draft.layoutId || null, assignedTo: editing.draft.assignedTo || null };
    const res = editing.visit ? await api.patch<SiteVisit>(`/api/admin/site-visits/${editing.visit.id}`, body) : await api.post<SiteVisit>('/api/admin/site-visits', body);
    setSaving(false);
    if (!res.ok) { setErrors(res.details ?? { _: res.error }); return; }
    setVisits((all) => (editing.visit ? all.map((v) => (v.id === res.data.id ? res.data : v)) : [res.data, ...all]));
    toast('success', editing.visit ? 'Site visit updated.' : 'Site visit scheduled.');
    setEditing(null);
    router.refresh();
  };

  const quickStatus = async (visit: SiteVisit, next: VisitStatus) => {
    if (next === visit.status) return;
    setBusyId(visit.id);
    const res = await api.patch<SiteVisit>(`/api/admin/site-visits/${visit.id}`, { status: next });
    setBusyId(null);
    if (!res.ok) { toast('error', res.error); return; }
    setVisits((all) => all.map((v) => (v.id === visit.id ? res.data : v)));
    router.refresh();
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    const res = await api.del(`/api/admin/site-visits/${pendingDelete.id}`);
    setBusyId(null);
    if (!res.ok) { toast('error', res.error); return; }
    setVisits((all) => all.filter((v) => v.id !== pendingDelete.id));
    toast('success', 'Site visit deleted.');
    setPendingDelete(null);
    router.refresh();
  };

  const statusOptions = VISIT_STATUSES.map((s) => ({ value: s, label: s }));

  return (
    <>
      <PageHeader
        title="Site visits"
        subtitle={`${upcomingCount} upcoming · ${visits.length - upcomingCount} in history`}
        actions={canWrite && <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={15} /> Schedule visit</button>}
      />

      <Card padded={false} title={
        <span style={{ display: 'inline-flex', gap: 4, background: 'var(--surface-raised)', padding: 4, borderRadius: 99 }}>
          <button className={`tab-btn ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming</button>
          <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
        </span>
      } actions={
        <div className="admin-toolbar">
          <SearchInput value={q} onChange={setQ} placeholder="Customer, phone, layout…" />
          <div style={{ width: 170 }}><BrandSelect ariaLabel="Status" value={status} onChange={setStatus} options={[{ value: '', label: 'Any status' }, ...statusOptions]} /></div>
        </div>
      }>
        {visible.length === 0 ? (
          <EmptyState title={tab === 'upcoming' ? 'No upcoming site visits' : 'No past visits'} body={tab === 'upcoming' ? 'Requests from the website and visits you schedule appear here.' : 'Completed and cancelled visits will show here.'} />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>When</th><th>Customer</th><th>Layout</th><th>Party</th><th>Assigned</th><th>Status</th>{canWrite && <th style={{ textAlign: 'right' }}>Actions</th>}</tr></thead>
              <tbody>
                {visible.map((v) => (
                  <tr key={v.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: 'var(--brand-deep)' }}>{formatDate(v.preferredDate)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.preferredTime}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--brand-deep)' }}>{v.customerName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.phone}</div>
                    </td>
                    <td>{v.layoutName ?? '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{v.visitors} {v.visitors === 1 ? 'person' : 'people'}{v.pickup && <span title="Pickup requested" style={{ marginLeft: 8, color: 'var(--brand-gold-dark)', display: 'inline-flex', verticalAlign: 'middle' }}><Car size={14} /></span>}</td>
                    <td>{v.assignedName ?? <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td>
                      {canWrite ? (
                        <div style={{ width: 160 }}><BrandSelect ariaLabel={`Status for ${v.customerName}`} value={v.status} onChange={(s) => quickStatus(v, s as VisitStatus)} options={statusOptions} /></div>
                      ) : <StatusPill value={v.status} />}
                    </td>
                    {canWrite && (
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="admin-icon-btn" title="Edit" onClick={() => openEdit(v)} disabled={busyId === v.id}><Pencil size={14} /></button>
                          <button className="admin-icon-btn danger" title="Delete" onClick={() => setPendingDelete(v)} disabled={busyId === v.id}><Trash2 size={14} /></button>
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
        <Modal title={editing.visit ? 'Edit site visit' : 'Schedule site visit'} onClose={() => setEditing(null)} width={620}>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {errors._ && <Alert kind="error">{errors._}</Alert>}
            <div className="admin-grid-form">
              <Field label="Customer name" htmlFor="sv-name" error={errors.customerName}><input id="sv-name" required className={`form-input ${errors.customerName ? 'invalid' : ''}`} value={editing.draft.customerName} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, customerName: e.target.value } })} /></Field>
              <Field label="Phone" htmlFor="sv-phone" error={errors.phone}><input id="sv-phone" required className={`form-input ${errors.phone ? 'invalid' : ''}`} value={editing.draft.phone} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, phone: e.target.value } })} /></Field>
              <Field label="Layout" htmlFor="sv-layout" error={errors.layoutId}>
                <BrandSelect id="sv-layout" value={editing.draft.layoutId} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, layoutId: v } })} options={[{ value: '', label: 'Not specified' }, ...layouts.map((l) => ({ value: l.id, label: l.name }))]} />
              </Field>
              <Field label="Date" htmlFor="sv-date" error={errors.preferredDate}><input id="sv-date" type="date" required className={`form-input ${errors.preferredDate ? 'invalid' : ''}`} value={editing.draft.preferredDate} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, preferredDate: e.target.value } })} /></Field>
              <Field label="Time" htmlFor="sv-time" error={errors.preferredTime}><input id="sv-time" required className={`form-input ${errors.preferredTime ? 'invalid' : ''}`} value={editing.draft.preferredTime} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, preferredTime: e.target.value } })} placeholder="10:00 AM" /></Field>
              <Field label="Visitors" htmlFor="sv-visitors" error={errors.visitors}><input id="sv-visitors" type="number" min={1} max={20} className="form-input" value={editing.draft.visitors} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, visitors: e.target.value } })} /></Field>
              <Field label="Assigned to" htmlFor="sv-assigned" error={errors.assignedTo}>
                <BrandSelect id="sv-assigned" value={editing.draft.assignedTo} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, assignedTo: v } })} options={[{ value: '', label: 'Unassigned' }, ...staff.map((s) => ({ value: s.id, label: s.name }))]} />
              </Field>
              <Field label="Status" htmlFor="sv-status" error={errors.status}>
                <BrandSelect id="sv-status" value={editing.draft.status} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, status: v as VisitStatus } })} options={statusOptions} />
              </Field>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.draft.pickup} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, pickup: e.target.checked } })} style={{ width: 16, height: 16, accentColor: 'var(--brand-deep)' }} /> Arrange a pickup
            </label>
            <Field label="Notes" htmlFor="sv-notes" error={errors.notes}><textarea id="sv-notes" className="form-input" rows={3} value={editing.draft.notes} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, notes: e.target.value } })} /></Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : editing.visit ? 'Save visit' : 'Schedule'}</button>
            </div>
          </form>
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog title="Delete this site visit?" body={`Remove the visit for ${pendingDelete.customerName} on ${formatDate(pendingDelete.preferredDate)}. This cannot be undone.`} busy={busyId === pendingDelete.id} onConfirm={remove} onCancel={() => setPendingDelete(null)} />
      )}
    </>
  );
}
