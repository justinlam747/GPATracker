const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { parse } = require('cookie');

const auth = async (req, res, next) => {
    try {
        // Get access token from Authorization header
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Access token required',
                code: 'ACCESS_TOKEN_MISSING'
            });
        }

        const accessToken = authHeader.replace('Bearer ', '');

        try {
            // Verify access token
            const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback-secret');

            // Check if token is expired
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                return res.status(401).json({
                    message: 'Access token expired',
                    code: 'ACCESS_TOKEN_EXPIRED'
                });
            }

            // Get user from database
            const user = await User.findById(decoded.userId).select('-password -refreshTokens');
            if (!user) {
                return res.status(401).json({
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    message: 'Account is deactivated',
                    code: 'ACCOUNT_DEACTIVATED'
                });
            }

            // Attach user to request
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

// Middleware to verify refresh token
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

            // Check if token is expired
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                return res.status(401).json({
                    message: 'Refresh token expired',
                    code: 'REFRESH_TOKEN_EXPIRED'
                });
            }

            // Get user and verify refresh token
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(401).json({
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Check if refresh token exists in user's refresh tokens
            const tokenExists = user.refreshTokens.some(token =>
                token.token === refreshToken && !token.revoked
            );

            if (!tokenExists) {
                return res.status(401).json({
                    message: 'Invalid refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }

            req.user = user;
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

// Optional auth middleware (for routes that can work with or without auth)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const accessToken = authHeader.replace('Bearer ', '');

            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback-secret');
                const user = await User.findById(decoded.userId).select('-password -refreshTokens');
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
