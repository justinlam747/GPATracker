import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ResetPassword = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);

    useEffect(() => {
        // Supabase handles the token exchange automatically via the redirect URL.
        // When the user lands on /reset-password from the email link, Supabase's
        // onAuthStateChange fires a PASSWORD_RECOVERY event with a valid session.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'PASSWORD_RECOVERY') {
                    setSessionReady(true);
                }
            }
        );

        // Also check if there's already a session (in case event already fired)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setSessionReady(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) {
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const { error: supabaseError } = await supabase.auth.updateUser({
                password: formData.password,
            });

            if (supabaseError) {
                setError(supabaseError.message);
            } else {
                setIsSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (error) {
            setError('Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!sessionReady && !isSuccess) {
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

                    <div className="text-center">
                        <div className="insight-display mx-auto h-16 w-16 flex items-center justify-center rounded-full mb-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-blue-900 mb-2">
                            Verifying Reset Link
                        </h2>
                        <p className="text-blue-400 mb-8">
                            Please wait while we verify your password reset link...
                        </p>
                        <div className="space-y-4">
                            <Link
                                to="/forgot-password"
                                className="btn-3d-primary w-full flex justify-center py-3 px-4 text-sm font-medium rounded-xl"
                            >
                                Request New Reset Link
                            </Link>
                            <Link
                                to="/login"
                                className="btn-3d-secondary w-full flex justify-center py-3 px-4 text-sm font-medium rounded-xl"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isSuccess) {
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
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-blue-900 mb-2">
                            Password Reset Successful!
                        </h2>
                        <p className="text-blue-400 mb-8">
                            Your password has been successfully reset. You will be redirected to the login page shortly.
                        </p>
                        <Link
                            to="/login"
                            className="btn-3d-primary w-full flex justify-center py-3 px-4 text-sm font-medium rounded-xl"
                        >
                            Go to Login
                        </Link>
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

                {/* Brand */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-blue-900">Reset your password</h2>
                    <p className="text-blue-400 mt-2">
                        Enter your new password below.
                    </p>
                </div>

                {/* Reset Password Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="alert-error-3d px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-blue-900 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-blue-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="input-3d w-full pl-10 pr-10 py-3 text-md text-blue-900 placeholder-blue-300"
                                placeholder="Enter new password"
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
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-900 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-blue-400" />
                            </div>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="input-3d w-full pl-10 pr-10 py-3 text-md text-blue-900 placeholder-blue-300"
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-blue-600 transition-colors"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
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
                                'Reset Password'
                            )}
                        </button>
                    </div>
                </form>

                {/* Links */}
                <div className="mt-6">
                    <div className="text-center">
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

export default ResetPassword;
