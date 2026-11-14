#!/usr/bin/env sh
set -eu

migration_log="${TMPDIR:-/tmp}/studypal-migration.log"
if ! alembic upgrade head >"$migration_log" 2>&1; then
  echo "StudyPal startup failed: database migration did not complete. Verify STUDYPAL_DATABASE_URL and migration logs." >&2
  if [ "${MIGRATION_DEBUG:-0}" = "1" ]; then
    cat "$migration_log" >&2
  fi
  exit 1
fi
rm -f "$migration_log"

exec uvicorn app.main:app --host "${HOST:-0.0.0.0}" --port "${PORT:-8000}"
