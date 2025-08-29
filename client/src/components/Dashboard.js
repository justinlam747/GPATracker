import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { convertGPA, formatGPA, getLetterGrade, getGradeColor } from '../utils/scaleConverter';
import AddCourseModal from './AddCourseModal';
import api from '../utils/api';
import {
    BookOpen,
    Plus,
    Save,
    X,
    ArrowLeft,
    GraduationCap,
    BarChart3,
    Calendar,
    Clock,
    TrendingUp,
    Target,
    Award,
    Filter,
    Eye,
    RefreshCw,
    User,
    Shield,
    Bell,
    LogIn,
    Mail,
    Star,
    Trash2,
    ChevronRight,
    LogOut
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

const Dashboard = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [gpaPrediction, setGpaPrediction] = useState('');
    const [predictionResult, setPredictionResult] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(0);
    const [studyLogs, setStudyLogs] = useState([]);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [predictionData, setPredictionData] = useState({
        currentGrade: '',
        finalWeight: '',
        targetGrade: '',
        predictedFinal: '',
        examGrade: '',
        finalGrade: ''
    });
    const [newStudyLog, setNewStudyLog] = useState({
        courseId: '',
        hours: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    useEffect(() => {
        // Only fetch data once when component mounts
        fetchCourses();
        fetchStudyLogs();
    }, []); // Empty dependency array - only run once

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/gpa/courses');
            if (response.data) {
                // Handle both array and object with courses property
                const coursesArray = Array.isArray(response.data) ? response.data : (response.data.courses || []);
                setCourses(coursesArray);
            }
        } catch (err) {
            if (err.response?.status === 429) {
                setError('Too many requests. Please wait a moment and refresh the page.');
            } else {
                setError('Failed to fetch courses');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchStudyLogs = async () => {
        try {
            const response = await api.get('/gpa/study-logs');
            if (response.data) {
                setStudyLogs(response.data.studyLogs || []);
            }
        } catch (error) {
            console.error('Error fetching study logs:', error);
        }
    };

    const calculateGPA = useCallback(() => {
        const coursesArray = courses || [];
        if (!coursesArray.length) return 0;

        let totalWeightedPoints = 0;
        let totalCredits = 0;

        coursesArray.forEach(course => {
            // Get the final grade for the course
            let gradePoints = 0;

            if (course.gradeOverride !== undefined) {
                // Use overridden grade points
                gradePoints = course.gradeOverridePoints || 0;
            } else if (course.gradePoints !== undefined) {
                // Use calculated grade points
                gradePoints = course.gradePoints;
            }

            // Only include courses with valid grades
            if (gradePoints > 0) {
                totalWeightedPoints += gradePoints * course.credits;
                totalCredits += course.credits;
            }
        });

        return totalCredits > 0 ? (totalWeightedPoints / totalCredits) : 0;
    }, [courses]);

    const handleGradePrediction = () => {
        const current = parseFloat(predictionData.currentGrade);
        const weight = parseFloat(predictionData.finalWeight);
        const target = parseFloat(predictionData.targetGrade);

        if (current && weight && target) {
            const currentWeight = 100 - weight;
            const currentContribution = (current * currentWeight) / 100;
            const finalNeeded = (target - currentContribution) / (weight / 100);

            setPredictionData(prev => ({
                ...prev,
                predictedFinal: finalNeeded.toFixed(1)
            }));
        }
    };

    const handleFinalGradeCalculation = () => {
        const current = parseFloat(predictionData.currentGrade);
        const weight = parseFloat(predictionData.finalWeight);
        const exam = parseFloat(predictionData.examGrade);

        if (current && weight && exam) {
            const currentWeight = 100 - weight;
            const currentContribution = (current * currentWeight) / 100;
            const examContribution = (exam * weight) / 100;
            const finalGrade = currentContribution + examContribution;

            setPredictionData(prev => ({
                ...prev,
                finalGrade: finalGrade.toFixed(1)
            }));
        }
    };

    const addStudyLog = async () => {
        if (!newStudyLog.courseId || !newStudyLog.hours) return;

        try {
            const response = await api.post('/gpa/study-logs', newStudyLog);
            if (response.data) {
                setNewStudyLog({
                    courseId: '',
                    hours: '',
                    date: new Date().toISOString().split('T')[0],
                    notes: ''
                });
                fetchStudyLogs();
            }
        } catch (error) {
            console.error('Error adding study log:', error);
            setError('Failed to add study log');
        }
    };

    const handleRevertOverride = async (courseId) => {
        try {
            const response = await api.put(`/gpa/courses/${courseId}/revert-override`);
            if (response.data) {
                fetchCourses();
            }
        } catch (error) {
            console.error('Error reverting override:', error);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        try {
            const response = await api.delete(`/gpa/courses/${courseId}`);
            if (response.data) {
                setCourses(prev => prev.filter(course => course._id !== courseId));
            }
        } catch (error) {
            setError('Failed to delete course');
        }
    };

    const getCurrentSemesterCourses = () => {
        const coursesArray = courses || [];
        if (coursesArray.length === 0) return [];

        // Get current date info
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();

        // Determine current semester
        let currentSemester = 'Fall';
        if (currentMonth >= 0 && currentMonth < 4) currentSemester = 'Spring';
        else if (currentMonth >= 4 && currentMonth < 8) currentSemester = 'Summer';
        else currentSemester = 'Fall';

        // Filter courses: show courses from current semester/year OR recent courses with grades
        const currentSemesterCourses = coursesArray.filter(course =>
            course.semester === currentSemester && course.year === currentYear
        );

        // If no current semester courses, show recent courses with grades
        if (currentSemesterCourses.length === 0) {
            const fallbackCourses = coursesArray
                .filter(course => {
                    // Show courses that have grades (either direct, calculated, or overridden)
                    return course.grade !== undefined ||
                        course.calculatedGrade !== undefined ||
                        course.gradeOverride !== undefined ||
                        (course.assignments && course.assignments.length > 0);
                })
                .slice(0, 6); // Show up to 6 courses

            return fallbackCourses;
        }

        return currentSemesterCourses;
    };

    const getUpcomingDeadlines = () => {
        const coursesArray = courses || [];
        const deadlines = [];
        coursesArray.forEach(course => {
            if (course.assignments && course.assignments.length > 0) {
                course.assignments.forEach(assignment => {
                    if (assignment.dueDate && !assignment.isCompleted) {
                        deadlines.push({
                            course: course.name,
                            assignment: assignment.name,
                            dueDate: assignment.dueDate,
                            weight: assignment.weight,
                            courseId: course._id
                        });
                    }
                });
            }
        });

        // Sort by due date and return next 5
        return deadlines
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5);
    };

    const getDisplayLetterGrade = (course) => {
        if (course.gradeOverride !== undefined) {
            return course.gradeOverride;
        }
        const userScale = user?.gpaScale || '4.0';
        return getLetterGrade(course.gradePoints || 0, userScale);
    };

    const getDisplayGradeColor = (grade) => {
        if (!grade || grade === 'N/A') return 'bg-gray-100 text-gray-800';

        const userScale = user?.gpaScale || '4.0';

        if (userScale === 'percentage') {
            // Percentage-based color coding
            const numGrade = parseFloat(grade);
            if (isNaN(numGrade)) return 'bg-gray-100 text-gray-800';

            if (numGrade >= 90) return 'bg-green-100 text-green-800';
            if (numGrade >= 80) return 'bg-blue-100 text-blue-800';
            if (numGrade >= 70) return 'bg-yellow-100 text-yellow-800';
            if (numGrade >= 60) return 'bg-orange-100 text-orange-800';
            return 'bg-red-100 text-red-800';
        } else {
            // GPA-based color coding
            if (typeof grade === 'string') {
                if (grade.includes('A')) return 'bg-green-100 text-green-800';
                if (grade.includes('B')) return 'bg-blue-100 text-blue-800';
                if (grade.includes('C')) return 'bg-yellow-100 text-yellow-800';
                if (grade.includes('D')) return 'bg-orange-100 text-orange-800';
                if (grade.includes('F')) return 'bg-red-100 text-red-800';
                return 'bg-gray-100 text-gray-800';
            } else {
                const numGrade = parseFloat(grade);
                if (isNaN(numGrade)) return 'bg-gray-100 text-gray-800';

                if (numGrade >= 3.7) return 'bg-green-100 text-green-800';
                if (numGrade >= 3.0) return 'bg-blue-100 text-blue-800';
                if (numGrade >= 2.0) return 'bg-yellow-100 text-yellow-800';
                if (numGrade >= 1.0) return 'bg-orange-100 text-orange-800';
                return 'bg-red-100 text-red-800';
            }
        }
    };

    const formatGradePoints = (course) => {
        const userScale = user?.gpaScale || '4.0';
        if (course.gradeOverride !== undefined) {
            return formatGPA(convertGPA(course.gradePoints || 0, '4.0', userScale), userScale);
        }
        return formatGPA(course.gradePoints || 0, userScale);
    };

    const recentCourses = (courses || []).slice(0, 7);

    const handleCourseAdded = (newCourse) => {
        setCourses(prev => [newCourse, ...prev]);
        setError('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const currentGPA = calculateGPA();
    const currentSemesterCourses = getCurrentSemesterCourses();
    const upcomingDeadlines = getUpcomingDeadlines();
    const totalCredits = (courses || []).reduce((sum, course) => sum + (course.credits || 0), 0);



    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-xl font-semibold text-gray-900">GPAConnect</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row">
                {/* Left Sidebar */}
                <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 min-h-screen lg:min-h-screen p-4 lg:p-6`}>
                    {/* Mobile close button */}
                    <div className="flex items-center justify-between lg:hidden mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-black" />
                            </div>
                            <span className="text-xl font-semibold text-gray-900">GPAConnect</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                            {error.includes('Too many requests') && (
                                <div className="mt-2 text-xs">
                                    Tip: Use the refresh button below to retry when ready.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Logo - hidden on mobile since it's in the header */}
                    <div className="hidden lg:flex items-center space-x-2 my-8">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-xl font-semibold text-gray-900">GPAConnect</span>
                    </div>

                    <nav className="space-y-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">OVERVIEW</div>
                        <a href="#stats" onClick={(e) => { e.preventDefault(); document.getElementById('stats').scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="flex items-center space-x-3 px-3 py-2 bg-blue-50 text-black rounded-lg">
                            <BarChart3 className="h-5 w-5" />
                            <span>Dashboard</span>
                        </a>
                        <a href="#performance" onClick={(e) => { e.preventDefault(); document.getElementById('performance').scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <TrendingUp className="h-5 w-5" />
                            <span>Performance</span>
                        </a>
                        <a href="#predictions" onClick={(e) => { e.preventDefault(); document.getElementById('predictions').scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Target className="h-5 w-5" />
                            <span>Grade Predictions</span>
                        </a>

                        <a href="#deadlines" onClick={(e) => { e.preventDefault(); document.getElementById('deadlines').scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Calendar className="h-5 w-5" />
                            <span>Deadlines</span>
                        </a>


                    </nav>

                    {/* Refresh Button */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={() => {
                                const now = Date.now();
                                if (now - lastRefresh < 5000) { // 5 second cooldown
                                    setError('Please wait 5 seconds between refreshes');
                                    return;
                                }
                                setError('');
                                setLastRefresh(now);
                                fetchCourses();
                                fetchStudyLogs();
                            }}
                            disabled={loading}
                            className="w-full flex items-center justify-start space-x-2 px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
                        </button>
                        <div className="mt-2 text-xs text-gray-500 text-center">
                            {lastRefresh > 0 && `Last refreshed: ${new Date(lastRefresh).toLocaleTimeString()}`}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">QUICK ACTIONS</div>
                        <button
                            onClick={() => setIsAddCourseModalOpen(true)}
                            className="w-full flex items-center space-x-3 px-3 py-2 bg-gradient-to-r from-indigo-400 to-blue-500 text-white font-medium rounded-lg  transition-all duration-300 border border-gray-300"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Add Course</span>
                        </button>
                        <Link
                            to="/settings"
                            className="flex items-center space-x-3 mt-6 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors "
                        >
                            <Shield className="h-5 w-5" />
                            <span>Settings</span>
                        </Link>
                        <button
                            onClick={() => {
                                localStorage.removeItem('accessToken');
                                window.location.href = '/';
                            }}
                            className="flex items-center space-x-3 mt-6 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
                        >
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                        </button>
                        <Link
                            to="/courses"
                            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mt-2"
                        >
                            <BookOpen className="h-5 w-5" />
                            <span>View All Courses</span>
                        </Link>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    {/* Stats Grid */}
                    <div id="stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Current GPA</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{currentGPA.toFixed(2)}</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Credits Achieved</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalCredits}</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Courses</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{(courses || []).length}</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center">
                                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Grade Scale</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{user?.gpaScale || '4.0'}</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center">
                                    <Award className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course Performance Overview */}
                    <div id="performance" className="bg-white rounded-xl border border-gray-100 shadow-sm mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-900">Course Performance Overview</h2>
                        </div>
                        <div className="p-6">
                            {currentSemesterCourses.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={currentSemesterCourses.map(course => {
                                        // Get the grade value for plotting
                                        let gradeValue = 0;
                                        let gradeType = 'GPA';
                                        let originalGrade = 'N/A';

                                        if (course.gradeOverride !== undefined) {
                                            // Use overridden grade
                                            if (typeof course.gradeOverride === 'number') {
                                                gradeValue = course.gradeOverride;
                                                gradeType = course.gpaScale === 'percentage' ? 'Percentage' : 'GPA';
                                            } else {
                                                // Convert letter grade to GPA points
                                                gradeValue = course.gradeOverridePoints || 0;
                                                gradeType = 'GPA';
                                            }
                                            originalGrade = course.gradeOverride;
                                        } else if (course.grade !== undefined) {
                                            // Use direct grade
                                            if (typeof course.grade === 'number') {
                                                if (course.gpaScale === 'percentage') {
                                                    gradeValue = course.grade;
                                                    gradeType = 'Percentage';
                                                } else {
                                                    gradeValue = course.grade;
                                                    gradeType = 'GPA';
                                                }
                                            } else {
                                                // Convert letter grade to GPA points
                                                gradeValue = course.gradePoints || 0;
                                                gradeType = 'GPA';
                                            }
                                            originalGrade = course.grade;
                                        } else if (course.calculatedGrade !== undefined) {
                                            // Use calculated grade
                                            if (typeof course.calculatedGrade === 'number') {
                                                if (course.gpaScale === 'percentage') {
                                                    gradeValue = course.calculatedGrade;
                                                    gradeType = 'Percentage';
                                                } else {
                                                    gradeValue = course.calculatedGrade;
                                                    gradeType = 'GPA';
                                                }
                                            } else {
                                                gradeValue = course.calculatedGradePoints || 0;
                                                gradeType = 'GPA';
                                            }
                                            originalGrade = course.calculatedGrade;
                                        } else {
                                            // Course has no grade
                                            gradeValue = 0;
                                            gradeType = 'No Grade';
                                            originalGrade = 'N/A';
                                        }

                                        return {
                                            name: course.name.length > 15 ? course.name.substring(0, 15) + '...' : course.name,
                                            grade: gradeValue,
                                            gradeType: gradeType,
                                            fullName: course.name,
                                            courseId: course._id,
                                            originalGrade: originalGrade
                                        };
                                    })}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                                        <YAxis
                                            domain={[0, (dataMax) => {
                                                const userScale = user?.gpaScale || '4.0';
                                                if (userScale === 'percentage') {
                                                    return Math.min(100, dataMax + 5);
                                                } else if (userScale === '4.3') {
                                                    return Math.min(4.3, dataMax + 0.3);
                                                } else {
                                                    return Math.min(4.0, dataMax + 0.3);
                                                }
                                            }]}
                                            tickFormatter={(value) => {
                                                const userScale = user?.gpaScale || '4.0';
                                                if (userScale === 'percentage') {
                                                    return `${Math.round(value)}%`;
                                                }
                                                return value.toFixed(1);
                                            }}
                                        />
                                        <Tooltip
                                            formatter={(value, name, props) => {
                                                const userScale = user?.gpaScale || '4.0';
                                                if (userScale === 'percentage') {
                                                    return [`${Math.round(value)}%`, 'Grade'];
                                                }
                                                return [value.toFixed(2), 'GPA'];
                                            }}
                                            labelFormatter={(label, payload) => {
                                                if (payload && payload[0]) {
                                                    const courseData = payload[0].payload;
                                                    return (
                                                        <div>
                                                            <div className="font-medium">{courseData.fullName}</div>
                                                            <div className="text-sm text-gray-600">
                                                                {courseData.originalGrade !== 'N/A' ? (
                                                                    <>Grade: {courseData.originalGrade} ({courseData.gradeType})</>
                                                                ) : (
                                                                    <>No grade assigned yet</>
                                                                )}
                                                            </div>
                                                            <Link
                                                                to={`/course/${courseData.courseId}`}
                                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                                            >
                                                                View Course Details
                                                            </Link>
                                                        </div>
                                                    );
                                                }
                                                return label;
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="grade"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                                            activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-gray-500 py-12">
                                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No courses with grades found</p>
                                    <p className="text-sm mt-2">Add courses and grades to see your performance overview</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Recent Courses */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Courses</h3>
                            <Link
                                to="/courses"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                View All
                            </Link>
                        </div>

                        {recentCourses.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Course Name
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Grade
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Credits
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Semester
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentCourses.map((course) => {
                                            const displayGrade = course.gradeOverride !== undefined ? course.gradeOverride : course.grade || 'N/A';
                                            const gradeColor = displayGrade !== 'N/A' ? getDisplayGradeColor(displayGrade) : 'bg-gray-100 text-gray-800';

                                            return (
                                                <tr key={course._id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {course.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gradeColor}`}>
                                                            {displayGrade}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {course.credits} cr
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {course.semester} {course.year}
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <Link
                                                                to={`/course/${course._id}`}
                                                                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDeleteCourse(course._id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                                title="Delete Course"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No courses yet</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by adding your first course.</p>
                            </div>
                        )}
                    </div>
                    {/* Grade Predictions */}
                    <div id="predictions" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Calculate Required Final Grade</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Grade (%)</label>
                                    <input
                                        type="number"
                                        value={predictionData.currentGrade}
                                        onChange={(e) => setPredictionData(prev => ({ ...prev, currentGrade: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="85"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Final Exam Weight (%)</label>
                                    <input
                                        type="number"
                                        value={predictionData.finalWeight}
                                        onChange={(e) => setPredictionData(prev => ({ ...prev, finalWeight: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Final Grade (%)</label>
                                    <input
                                        type="number"
                                        value={predictionData.targetGrade}
                                        onChange={(e) => setPredictionData(prev => ({ ...prev, targetGrade: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="90"
                                    />
                                </div>
                                <button
                                    onClick={handleGradePrediction}
                                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300"
                                >
                                    Calculate Required Final Grade
                                </button>
                                {predictionData.predictedFinal && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {predictionData.predictedFinal}%
                                            </div>
                                            <div className="text-sm text-blue-600">Required on Final Exam</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Calculate Final Grade</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Grade (%)</label>
                                    <input
                                        type="number"
                                        value={predictionData.currentGrade}
                                        onChange={(e) => setPredictionData(prev => ({ ...prev, currentGrade: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="85"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Final Exam Weight (%)</label>
                                    <input
                                        type="number"
                                        value={predictionData.finalWeight}
                                        onChange={(e) => setPredictionData(prev => ({ ...prev, finalWeight: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Final Exam Grade (%)</label>
                                    <input
                                        type="number"
                                        value={predictionData.examGrade}
                                        onChange={(e) => setPredictionData(prev => ({ ...prev, examGrade: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="88"
                                    />
                                </div>
                                <button
                                    onClick={handleFinalGradeCalculation}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-300"
                                >
                                    Calculate Final Grade
                                </button>
                                {predictionData.finalGrade && (
                                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {predictionData.finalGrade}%
                                            </div>
                                            <div className="text-sm text-green-600">Final Course Grade</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>



                    {/* Upcoming Deadlines */}
                    <div id="deadlines" className="bg-white rounded-xl border border-gray-100 shadow-sm mb-8" >
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-900">Upcoming Deadlines</h2>
                        </div>
                        <div className="p-6">
                            {upcomingDeadlines.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingDeadlines.map((deadline, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <div className="font-medium text-gray-900">{deadline.assignment}</div>
                                                <div className="text-sm text-gray-600">{deadline.course}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {new Date(deadline.dueDate).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500">{deadline.weight}% weight</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No upcoming deadlines found</p>
                                </div>
                            )}
                            <div className="mt-4 text-center">
                                <Link
                                    to="/calendar"
                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View all course deadlines →
                                </Link>
                            </div>
                        </div>
                    </div>


                </div>
            </div>
            <AddCourseModal
                isOpen={isAddCourseModalOpen}
                onClose={() => setIsAddCourseModalOpen(false)}
                onCourseAdded={handleCourseAdded}
            />
        </div>
    );
};

export default Dashboard;
