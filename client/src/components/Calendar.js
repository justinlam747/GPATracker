import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
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
    Eye
} from 'lucide-react';

const Calendar = () => {
    const { user } = useAuth();
    const [view, setView] = useState('calendar'); // 'calendar' or 'list'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [courses, setCourses] = useState([]);
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left side - Page Title */}
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10  rounded-lg flex items-center justify-center">
                            <CalendarIcon className="h-5 w-5 text-black" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Academic Calendar</h1>
                            <p className="text-sm text-gray-600">View and manage your upcoming deadlines</p>
                        </div>
                    </div>

                    {/* Right side - Navigation and Actions */}
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/"
                            className="text-gray-600 hover:text-blue-600 transition-colors flex items-center space-x-2 text-sm font-medium"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                        <Link
                            to="/courses"
                            className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-md hover:shadow-lg transition-all duration-200"
                        >
                            <BookOpen className="h-4 w-4" />
                          
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* View Toggle */}
                <div className="mb-6">
                    <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-gray-200 w-fit">
                        <button
                            onClick={() => setView('calendar')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'calendar'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <CalendarIcon className="h-4 w-4 inline mr-2" />
                            Calendar View
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'list'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <List className="h-4 w-4 inline mr-2" />
                            List View
                        </button>
                    </div>
                </div>

                {/* Calendar View */}
                {view === 'calendar' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">{getMonthName(currentDate)}</h2>
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Deadlines</h2>
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
    );
};

export default Calendar;
