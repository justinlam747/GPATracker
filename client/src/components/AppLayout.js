import React from 'react';

const AppLayout = ({ children, showNavbar = true }) => {
    return (
        <div className="min-h-screen relative">
            <div className="landing-bg" aria-hidden="true" />
            <div className="vignette-overlay" aria-hidden="true" />
            <div className="grain-overlay" aria-hidden="true" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};

export default AppLayout;
