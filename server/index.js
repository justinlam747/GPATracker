const express = require('express');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { pool } = require('./db/pool');
const { migrate } = require('./db/migrate');
const { applySecurityMiddleware } = require('./middleware/security');
const authRoutes = require('./routes/auth');
const gpaRoutes = require('./routes/gpa');
const userRoutes = require('./routes/user');
const importRoutes = require('./routes/import');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5000;

// Apply security middleware (Helmet, CORS, rate limiting, etc.)
applySecurityMiddleware(app);

// Logging middleware
app.use(morgan('combined'));

// Database connection + migration
(async () => {
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL successfully');
        client.release();
        await migrate();
    } catch (err) {
        console.error('❌ PostgreSQL connection error:', err.message);
        console.error('Please check:');
        console.error('1. DATABASE_URL environment variable is set');
        console.error('2. PostgreSQL server is running');
        console.error('3. Database credentials are correct');
        console.error('4. Network/firewall allows connection');
    }
})();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gpa', gpaRoutes);
app.use('/api/user', userRoutes);
app.use('/api/import', importRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'GPA Tracker API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
}

// API 404 handler - only for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        message: 'API route not found',
        code: 'API_ROUTE_NOT_FOUND'
    });
});

// Serve React app for any non-API routes (this should be last)
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    console.error('Error stack:', err.stack);

    if (err.name === 'PasswordStrengthError') {
        return res.status(400).json({
            message: err.message,
            code: 'PASSWORD_TOO_WEAK'
        });
    }

    if (err.name === 'PasswordReuseError') {
        return res.status(400).json({
            message: err.message,
            code: 'PASSWORD_REUSE'
        });
    }

    // Handle Postgres unique constraint violation
    if (err.code === '23505') {
        return res.status(409).json({
            message: 'Duplicate key error',
            code: 'DUPLICATE_KEY'
        });
    }

    // Default error response
    res.status(500).json({
        message: process.env.NODE_ENV === 'development' ? 'Internal server error' : err.message,
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔒 Security features enabled`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
