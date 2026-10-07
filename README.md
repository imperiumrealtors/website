# VK Realty — plot marketplace & admin portal

Next.js 16 site for a Chennai land and plot specialist, with a secure admin portal for
managing layouts, plot availability, leads, site visits, media and staff accounts.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Requires Node.js 22.5+ (the database uses Node's built-in `node:sqlite`; Node 24 recommended).

On first run the app creates `data/vk-realty.sqlite`, seeds it with the launch catalogue,
and creates the first administrator. If `VK_ADMIN_PASSWORD` is not set, a random password
is generated and written to **`data/initial-admin-credentials.txt`** — sign in with it at
`/admin/login`, change it under Settings, then delete the file.

Environment variables (all optional):

| Variable            | Purpose                                      | Default                     |
| ------------------- | -------------------------------------------- | --------------------------- |
| `VK_ADMIN_EMAIL`    | Email for the seeded administrator           | `admin@vkrealty.in`         |
| `VK_ADMIN_PASSWORD` | Password for the seeded administrator        | generated, written to file  |
| `VK_DATA_DIR`       | Where the database and uploads live          | `./data`                    |
| `VK_DATABASE_PATH`  | Explicit SQLite file path                    | `<VK_DATA_DIR>/vk-realty.sqlite` |

`data/` is git-ignored. Back it up like any database.

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
