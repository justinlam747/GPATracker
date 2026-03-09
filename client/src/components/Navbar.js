import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, User, LogOut, Home, Calendar } from 'lucide-react';

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
    };

    return (
        <div className="mobile-header-3d px-6 py-4">
            <div className="flex items-center justify-between">
                {/* Left side - Page Title */}
                <div className="flex items-center space-x-4">
                    <div className="icon-3d w-10 h-10 rounded-xl flex items-center justify-center">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-blue-900">{getPageTitle()}</h1>
                        {user && (
                            <p className="text-sm text-blue-400">Welcome back, {user.name || user.email}!</p>
                        )}
                    </div>
                </div>

                {/* Right side - Navigation Links */}
                <div className="flex items-center space-x-6">
                    <Link to="/" className="text-blue-400 hover:text-blue-800 transition-colors flex items-center space-x-2">
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/courses" className="text-blue-400 hover:text-blue-800 transition-colors flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Courses</span>
                    </Link>
                    <Link to="/calendar" className="text-blue-400 hover:text-blue-800 transition-colors flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Calendar</span>
                    </Link>

                    {/* User Menu */}
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 text-blue-400">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{user?.name || user?.email}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 text-blue-400 hover:text-red-500 transition-colors"
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
