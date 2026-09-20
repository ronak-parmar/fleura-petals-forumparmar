#!/usr/bin/env bash
# Fleuréa Petals — local dev launcher.
# Starts whichever of these exist: local PostgreSQL, the ASP.NET Core backend,
# and the Next.js frontend — then opens the site in the default browser.
# Safe to re-run: skips anything already running, and skips pieces that
# haven't been built yet (backend, local Postgres) with a clear message.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="/c/Program Files/nodejs:$PATH"   # this machine's nvm4w Node install on PATH is broken

FE_PORT="${FE_PORT:-3100}"
BE_PORT="${BE_PORT:-5080}"
PG_PORT="${PG_PORT:-55432}"
PG_DIR="$ROOT/database/pg"

PIDS=()
cleanup() {
  echo ""
  echo "Shutting down services started by this script…"
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

port_open() {
  # True if something is already listening on $1 (Windows-friendly check).
  curl -s -o /dev/null --max-time 1 "http://localhost:$1" 2>/dev/null && return 0
  (echo > "/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1
}

echo "== Fleuréa Petals — dev launcher =="
echo ""

# ---------------------------------------------------------------------------
# 1. PostgreSQL (portable local cluster, if one has been set up)
# ---------------------------------------------------------------------------
if [ -x "$PG_DIR/bin/pg_ctl" ]; then
  if "$PG_DIR/bin/pg_ctl" -D "$PG_DIR/data" status >/dev/null 2>&1; then
    echo "[postgres]  already running (port $PG_PORT)"
  else
    echo "[postgres]  starting on port $PG_PORT…"
    "$PG_DIR/bin/pg_ctl" -D "$PG_DIR/data" -l "$PG_DIR/log.txt" -o "-p $PG_PORT" start \
      && echo "[postgres]  started" \
      || echo "[postgres]  FAILED to start — see database/pg/log.txt"
  fi
else
  echo "[postgres]  not set up yet — skipping (see database/README.md). Backend needs this to run for real."
fi

# ---------------------------------------------------------------------------
# 2. Backend — ASP.NET Core Web API (once it exists)
# ---------------------------------------------------------------------------
BACKEND_PROJECT="$ROOT/backend/src/Fleurea.Api/Fleurea.Api.csproj"
if [ -f "$BACKEND_PROJECT" ]; then
  if port_open "$BE_PORT"; then
    echo "[backend]   already running (http://localhost:$BE_PORT)"
  else
    echo "[backend]   starting on http://localhost:$BE_PORT …"
    (cd "$(dirname "$BACKEND_PROJECT")" && ASPNETCORE_URLS="http://localhost:$BE_PORT" dotnet run) \
      > "$ROOT/.claude/tmp/backend.log" 2>&1 &
    PIDS+=($!)
  fi
else
  echo "[backend]   not built yet — skipping. Frontend will run against its mock data layer."
fi

# ---------------------------------------------------------------------------
# 3. Frontend — Next.js
# ---------------------------------------------------------------------------
if port_open "$FE_PORT"; then
  echo "[frontend]  already running (http://localhost:$FE_PORT)"
else
  echo "[frontend]  starting on http://localhost:$FE_PORT …"
  (cd "$ROOT/app" && npx next dev -p "$FE_PORT") > "$ROOT/.claude/tmp/frontend.log" 2>&1 &
  PIDS+=($!)
fi

# ---------------------------------------------------------------------------
# 4. Wait for the frontend, then open the browser
# ---------------------------------------------------------------------------
echo ""
echo -n "Waiting for the frontend to be ready"
for _ in $(seq 1 60); do
  port_open "$FE_PORT" && break
  echo -n "."
  sleep 1
done
echo ""

URL="http://localhost:$FE_PORT"
( cmd.exe /c start "" "$URL" >/dev/null 2>&1 ) \
  || ( explorer.exe "$URL" >/dev/null 2>&1 ) \
  || echo "(Couldn't auto-open a browser — open $URL manually.)"

echo ""
echo "Fleuréa Petals is running:"
echo "  Frontend:  $URL"
[ -f "$BACKEND_PROJECT" ] && echo "  Backend:   http://localhost:$BE_PORT/swagger"
[ -x "$PG_DIR/bin/pg_ctl" ] && echo "  Postgres:  localhost:$PG_PORT"
echo ""
echo "Press Ctrl+C to stop everything this script started."
wait
