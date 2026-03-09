import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
            const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (supabaseError) {
                setError(supabaseError.message);
            } else {
                setIsSubmitted(true);
            }
        } catch (error) {
            setError('Failed to send reset email. Please try again.');
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
                        <h1 className="text-3xl font-bold text-blue-900">GPAConnect</h1>
                    </div>

                    {/* Success Message */}
                    <div className="text-start">
                        <h2 className="text-2xl font-bold text-blue-900 mb-2">
                            Check your email
                        </h2>
                        <p className="text-blue-400 mb-8">
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>
                        <div className="space-y-4">
                            <Link
                                to="/login"
                                className="btn-3d-primary w-full flex justify-center py-3 px-4 text-sm font-medium rounded-xl"
                            >
                                Back to login
                            </Link>
                            <p className="text-sm text-blue-400">
                                Didn't receive the email?{' '}
                                <button
                                    onClick={() => setIsSubmitted(false)}
                                    className="font-medium text-blue-500 hover:text-blue-800 transition-colors"
                                >
                                    Try again
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="card-3d-static w-full max-w-md p-8 sm:p-10 rounded-2xl">
                {/* Logo Icon */}
                <div className="flex justify-center mb-6">
                    <div className="icon-3d w-14 h-14 rounded-2xl flex items-center justify-center">
                        <GraduationCap className="h-7 w-7" />
                    </div>
                </div>

                {/* Back Link */}
                <div className="mb-8">
                    <Link
                        to="/login"
                        className="inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-800 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to login
                    </Link>
                </div>

                {/* Brand */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-blue-900">Forgot your password?</h2>
                    <p className="text-blue-400 mt-2">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {/* Forgot Password Form */}
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
                                value={email}
                                onChange={handleChange}
                                className="input-3d w-full pl-10 pr-3 py-3 text-md text-blue-900 placeholder-blue-300"
                                placeholder="Your Email"
                            />
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
                                'Send reset email'
                            )}
                        </button>
                    </div>
                </form>

                {/* Links */}
                <div className="mt-6">
                    <div className="text-start">
                        <span className="text-sm text-blue-400">
                            Remember your password?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-blue-500 hover:text-blue-800 transition-colors"
                            >
                                Sign in
                            </Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
