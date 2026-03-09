import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    // Load error from localStorage on component mount
    React.useEffect(() => {
        const savedError = localStorage.getItem('loginError');
        if (savedError) {
            setError(savedError);
        }
    }, []);

    // Update localStorage whenever error changes
    React.useEffect(() => {
        if (error) {
            localStorage.setItem('loginError', error);
        } else {
            localStorage.removeItem('loginError');
        }
    }, [error]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        const fieldName = e.target.name;

        setFormData({
            ...formData,
            [fieldName]: newValue
        });

        // Only clear error after user has typed at least 2 characters in either field
        if (error && newValue.length >= 2) {
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Prevent multiple submissions
        if (loading) return false;

        setLoading(true);
        // Don't clear error here - let it persist until success or user types

        try {
            const result = await login(formData.email, formData.password);

            if (result && result.success) {
                setError('');
                navigate('/');
                return false;
            } else {
                const msg = result?.message || '';

                let errorMessage;
                if (msg.includes('Invalid login credentials') || msg.includes('Invalid credentials') || msg.includes('401')) {
                    errorMessage = 'Invalid email or password. Please check your credentials and try again.';
                } else if (msg.includes('Email not confirmed')) {
                    errorMessage = 'Please confirm your email address before logging in. Check your inbox for a verification link.';
                } else if (msg.includes('Too many') || msg.includes('rate limit')) {
                    errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
                } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch') || msg.includes('ECONNREFUSED') || msg.includes('NetworkError')) {
                    errorMessage = 'Unable to reach the authentication server. Please check your internet connection and try again.';
                } else {
                    errorMessage = msg || 'Login failed. Please check your credentials.';
                }

                setError(errorMessage);
            }
        } catch (error) {
            console.error('Login error:', error);

            if (error.response?.status === 423) {
                setError('Too many login attempts. Please wait a few minutes before trying again.');
            } else if (error.response?.status === 401) {
                setError('Invalid email or password. Please check your credentials and try again.');
            } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                setError('The server took too long to respond. Please try again.');
            } else {
                setError('Unable to connect to server. Please check your internet connection and try again.');
            }
        } finally {
            setLoading(false);
        }

        return false; // Prevent any form submission
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="card-3d-static w-full max-w-md p-8 sm:p-10 rounded-2xl">
                {/* Logo Icon */}
                <div className="flex justify-center mb-6">
                    <div className="icon-3d w-14 h-14 rounded-2xl flex items-center justify-center">
                        <GraduationCap className="h-7 w-7" />
                    </div>
                </div>

                {/* Brand */}
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-blue-900">Log in to</h2>
                    <h1 className="text-3xl font-bold text-blue-900 mt-1">GPAConnect</h1>
                </div>

                {/* Login Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="alert-error-3d px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-blue-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="input-3d w-full pl-10 pr-3 py-3 text-md text-blue-900 placeholder-blue-300"
                                placeholder="Your Email"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-blue-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="input-3d w-full pl-10 pr-10 py-3 text-md text-blue-900 placeholder-blue-300"
                                placeholder="Your Password"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-blue-600 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-3d-primary w-full flex justify-center py-3 px-4 text-sm font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                'Log in'
                            )}
                        </button>
                    </div>
                </form>

                {/* Links */}
                <div className="mt-6 space-y-4">
                    <div className="text-start">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-blue-500 hover:text-blue-800 transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <div className="text-start">
                        <span className="text-sm text-blue-400">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="font-medium text-blue-500 hover:text-blue-800 transition-all duration-200"
                            >
                                Sign up
                            </Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
