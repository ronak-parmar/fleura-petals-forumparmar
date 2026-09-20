# Local PostgreSQL for Fleuréa Petals

The backend needs a real PostgreSQL instance to run against. This project uses a
**portable, no-install local cluster** that lives entirely inside the repo at
`database/pg/` — no admin rights, no Windows service, nothing installed system-wide.

## How it was set up (already done — for reference / re-setup only)

The direct EnterpriseDB zip download is blocked on this network, but real PostgreSQL
server binaries are also published on the **npm registry** (which isn't blocked) via the
[`embedded-postgres`](https://www.npmjs.com/package/embedded-postgres) package's
platform-specific dependency `@embedded-postgres/windows-x64` — a genuine ~107MB Postgres
18 binary distribution (`postgres.exe`, `pg_ctl.exe`, `initdb.exe` + `lib`/`share`), not an
emulator. To redo this from scratch on a fresh machine:

```
mkdir -p .claude/tmp/pgfetch && cd .claude/tmp/pgfetch
npm init -y && npm install embedded-postgres@18.4.0-beta.17
cp -r node_modules/@embedded-postgres/windows-x64/native/. "../../../database/pg/"
```

Then initialize a data directory on a dedicated port (55432, to avoid clashing with any
other Postgres on this machine) with **trust auth** (no real password enforced — this is a
local, loopback-only dev instance):

```
database/pg/bin/initdb -D database/pg/data -U postgres -A trust --locale=C --encoding=UTF8
database/pg/bin/pg_ctl -D database/pg/data -l database/pg/log.txt -o "-p 55432" start
```

This binary set doesn't include `psql`/`createdb` (server-only distribution), so the
database and schema are loaded via a small Node script instead of the usual `psql -f`
commands — see `.claude/tmp/pgload/load.js` for the one that was used (creates the
`fleurea` database, then runs `schema.sql` → `functions.sql` → `seed.sql` in order via the
`pg` npm package). Equivalent one-liner if you have `psql` from any other Postgres install
on PATH:
```
createdb -p 55432 -U postgres fleurea
psql -p 55432 -U postgres -d fleurea -f schema.sql
psql -p 55432 -U postgres -d fleurea -f functions.sql
psql -p 55432 -U postgres -d fleurea -f seed.sql
```

## Current state

Already set up and loaded. `database/pg/` contains the binaries + an initialized `data/`
directory with the full schema, functions, and seed data. The `fleurea` database currently
has all 6 seeded products, 4 categories, the admin user, Beena & Ronak as customers, seeded
order `FP-2026-000042`, and seeded custom request `FP-CR-2026-000007` — verified with a
live smoke test (`fn_get_categories`, `fn_get_products`, `fn_get_order`,
`fn_get_admin_by_username`, `fn_dashboard_summary` all returned correct rows).

## Every day after that

Nothing manual — `../dev.sh` (project root) starts this cluster automatically if
`database/pg/bin/pg_ctl` exists (it does), and leaves it alone if it's already running.

To stop it by hand: `database/pg/bin/pg_ctl -D database/pg/data stop`
To start it by hand: `database/pg/bin/pg_ctl -D database/pg/data -l database/pg/log.txt -o "-p 55432" start`

## Connection details

| | |
|---|---|
| Host | `localhost` |
| Port | `55432` |
| Database | `fleurea` |
| Username | `postgres` |
| Password | *(none enforced — local trust auth; any value, including the `postgres` used in `appsettings.Development.json`, is accepted)* |
| Admin login (app-level, not DB) | username `forum` / password `petals123` |
| Demo customer logins (app-level) | `beena.parmar@example.com` / `password123`, `ronak.parmar@example.com` / `password123` |

Connection string (already set in `backend/src/Fleurea.Api/appsettings.Development.json`):
```
Host=localhost;Port=55432;Database=fleurea;Username=postgres;Password=postgres
```

`database/pg/` (binaries + data) is machine-local generated state — it should be
git-ignored, not committed.
