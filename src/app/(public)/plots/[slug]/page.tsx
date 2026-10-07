import { notFound } from 'next/navigation';
import PlotDetail from '@/components/public/PlotDetail';
import { getPublicPropertyBySlug } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export default async function PlotDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plot = getPublicPropertyBySlug(slug);
  if (!plot) notFound();
  return <PlotDetail plot={plot} />;
}
