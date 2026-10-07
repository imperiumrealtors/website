'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';
import BrandSelect from '@/components/BrandSelect';
import { api, formatDate, type FieldErrors } from '@/lib/admin-api';
import { ROLES } from '@/lib/auth/permissions';
import type { Role, User } from '@/lib/types';
import { PageHeader, Card, StatusPill, EmptyState, ConfirmDialog, Modal, Field, SearchInput, Alert, useToast } from './ui';

interface Props { initial: User[]; canWrite: boolean; currentUserId: string }

type Draft = { name: string; email: string; role: Role; status: User['status']; password: string };
const EMPTY: Draft = { name: '', email: '', role: 'sales', status: 'active', password: '' };

const ROLE_HELP: Record<Role, string> = {
  admin: 'Full access, including users and settings.',
  manager: 'Layouts, plots, media, leads and site visits.',
  sales: 'Leads and site visits only.',
  customer: 'Public website only — cannot sign in here.',
};

export default function UsersManager({ initial, canWrite, currentUserId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState(initial);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ user: User | null; draft: Draft } | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<User | null>(null);

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(s)) : users;
  }, [users, q]);

  const openCreate = () => { setErrors({}); setEditing({ user: null, draft: EMPTY }); };
  const openEdit = (u: User) => { setErrors({}); setEditing({ user: u, draft: { name: u.name, email: u.email, role: u.role, status: u.status, password: '' } }); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setErrors({});
    const res = editing.user ? await api.put<User>(`/api/admin/users/${editing.user.id}`, editing.draft) : await api.post<User>('/api/admin/users', editing.draft);
    setSaving(false);
    if (!res.ok) { setErrors(res.details ?? { _: res.error }); return; }
    setUsers((all) => (editing.user ? all.map((u) => (u.id === res.data.id ? res.data : u)) : [...all, res.data]));
    toast('success', editing.user ? 'User updated.' : `${res.data.name} can now sign in.`);
    setEditing(null);
    router.refresh();
  };

  const toggleStatus = async () => {
    if (!pendingToggle) return;
    const u = pendingToggle;
    setBusyId(u.id);
    const res = await api.put<User>(`/api/admin/users/${u.id}`, { name: u.name, email: u.email, role: u.role, status: u.status === 'active' ? 'inactive' : 'active' });
    setBusyId(null);
    if (!res.ok) { toast('error', res.error); setPendingToggle(null); return; }
    setUsers((all) => all.map((x) => (x.id === u.id ? res.data : x)));
    toast('success', res.data.status === 'active' ? `${u.name} reactivated.` : `${u.name} deactivated and signed out everywhere.`);
    setPendingToggle(null);
    router.refresh();
  };

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${users.filter((u) => u.status === 'active').length} active accounts · ${users.filter((u) => u.role === 'admin').length} admin`}
        actions={canWrite && <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={15} /> Add user</button>}
      />

      <Card padded={false} title="Accounts" actions={<SearchInput value={q} onChange={setQ} placeholder="Name, email, role…" />}>
        {visible.length === 0 ? <EmptyState title="No users match" /> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Created</th><th>Last sign-in</th>{canWrite && <th style={{ textAlign: 'right' }}>Actions</th>}</tr></thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id} style={{ opacity: u.status === 'active' ? 1 : 0.6 }}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--brand-deep)' }}>{u.name}{u.id === currentUserId && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>(you)</span>}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td><StatusPill value={u.role} /></td>
                    <td><StatusPill value={u.status} /></td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(u.createdAt)}</td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{u.lastLoginAt ? formatDate(u.lastLoginAt, true) : 'Never'}</td>
                    {canWrite && (
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="admin-icon-btn" title="Edit" onClick={() => openEdit(u)} disabled={busyId === u.id}><Pencil size={14} /></button>
                          {u.id !== currentUserId && (
                            <button className={`admin-icon-btn ${u.status === 'active' ? 'danger' : ''}`} title={u.status === 'active' ? 'Deactivate' : 'Reactivate'} onClick={() => setPendingToggle(u)} disabled={busyId === u.id}>
                              {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                            </button>
                          )}
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
        <Modal title={editing.user ? `Edit ${editing.user.name}` : 'Add user'} onClose={() => setEditing(null)} width={540}>
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {errors._ && <Alert kind="error">{errors._}</Alert>}
            <div className="admin-grid-form">
              <Field label="Name" htmlFor="u-name" error={errors.name}><input id="u-name" required className={`form-input ${errors.name ? 'invalid' : ''}`} value={editing.draft.name} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, name: e.target.value } })} /></Field>
              <Field label="Email" htmlFor="u-email" error={errors.email}><input id="u-email" type="email" required className={`form-input ${errors.email ? 'invalid' : ''}`} value={editing.draft.email} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, email: e.target.value } })} /></Field>
              <Field label="Role" htmlFor="u-role" error={errors.role} hint={ROLE_HELP[editing.draft.role]}>
                <BrandSelect id="u-role" value={editing.draft.role} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, role: v as Role } })} options={ROLES.map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) }))} />
              </Field>
              <Field label="Status" htmlFor="u-status" error={errors.status}>
                <BrandSelect id="u-status" value={editing.draft.status} onChange={(v) => setEditing({ ...editing, draft: { ...editing.draft, status: v as User['status'] } })} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
              </Field>
            </div>
            <Field label={editing.user ? 'Reset password (leave blank to keep)' : 'Password'} htmlFor="u-password" error={errors.password} hint="At least 10 characters with upper, lower case and a number.">
              <input id="u-password" type="password" autoComplete="new-password" required={!editing.user} className={`form-input ${errors.password ? 'invalid' : ''}`} value={editing.draft.password} onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, password: e.target.value } })} />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : editing.user ? 'Save user' : 'Create user'}</button>
            </div>
          </form>
        </Modal>
      )}

      {pendingToggle && (
        <ConfirmDialog
          title={pendingToggle.status === 'active' ? `Deactivate ${pendingToggle.name}?` : `Reactivate ${pendingToggle.name}?`}
          body={pendingToggle.status === 'active' ? 'They will be signed out immediately and will not be able to sign in until reactivated. Their leads and visits are kept.' : 'They will be able to sign in again with their existing password.'}
          confirmLabel={pendingToggle.status === 'active' ? 'Deactivate' : 'Reactivate'}
          danger={pendingToggle.status === 'active'}
          busy={busyId === pendingToggle.id}
          onConfirm={toggleStatus}
          onCancel={() => setPendingToggle(null)}
        />
      )}
    </>
  );
}
