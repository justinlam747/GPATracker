import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Helmet } from "react-helmet-async";
import {
  TrendingUp,
  BookOpen,
  Target,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  GraduationCap,
  LogOut,
  X,
  ChevronDown,
  Users,
  Award,
  Heart,
} from "lucide-react";

const LandingPage = () => {
  const { isAuthenticated, logout } = useAuth();
  const [, setAnimate] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);

  useEffect(() => {
    setAnimate(true);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest("header")) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  const features = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Real-time GPA Tracking",
      description:
        "Monitor your academic performance with instant calculations and trend analysis.",
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Course Management",
      description:
        "Organize courses by semester and track assignments efficiently.",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Final Grade Prediction",
      description:
        "Tools to predict your final grade based on your current GPA and course performance.",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Visual Analytics",
      description: "Beautiful charts and graphs to visualize your performance.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Private",
      description: "Enterprise-grade security protecting your academic data.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Instant Insights",
      description: "Get immediate feedback on your academic standing.",
    },
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
        <meta
          property="og:title"
          content="GPAConnect - GPA Calculator & Tracker"
        />
        <meta
          property="og:description"
          content="Track GPA, manage courses, and predict final grades with GPAConnect."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com" />
      </Helmet>

      {/* Header */}
      <header className="relative ">
        {/* Soft glow with noise effect */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-black" />
              </div>
              <span className="text-lg sm:text-xl font-semibold text-[#023047] font-['Inter',sans-serif]">
                GPAConnect
              </span>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>

          

            {/* Auth */}
            <div className="hidden sm:flex items-center space-x-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-[#023047] hover:text-neutral-850 font-['Inter',sans-serif]"
                  >
                    Log in
                  </Link>
                 
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/courses"
                    className="text-sm font-medium text-[#023047] hover:text-honolulu_blue font-['Inter',sans-serif]"
                  >
                    My Courses
                  </Link>
                  <Link
                    to="/"
                    className="bg-honolulu_blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:bg-[#023047] transition-colors font-['Inter',sans-serif]"
                  >
                    Go to GPA Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-[#023047] hover:text-[#fb8500]  rounded-lg font-['Inter',sans-serif]"
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
        <div className="md:hidden bg-white ">
          <div className="px-4 py-6 space-y-4">
            <nav className="space-y-3">
              <button
                onClick={() => {
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-[#023047] hover:text-honolulu_blue hover:bg-[#8ecae6]/10 rounded-md transition-colors font-['Inter',sans-serif]"
              >
                Features
              </button>
              <button
                onClick={() => {
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-[#023047] hover:text-honolulu_blue hover:bg-[#8ecae6]/10 rounded-md transition-colors font-['Inter',sans-serif]"
              >
                How It Works
              </button>
              <Link
                to="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-[#023047] hover:text-honolulu_blue hover:bg-[#8ecae6]/10 rounded-md transition-colors font-['Inter',sans-serif]"
              >
                Courses
              </Link>
              <Link
                to="/calendar"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-[#023047] hover:text-honolulu_blue hover:bg-[#8ecae6]/10 rounded-md transition-colors font-['Inter',sans-serif]"
              >
                Calendar
              </Link>
            </nav>

            {/* Mobile Auth Buttons */}
            {!isAuthenticated ? (
              <div className="pt-4  space-y-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-base font-medium text-[#023047] hover:text-neutral-700 border border-[#8ecae6] rounded-md  transition-colors font-['Inter',sans-serif]"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-honolulu_blue rounded-md hover:shadow-lg hover:bg-[#023047] transition-all duration-200 font-['Inter',sans-serif]"
                >
                  Start Tracking GPA
                </Link>
              </div>
            ) : (
              <div className="pt-4 space-y-3">
                <Link
                  to="/courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-base font-medium text-[#023047] hover:text-honolulu_blue border border-[#8ecae6] rounded-md hover:bg-[#8ecae6]/10 transition-colors font-['Inter',sans-serif]"
                >
                  My Courses
                </Link>
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-honolulu_blue rounded-md hover:shadow-lg hover:bg-[#023047] transition-all duration-200 font-['Inter',sans-serif]"
                >
                  Go to GPA Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-center px-4 py-2 text-base font-medium text-[#023047] hover:text-[#fb8500] border border-[#8ecae6] rounded-md hover:bg-[#8ecae6]/10 transition-colors font-['Inter',sans-serif]"
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
        <section
          className="relative py-20 sm:py-20 md:py-24 lg:py-32 overflow-hidden text-center  "
          aria-labelledby="hero-title"
        >
          {/* Soft gradient overlay */}
         
          

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
           

            <h1
              id="hero-title"
              className="
    font-bold text-[#023047] tracking-tight font-['Inter',sans-serif]
    text-5xl xs:text-5xl sm:text-[5rem] md:text-[6rem] lg:text-[6rem] xl:text-[6rem]
    leading-[1.1] sm:leading-[1.05] md:leading-[1.03]
    mb-4 sm:mb-6 md:mb-8 lg:mb-10
    px-2
  "
            >
              Stop Thinking About Your Grades & Start Knowing Them.
            </h1>

          

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center px-2">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-honolulu_blue text-white font-semibold rounded-xl hover:shadow-xl hover:scale-105 hover:bg-blue_green transition-all duration-300 text-sm sm:text-base md:text-lg font-['Inter',sans-serif]"
                  >
                    Start GPA Tracking{" "}
                    <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 inline" />
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 border-2 border-honolulu_blue text-honolulu_blue font-semibold rounded-xl hover:bg-honolulu_blue hover:text-white transition-all duration-300 text-sm sm:text-base md:text-lg font-['Inter',sans-serif]"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  to="/courses"
                  className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-honolulu_blue text-white font-semibold rounded-xl hover:bg-blue_green hover:scale-105 transition-all duration-300 text-sm sm:text-base md:text-lg font-['Inter',sans-serif]"
                >
                  View My GPA Tracker
                </Link>
              )}
            </div>
          </div>

      
        </section>

        {/* Features */}
        <section
          id="features"
          className="relative py-20 sm:py-24 bg-white"
          aria-labelledby="features-title"
        >

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
            <h2
              id="features-title"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#023047] mb-4 sm:mb-6 md:mb-8 px-2 font-['Inter',sans-serif]"
            >
              GPA Tracking Features
            </h2>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#023047]/70 max-w-3xl mx-auto mb-12 sm:mb-16 md:mb-20 px-2 leading-relaxed font-['Inter',sans-serif]">
              Tools to calculate GPA, track courses, and predict final grades.
            </p>
            <div className="relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 px-2">
                {features.map((feature, index) => (
                  <article
                    key={index}
                    className="group relative p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 hover:bg-white text-center"
                  >
                    {/* Content wrapper with mask-image */}

                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-honolulu_blue rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-blue_green transition-all duration-500 text-white mb-4 sm:mb-6 md:mb-8 shadow-lg">
                      {feature.icon}
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#023047] mb-3 sm:mb-4 md:mb-6 font-['Inter',sans-serif]">
                      {feature.title}
                    </h3>
                    <p className="text-[#023047]/70 text-sm sm:text-base leading-relaxed font-['Inter',sans-serif]">
                      {feature.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <section
        id="how-it-works"
        className="relative py-12 sm:py-16 md:py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-16 items-center">
            <div className="px-2 sm:px-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#023047] mb-3 sm:mb-4 md:mb-6 font-['Inter',sans-serif]">
                How It Helps You Excel
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-[#023047]/70 mb-4 sm:mb-6 md:mb-8 leading-relaxed font-['Inter',sans-serif]">
                Our GPA tracker isn't just about numbers—it's about empowering
                you to make informed decisions about your education and future.
              </p>

              <ul className="space-y-3 sm:space-y-4 list-disc list-inside text-sm sm:text-base text-[#023047] font-['Inter',sans-serif]">
                <li>Stay motivated with visual progress tracking</li>
                <li>Identify areas for improvement</li>
                <li>Plan your academic path strategically</li>
                <li>Celebrate your achievements</li>
                <li>Make informed decisions about course loads</li>
              </ul>
            </div>

            {/* Mock Dashboard Preview */}
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base font-semibold text-[#023047] font-['Inter',sans-serif]">
                    Academic Dashboard
                  </h3>
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-honolulu_blue rounded-full"></div>
                </div>
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-[#023047]/70 font-['Inter',sans-serif]">Computer Programming I</span>
                    <span className="text-xs sm:text-sm font-semibold text-[#023047] font-['Inter',sans-serif]">A (95%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-[#023047]/70 font-['Inter',sans-serif]">Calculus I</span>
                    <span className="text-xs sm:text-sm font-semibold text-[#023047] font-['Inter',sans-serif]">B+ (88%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-[#023047]/70 font-['Inter',sans-serif]">Physics I</span>
                    <span className="text-xs sm:text-sm font-semibold text-[#023047] font-['Inter',sans-serif]">A- (92%)</span>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-honolulu_blue/10 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-[#023047] font-['Inter',sans-serif]">
                    3.85
                  </div>
                  <div className="text-xs sm:text-sm text-honolulu_blue font-['Inter',sans-serif]">
                    Current GPA
                  </div>
                </div>
              </div>

              {/* Floating Stats - hidden on mobile for better UX */}
              <div className="hidden sm:block absolute -top-4 -right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4 transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-[#023047] font-['Inter',sans-serif]">
                    +0.15
                  </div>
                  <div className="text-xs sm:text-sm text-honolulu_blue font-['Inter',sans-serif]">
                    GPA Boost
                  </div>
                </div>
              </div>

              <div className="hidden sm:block absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4 transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-[#023047] font-['Inter',sans-serif]">
                    12
                  </div>
                  <div className="text-xs sm:text-sm text-honolulu_blue font-['Inter',sans-serif]">
                    Courses
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About/Company Section */}
      <section className="relative py-16 sm:py-20 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#023047] mb-4 sm:mb-6 font-['Inter',sans-serif]">
              About GPAConnect
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#023047]/70 max-w-3xl mx-auto leading-relaxed font-['Inter',sans-serif]">
              Empowering students to take control of their academic journey with intelligent tracking and insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
            {/* Mission */}
            <div className="group text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-honolulu_blue/5 to-[#8ecae6]/5 hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-honolulu_blue rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 group-hover:bg-blue_green transition-all duration-500">
                <Users className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#023047] mb-3 sm:mb-4 font-['Inter',sans-serif]">
                Our Mission
              </h3>
              <p className="text-sm sm:text-base text-[#023047]/70 leading-relaxed font-['Inter',sans-serif]">
                We're dedicated to helping students achieve academic excellence by providing intuitive tools that make GPA tracking simple, accurate, and actionable.
              </p>
            </div>

            {/* What We Do */}
            <div className="group text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-honolulu_blue/5 to-[#8ecae6]/5 hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-honolulu_blue rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 group-hover:bg-blue_green transition-all duration-500">
                <Award className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#023047] mb-3 sm:mb-4 font-['Inter',sans-serif]">
                What We Do
              </h3>
              <p className="text-sm sm:text-base text-[#023047]/70 leading-relaxed font-['Inter',sans-serif]">
                GPAConnect provides real-time GPA calculations, course management, grade predictions, and visual analytics to help you understand and improve your academic performance.
              </p>
            </div>

            {/* Why Choose Us */}
            <div className="group text-center p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-honolulu_blue/5 to-[#8ecae6]/5 hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-honolulu_blue rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 group-hover:bg-blue_green transition-all duration-500">
                <Heart className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#023047] mb-3 sm:mb-4 font-['Inter',sans-serif]">
                Why Choose Us
              </h3>
              <p className="text-sm sm:text-base text-[#023047]/70 leading-relaxed font-['Inter',sans-serif]">
                Built by students, for students. We understand the challenges you face and have created a platform that's secure, reliable, and designed with your success in mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 sm:py-20 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#023047] mb-4 sm:mb-6 font-['Inter',sans-serif]">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#023047]/70 leading-relaxed font-['Inter',sans-serif]">
              Everything you need to know about GPAConnect
            </p>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 1 ? null : 1)}
                className="w-full px-6 sm:px-8 py-6 flex items-center justify-between text-left hover:bg-honolulu_blue/5 transition-colors duration-200"
              >
                <span className="text-base sm:text-lg font-semibold text-[#023047] font-['Inter',sans-serif] pr-4">
                  How accurate are the GPA calculations?
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-honolulu_blue transition-transform duration-300 flex-shrink-0 ${
                    openFAQ === 1 ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFAQ === 1 && (
                <div className="px-6 sm:px-8 pb-6 pt-2 text-sm sm:text-base text-[#023047]/70 leading-relaxed font-['Inter',sans-serif]">
                  GPAConnect uses industry-standard GPA calculation methods. We support multiple GPA scales (4.0, 4.3, letter grades, and percentages) and calculate your GPA based on weighted credit hours. However, always verify with your institution as some schools may use custom grading scales.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 2 ? null : 2)}
                className="w-full px-6 sm:px-8 py-6 flex items-center justify-between text-left hover:bg-honolulu_blue/5 transition-colors duration-200"
              >
                <span className="text-base sm:text-lg font-semibold text-[#023047] font-['Inter',sans-serif] pr-4">
                  Is my academic data secure and private?
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-honolulu_blue transition-transform duration-300 flex-shrink-0 ${
                    openFAQ === 2 ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFAQ === 2 && (
                <div className="px-6 sm:px-8 pb-6 pt-2 text-sm sm:text-base text-[#023047]/70 leading-relaxed font-['Inter',sans-serif]">
                  Yes! We take your privacy seriously. All data is encrypted in transit using HTTPS, passwords are hashed using industry-standard algorithms, and we never sell or share your personal information. You can delete your account and all associated data at any time.
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 3 ? null : 3)}
                className="w-full px-6 sm:px-8 py-6 flex items-center justify-between text-left hover:bg-honolulu_blue/5 transition-colors duration-200"
              >
                <span className="text-base sm:text-lg font-semibold text-[#023047] font-['Inter',sans-serif] pr-4">
                  Can I track multiple semesters and years?
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-honolulu_blue transition-transform duration-300 flex-shrink-0 ${
                    openFAQ === 3 ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFAQ === 3 && (
                <div className="px-6 sm:px-8 pb-6 pt-2 text-sm sm:text-base text-[#023047]/70 leading-relaxed font-['Inter',sans-serif]">
                  Absolutely! GPAConnect allows you to organize your courses by semester, track your GPA progression over time, and view historical data. You can add unlimited courses across multiple semesters and academic years.
                </div>
              )}
            </div>

            {/* FAQ 4 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 4 ? null : 4)}
                className="w-full px-6 sm:px-8 py-6 flex items-center justify-between text-left hover:bg-honolulu_blue/5 transition-colors duration-200"
              >
                <span className="text-base sm:text-lg font-semibold text-[#023047] font-['Inter',sans-serif] pr-4">
                  How does the grade prediction feature work?
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-honolulu_blue transition-transform duration-300 flex-shrink-0 ${
                    openFAQ === 4 ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFAQ === 4 && (
                <div className="px-6 sm:px-8 pb-6 pt-2 text-sm sm:text-base text-[#023047]/70 leading-relaxed font-['Inter',sans-serif]">
                  Our grade prediction tool analyzes your current course performance, assignment weights, and remaining coursework to calculate what grades you need on future assignments to achieve your target final grade. This helps you plan your study time effectively.
                </div>
              )}
            </div>

            {/* FAQ 5 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 5 ? null : 5)}
                className="w-full px-6 sm:px-8 py-6 flex items-center justify-between text-left hover:bg-honolulu_blue/5 transition-colors duration-200"
              >
                <span className="text-base sm:text-lg font-semibold text-[#023047] font-['Inter',sans-serif] pr-4">
                  Is GPAConnect free to use?
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-honolulu_blue transition-transform duration-300 flex-shrink-0 ${
                    openFAQ === 5 ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFAQ === 5 && (
                <div className="px-6 sm:px-8 pb-6 pt-2 text-sm sm:text-base text-[#023047]/70 leading-relaxed font-['Inter',sans-serif]">
                  Yes! GPAConnect is completely free for all students. We believe every student should have access to tools that help them succeed academically, regardless of their financial situation. Create an account and start tracking your GPA today at no cost.
                </div>
              )}
            </div>

            {/* FAQ 6 */}
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <button
                onClick={() => setOpenFAQ(openFAQ === 6 ? null : 6)}
                className="w-full px-6 sm:px-8 py-6 flex items-center justify-between text-left hover:bg-honolulu_blue/5 transition-colors duration-200"
              >
                <span className="text-base sm:text-lg font-semibold text-[#023047] font-['Inter',sans-serif] pr-4">
                  What if my school uses a different grading scale?
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-honolulu_blue transition-transform duration-300 flex-shrink-0 ${
                    openFAQ === 6 ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFAQ === 6 && (
                <div className="px-6 sm:px-8 pb-6 pt-2 text-sm sm:text-base text-[#023047]/70 leading-relaxed font-['Inter',sans-serif]">
                  GPAConnect supports multiple GPA scales including 4.0, 4.3, letter grades, and percentage-based systems. You can select your preferred scale in the settings. Assignments are always stored as percentages and converted to your chosen scale for display, ensuring flexibility and accuracy.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Landing Page Only */}
      <footer className="relative bg-white border-t border-gray-200 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10 mb-8 sm:mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-[#023047]" />
                </div>
                <span className="text-lg font-semibold text-[#023047] font-['Inter',sans-serif]">
                  GPAConnect
                </span>
              </div>
              <p className="text-sm text-[#023047]/60 leading-relaxed font-['Inter',sans-serif]">
                Empowering students to take control of their academic journey with intelligent GPA tracking.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold text-[#023047] uppercase tracking-wider mb-4 font-['Inter',sans-serif]">
                Product
              </h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => {
                      document
                        .getElementById("features")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-sm text-[#023047]/60 hover:text-[#023047] transition-colors font-['Inter',sans-serif]"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      document
                        .getElementById("how-it-works")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-sm text-[#023047]/60 hover:text-[#023047] transition-colors font-['Inter',sans-serif]"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-sm text-[#023047]/60 hover:text-[#023047] transition-colors font-['Inter',sans-serif]"
                  >
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-[#023047] uppercase tracking-wider mb-4 font-['Inter',sans-serif]">
                Resources
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/courses"
                    className="text-sm text-[#023047]/60 hover:text-[#023047] transition-colors font-['Inter',sans-serif]"
                  >
                    Courses
                  </Link>
                </li>
                <li>
                  <Link
                    to="/calendar"
                    className="text-sm text-[#023047]/60 hover:text-[#023047] transition-colors font-['Inter',sans-serif]"
                  >
                    Calendar
                  </Link>
                </li>
                <li>
                  <Link
                    to="/settings"
                    className="text-sm text-[#023047]/60 hover:text-[#023047] transition-colors font-['Inter',sans-serif]"
                  >
                    Settings
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-[#023047] uppercase tracking-wider mb-4 font-['Inter',sans-serif]">
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-sm text-[#023047]/60 hover:text-[#023047] transition-colors font-['Inter',sans-serif]"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms-of-service"
                    className="text-sm text-[#023047]/60 hover:text-[#023047] transition-colors font-['Inter',sans-serif]"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-[#023047]/50 font-['Inter',sans-serif]">
                © {new Date().getFullYear()} GPAConnect. All rights reserved.
              </p>
              <div className="flex items-center space-x-6">
                <Link
                  to="/privacy-policy"
                  className="text-sm text-[#023047]/50 hover:text-[#023047] transition-colors font-['Inter',sans-serif]"
                >
                  Privacy
                </Link>
                <Link
                  to="/terms-of-service"
                  className="text-sm text-[#023047]/50 hover:text-[#023047] transition-colors font-['Inter',sans-serif]"
                >
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
