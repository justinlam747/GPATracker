import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Settings as SettingsIcon,
    GraduationCap,
    Save,
    ArrowLeft,
    BarChart3,
    BookOpen,
    Calendar,
    X,
    Menu,
    User
} from 'lucide-react';

const Settings = () => {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [gpaScale, setGpaScale] = useState(user?.gpaScale || '4.0');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const result = await updateProfile({ gpaScale });
            if (result.success) {
                setMessage({ type: 'success', text: 'GPA scale updated successfully! Your GPA will now display using the selected scale.' });
            } else {
                setMessage({ type: 'error', text: result.message || 'Failed to update settings' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update settings' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen lg:h-screen bg-gray-50 lg:overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <SettingsIcon className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-xl font-semibold text-gray-900">Settings</span>
                    </div>
                    <Link
                        to="/"
                        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:h-screen">
                {/* Left Sidebar */}
                <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 min-h-screen lg:min-h-full lg:max-h-screen lg:overflow-y-auto lg:sticky lg:top-0 p-4 lg:p-6 transition-transform duration-300 ease-in-out lg:transition-none flex flex-col`}>
                    {/* Mobile Close Button */}
                    <div className="lg:hidden flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-black" />
                            </div>
                            <span className="text-xl font-semibold text-gray-900">GPAConnect</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Logo - hidden on mobile since it's in the header */}
                    <div className="hidden lg:flex items-center space-x-2 my-8">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-xl font-semibold text-gray-900">GPAConnect</span>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-2 mb-6">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">NAVIGATION</div>
                        <Link
                            to="/"
                            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <BarChart3 className="h-5 w-5" />
                            <span>Dashboard</span>
                        </Link>
                        <Link
                            to="/courses"
                            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <BookOpen className="h-5 w-5" />
                            <span>Courses</span>
                        </Link>
                        <Link
                            to="/calendar"
                            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <Calendar className="h-5 w-5" />
                            <span>Calendar</span>
                        </Link>
                        <div className="flex items-center space-x-3 px-3 py-2 bg-blue-50 text-black rounded-lg">
                            <SettingsIcon className="h-5 w-5" />
                            <span>GPA Settings</span>
                        </div>
                        <Link
                            to="/account"
                            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <User className="h-5 w-5" />
                            <span>Account</span>
                        </Link>
                    </nav>

                    <div className="mt-auto pt-6 border-t border-gray-200">
                        <Link
                            to="/"
                            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors w-full"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Back to Dashboard</span>
                        </Link>
                    </div>
                </div>

                {/* Overlay for mobile sidebar */}
                {sidebarOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    

                    {/* Settings Form */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">GPA Scale Preferences</h2>

                            {message.text && (
                                <div className={`mb-6 px-4 py-3 rounded-md ${message.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-700'
                                    : 'bg-red-50 border border-red-200 text-red-700'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="gpaScale" className="block text-sm font-medium text-gray-700 mb-2">
                                        GPA Scale
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <GraduationCap className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <select
                                            id="gpaScale"
                                            name="gpaScale"
                                            value={gpaScale}
                                            onChange={(e) => setGpaScale(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-honolulu_blue"
                                        >
                                            <option value="4.0">4.0 Scale (Standard)</option>
                                            <option value="4.3">4.3 Scale (A+ = 4.3)</option>
                                            <option value="letter">Letter Grades (A, B, C, etc.)</option>
                                            <option value="percentage">Percentage (0-100)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center px-6 py-2 bg-honolulu_blue text-white rounded-md hover:bg-blue_green focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {loading ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Scale Comparison Table */}
                    <div className="bg-white rounded-lg shadow border border-gray-200">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">GPA Scale Comparison</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">4.0 Scale</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">4.3 Scale</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Letter Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        <tr><td className="px-4 py-2 text-sm text-gray-900">97-100</td><td className="px-4 py-2 text-sm text-gray-700">4.0</td><td className="px-4 py-2 text-sm text-gray-700">4.3</td><td className="px-4 py-2 text-sm text-gray-700">A+</td></tr>
                                        <tr><td className="px-4 py-2 text-sm text-gray-900">93-96</td><td className="px-4 py-2 text-sm text-gray-700">4.0</td><td className="px-4 py-2 text-sm text-gray-700">4.0</td><td className="px-4 py-2 text-sm text-gray-700">A</td></tr>
                                        <tr><td className="px-4 py-2 text-sm text-gray-900">90-92</td><td className="px-4 py-2 text-sm text-gray-700">3.7</td><td className="px-4 py-2 text-sm text-gray-700">3.7</td><td className="px-4 py-2 text-sm text-gray-700">A-</td></tr>
                                        <tr><td className="px-4 py-2 text-sm text-gray-900">87-89</td><td className="px-4 py-2 text-sm text-gray-700">3.3</td><td className="px-4 py-2 text-sm text-gray-700">3.3</td><td className="px-4 py-2 text-sm text-gray-700">B+</td></tr>
                                        <tr><td className="px-4 py-2 text-sm text-gray-900">83-86</td><td className="px-4 py-2 text-sm text-gray-700">3.0</td><td className="px-4 py-2 text-sm text-gray-700">3.0</td><td className="px-4 py-2 text-sm text-gray-700">B</td></tr>
                                        <tr><td className="px-4 py-2 text-sm text-gray-900">80-82</td><td className="px-4 py-2 text-sm text-gray-700">2.7</td><td className="px-4 py-2 text-sm text-gray-700">2.7</td><td className="px-4 py-2 text-sm text-gray-700">B-</td></tr>
                                        <tr><td className="px-4 py-2 text-sm text-gray-900">77-79</td><td className="px-4 py-2 text-sm text-gray-700">2.3</td><td className="px-4 py-2 text-sm text-gray-700">2.3</td><td className="px-4 py-2 text-sm text-gray-700">C+</td></tr>
                                        <tr><td className="px-4 py-2 text-sm text-gray-700">73-76</td><td className="px-4 py-2 text-sm text-gray-700">2.0</td><td className="px-4 py-2 text-sm text-gray-700">2.0</td><td className="px-4 py-2 text-sm text-gray-700">C</td></tr>
                                        <tr><td className="px-4 py-2 text-sm text-gray-900">70-72</td><td className="px-4 py-2 text-sm text-gray-700">1.7</td><td className="px-4 py-2 text-sm text-gray-700">1.7</td><td className="px-4 py-2 text-sm text-gray-700">C-</td></tr>
                                        <tr><td className="px-4 py-2 text-sm text-gray-900">Below 70</td><td className="px-4 py-2 text-sm text-gray-700">≤ 1.3</td><td className="px-4 py-2 text-sm text-gray-700">≤ 1.3</td><td className="px-4 py-2 text-sm text-gray-700">D/F</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
