import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HelmetProvider } from 'react-helmet-async';   // ⬅️ import this
import HomeRedirect from './components/HomeRedirect';

import CourseDetail from './components/CourseDetail';
import Courses from './components/Courses';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Calendar from './components/Calendar';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import AppLayout from './components/AppLayout';
import Navbar from './components/Navbar';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
    return (
        <HelmetProvider>  {/* ⬅️ wrap your whole app here */}
            <AuthProvider>
                <Router>
                    <Routes>
                        {/* Root route - landing for unauthenticated, dashboard for authenticated */}
                        <Route path="/" element={<HomeRedirect />} />

                        {/* Auth pages */}
                        <Route path="/login" element={<AppLayout showNavbar={false}><Login /></AppLayout>} />
                        <Route path="/register" element={<AppLayout showNavbar={false}><Register /></AppLayout>} />
                        <Route path="/forgot-password" element={<AppLayout showNavbar={false}><ForgotPassword /></AppLayout>} />
                        <Route path="/reset-password" element={<AppLayout showNavbar={false}><ResetPassword /></AppLayout>} />

                        {/* Protected pages */}
                        <Route
                            path="/courses"
                            element={
                                <ProtectedRoute>
                                    <AppLayout showNavbar={false}>
                                        <Courses />
                                    </AppLayout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/course/:id"
                            element={
                                <ProtectedRoute>
                                    <AppLayout showNavbar={false}>
                                        <CourseDetail />
                                    </AppLayout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/calendar"
                            element={
                                <ProtectedRoute>
                                    <AppLayout showNavbar={false}>
                                        <Calendar />
                                    </AppLayout>
                                </ProtectedRoute>
                            }
                        />

                        {/* Legal Pages - Public Access */}
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </HelmetProvider>
    );
}

export default App;
