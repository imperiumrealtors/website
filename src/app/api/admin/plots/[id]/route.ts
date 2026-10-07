import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { deletePlot, getPlot, plotNumberExists, updatePlot } from '@/lib/db/plots';
import { validatePlot } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'plots:write');
  const { id } = await params;
  const existing = getPlot(id);
  if (!existing) throw new HttpError(404, 'Plot not found.');
  const input = validatePlot(await readJson(req), true);
  const layoutId = input.layoutId ?? existing.layoutId;
  const number = input.number ?? existing.number;
  if (plotNumberExists(layoutId, number, id)) throw new HttpError(422, 'Please fix the highlighted fields.', { number: 'This plot number already exists in the layout.' });
  const plot = updatePlot(id, input);
  audit(user, 'plot.update', 'plot', id, { changes: Object.keys(input), status: plot?.status }, clientIp(req));
  return ok(plot);
});

export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  assertSameOrigin(req);
  const user = requireApiPermission(req, 'plots:write');
  const { id } = await params;
  const existing = getPlot(id);
  if (!existing) throw new HttpError(404, 'Plot not found.');
  deletePlot(id);
  audit(user, 'plot.delete', 'plot', id, { layoutId: existing.layoutId, number: existing.number }, clientIp(req));
  return ok(null);
});
