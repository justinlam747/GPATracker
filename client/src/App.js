import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HelmetProvider } from 'react-helmet-async';
import HomeRedirect from './components/HomeRedirect';
import AppLayout from './components/AppLayout';
import './App.css';

// Route-level code splitting — these load only when navigated to
const CourseDetail = lazy(() => import('./components/CourseDetail'));
const Courses = lazy(() => import('./components/Courses'));
const Login = lazy(() => import('./components/auth/Login'));
const Register = lazy(() => import('./components/auth/Register'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword'));
const Calendar = lazy(() => import('./components/Calendar'));
const Settings = lazy(() => import('./components/Settings'));
const AccountSettings = lazy(() => import('./components/AccountSettings'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TranscriptImport = lazy(() => import('./components/TranscriptImport'));
const SyllabusImport = lazy(() => import('./components/SyllabusImport'));
const CourseSchemaSearch = lazy(() => import('./components/CourseSchemaSearch'));
const ChatAgent = lazy(() => import('./components/ChatAgent'));

// Loading fallback — blank screen to avoid flash of spinner
const PageLoader = () => (
    <div className="min-h-screen bg-white" />
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return <PageLoader />;
    return isAuthenticated ? children : <Navigate to="/" />;
};

function App() {
    return (
        <HelmetProvider>
            <AuthProvider>
                <Router>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/" element={<HomeRedirect />} />

                            {/* Auth pages */}
                            <Route path="/login" element={<AppLayout showNavbar={false}><Login /></AppLayout>} />
                            <Route path="/register" element={<AppLayout showNavbar={false}><Register /></AppLayout>} />
                            <Route path="/forgot-password" element={<AppLayout showNavbar={false}><ForgotPassword /></AppLayout>} />
                            <Route path="/reset-password" element={<AppLayout showNavbar={false}><ResetPassword /></AppLayout>} />

                            {/* Protected pages */}
                            <Route path="/courses" element={<ProtectedRoute><AppLayout showNavbar={false}><Courses /></AppLayout></ProtectedRoute>} />
                            <Route path="/course/:id" element={<ProtectedRoute><AppLayout showNavbar={false}><CourseDetail /></AppLayout></ProtectedRoute>} />
                            <Route path="/calendar" element={<ProtectedRoute><AppLayout showNavbar={false}><Calendar /></AppLayout></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><AppLayout showNavbar={false}><Settings /></AppLayout></ProtectedRoute>} />
                            <Route path="/account" element={<ProtectedRoute><AppLayout showNavbar={false}><AccountSettings /></AppLayout></ProtectedRoute>} />

                            {/* Import tools */}
                            <Route path="/import/transcript" element={<ProtectedRoute><AppLayout showNavbar={false}><TranscriptImport /></AppLayout></ProtectedRoute>} />
                            <Route path="/import/syllabus" element={<ProtectedRoute><AppLayout showNavbar={false}><SyllabusImport /></AppLayout></ProtectedRoute>} />
                            <Route path="/import/syllabus/:courseId" element={<ProtectedRoute><AppLayout showNavbar={false}><SyllabusImport /></AppLayout></ProtectedRoute>} />
                            <Route path="/import/templates" element={<ProtectedRoute><AppLayout showNavbar={false}><CourseSchemaSearch /></AppLayout></ProtectedRoute>} />
                            <Route path="/import/templates/:courseId" element={<ProtectedRoute><AppLayout showNavbar={false}><CourseSchemaSearch /></AppLayout></ProtectedRoute>} />

                            {/* AI Agent */}
                            <Route path="/chat" element={<ProtectedRoute><AppLayout showNavbar={false}><ChatAgent /></AppLayout></ProtectedRoute>} />

                            {/* Legal Pages */}
                            <Route path="/terms-of-service" element={<TermsOfService />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        </Routes>
                    </Suspense>
                </Router>
            </AuthProvider>
        </HelmetProvider>
    );
}

export default App;
