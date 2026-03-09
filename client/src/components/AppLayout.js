import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles } from 'lucide-react';
import Navbar from './Navbar';

const AppLayout = ({ children, showNavbar = true }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const showChatFab = isAuthenticated && location.pathname !== '/chat';

    return (
        <div className="min-h-screen bg-gray-50">
            {showNavbar && <Navbar />}
            {children}
            {showChatFab && (
                <Link
                    to="/chat"
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-honolulu_blue to-pacific_cyan text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-50"
                    title="GPA Buddy"
                >
                    <Sparkles className="h-6 w-6" />
                </Link>
            )}
        </div>
    );
};

export default AppLayout;
