import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { deleteLayout, getLayout, setLayoutActive, slugExists, updateLayout } from '@/lib/db/layouts';
import { listPlotsForLayout } from '@/lib/db/plots';
import { validateLayout } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (req: NextRequest, { params }: Ctx) => {
  requireApiPermission(req, 'layouts:read');
  const { id } = await params;
  const layout = getLayout(id);
  if (!layout) throw new HttpError(404, 'Layout not found.');
  return ok({ ...layout, plots: listPlotsForLayout(id) });
});

export const PUT = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'layouts:write');
  const { id } = await params;
  if (!getLayout(id)) throw new HttpError(404, 'Layout not found.');
  const input = validateLayout(await readJson(req));
  if (slugExists(input.slug, id)) throw new HttpError(422, 'Please fix the highlighted fields.', { slug: 'A layout with this slug already exists.' });
  const layout = updateLayout(id, input);
  audit(user, 'layout.update', 'layout', id, { name: input.name }, clientIp(req));
  return ok(layout);
});

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'layouts:write');
  const { id } = await params;
  const body = await readJson<{ active?: boolean }>(req);
  if (typeof body.active !== 'boolean') throw new HttpError(400, 'Expected { active: boolean }.');
  if (!setLayoutActive(id, body.active)) throw new HttpError(404, 'Layout not found.');
  audit(user, body.active ? 'layout.activate' : 'layout.deactivate', 'layout', id, {}, clientIp(req));
  return ok(getLayout(id));
});

export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'layouts:write');
  const { id } = await params;
  const existing = getLayout(id);
  if (!existing) throw new HttpError(404, 'Layout not found.');
  deleteLayout(id);
  audit(user, 'layout.delete', 'layout', id, { name: existing.name, plots: existing.totalPlots }, clientIp(req));
  return ok(null);
});
