import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, User, Lock, GraduationCap } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing (optional for better UX)
        if (error) {
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Don't clear error here - let it persist until success or user types

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (!acceptTerms) {
            setError('You must accept the Terms of Service to continue');
            setLoading(false);
            return;
        }

        const result = await register(formData.firstName, formData.email, formData.password, formData.confirmPassword);

        if (result.success) {
            setError(''); // Only clear error on successful registration
            navigate('/');
        } else {
            setError(result.message);
        }

        setLoading(false);
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
                    <h2 className="text-2xl font-bold text-blue-900">Sign up to</h2>
                    <h1 className="text-3xl font-bold text-blue-900 mt-1">GPAConnect</h1>
                </div>

                {/* Register Form */}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    {error && (
                        <div className="alert-error-3d px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-blue-400" />
                            </div>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                autoComplete="given-name"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className="input-3d w-full pl-10 pr-3 py-3 text-md text-blue-900 placeholder-blue-300"
                                placeholder="Your First Name"
                            />
                        </div>
                    </div>

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
                                autoComplete="new-password"
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
                                placeholder="Confirm Password"
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

                    {/* Terms of Service Checkbox */}
                    <div className="flex items-start space-x-3">
                        <div className="flex items-center h-5 mt-1">
                            <input
                                id="acceptTerms"
                                name="acceptTerms"
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-blue-50 border-white/40 rounded focus:ring-blue-500 focus:ring-2"
                                required
                            />
                        </div>
                        <div className="text-sm">
                            <span className="text-blue-400">
                                I agree to the{' '}
                                <Link
                                    to="/terms-of-service"
                                    className="font-medium text-blue-500 hover:text-blue-800 transition-colors"
                                >
                                    Terms of Service
                                </Link>
                                {' '}and{' '}
                                <Link
                                    to="/privacy-policy"
                                    className="font-medium text-blue-500 hover:text-blue-800 transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                            </span>
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
                                'Sign up'
                            )}
                        </button>
                    </div>
                </form>

                {/* Links */}
                <div className="mt-6">
                    <div className="text-start">
                        <span className="text-sm text-blue-400">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-blue-500 hover:text-blue-800 transition-all duration-200"
                            >
                                Log in
                            </Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
