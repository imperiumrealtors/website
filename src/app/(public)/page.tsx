import HomePage from '@/components/public/HomePage';
import { getPublicProperties } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export default function Page() {
  const properties = getPublicProperties();
  return (
    <HomePage
      featured={properties.filter((p) => p.featured).slice(0, 3)}
      launches={properties.filter((p) => p.newLaunch).slice(0, 2)}
      layoutCount={properties.length}
      availablePlots={properties.reduce((s, p) => s + (p.land?.availablePlots ?? 0), 0)}
    />
  );
}
