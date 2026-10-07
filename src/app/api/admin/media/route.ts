import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, requireApiPermission } from '@/lib/auth/guard';
import { ALLOWED_MIME, listMedia, MAX_UPLOAD_BYTES, saveUpload } from '@/lib/db/media';
import { getLayout } from '@/lib/db/layouts';
import { validateMediaMeta } from '@/lib/validators';
import { MEDIA_KINDS, type MediaKind } from '@/lib/types';

export const GET = handle(async (req: NextRequest) => {
  requireApiPermission(req, 'media:read');
  const sp = req.nextUrl.searchParams;
  const kind = sp.get('kind') as MediaKind | null;
  return ok(listMedia({
    layoutId: sp.get('layoutId') ?? undefined,
    kind: kind && MEDIA_KINDS.includes(kind) ? kind : undefined,
    search: sp.get('q') ?? undefined,
  }));
});

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'media:write');
  if (!req.headers.get('content-type')?.includes('multipart/form-data')) throw new HttpError(415, 'Expected multipart/form-data.');

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new HttpError(422, 'Please fix the highlighted fields.', { file: 'Choose a file to upload.' });
  if (file.size === 0) throw new HttpError(422, 'Please fix the highlighted fields.', { file: 'The file is empty.' });
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(422, 'Please fix the highlighted fields.', { file: `Files must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` });

  const meta = validateMediaMeta({
    title: form.get('title') ?? file.name,
    layoutId: form.get('layoutId') ?? '',
    kind: form.get('kind') ?? '',
    isPublic: form.get('isPublic') ?? 'false',
  });
  if (!ALLOWED_MIME[meta.kind].includes(file.type)) {
    throw new HttpError(422, 'Please fix the highlighted fields.', { file: `${file.type || 'This file type'} is not allowed for ${meta.kind} uploads.` });
  }
  if (meta.layoutId && !getLayout(meta.layoutId)) throw new HttpError(422, 'Please fix the highlighted fields.', { layoutId: 'Layout not found.' });

  const bytes = Buffer.from(await file.arrayBuffer());
  const item = saveUpload({ ...meta, fileName: file.name.slice(0, 200), mime: file.type, bytes, uploadedBy: user.id });
  audit(user, 'media.upload', 'media', item.id, { title: item.title, kind: item.kind, size: item.size, public: item.isPublic }, clientIp(req));
  return ok(item, { status: 201 });
});
