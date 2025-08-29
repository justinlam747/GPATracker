import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import {
    TrendingUp,
    BookOpen,
    Target,
    BarChart3,
    Shield,
    Zap,
    ArrowRight,
    CheckCircle,
    Star,
    GraduationCap,
    LogOut,
    X
} from 'lucide-react';

const LandingPage = () => {
    const { isAuthenticated, logout } = useAuth();
    const [animate, setAnimate] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        setAnimate(true);
    }, []);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (mobileMenuOpen && !event.target.closest('header')) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [mobileMenuOpen]);

    const features = [
        {
            icon: <TrendingUp className="h-6 w-6" />,
            title: "Real-time GPA Tracking",
            description: "Monitor your academic performance with instant calculations and trend analysis."
        },
        {
            icon: <BookOpen className="h-6 w-6" />,
            title: "Course Management",
            description: "Organize courses by semester and track assignments efficiently."
        },
        {
            icon: <Target className="h-6 w-6" />,
            title: "Final Grade Prediction",
            description: "Tools to predict your final grade based on your current GPA and course performance."
        },
        {
            icon: <BarChart3 className="h-6 w-6" />,
            title: "Visual Analytics",
            description: "Beautiful charts and graphs to visualize your performance."
        },
        {
            icon: <Shield className="h-6 w-6" />,
            title: "Secure & Private",
            description: "Enterprise-grade security protecting your academic data."
        },
        {
            icon: <Zap className="h-6 w-6" />,
            title: "Instant Insights",
            description: "Get immediate feedback on your academic standing."
        }
    ];

    const partnerLogos = [
        {
            name: "University of Toronto",
            logo: "🏛️",
            color: "from-blue-600 to-blue-800",
            bgColor: "from-blue-50 to-blue-100"
        },
        {
            name: "McGill University",
            logo: "🍁",
            color: "from-red-600 to-red-800",
            bgColor: "from-red-50 to-red-100"
        },
        {
            name: "UBC",
            logo: "🌊",
            color: "from-blue-500 to-blue-700",
            bgColor: "from-blue-50 to-blue-100"
        },
        {
            name: "University of Alberta",
            logo: "🏔️",
            color: "from-green-600 to-green-800",
            bgColor: "from-green-50 to-green-100"
        },
        {
            name: "Western University",
            logo: "🦁",
            color: "from-purple-600 to-purple-800",
            bgColor: "from-purple-50 to-purple-100"
        },
        {
            name: "Queen's University",
            logo: "👑",
            color: "from-yellow-600 to-yellow-800",
            bgColor: "from-yellow-50 to-yellow-100"
        },
        {
            name: "University of Waterloo",
            logo: "💧",
            color: "from-cyan-600 to-cyan-800",
            bgColor: "from-cyan-50 to-cyan-100"
        },
        {
            name: "McMaster University",
            logo: "🔬",
            color: "from-indigo-600 to-indigo-800",
            bgColor: "from-indigo-50 to-indigo-100"
        },
        {
            name: "University of Ottawa",
            logo: "🏛️",
            color: "from-red-500 to-red-700",
            bgColor: "from-red-50 to-red-100"
        },
        {
            name: "Carleton University",
            logo: "🦅",
            color: "from-orange-600 to-orange-800",
            bgColor: "from-orange-50 to-orange-100"
        },
        {
            name: "York University",
            logo: "🦁",
            color: "from-red-600 to-red-800",
            bgColor: "from-red-50 to-red-100"
        },
        {
            name: "Ryerson University",
            logo: "🎓",
            color: "from-blue-600 to-blue-800",
            bgColor: "from-blue-50 to-blue-100"
        },
        {
            name: "University of Guelph",
            logo: "🐄",
            color: "from-green-600 to-green-800",
            bgColor: "from-green-50 to-green-100"
        },
        {
            name: "University of Windsor",
            logo: "🌹",
            color: "from-pink-600 to-pink-800",
            bgColor: "from-pink-50 to-pink-100"
        },
        {
            name: "University of Manitoba",
            logo: "🐻",
            color: "from-amber-600 to-amber-800",
            bgColor: "from-amber-50 to-amber-100"
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* SEO Metadata */}
            <Helmet>
                <title>GPAConnect | GPA Calculator & Academic Progress Tracker</title>
                <meta
                    name="description"
                    content="Track your GPA, predict final grades, and manage your courses with GPAConnect. A real-time GPA calculator and academic progress tracker built for students."
                />
                <meta
                    name="keywords"
                    content="GPA calculator, GPA tracker, grade predictor, academic progress tracker, student GPA tool"
                />
                <meta property="og:title" content="GPAConnect - GPA Calculator & Tracker" />
                <meta property="og:description" content="Track GPA, manage courses, and predict final grades with GPAConnect." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://yourdomain.com" />
            </Helmet>

            {/* Header */}
            <header className="relative border-b border-gray-200">
                {/* Soft glow with noise effect */}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-black" />
                            </div>
                            <span className="text-lg sm:text-xl font-semibold text-gray-900">GPAConnect</span>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center space-x-8 text-sm text-gray-600" aria-label="Main navigation">
                            <button
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="hover:text-blue-600 transition-colors cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                className="hover:text-blue-600 transition-colors cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50"
                            >
                                How It Works
                            </button>

                        </nav>

                        {/* Auth */}
                        <div className="hidden sm:flex items-center space-x-4">
                            {!isAuthenticated ? (
                                <>
                                    <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                                        Log in
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:shadow-lg"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <Link to="/courses" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                                        My Courses
                                    </Link>
                                    <Link
                                        to="/"
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg"
                                    >
                                        Go to GPA Dashboard
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 border border-gray-300 rounded-lg"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-200">
                    <div className="px-4 py-6 space-y-4">
                        <nav className="space-y-3">
                            <button
                                onClick={() => {
                                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                                    setMobileMenuOpen(false);
                                }}
                                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => {
                                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                                    setMobileMenuOpen(false);
                                }}
                                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                How It Works
                            </button>
                            <Link
                                to="/courses"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                Courses
                            </Link>
                            <Link
                                to="/calendar"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                            >
                                Calendar
                            </Link>
                        </nav>

                        {/* Mobile Auth Buttons */}
                        {!isAuthenticated ? (
                            <div className="pt-4 border-t border-gray-200 space-y-3">
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-center px-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md hover:shadow-lg transition-all duration-200"
                                >
                                    Start Tracking GPA
                                </Link>
                            </div>
                        ) : (
                            <div className="pt-4 border-t border-gray-200 space-y-3">
                                <Link
                                    to="/courses"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-center px-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    My Courses
                                </Link>
                                <Link
                                    to="/"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md hover:shadow-lg transition-all duration-200"
                                >
                                    Go to GPA Dashboard
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="block w-full text-center px-4 py-2 text-base font-medium text-gray-700 hover:text-red-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <main>
                {/* Hero with checkered background */}
                <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden text-center" aria-labelledby="hero-title">
                    {/* Soft glow with noise effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.15)_0%,_transparent_70%)] [mask-image:url('data:image/svg+xml,%3Csvg%20width%3D%22100%25%22%20height%3D%22100%25%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.65%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22/%3E%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%221%200%200%200%200%200%201%200%200%200%200%200%201%200%200%200%200%200%200%200.1%200%22/%3E%3C/filter%3E%3C/defs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url%28%23noise%29%22%20opacity%3D%220.3%22/%3E%3C/svg%3E')]"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium mb-6 sm:mb-8 transition ${animate ? 'opacity-100' : 'opacity-0'}`}>
                            <Zap className="h-3 w-3 mr-2" />
                            BETA
                        </div>

                        <h1 id="hero-title" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-4">
                            GPA Calculator & Academic Progress Tracker
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
                            GPAConnect helps students track GPA in real-time, predict grades, and manage courses with ease.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                            {!isAuthenticated ? (
                                <>
                                    <Link
                                        to="/register"
                                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl"
                                    >
                                        Start GPA Tracking <ArrowRight className="ml-2 h-5 w-5 inline" />
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-blue-600 hover:text-blue-600"
                                    >
                                        Sign In
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    to="/courses"
                                    className="px-8 py-4 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50"
                                >
                                    View My GPA Tracker
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Floating stat circles */}
                    <div className="absolute top-8 left-4 sm:top-20 sm:left-10">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                            A+
                        </div>
                    </div>
                    <div className="absolute top-16 right-4 sm:top-32 sm:right-20">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                            4.0
                        </div>
                    </div>
                    <div className="absolute top-24 left-16 sm:top-48 sm:left-32">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                            95%
                        </div>
                    </div>
                    <div className="absolute top-20 right-16 sm:top-36 sm:right-48">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                            A
                        </div>
                    </div>
                </section>

                {/* University Carousel */}
                <section className="relative py-12 sm:py-16 bg-white overflow-hidden">
                    {/* Soft glow with noise effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.1)_0%,_transparent_70%)] [mask-image:url('data:image/svg+xml,%3Csvg%20width%3D%22100%25%22%20height%3D%22100%25%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%222%22%20stitchTiles%3D%22stitch%22/%3E%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%221%200%200%200%200%200%201%200%200%200%200%200%201%200%200%200%200%200%200%200.08%200%22/%3E%3C/filter%3E%3C/defs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url%28%23noise%29%22%20opacity%3D%220.4%22/%3E%3C/svg%3E')]"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-8 sm:mb-12">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
                                Trusted by Students at Top Universities
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                                Join thousands of students from leading institutions who trust GPAConnect for their academic success
                            </p>
                        </div>

                        <div className="relative overflow-hidden">
                            {/* Gradient overlays for smooth fade effect */}
                            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>

                            {/* Container to center the carousel */}
                            <div className="flex justify-center">
                                {/* Infinite scrolling carousel with 3 sets for seamless loop */}
                                <div className="flex animate-scroll">
                                    {/* First set of universities */}
                                    {partnerLogos.map((university, index) => (
                                        <div key={`first-${index}`} className="flex-shrink-0 mx-2 sm:mx-4">
                                            <div className={`w-36 h-24 sm:w-48 sm:h-32 bg-gradient-to-br ${university.bgColor} rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 group`}>
                                                <div className={`w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br ${university.color} rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 text-lg sm:text-2xl`}>
                                                    {university.logo}
                                                </div>
                                                <span className="text-xs sm:text-sm font-semibold text-gray-700 text-center px-2 sm:px-3 leading-tight">
                                                    {university.name}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Second set for seamless loop */}
                                    {partnerLogos.map((university, index) => (
                                        <div key={`second-${index}`} className="flex-shrink-0 mx-2 sm:mx-4">
                                            <div className={`w-36 h-24 sm:w-48 sm:h-32 bg-gradient-to-br ${university.bgColor} rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 group`}>
                                                <div className={`w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br ${university.color} rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 text-lg sm:text-2xl`}>
                                                    {university.logo}
                                                </div>
                                                <span className="text-xs sm:text-sm font-semibold text-gray-700 text-center px-2 sm:px-3 leading-tight">
                                                    {university.name}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Third set for seamless loop */}
                                    {partnerLogos.map((university, index) => (
                                        <div key={`third-${index}`} className="flex-shrink-0 mx-2 sm:mx-4">
                                            <div className={`w-36 h-24 sm:w-48 sm:h-32 bg-gradient-to-br ${university.bgColor} rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border border-gray-200 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 group`}>
                                                <div className={`w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br ${university.color} rounded-full flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 text-lg sm:text-2xl`}>
                                                    {university.logo}
                                                </div>
                                                <span className="text-xs sm:text-sm font-semibold text-gray-700 text-center px-2 sm:px-3 leading-tight">
                                                    {university.name}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="relative py-16 sm:py-20 bg-gray-50" aria-labelledby="features-title">
                    {/* Soft glow with noise effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,197,94,0.08)_0%,_transparent_70%)] [mask-image:url('data:image/svg+xml,%3Csvg%20width%3D%22100%25%22%20height%3D%22100%25%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.7%22%20numOctaves%3D%223%22%20stitchTiles%3D%22stitch%22/%3E%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%221%200%200%200%200%200%201%200%200%200%200%200%201%200%200%200%200%200%200%200.12%200%22/%3E%3C/filter%3E%3C/defs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url%28%23noise%29%22%20opacity%3D%220.35%22/%3E%3C/svg%3E')]"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 id="features-title" className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
                            GPA Tracking Features
                        </h2>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-12 sm:mb-16 px-4">
                            Tools to calculate GPA, track courses, and predict final grades.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 text-start px-4">
                            {features.map((feature, index) => (
                                <article key={index} className="p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-white border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-500">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-500 text-white mb-4 sm:mb-6">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm">{feature.description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
            <section id="how-it-works" className="relative py-16 sm:py-20 bg-white">
                {/* Soft glow with noise effect */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.1)_0%,_transparent_70%)] [mask-image:url('data:image/svg+xml,%3Csvg%20width%3D%22100%25%22%20height%3D%22100%25%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.6%22%20numOctaves%3D%222%22%20stitchTiles%3D%22stitch%22/%3E%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%221%200%200%200%200%200%201%200%200%200%200%200%200%200%200%201%200%200%200%200%200%200.1%22/%3E%3C/filter%3E%3C/defs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url%28%23noise%29%22%20opacity%3D%220.25%22/%3E%3C/svg%3E')]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16 items-center">
                        <div className="px-4">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                                How It Helps You Excel
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                                Our GPA tracker isn't just about numbers—it's about empowering you
                                to make informed decisions about your education and future.
                            </p>

                            <div className="space-y-4">
                                {[
                                    "Stay motivated with visual progress tracking",
                                    "Identify areas for improvement",
                                    "Plan your academic path strategically",
                                    "Celebrate your achievements",
                                    "Make informed decisions about course loads",
                                ].map((benefit, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mock Dashboard Preview */}
                        <div className="relative">
                            <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500 border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">Academic Dashboard</h3>
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-3 bg-blue-200 rounded-full w-3/4"></div>
                                    <div className="h-3 bg-indigo-200 rounded-full w-1/2"></div>
                                    <div className="h-3 bg-blue-200 rounded-full w-5/6"></div>
                                </div>
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">3.85</div>
                                    <div className="text-sm text-blue-600">Current GPA</div>
                                </div>
                            </div>

                            {/* Floating Stats */}
                            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 transform -rotate-12 hover:rotate-0 transition-transform duration-500 border border-gray-200">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">+0.15</div>
                                    <div className="text-sm text-gray-600">GPA Boost</div>
                                </div>
                            </div>

                            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 transform rotate-12 hover:rotate-0 transition-transform duration-500 border border-gray-200">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-indigo-600">12</div>
                                    <div className="text-sm text-gray-600">Courses</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative bg-gray-900 text-white py-8 sm:py-12" aria-label="Footer">
                {/* Soft glow with noise effect */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.08)_0%,_transparent_70%)] [mask-image:url('data:image/svg+xml,%3Csvg%20width%3D%22100%25%22%20height%3D%22100%25%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%222%22%20stitchTiles%3D%22stitch%22/%3E%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%221%200%200%200%200%200%201%200%200%200%200%200%200%200%200%201%200%200%200%200%200%200.06%22/%3E%3C/filter%3E%3C/defs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url%28%23noise%29%22%20opacity%3D%220.3%22/%3E%3C/svg%3E')]"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                        <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mr-2 sm:mr-3" />
                        <span className="text-xl sm:text-2xl font-bold">GPAConnect</span>
                    </div>
                    <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base px-4">
                        Empowering students to achieve academic excellence with our GPA calculator and progress tracker.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-gray-400 text-xs sm:text-sm">
                        <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="/support" className="hover:text-white transition-colors">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
