import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginSchema, validate } from '../../lib/validators';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

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
        if (loading) return;

        setError('');
        setFieldErrors({});

        // Zod validation
        const result = validate(loginSchema, formData);
        if (!result.success) {
            setFieldErrors(result.errors);
            return;
        }

        setLoading(true);
        try {
            const res = await login(formData.email, formData.password);
            if (res && res.success) {
                navigate('/');
            } else {
                const msg = res?.message || 'Login failed';
                if (msg.includes('Too many')) {
                    setError('Too many login attempts. Please wait a few minutes.');
                } else if (msg.includes('Invalid credentials') || msg.includes('401')) {
                    setError('Invalid email or password.');
                } else {
                    setError(msg);
                }
            }
        } catch (err) {
            if (err.response?.status === 423) {
                setError('Too many login attempts. Please wait a few minutes.');
            } else if (err.response?.status === 401) {
                setError('Invalid email or password.');
            } else {
                setError('Unable to connect to server. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Log in to</h2>
                        <h1 className="text-3xl font-bold text-gray-900 mt-1">GPAConnect</h1>
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
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-3 py-3 border text-md ${fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-honolulu_blue focus:border-transparent transition-colors`}
                                    placeholder="Your Email"
                                />
                            </div>
                            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
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

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-honolulu_blue hover:bg-blue_green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-honolulu_blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    'Log in'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 space-y-4">
                        <div className="text-start">
                            <Link to="/forgot-password" className="text-sm text-honolulu_blue hover:text-blue_green transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                        <div className="text-start">
                            <span className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link to="/register" className="font-medium text-honolulu_blue hover:text-blue_green transition-all duration-200">Sign up</Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

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

export default Login;
