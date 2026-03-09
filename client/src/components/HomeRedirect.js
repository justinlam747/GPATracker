import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';

const HomeRedirect = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen bg-white" />;
    }

    if (isAuthenticated) {
        return <Dashboard />;
    }

    return <LandingPage />;
};

export default HomeRedirect;

