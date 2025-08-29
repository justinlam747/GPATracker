import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';

const HomeRedirect = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Dashboard />;
    }

    return <LandingPage />;
};

export default HomeRedirect;

