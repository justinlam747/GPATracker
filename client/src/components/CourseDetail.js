import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, X, BookOpen, Award, ArrowLeft, GraduationCap, Menu } from 'lucide-react';
import Footer from './Footer';
import api from '../utils/api';
import { Link } from 'react-router-dom';


const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Assignment form state
    const [showAssignmentForm, setShowAssignmentForm] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [assignmentForm, setAssignmentForm] = useState({
        name: '',
        type: 'Assignment',
        weight: 0,
        grade: '',
        maxGrade: 100,
        dueDate: '',
        notes: '',
        isCompleted: false
    });

    // Grade override state
    const [showGradeOverride, setShowGradeOverride] = useState(false);
    const [gradeOverride, setGradeOverride] = useState('');
    const [gradeOverrideType, setGradeOverrideType] = useState('letter');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const fetchCourse = useCallback(async () => {
        try {
            const response = await api.get(`/gpa/courses/${id}`);
            setCourse(response.data.course);
        } catch (error) {
            setError('Failed to fetch course details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCourse();
    }, [fetchCourse]);

    const handleAssignmentChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAssignmentForm({
            ...assignmentForm,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const resetAssignmentForm = () => {
        setAssignmentForm({
            name: '',
            type: 'Assignment',
            weight: 0,
            grade: '',
            maxGrade: 100,
            dueDate: '',
            notes: '',
            isCompleted: false
        });
        setEditingAssignment(null);
        setShowAssignmentForm(false);
    };

    const handleAddAssignment = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post(`/gpa/courses/${id}/assignments`, assignmentForm);
            setCourse(response.data.course);
            setSuccess('Assignment added successfully!');
            resetAssignmentForm();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to add assignment');
        }
    };

    const handleEditAssignment = (assignment) => {
        setEditingAssignment(assignment._id);
        setAssignmentForm({
            name: assignment.name,
            type: assignment.type,
            weight: assignment.weight,
            grade: assignment.grade,
            maxGrade: assignment.maxGrade,
            dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
            notes: assignment.notes,
            isCompleted: assignment.isCompleted
        });
        setShowAssignmentForm(true);
    };

    const handleUpdateAssignment = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/gpa/courses/${id}/assignments/${editingAssignment}`, assignmentForm);
            setCourse(response.data.course);
            setSuccess('Assignment updated successfully!');
            resetAssignmentForm();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update assignment');
        }
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (!window.confirm('Are you sure you want to delete this assignment?')) return;

        try {
            const response = await api.delete(`/gpa/courses/${id}/assignments/${assignmentId}`);
            setCourse(response.data.course);
            setSuccess('Assignment deleted successfully!');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to delete assignment');
        }
    };

    const handleDeleteCourse = async () => {


        try {
            await api.delete(`/gpa/courses/${id}`);
            setSuccess('Course deleted successfully!');
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to delete course');
        }
    };

    const handleGradeOverride = async (e) => {
        e.preventDefault();
        try {
            const value = gradeOverrideType === 'percentage' ? parseFloat(gradeOverride) : gradeOverride;
            const response = await api.put(`/gpa/courses/${id}/grade-override`, { gradeOverride: value });
            setCourse(response.data.course);
            setSuccess('Grade override set successfully!');
            setShowGradeOverride(false);
            setGradeOverride('');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to set grade override');
        }
    };

    const getFinalGrade = () => {
        // Use the course's getFinalGrade method if available, otherwise fall back to manual logic
        if (course.getFinalGrade && typeof course.getFinalGrade === 'function') {
            return course.getFinalGrade();
        }

        // Fallback logic
        if (course.gradeOverride !== undefined) {
            return {
                grade: course.gradeOverride,
                gradePoints: course.gradeOverridePoints,
                isOverridden: true
            };
        } else if (course.calculatedGrade !== undefined) {
            return {
                grade: course.calculatedGrade,
                gradePoints: course.calculatedGradePoints,
                isOverridden: false
            };
        } else if (course.grade !== undefined) {
            return {
                grade: course.grade,
                gradePoints: course.gradePoints,
                isOverridden: false
            };
        }
        return null;
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (!course) return <div className="text-center py-8">Course not found</div>;

    const finalGrade = getFinalGrade();

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
                            <BookOpen className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-xl font-semibold text-gray-900">{course.name}</span>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
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
                        <h1 className="text-lg font-bold text-gray-900">{course.name}</h1>
                        <p className="text-sm text-gray-600">Course Details & Assignments</p>
                    </div>

                    {/* Quick Actions */}
                    <div className="">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">QUICK ACTIONS</div>
                        <button
                            onClick={() => setShowAssignmentForm(true)}
                            className="w-full flex items-center space-x-3 px-3 py-2 text-white font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700  border hover:bg-gray-50 rounded-lg transition-all duration-300 border border-gray-300"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Add Assignment</span>
                        </button>

                        <Link
                            to="/courses"
                            className="w-full mt-3 flex items-center space-x-3 px-3 py-2 text-gray-600  font-medium   border hover:bg-gray-50 rounded-lg transition-all duration-300 border border-gray-300"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>Courses</span>
                        </Link>
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

                    {/* Course Info Card */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <span className="text-sm font-medium text-gray-500">Course Code:</span>
                                <p className="text-lg">{course.code || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Credits:</span>
                                <p className="text-lg">{course.credits}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Semester:</span>
                                <p className="text-lg">{course.semester} {course.year}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">GPA Scale:</span>
                                <p className="text-lg">
                                    {course.gpaScale === '4.0' && '4.0 Scale'}
                                    {course.gpaScale === '4.3' && '4.3 Scale'}
                                    {course.gpaScale === 'percentage' && 'Percentage Scale'}
                                </p>
                            </div>
                        </div>

                        {/* Final Grade Display */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Final Grade</h3>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span className="text-2xl font-bold  bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                                            {finalGrade ? finalGrade.grade : 'N/A'}
                                        </span>
                                        {finalGrade && (
                                            <span className="text-lg text-gray-600">
                                                ({finalGrade.gradePoints} GPA points)
                                            </span>
                                        )}
                                        {finalGrade?.isOverridden && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                <Award className="h-3 w-3 mr-1" />
                                                Overridden
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowGradeOverride(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700"
                                >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Override Grade
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Assignments Section */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Mark Breakdown</h2>
                            <button
                                onClick={() => setShowAssignmentForm(true)}
                                className="inline-flex items-center px-4 py-2  text-sm font-medium rounded-md text-gray-600 border border-gray-300 hover:bg-gray-50"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Assignment
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
                                {success}
                            </div>
                        )}

                        {/* Assignments List */}
                        {course.assignments && course.assignments.length > 0 ? (
                            <div className="space-y-4">
                                {course.assignments.map((assignment) => (
                                    <div key={assignment._id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="text-lg font-medium text-gray-900">{assignment.name}</h3>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {assignment.type}
                                                </span>
                                                {assignment.isCompleted && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEditAssignment(assignment)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAssignment(assignment._id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-500">Weight:</span>
                                                <p>{assignment.weight}%</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-500">Grade:</span>
                                                <p className="font-medium">{assignment.grade}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-500">Max Grade:</span>
                                                <p>{assignment.maxGrade}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-500">Due Date:</span>
                                                <p>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                        </div>

                                        {assignment.notes && (
                                            <div className="mt-3">
                                                <span className="font-medium text-gray-500">Notes:</span>
                                                <p className="text-sm text-gray-600 mt-1">{assignment.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No assignments yet. Add your first assignment to start tracking your progress!</p>
                            </div>
                        )}
                    </div>

                    {/* Assignment Performance Summary */}
                    {course.assignments && course.assignments.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Assignment Performance</h2>

                            {/* Performance Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-600">Average Grade</h4>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                                        {(() => {
                                            const totalGrade = course.assignments.reduce((sum, assignment) => {
                                                const grade = typeof assignment.grade === 'number' ? assignment.grade :
                                                    parseFloat(assignment.grade) || 0;
                                                return sum + grade;
                                            }, 0);
                                            return (totalGrade / course.assignments.length).toFixed(1);
                                        })()}%
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-600">Total Weight</h4>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                                        {course.assignments.reduce((sum, assignment) => sum + (assignment.weight || 0), 0)}%
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-600">Assignments</h4>
                                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                                        {course.assignments.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assignment Form Modal */}
                    {showAssignmentForm && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
                                    </h3>
                                    <button
                                        onClick={resetAssignmentForm}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={editingAssignment ? handleUpdateAssignment : handleAddAssignment} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={assignmentForm.name}
                                            onChange={handleAssignmentChange}
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Type</label>
                                        <select
                                            name="type"
                                            value={assignmentForm.type}
                                            onChange={handleAssignmentChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="Assignment">Assignment</option>
                                            <option value="Quiz">Quiz</option>
                                            <option value="Exam">Exam</option>
                                            <option value="Project">Project</option>
                                            <option value="Participation">Participation</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Weight (%) *</label>
                                            <input
                                                type="number"
                                                name="weight"
                                                value={assignmentForm.weight}
                                                onChange={handleAssignmentChange}
                                                required
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Max Grade</label>
                                            <input
                                                type="number"
                                                name="maxGrade"
                                                value={assignmentForm.maxGrade}
                                                onChange={handleAssignmentChange}
                                                min="1"
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Grade *</label>
                                        <input
                                            type="text"
                                            name="grade"
                                            value={assignmentForm.grade}
                                            onChange={handleAssignmentChange}
                                            required
                                            placeholder="A+ or 95"
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                        <input
                                            type="date"
                                            name="dueDate"
                                            value={assignmentForm.dueDate}
                                            onChange={handleAssignmentChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                                        <textarea
                                            name="notes"
                                            value={assignmentForm.notes}
                                            onChange={handleAssignmentChange}
                                            rows="3"
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isCompleted"
                                            checked={assignmentForm.isCompleted}
                                            onChange={handleAssignmentChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-900">Mark as completed</label>
                                    </div>

                                    <div className="flex justify-between space-x-3">
                                        <button
                                            type="button"
                                            onClick={resetAssignmentForm}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-black "
                                        >
                                            {editingAssignment ? 'Update' : 'Add'} Assignment
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Grade Override Modal */}
                    {showGradeOverride && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Set Grade Override</h3>
                                    <button
                                        onClick={() => setShowGradeOverride(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleGradeOverride} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade Type</label>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    value="letter"
                                                    checked={gradeOverrideType === 'letter'}
                                                    onChange={(e) => setGradeOverrideType(e.target.value)}
                                                    className="mr-2"
                                                />
                                                Letter Grade
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    value="percentage"
                                                    checked={gradeOverrideType === 'percentage'}
                                                    onChange={(e) => setGradeOverrideType(e.target.value)}
                                                    className="mr-2"
                                                />
                                                Percentage
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Grade Override *</label>
                                        {gradeOverrideType === 'letter' ? (
                                            <select
                                                value={gradeOverride}
                                                onChange={(e) => setGradeOverride(e.target.value)}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Select Grade</option>
                                                {course.gpaScale === '4.3' ? (
                                                    <>
                                                        <option value="A+">A+ (4.3)</option>
                                                        <option value="A">A (4.0)</option>
                                                        <option value="A-">A- (3.7)</option>
                                                        <option value="B+">B+ (3.3)</option>
                                                        <option value="B">B (3.0)</option>
                                                        <option value="B-">B- (2.7)</option>
                                                        <option value="C+">C+ (2.3)</option>
                                                        <option value="C">C (2.0)</option>
                                                        <option value="C-">C- (1.7)</option>
                                                        <option value="D+">D+ (1.3)</option>
                                                        <option value="D">D (1.0)</option>
                                                        <option value="D-">D- (0.7)</option>
                                                        <option value="F">F (0.0)</option>
                                                    </>
                                                ) : course.gpaScale === 'percentage' ? (
                                                    <>
                                                        <option value="A+">A+ (97%)</option>
                                                        <option value="A">A (93%)</option>
                                                        <option value="A-">A- (90%)</option>
                                                        <option value="B+">B+ (87%)</option>
                                                        <option value="B">B (83%)</option>
                                                        <option value="B-">B- (80%)</option>
                                                        <option value="C+">C+ (77%)</option>
                                                        <option value="C">C (73%)</option>
                                                        <option value="C-">C- (70%)</option>
                                                        <option value="D+">D+ (67%)</option>
                                                        <option value="D">D (63%)</option>
                                                        <option value="D-">D- (60%)</option>
                                                        <option value="F">F (50%)</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="A+">A+ (4.0)</option>
                                                        <option value="A">A (4.0)</option>
                                                        <option value="A-">A- (3.7)</option>
                                                        <option value="B+">B+ (3.3)</option>
                                                        <option value="B">B (3.0)</option>
                                                        <option value="B-">B- (2.7)</option>
                                                        <option value="C+">C+ (2.3)</option>
                                                        <option value="C">C (2.0)</option>
                                                        <option value="C-">C- (1.7)</option>
                                                        <option value="D+">D+ (1.3)</option>
                                                        <option value="D">D (1.0)</option>
                                                        <option value="D-">D- (0.7)</option>
                                                        <option value="F">F (0.0)</option>
                                                    </>
                                                )}
                                            </select>
                                        ) : (
                                            <input
                                                type="number"
                                                min={course.gpaScale === 'percentage' ? 0 : 0}
                                                max={course.gpaScale === 'percentage' ? 100 : (course.gpaScale === '4.3' ? 4.3 : 4.0)}
                                                step={course.gpaScale === 'percentage' ? 0.1 : 0.1}
                                                value={gradeOverride}
                                                onChange={(e) => setGradeOverride(e.target.value)}
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                placeholder={course.gpaScale === 'percentage' ? "e.g., 95.5" : (course.gpaScale === '4.3' ? "e.g., 4.3" : "e.g., 4.0")}
                                            />
                                        )}
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowGradeOverride(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Set Override
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}

        </div>
    );
};

export default CourseDetail;
