import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    await fetchProfile(session);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                } else if (event === 'TOKEN_REFRESHED' && session) {
                    // Session refreshed, update profile if needed
                    await fetchProfile(session);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const buildFallbackUser = (session) => ({
        id: session?.user?.id || '',
        email: session?.user?.email || '',
        firstName: session?.user?.user_metadata?.first_name || '',
        lastName: session?.user?.user_metadata?.last_name || '',
        gpaScale: '4.0',
    });

    const fetchProfile = async (session) => {
        try {
            // Get user profile from our Worker API
            const response = await api.get('/auth/me', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (response.data && response.data.email) {
                setUser(response.data);
            } else {
                setUser(buildFallbackUser(session));
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setUser(buildFallbackUser(session));
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, message: error.message };
            }

            if (data.session) {
                await fetchProfile(data.session);
            }

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message || 'Login failed' };
        }
    };

    const register = async (firstName, email, password, confirmPassword) => {
        if (password !== confirmPassword) {
            return { success: false, message: 'Passwords do not match' };
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                    },
                },
            });

            if (error) {
                return { success: false, message: error.message };
            }

            if (data.session) {
                await fetchProfile(data.session);
            }

            return { success: true };
        } catch (error) {
            return { success: false, message: error.message || 'Registration failed' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        window.location.href = '/';
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await api.put('/user/profile', profileData);
            if (response.data && response.data.user) {
                setUser(response.data.user);
                return { success: true };
            }
            return { success: false, message: 'Failed to update profile' };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update profile',
            };
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        updateProfile,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
