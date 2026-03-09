const { query } = require('../db/pool');
const argon2 = require('argon2');
const zxcvbn = require('zxcvbn');
const crypto = require('crypto');

// ── Argon2 config ────────────────────────────────────────────────────────────
const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
};

// ── Row → user object helper ─────────────────────────────────────────────────
function rowToUser(row) {
    if (!row) return null;
    return {
        _id: row.id,
        id: row.id,
        email: row.email,
        password: row.password,
        firstName: row.first_name,
        lastName: row.last_name,
        institution: row.institution,
        graduationYear: row.graduation_year,
        gpaScale: row.gpa_scale,
        isActive: row.is_active,
        isEmailVerified: row.is_email_verified,
        emailVerificationToken: row.email_verification_token,
        emailVerificationExpires: row.email_verification_expires,
        passwordResetToken: row.password_reset_token,
        passwordResetExpires: row.password_reset_expires,
        failedLoginAttempts: {
            count: row.failed_login_count,
            lastAttempt: row.failed_login_last_attempt,
            lockedUntil: row.failed_login_locked_until
        },
        lastLogin: row.last_login,
        lastPasswordChange: row.last_password_change,
        maxSessions: row.max_sessions,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

function userToPublic(user) {
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
}

// ── Queries ──────────────────────────────────────────────────────────────────

async function findById(id, opts = {}) {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    const user = rowToUser(rows[0]);
    if (!user) return null;
    if (opts.excludeSecrets) return userToPublic(user);
    return user;
}

async function findByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    return rowToUser(rows[0]);
}

async function findByVerificationToken(token) {
    const { rows } = await query(
        'SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires > NOW()',
        [token]
    );
    return rowToUser(rows[0]);
}

async function findByResetToken(token) {
    const { rows } = await query(
        'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
        [token]
    );
    return rowToUser(rows[0]);
}

// ── Password helpers ─────────────────────────────────────────────────────────

async function hashPassword(plainPassword) {
    return argon2.hash(plainPassword, ARGON2_OPTIONS);
}

async function comparePassword(hashedPassword, candidatePassword) {
    return argon2.verify(hashedPassword, candidatePassword);
}

function checkPasswordStrength(password) {
    const result = zxcvbn(password);
    if (result.score < 2) {
        const error = new Error('Password is too weak. Please choose a stronger password.');
        error.name = 'PasswordStrengthError';
        throw error;
    }
}

async function checkPasswordHistory(userId, plainPassword) {
    const { rows } = await query(
        'SELECT password FROM password_history WHERE user_id = $1 ORDER BY changed_at DESC LIMIT 5',
        [userId]
    );
    for (const row of rows) {
        if (await argon2.verify(row.password, plainPassword)) {
            const error = new Error('Cannot reuse recent passwords');
            error.name = 'PasswordReuseError';
            throw error;
        }
    }
}

async function addPasswordHistory(userId, hashedPassword) {
    await query('INSERT INTO password_history (user_id, password) VALUES ($1, $2)', [userId, hashedPassword]);
    // Keep only last 5
    await query(`
        DELETE FROM password_history WHERE id IN (
            SELECT id FROM password_history
            WHERE user_id = $1
            ORDER BY changed_at DESC
            OFFSET 5
        )
    `, [userId]);
}

// ── Create user ──────────────────────────────────────────────────────────────

async function createUser({ email, password: plainPassword, firstName, gpaScale = '4.0' }) {
    checkPasswordStrength(plainPassword);

    const hashed = await hashPassword(plainPassword);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { rows } = await query(`
        INSERT INTO users (email, password, first_name, gpa_scale, email_verification_token, email_verification_expires)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `, [email.toLowerCase().trim(), hashed, firstName, gpaScale, verificationToken, verificationExpires]);

    const user = rowToUser(rows[0]);

    // Seed password history
    await addPasswordHistory(user.id, hashed);

    return { user, verificationToken };
}

// ── Update user fields ───────────────────────────────────────────────────────

async function updateUser(id, fields) {
    const setClauses = [];
    const values = [];
    let i = 1;

    const fieldMap = {
        firstName: 'first_name',
        lastName: 'last_name',
        institution: 'institution',
        graduationYear: 'graduation_year',
        gpaScale: 'gpa_scale',
        isActive: 'is_active',
        isEmailVerified: 'is_email_verified',
        emailVerificationToken: 'email_verification_token',
        emailVerificationExpires: 'email_verification_expires',
        passwordResetToken: 'password_reset_token',
        passwordResetExpires: 'password_reset_expires',
        lastLogin: 'last_login',
        lastPasswordChange: 'last_password_change'
    };

    for (const [key, value] of Object.entries(fields)) {
        const col = fieldMap[key];
        if (col) {
            setClauses.push(`${col} = $${i}`);
            values.push(value === undefined ? null : value);
            i++;
        }
    }

    if (setClauses.length === 0) return findById(id);

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await query(
        `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${i} RETURNING *`,
        values
    );
    return rowToUser(rows[0]);
}

// ── Change password (with strength + history check) ──────────────────────────

async function changePassword(userId, newPlainPassword) {
    checkPasswordStrength(newPlainPassword);
    await checkPasswordHistory(userId, newPlainPassword);

    const hashed = await hashPassword(newPlainPassword);
    await query(
        'UPDATE users SET password = $1, last_password_change = NOW(), updated_at = NOW() WHERE id = $2',
        [hashed, userId]
    );
    await addPasswordHistory(userId, hashed);
}

// ── Failed login tracking ────────────────────────────────────────────────────

function isLocked(user) {
    if (!user.failedLoginAttempts.lockedUntil) return false;
    return Date.now() < new Date(user.failedLoginAttempts.lockedUntil).getTime();
}

async function recordFailedLogin(userId, currentCount) {
    const newCount = currentCount + 1;
    let lockedUntil = null;

    if (newCount >= 5) {
        const lockDuration = Math.min(Math.pow(2, newCount - 5) * 15 * 60 * 1000, 24 * 60 * 60 * 1000);
        lockedUntil = new Date(Date.now() + lockDuration);
    }

    await query(`
        UPDATE users SET
            failed_login_count = $1,
            failed_login_last_attempt = NOW(),
            failed_login_locked_until = $2,
            updated_at = NOW()
        WHERE id = $3
    `, [newCount, lockedUntil, userId]);
}

async function resetFailedLoginAttempts(userId) {
    await query(`
        UPDATE users SET
            failed_login_count = 0,
            failed_login_last_attempt = NULL,
            failed_login_locked_until = NULL,
            updated_at = NOW()
        WHERE id = $1
    `, [userId]);
}

// ── Refresh token management ─────────────────────────────────────────────────

async function getActiveRefreshTokens(userId) {
    const { rows } = await query(
        'SELECT * FROM refresh_tokens WHERE user_id = $1 AND revoked = false AND expires_at > NOW() ORDER BY created_at DESC',
        [userId]
    );
    return rows;
}

async function addRefreshToken(userId, token, expiresAt, userAgent, ipAddress, maxSessions = 5) {
    // Remove expired tokens
    await query('DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at <= NOW()', [userId]);

    // Check session limit
    const active = await getActiveRefreshTokens(userId);
    if (active.length >= maxSessions) {
        await query('DELETE FROM refresh_tokens WHERE id = $1', [active[active.length - 1].id]);
    }

    await query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip_address) VALUES ($1, $2, $3, $4, $5)',
        [userId, token, expiresAt, userAgent, ipAddress]
    );
}

