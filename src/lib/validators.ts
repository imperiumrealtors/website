import { DATE_RE, EMAIL_RE, PHONE_RE, SLUG_RE, Validator, slugify } from './validation';
import { INFRA } from './data';
import { ROLES } from './auth/permissions';
import type { LayoutInput } from './db/layouts';
import type { PlotInput } from './db/plots';
import type { LeadInput } from './db/leads';
import type { VisitInput } from './db/visits';
import {
  FACINGS, LEAD_STATUSES, MEDIA_KINDS, PLOT_STATUSES, VISIT_STATUSES,
  type Approval, type LandUse, type MediaKind, type Property, type Role, type User,
} from './types';

const LAYOUT_STATUSES: Property['status'][] = ['Ready to Register', 'Development in Progress', 'New Launch'];
const LAND_USES: LandUse[] = ['Residential', 'Commercial', 'Farmland', 'Industrial'];
const APPROVALS: Approval[] = ['DTCP', 'RERA', 'CMDA', 'Panchayat'];
const NEARBY_TYPES = ['Metro', 'School', 'Hospital', 'IT Park', 'Airport', 'Mall', 'Highway', 'Beach', 'Park'] as const;
const INFRA_IDS = Object.keys(INFRA);

export function validateLayout(body: Record<string, unknown>): LayoutInput {
  const v = new Validator(body);
  const name = v.string('name', { required: true, max: 120, label: 'Layout name' });
  const slugRaw = v.string('slug', { max: 80 });
  const slug = slugRaw ? slugRaw : slugify(name);
  if (slug && !SLUG_RE.test(slug)) v.errors.slug = 'Slug may only contain lowercase letters, numbers and hyphens.';

  const input: LayoutInput = {
    slug,
    name,
    builder: v.string('builder', { max: 80 }) || 'Imperium Realtors',
    location: v.string('location', { required: true, max: 120 }),
    corridor: v.string('corridor', { required: true, max: 120 }),
    city: v.string('city', { max: 80 }) || 'Chennai',
    address: v.string('address', { required: true, max: 300 }),
    lat: v.number('lat', { min: -90, max: 90 }),
    lng: v.number('lng', { min: -180, max: 180 }),
    status: v.enum('status', LAYOUT_STATUSES, { required: true, label: 'Status' }),
    possession: v.string('possession', { max: 120, label: 'Handover' }),
    description: v.string('description', { max: 4000 }),
    priceLakhs: v.number('priceLakhs', { required: true, min: 0, label: 'Starting price' }),
    priceLabel: v.string('priceLabel', { max: 40 }),
    pricePerSqft: v.number('pricePerSqft', { min: 0, integer: true, label: 'Rate per sq.ft' }),
    landArea: v.string('landArea', { max: 40, label: 'Extent' }),
    landUse: v.enum('landUse', LAND_USES, { fallback: 'Residential' }),
    approvals: v.enumArray('approvals', APPROVALS),
    approvalId: v.string('approvalId', { max: 200 }),
    roadWidth: v.string('roadWidth', { max: 80 }),
    facingOptions: v.enumArray('facingOptions', FACINGS),
    appreciation: v.string('appreciation', { max: 120 }),
    soil: v.string('soil', { max: 120 }),
    waterSource: v.string('waterSource', { max: 120 }),
    loanEligible: v.boolean('loanEligible', true),
    gated: v.boolean('gated', true),
    highlights: v.stringArray('highlights', { max: 12, itemMax: 200 }),
    infrastructure: v.stringArray('infrastructure', { max: 40 }).filter((id) => INFRA_IDS.includes(id)),
    photos: v.stringArray('photos', { max: 12, itemMax: 500 }),
    videoUrl: v.string('videoUrl', { max: 300 }) || null,
    nearby: v.objectArray('nearby', (_, s) => ({
      name: s.string('name', { required: true, max: 100 }),
      type: s.enum('type', NEARBY_TYPES, { fallback: 'Park' }),
      distance: s.string('distance', { max: 30 }),
      duration: s.string('duration', { max: 30 }),
    }), 12),
    priceBreakdown: v.objectArray('priceBreakdown', (_, s) => ({
      label: s.string('label', { required: true, max: 120 }),
      amount: s.string('amount', { required: true, max: 40 }),
    }), 12),
    documents: v.objectArray('documents', (_, s) => ({
      name: s.string('name', { required: true, max: 120 }),
      detail: s.string('detail', { max: 200 }),
      verified: s.boolean('verified', false),
    }), 12),
    featured: v.boolean('featured', false),
    newLaunch: v.boolean('newLaunch', false),
    active: v.boolean('active', true),
  };

  if (!input.priceLabel) input.priceLabel = formatLakhs(input.priceLakhs);
  if (input.photos.some((p) => !/^(https?:\/\/|\/api\/media\/)/.test(p))) {
    v.errors.photos = 'Photos must be https URLs or uploaded media links.';
  }
  v.throwIfInvalid();
  return input;
}

