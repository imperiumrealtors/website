'use client';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Trash2, Globe, Lock, FileText, Film, Image as ImageIcon, File, ExternalLink } from 'lucide-react';
import BrandSelect from '@/components/BrandSelect';
import { api, formatBytes, formatDate, type FieldErrors } from '@/lib/admin-api';
import { MEDIA_KINDS, type MediaItem, type MediaKind } from '@/lib/types';
import { PageHeader, Card, EmptyState, ConfirmDialog, Field, SearchInput, Alert, useToast } from './ui';

interface Props {
  initial: MediaItem[];
  layouts: { id: string; name: string }[];
  canWrite: boolean;
}

const KIND_ICON: Record<MediaKind, React.ComponentType<{ size?: number }>> = { image: ImageIcon, video: Film, brochure: FileText, document: File };
const ACCEPT: Record<MediaKind, string> = {
  image: 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml',
  video: 'video/mp4,video/webm,video/quicktime',
  brochure: 'application/pdf',
  document: 'application/pdf,.doc,.docx,text/plain',
};

export default function MediaManager({ initial, layouts, canWrite }: Props) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [layoutFilter, setLayoutFilter] = useState('');
  const [upload, setUpload] = useState({ title: '', kind: 'image' as MediaKind, layoutId: '', isPublic: true });
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((m) =>
      (!s || `${m.title} ${m.fileName} ${m.layoutName ?? ''}`.toLowerCase().includes(s)) &&
      (!kindFilter || m.kind === kindFilter) &&
      (!layoutFilter || m.layoutId === layoutFilter),
    );
  }, [items, q, kindFilter, layoutFilter]);

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setErrors({ file: 'Choose a file to upload.' }); return; }
    setUploading(true);
    setErrors({});
    const form = new FormData();
    form.set('file', file);
    form.set('title', upload.title || file.name);
    form.set('kind', upload.kind);
    form.set('layoutId', upload.layoutId);
    form.set('isPublic', String(upload.isPublic));
    const res = await api.upload<MediaItem>('/api/admin/media', form);
    setUploading(false);
    if (!res.ok) { setErrors(res.details ?? { _: res.error }); return; }
    setItems((all) => [res.data, ...all]);
    setUpload((u) => ({ ...u, title: '' }));
    if (fileRef.current) fileRef.current.value = '';
    toast('success', `${res.data.title} uploaded.`);
    router.refresh();
  };

  const togglePublic = async (m: MediaItem) => {
    setBusyId(m.id);
    const res = await api.patch<MediaItem>(`/api/admin/media/${m.id}`, { isPublic: !m.isPublic });
    setBusyId(null);
    if (!res.ok) { toast('error', res.error); return; }
    setItems((all) => all.map((x) => (x.id === m.id ? res.data : x)));
    toast('success', res.data.isPublic ? 'File is now publicly accessible.' : 'File is now private.');
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    const res = await api.del(`/api/admin/media/${pendingDelete.id}`);
    setBusyId(null);
    if (!res.ok) { toast('error', res.error); return; }
    setItems((all) => all.filter((x) => x.id !== pendingDelete.id));
    toast('success', 'File deleted.');
    setPendingDelete(null);
    router.refresh();
  };

  const kindOptions = MEDIA_KINDS.map((k) => ({ value: k, label: k[0].toUpperCase() + k.slice(1) }));
  const layoutOptions = [{ value: '', label: 'Not linked to a layout' }, ...layouts.map((l) => ({ value: l.id, label: l.name }))];

  return (
    <>
      <PageHeader title="Media" subtitle={`${items.length} files · ${items.filter((m) => m.isPublic).length} public`} />

      <div className="admin-grid-2" style={{ gridTemplateColumns: canWrite ? 'minmax(280px, 360px) minmax(0, 1fr)' : '1fr' }}>
        {canWrite && (
          <Card title="Upload a file">
            <form onSubmit={submitUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {errors._ && <Alert kind="error">{errors._}</Alert>}
              <Field label="Type" htmlFor="m-kind" error={errors.kind}>
                <BrandSelect id="m-kind" value={upload.kind} onChange={(v) => setUpload({ ...upload, kind: v as MediaKind })} options={kindOptions} />
              </Field>
              <Field label="File" htmlFor="m-file" error={errors.file} hint="Up to 25 MB.">
                <input id="m-file" ref={fileRef} type="file" accept={ACCEPT[upload.kind]} className={`form-input ${errors.file ? 'invalid' : ''}`} style={{ padding: 9 }} />
              </Field>
              <Field label="Title" htmlFor="m-title" error={errors.title} hint="Defaults to the file name."><input id="m-title" className="form-input" value={upload.title} onChange={(e) => setUpload({ ...upload, title: e.target.value })} /></Field>
              <Field label="Linked layout" htmlFor="m-layout" error={errors.layoutId}>
                <BrandSelect id="m-layout" value={upload.layoutId} onChange={(v) => setUpload({ ...upload, layoutId: v })} options={layoutOptions} />
              </Field>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={upload.isPublic} onChange={(e) => setUpload({ ...upload, isPublic: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--brand-deep)', marginTop: 2 }} />
                <span><strong style={{ color: 'var(--brand-deep)' }}>Public</strong> — usable on the website. Private files can only be opened by signed-in staff.</span>
              </label>
              <button type="submit" className="btn btn-primary btn-sm" disabled={uploading}><Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}</button>
            </form>
          </Card>
        )}

        <Card padded={false} title="Library" actions={
          <div className="admin-toolbar">
            <SearchInput value={q} onChange={setQ} placeholder="Title or file name…" />
            <div style={{ width: 140 }}><BrandSelect ariaLabel="Type" value={kindFilter} onChange={setKindFilter} options={[{ value: '', label: 'All types' }, ...kindOptions]} /></div>
            <div style={{ width: 190 }}><BrandSelect ariaLabel="Layout" value={layoutFilter} onChange={setLayoutFilter} options={[{ value: '', label: 'All layouts' }, ...layouts.map((l) => ({ value: l.id, label: l.name }))]} /></div>
          </div>
        }>
          {visible.length === 0 ? (
            <EmptyState title={items.length === 0 ? 'No files uploaded yet' : 'No files match'} body={items.length === 0 ? 'Upload layout photos, brochures and approval documents to keep them in one place.' : 'Try a different search or filter.'} />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>File</th><th>Type</th><th>Layout</th><th>Size</th><th>Access</th><th>Uploaded</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                <tbody>
                  {visible.map((m) => {
                    const Icon = KIND_ICON[m.kind];
                    return (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 48, height: 38, borderRadius: 6, overflow: 'hidden', background: 'var(--brand-deep-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-deep)', flexShrink: 0 }}>
                              {m.kind === 'image'
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <Icon size={18} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: 'var(--brand-deep)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>{m.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>{m.fileName}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{m.kind}</td>
                        <td>{m.layoutName ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatBytes(m.size)}</td>
                        <td>
                          <span className="pill" style={m.isPublic ? { background: 'rgba(18,140,90,0.12)', color: '#0B6B44' } : { background: 'rgba(13,27,42,0.10)', color: 'var(--brand-deep)' }}>
                            {m.isPublic ? <Globe size={11} /> : <Lock size={11} />} {m.isPublic ? 'Public' : 'Private'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(m.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <a href={m.url} target="_blank" rel="noopener" className="admin-icon-btn" title="Open"><ExternalLink size={14} /></a>
                            {canWrite && (
                              <>
                                <button className="admin-icon-btn" title={m.isPublic ? 'Make private' : 'Make public'} onClick={() => togglePublic(m)} disabled={busyId === m.id}>{m.isPublic ? <Lock size={14} /> : <Globe size={14} />}</button>
                                <button className="admin-icon-btn danger" title="Delete" onClick={() => setPendingDelete(m)} disabled={busyId === m.id}><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {pendingDelete && (
        <ConfirmDialog title={`Delete ${pendingDelete.title}?`} body="The file is removed from storage. If it is used as a layout photo, that photo link will stop working." busy={busyId === pendingDelete.id} onConfirm={remove} onCancel={() => setPendingDelete(null)} />
      )}
    </>
  );
}
