import { Suspense } from 'react';
import ComparePlots from '@/components/public/ComparePlots';
import { getPublicProperties } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export default function ComparePage() {
  return (
    <Suspense fallback={<div style={{ padding: '200px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading comparison…</div>}>
      <ComparePlots properties={getPublicProperties()} />
    </Suspense>
  );
}
