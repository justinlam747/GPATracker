import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Footer from './Footer';
import api from '../utils/api';
import {
    Calendar as CalendarIcon,
    List,
    ChevronLeft,
    ChevronRight,
    Clock,
    BookOpen,
    Plus,
    Trash2,
    BarChart3,
    ArrowLeft,
    Eye,
    GraduationCap,
    Menu,
    X
} from 'lucide-react';

const Calendar = () => {
    const { user } = useAuth();
    const [view, setView] = useState('calendar'); // 'calendar' or 'list'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [courses, setCourses] = useState([]);
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/gpa/courses');
            if (response.data) {
                const coursesArray = Array.isArray(response.data) ? response.data : (response.data.courses || []);
                setCourses(coursesArray);
                generateDeadlinesFromCourses(coursesArray);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            setError('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    const generateDeadlinesFromCourses = (coursesData) => {
        const allDeadlines = [];

        coursesData.forEach(course => {
            if (course.assignments && course.assignments.length > 0) {
                course.assignments.forEach(assignment => {
                    if (assignment.dueDate && !assignment.isCompleted) {
                        allDeadlines.push({
                            id: assignment._id || `${course._id}-${assignment.name}`,
                            title: assignment.name,
                            courseId: course._id,
                            courseName: course.name,
                            dueDate: new Date(assignment.dueDate),
                            type: assignment.type || 'assignment',
                            weight: assignment.weight,
                            maxGrade: assignment.maxGrade,
                            notes: assignment.notes
                        });
                    }
                });
            }
        });

        // Sort deadlines by due date
        const sortedDeadlines = allDeadlines.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        setDeadlines(sortedDeadlines);
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        return { daysInMonth, startingDay };
    };

    const getDeadlinesForDate = (date) => {
        return deadlines.filter(deadline => {
            const deadlineDate = new Date(deadline.dueDate);
            return deadlineDate.toDateString() === date.toDateString();
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getMonthName = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    };

    const previousMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const getDeadlineTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'exam':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'quiz':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'project':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'participation':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getDeadlineTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'exam':
                return '📝';
            case 'quiz':
                return '❓';
            case 'project':
                return '📁';
            case 'participation':
                return '👥';
            default:
                return '📋';
        }
    };

    const renderCalendarView = () => {
        const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="bg-white p-3 min-h-[120px]"></div>);
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayDeadlines = getDeadlinesForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            days.push(
                <div key={day} className={`bg-white p-3 min-h-[120px] ${isToday ? 'bg-blue-50 border-2 border-blue-200' : ''}`}>
                    <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day}
                    </div>
                    <div className="space-y-1">
                        {dayDeadlines.map(deadline => (
                            <div
                                key={deadline.id}
                                className={`text-xs p-1 rounded border ${getDeadlineTypeColor(deadline.type)} cursor-pointer hover:opacity-80 transition-opacity`}
                                title={`${deadline.title} - ${deadline.courseName}`}
                            >
                                <div className="flex items-center space-x-1">
                                    <span className="text-xs">{getDeadlineTypeIcon(deadline.type)}</span>
                                    <span className="truncate">{deadline.title}</span>
                                </div>
                                <div className="text-xs opacity-75 truncate">{deadline.courseName}</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    const renderListView = () => {
        if (deadlines.length === 0) {
            return (
                <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-2">No upcoming deadlines</p>
                    <p className="text-sm text-gray-400">
                        Add assignments to your courses to see deadlines here
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {deadlines.map(deadline => (
                    <div key={deadline.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${getDeadlineTypeColor(deadline.type)}`}>
                                {getDeadlineTypeIcon(deadline.type)}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{deadline.title}</h3>
                                <p className="text-sm text-gray-600">{deadline.courseName}</p>
                                {deadline.notes && (
                                    <p className="text-xs text-gray-500 mt-1">{deadline.notes}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                    {formatDate(deadline.dueDate)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {deadline.weight > 0 && `${deadline.weight}% weight`}
                                </div>
                            </div>
                            <Link
                                to={`/course/${deadline.courseId}`}
                                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                title="View Course"
                            >
                                <Eye className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen lg:h-screen bg-gray-50 lg:overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <CalendarIcon className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-xl font-semibold text-gray-900">Calendar</span>
                    </div>
                    <Link
                        to="/"
                        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:h-screen">
                {/* Left Sidebar */}
                <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 min-h-screen lg:min-h-full lg:max-h-screen lg:overflow-y-auto lg:sticky lg:top-0 p-4 lg:p-6 transition-transform duration-300 ease-in-out lg:transition-none flex flex-col`}>
                    {/* Mobile Close Button */}
                    <div className="lg:hidden flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-black" />
                            </div>
                            <span className="text-xl font-semibold text-gray-900">GPAConnect</span>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Logo - hidden on mobile since it's in the header */}
                    <div className="hidden lg:flex items-center space-x-2 my-8">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-xl font-semibold text-gray-900">GPAConnect</span>
                    </div>

                    {/* Page Title */}
                    <div className="mb-6">
                        <h1 className="text-lg font-bold text-gray-900">Academic Calendar</h1>
                        <p className="text-sm text-gray-600">View and manage your upcoming deadlines</p>
                    </div>

                    {/* View Toggle */}
                    <div className="">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">VIEW OPTIONS</div>
                        <div className="flex flex-col space-y-2">
                            <button
                                onClick={() => setView('calendar')}
                                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors  font-medium ${view === 'calendar'
                                    ? 'bg-blue-50 text-gray-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <CalendarIcon className="h-4 w-4" />
                                <span>Calendar View</span>
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors  font-medium ${view === 'list'
                                    ? 'bg-blue-50 text-gray-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <List className="h-4 w-4" />
                                <span>List View</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-200">
                        <Link
                            to="/"
                            className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors w-full"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Back to Dashboard</span>
                        </Link>
                    </div>
                </div>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {/* Calendar View */}
                    {view === 'calendar' && (
                        <div className="rounded-xl shadow-sm border border-gray-200 p-6">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">{getMonthName(currentDate)}</h2>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={previousMonth}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentDate(new Date())}
                                        className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={nextMonth}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                                {/* Day Headers */}
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="bg-gray-50 p-3 text-center">
                                        <div className="text-sm font-medium text-gray-700">{day}</div>
                                    </div>
                                ))}

                                {/* Calendar Days */}
                                {renderCalendarView()}
                            </div>
                        </div>
                    )}

                    {/* List View */}
                    {view === 'list' && (
                        <div className="rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text mb-6">Upcoming Deadlines</h2>
                            {renderListView()}
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Calendar;
