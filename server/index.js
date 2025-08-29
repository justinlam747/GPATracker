const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { applySecurityMiddleware } = require('./middleware/security');
const authRoutes = require('./routes/auth');
const gpaRoutes = require('./routes/gpa');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5000;

// Apply security middleware (Helmet, CORS, rate limiting, etc.)
applySecurityMiddleware(app);

// Logging middleware
app.use(morgan('combined'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gpa-tracker')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gpa', gpaRoutes);
app.use('/api/user', userRoutes);

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
    // Serve static files
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

    // Handle specific error types
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

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation error',
            errors: Object.values(err.errors).map(e => ({
                field: e.path,
                message: e.message
            })),
            code: 'VALIDATION_ERROR'
        });
    }

    if (err.name === 'MongoError' && err.code === 11000) {
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
