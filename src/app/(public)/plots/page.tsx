import { Suspense } from 'react';
import PlotsBrowser from '@/components/public/PlotsBrowser';
import { getPublicProperties } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export default function PlotsPage() {
  const plots = getPublicProperties();
  return (
    <Suspense fallback={<div style={{ padding: '200px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading plots…</div>}>
      <PlotsBrowser plots={plots} />
    </Suspense>
  );
}
