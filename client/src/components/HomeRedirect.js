import React, { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';

const HomeRedirect = () => {
    const { isAuthenticated, loading } = useAuth();
    const [introComplete, setIntroComplete] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIntroComplete(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    if (loading || !introComplete) {
        return (
            <div className="gp-loading-screen" role="status" aria-live="polite">
                <div className="gp-loading-brand">
                    <GraduationCap size={42} aria-hidden="true" />
                    <span>GPAConnect.</span>
                </div>
                <div className="gp-loading-track" aria-hidden="true"><div /></div>
                <p>Your next chapter is loading.</p>
            </div>
        );
    }

    if (isAuthenticated) {
        return <Dashboard />;
    }

    return <LandingPage />;
};

export default HomeRedirect;
