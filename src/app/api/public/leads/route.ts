import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson } from '@/lib/auth/guard';
import { createLead } from '@/lib/db/leads';
import { getLayoutBySlug } from '@/lib/db/layouts';
import { EMAIL_RE, PHONE_RE, Validator } from '@/lib/validation';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
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
  if (v.string('website', { max: 100 })) throw new HttpError(400, 'Invalid submission.'); // honeypot
  const name = v.string('name', { required: true, max: 100, label: 'Name' });
  const phone = v.string('phone', { required: true, max: 20, pattern: PHONE_RE, label: 'Mobile number' });
  const email = v.string('email', { max: 120 });
  if (email && !EMAIL_RE.test(email)) v.errors.email = 'Email is not valid.';
  const layoutSlug = v.string('layoutSlug', { max: 80 });
  const budget = v.string('budget', { max: 60 });
  const purpose = v.string('purpose', { max: 60 });
  const size = v.string('size', { max: 60 });
  const timeline = v.string('timeline', { max: 60 });
  const corridor = v.string('corridor', { max: 120 });
  const message = v.string('message', { max: 2000 });
  const source = v.string('source', { max: 40 }) || 'Website';
  v.throwIfInvalid();

  const layout = layoutSlug ? getLayoutBySlug(layoutSlug) : null;
  const notes = [
    purpose && `Purpose: ${purpose}`,
    size && `Plot size: ${size}`,
    timeline && `Timeline: ${timeline}`,
    corridor && `Corridor: ${corridor}`,
    message && `Message: ${message}`,
  ].filter(Boolean).join('\n');

  const lead = createLead({
    name, phone, email, budget, source, notes,
    layoutId: layout?.id ?? null, plotId: null, status: 'New', assignedTo: null,
  });
  audit(null, 'lead.web_enquiry', 'lead', lead.id, { source, layout: layout?.name ?? null }, ip);
  return ok({ id: lead.id }, { status: 201 });
});
