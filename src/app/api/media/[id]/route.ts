import fs from 'node:fs';
import type { NextRequest } from 'next/server';
import { handle, HttpError } from '@/lib/auth/guard';
import { resolveSession, SESSION_COOKIE } from '@/lib/auth/session';
import { canAccessPortal } from '@/lib/auth/permissions';
import { getMedia, storagePathFor } from '@/lib/db/media';

type Ctx = { params: Promise<{ id: string }> };

/** Serves uploaded files. Private files require a portal session; public ones are open. */
export const GET = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const item = getMedia(id);
  if (!item) throw new HttpError(404, 'File not found.');

  if (!item.isPublic) {
    const user = resolveSession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!user || !canAccessPortal(user.role)) throw new HttpError(404, 'File not found.');
  }

  const filePath = storagePathFor(item.storageName);
  if (!fs.existsSync(filePath)) throw new HttpError(404, 'File not found.');

  const inline = item.mime.startsWith('image/') || item.mime.startsWith('video/') || item.mime === 'application/pdf';
  const safeName = item.fileName.replace(/["\r\n]/g, '');
  return new Response(fs.readFileSync(filePath), {
    headers: {
      'Content-Type': item.mime,
      'Content-Length': String(item.size),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeName}"`,
      'Cache-Control': item.isPublic ? 'public, max-age=3600' : 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
