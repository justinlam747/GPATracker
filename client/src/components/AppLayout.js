import React from 'react';
import Navbar from './Navbar';

const AppLayout = ({ children, showNavbar = true }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {showNavbar && <Navbar />}
            {children}
        </div>
    );
};

export default AppLayout;