export function validatePlot(body: Record<string, unknown>, partial = false): Partial<PlotInput> {
  const v = new Validator(body);
  const out: Partial<PlotInput> = {};
  const has = (k: string) => !partial || body[k] !== undefined;

  if (has('layoutId')) out.layoutId = v.string('layoutId', { required: true, max: 64, label: 'Layout' });
  if (has('number')) out.number = v.string('number', { required: true, max: 20, label: 'Plot number' });
  if (has('area')) out.area = v.number('area', { required: true, min: 1, integer: true, label: 'Area' });
  if (has('dimensions')) out.dimensions = v.string('dimensions', { max: 40 });
  if (has('facing')) out.facing = v.enum('facing', FACINGS, { fallback: 'East' });
  if (has('corner')) out.corner = v.boolean('corner', false);
  if (has('priceLakhs')) out.priceLakhs = v.number('priceLakhs', { required: true, min: 0, label: 'Price' });
  if (has('priceLabel')) out.priceLabel = v.string('priceLabel', { max: 40 });
  if (has('status')) out.status = v.enum('status', PLOT_STATUSES, { fallback: 'Available' });
  if (has('notes')) out.notes = v.string('notes', { max: 1000 });

  if (out.priceLakhs != null && !out.priceLabel) out.priceLabel = formatLakhs(out.priceLakhs);
  v.throwIfInvalid();
  return out;
}

export function validateLead(body: Record<string, unknown>, partial = false): Partial<LeadInput> {
  const v = new Validator(body);
  const out: Partial<LeadInput> = {};
  const has = (k: string) => !partial || body[k] !== undefined;

  if (has('name')) out.name = v.string('name', { required: true, max: 100 });
  if (has('phone')) out.phone = v.string('phone', { required: true, max: 20, pattern: PHONE_RE, label: 'Phone' });
  if (has('email')) { const e = v.string('email', { max: 120 }); if (e && !EMAIL_RE.test(e)) v.errors.email = 'Email is not valid.'; out.email = e; }
  if (has('layoutId')) out.layoutId = v.optionalId('layoutId');
  if (has('plotId')) out.plotId = v.optionalId('plotId');
  if (has('budget')) out.budget = v.string('budget', { max: 60 });
  if (has('source')) out.source = v.string('source', { max: 60 }) || 'Manual';
  if (has('status')) out.status = v.enum('status', LEAD_STATUSES, { fallback: 'New' });
  if (has('assignedTo')) out.assignedTo = v.optionalId('assignedTo');
  if (has('notes')) out.notes = v.string('notes', { max: 4000 });

  v.throwIfInvalid();
  return out;
}

export function validateVisit(body: Record<string, unknown>, partial = false): Partial<VisitInput> {
  const v = new Validator(body);
  const out: Partial<VisitInput> = {};
  const has = (k: string) => !partial || body[k] !== undefined;

  if (has('leadId')) out.leadId = v.optionalId('leadId');
  if (has('customerName')) out.customerName = v.string('customerName', { required: true, max: 100, label: 'Customer name' });
  if (has('phone')) out.phone = v.string('phone', { required: true, max: 20, pattern: PHONE_RE, label: 'Phone' });
  if (has('layoutId')) out.layoutId = v.optionalId('layoutId');
  if (has('preferredDate')) out.preferredDate = v.string('preferredDate', { required: true, pattern: DATE_RE, label: 'Date' });
  if (has('preferredTime')) out.preferredTime = v.string('preferredTime', { required: true, max: 20, label: 'Time' });
  if (has('visitors')) out.visitors = v.number('visitors', { min: 1, max: 20, integer: true, fallback: 1 });
  if (has('pickup')) out.pickup = v.boolean('pickup', false);
  if (has('assignedTo')) out.assignedTo = v.optionalId('assignedTo');
  if (has('status')) out.status = v.enum('status', VISIT_STATUSES, { fallback: 'Requested' });
  if (has('notes')) out.notes = v.string('notes', { max: 4000 });

  v.throwIfInvalid();
  return out;
}

export function validateUser(body: Record<string, unknown>, opts: { requirePassword: boolean }) {
  const v = new Validator(body);
  const out = {
    name: v.string('name', { required: true, max: 100 }),
    email: v.string('email', { required: true, max: 120, pattern: EMAIL_RE, label: 'Email' }).toLowerCase(),
    role: v.enum('role', ROLES as readonly Role[], { required: true, label: 'Role' }),
    status: v.enum('status', ['active', 'inactive'] as const, { fallback: 'active' }) as User['status'],
    password: v.string('password', { required: opts.requirePassword, max: 200 }),
  };
  v.throwIfInvalid();
  return out;
}

export function validateMediaMeta(body: Record<string, unknown>) {
  const v = new Validator(body);
  const out = {
    title: v.string('title', { required: true, max: 120 }),
    layoutId: v.optionalId('layoutId'),
    kind: v.enum('kind', MEDIA_KINDS, { required: true }) as MediaKind,
    isPublic: v.boolean('isPublic', false),
  };
  v.throwIfInvalid();
  return out;
}

export function formatLakhs(lakhs: number): string {
  if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  return `₹${lakhs.toFixed(2).replace(/\.?0+$/, '')} L`;
}
