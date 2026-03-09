import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { percentageToGPA, formatGPA, getGradeColorByLetter } from '../utils/scaleConverter';
import AddCourseModal from './AddCourseModal';
import api from '../utils/api';
import {
    BookOpen, Search, Filter, Eye, Plus, Target, TrendingUp, Award,
    ChevronDown, ChevronUp, RefreshCw, GraduationCap, Trash2, ArrowLeft,
    Grid3X3, List, X, Menu, Calendar, BarChart3, Settings, User,
    Upload, FileText, Layout, Sparkles
} from 'lucide-react';

// Memoized stat card — only re-renders when its props change
const StatCard = React.memo(({ label, value, Icon }) => (
    <div className=" text-honolulu_blue rounded-xl p-4 py-6 sm:p-6 border  border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{label}</p>
                <p className="text-lg sm:text-2xl font-bold ">{value}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12  rounded-lg flex items-center justify-center">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </div>
        </div>
    </div>
));

// Memoized course card — only re-renders when its specific course data changes
const CourseCard = React.memo(({ course, userScale, onView, onRevertOverride, onDelete }) => {
    const displayGrade = course.gradeOverride !== undefined ? course.gradeOverride : course.grade;
    const percentage = course.calculatedGrade || course.grade || 0;
    const gpaValue = percentageToGPA(percentage, userScale);
    const formattedGPA = formatGPA(gpaValue, userScale);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-1">
                    <button onClick={onView} className="text-honolulu_blue hover:text-blue_green p-1 rounded hover:bg-vivid_sky_blue-100" title="View Course">
                        <Eye className="h-4 w-4" />
                    </button>
                    {course.gradeOverride !== undefined && (
                        <button onClick={onRevertOverride} className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50" title="Revert to Original Grade">
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    )}
                    <button onClick={onDelete} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Delete Course">
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
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getGradeColorByLetter(String(displayGrade))}`}>
                        {displayGrade}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">GPA:</span>
                    <span className="text-gray-900">{formattedGPA}</span>
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
});

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
    const [viewMode, setViewMode] = useState('table');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const userScale = user?.gpaScale || '4.0';

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/gpa/courses');
            if (response.data) {
                const coursesArray = Array.isArray(response.data) ? response.data : response.data.courses || [];
                setCourses(coursesArray);
            }
        } catch (err) {
            setError('Failed to fetch courses');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseAdded = useCallback((newCourse) => {
        setCourses((prev) => [newCourse, ...prev]);
        setError('');
    }, []);

    const handleRevertOverride = useCallback(async (courseId) => {
        try {
            const response = await api.put(`/gpa/courses/${courseId}/revert-override`);
            if (response.data) fetchCourses();
        } catch {
            setError('Failed to revert override');
        }
    }, []);

    const handleDeleteCourse = useCallback(async (courseId) => {
        try {
            const response = await api.delete(`/gpa/courses/${courseId}`);
            if (response.data) {
                setCourses((prev) => prev.filter((course) => course._id !== courseId));
            }
        } catch {
            setError('Failed to delete course');
        }
    }, []);

    // Memoize filtered courses — only recompute when courses/search/filters change
    const filteredCourses = useMemo(() => {
        return (courses || []).filter((course) => {
            const matchesSearch =
                course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesSemester = filterSemester === 'all' || course.semester === filterSemester;
            const matchesYear = filterYear === 'all' || course.year === parseInt(filterYear);
            return matchesSearch && matchesSemester && matchesYear;
        });
    }, [courses, searchTerm, filterSemester, filterYear]);

    // Memoize unique semesters/years
    const uniqueSemesters = useMemo(() =>
        [...new Set((courses || []).map((c) => c.semester).filter(Boolean))].sort(),
        [courses]
    );

    const uniqueYears = useMemo(() =>
        [...new Set((courses || []).map((c) => c.year).filter(Boolean))].sort((a, b) => b - a),
        [courses]
    );

    // Memoize stats — only recompute when courses change
    const stats = useMemo(() => {
        const totalCourses = courses.length;
        const completedCourses = courses.filter((c) => c.gradePoints !== undefined).length;
        const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);
        const averageGPA = courses.length > 0
            ? courses.reduce((sum, c) => sum + (c.gradePoints || 0), 0) / courses.length
            : 0;
        return { totalCourses, completedCourses, totalCredits, averageGPA };
    }, [courses]);

    // Memoize formatGradePoints so it doesn't cause re-renders
    const formatGradePoints = useCallback((course) => {
        const percentage = course.calculatedGrade || course.grade || 0;
        const gpaValue = percentageToGPA(percentage, userScale);
        return formatGPA(gpaValue, userScale);
    }, [userScale]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-honolulu_blue"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center ">
                            <BookOpen className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-xl font-semibold text-gray-900">Courses</span>
                    </div>
                    <Link to="/" className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:min-h-screen">
                {/* Left Sidebar */}
                <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 min-h-screen lg:min-h-full lg:max-h-screen lg:overflow-y-auto lg:sticky lg:top-0 p-4 lg:p-6 transition-transform duration-300 ease-in-out lg:transition-none flex flex-col`}>
                    <div className="lg:hidden flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center ">
                                <GraduationCap className="h-5 w-5 text-black" />
                            </div>
                            <span className="text-xl font-semibold text-gray-900">GPAConnect</span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="hidden lg:flex items-center space-x-2 my-8">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center ">
                            <GraduationCap className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-xl font-semibold text-gray-900">GPAConnect</span>
                    </div>

                    <nav className="space-y-2 mb-6">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">NAVIGATION</div>
                        <Link to="/" className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <BarChart3 className="h-5 w-5" /><span>Dashboard</span>
                        </Link>
                        <div className="flex items-center space-x-3 px-3 py-2 bg-blue-50 text-black rounded-lg">
                            <BookOpen className="h-5 w-5" /><span>Courses</span>
                        </div>
                        <Link to="/calendar" className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Calendar className="h-5 w-5" /><span>Calendar</span>
                        </Link>
                        <Link to="/settings" className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Settings className="h-5 w-5" /><span>GPA Settings</span>
                        </Link>
                        <Link to="/account" className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <User className="h-5 w-5" /><span>Account</span>
                        </Link>
                    </nav>

                    <div className="mb-6">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">QUICK ACTIONS</div>
                        <button onClick={() => setIsAddCourseModalOpen(true)} className="w-full flex items-center space-x-3 px-3 py-2 bg-honolulu_blue hover:bg-blue_green text-white font-medium rounded-lg transition-colors">
                            <Plus className="h-5 w-5" /><span>Add Course</span>
                        </button>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">IMPORT TOOLS</div>
                        <Link to="/import/transcript" className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Upload className="h-5 w-5" /><span>Import Transcript</span>
                        </Link>
                        <Link to="/import/syllabus" className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <FileText className="h-5 w-5" /><span>Import Syllabus</span>
                        </Link>
                        <Link to="/import/templates" className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Layout className="h-5 w-5" /><span>Course Templates</span>
                        </Link>
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4">AI ASSISTANT</div>
                        <Link to="/chat" className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            <Sparkles className="h-5 w-5" /><span>GPA Buddy</span>
                        </Link>
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-200">
                        <Link to="/" className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors w-full">
                            <ArrowLeft className="h-5 w-5" /><span>Back to Dashboard</span>
                        </Link>
                    </div>
                </div>

                {isSidebarOpen && (
                    <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)} />
                )}

                {/* Main Content */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
                        <StatCard label="Total Courses" value={stats.totalCourses} Icon={BookOpen} />
                        <StatCard label="Completed" value={stats.completedCourses} Icon={Award} />
                        <StatCard label="Total Credits" value={stats.totalCredits} Icon={Target} />
                        <StatCard label="Average GPA" value={stats.averageGPA.toFixed(2)} Icon={TrendingUp} />
                    </div>

                    {/* Search + Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input type="text" placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                    {searchTerm && (
                                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    <button onClick={() => setViewMode('table')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white text-honolulu_blue shadow-sm' : 'text-gray-600 hover:text-gray-900'}`} title="Table View">
                                        <List className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-honolulu_blue shadow-sm' : 'text-gray-600 hover:text-gray-900'}`} title="Grid View">
                                        <Grid3X3 className="h-4 w-4" />
                                    </button>
                                </div>

                                <button onClick={() => setShowFilters(!showFilters)}
                                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-700 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                    <Filter className="h-4 w-4" />
                                    <span className="hidden sm:inline">Filters</span>
                                    {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                                        <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            <option value="all">All Semesters</option>
                                            {uniqueSemesters.map((semester) => (
                                                <option key={semester} value={semester}>{semester}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                                        <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                            <option value="all">All Years</option>
                                            {uniqueYears.map((year) => (
                                                <option key={year} value={year}>{year}</option>
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
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">Showing {filteredCourses.length} of {courses.length} courses</p>
                            </div>

                            {viewMode === 'table' && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPA</th>
                                                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredCourses.map((course) => (
                                                    <tr key={course._id} className="hover:bg-gray-50">
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="ml-3">
                                                                    <div className="text-sm font-medium text-gray-900">{course.name}</div>
                                                                    {course.description && (
                                                                        <div className="text-sm text-gray-500 truncate max-w-xs">{course.description}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {course.semester || 'N/A'} {course.year || ''}
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.credits || 'N/A'}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center space-x-2">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full `}>
                                                                    {course.gradeOverride !== undefined ? course.gradeOverride : course.grade}
                                                                </span>
                                                                {course.gradeOverride !== undefined && (
                                                                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">Override</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatGradePoints(course)}</td>
                                                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex items-center space-x-2">
                                                                <Link to={`/course/${course._id}`} className="text-honolulu_blue hover:text-blue_green p-1 rounded hover:bg-vivid_sky_blue-100" title="View Course">
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                                {course.gradeOverride !== undefined && (
                                                                    <button onClick={() => handleRevertOverride(course._id)} className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50" title="Revert to Original Grade">
                                                                        <RefreshCw className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                                <button onClick={() => handleDeleteCourse(course._id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" title="Delete Course">
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

                            {viewMode === 'grid' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                    {filteredCourses.map((course) => (
                                        <CourseCard
                                            key={course._id}
                                            course={course}
                                            userScale={userScale}
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

            <AddCourseModal
                isOpen={isAddCourseModalOpen}
                onClose={() => setIsAddCourseModalOpen(false)}
                onCourseAdded={handleCourseAdded}
            />
        </div>
    );
};

export default Courses;
