const express = require('express');
const jwt = require('jsonwebtoken');
const { serialize, parse } = require('cookie');
const User = require('../models/User');
const { auth, verifyRefreshToken } = require('../middleware/auth');
const { validate, sanitizeInput } = require('../middleware/validation');
const {
    registerSchema,
    loginSchema,
    passwordResetRequestSchema,
    passwordResetSchema,
    emailVerificationSchema,
    refreshTokenSchema
} = require('../validations/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Debug endpoint to test server connectivity
router.get('/debug', (req, res) => {
    res.json({
        message: 'Auth routes are working',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Generate JWT tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '24h' }
    );

    const refreshToken = jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );

    return { accessToken, refreshToken };
};

// Set refresh token cookie
const setRefreshTokenCookie = (res, refreshToken) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth'
    };

    res.setHeader('Set-Cookie', serialize('refreshToken', refreshToken, cookieOptions));
};

// @route   POST /api/auth/register
router.post('/register',
    sanitizeInput,
    validate(registerSchema),
    async (req, res) => {
        try {
            const { email, password, firstName } = req.body;

            // Check if user already exists
            const existing = await User.findByEmail(email);
            if (existing) {
                return res.status(409).json({
                    message: 'User already exists',
                    code: 'USER_EXISTS'
                });
            }

            // Create new user (handles password hashing + strength check)
            const { user, verificationToken } = await User.createUser({
                email,
                password,
                firstName,
                gpaScale: '4.0'
            });

            // Generate tokens
            const { accessToken, refreshToken } = generateTokens(user.id);

            // Add refresh token
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await User.addRefreshToken(user.id, refreshToken, expiresAt, req.headers['user-agent'], req.ip);

            // Set refresh token cookie
            setRefreshTokenCookie(res, refreshToken);

            res.status(201).json({
                message: 'User registered successfully. Please check your email for verification.',
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    institution: user.institution,
                    graduationYear: user.graduationYear,
                    gpaScale: user.gpaScale,
                    isEmailVerified: user.isEmailVerified
                }
            });
        } catch (error) {
            console.error('Registration error:', error);

            if (error.name === 'PasswordStrengthError') {
                return res.status(400).json({
                    message: error.message,
                    code: 'PASSWORD_TOO_WEAK'
                });
            }

            if (error.name === 'PasswordReuseError') {
                return res.status(400).json({
                    message: error.message,
                    code: 'PASSWORD_REUSE'
                });
            }

            // Postgres unique constraint violation
            if (error.code === '23505') {
                return res.status(409).json({
                    message: 'Email already exists',
                    code: 'EMAIL_EXISTS'
                });
            }

            res.status(500).json({
                message: 'Server error during registration',
                code: 'REGISTRATION_ERROR',
                details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

// @route   POST /api/auth/login
router.post('/login',
    sanitizeInput,
    validate(loginSchema),
    async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    message: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Check if account is locked
            if (User.isLocked(user)) {
                const remainingTime = Math.ceil((new Date(user.failedLoginAttempts.lockedUntil) - Date.now()) / (1000 * 60));
                return res.status(423).json({
                    message: `Account is temporarily locked. Try again in ${remainingTime} minutes.`,
                    code: 'ACCOUNT_LOCKED',
                    lockedUntil: user.failedLoginAttempts.lockedUntil
                });
            }

            // Check password
            const isMatch = await User.comparePassword(user.password, password);
            if (!isMatch) {
                await User.recordFailedLogin(user.id, user.failedLoginAttempts.count);
                return res.status(401).json({
                    message: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Reset failed login attempts on successful login
            await User.resetFailedLoginAttempts(user.id);
            await User.updateUser(user.id, { lastLogin: new Date() });

            // Generate tokens
            const { accessToken, refreshToken } = generateTokens(user.id);

            // Add refresh token
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await User.addRefreshToken(user.id, refreshToken, expiresAt, req.headers['user-agent'], req.ip);

            // Set refresh token cookie
            setRefreshTokenCookie(res, refreshToken);

            res.json({
                message: 'Login successful',
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    institution: user.institution,
                    graduationYear: user.graduationYear,
                    gpaScale: user.gpaScale,
                    isEmailVerified: user.isEmailVerified
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                message: 'Server error during login',
                code: 'LOGIN_ERROR'
            });
        }
    }
);

// @route   POST /api/auth/refresh
router.post('/refresh',
    verifyRefreshToken,
    async (req, res) => {
        try {
            const user = req.user;
            const oldRefreshToken = req.refreshToken;

            // Generate new tokens
            const { accessToken, refreshToken } = generateTokens(user.id);

            // Revoke old refresh token
            await User.revokeRefreshToken(user.id, oldRefreshToken);

            // Add new refresh token
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await User.addRefreshToken(user.id, refreshToken, expiresAt, req.headers['user-agent'], req.ip);

            // Set new refresh token cookie
            setRefreshTokenCookie(res, refreshToken);

            res.json({
                message: 'Token refreshed successfully',
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    institution: user.institution,
                    graduationYear: user.graduationYear,
                    gpaScale: user.gpaScale,
                    isEmailVerified: user.isEmailVerified
                }
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(500).json({
                message: 'Server error during token refresh',
                code: 'REFRESH_ERROR'
            });
        }
    }
);

// @route   POST /api/auth/logout
router.post('/logout', auth, async (req, res) => {
    try {
        const user = req.user;

        // Revoke the current refresh token
        const cookies = parse(req.headers.cookie || '');
        const refreshToken = cookies.refreshToken;

        if (refreshToken) {
            await User.revokeRefreshToken(user.id, refreshToken);
        }

        // Clear refresh token cookie
        res.setHeader('Set-Cookie', serialize('refreshToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth',
            maxAge: 0
        }));

        res.json({
            message: 'Logout successful',
            code: 'LOGOUT_SUCCESS'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            message: 'Server error during logout',
            code: 'LOGOUT_ERROR'
        });
    }
});

// @route   POST /api/auth/logout-all
router.post('/logout-all', auth, async (req, res) => {
    try {
        await User.revokeAllTokens(req.user.id);

        // Clear refresh token cookie
        res.setHeader('Set-Cookie', serialize('refreshToken', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/api/auth',
            maxAge: 0
        }));

        res.json({
            message: 'Logged out from all devices',
            code: 'LOGOUT_ALL_SUCCESS'
        });
    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            message: 'Server error during logout',
            code: 'LOGOUT_ALL_ERROR'
        });
    }
});

// @route   GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id, { excludeSecrets: true });
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            message: 'Server error while fetching user',
            code: 'GET_USER_ERROR'
        });
    }
});

