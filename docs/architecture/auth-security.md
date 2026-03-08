# Authentication & Security

**Files:** `server/models/User.js`, `server/middleware/auth.js`

## Password Hashing: Why Argon2id

```javascript
const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,  // 19 MB
    timeCost: 2,
    parallelism: 1
});
```

| Algorithm | Why Not |
|-----------|---------|
| **bcrypt** | Limited to 72 bytes input, GPU-acceleratable, aging standard |
| **scrypt** | Good but less configurable memory hardness |
| **PBKDF2** | No memory hardness, vulnerable to ASIC attacks |
| **Argon2id** | Winner of Password Hashing Competition, memory-hard, side-channel resistant |

**Why these parameters?**
- **19 MB memory:** Makes GPU attacks expensive ($1000+ per password vs. pennies for bcrypt). OWASP recommends 19 MiB minimum.
- **2 iterations:** Balances security vs. login latency (~200ms per hash on a 1-core server).
- **Parallelism 1:** Prevents a single hash from consuming all CPU cores, which would be a DoS vector on shared hosting.

## JWT Token Architecture

Two-token system: short-lived access token + long-lived refresh token.

```
Access Token:  15 min TTL, stored in memory (Authorization header)
Refresh Token: 7 days TTL, stored in database (revocable)
```

**Why not just one token?**
- A single long-lived token can't be revoked without a database check on every request (defeats the purpose of JWT).
- A single short-lived token forces re-login every 15 minutes.
- The two-token model gives: fast auth (JWT verify, no DB) + revocability (refresh token in DB) + good UX (silent refresh).

**Why store refresh tokens in the database?**
- Enables session management (user can see active sessions, revoke individually)
- Enforces max session limit (5 per user)
- Supports "logout everywhere" by revoking all tokens

## Lightweight Auth Middleware

```javascript
async function findUserLightweight(userId) {
    const { rows } = await query(
        'SELECT id, email, first_name, last_name, institution, graduation_year, gpa_scale, is_active, is_email_verified, max_sessions, created_at, updated_at FROM users WHERE id = $1',
        [userId]
    );
}
```

**Why not `SELECT *`?** The users table has 20+ columns including `password`, `failed_login_attempts`, `lock_until`, and token fields. Auth middleware runs on every protected request — selecting only 12 needed columns reduces data transfer and avoids leaking sensitive fields into `req.user`.

**Why not cache the user object?** At current scale, a single indexed lookup by UUID primary key takes <1ms. Caching adds invalidation complexity (what if user changes settings?). Cache when queries show >5ms latency.

## Refresh Token Validation: JOIN vs Two Queries

```sql
-- Single JOIN (current)
SELECT u.*, rt.token AS rt_token
FROM users u
JOIN refresh_tokens rt ON rt.user_id = u.id
WHERE u.id = $1 AND rt.token = $2 AND rt.revoked = false

-- Two queries (original)
SELECT * FROM users WHERE id = $1;
SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false;
```

**Why JOIN?** One round-trip instead of two. The token and user are always needed together during refresh, so a JOIN is the natural query shape.

## Failed Login Protection

```javascript
function calculateLockDuration(attempts) {
    const lockMinutes = Math.pow(2, attempts - 5) * 15;
    return Math.min(lockMinutes, 24 * 60); // cap at 24 hours
}
```

Exponential backoff: 5th failure = 15min, 6th = 30min, 7th = 1hr, 8th = 2hr... capped at 24hr.

**Why exponential?** Linear backoff (15min every time) doesn't deter automated attacks. Exponential makes brute-force infeasible after ~8 attempts while allowing legitimate users to retry after a reasonable wait.

**Why 5 attempts before locking?** Typos happen. 5 attempts covers common password confusion (caps lock, wrong password for wrong site) without triggering false lockouts.

## Password History

```javascript
async function isPasswordReused(userId, newPassword) {
    const { rows } = await query(
        'SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
        [userId]
    );
    for (const row of rows) {
        if (await argon2.verify(row.password_hash, newPassword)) return true;
    }
    return false;
}
```

**Why check last 5?** NIST 800-63B recommends checking against "commonly used, expected, or compromised" passwords. 5 recent passwords covers the common "toggle between two passwords" behavior without excessive hash-comparison cost (~200ms per verify × 5 = ~1s worst case, only on password change).

## Password Strength: zxcvbn

```javascript
const result = zxcvbn(password);
if (result.score < 2) throw new PasswordStrengthError();
```

**Why zxcvbn over regex rules?** Regex rules (`must contain uppercase, number, symbol`) encourage weak patterns like `Password1!`. zxcvbn estimates actual entropy by checking for:
- Dictionary words
- Common substitutions (@ for a, 3 for e)
- Keyboard patterns (qwerty, 12345)
- Repeated characters

Score 2 = "somewhat guessable" — realistic minimum for a non-critical academic app.

## Alternatives Considered

| Option | Why Rejected |
|--------|-------------|
| **Session cookies** | Harder to use with mobile/SPA clients, CSRF concerns |
| **Passport.js** | Heavy dependency for simple JWT + Argon2 flow |
| **OAuth-only** | Users need email/password option for institutions without Google/GitHub |
| **bcrypt** | Argon2id is strictly superior (memory-hard, newer standard) |
| **Redis session store** | Adds infrastructure dependency; DB-backed tokens work at this scale |
