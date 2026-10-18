# @quatrain/db-migrator

Agnostic, idempotent, containerized database migration runner for PostgreSQL (Vanilla, Supabase, Neon, AWS RDS, Cloud SQL) and modern SQL database engines.

Part of the **Quatrain CoreApps** ecosystem.

---

## 🚀 Key Features

1. **Agnostic Architecture**:
   - Built on a decoupled adapter interface (`DatabaseMigrationAdapterInterface`).
   - Supports all PostgreSQL engines immediately (`Vanilla Postgres`, `Supabase`, `Neon`, `AWS RDS`, `Cloud SQL`).
   - Extensible design prepared for additional dialects (`MySQL`, `SQLite`) via pluggable adapters.

2. **Idempotent & Resilient Two-Tier Execution**:
   - **Tier 1 (Fast-Path)**: Executes migration files in a single pass.
   - **Tier 2 (Fallback Recovery)**: If non-fatal errors occur (e.g., pre-existing tables, columns, indexes, types, or `cannot run inside a transaction block`), the migrator automatically rolls back the aborted transaction and executes statement-by-statement via a robust SQL tokenizer, safely ignoring duplicate artifacts and recording success.

3. **Universal Tracking Schema & PostgREST Support**:
   - Fully configurable tracking schema and table (defaults to `public.schema_migrations`, or `supabase_migrations.schema_migrations`).
   - Automatic PostgREST schema cache notification (`NOTIFY pgrst, 'reload schema'`).

4. **Production-Ready & Kubernetes-Friendly**:
   - Built as an unprivileged, non-root OCI container (`USER bun`).
   - Fast startup (< 50ms) on `oven/bun:alpine`.
   - Automatic connection retry loop with configurable backoff for container cold-starts.
   - Fail-fast environment validation.
   - Dry-run mode (`DRY_RUN=true`) for CI/CD pre-flight checks.

---

## 📦 File Naming Convention

Migration files placed in `MIGRATIONS_DIR` (default: `/app/migrations`) must follow chronological alphanumeric naming:

```text
migrations/
  ├── 20261018000000_create_lora_testers.sql
  ├── 20261018000001_create_plot_connectivity_tests.sql
  └── 20261018000002_add_indexes.sql
```

The version prefix (e.g. `20261018000000`) is tracked in the migration history table.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DB_DIALECT` | `postgres` | Database dialect (`postgres`, `supabase`). |
| `DATABASE_URL` | - | Standard database connection URI (`postgresql://user:pass@host:5432/db`). |
| `PG_HOST` / `PGHOST` | `localhost` | Database host. |
| `PG_PORT` / `PGPORT` | `5432` | Database port. |
| `PG_USER` / `PGUSER` | `postgres` | Database user. |
| `PG_PASSWORD` / `PG_PWD` | `""` | Database password. |
| `PG_DB` / `PGDATABASE` | `postgres` | Database name. |
| `PG_SSL` | `false` | Enable TLS/SSL connection (auto-enabled for Supabase/Neon cloud hosts). |
| `MIGRATIONS_DIR` | `/app/migrations` | Directory containing versioned `.sql` files. |
| `TRACKING_SCHEMA` | `public` | Schema holding migration history table (`supabase_migrations` for Supabase). |
| `TRACKING_TABLE` | `schema_migrations`| Migration history table name. |
| `POSTGREST_RELOAD_NOTIFY`| `false` | Emit `NOTIFY pgrst, 'reload schema';` upon migration completion. |
| `DRY_RUN` | `false` | Inspect and validate pending migrations without executing changes. |
| `PG_CONNECT_MAX_RETRIES` | `30` | Max connection retries on start. |
| `PG_CONNECT_RETRY_INTERVAL_MS`| `2000` | Delay between connection retries (in ms). |

---

## 🛠️ Local Development & Testing

```bash
# Run unit tests
bun test

# Run in watch mode
bun run dev

# Build standalone distribution bundle
bun run build
```
