import 'server-only';
import { getLayoutBySlug, layoutToProperty, listLayouts } from './db/layouts';
import { listPlotsForLayout } from './db/plots';
import type { Layout, Property } from './types';

/** Server-only reads that shape DB rows into the models the public components already render. */

export function getPublicProperties(): Property[] {
  return listLayouts().map((l) => layoutToProperty(l, listPlotsForLayout(l.id)));
}

export function getPublicPropertyBySlug(slug: string): Property | null {
  const layout = getLayoutBySlug(slug);
  return layout ? layoutToProperty(layout, listPlotsForLayout(layout.id)) : null;
}

export function getPublicLayouts(): Layout[] {
  return listLayouts().map((l) => ({
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

export function getPublicStats() {
  const props = getPublicProperties();
  return {
    layouts: props.length,
    availablePlots: props.reduce((s, p) => s + (p.land?.availablePlots ?? 0), 0),
  };
}
