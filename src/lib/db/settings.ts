import { getDb, nowIso } from './index';

export const SETTING_KEYS = ['company_name', 'support_phone', 'support_email', 'lead_auto_assign', 'visit_slots'] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];

export function getSettings(): Record<SettingKey, string> {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as { key: SettingKey; value: string }[];
  const out = Object.fromEntries(SETTING_KEYS.map((k) => [k, ''])) as Record<SettingKey, string>;
  rows.forEach((r) => { if (SETTING_KEYS.includes(r.key)) out[r.key] = r.value; });
  return out;
}

export function saveSettings(values: Partial<Record<SettingKey, string>>) {
  const stmt = getDb().prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at');
  const ts = nowIso();
  for (const key of SETTING_KEYS) {
    if (values[key] !== undefined) stmt.run(key, values[key] as string, ts);
  }
}
