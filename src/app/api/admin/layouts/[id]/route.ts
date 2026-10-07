import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { deleteLayout, getLayout, setLayoutActive, slugExists, updateLayout } from '@/lib/db/layouts';
import { listPlotsForLayout } from '@/lib/db/plots';
import { validateLayout } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (req: NextRequest, { params }: Ctx) => {
  await requireApiPermission(req, 'layouts:read');
  const { id } = await params;
  const layout = await getLayout(id);
  if (!layout) throw new HttpError(404, 'Layout not found.');
  return ok({ ...layout, plots: await listPlotsForLayout(id) });
});

export const PUT = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = await requireApiPermission(req, 'layouts:write');
  const { id } = await params;
  if (!await getLayout(id)) throw new HttpError(404, 'Layout not found.');
  const input = validateLayout(await readJson(req));
  if (await slugExists(input.slug, id)) throw new HttpError(422, 'Please fix the highlighted fields.', { slug: 'A layout with this slug already exists.' });
  const layout = await updateLayout(id, input);
  await audit(user, 'layout.update', 'layout', id, { name: input.name }, clientIp(req));
  return ok(layout);
});

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = await requireApiPermission(req, 'layouts:write');
  const { id } = await params;
  const body = await readJson<{ active?: boolean }>(req);
  if (typeof body.active !== 'boolean') throw new HttpError(400, 'Expected { active: boolean }.');
  if (!await setLayoutActive(id, body.active)) throw new HttpError(404, 'Layout not found.');
  await audit(user, body.active ? 'layout.activate' : 'layout.deactivate', 'layout', id, {}, clientIp(req));
  return ok(await getLayout(id));
});

export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = await requireApiPermission(req, 'layouts:write');
  const { id } = await params;
  const existing = await getLayout(id);
  if (!existing) throw new HttpError(404, 'Layout not found.');
  await deleteLayout(id);
  await audit(user, 'layout.delete', 'layout', id, { name: existing.name, plots: existing.totalPlots }, clientIp(req));
  return ok(null);
});
