import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { createVisit, listVisits, type VisitInput } from '@/lib/db/visits';
import { validateVisit } from '@/lib/validators';
import { VISIT_STATUSES, type VisitStatus } from '@/lib/types';

export const GET = handle(async (req: NextRequest) => {
  requireApiPermission(req, 'visits:read');
  const sp = req.nextUrl.searchParams;
  const status = sp.get('status') as VisitStatus | null;
  const window = sp.get('window');
  return ok(listVisits({
    search: sp.get('q') ?? undefined,
    status: status && VISIT_STATUSES.includes(status) ? status : undefined,
    assignedTo: sp.get('assignedTo') ?? undefined,
    window: window === 'upcoming' || window === 'past' ? window : 'all',
  }));
});

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'visits:write');
  const input = validateVisit(await readJson(req));
  const visit = createVisit({
    leadId: null, layoutId: null, visitors: 1, pickup: false, assignedTo: null, status: 'Requested', notes: '',
    ...input,
  } as VisitInput);
  audit(user, 'visit.create', 'site_visit', visit.id, { customer: visit.customerName, date: visit.preferredDate }, clientIp(req));
  return ok(visit, { status: 201 });
});
