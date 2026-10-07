import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { createLead, listLeads, type LeadInput, type LeadSort } from '@/lib/db/leads';
import { validateLead } from '@/lib/validators';
import { LEAD_STATUSES, type LeadStatus } from '@/lib/types';

export const GET = handle(async (req: NextRequest) => {
  requireApiPermission(req, 'leads:read');
  const sp = req.nextUrl.searchParams;
  const status = sp.get('status') as LeadStatus | null;
  const sort = (sp.get('sort') ?? 'newest') as LeadSort;
  return ok(listLeads({
    search: sp.get('q') ?? undefined,
    status: status && LEAD_STATUSES.includes(status) ? status : undefined,
    assignedTo: sp.get('assignedTo') ?? undefined,
    layoutId: sp.get('layoutId') ?? undefined,
    sort: ['newest', 'oldest', 'name', 'status'].includes(sort) ? sort : 'newest',
  }));
});

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'leads:write');
  const input = validateLead(await readJson(req));
  const lead = createLead({
    email: '', layoutId: null, plotId: null, budget: '', source: 'Manual', status: 'New', assignedTo: null, notes: '',
    ...input,
  } as LeadInput);
  audit(user, 'lead.create', 'lead', lead.id, { name: lead.name }, clientIp(req));
  return ok(lead, { status: 201 });
});
