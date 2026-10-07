import SavedPlots from '@/components/public/SavedPlots';
import { getPublicProperties } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  return <SavedPlots properties={await getPublicProperties()} />;
}
