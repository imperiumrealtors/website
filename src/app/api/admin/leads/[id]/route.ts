import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { deleteLead, getLead, updateLead } from '@/lib/db/leads';
import { validateLead } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (req: NextRequest, { params }: Ctx) => {
  await requireApiPermission(req, 'leads:read');
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) throw new HttpError(404, 'Lead not found.');
  return ok(lead);
});

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = await requireApiPermission(req, 'leads:write');
  const { id } = await params;
  if (!await getLead(id)) throw new HttpError(404, 'Lead not found.');
  const input = validateLead(await readJson(req), true);
  const lead = await updateLead(id, input);
  await audit(user, 'lead.update', 'lead', id, { changes: Object.keys(input), status: lead?.status }, clientIp(req));
  return ok(lead);
});

export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = await requireApiPermission(req, 'leads:write');
  const { id } = await params;
  const existing = await getLead(id);
  if (!existing) throw new HttpError(404, 'Lead not found.');
  await deleteLead(id);
  await audit(user, 'lead.delete', 'lead', id, { name: existing.name }, clientIp(req));
  return ok(null);
});
