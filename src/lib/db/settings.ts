import { all, nowIso, transaction } from './index';

export const SETTING_KEYS = ['company_name', 'support_phone', 'support_email', 'lead_auto_assign', 'visit_slots'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const rows = await all<{ key: SettingKey; value: string }>('SELECT key, value FROM settings');
  const out = Object.fromEntries(SETTING_KEYS.map((k) => [k, ''])) as Record<SettingKey, string>;
  rows.forEach((r) => { if (SETTING_KEYS.includes(r.key)) out[r.key] = r.value; });
  return out;
}

export async function saveSettings(values: Partial<Record<SettingKey, string>>) {
  const ts = nowIso();
  const stmts = SETTING_KEYS.filter((key) => values[key] !== undefined).map((key) => ({
    sql: 'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    args: [key, values[key] as string, ts],
  }));
  if (stmts.length) await transaction(stmts);
}
