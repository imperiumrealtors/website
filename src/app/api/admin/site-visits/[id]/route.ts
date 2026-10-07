import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { deleteVisit, getVisit, updateVisit } from '@/lib/db/visits';
import { validateVisit } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'visits:write');
  const { id } = await params;
  if (!getVisit(id)) throw new HttpError(404, 'Site visit not found.');
  const input = validateVisit(await readJson(req), true);
  const visit = updateVisit(id, input);
  audit(user, 'visit.update', 'site_visit', id, { changes: Object.keys(input), status: visit?.status }, clientIp(req));
  return ok(visit);
});

export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'visits:write');
  const { id } = await params;
  const existing = getVisit(id);
  if (!existing) throw new HttpError(404, 'Site visit not found.');
  deleteVisit(id);
  audit(user, 'visit.delete', 'site_visit', id, { customer: existing.customerName }, clientIp(req));
  return ok(null);
});
