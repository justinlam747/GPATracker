const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { findUser, createUser } = require('../mock-db');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '1h' }
    );

    return { accessToken };
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt for:', email);

        // Check if user exists
        const user = findUser(email);
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // For testing, accept any password
        const isValidPassword = true; // Accept any password for testing

        if (!isValidPassword) {
            console.log('Invalid password for:', email);
            return res.status(401).json({
                message: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Generate tokens
        const { accessToken } = generateTokens(user._id);

        console.log('Login successful for:', email);

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
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        console.log('Registration attempt for:', email);

        // Check if user already exists
        const existingUser = findUser(email);
        if (existingUser) {
            return res.status(409).json({
                message: 'User already exists',
                code: 'USER_EXISTS'
            });
        }

        // Split name into firstName and lastName
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create new user
        const newUser = createUser({
            email,
            password: 'password', // For testing
            firstName,
            lastName,
            gpaScale: '4.0',
            isEmailVerified: true,
            institution: '',
            graduationYear: null
        });

        // Generate tokens
        const { accessToken } = generateTokens(newUser._id);

        console.log('Registration successful for:', email);

        res.status(201).json({
            message: 'User registered successfully',
            token: accessToken,
            user: {
                id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                institution: newUser.institution,
                graduationYear: newUser.graduationYear,
                gpaScale: newUser.gpaScale,
                isEmailVerified: newUser.isEmailVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Server error during registration',
            code: 'REGISTRATION_ERROR'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', (req, res) => {
    try {
        // Simple auth check
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = findUser('kerotku@gmail.com'); // For testing

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
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
        console.error('Get user error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;
