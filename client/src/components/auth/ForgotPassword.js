import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import { forgotPasswordSchema, validate } from '../../lib/validators';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const result = validate(forgotPasswordSchema, { email });
        if (!result.success) {
            setFieldErrors(result.errors);
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setIsSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setEmail(e.target.value);
        if (fieldErrors.email) setFieldErrors({});
        if (error) setError('');
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex">
                <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-sm lg:w-96">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">GPAConnect</h1>
                        </div>
                        <div className="text-start">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                            <p className="text-gray-600 mb-8">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                            <div className="space-y-4">
                                <Link
                                    to="/login"
                                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-honolulu_blue hover:bg-blue_green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-honolulu_blue transition-all duration-200"
                                >
                                    Back to login
                                </Link>
                                <p className="text-sm text-gray-600">
                                    Didn't receive the email?{' '}
                                    <button onClick={() => setIsSubmitted(false)} className="font-medium text-honolulu_blue hover:text-blue_green transition-colors">
                                        Try again
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block relative flex-1">
                    <div className="absolute inset-0 bg-honolulu_blue">
                        <div className="absolute inset-0 bg-black opacity-20"></div>
                        <div className="absolute bottom-4 right-4 text-white text-sm opacity-100"><span>GPAConnect</span></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-8">
                        <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to login
                        </Link>
                    </div>
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Forgot your password?</h2>
                        <p className="text-gray-600 mt-2">Enter your email address and we'll send you a link to reset your password.</p>
                    </div>

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
                                    value={email}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-3 py-3 border ${fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-honolulu_blue focus:border-transparent transition-colors`}
                                    placeholder="Your Email"
                                />
                            </div>
                            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-honolulu_blue hover:bg-blue_green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-honolulu_blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    'Send reset email'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="text-start">
                            <span className="text-sm text-gray-600">
                                Remember your password?{' '}
                                <Link to="/login" className="font-medium text-honolulu_blue hover:text-blue_green transition-colors">Sign in</Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="hidden lg:block relative flex-1">
                <div className="absolute inset-0 bg-honolulu_blue">
                    <div className="absolute inset-0 bg-black opacity-20"></div>
                    <div className="absolute bottom-4 right-4 text-white text-sm opacity-100"><span>GPAConnect</span></div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
