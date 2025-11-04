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
    Trash2,
    Lock,
    User
} from 'lucide-react';

const AccountSettings = () => {
    const { user, updateProfile } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Account management state
    const [accountMessage, setAccountMessage] = useState({ type: '', text: '' });
    const [newUsername, setNewUsername] = useState(user?.firstName || '');
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleUsernameUpdate = async (e) => {
        e.preventDefault();
        setAccountMessage({ type: '', text: '' });

        try {
            const result = await updateProfile({ firstName: newUsername });
            if (result.success) {
                setAccountMessage({ type: 'success', text: 'Username updated successfully!' });
            } else {
                setAccountMessage({ type: 'error', text: result.message || 'Failed to update username' });
            }
        } catch (error) {
            setAccountMessage({ type: 'error', text: 'Failed to update username' });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setAccountMessage({ type: '', text: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setAccountMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setAccountMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
            return;
        }

        try {
            // This would need to be implemented in your AuthContext
            setAccountMessage({ type: 'success', text: 'Password change functionality coming soon!' });
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            setAccountMessage({ type: 'error', text: 'Failed to change password' });
        }
    };

    const handleDeleteAccount = async () => {
        setAccountMessage({ type: '', text: '' });

        try {
            // This would need to be implemented in your AuthContext
            setAccountMessage({ type: 'error', text: 'Account deletion functionality coming soon!' });
            setShowDeleteConfirm(false);
        } catch (error) {
            setAccountMessage({ type: 'error', text: 'Failed to delete account' });
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
                            <User className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-xl font-semibold text-gray-900">Account Settings</span>
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
                        <Link
                            to="/settings"
                            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <SettingsIcon className="h-5 w-5" />
                            <span>GPA Settings</span>
                        </Link>
                        <div className="flex items-center space-x-3 px-3 py-2 bg-blue-50 text-black rounded-lg">
                            <User className="h-5 w-5" />
                            <span>Account</span>
                        </div>
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
                  
                    {/* Account Management */}
                    <div className="bg-white rounded-lg shadow border border-gray-200">
                        <div className="p-6">
                            {accountMessage.text && (
                                <div className={`mb-6 px-4 py-3 rounded-md ${accountMessage.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-700'
                                    : 'bg-red-50 border border-red-200 text-red-700'
                                    }`}>
                                    {accountMessage.text}
                                </div>
                            )}

                            {/* User Info Display */}
                            <div className="mb-8 pb-8 border-b border-gray-200">
                                <h3 className="text-md font-medium text-gray-900 mb-4">Account Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm text-gray-500">Email</span>
                                        <p className="text-md text-gray-900">{user?.email}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">First Name</span>
                                        <p className="text-md text-gray-900">{user?.firstName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Change Username */}
                            <div className="mb-8 pb-8 border-b border-gray-200">
                                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                    <User className="h-5 w-5 mr-2 text-gray-600" />
                                    Change Username
                                </h3>
                                <form onSubmit={handleUsernameUpdate} className="space-y-4">
                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="username"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-honolulu_blue focus:ring-2 focus:ring-honolulu_blue/40"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 bg-honolulu_blue text-white rounded-md hover:bg-blue_green focus:outline-none transition-colors"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Update Username
                                    </button>
                                </form>
                            </div>

                            {/* Change Password */}
                            <div className="mb-8 pb-8 border-b border-gray-200">
                                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                    <Lock className="h-5 w-5 mr-2 text-gray-600" />
                                    Change Password
                                </h3>
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    <div>
                                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            id="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-honolulu_blue focus:ring-2 focus:ring-honolulu_blue/40"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-honolulu_blue focus:ring-2 focus:ring-honolulu_blue/40"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-honolulu_blue focus:ring-2 focus:ring-honolulu_blue/40"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 bg-honolulu_blue text-white rounded-md hover:bg-blue_green focus:outline-none transition-colors"
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        Change Password
                                    </button>
                                </form>
                            </div>

                            {/* Delete Account */}
                            <div>
                                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                    <Trash2 className="h-5 w-5 mr-2 text-gray-600" />
                                    Delete Account
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="inline-flex items-center px-4 py-2 bg-honolulu_blue text-white rounded-md hover:bg-blue_green focus:outline-none transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Account
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                            <p className="text-sm text-blue-800 font-medium">
                                                Are you absolutely sure? This action cannot be undone.
                                            </p>
                                        </div>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={handleDeleteAccount}
                                                className="inline-flex items-center px-4 py-2 bg-marian_blue text-white rounded-md hover:bg-federal_blue focus:outline-none transition-colors"
                                            >
                                                Yes, Delete My Account
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
