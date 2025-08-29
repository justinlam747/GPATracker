const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { validate, sanitizeInput } = require('../middleware/validation');
const {
    profileUpdateSchema,
    changePasswordSchema
} = require('../validations/auth');

const router = express.Router();

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -refreshTokens');
        res.json({
            user,
            code: 'PROFILE_RETRIEVED'
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            message: 'Server error while fetching profile',
            code: 'GET_PROFILE_ERROR'
        });
    }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
    auth,
    sanitizeInput,
    validate(profileUpdateSchema),
    async (req, res) => {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                req.body,
                { new: true, runValidators: true }
            ).select('-password -refreshTokens');

            res.json({
                message: 'Profile updated successfully',
                user: updatedUser,
                code: 'PROFILE_UPDATED'
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                message: 'Server error while updating profile',
                code: 'UPDATE_PROFILE_ERROR'
            });
        }
    }
);

// @route   PUT /api/user/password
// @desc    Change user password
// @access  Private
router.put('/password',
    auth,
    sanitizeInput,
    validate(changePasswordSchema),
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.user._id);

            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    message: 'Current password is incorrect',
                    code: 'INCORRECT_CURRENT_PASSWORD'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.json({
                message: 'Password updated successfully',
                code: 'PASSWORD_UPDATED'
            });
        } catch (error) {
            console.error('Change password error:', error);

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
                message: 'Server error while changing password',
                code: 'CHANGE_PASSWORD_ERROR'
            });
        }
    }
);

// @route   GET /api/user/sessions
// @desc    Get user's active sessions
// @access  Private
router.get('/sessions', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('refreshTokens');

        const activeSessions = user.refreshTokens
            .filter(token => !token.revoked && token.expiresAt > new Date())
            .map(token => ({
                id: token._id,
                userAgent: token.userAgent,
                ipAddress: token.ipAddress,
                createdAt: token.createdAt,
                expiresAt: token.expiresAt
            }));

        res.json({
            sessions: activeSessions,
            count: activeSessions.length,
            maxSessions: user.maxSessions,
            code: 'SESSIONS_RETRIEVED'
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            message: 'Server error while fetching sessions',
            code: 'GET_SESSIONS_ERROR'
        });
    }
});

// @route   DELETE /api/user/sessions/:sessionId
// @desc    Revoke a specific session
// @access  Private
router.delete('/sessions/:sessionId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const sessionId = req.params.sessionId;

        const session = user.refreshTokens.id(sessionId);
        if (!session) {
            return res.status(404).json({
                message: 'Session not found',
                code: 'SESSION_NOT_FOUND'
            });
        }

        user.revokeRefreshToken(session.token);
        await user.save();

        res.json({
            message: 'Session revoked successfully',
            code: 'SESSION_REVOKED'
        });
    } catch (error) {
        console.error('Revoke session error:', error);
        res.status(500).json({
            message: 'Server error while revoking session',
            code: 'REVOKE_SESSION_ERROR'
        });
    }
});

// @route   DELETE /api/user/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
    try {
        const user = req.user;

        // TODO: Delete all associated courses
        // await Course.deleteMany({ user: user._id });

        // Delete the user
        await User.findByIdAndDelete(user._id);

        res.json({
            message: 'Account deleted successfully',
            code: 'ACCOUNT_DELETED'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            message: 'Server error while deleting account',
            code: 'DELETE_ACCOUNT_ERROR'
        });
    }
});

// @route   GET /api/user/export-data
// @desc    Export user data
// @access  Private
router.get('/export-data', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -refreshTokens');

        // TODO: Include courses data
        // const courses = await Course.find({ user: user._id });

        const exportData = {
            user: {
                profile: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    institution: user.institution,
                    graduationYear: user.graduationYear,
                    gpaScale: user.gpaScale,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
                }
            },
            // courses: courses,
            exportDate: new Date().toISOString()
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="gpa-tracker-data-${Date.now()}.json"`);
        res.json(exportData);
    } catch (error) {
        console.error('Export data error:', error);
        res.status(500).json({
            message: 'Server error while exporting data',
            code: 'EXPORT_DATA_ERROR'
        });
    }
});

module.exports = router;
