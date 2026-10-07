# Imperium Realtors — plot marketplace & admin portal

Next.js 16 site for a Chennai land and plot specialist, with a secure admin portal for
managing layouts, plot availability, leads, site visits, media and staff accounts.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Requires Node.js 20.9+.

The database is [libSQL](https://github.com/tursodatabase/libsql) (SQLite-compatible). Locally it
is a file at `data/imperium-realtors.sqlite`; in production it is a hosted Turso database. The same
code runs against both — only the connection URL changes. Uploaded media is stored in the database
too, so nothing depends on the server's disk.

On first run the app creates the schema, seeds it with the launch catalogue, and creates the first
administrator. Locally, if `IMPERIUM_ADMIN_PASSWORD` is not set, a random password is generated and
written to **`data/initial-admin-credentials.txt`** — sign in with it at `/admin/login`, change it
under Settings, then delete the file. In production the password must be set explicitly.

| Variable                  | Purpose                                         | Default                          |
| ------------------------- | ----------------------------------------------- | -------------------------------- |
| `TURSO_DATABASE_URL`      | Hosted database URL (`libsql://…`)              | local file (dev only)            |
| `TURSO_AUTH_TOKEN`        | Auth token for the hosted database              | —                                |
| `IMPERIUM_ADMIN_EMAIL`    | Email for the seeded administrator              | `admin@imperiumrealtors.com`     |
| `IMPERIUM_ADMIN_PASSWORD` | Password for the seeded administrator           | generated locally; required in production |
| `IMPERIUM_DATA_DIR`       | Local database directory (self-hosting on a persistent disk) | `./data`            |

`data/` is git-ignored.

## Deploying (Render + Turso, free tiers)

Render runs the Node server and redeploys on every push to `main`; Turso holds the data, so leads,
plots and uploads survive Render's restarts and redeploys.

1. **Create the database** at [turso.tech](https://turso.tech) (sign in with GitHub). Create a
   database in the region closest to your users (e.g. Mumbai), then copy its **URL**
   (`libsql://…`) and create an **auth token**.
2. **Create the web service** at [render.com](https://render.com) (sign in with GitHub):
   *New → Blueprint*, pick this repository. Render reads `render.yaml` and asks for:
   - `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from step 1
   - `IMPERIUM_ADMIN_EMAIL` and `IMPERIUM_ADMIN_PASSWORD` for the first admin login
     (at least 10 characters with upper case, lower case and a number)
3. Deploy. The first request creates the tables and seeds the catalogue. Sign in at
   `/admin/login` and change the password under Settings.

Render's free tier sleeps after 15 minutes without traffic; the next visit takes about a minute to
wake it. Upgrading the Render plan removes that, with no code changes.

## Structure

```text
src/
├── app/
│   ├── (public)/            # Website: /, /plots, /plots/[slug], /layouts, /why-land, /contact, /book-visit, /compare, /saved
│   ├── admin/
│   │   ├── login/           # Sign-in (only page under /admin without a session)
│   │   └── (portal)/        # Dashboard, layouts, plots, leads, site-visits, media, users, settings
│   └── api/
│       ├── auth/            # login, logout, me
│       ├── admin/           # Protected CRUD endpoints (session + role checked on every request)
│       ├── public/          # Website enquiry and site-visit forms
│       └── media/[id]       # Serves uploads (public files open; private need a session)
├── components/
│   ├── public/              # Website page components
│   └── admin/               # Portal shell, tables, forms
├── lib/
│   ├── db/                  # SQLite schema, seed, and repositories
│   ├── auth/                # Password hashing, sessions, permissions, route guards
│   ├── public-data.ts       # DB → website models
│   └── validators.ts        # Server-side input validation
└── proxy.ts                 # Redirects sessionless /admin/* requests to /admin/login
```

## Roles

| Role       | Access                                                        |
| ---------- | ------------------------------------------------------------- |
| `admin`    | Everything, including users, settings and the audit log       |
| `manager`  | Layouts, plots, media, leads, site visits                     |
| `sales`    | Leads and site visits (read-only view of layouts and plots)   |
| `customer` | Public website only — cannot sign in to the portal            |

Permissions are defined once in `src/lib/auth/permissions.ts`. The sidebar hides sections a
role cannot use, but every page and API route re-checks the session and permission on the
server — hiding a link is never the security boundary.

## How the website stays in sync

Public pages read from the database on every request. Changing a plot's status, a layout's
price, or hiding a layout in the portal is reflected on the website immediately, with no
code changes. Website enquiry and site-visit forms create leads and visits in the CRM.

Apartment and villa records are kept in the seed data but hidden; add the type to
`ACTIVE_CATEGORIES` in `src/lib/config.ts` to bring a category back.

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```
