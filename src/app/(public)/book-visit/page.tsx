import { Suspense } from 'react';
import BookVisitFlow from '@/components/public/BookVisitFlow';
import { getPublicProperties } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export default function BookVisitPage() {
  return (
    <Suspense fallback={<div style={{ padding: '200px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>}>
      <BookVisitFlow plots={getPublicProperties()} />
    </Suspense>
  );
}
