import { getDb, newId, nowIso, parseJson, toBool } from './index';
import { INFRA, FALLBACK_PHOTO } from '../data';
import type {
  Approval, Facing, LandDocument, LandUse, LayoutRecord, NearbyPlace, PlotStatus, PriceItem, Property, PlotUnit,
} from '../types';

type Row = Record<string, unknown>;

export function rowToLayout(r: Row): LayoutRecord {
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    builder: r.builder as string,
    location: r.location as string,
    corridor: r.corridor as string,
    city: r.city as string,
    address: r.address as string,
    lat: Number(r.lat),
    lng: Number(r.lng),
    status: r.status as LayoutRecord['status'],
    possession: r.possession as string,
    description: r.description as string,
    priceLakhs: Number(r.price_lakhs),
    priceLabel: r.price_label as string,
    pricePerSqft: Number(r.price_per_sqft),
    landArea: r.land_area as string,
    landUse: r.land_use as LandUse,
    approvals: parseJson<Approval[]>(r.approvals, []),
    approvalId: r.approval_id as string,
    roadWidth: r.road_width as string,
    facingOptions: parseJson<Facing[]>(r.facing_options, []),
    appreciation: r.appreciation as string,
    soil: r.soil as string,
    waterSource: r.water_source as string,
    loanEligible: toBool(r.loan_eligible),
    gated: toBool(r.gated),
    highlights: parseJson<string[]>(r.highlights, []),
    infrastructure: parseJson<string[]>(r.infrastructure, []),
    photos: parseJson<string[]>(r.photos, []),
    videoUrl: (r.video_url as string | null) ?? null,
    nearby: parseJson<NearbyPlace[]>(r.nearby, []),
    priceBreakdown: parseJson<PriceItem[]>(r.price_breakdown, []),
    documents: parseJson<LandDocument[]>(r.documents, []),
    featured: toBool(r.featured),
    newLaunch: toBool(r.new_launch),
    active: toBool(r.active),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export interface LayoutSummary extends LayoutRecord {
  totalPlots: number;
  availablePlots: number;
  soldPlots: number;
}

const SUMMARY_SQL = `
  SELECT l.*,
    (SELECT COUNT(*) FROM plots p WHERE p.layout_id = l.id) AS total_plots,
    (SELECT COUNT(*) FROM plots p WHERE p.layout_id = l.id AND p.status = 'Available') AS available_plots,
    (SELECT COUNT(*) FROM plots p WHERE p.layout_id = l.id AND p.status = 'Sold') AS sold_plots
  FROM layouts l
`;

function rowToSummary(r: Row): LayoutSummary {
  return {
    ...rowToLayout(r),
    totalPlots: Number(r.total_plots),
    availablePlots: Number(r.available_plots),
    soldPlots: Number(r.sold_plots),
  };
}

export function listLayouts(opts: { includeInactive?: boolean; search?: string } = {}): LayoutSummary[] {
  const where: string[] = [];
  const params: unknown[] = [];
  if (!opts.includeInactive) where.push('l.active = 1');
  if (opts.search) {
    where.push('(l.name LIKE ? OR l.location LIKE ? OR l.corridor LIKE ?)');
    const q = `%${opts.search}%`;
    params.push(q, q, q);
  }
  const sql = `${SUMMARY_SQL} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY l.featured DESC, l.created_at DESC`;
  return (getDb().prepare(sql).all(...(params as string[])) as Row[]).map(rowToSummary);
}

export function getLayout(id: string): LayoutSummary | null {
  const row = getDb().prepare(`${SUMMARY_SQL} WHERE l.id = ?`).get(id) as Row | undefined;
  return row ? rowToSummary(row) : null;
}

export function getLayoutBySlug(slug: string, includeInactive = false): LayoutSummary | null {
  const row = getDb()
    .prepare(`${SUMMARY_SQL} WHERE l.slug = ? ${includeInactive ? '' : 'AND l.active = 1'}`)
    .get(slug) as Row | undefined;
  return row ? rowToSummary(row) : null;
}

export function slugExists(slug: string, exceptId?: string): boolean {
  const row = getDb().prepare('SELECT id FROM layouts WHERE slug = ? AND id != ?').get(slug, exceptId ?? '') as Row | undefined;
  return Boolean(row);
}

export type LayoutInput = Omit<LayoutRecord, 'id' | 'createdAt' | 'updatedAt'>;

const COLUMNS = [
  'slug', 'name', 'builder', 'location', 'corridor', 'city', 'address', 'lat', 'lng', 'status', 'possession',
  'description', 'price_lakhs', 'price_label', 'price_per_sqft', 'land_area', 'land_use', 'approvals', 'approval_id',
  'road_width', 'facing_options', 'appreciation', 'soil', 'water_source', 'loan_eligible', 'gated', 'highlights',
  'infrastructure', 'photos', 'video_url', 'nearby', 'price_breakdown', 'documents', 'featured', 'new_launch', 'active',
] as const;

function inputToValues(input: LayoutInput): unknown[] {
  return [
    input.slug, input.name, input.builder, input.location, input.corridor, input.city, input.address,
    input.lat, input.lng, input.status, input.possession, input.description, input.priceLakhs, input.priceLabel,
    input.pricePerSqft, input.landArea, input.landUse, JSON.stringify(input.approvals), input.approvalId,
    input.roadWidth, JSON.stringify(input.facingOptions), input.appreciation, input.soil, input.waterSource,
    input.loanEligible ? 1 : 0, input.gated ? 1 : 0, JSON.stringify(input.highlights),
    JSON.stringify(input.infrastructure), JSON.stringify(input.photos), input.videoUrl,
    JSON.stringify(input.nearby), JSON.stringify(input.priceBreakdown), JSON.stringify(input.documents),
    input.featured ? 1 : 0, input.newLaunch ? 1 : 0, input.active ? 1 : 0,
  ];
}

export function createLayout(input: LayoutInput): LayoutSummary {
  const id = newId();
  const ts = nowIso();
  const cols = [...COLUMNS, 'id', 'created_at', 'updated_at'];
  getDb().prepare(`INSERT INTO layouts (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
    .run(...(inputToValues(input) as string[]), id, ts, ts);
  return getLayout(id)!;
}

export function updateLayout(id: string, input: LayoutInput): LayoutSummary | null {
  const sets = COLUMNS.map((c) => `${c} = ?`).join(', ');
  const res = getDb().prepare(`UPDATE layouts SET ${sets}, updated_at = ? WHERE id = ?`)
    .run(...(inputToValues(input) as string[]), nowIso(), id);
  return res.changes ? getLayout(id) : null;
}

export function setLayoutActive(id: string, active: boolean): boolean {
  return getDb().prepare('UPDATE layouts SET active = ?, updated_at = ? WHERE id = ?').run(active ? 1 : 0, nowIso(), id).changes > 0;
}

export function deleteLayout(id: string): boolean {
  return getDb().prepare('DELETE FROM layouts WHERE id = ?').run(id).changes > 0;
}

export function recentlyUpdatedLayouts(limit = 5): LayoutSummary[] {
  return (getDb().prepare(`${SUMMARY_SQL} ORDER BY l.updated_at DESC LIMIT ?`).all(limit) as Row[]).map(rowToSummary);
}

/* ---------- Public projection ---------- */

const publicAvailability = (status: PlotStatus): PlotUnit['availability'] =>
  status === 'Available' ? 'Available' : status === 'Sold' ? 'Sold' : 'On Hold';

export function layoutToProperty(layout: LayoutSummary, plots: { number: string; area: number; dimensions: string; facing: Facing; corner: boolean; priceLakhs: number; priceLabel: string; status: PlotStatus; id: string }[]): Property {
  const infra = layout.infrastructure
    .map((id) => (INFRA as Record<string, (typeof INFRA)[keyof typeof INFRA]>)[id])
    .filter(Boolean);
  const areas = plots.map((p) => p.area);
  return {
    id: layout.id,
    slug: layout.slug,
    title: layout.name,
    projectName: layout.name,
    builder: layout.builder,
    type: 'Plot',
    price: layout.priceLakhs,
    priceLabel: layout.priceLabel,
    area: areas.length ? Math.min(...areas) : 0,
    location: layout.location,
    corridor: layout.corridor,
    city: layout.city,
    address: layout.address,
    coordinates: { lat: layout.lat, lng: layout.lng },
    status: layout.status,
    possession: layout.possession,
    description: layout.description,
    highlights: layout.highlights,
    infrastructure: infra,
    photos: layout.photos.length ? layout.photos : [FALLBACK_PHOTO],
    videoUrl: layout.videoUrl ?? undefined,
    nearbyPlaces: layout.nearby,
    priceBreakdown: layout.priceBreakdown,
    featured: layout.featured,
    newLaunch: layout.newLaunch,
    createdAt: layout.createdAt,
    land: {
      use: layout.landUse,
      approvals: layout.approvals,
      approvalId: layout.approvalId,
      pricePerSqft: layout.pricePerSqft,
      totalPlots: layout.totalPlots,
      availablePlots: layout.availablePlots,
      roadWidth: layout.roadWidth,
      facingOptions: layout.facingOptions,
      appreciation: layout.appreciation,
      soil: layout.soil,
      waterSource: layout.waterSource,
      loanEligible: layout.loanEligible,
      gatedCommunity: layout.gated,
      units: plots.map((p) => ({
        id: p.id,
        number: p.number,
        area: p.area,
        dimensions: p.dimensions,
        facing: p.facing,
        corner: p.corner,
        price: p.priceLakhs,
        priceLabel: p.priceLabel,
        availability: publicAvailability(p.status),
      })),
      documents: layout.documents,
    },
  };
}