async function findRefreshToken(userId, token) {
    const { rows } = await query(
        'SELECT * FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND revoked = false',
        [userId, token]
    );
    return rows[0] || null;
}

async function revokeRefreshToken(userId, token) {
    await query(
        'UPDATE refresh_tokens SET revoked = true, revoked_at = NOW() WHERE user_id = $1 AND token = $2',
        [userId, token]
    );
}

async function revokeAllTokens(userId) {
    await query(
        'UPDATE refresh_tokens SET revoked = true, revoked_at = NOW() WHERE user_id = $1 AND revoked = false',
        [userId]
    );
}

// ── Email verification ───────────────────────────────────────────────────────

async function generateEmailVerificationToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await query(
        'UPDATE users SET email_verification_token = $1, email_verification_expires = $2, updated_at = NOW() WHERE id = $3',
        [token, expires, userId]
    );
    return token;
}

async function generatePasswordResetToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW() WHERE id = $3',
        [token, expires, userId]
    );
    return token;
}

// ── Delete user ──────────────────────────────────────────────────────────────

async function deleteUser(userId) {
    await query('DELETE FROM users WHERE id = $1', [userId]);
}

// ── Session info ─────────────────────────────────────────────────────────────

async function getSessionInfo(userId) {
    const active = await getActiveRefreshTokens(userId);
    const user = await findById(userId);
    return {
        sessions: active.map(t => ({
            id: t.id,
            _id: t.id,
            userAgent: t.user_agent,
            ipAddress: t.ip_address,
            createdAt: t.created_at,
            expiresAt: t.expires_at
        })),
        count: active.length,
        maxSessions: user.maxSessions
    };
}

async function revokeSession(userId, sessionId) {
    const { rows } = await query(
        'SELECT token FROM refresh_tokens WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
    );
    if (rows.length === 0) return null;
    await query('UPDATE refresh_tokens SET revoked = true, revoked_at = NOW() WHERE id = $1', [sessionId]);
    return true;
}

module.exports = {
    findById,
    findByEmail,
    findByVerificationToken,
    findByResetToken,
    rowToUser,
    userToPublic,
    hashPassword,
    comparePassword,
    checkPasswordStrength,
    createUser,
    updateUser,
    changePassword,
    isLocked,
    recordFailedLogin,
    resetFailedLoginAttempts,
    getActiveRefreshTokens,
    addRefreshToken,
    findRefreshToken,
    revokeRefreshToken,
    revokeAllTokens,
    generateEmailVerificationToken,
    generatePasswordResetToken,
    deleteUser,
    getSessionInfo,
    revokeSession
};
