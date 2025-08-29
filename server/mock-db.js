// Simple mock database for testing
const users = [
    {
        _id: '507f1f77bcf86cd799439011',
        email: 'kerotku@gmail.com',
        password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.FLT7M6GdN2KJAzDLRKjdKLFqrpXAIm', // password: "password"
        firstName: 'Test',
        lastName: 'User',
        gpaScale: '4.0',
        isEmailVerified: true,
        institution: '',
        graduationYear: null,
        refreshTokens: []
    }
];

const findUser = (email) => {
    return users.find(user => user.email === email);
};

const createUser = (userData) => {
    const newUser = {
        _id: Date.now().toString(),
        ...userData,
        refreshTokens: []
    };
    users.push(newUser);
    return newUser;
};

module.exports = { findUser, createUser, users };

