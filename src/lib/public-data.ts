import 'server-only';
import { getLayoutBySlug, layoutToProperty, listLayouts } from './db/layouts';
import { listPlotsForLayout, listPlotsForLayouts } from './db/plots';
import type { Layout, Property } from './types';

/** Server-only reads that shape DB rows into the models the public components already render. */

export async function getPublicProperties(): Promise<Property[]> {
  const layouts = await listLayouts();
  const plots = await listPlotsForLayouts(layouts.map((l) => l.id));
  return layouts.map((l) => layoutToProperty(l, plots.get(l.id) ?? []));
}

export async function getPublicPropertyBySlug(slug: string): Promise<Property | null> {
  const layout = await getLayoutBySlug(slug);
  return layout ? layoutToProperty(layout, await listPlotsForLayout(layout.id)) : null;
}

export async function getPublicLayouts(): Promise<Layout[]> {
  return (await listLayouts()).map((l) => ({
    id: l.id,
    name: l.name,
    builder: l.builder,
    location: l.location,
    category: 'Plot',
    status: l.availablePlots === 0 ? 'Fully Sold' : l.status === 'New Launch' ? 'New Launch' : 'Development in Progress',
    totalPlots: l.totalPlots,
    landArea: l.landArea,
    startingPrice: l.priceLabel,
    completionDate: l.possession,
    description: l.description,
    coverImage: l.photos[0] ?? '',
    features: [
      l.approvals.join(' & '),
      `${l.totalPlots} plots`,
      l.roadWidth,
      l.gated ? 'Gated with security' : 'Open layout',
    ].filter(Boolean),
  }));
}

export async function getPublicStats() {
  const layouts = await listLayouts();
  return {
    layouts: layouts.length,
    availablePlots: layouts.reduce((s, l) => s + l.availablePlots, 0),
  };
}
