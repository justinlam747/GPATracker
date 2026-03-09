import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, GraduationCap, Calendar, Save, Eye, EyeOff, ArrowLeft } from 'lucide-react';

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
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
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
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) {
                setMessage({ type: 'error', text: error.message || 'Failed to update password' });
            } else {
                setMessage({ type: 'success', text: 'Password updated successfully!' });
                setPasswordData({
                    newPassword: '',
                    confirmPassword: ''
                });
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
        <div className="min-h-screen">
            {/* Header */}
            <div className="mobile-header-3d px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left side - Page Title */}
                    <div className="flex items-center space-x-4">
                        <div className="icon-3d w-10 h-10 rounded-xl flex items-center justify-center">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-blue-900">Profile Settings</h1>
                            <p className="text-sm text-blue-400">Manage your account information and preferences</p>
                        </div>
                    </div>

                    {/* Right side - Navigation */}
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className="text-blue-400 hover:text-blue-800 transition-colors flex items-center space-x-2 text-sm font-medium"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-6">
                <div className="card-3d-static rounded-xl">
                    {/* Tabs */}
                    <div className="border-b border-white/40">

                {/* Tabs */}
                <div className="border-b border-white/40">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-blue-400 hover:text-blue-600 hover:border-blue-300'
                                }`}
                        >
                            Profile Information
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'password'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-blue-400 hover:text-blue-600 hover:border-blue-300'
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
                            ? 'alert-success-3d'
                            : 'alert-error-3d'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <form onSubmit={handleProfileSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-blue-900 mb-2">
                                        First Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={profileData.firstName}
                                            onChange={handleProfileChange}
                                            className="input-3d w-full pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-blue-900 mb-2">
                                        Last Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={profileData.lastName}
                                            onChange={handleProfileChange}
                                            className="input-3d w-full pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-blue-900 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 mb-6 text-blue-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        value={user?.email}
                                        className="input-3d w-full pl-10 bg-blue-50/30 text-blue-400"
                                        disabled
                                    />
                                    <p className="mt-1 text-sm text-blue-300">Email cannot be changed</p>
                                </div>
                            </div>




                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="graduationYear" className="block text-sm font-medium text-blue-900 mb-2">
                                        Graduation Year
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <input
                                            type="number"
                                            id="graduationYear"
                                            name="graduationYear"
                                            value={profileData.graduationYear}
                                            onChange={handleProfileChange}
                                            min="2000"
                                            max="2030"
                                            className="input-3d w-full pl-10"
                                            placeholder="2025"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="institution" className="block text-sm font-medium text-blue-900 mb-2">
                                        Institution
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <GraduationCap className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="institution"
                                            name="institution"
                                            value={profileData.institution}
                                            onChange={handleProfileChange}
                                            className="input-3d w-full pl-10"
                                            placeholder="University/College name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="gpaScale" className="block text-sm font-medium text-blue-900 mb-2">
                                    GPA Scale
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <GraduationCap className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <select
                                        id="gpaScale"
                                        name="gpaScale"
                                        value={profileData.gpaScale}
                                        onChange={handleProfileChange}
                                        className="input-3d w-full pl-10"
                                    >
                                        <option value="4.0">4.0 Scale (Standard)</option>
                                        <option value="4.3">4.3 Scale (A+ = 4.3)</option>
                                        <option value="letter">Letter Grades (A, B, C, etc.)</option>
                                        <option value="percentage">Percentage (0-100)</option>
                                    </select>
                                </div>
                                <p className="mt-1 text-sm text-blue-300">
                                    Choose how you want to see your GPA displayed. Assignments will always be in percentage.
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-3d-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-blue-900 mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            id="newPassword"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className="input-3d w-full pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => togglePasswordVisibility('new')}
                                        >
                                            {showPasswords.new ? (
                                                <EyeOff className="h-5 w-5 text-blue-400" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-blue-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-900 mb-2">
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="input-3d w-full pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => togglePasswordVisibility('confirm')}
                                        >
                                            {showPasswords.confirm ? (
                                                <EyeOff className="h-5 w-5 text-blue-400" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-blue-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-3d-primary inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
