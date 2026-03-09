# Database Layer

**Files:** `server/db/pool.js`, `server/db/migrate.js`

## Why PostgreSQL Over MongoDB

MongoDB was the original choice but introduced two scaling risks:

1. **Vendor lock-in** — Mongoose schemas, MongoDB Atlas pricing tiers, and the document model all create switching costs that grow with data volume. Postgres uses the standard SQL wire protocol. Any Postgres-compatible host (Neon, Supabase, RDS, Crunchy, self-hosted) works by changing `DATABASE_URL`.

2. **Vertical scaling friction** — This app is pure CRUD with no compute-heavy operations. MongoDB's scaling story centers on horizontal sharding, which adds operational complexity for an app that only needs bigger disk and RAM. Postgres scales vertically first (connection pooling → read replicas → partitioning → Citus sharding), matching this app's actual growth path.

**Why not an ORM?** Mongoose was removed and replaced with raw `pg` queries. ORMs hide the SQL, making it impossible to optimize queries without fighting the abstraction. Raw parameterized queries give full control over JOINs, partial indexes, and query plans. The trade-off is more boilerplate, but the app has ~6 tables — manageable.

## Connection Pool Design

```
max: 20 connections
idleTimeoutMillis: 30000
connectionTimeoutMillis: 5000
```

**Why 20?** Neon (recommended host) and most managed Postgres services cap at 20-100 connections. 20 is conservative — avoids hitting limits while allowing concurrent requests. If scaling beyond this, add PgBouncer or use Neon's built-in pooler.

**Why 5s connection timeout?** Prevents request pile-up during database unavailability. A user waiting >5s for a page load will leave anyway. Fail fast, return 503.

**Why SSL only in production?** Local development doesn't need TLS overhead. `rejectUnauthorized: false` in production allows self-signed certs (common on managed services). Tighten this for high-security deployments.

## Migration Strategy

Uses `IF NOT EXISTS` on every table and index. Runs on every server startup.

**Why not a migration tool (Knex, Flyway)?** This is a single-developer app with 6 tables. A migration framework adds dependency weight and operational complexity (tracking migration state, rollback scripts) for minimal benefit. If the schema grows to 20+ tables or multiple developers, switch to something like `node-pg-migrate`.

**Why `IF NOT EXISTS` over `CREATE OR REPLACE`?** Idempotent — safe to run on every deploy without tracking which migrations have been applied. No migration state table needed.

## Index Strategy

14 indexes, chosen by query pattern analysis:

| Index | Why |
|-------|-----|
| `idx_courses_user_id` | Every course query filters by user_id |
| `idx_courses_user_semester_year` | Composite for the most common filter combo |
| `idx_assignments_course_id` | JOIN key for N+1 elimination |
| `idx_refresh_tokens_user_revoked WHERE revoked = false` | Partial index — only scans active tokens |
| `idx_users_is_active WHERE is_active = true` | Partial index — skips deactivated accounts |

**Why partial indexes?** A partial index on `revoked = false` is ~10x smaller than a full index when most tokens are revoked. Postgres only scans tokens that matter.

**Why UUID primary keys?** Prevents enumeration attacks (can't guess `/course/2` to access someone else's data). Also future-proofs for distributed systems where auto-increment collides across shards.

## Scaling Path

1. **Now:** Single Postgres instance with connection pooling
2. **1K users:** Add composite indexes (already done), enable Neon's built-in connection pooler
3. **10K users:** Read replicas for analytics queries (`/summary`, `/dashboard-analytics`)
4. **100K users:** Table partitioning by `user_id` range
5. **1M+ users:** Citus extension for horizontal sharding — no app code changes needed since queries already filter by `user_id`

## Alternatives Considered

| Option | Why Rejected |
|--------|-------------|
| **MongoDB** | Vendor lock-in, horizontal-first scaling model doesn't match CRUD workload |
| **SQLite** | No concurrent connections, can't add read replicas |
| **Supabase** | Postgres underneath (good), but the auth/storage layers create lock-in |
| **Prisma/Drizzle ORM** | Adds abstraction layer that hides query optimization opportunities |
