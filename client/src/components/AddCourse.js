import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, GraduationCap, BarChart3, BookOpen, X, Save } from 'lucide-react';

const AddCourse = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        credits: '',
        grade: '',
        semester: 'Fall',
        year: new Date().getFullYear(),
        category: 'General',
        gpaScale: '4.0',
        courseType: 'simple'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Convert credits to number and validate
            if (!formData.name || !formData.credits || !formData.grade) {
                setError('Please fill in all required fields');
                setLoading(false);
                return;
            }

            const courseData = {
                ...formData,
                credits: parseFloat(formData.credits),
                year: parseInt(formData.year),
                courseType: 'simple'
            };

            const response = await fetch('/api/gpa/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(courseData)
            });

            if (response.ok) {
                navigate('/courses');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to add course');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const semesters = ['Fall', 'Spring', 'Summer', 'Winter'];
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
    const categories = ['General', 'Math', 'Science', 'English', 'History', 'Art', 'Music', 'Physical Education', 'Other'];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
                            <GraduationCap className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add Course</h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-2">Create a new course to track your academic progress</p>
                        </div>
                    </div>
                    <Link
                        to="/"
                        className="text-gray-600 hover:text-gray-700 transition-colors flex items-center space-x-2 text-sm font-medium self-start sm:self-auto"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-300 rounded-lg flex items-center justify-center mr-3">
                                <BookOpen className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Course Information</h2>
                                <p className="text-xs sm:text-sm text-gray-600">Fill in the details below to add your course</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            {/* Course Name */}
                            <div>
                                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Course Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    autoComplete="off"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                    placeholder="e.g., Introduction to Computer Science"
                                />
                            </div>

                            {/* Course Code */}
                            <div>
                                <label htmlFor="code" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Course Code
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    autoComplete="off"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                    placeholder="e.g., CS101"
                                />
                            </div>

                            {/* Credits */}
                            <div>
                                <label htmlFor="credits" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Credits *
                                </label>
                                <input
                                    type="number"
                                    id="credits"
                                    name="credits"
                                    value={formData.credits}
                                    onChange={handleChange}
                                    required
                                    min="0.5"
                                    max="10"
                                    step="0.5"
                                    autoComplete="off"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                    placeholder="3"
                                />
                            </div>

                            {/* Grade */}
                            <div>
                                <label htmlFor="grade" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Grade (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="grade"
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleChange}
                                    autoComplete="off"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                    placeholder="e.g., A, A+, 95, 4.0 (leave blank if unknown)"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Enter letter grade (A, B+, etc.) or percentage (95) or GPA points (4.0). Leave blank if you don't have a grade yet.
                                </p>
                            </div>

                            {/* Semester */}
                            <div>
                                <label htmlFor="semester" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Semester
                                </label>
                                <select
                                    id="semester"
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                >
                                    {semesters.map(semester => (
                                        <option key={semester} value={semester}>{semester}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Year */}
                            <div>
                                <label htmlFor="year" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Year
                                </label>
                                <select
                                    id="year"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category */}
                            <div>
                                <label htmlFor="category" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            {/* GPA Scale */}
                            <div>
                                <label htmlFor="gpaScale" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    GPA Scale
                                </label>
                                <select
                                    id="gpaScale"
                                    name="gpaScale"
                                    value={formData.gpaScale}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                >
                                    <option value="4.0">4.0 Scale</option>
                                    <option value="4.3">4.3 Scale</option>
                                    <option value="percentage">Percentage (100%)</option>
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => navigate('/courses')}
                                className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                <X className="h-4 w-4 mr-2 inline" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 sm:px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-gray-400 to-gray-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                                ) : (
                                    <Save className="h-4 w-4 mr-2 inline" />
                                )}
                                {loading ? 'Adding...' : 'Add Course'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddCourse;
