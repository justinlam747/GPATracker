import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

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
            console.log('Login result:', result); // Debug log

            if (result && result.success) {
                setError(''); // This will also clear localStorage
                navigate('/');
                return false;
            } else {
                let errorMessage = result?.message || 'Login failed. Please check your credentials.';

                // Handle specific error cases
                if (result?.message?.includes('Too many')) {
                    errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
                } else if (result?.message?.includes('Invalid credentials') || result?.message?.includes('401')) {
                    errorMessage = 'Invalid email or password. Please check your credentials and try again.';
                }

                setError(errorMessage);
                console.log('Login failed:', errorMessage); // Debug log
            }
        } catch (error) {
            console.error('Login error:', error);

            // Check if it's a rate limiting error (423)
            if (error.response?.status === 423) {
                setError('Too many login attempts. Please wait a few minutes before trying again.');
            } else if (error.response?.status === 401) {
                setError('Invalid email or password. Please check your credentials and try again.');
            } else {
                setError('Unable to connect to server. Please check your internet connection and try again.');
            }
        } finally {
            setLoading(false);
        }

        return false; // Prevent any form submission
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {/* Logo/Brand */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Log in to</h2>
                        <h1 className="text-3xl font-bold text-gray-900 mt-1">GPAConnect</h1>
                    </div>





                    {/* Login Form */}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-3 py-3 border text-md border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                                    placeholder="Your Email"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-10 py-3 border text-md border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                                    placeholder="Your Password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <div className="text-start">
                            <span className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link
                                    to="/register"
                                    className="font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                                >
                                    Sign up
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Image (Hidden on mobile) */}
            <div className="hidden lg:block relative flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-100 to-blue-800">
                    <div className="absolute inset-0 bg-black opacity-20"></div>
                    <div className="absolute bottom-4 right-4 text-white text-sm opacity-100">
                        <span>GPAConnect</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
