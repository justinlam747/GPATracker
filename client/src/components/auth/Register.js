import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, User, Lock } from 'lucide-react';
import { registerSchema, validate } from '../../lib/validators';

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
    const [fieldErrors, setFieldErrors] = useState({});
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Zod validation
        const result = validate(registerSchema, { ...formData, agreeToTerms: acceptTerms });
        if (!result.success) {
            setFieldErrors(result.errors);
            return;
        }

        setLoading(true);
        try {
            const res = await register(formData.firstName, formData.email, formData.password, formData.confirmPassword);
            if (res.success) {
                navigate('/');
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError('Unable to connect to server. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (field) =>
        `w-full pl-10 pr-${field === 'firstName' || field === 'email' ? '3' : '10'} py-3 border text-md ${fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-honolulu_blue focus:border-transparent transition-colors`;

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Register Form */}
            <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Sign up to</h2>
                        <h1 className="text-3xl font-bold text-gray-900 mt-1">GPAConnect</h1>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* First Name */}
                        <div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    autoComplete="given-name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={inputClass('firstName')}
                                    placeholder="Your First Name"
                                />
                            </div>
                            {fieldErrors.firstName && <p className="mt-1 text-sm text-red-600">{fieldErrors.firstName}</p>}
                        </div>

                        {/* Email */}
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
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={inputClass('email')}
                                    placeholder="Your Email"
                                />
                            </div>
                            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
                        </div>

                        {/* Password */}
                        <div>
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
                                    className={`w-full pl-10 pr-10 py-3 border text-md ${fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-honolulu_blue focus:border-transparent transition-colors`}
                                    placeholder="Your Password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div>
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
                                    className={`w-full pl-10 pr-10 py-3 border text-md ${fieldErrors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-honolulu_blue focus:border-transparent transition-colors`}
                                    placeholder="Confirm Password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>}
                        </div>

                        {/* Terms of Service */}
                        <div>
                            <div className="flex items-start space-x-3">
                                <div className="flex items-center h-5 mt-1">
                                    <input
                                        id="acceptTerms"
                                        name="acceptTerms"
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => {
                                            setAcceptTerms(e.target.checked);
                                            if (fieldErrors.agreeToTerms) setFieldErrors(prev => ({ ...prev, agreeToTerms: '' }));
                                        }}
                                        className="w-4 h-4 text-honolulu_blue bg-gray-100 border-gray-300 rounded focus:ring-honolulu_blue focus:ring-2"
                                    />
                                </div>
                                <div className="text-sm">
                                    <span className="text-gray-600">
                                        I agree to the{' '}
                                        <Link to="/terms-of-service" className="font-medium text-honolulu_blue hover:text-blue_green transition-colors">Terms of Service</Link>
                                        {' '}and{' '}
                                        <Link to="/privacy-policy" className="font-medium text-honolulu_blue hover:text-blue_green transition-colors">Privacy Policy</Link>
                                    </span>
                                </div>
                            </div>
                            {fieldErrors.agreeToTerms && <p className="mt-1 text-sm text-red-600">{fieldErrors.agreeToTerms}</p>}
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
                                    'Sign up'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="text-start">
                            <span className="text-sm">
                                Already have an account?{' '}
                                <Link to="/login" className="font-medium text-honolulu_blue hover:text-blue_green transition-all duration-200">Log in</Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side */}
            <div className="hidden lg:block relative flex-1">
                <div className="absolute inset-0 bg-honolulu_blue">
                    <div className="absolute inset-0 bg-black opacity-20"></div>
                    <div className="absolute bottom-4 right-4 text-white text-sm opacity-100">
                        <span>GPAConnect</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
