const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const User = require('../models/User');
const { parse } = require('cookie');

// Lightweight user check — only fetches id + is_active (no full row scan)
async function findUserLightweight(userId) {
    const { rows } = await query(
        'SELECT id, email, first_name, last_name, institution, graduation_year, gpa_scale, is_active, is_email_verified, max_sessions, created_at, updated_at FROM users WHERE id = $1',
        [userId]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
        _id: r.id, id: r.id,
        email: r.email,
        firstName: r.first_name,
        lastName: r.last_name,
        institution: r.institution,
        graduationYear: r.graduation_year,
        gpaScale: r.gpa_scale,
        isActive: r.is_active,
        isEmailVerified: r.is_email_verified,
        maxSessions: r.max_sessions,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    };
}

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Access token required',
                code: 'ACCESS_TOKEN_MISSING'
            });
        }

        const accessToken = authHeader.replace('Bearer ', '');

        try {
            const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback-secret');

            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                return res.status(401).json({
                    message: 'Access token expired',
                    code: 'ACCESS_TOKEN_EXPIRED'
                });
            }

            // Lightweight query — skips password, failed login, refresh tokens
            const user = await findUserLightweight(decoded.userId);
            if (!user) {
                return res.status(401).json({
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({
                    message: 'Account is deactivated',
                    code: 'ACCOUNT_DEACTIVATED'
                });
            }

            req.user = user;
            req.accessToken = accessToken;
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: 'Access token expired',
                    code: 'ACCESS_TOKEN_EXPIRED'
                });
            }
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    message: 'Invalid access token',
                    code: 'INVALID_ACCESS_TOKEN'
                });
            }
            throw jwtError;
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            message: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

const verifyRefreshToken = async (req, res, next) => {
    try {
        const cookies = parse(req.headers.cookie || '');
        const refreshToken = cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: 'Refresh token required',
                code: 'REFRESH_TOKEN_MISSING'
            });
        }

        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret');

            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                return res.status(401).json({
                    message: 'Refresh token expired',
                    code: 'REFRESH_TOKEN_EXPIRED'
                });
            }

            // Single query: join user + refresh token check
            const { rows } = await query(`
                SELECT u.*, rt.token AS rt_token
                FROM users u
                JOIN refresh_tokens rt ON rt.user_id = u.id
                WHERE u.id = $1 AND rt.token = $2 AND rt.revoked = false
            `, [decoded.userId, refreshToken]);

            if (rows.length === 0) {
                return res.status(401).json({
                    message: 'Invalid refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }

            req.user = User.rowToUser(rows[0]);
            req.refreshToken = refreshToken;
            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: 'Refresh token expired',
                    code: 'REFRESH_TOKEN_EXPIRED'
                });
            }
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    message: 'Invalid refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }
            throw jwtError;
        }
    } catch (error) {
        console.error('Refresh token verification error:', error);
        res.status(500).json({
            message: 'Refresh token verification error',
            code: 'REFRESH_ERROR'
        });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const accessToken = authHeader.replace('Bearer ', '');

            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback-secret');
                const user = await findUserLightweight(decoded.userId);
                if (user && user.isActive) {
                    req.user = user;
                }
            } catch (error) {
                // Token is invalid, but we continue without user
            }
        }
        next();
    } catch (error) {
        next();
    }
};

module.exports = { auth, verifyRefreshToken, optionalAuth };
