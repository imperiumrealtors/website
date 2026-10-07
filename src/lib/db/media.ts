import path from 'node:path';
import { all, newId, nowIso, one, run, toBool, transaction, type Row } from './index';
import type { MediaItem, MediaKind } from '../types';

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

export async function listMedia(opts: { layoutId?: string; kind?: MediaKind; search?: string } = {}): Promise<MediaItem[]> {
  const where: string[] = [];
  const params: string[] = [];
  if (opts.layoutId) { where.push('m.layout_id = ?'); params.push(opts.layoutId); }
  if (opts.kind) { where.push('m.kind = ?'); params.push(opts.kind); }
  if (opts.search) { where.push('(m.title LIKE ? OR m.file_name LIKE ?)'); params.push(`%${opts.search}%`, `%${opts.search}%`); }
  const sql = `${BASE} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY m.created_at DESC`;
  return (await all(sql, ...params)).map(rowToMedia);
}

export async function getMedia(id: string): Promise<MediaItem | null> {
  const row = await one(`${BASE} WHERE m.id = ?`, id);
  return row ? rowToMedia(row) : null;
}

/** File contents live in the database so uploads survive redeploys on hosts with ephemeral disks. */
export async function getMediaBytes(id: string): Promise<Uint8Array | null> {
  const row = await one<{ data: ArrayBuffer | Uint8Array }>('SELECT data FROM media_files WHERE media_id = ?', id);
  if (!row) return null;
  return row.data instanceof Uint8Array ? row.data : new Uint8Array(row.data);
}

export async function saveUpload(input: {
  layoutId: string | null; kind: MediaKind; title: string; fileName: string; mime: string;
  bytes: Buffer; isPublic: boolean; uploadedBy: string;
}): Promise<MediaItem> {
  const id = newId();
  const ext = path.extname(input.fileName).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 10);
  await transaction([
    {
      sql: `INSERT INTO media (id, layout_id, kind, title, file_name, mime, size, storage_name, is_public, uploaded_by, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      args: [id, input.layoutId, input.kind, input.title, input.fileName, input.mime, input.bytes.length, `${id}${ext}`,
        input.isPublic ? 1 : 0, input.uploadedBy, nowIso()],
    },
    { sql: 'INSERT INTO media_files (media_id, data) VALUES (?, ?)', args: [id, new Uint8Array(input.bytes)] },
  ]);
  return (await getMedia(id))!;
}

export async function updateMedia(id: string, input: { title: string; layoutId: string | null; isPublic: boolean; kind: MediaKind }): Promise<MediaItem | null> {
  const changes = await run('UPDATE media SET title=?, layout_id=?, is_public=?, kind=? WHERE id=?',
    input.title, input.layoutId, input.isPublic ? 1 : 0, input.kind, id);
  return changes ? getMedia(id) : null;
}

export async function deleteMedia(id: string): Promise<boolean> {
  const [, deleted] = await transaction([
    { sql: 'DELETE FROM media_files WHERE media_id = ?', args: [id] },
    { sql: 'DELETE FROM media WHERE id = ?', args: [id] },
  ]);
  return deleted > 0;
}
