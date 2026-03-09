import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';
import { resetPasswordSchema, validate } from '../../lib/validators';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(null);

    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            setError('Invalid reset link. Please request a new password reset.');
        } else {
            setTokenValid(true);
        }
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const result = validate(resetPasswordSchema, formData);
        if (!result.success) {
            setFieldErrors(result.errors);
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                token,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            });
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to reset password. Please try again.';
            setError(message);
            if (err.response?.data?.code === 'INVALID_RESET_TOKEN') {
                setTokenValid(false);
            }
        } finally {
            setLoading(false);
        }
    };

    if (tokenValid === false) {
        return (
            <div className="min-h-screen flex">
                <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-sm lg:w-96">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">GPAConnect</h1>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-6">
                                <XCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
                            <p className="text-gray-600 mb-8">This password reset link is invalid or has expired.</p>
                            <div className="space-y-4">
                                <Link to="/forgot-password" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-honolulu_blue hover:bg-blue_green transition-all duration-200">
                                    Request New Reset Link
                                </Link>
                                <Link to="/login" className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200">
                                    Back to Login
                                </Link>
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

    if (isSuccess) {
        return (
            <div className="min-h-screen flex">
                <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-sm lg:w-96">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">GPAConnect</h1>
                        </div>
                        <div className="text-center">
                            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
                            <p className="text-gray-600 mb-8">You will be redirected to the login page shortly.</p>
                            <Link to="/login" className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-honolulu_blue hover:bg-blue_green transition-all duration-200">
                                Go to Login
                            </Link>
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
                        <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
                        <p className="text-gray-600 mt-2">Enter your new password below.</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-10 py-3 border ${fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-honolulu_blue focus:border-transparent transition-colors`}
                                    placeholder="Enter new password"
                                />
                                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-10 py-3 border ${fieldErrors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-honolulu_blue focus:border-transparent transition-colors`}
                                    placeholder="Confirm new password"
                                />
                                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>}
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
                                    'Reset Password'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="text-center">
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

export default ResetPassword;
