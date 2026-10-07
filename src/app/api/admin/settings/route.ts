import type { NextRequest } from 'next/server';
import { assertSameOrigin, audit, clientIp, handle, HttpError, ok, readJson, requireApiPermission } from '@/lib/auth/guard';
import { getSettings, saveSettings, SETTING_KEYS, type SettingKey } from '@/lib/db/settings';

export const GET = handle(async (req: NextRequest) => {
  await requireApiPermission(req, 'settings:read');
  return ok(await getSettings());
});

export const PUT = handle(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiPermission(req, 'settings:write');
  const body = await readJson<Record<string, unknown>>(req);
  const values: Partial<Record<SettingKey, string>> = {};
  const errors: Record<string, string> = {};
  for (const key of SETTING_KEYS) {
    if (body[key] === undefined) continue;
    const s = String(body[key]).trim();
    if (s.length > 300) errors[key] = 'Must be under 300 characters.';
    values[key] = s;
  }
  if (Object.keys(errors).length) throw new HttpError(422, 'Please fix the highlighted fields.', errors);
  await saveSettings(values);
  await audit(user, 'settings.update', 'settings', null, { keys: Object.keys(values) }, clientIp(req));
  return ok(await getSettings());
});
