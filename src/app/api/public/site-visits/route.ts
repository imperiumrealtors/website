import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson } from '@/lib/auth/guard';
import { createLead, listLeads } from '@/lib/db/leads';
import { createVisit } from '@/lib/db/visits';
import { getLayoutBySlug } from '@/lib/db/layouts';
import { DATE_RE, PHONE_RE, Validator } from '@/lib/validation';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const buckets = new Map<string, { count: number; first: number }>();

function throttle(ip: string | null) {
  const key = ip ?? 'unknown';
  const entry = buckets.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) { buckets.set(key, { count: 1, first: Date.now() }); return; }
  entry.count += 1;
  if (entry.count > MAX_PER_WINDOW) throw new HttpError(429, 'Too many requests. Please try again shortly.');
}

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  throttle(ip);

  const body = await readJson(req);
  const v = new Validator(body);
  if (v.string('website', { max: 100 })) throw new HttpError(400, 'Invalid submission.');
  const name = v.string('name', { required: true, max: 100, label: 'Name' });
  const phone = v.string('phone', { required: true, max: 20, pattern: PHONE_RE, label: 'Mobile number' });
  const layoutSlug = v.string('layoutSlug', { required: true, max: 80, label: 'Layout' });
  const date = v.string('date', { required: true, pattern: DATE_RE, label: 'Date' });
  const time = v.string('time', { required: true, max: 20, label: 'Time slot' });
  const visitors = v.number('visitors', { min: 1, max: 10, integer: true, fallback: 1 });
  const pickup = v.boolean('pickup', false);
  v.throwIfInvalid();

  const layout = getLayoutBySlug(layoutSlug);
  if (!layout) throw new HttpError(422, 'Please fix the highlighted fields.', { layoutSlug: 'That layout is no longer available.' });
  if (date < new Date().toISOString().slice(0, 10)) throw new HttpError(422, 'Please fix the highlighted fields.', { date: 'Pick a date from today onwards.' });

  // Reuse an open lead for this phone number so the CRM does not fill with duplicates.
  const existing = listLeads({ search: phone, limit: 1 }).find((l) => l.phone === phone && l.status !== 'Lost' && l.status !== 'Converted');
  const lead = existing ?? createLead({
    name, phone, email: '', budget: '', source: 'Website — site visit', notes: `Requested a site visit to ${layout.name}.`,
    layoutId: layout.id, plotId: null, status: 'Site Visit Scheduled', assignedTo: null,
  });

  const visit = createVisit({
    leadId: lead.id, customerName: name, phone, layoutId: layout.id, preferredDate: date, preferredTime: time,
    visitors, pickup, assignedTo: lead.assignedTo, status: 'Requested', notes: '',
  });
  audit(null, 'visit.web_request', 'site_visit', visit.id, { layout: layout.name, date }, ip);
  return ok({ id: visit.id }, { status: 201 });
});
