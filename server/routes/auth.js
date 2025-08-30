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
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '10m' }
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
// @desc    Register a new user
// @access  Public
router.post('/register',
    sanitizeInput,
    validate(registerSchema),
    async (req, res) => {
        try {
            const { email, password, firstName, lastName } = req.body;

            // Check if user already exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(409).json({
                    message: 'User already exists',
                    code: 'USER_EXISTS'
                });
            }

            // Create new user
            user = new User({
                email,
                password,
                firstName,
                lastName,
                gpaScale: '4.0'
            });

            // Generate email verification token
            const verificationToken = user.generateEmailVerificationToken();

            await user.save();

            // Generate tokens
            const { accessToken, refreshToken } = generateTokens(user._id);

            // Add refresh token to user
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            user.addRefreshToken(refreshToken, expiresAt, req.headers['user-agent'], req.ip);
            await user.save();

            // Set refresh token cookie
            setRefreshTokenCookie(res, refreshToken);

            // TODO: Send verification email with verificationToken

            res.status(201).json({
                message: 'User registered successfully. Please check your email for verification.',
                token: accessToken,
                user: {
                    id: user._id,
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

            // Handle specific error types
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

            if (error.name === 'ValidationError') {
                return res.status(400).json({
                    message: 'Validation failed',
                    errors: Object.values(error.errors).map(e => ({
                        field: e.path,
                        message: e.message
                    })),
                    code: 'VALIDATION_ERROR'
                });
            }

            if (error.name === 'MongoError' && error.code === 11000) {
                return res.status(409).json({
                    message: 'Email already exists',
                    code: 'EMAIL_EXISTS'
                });
            }

            // Log the full error for debugging
            console.error('Full registration error:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });

            res.status(500).json({
                message: 'Server error during registration',
                code: 'REGISTRATION_ERROR',
                details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login',
    sanitizeInput,
    validate(loginSchema),
    async (req, res) => {
        try {
            const { email, password } = req.body;

            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    message: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Check if account is locked
            if (user.isLocked()) {
                const remainingTime = Math.ceil((user.failedLoginAttempts.lockedUntil - Date.now()) / (1000 * 60));
                return res.status(423).json({
                    message: `Account is temporarily locked. Try again in ${remainingTime} minutes.`,
                    code: 'ACCOUNT_LOCKED',
                    lockedUntil: user.failedLoginAttempts.lockedUntil
                });
            }

            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                // Record failed login attempt
                user.recordFailedLogin();
                await user.save();

                return res.status(401).json({
                    message: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Reset failed login attempts on successful login
            user.resetFailedLoginAttempts();
            user.lastLogin = new Date();

            // Generate tokens
            const { accessToken, refreshToken } = generateTokens(user._id);

            // Add refresh token to user
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            user.addRefreshToken(refreshToken, expiresAt, req.headers['user-agent'], req.ip);
            await user.save();

            // Set refresh token cookie
            setRefreshTokenCookie(res, refreshToken);

            res.json({
                message: 'Login successful',
                accessToken,
                user: {
                    id: user._id,
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
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh',
    verifyRefreshToken,
    async (req, res) => {
        try {
            const user = req.user;
            const oldRefreshToken = req.refreshToken;

            // Generate new tokens
            const { accessToken, refreshToken } = generateTokens(user._id);

            // Revoke old refresh token
            user.revokeRefreshToken(oldRefreshToken);

            // Add new refresh token
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
            user.addRefreshToken(refreshToken, expiresAt, req.headers['user-agent'], req.ip);
            await user.save();

            // Set new refresh token cookie
            setRefreshTokenCookie(res, refreshToken);

            res.json({
                message: 'Token refreshed successfully',
                accessToken,
                user: {
                    id: user._id,
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
// @desc    Logout user and revoke refresh token
// @access  Private
router.post('/logout', auth, async (req, res) => {
    try {
        const user = req.user;
        const accessToken = req.accessToken;

        // Revoke the current refresh token
        const cookies = parse(req.headers.cookie || '');
        const refreshToken = cookies.refreshToken;

        if (refreshToken) {
            user.revokeRefreshToken(refreshToken);
            await user.save();
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
// @desc    Logout user from all devices
// @access  Private
router.post('/logout-all', auth, async (req, res) => {
    try {
        const user = req.user;

        // Revoke all refresh tokens
        user.revokeAllTokens();
        await user.save();

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
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -refreshTokens');
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
// @desc    Verify email address
// @access  Public
router.post('/verify-email',
    validate(emailVerificationSchema),
    async (req, res) => {
        try {
            const { token } = req.body;

            const user = await User.findOne({
                emailVerificationToken: token,
                emailVerificationExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    message: 'Invalid or expired verification token',
                    code: 'INVALID_VERIFICATION_TOKEN'
                });
            }

            user.isEmailVerified = true;
            user.emailVerificationToken = undefined;
            user.emailVerificationExpires = undefined;
            await user.save();

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
// @desc    Request password reset
// @access  Public
router.post('/forgot-password',
    validate(passwordResetRequestSchema),
    async (req, res) => {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                // Don't reveal if user exists
                return res.json({
                    message: 'If an account with that email exists, a password reset link has been sent.',
                    code: 'PASSWORD_RESET_SENT'
                });
            }

            // Generate password reset token
            const resetToken = user.generatePasswordResetToken();
            await user.save();

            // TODO: Send password reset email with resetToken

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
// @desc    Reset password using token
// @access  Public
router.post('/reset-password',
    validate(passwordResetSchema),
    async (req, res) => {
        try {
            const { token, password } = req.body;

            const user = await User.findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({
                    message: 'Invalid or expired reset token',
                    code: 'INVALID_RESET_TOKEN'
                });
            }

            // Update password
            user.password = password;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;

            // Revoke all refresh tokens (force re-login)
            user.revokeAllTokens();

            await user.save();

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

            res.status(500).json({
                message: 'Server error during password reset',
                code: 'PASSWORD_RESET_ERROR'
            });
        }
    }
);

module.exports = router;
