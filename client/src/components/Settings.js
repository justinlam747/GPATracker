import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Bell, Shield, BarChart3, User, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GRADE_SCALES } from '../utils/scaleConverter';

const Settings = () => {
    const { user, updateUser, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [settings, setSettings] = useState({
        gpaScale: '4.0',
        emailNotifications: true,
        showGpaTrends: true
    });

    useEffect(() => {
        if (user) {
            setSettings({
                gpaScale: user.gpaScale || '4.0',
                emailNotifications: user.emailNotifications !== false,
                showGpaTrends: user.showGpaTrends !== false
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                const data = await response.json();
                updateUser(data.user);
                setSuccess('Settings updated successfully!');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to update settings');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left side - Page Title */}
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10  rounded-lg flex items-center justify-center">
                            <Shield className="h-5 w-5 text-black" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                            <p className="text-sm text-gray-600">Manage your account preferences and GPA settings</p>
                        </div>
                    </div>

                    {/* Right side - Navigation */}
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className="text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-2 text-sm font-medium"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* GPA Settings */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">GPA Settings</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">GPA Scale</label>
                                <select
                                    value={settings.gpaScale}
                                    onChange={(e) => setSettings(prev => ({ ...prev, gpaScale: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="4.0">4.0 Scale</option>
                                    <option value="4.3">4.3 Scale</option>
                                    <option value="percentage">Percentage (%)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    This will change how grades are displayed throughout the site
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <Bell className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                                        Email Notifications
                                    </label>
                                    <p className="text-sm text-gray-500">Receive updates about your academic progress</p>
                                </div>
                                <input
                                    type="checkbox"
                                    id="emailNotifications"
                                    name="emailNotifications"
                                    checked={settings.emailNotifications}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label htmlFor="showGpaTrends" className="text-sm font-medium text-gray-700">
                                        Show GPA Trends
                                    </label>
                                    <p className="text-sm text-gray-500">Display GPA trend analysis on dashboard</p>
                                </div>
                                <input
                                    type="checkbox"
                                    id="showGpaTrends"
                                    name="showGpaTrends"
                                    checked={settings.showGpaTrends}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Privacy Settings */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Data Privacy</h3>
                                <p className="text-sm text-gray-600">
                                    Your academic data is stored securely and is only accessible to you.
                                    We never share your personal information with third parties.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                            ) : (
                                <Save className="h-4 w-4 mr-2 inline" />
                            )}
                            {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
