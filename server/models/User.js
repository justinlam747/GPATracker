const mongoose = require('mongoose');
const argon2 = require('argon2');
const zxcvbn = require('zxcvbn');

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    revoked: {
        type: Boolean,
        default: false
    },
    revokedAt: Date,
    userAgent: String,
    ipAddress: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            },
            message: 'Please provide a valid email address'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    institution: {
        type: String,
        trim: true,
        maxlength: 100
    },
    graduationYear: {
        type: Number,
        min: 2000,
        max: 2030
    },
    gpaScale: {
        type: String,
        default: '4.0',
        enum: ['4.0', '4.3', 'percentage']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshTokens: [refreshTokenSchema],
    failedLoginAttempts: {
        count: {
            type: Number,
            default: 0
        },
        lastAttempt: Date,
        lockedUntil: Date
    },
    lastLogin: Date,
    lastPasswordChange: {
        type: Date,
        default: Date.now
    },
    passwordHistory: [{
        password: String,
        changedAt: {
            type: Date,
            default: Date.now
        }
    }],
    sessionCount: {
        type: Number,
        default: 0
    },
    maxSessions: {
        type: Number,
        default: 5
    }
}, {
    timestamps: true
});

// Indexes for performance and security
userSchema.index({ 'refreshTokens.token': 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Password validation middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        // Check password strength using zxcvbn
        const passwordStrength = zxcvbn(this.password);
        if (passwordStrength.score < 2) {
            const error = new Error('Password is too weak. Please choose a stronger password.');
            error.name = 'PasswordStrengthError';
            return next(error);
        }

        // Check password history (prevent reuse of last 5 passwords)
        if (this.passwordHistory && this.passwordHistory.length > 0) {
            for (let i = 0; i < Math.min(this.passwordHistory.length, 5); i++) {
                // Check if the new password matches any of the old hashed passwords
                const isMatch = await argon2.verify(this.passwordHistory[i].password, this.password);
                if (isMatch) {
                    const error = new Error('Cannot reuse recent passwords');
                    error.name = 'PasswordReuseError';
                    return next(error);
                }
            }
        }

        // Hash password with argon2
        const salt = await argon2.hash(this.password, {
            type: argon2.argon2id,
            memoryCost: 19456, // 19 MB
            timeCost: 2, // 2 iterations
            parallelism: 1
        });

        this.password = salt;

        // Update password history
        if (this.passwordHistory.length >= 5) {
            this.passwordHistory.shift(); // Remove oldest password
        }
        this.passwordHistory.push({
            password: this.password,
            changedAt: new Date()
        });

        this.lastPasswordChange = new Date();
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to get user's full name
userSchema.methods.getFullName = function () {
    return `${this.firstName} ${this.lastName}`;
};

// Method to check if account is locked
userSchema.methods.isLocked = function () {
    if (!this.failedLoginAttempts.lockedUntil) return false;
    return Date.now() < this.failedLoginAttempts.lockedUntil.getTime();
};

// Method to record failed login attempt
userSchema.methods.recordFailedLogin = function () {
    this.failedLoginAttempts.count += 1;
    this.failedLoginAttempts.lastAttempt = new Date();

    // Lock account after 5 failed attempts
    if (this.failedLoginAttempts.count >= 5) {
        const lockDuration = Math.min(Math.pow(2, this.failedLoginAttempts.count - 5) * 15 * 60 * 1000, 24 * 60 * 60 * 1000); // 15 min to 24 hours
        this.failedLoginAttempts.lockedUntil = new Date(Date.now() + lockDuration);
    }
};

// Method to reset failed login attempts
userSchema.methods.resetFailedLoginAttempts = function () {
    this.failedLoginAttempts.count = 0;
    this.failedLoginAttempts.lastAttempt = null;
    this.failedLoginAttempts.lockedUntil = null;
};

// Method to add refresh token
userSchema.methods.addRefreshToken = function (token, expiresAt, userAgent, ipAddress) {
    // Remove expired tokens
    this.refreshTokens = this.refreshTokens.filter(t => t.expiresAt > new Date());

    // Check session limit
    if (this.refreshTokens.length >= this.maxSessions) {
        // Remove oldest token
        this.refreshTokens.shift();
    }

    this.refreshTokens.push({
        token,
        expiresAt,
        userAgent,
        ipAddress
    });

    this.sessionCount = this.refreshTokens.length;
};

// Method to revoke refresh token
userSchema.methods.revokeRefreshToken = function (token) {
    const tokenDoc = this.refreshTokens.find(t => t.token === token);
    if (tokenDoc) {
        tokenDoc.revoked = true;
        tokenDoc.revokedAt = new Date();
        this.sessionCount = this.refreshTokens.filter(t => !t.revoked).length;
    }
};

// Method to revoke all refresh tokens
userSchema.methods.revokeAllTokens = function () {
    this.refreshTokens.forEach(token => {
        token.revoked = true;
        token.revokedAt = new Date();
    });
    this.sessionCount = 0;
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
    const token = require('crypto').randomBytes(32).toString('hex');
    this.emailVerificationToken = token;
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
    const token = require('crypto').randomBytes(32).toString('hex');
    this.passwordResetToken = token;
    this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    return token;
};

module.exports = mongoose.model('User', userSchema);
