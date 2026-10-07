import { all, newId, nowIso, one, parseJson, run, toBool, transaction, type Arg, type Row } from './index';
import { INFRA, FALLBACK_PHOTO } from '../data';
import type {
  Approval, Facing, LandDocument, LandUse, LayoutRecord, NearbyPlace, PlotStatus, PriceItem, Property, PlotUnit,
} from '../types';

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

export async function listLayouts(opts: { includeInactive?: boolean; search?: string } = {}): Promise<LayoutSummary[]> {
  const where: string[] = [];
  const params: string[] = [];
  if (!opts.includeInactive) where.push('l.active = 1');
  if (opts.search) {
    where.push('(l.name LIKE ? OR l.location LIKE ? OR l.corridor LIKE ?)');
    const q = `%${opts.search}%`;
    params.push(q, q, q);
  }
  const sql = `${SUMMARY_SQL} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY l.featured DESC, l.created_at DESC`;
  return (await all(sql, ...params)).map(rowToSummary);
}

export async function getLayout(id: string): Promise<LayoutSummary | null> {
  const row = await one(`${SUMMARY_SQL} WHERE l.id = ?`, id);
  return row ? rowToSummary(row) : null;
}

export async function getLayoutBySlug(slug: string, includeInactive = false): Promise<LayoutSummary | null> {
  const row = await one(`${SUMMARY_SQL} WHERE l.slug = ? ${includeInactive ? '' : 'AND l.active = 1'}`, slug);
  return row ? rowToSummary(row) : null;
}

export async function slugExists(slug: string, exceptId?: string): Promise<boolean> {
  return Boolean(await one('SELECT id FROM layouts WHERE slug = ? AND id != ?', slug, exceptId ?? ''));
}

export type LayoutInput = Omit<LayoutRecord, 'id' | 'createdAt' | 'updatedAt'>;

const COLUMNS = [
  'slug', 'name', 'builder', 'location', 'corridor', 'city', 'address', 'lat', 'lng', 'status', 'possession',
  'description', 'price_lakhs', 'price_label', 'price_per_sqft', 'land_area', 'land_use', 'approvals', 'approval_id',
  'road_width', 'facing_options', 'appreciation', 'soil', 'water_source', 'loan_eligible', 'gated', 'highlights',
  'infrastructure', 'photos', 'video_url', 'nearby', 'price_breakdown', 'documents', 'featured', 'new_launch', 'active',
] as const;

function inputToValues(input: LayoutInput): Arg[] {
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

export async function createLayout(input: LayoutInput): Promise<LayoutSummary> {
  const id = newId();
  const ts = nowIso();
  const cols = [...COLUMNS, 'id', 'created_at', 'updated_at'];
  await run(`INSERT INTO layouts (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`, ...inputToValues(input), id, ts, ts);
  return (await getLayout(id))!;
}

export async function updateLayout(id: string, input: LayoutInput): Promise<LayoutSummary | null> {
  const sets = COLUMNS.map((c) => `${c} = ?`).join(', ');
  const changes = await run(`UPDATE layouts SET ${sets}, updated_at = ? WHERE id = ?`, ...inputToValues(input), nowIso(), id);
  return changes ? getLayout(id) : null;
}

export async function setLayoutActive(id: string, active: boolean): Promise<boolean> {
  return (await run('UPDATE layouts SET active = ?, updated_at = ? WHERE id = ?', active ? 1 : 0, nowIso(), id)) > 0;
}

// Foreign-key actions are applied explicitly: hosted libSQL connections do not reliably enforce them.
export async function deleteLayout(id: string): Promise<boolean> {
  const results = await transaction([
    { sql: 'UPDATE leads SET plot_id = NULL WHERE plot_id IN (SELECT id FROM plots WHERE layout_id = ?)', args: [id] },
    { sql: 'UPDATE leads SET layout_id = NULL WHERE layout_id = ?', args: [id] },
    { sql: 'UPDATE site_visits SET layout_id = NULL WHERE layout_id = ?', args: [id] },
    { sql: 'UPDATE media SET layout_id = NULL WHERE layout_id = ?', args: [id] },
    { sql: 'DELETE FROM plots WHERE layout_id = ?', args: [id] },
    { sql: 'DELETE FROM layouts WHERE id = ?', args: [id] },
  ]);
  return results[results.length - 1] > 0;
}

export async function recentlyUpdatedLayouts(limit = 5): Promise<LayoutSummary[]> {
  return (await all(`${SUMMARY_SQL} ORDER BY l.updated_at DESC LIMIT ?`, limit)).map(rowToSummary);
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
