import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { createPlot, listPlots, plotNumberExists, type PlotInput } from '@/lib/db/plots';
import { getLayout } from '@/lib/db/layouts';
import { validatePlot } from '@/lib/validators';
import { PLOT_STATUSES, type PlotStatus } from '@/lib/types';

export const GET = handle(async (req: NextRequest) => {
  requireApiPermission(req, 'plots:read');
  const sp = req.nextUrl.searchParams;
  const status = sp.get('status') as PlotStatus | null;
  return ok(listPlots({
    layoutId: sp.get('layoutId') ?? undefined,
    status: status && PLOT_STATUSES.includes(status) ? status : undefined,
    search: sp.get('q') ?? undefined,
  }));
});

export const POST = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'plots:write');
  const input = validatePlot(await readJson(req));
  const layoutId = input.layoutId as string;
  if (!getLayout(layoutId)) throw new HttpError(422, 'Please fix the highlighted fields.', { layoutId: 'Layout not found.' });
  if (plotNumberExists(layoutId, input.number as string)) throw new HttpError(422, 'Please fix the highlighted fields.', { number: 'This plot number already exists in the layout.' });
  const plot = createPlot({
    dimensions: '', facing: 'East', corner: false, status: 'Available', notes: '', priceLabel: '',
    ...input,
  } as PlotInput);
  audit(user, 'plot.create', 'plot', plot.id, { layoutId: plot.layoutId, number: plot.number }, clientIp(req));
  return ok(plot, { status: 201 });
});
