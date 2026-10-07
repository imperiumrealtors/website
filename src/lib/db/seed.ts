import type { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { SEED_LAYOUTS, SEED_PROPERTIES } from '../data';
import { hashPassword } from '../auth/password';
import { ACTIVE_CATEGORIES } from '../config';
import { formatLakhs } from '../validators';

const now = () => new Date().toISOString();

function seedCatalogue(db: DatabaseSync) {
  const count = (db.prepare('SELECT COUNT(*) AS n FROM layouts').get() as { n: number }).n;
  if (count > 0) return;

  const insertLayout = db.prepare(`
    INSERT INTO layouts (
      id, slug, name, builder, location, corridor, city, address, lat, lng, status, possession,
      description, price_lakhs, price_label, price_per_sqft, land_area, land_use, approvals, approval_id,
      road_width, facing_options, appreciation, soil, water_source, loan_eligible, gated, highlights,
      infrastructure, photos, video_url, nearby, price_breakdown, documents, featured, new_launch, active,
      created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insertPlot = db.prepare(`
    INSERT INTO plots (id, layout_id, number, area, dimensions, facing, corner, price_lakhs, price_label, status, notes, created_at, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const ts = now();
  for (const p of SEED_PROPERTIES) {
    if (!ACTIVE_CATEGORIES.includes(p.type) || !p.land) continue;
    const land = p.land;
    const layoutId = randomUUID();
    const landArea = SEED_LAYOUTS.find((l) => l.name === p.title)?.landArea
      ?? `${(land.totalPlots * 1400 / 43560).toFixed(1)} acres`;

    insertLayout.run(
      layoutId, p.slug, p.title, p.builder, p.location, p.corridor, p.city, p.address,
      p.coordinates.lat, p.coordinates.lng, p.status, p.possession, p.description,
      p.price, p.priceLabel, land.pricePerSqft, landArea, land.use,
      JSON.stringify(land.approvals), land.approvalId, land.roadWidth,
      JSON.stringify(land.facingOptions), land.appreciation, land.soil, land.waterSource,
      land.loanEligible ? 1 : 0, land.gatedCommunity ? 1 : 0,
      JSON.stringify(p.highlights), JSON.stringify(p.infrastructure.map((i) => i.id)),
      JSON.stringify(p.photos), p.videoUrl ?? null, JSON.stringify(p.nearbyPlaces),
      JSON.stringify(p.priceBreakdown), JSON.stringify(land.documents),
      p.featured ? 1 : 0, p.newLaunch ? 1 : 0, 1, p.createdAt, ts,
    );

    // The catalogue lists a handful of representative plots; pad each layout so
    // availability counts match the published totals.
    const seen = new Set<string>();
    for (const u of land.units) {
      seen.add(u.number);
      const status = u.availability === 'Sold' ? 'Sold' : u.availability === 'On Hold' ? 'Reserved' : 'Available';
      insertPlot.run(randomUUID(), layoutId, u.number, u.area, u.dimensions, u.facing, u.corner ? 1 : 0, u.price, u.priceLabel, status, '', ts, ts);
    }
    const sold = land.totalPlots - land.availablePlots - land.units.filter((u) => u.availability !== 'Available').length;
    let i = 1;
    let padded = 0;
    const toPad = land.totalPlots - land.units.length;
    while (padded < toPad) {
      const number = `P-${String(i).padStart(3, '0')}`;
      i++;
      if (seen.has(number)) continue;
      const status = padded < sold ? 'Sold' : 'Available';
      const area = p.area;
      const priceLakhs = Math.round((area * land.pricePerSqft) / 100000 * 10) / 10;
      insertPlot.run(randomUUID(), layoutId, number, area, '', land.facingOptions[padded % land.facingOptions.length], 0, priceLakhs, formatLakhs(priceLakhs), status, '', ts, ts);
      padded++;
    }
  }
}

function seedAdmin(db: DatabaseSync) {
  const count = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
  if (count > 0) return;

  const email = process.env.IMPERIUM_ADMIN_EMAIL ?? 'admin@imperiumrealtors.com';
  let password = process.env.IMPERIUM_ADMIN_PASSWORD;
  let generated = false;
  if (!password) {
    password = `Vk-${randomBytes(9).toString('base64url')}1A`;
    generated = true;
  }

  const ts = now();
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'admin', 'active', ?, ?)
  `).run(randomUUID(), 'Administrator', email, hashPassword(password), ts, ts);

  if (generated) {
    const dir = process.env.IMPERIUM_DATA_DIR ?? path.join(process.cwd(), 'data');
    const file = path.join(dir, 'initial-admin-credentials.txt');
    fs.writeFileSync(file, `Imperium Realtors admin portal\n\nEmail:    ${email}\nPassword: ${password}\n\nChange this password after first login, then delete this file.\n`, { mode: 0o600 });
    console.log(`\n[imperium-realtors] Initial admin account created for ${email}. Password written to ${file}\n`);
  }
}

function seedSettings(db: DatabaseSync) {
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)');
  const ts = now();
  insert.run('company_name', 'Imperium Realtors', ts);
  insert.run('support_phone', '+91 79041 95484', ts);
  insert.run('support_email', 'imperiumrealtorsinfo@gmail.com', ts);
  insert.run('lead_auto_assign', 'off', ts);
  insert.run('visit_slots', '09:00 AM,11:00 AM,02:00 PM,04:00 PM', ts);
}

export function seedDatabase(db: DatabaseSync) {
  db.exec('BEGIN');
  try {
    seedCatalogue(db);
    seedAdmin(db);
    seedSettings(db);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
