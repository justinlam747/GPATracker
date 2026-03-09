import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';

const HomeRedirect = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen relative flex items-center justify-center">
                <div className="landing-bg" aria-hidden="true" />
                <div className="vignette-overlay" aria-hidden="true" />
                <div className="grain-overlay" aria-hidden="true" />
                <div className="relative z-10">
                    <div className="spinner-3d"></div>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Dashboard />;
    }

    return <LandingPage />;
};

export default HomeRedirect;
