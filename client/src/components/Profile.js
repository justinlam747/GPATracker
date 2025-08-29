import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, GraduationCap, Calendar, Save, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile form state
    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        institution: user?.institution || '',
        graduationYear: user?.graduationYear || '',
        gpaScale: user?.gpaScale || 4.0
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const handleProfileChange = (e) => {
        setProfileData({
            ...profileData,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const result = await updateProfile(profileData);
            if (result.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            setLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/user/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Password updated successfully!' });
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.message || 'Failed to update password' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update password' });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords({
            ...showPasswords,
            [field]: !showPasswords[field]
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left side - Page Title */}
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                            <p className="text-sm text-gray-600">Manage your account information and preferences</p>
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

            <div className="max-w-4xl mx-auto px-6 py-6">
                <div className="bg-white rounded-lg shadow">
                    {/* Tabs */}
                    <div className="border-b border-gray-200">

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Profile Information
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'password'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Change Password
                        </button>
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6">
                    {message.text && (
                        <div className={`mb-6 px-4 py-3 rounded-md ${message.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-700'
                            : 'bg-red-50 border border-red-200 text-red-700'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={profileData.firstName}
                                            onChange={handleProfileChange}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={profileData.lastName}
                                            onChange={handleProfileChange}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 mb-6 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        value={user?.email}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                        disabled
                                    />
                                    <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                                </div>
                            </div>




                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-2">
                                        Graduation Year
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="number"
                                            id="graduationYear"
                                            name="graduationYear"
                                            value={profileData.graduationYear}
                                            onChange={handleProfileChange}
                                            min="2000"
                                            max="2030"
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="2025"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                                        Institution
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <GraduationCap className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="institution"
                                            name="institution"
                                            value={profileData.institution}
                                            onChange={handleProfileChange}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="University/College name"
                                        />
                                    </div>
                                </div>

                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? 'text' : 'password'}
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => togglePasswordVisibility('current')}
                                    >
                                        {showPasswords.current ? (
                                            <EyeOff className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            id="newPassword"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => togglePasswordVisibility('new')}
                                        >
                                            {showPasswords.new ? (
                                                <EyeOff className="h-5 w-5 text-gray-400" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => togglePasswordVisibility('confirm')}
                                        >
                                            {showPasswords.confirm ? (
                                                <EyeOff className="h-5 w-5 text-gray-400" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
