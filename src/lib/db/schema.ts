export const SCHEMA_VERSION = 1;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','manager','sales','customer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS layouts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  builder TEXT NOT NULL DEFAULT 'Imperium Realtors',
  location TEXT NOT NULL,
  corridor TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL NOT NULL DEFAULT 0,
  lng REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Ready to Register','Development in Progress','New Launch')),
  possession TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price_lakhs REAL NOT NULL DEFAULT 0,
  price_label TEXT NOT NULL DEFAULT '',
  price_per_sqft INTEGER NOT NULL DEFAULT 0,
  land_area TEXT NOT NULL DEFAULT '',
  land_use TEXT NOT NULL DEFAULT 'Residential' CHECK (land_use IN ('Residential','Commercial','Farmland','Industrial')),
  approvals TEXT NOT NULL DEFAULT '[]',
  approval_id TEXT NOT NULL DEFAULT '',
  road_width TEXT NOT NULL DEFAULT '',
  facing_options TEXT NOT NULL DEFAULT '[]',
  appreciation TEXT NOT NULL DEFAULT '',
  soil TEXT NOT NULL DEFAULT '',
  water_source TEXT NOT NULL DEFAULT '',
  loan_eligible INTEGER NOT NULL DEFAULT 1,
  gated INTEGER NOT NULL DEFAULT 1,
  highlights TEXT NOT NULL DEFAULT '[]',
  infrastructure TEXT NOT NULL DEFAULT '[]',
  photos TEXT NOT NULL DEFAULT '[]',
  video_url TEXT,
  nearby TEXT NOT NULL DEFAULT '[]',
  price_breakdown TEXT NOT NULL DEFAULT '[]',
  documents TEXT NOT NULL DEFAULT '[]',
  featured INTEGER NOT NULL DEFAULT 0,
  new_launch INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plots (
  id TEXT PRIMARY KEY,
  layout_id TEXT NOT NULL REFERENCES layouts(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  area INTEGER NOT NULL,
  dimensions TEXT NOT NULL DEFAULT '',
  facing TEXT NOT NULL DEFAULT 'East',
  corner INTEGER NOT NULL DEFAULT 0,
  price_lakhs REAL NOT NULL DEFAULT 0,
  price_label TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Reserved','Sold','Blocked')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (layout_id, number)
);
CREATE INDEX IF NOT EXISTS idx_plots_layout ON plots(layout_id);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  layout_id TEXT REFERENCES layouts(id) ON DELETE SET NULL,
  plot_id TEXT REFERENCES plots(id) ON DELETE SET NULL,
  budget TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'Website',
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New','Contacted','Follow-up','Site Visit Scheduled','Negotiation','Converted','Lost')),
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);

CREATE TABLE IF NOT EXISTS site_visits (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  layout_id TEXT REFERENCES layouts(id) ON DELETE SET NULL,
  preferred_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  visitors INTEGER NOT NULL DEFAULT 1,
  pickup INTEGER NOT NULL DEFAULT 0,
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Requested' CHECK (status IN ('Requested','Confirmed','Completed','Cancelled','Rescheduled')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_visits_date ON site_visits(preferred_date);
CREATE INDEX IF NOT EXISTS idx_visits_status ON site_visits(status);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  layout_id TEXT REFERENCES layouts(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image','video','brochure','document')),
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_name TEXT NOT NULL UNIQUE,
  is_public INTEGER NOT NULL DEFAULT 0,
  uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_layout ON media(layout_id);

CREATE TABLE IF NOT EXISTS media_files (
  media_id TEXT PRIMARY KEY REFERENCES media(id) ON DELETE CASCADE,
  data BLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  details TEXT NOT NULL DEFAULT '{}',
  ip TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;