// @route   POST /api/auth/verify-email
router.post('/verify-email',
    validate(emailVerificationSchema),
    async (req, res) => {
        try {
            const { token } = req.body;

            const user = await User.findByVerificationToken(token);
            if (!user) {
                return res.status(400).json({
                    message: 'Invalid or expired verification token',
                    code: 'INVALID_VERIFICATION_TOKEN'
                });
            }

            await User.updateUser(user.id, {
                isEmailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpires: null
            });

            res.json({
                message: 'Email verified successfully',
                code: 'EMAIL_VERIFIED'
            });
        } catch (error) {
            console.error('Email verification error:', error);
            res.status(500).json({
                message: 'Server error during email verification',
                code: 'VERIFICATION_ERROR'
            });
        }
    }
);

// @route   POST /api/auth/forgot-password
router.post('/forgot-password',
    validate(passwordResetRequestSchema),
    async (req, res) => {
        try {
            const { email } = req.body;

            const user = await User.findByEmail(email);
            if (!user) {
                return res.json({
                    message: 'If an account with that email exists, a password reset link has been sent.',
                    code: 'PASSWORD_RESET_SENT'
                });
            }

            const resetToken = await User.generatePasswordResetToken(user.id);

            // Send password reset email
            try {
                await emailService.sendPasswordResetEmail(
                    user.email,
                    resetToken,
                    user.firstName
                );
                console.log(`✅ Password reset email sent to: ${user.email}`);
            } catch (emailError) {
                console.error('❌ Failed to send password reset email:', emailError);
            }

            res.json({
                message: 'If an account with that email exists, a password reset link has been sent.',
                code: 'PASSWORD_RESET_SENT'
            });
        } catch (error) {
            console.error('Password reset request error:', error);
            res.status(500).json({
                message: 'Server error during password reset request',
                code: 'PASSWORD_RESET_REQUEST_ERROR'
            });
        }
    }
);

// @route   POST /api/auth/reset-password
router.post('/reset-password',
    validate(passwordResetSchema),
    async (req, res) => {
        try {
            const { token, password } = req.body;

            const user = await User.findByResetToken(token);
            if (!user) {
                return res.status(400).json({
                    message: 'Invalid or expired reset token',
                    code: 'INVALID_RESET_TOKEN'
                });
            }

            // Change password (handles strength + history check)
            await User.changePassword(user.id, password);

            // Clear reset token
            await User.updateUser(user.id, {
                passwordResetToken: null,
                passwordResetExpires: null
            });

            // Revoke all refresh tokens (force re-login)
            await User.revokeAllTokens(user.id);

            res.json({
                message: 'Password reset successfully. Please log in with your new password.',
                code: 'PASSWORD_RESET_SUCCESS'
            });
        } catch (error) {
            console.error('Password reset error:', error);

            if (error.name === 'PasswordStrengthError') {
                return res.status(400).json({
                    message: error.message,
                    code: 'PASSWORD_TOO_WEAK'
                });
            }

            if (error.name === 'PasswordReuseError') {
                return res.status(400).json({
                    message: error.message,
                    code: 'PASSWORD_REUSE'
                });
            }

            res.status(500).json({
                message: 'Server error during password reset',
                code: 'PASSWORD_RESET_ERROR'
            });
        }
    }
);

module.exports = router;
