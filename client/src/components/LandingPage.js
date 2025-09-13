import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from './Footer';
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

    // Removed unused partnerLogos array

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
                        <nav
  className="hidden md:flex items-center space-x-8 text-sm text-gray-600"
  aria-label="Main navigation"
>
  <button
    onClick={() =>
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
    }
    className="hover:text-blue-600 transition-colors cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50"
  >
    Features
  </button>

  <button
    onClick={() =>
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
    }
    className="hover:text-blue-600 transition-colors cursor-pointer px-3 py-2 rounded-md hover:bg-gray-50"
  >
    How It Works
  </button>

  {/* Privacy Policy Link */}
  <a
    href="/privacy-policy"
    className="hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
  >
    Privacy Policy
  </a>

  {/* Terms of Service Link */}
  <a
    href="/terms-of-service"
    className="hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
  >
    Terms of Service
  </a>
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
                {/* Hero with soft gradient background */}
                <section className="relative py-16 sm:py-20 md:py-24 lg:py-32 overflow-hidden text-center bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20" aria-labelledby="hero-title">
                    {/* Soft gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/10 via-transparent to-indigo-50/10"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.03)_0%,_rgba(99,102,241,0.02)_50%,_transparent_70%)]"></div>

                    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
                        <div className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs sm:text-sm font-medium mb-6 sm:mb-8 md:mb-12 transition ${animate ? 'opacity-100' : 'opacity-0'}`}>
                            <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            BETA
                        </div>

                        <h1
  id="hero-title"
  className="
    font-bold text-slate-900 tracking-tight
    text-5xl xs:text-5xl sm:text-[5rem] md:text-[6rem] lg:text-[6rem] xl:text-[10rem]
    leading-[1.1] sm:leading-[1.05] md:leading-[1.03]
    mb-4 sm:mb-6 md:mb-8 lg:mb-10
    px-2
  "
>
  GPAConnect!
</h1>

                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 mb-8 sm:mb-10 md:mb-12 max-w-4xl mx-auto px-2 leading-relaxed">
                            GPAConnect helps students track GPA in real-time, predict grades, and manage courses with ease.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center px-2">
                            {!isAuthenticated ? (
                                <>
                                    <Link
                                        to="/register"
                                        className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm sm:text-base md:text-lg"
                                    >
                                        Start GPA Tracking <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 inline" />
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 border border-blue-300 text-blue-700 font-semibold rounded-xl hover:border-indigo-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 text-sm sm:text-base md:text-lg"
                                    >
                                        Sign In
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    to="/courses"
                                    className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 text-sm sm:text-base md:text-lg"
                                >
                                    View My GPA Tracker
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Floating stat circles with animation - hidden on mobile for better UX */}
                    <div className="hidden sm:block absolute top-12 left-8 sm:top-24 sm:left-16 animate-float-slow">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-xl animate-pulse-slow">
                            A+
                        </div>
                    </div>
                    <div className="hidden sm:block absolute top-20 right-8 sm:top-40 sm:right-24 animate-float-medium">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-xl animate-bounce-slow">
                            4.0
                        </div>
                    </div>
                    <div className="hidden sm:block absolute top-32 left-24 sm:top-56 sm:left-40 animate-float-fast">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-xl animate-pulse-medium">
                            95%
                        </div>
                    </div>
                    <div className="hidden sm:block absolute top-24 right-24 sm:top-44 sm:right-56 animate-float-reverse">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-xl animate-spin-slow">
                            A
                        </div>
                    </div>
                </section>

              

                {/* Features */}
                <section
  id="features"
  className="relative py-20 sm:py-24 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20"
  aria-labelledby="features-title"
>
  {/* Soft gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/10 via-transparent to-indigo-50/10"></div>

   <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
     <h2
       id="features-title"
       className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 sm:mb-6 md:mb-8 px-2"
     >
       GPA Tracking Features
     </h2>

     <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 sm:mb-16 md:mb-20 px-2 leading-relaxed">
       Tools to calculate GPA, track courses, and predict final grades.
     </p>
     <div className="relative z-10 [mask-image:linear-gradient(to_top,transparent,black_15%,black)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 text-start px-2">
       {features.map((feature, index) => (
         <article
           key={index}
           className="group relative p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-sm border border-slate-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 hover:bg-white hover:border-gray-200 overflow-hidden"
         >
           {/* Content wrapper with mask-image */}
          
             <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 text-white mb-4 sm:mb-6 md:mb-8 shadow-lg">
               {feature.icon}
             </div>
             <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900 mb-3 sm:mb-4 md:mb-6">
               {feature.title}
             </h3>
             <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
               {feature.description}
             </p>
          
         </article>
       ))}
     </div>
     </div>
   </div>
                </section>

            </main>
            <section id="how-it-works" className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20">
                {/* Soft gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/10 via-transparent to-indigo-50/10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-16 items-center">
                        <div className="px-2 sm:px-4">
                            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3 sm:mb-4 md:mb-6">
                                How It Helps You Excel
                            </h2>
                            <p className="text-sm sm:text-base md:text-lg text-slate-600 mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                                Our GPA tracker isn't just about numbers—it's about empowering you
                                to make informed decisions about your education and future.
                            </p>

                            <div className="space-y-3 sm:space-y-4">
                                {[
                                    "Stay motivated with visual progress tracking",
                                    "Identify areas for improvement",
                                    "Plan your academic path strategically",
                                    "Celebrate your achievements",
                                    "Make informed decisions about course loads",
                                ].map((benefit, index) => (
                                    <div key={index} className="flex items-center space-x-2 sm:space-x-3">
                                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                                        <span className="text-sm sm:text-base text-slate-700">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Mock Dashboard Preview */}
                        <div className="relative mt-8 lg:mt-0">
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500 border border-slate-200">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <h3 className="text-sm sm:text-base font-semibold text-slate-900">Academic Dashboard</h3>
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="h-2 sm:h-3 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full w-3/4"></div>
                                    <div className="h-2 sm:h-3 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-full w-1/2"></div>
                                    <div className="h-2 sm:h-3 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full w-5/6"></div>
                                </div>
                                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                    <div className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">3.85</div>
                                    <div className="text-xs sm:text-sm text-blue-600">Current GPA</div>
                                </div>
                            </div>

                            {/* Floating Stats - hidden on mobile for better UX */}
                            <div className="hidden sm:block absolute -top-4 -right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4 transform -rotate-12 hover:rotate-0 transition-transform duration-500 border border-slate-200">
                                <div className="text-center">
                                    <div className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">+0.15</div>
                                    <div className="text-xs sm:text-sm text-blue-600">GPA Boost</div>
                                </div>
                            </div>

                            <div className="hidden sm:block absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4 transform rotate-12 hover:rotate-0 transition-transform duration-500 border border-slate-200">
                                <div className="text-center">
                                    <div className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">12</div>
                                    <div className="text-xs sm:text-sm text-indigo-600">Courses</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


          
            
        </div>
    );
};

export default LandingPage;
