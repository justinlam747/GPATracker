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

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');

            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                try {
                    const response = await api.get('/auth/me');
                    if (response.data && response.data.email) {
                        setUser(response.data);
                    } else {
                        throw new Error('Invalid response format: missing user data');
                    }
                } catch (error) {
                    if (error.response?.status === 401) {
                        localStorage.removeItem('token');
                        delete api.defaults.headers.common['Authorization'];
                        setUser(null);
                    } else {
                        throw error;
                    }
                }
            }
        } catch (error) {
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
        } finally {
            setLoading(false);
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
            if (!error.response) {
                return { success: false, message: 'Unable to connect to server. Please check your connection.' };
            }
            const message = error.response.data?.message || 'Login failed. Please try again.';
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
            const { accessToken, user } = response.data;

            localStorage.setItem('token', accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            setUser(user);

            return { success: true };
        } catch (error) {
            if (!error.response) {
                return { success: false, message: 'Unable to connect to server. Please check your connection.' };
            }
            const message = error.response.data?.message || 'Registration failed. Please try again.';
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('cachedUser');
        localStorage.removeItem('lastTokenValidation');

        delete api.defaults.headers.common['Authorization'];

        setUser(null);

        window.location.href = '/';
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
