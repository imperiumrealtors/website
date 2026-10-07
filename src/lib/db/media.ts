import fs from 'node:fs';
import path from 'node:path';
import { getDb, newId, nowIso, toBool, UPLOAD_DIR } from './index';
import type { MediaItem, MediaKind } from '../types';

type Row = Record<string, unknown>;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_MIME: Record<MediaKind, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  brochure: ['application/pdf'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
};

function rowToMedia(r: Row): MediaItem {
  const id = r.id as string;
  return {
    id,
    layoutId: (r.layout_id as string | null) ?? null,
    layoutName: (r.layout_name as string | null) ?? null,
    kind: r.kind as MediaKind,
    title: r.title as string,
    fileName: r.file_name as string,
    mime: r.mime as string,
    size: Number(r.size),
    isPublic: toBool(r.is_public),
    uploadedBy: (r.uploaded_by as string | null) ?? null,
    createdAt: r.created_at as string,
    url: `/api/media/${id}`,
  };
}

const BASE = 'SELECT m.*, l.name AS layout_name FROM media m LEFT JOIN layouts l ON l.id = m.layout_id';

export function listMedia(opts: { layoutId?: string; kind?: MediaKind; search?: string } = {}): MediaItem[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.layoutId) { where.push('m.layout_id = ?'); params.push(opts.layoutId); }
  if (opts.kind) { where.push('m.kind = ?'); params.push(opts.kind); }
  if (opts.search) { where.push('(m.title LIKE ? OR m.file_name LIKE ?)'); params.push(`%${opts.search}%`, `%${opts.search}%`); }
  const sql = `${BASE} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY m.created_at DESC`;
  return (getDb().prepare(sql).all(...(params as string[])) as Row[]).map(rowToMedia);
}

export function getMedia(id: string): (MediaItem & { storageName: string }) | null {
  const row = getDb().prepare(`${BASE} WHERE m.id = ?`).get(id) as Row | undefined;
  return row ? { ...rowToMedia(row), storageName: row.storage_name as string } : null;
}

export function storagePathFor(storageName: string) {
  const resolved = path.resolve(UPLOAD_DIR, storageName);
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) throw new Error('Invalid storage path');
  return resolved;
}

export function saveUpload(input: {
  layoutId: string | null; kind: MediaKind; title: string; fileName: string; mime: string;
  bytes: Buffer; isPublic: boolean; uploadedBy: string;
}): MediaItem {
  const id = newId();
  const ext = path.extname(input.fileName).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 10);
  const storageName = `${id}${ext}`;
  fs.writeFileSync(storagePathFor(storageName), input.bytes, { mode: 0o600 });
  getDb().prepare(`
    INSERT INTO media (id, layout_id, kind, title, file_name, mime, size, storage_name, is_public, uploaded_by, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, input.layoutId, input.kind, input.title, input.fileName, input.mime, input.bytes.length, storageName,
    input.isPublic ? 1 : 0, input.uploadedBy, nowIso());
  return getMedia(id)!;
}

export function updateMedia(id: string, input: { title: string; layoutId: string | null; isPublic: boolean; kind: MediaKind }): MediaItem | null {
  const res = getDb().prepare('UPDATE media SET title=?, layout_id=?, is_public=?, kind=? WHERE id=?')
    .run(input.title, input.layoutId, input.isPublic ? 1 : 0, input.kind, id);
  return res.changes ? getMedia(id) : null;
}

export function deleteMedia(id: string): boolean {
  const item = getMedia(id);
  if (!item) return false;
  getDb().prepare('DELETE FROM media WHERE id = ?').run(id);
  try { fs.unlinkSync(storagePathFor(item.storageName)); } catch { /* file already gone */ }
  return true;
}
