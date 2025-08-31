import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Plus, User, LogOut, Home, Calendar } from 'lucide-react';

const Navbar = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/':
                return 'Academic Dashboard';
            case '/courses':
                return 'Courses';
            case '/calendar':
                return 'Calendar';
            case '/course':
                return 'Course Details';
            default:
                return 'Dashboard';
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Left side - Page Title */}
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                        {user && (
                            <p className="text-sm text-gray-600">Welcome back, {user.name || user.email}!</p>
                        )}
                    </div>
                </div>

                {/* Right side - Navigation Links */}
                <div className="flex items-center space-x-6">
                    <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-2">
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/courses" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Courses</span>
                    </Link>
                    <Link to="/calendar" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Calendar</span>
                    </Link>

                    {/* User Menu */}
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 text-gray-700">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{user?.name || user?.email}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
