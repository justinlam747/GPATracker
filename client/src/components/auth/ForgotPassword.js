import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/forgot-password', { email });
            console.log('Password reset request successful:', response.data);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Password reset request failed:', error);
            const message = error.response?.data?.message || 'Failed to send reset email. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setEmail(e.target.value);
        if (error) {
            setError('');
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex">
                {/* Left Side - Success Message */}
                <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-sm lg:w-96">
                        {/* Logo/Brand */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">GPAConnect</h1>
                        </div>

                        {/* Success Message */}
                        <div className="text-center">
                            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
                                <Mail className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Check your email
                            </h2>
                            <p className="text-gray-600 mb-8">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                            <div className="space-y-4">
                                <Link
                                    to="/login"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-200"
                                >
                                    Back to login
                                </Link>
                                <p className="text-sm text-gray-600">
                                    Didn't receive the email?{' '}
                                    <button
                                        onClick={() => setIsSubmitted(false)}
                                        className="font-medium text-black hover:text-gray-700 transition-colors"
                                    >
                                        Try again
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Image (Hidden on mobile) */}
                <div className="hidden lg:block relative flex-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-red-500">
                        <div className="absolute inset-0 bg-black opacity-20"></div>
                        <div className="absolute bottom-4 right-4 text-white text-sm opacity-100">
                            <span>GPAConnect</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Forgot Password Form */}
            <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {/* Back Link */}
                    <div className="mb-8">
                        <Link
                            to="/login"
                            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to login
                        </Link>
                    </div>

                    {/* Logo/Brand */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Forgot your password?</h2>
                        <p className="text-gray-600 mt-2">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {/* Forgot Password Form */}
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
                                    value={email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                                    placeholder="Your Email"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    'Send reset email'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Links */}
                    <div className="mt-6">
                        <div className="text-center">
                            <span className="text-sm text-gray-600">
                                Remember your password?{' '}
                                <Link
                                    to="/login"
                                    className="font-medium text-black hover:text-gray-700 transition-colors"
                                >
                                    Sign in
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Image (Hidden on mobile) */}
            <div className="hidden lg:block relative flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-red-500">
                    <div className="absolute inset-0 bg-black opacity-20"></div>
                    <div className="absolute bottom-4 right-4 text-white text-sm opacity-100">
                        <span>GPAConnect</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
