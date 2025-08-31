import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Debug user state changes
    useEffect(() => {
        console.log('User state changed:', user ? `Logged in as ${user.email}` : 'No user');
    }, [user]);

    // Debug loading state changes
    useEffect(() => {
        console.log('Loading state changed:', loading);
    }, [loading]);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        console.log('=== AUTH STATUS CHECK START ===');
        try {
            const token = localStorage.getItem('token');
            console.log('Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null');
            console.log('Token length:', token ? token.length : 0);

            if (token) {
                // Set the token in API headers immediately
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                console.log('Token set in headers:', api.defaults.headers.common['Authorization'] ? 'success' : 'failed');

                // Verify the token is still valid
                try {
                    console.log('Calling /auth/me endpoint...');
                    const response = await api.get('/auth/me');
                    console.log('Auth me response status:', response.status);
                    console.log('Auth me response data:', response.data);
                    // Check if response.data contains user information directly
                    if (response.data && response.data.email) {
                        console.log('User data found:', response.data);
                        setUser(response.data);
                        console.log('User set successfully:', response.data.email);
                    } else {
                        console.log('No user data in response, throwing error');
                        throw new Error('Invalid response format: missing user data');
                    }
                } catch (error) {
                    console.log('Auth me error details:', {
                        status: error.response?.status,
                        message: error.message,
                        response: error.response?.data
                    });

                    if (error.response?.status === 401) {
                        // Token expired, clear everything
                        console.log('Token expired (401), clearing auth state');
                        localStorage.removeItem('token');
                        delete api.defaults.headers.common['Authorization'];
                        setUser(null);
                    } else {
                        console.log('Non-401 error, throwing to outer catch');
                        throw error;
                    }
                }
            } else {
                console.log('No token found in localStorage');
            }
        } catch (error) {
            console.log('Outer catch - Token validation failed:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            // Clear invalid token
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
        } finally {
            console.log('Setting loading to false');
            setLoading(false);
            console.log('=== AUTH STATUS CHECK END ===');
        }
    };



    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { accessToken, user } = response.data;

            localStorage.setItem('token', accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            setUser(user);

            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            return { success: false, message };
        }
    };

    const register = async (firstName, email, password, confirmPassword) => {
        try {
            const response = await api.post('/auth/register', {
                firstName,
                email,
                password,
                confirmPassword
            });
            const { accessToken, user } = response.data; // Use accessToken consistently

            // Store token consistently
            localStorage.setItem('token', accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            setUser(user);

            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            return { success: false, message };
        }
    };

    const logout = () => {
        console.log('=== LOGOUT START ===');

        // Clear all auth-related data
        localStorage.removeItem('token');
        localStorage.removeItem('cachedUser');
        localStorage.removeItem('lastTokenValidation');

        // Clear API headers
        delete api.defaults.headers.common['Authorization'];

        // Reset user state
        setUser(null);

        // Force navigation to home page
        window.location.href = '/';

        console.log('=== LOGOUT COMPLETE ===');
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
