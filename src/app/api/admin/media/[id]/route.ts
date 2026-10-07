import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { deleteMedia, getMedia, updateMedia } from '@/lib/db/media';
import { getLayout } from '@/lib/db/layouts';
import { validateMediaMeta } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'media:write');
  const { id } = await params;
  const existing = getMedia(id);
  if (!existing) throw new HttpError(404, 'Media not found.');
  const body = await readJson(req);
  const meta = validateMediaMeta({ title: existing.title, kind: existing.kind, layoutId: existing.layoutId ?? '', isPublic: existing.isPublic, ...body });
  if (meta.layoutId && !getLayout(meta.layoutId)) throw new HttpError(422, 'Please fix the highlighted fields.', { layoutId: 'Layout not found.' });
  const item = updateMedia(id, meta);
  audit(user, 'media.update', 'media', id, { public: meta.isPublic, layoutId: meta.layoutId }, clientIp(req));
  return ok(item);
});

export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'media:write');
  const { id } = await params;
  const existing = getMedia(id);
  if (!existing) throw new HttpError(404, 'Media not found.');
  deleteMedia(id);
  audit(user, 'media.delete', 'media', id, { title: existing.title }, clientIp(req));
  return ok(null);
});
