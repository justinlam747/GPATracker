import { z } from 'zod';

// ── Auth schemas (mirrors server validations) ──────────────────────────

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email'),
    password: z
        .string()
        .min(1, 'Password is required'),
});

export const registerSchema = z
    .object({
        firstName: z
            .string()
            .min(1, 'First name is required')
            .max(50, 'First name must be 50 characters or less')
            .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
        email: z
            .string()
            .min(1, 'Email is required')
            .email('Please enter a valid email')
            .max(100, 'Email must be 100 characters or less'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(128, 'Password must be 128 characters or less')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/\d/, 'Password must contain at least one number'),
        confirmPassword: z
            .string()
            .min(1, 'Please confirm your password'),
        agreeToTerms: z
            .literal(true, { errorMap: () => ({ message: 'You must agree to the Terms of Service' }) }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email'),
});

export const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(128, 'Password must be 128 characters or less')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/\d/, 'Password must contain at least one number'),
        confirmPassword: z
            .string()
            .min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

// ── Course schemas ─────────────────────────────────────────────────────

export const addCourseSchema = z.object({
    name: z
        .string()
        .min(1, 'Course name is required')
        .max(100, 'Course name must be 100 characters or less'),
    code: z
        .string()
        .max(20, 'Course code must be 20 characters or less')
        .optional()
        .or(z.literal('')),
    credits: z
        .coerce.number()
        .min(0.5, 'Credits must be at least 0.5')
        .max(12, 'Credits must be 12 or less'),
    semester: z
        .string()
        .min(1, 'Semester is required'),
    year: z
        .coerce.number()
        .min(2000, 'Year must be 2000 or later')
        .max(2100, 'Year must be 2100 or earlier'),
});

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Validate data against a Zod schema.
 * Returns { success: true, data } or { success: false, errors }.
 * `errors` is a flat object: { fieldName: "error message" }
 */
export function validate(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }

    const errors = {};
    for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        if (!errors[key]) {
            errors[key] = issue.message;
        }
    }
    return { success: false, errors };
}
