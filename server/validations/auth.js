const { z } = require('zod');

// Registration validation schema
const registerSchema = z.object({
    firstName: z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .trim()
        .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),

    email: z.string()
        .email('Please provide a valid email address')
        .min(5, 'Email must be at least 5 characters')
        .max(100, 'Email must be less than 100 characters')
        .toLowerCase()
        .trim(),

    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(128, 'Password must be less than 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    confirmPassword: z.string()
        .min(1, 'Please confirm your password'),

    institution: z.string()
        .max(100, 'Institution name must be less than 100 characters')
        .trim()
        .optional(),

    graduationYear: z.number()
        .int()
        .min(2000, 'Graduation year must be 2000 or later')
        .max(2030, 'Graduation year must be 2030 or earlier')
        .optional(),

    gpaScale: z.number()
        .refine(val => [4.0, 5.0, 10.0].includes(val), 'GPA scale must be 4.0, 5.0, or 10.0')
        .default(4.0)
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

// Login validation schema
const loginSchema = z.object({
    email: z.string()
        .email('Please provide a valid email address')
        .toLowerCase()
        .trim(),

    password: z.string()
        .min(1, 'Password is required')
});

// Password reset request schema
const passwordResetRequestSchema = z.object({
    email: z.string()
        .email('Please provide a valid email address')
        .toLowerCase()
        .trim()
});

// Password reset schema
const passwordResetSchema = z.object({
    token: z.string()
        .min(1, 'Reset token is required'),

    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(128, 'Password must be less than 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    confirmPassword: z.string()
        .min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
});

// Email verification schema
const emailVerificationSchema = z.object({
    token: z.string()
        .min(1, 'Verification token is required')
});

// Refresh token schema
const refreshTokenSchema = z.object({
    refreshToken: z.string()
        .min(1, 'Refresh token is required')
});

// Change password schema
const changePasswordSchema = z.object({
    currentPassword: z.string()
        .min(1, 'Current password is required'),

    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(128, 'Password must be less than 128 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    confirmPassword: z.string()
        .min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"]
});

// Profile update schema
const profileUpdateSchema = z.object({
    firstName: z.string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .trim()
        .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters')
        .optional(),

    lastName: z.string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters')
        .trim()
        .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters')
        .optional(),

    institution: z.string()
        .max(100, 'Institution name must be less than 100 characters')
        .trim()
        .optional(),

    graduationYear: z.number()
        .int()
        .min(2000, 'Graduation year must be 2000 or later')
        .max(2030, 'Graduation year must be 2030 or earlier')
        .optional(),

    gpaScale: z.enum(['4.0', '4.3', 'percentage'])
        .optional()
});

module.exports = {
    registerSchema,
    loginSchema,
    passwordResetRequestSchema,
    passwordResetSchema,
    emailVerificationSchema,
    refreshTokenSchema,
    changePasswordSchema,
    profileUpdateSchema
};
