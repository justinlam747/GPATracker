const validate = (schema) => {
    return async (req, res, next) => {
        try {
            // Validate request body
            const validatedData = await schema.parseAsync(req.body);

            // Replace request body with validated data
            req.body = validatedData;

            next();
        } catch (error) {
            if (error.name === 'ZodError') {
                // Log validation errors for debugging
                console.error('Validation failed for:', req.body);
                console.error('Validation errors:', error.errors);

                // Format Zod validation errors
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));

                return res.status(400).json({
                    message: 'Validation failed',
                    errors: formattedErrors,
                    code: 'VALIDATION_ERROR'
                });
            }

            // Handle other errors
            console.error('Validation middleware error:', error);
            return res.status(500).json({
                message: 'Internal validation error',
                code: 'VALIDATION_ERROR'
            });
        }
    };
};

// Validate query parameters
const validateQuery = (schema) => {
    return async (req, res, next) => {
        try {
            const validatedQuery = await schema.parseAsync(req.query);
            req.query = validatedQuery;
            next();
        } catch (error) {
            if (error.name === 'ZodError') {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));

                return res.status(400).json({
                    message: 'Invalid query parameters',
                    errors: formattedErrors,
                    code: 'QUERY_VALIDATION_ERROR'
                });
            }

            console.error('Query validation error:', error);
            return res.status(500).json({
                message: 'Internal query validation error',
                code: 'QUERY_VALIDATION_ERROR'
            });
        }
    };
};

// Validate URL parameters
const validateParams = (schema) => {
    return async (req, res, next) => {
        try {
            const validatedParams = await schema.parseAsync(req.params);
            req.params = validatedParams;
            next();
        } catch (error) {
            if (error.name === 'ZodError') {
                const formattedErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code
                }));

                return res.status(400).json({
                    message: 'Invalid URL parameters',
                    errors: formattedErrors,
                    code: 'PARAMS_VALIDATION_ERROR'
                });
            }

            console.error('Params validation error:', error);
            return res.status(500).json({
                message: 'Internal params validation error',
                code: 'PARAMS_VALIDATION_ERROR'
            });
        }
    };
};

// Sanitize and validate common fields
const sanitizeInput = (req, res, next) => {
    try {
        // Recursively sanitize object
        const sanitize = (obj) => {
            if (typeof obj !== 'object' || obj === null) return obj;

            if (Array.isArray(obj)) {
                return obj.map(sanitize);
            }

            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                // Remove potentially dangerous keys
                if (key.startsWith('__') || key.startsWith('$') || key.includes('prototype')) {
                    continue;
                }

                if (typeof value === 'string') {
                    // Basic XSS protection
                    sanitized[key] = value
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/javascript:/gi, '')
                        .replace(/on\w+\s*=/gi, '')
                        .trim();
                } else if (typeof value === 'object') {
                    sanitized[key] = sanitize(value);
                } else {
                    sanitized[key] = value;
                }
            }

            return sanitized;
        };

        // Sanitize body, query, and params
        if (req.body) req.body = sanitize(req.body);
        if (req.query) req.query = sanitize(req.query);
        if (req.params) req.params = sanitize(req.params);

        next();
    } catch (error) {
        console.error('Sanitization error:', error);
        return res.status(500).json({
            message: 'Input sanitization failed',
            code: 'SANITIZATION_ERROR'
        });
    }
};

module.exports = {
    validate,
    validateQuery,
    validateParams,
    sanitizeInput
};
