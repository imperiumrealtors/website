import type { NextRequest } from 'next/server';
import { handle, HttpError } from '@/lib/auth/guard';
import { resolveSession, SESSION_COOKIE } from '@/lib/auth/session';
import { canAccessPortal } from '@/lib/auth/permissions';
import { getMedia, getMediaBytes } from '@/lib/db/media';

type Ctx = { params: Promise<{ id: string }> };

/** Serves uploaded files. Private files require a portal session; public ones are open. */
export const GET = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const item = await getMedia(id);
  if (!item) throw new HttpError(404, 'File not found.');

  if (!item.isPublic) {
    const user = await resolveSession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!user || !canAccessPortal(user.role)) throw new HttpError(404, 'File not found.');
  }

  const bytes = await getMediaBytes(id);
  if (!bytes) throw new HttpError(404, 'File not found.');

  const inline = item.mime.startsWith('image/') || item.mime.startsWith('video/') || item.mime === 'application/pdf';
  const safeName = item.fileName.replace(/["\r\n]/g, '');
  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': item.mime,
      'Content-Length': String(bytes.byteLength),
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${safeName}"`,
      'Cache-Control': item.isPublic ? 'public, max-age=3600' : 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
