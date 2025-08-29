import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { convertGPA, formatGPA } from '../utils/scaleConverter';
import AddCourseModal from './AddCourseModal';
import api from '../utils/api';
import {
    BookOpen,
    Search,
    Filter,
    Eye,
    Plus,
    Target,
    TrendingUp,
    Award,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    GraduationCap,
    Trash2,
    ArrowLeft,
    Grid3X3,
    List,
    X,
} from 'lucide-react';

const Courses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSemester, setFilterSemester] = useState('all');
    const [filterYear, setFilterYear] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/gpa/courses');
            if (response.data) {
                const coursesArray = Array.isArray(response.data)
                    ? response.data
                    : response.data.courses || [];
                setCourses(coursesArray);
            }
        } catch (err) {
            setError('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseAdded = (newCourse) => {
        setCourses((prev) => [newCourse, ...prev]);
        setError('');
    };

    const getLetterGrade = (course) => {
        if (course.gradeOverride !== undefined) return course.gradeOverride;
        if (course.gradePoints >= 4.0) return 'A+';
        if (course.gradePoints >= 3.7) return 'A';
        if (course.gradePoints >= 3.3) return 'A-';
        if (course.gradePoints >= 3.0) return 'B+';
        if (course.gradePoints >= 2.7) return 'B';
        if (course.gradePoints >= 2.3) return 'B-';
        if (course.gradePoints >= 2.0) return 'C+';
        if (course.gradePoints >= 1.7) return 'C';
        if (course.gradePoints >= 1.3) return 'C-';
        if (course.gradePoints >= 1.0) return 'D+';
        if (course.gradePoints >= 0.7) return 'D';
        return 'F';
    };

    const getGradeColor = (grade) => {
        if (grade.includes('A')) return 'bg-green-100 text-green-800';
        if (grade.includes('B')) return 'bg-blue-100 text-blue-800';
        if (grade.includes('C')) return 'bg-yellow-100 text-yellow-800';
        if (grade.includes('D')) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    };

    const formatGradePoints = (course) => {
        const userScale = user?.gpaScale || '4.0';
        if (course.gradeOverride !== undefined) {
            return formatGPA(
                convertGPA(course.gradePoints || 0, '4.0', userScale),
                userScale
            );
        }
        return formatGPA(course.gradePoints || 0, userScale);
    };

    const handleRevertOverride = async (courseId) => {
        try {
            const response = await api.put(`/gpa/courses/${courseId}/revert-override`);
            if (response.data) fetchCourses();
        } catch {
            setError('Failed to revert override');
        }
    };

    const handleDeleteCourse = async (courseId) => {
        try {
            const response = await api.delete(`/gpa/courses/${courseId}`);
            if (response.data) {
                setCourses((prev) => prev.filter((course) => course._id !== courseId));
            }
        } catch {
            setError('Failed to delete course');
        }
    };

    const filteredCourses = (courses || []).filter((course) => {
        const matchesSearch =
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (course.description &&
                course.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesSemester =
            filterSemester === 'all' || course.semester === filterSemester;
        const matchesYear =
            filterYear === 'all' || course.year === parseInt(filterYear);
        return matchesSearch && matchesSemester && matchesYear;
    });

    const getUniqueSemesters = () =>
        [...new Set((courses || []).map((c) => c.semester).filter(Boolean))].sort();

    const getUniqueYears = () =>
        [...new Set((courses || []).map((c) => c.year).filter(Boolean))].sort(
            (a, b) => b - a
        );

    const calculateStats = () => {
        const totalCourses = courses.length;
        const completedCourses = courses.filter(
            (c) => c.gradePoints !== undefined
        ).length;
        const totalCredits = courses.reduce(
            (sum, c) => sum + (c.credits || 0),
            0
        );
        const averageGPA =
            courses.length > 0
                ? courses.reduce((sum, c) => sum + (c.gradePoints || 0), 0) /
                courses.length
                : 0;

        return { totalCourses, completedCourses, totalCredits, averageGPA };
    };

    const stats = calculateStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left side - Page Title */}
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10  rounded-lg flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-black" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
                                <p className="text-sm text-gray-600">Manage your academic courses and track your progress</p>
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

                            <button
                                onClick={() => setIsAddCourseModalOpen(true)}
                                className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-md hover:shadow-lg transition-all duration-200"
                            >
                                <Plus className="h-4 w-4 " />
                                
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
                        <StatCard label="Total Courses" value={stats.totalCourses} Icon={BookOpen} />
                        <StatCard label="Completed" value={stats.completedCourses} Icon={Award} />
                        <StatCard label="Total Credits" value={stats.totalCredits} Icon={Target} />
                        <StatCard
                            label="Average GPA"
                            value={stats.averageGPA.toFixed(2)}
                            Icon={TrendingUp}
                        />
                    </div>

                    {/* Search + Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            {/* Search */}
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search courses..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* View Toggle and Filters */}
                            <div className="flex items-center space-x-3">
                                {/* View Mode Toggle */}
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'table'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        title="Table View"
                                    >
                                        <List className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        title="Grid View"
                                    >
                                        <Grid3X3 className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Filter Toggle */}
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                >
                                    <Filter className="h-4 w-4" />
                                    <span className="hidden sm:inline">Filters</span>
                                    {showFilters ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Semester
                                        </label>
                                        <select
                                            value={filterSemester}
                                            onChange={(e) => setFilterSemester(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="all">All Semesters</option>
                                            {getUniqueSemesters().map((semester) => (
                                                <option key={semester} value={semester}>
                                                    {semester}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Year
                                        </label>
                                        <select
                                            value={filterYear}
                                            onChange={(e) => setFilterYear(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="all">All Years</option>
                                            {getUniqueYears().map((year) => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Courses Display */}
                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500 mb-2">No courses found</p>
                            <p className="text-sm text-gray-400 mb-4">
                                {searchTerm || filterSemester !== 'all' || filterYear !== 'all'
                                    ? 'Try adjusting your filters or search terms'
                                    : 'Get started by adding your first course'}
                            </p>
                            {!searchTerm && filterSemester === 'all' && filterYear === 'all' && (
                                <button
                                    onClick={() => setIsAddCourseModalOpen(true)}
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Course
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Results Count */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">
                                    Showing {filteredCourses.length} of {courses.length} courses
                                </p>
                            </div>

                            {/* Table View */}
                            {viewMode === 'table' && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Course
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Term
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Credits
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Grade
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        GPA
                                                    </th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredCourses.map((course) => (
                                                    <tr key={course._id} className="hover:bg-gray-50">
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border border-blue-300">
                                                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                                                </div>
                                                                <div className="ml-3">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {course.name}
                                                                    </div>
                                                                    {course.description && (
                                                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                            {course.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {course.semester || 'N/A'} {course.year || ''}
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {course.credits || 'N/A'}
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center space-x-2">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(course.gradeOverride !== undefined ? course.gradeOverride : course.grade)}`}>
                                                                    {course.gradeOverride !== undefined ? course.gradeOverride : course.grade}
                                                                </span>
                                                                {course.gradeOverride !== undefined && (
                                                                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                                                                        Override
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatGradePoints(course)}
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex items-center space-x-2">
                                                                <Link
                                                                    to={`/course/${course._id}`}
                                                                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                                    title="View Course"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                                {course.gradeOverride !== undefined && (
                                                                    <button
                                                                        onClick={() => handleRevertOverride(course._id)}
                                                                        className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                                                                        title="Revert to Original Grade"
                                                                    >
                                                                        <RefreshCw className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDeleteCourse(course._id)}
                                                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                                    title="Delete Course"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Grid View */}
                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                    {filteredCourses.map((course) => (
                                        <CourseCard
                                            key={course._id}
                                            course={course}
                                            getGradeColor={getGradeColor}
                                            formatGradePoints={formatGradePoints}
                                            onView={() => window.location.href = `/course/${course._id}`}
                                            onRevertOverride={() => handleRevertOverride(course._id)}
                                            onDelete={() => handleDeleteCourse(course._id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add Course Modal */}
            <AddCourseModal
                isOpen={isAddCourseModalOpen}
                onClose={() => setIsAddCourseModalOpen(false)}
                onCourseAdded={handleCourseAdded}
            />
        </>
    );
};

// Course Card Component for Grid View
const CourseCard = ({ course, getGradeColor, formatGradePoints, onView, onRevertOverride, onDelete }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center border border-blue-300">
                <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-center space-x-1">
                <button
                    onClick={onView}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                    title="View Course"
                >
                    <Eye className="h-4 w-4" />
                </button>
                {course.gradeOverride !== undefined && (
                    <button
                        onClick={onRevertOverride}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50"
                        title="Revert to Original Grade"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                )}
                <button
                    onClick={onDelete}
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                    title="Delete Course"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.name}</h3>

        {course.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
        )}

        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Term:</span>
                <span className="text-gray-900">{course.semester || 'N/A'} {course.year || ''}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Credits:</span>
                <span className="text-gray-900">{course.credits || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">Grade:</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(course.gradeOverride !== undefined ? course.gradeOverride : course.grade)}`}>
                    {course.gradeOverride !== undefined ? course.gradeOverride : course.grade}
                </span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-500">GPA:</span>
                <span className="text-gray-900">{formatGradePoints(course)}</span>
            </div>
        </div>

        {course.gradeOverride !== undefined && (
            <div className="mt-3 pt-2 border-t border-gray-100">
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                    Grade Override Active
                </span>
            </div>
        )}
    </div>
);

// Small reusable stat card
const StatCard = ({ label, value, Icon }) => (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{label}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </div>
        </div>
    </div>
);

export default Courses;
