import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { createLayout, listLayouts, slugExists } from '@/lib/db/layouts';
import { validateLayout } from '@/lib/validators';

export const GET = handle(async (req: NextRequest) => {
  requireApiPermission(req, 'layouts:read');
  const search = req.nextUrl.searchParams.get('q') ?? undefined;
  return ok(listLayouts({ includeInactive: true, search }));
});

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'layouts:write');
  const input = validateLayout(await readJson(req));
  if (slugExists(input.slug)) throw new HttpError(422, 'Please fix the highlighted fields.', { slug: 'A layout with this slug already exists.' });
  const layout = createLayout(input);
  audit(user, 'layout.create', 'layout', layout.id, { name: layout.name }, clientIp(req));
  return ok(layout, { status: 201 });
});
