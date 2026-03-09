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
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id, { excludeSecrets: true });
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
router.put('/profile',
    auth,
    sanitizeInput,
    validate(profileUpdateSchema),
    async (req, res) => {
        try {
            const updatedUser = await User.updateUser(req.user.id, req.body);
            const publicUser = User.userToPublic(updatedUser);

            res.json({
                message: 'Profile updated successfully',
                user: publicUser,
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
router.put('/password',
    auth,
    sanitizeInput,
    validate(changePasswordSchema),
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.user.id);

            // Verify current password
            const isMatch = await User.comparePassword(user.password, currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    message: 'Current password is incorrect',
                    code: 'INCORRECT_CURRENT_PASSWORD'
                });
            }

            // Update password (handles strength + history check)
            await User.changePassword(req.user.id, newPassword);

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
router.get('/sessions', auth, async (req, res) => {
    try {
        const sessionInfo = await User.getSessionInfo(req.user.id);

        res.json({
            sessions: sessionInfo.sessions,
            count: sessionInfo.count,
            maxSessions: sessionInfo.maxSessions,
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
router.delete('/sessions/:sessionId', auth, async (req, res) => {
    try {
        const result = await User.revokeSession(req.user.id, req.params.sessionId);
        if (!result) {
            return res.status(404).json({
                message: 'Session not found',
                code: 'SESSION_NOT_FOUND'
            });
        }

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
router.delete('/account', auth, async (req, res) => {
    try {
        await User.deleteUser(req.user.id);

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
router.get('/export-data', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id, { excludeSecrets: true });

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
