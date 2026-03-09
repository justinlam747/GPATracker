import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, GraduationCap, BarChart3, BookOpen, X, Save } from 'lucide-react';

const AddCourse = () => {
    const navigate = useNavigate();
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

            const response = await api.post('/gpa/courses', courseData);

            if (response.data) {
                navigate('/courses');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add course. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const semesters = ['Fall', 'Spring', 'Summer', 'Winter'];
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
    const categories = ['General', 'Math', 'Science', 'English', 'History', 'Art', 'Music', 'Physical Education', 'Other'];

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="mobile-header-3d px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                        <div className="icon-3d w-10 h-10 rounded-xl flex items-center justify-center">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">Add Course</h1>
                            <p className="text-sm sm:text-base text-blue-400 mt-2">Create a new course to track your academic progress</p>
                        </div>
                    </div>
                    <Link
                        to="/"
                        className="text-blue-400 hover:text-blue-800 transition-colors flex items-center space-x-2 text-sm font-medium self-start sm:self-auto"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Dashboard</span>
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="card-3d-static rounded-xl">
                    <div className="px-4 sm:px-6 py-4 border-b border-white/40">
                        <div className="flex items-center">
                            <div className="icon-3d w-10 h-10 rounded-xl flex items-center justify-center mr-3">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-semibold text-blue-900">Course Information</h2>
                                <p className="text-xs sm:text-sm text-blue-400">Fill in the details below to add your course</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {error && (
                            <div className="alert-error-3d px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            {/* Course Name */}
                            <div>
                                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-blue-900 mb-2">
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
                                    className="input-3d w-full text-sm sm:text-base"
                                    placeholder="e.g., Introduction to Computer Science"
                                />
                            </div>

                            {/* Course Code */}
                            <div>
                                <label htmlFor="code" className="block text-xs sm:text-sm font-medium text-blue-900 mb-2">
                                    Course Code
                                </label>
                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleChange}
                                    autoComplete="off"
                                    className="input-3d w-full text-sm sm:text-base"
                                    placeholder="e.g., CS101"
                                />
                            </div>

                            {/* Credits */}
                            <div>
                                <label htmlFor="credits" className="block text-xs sm:text-sm font-medium text-blue-900 mb-2">
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
                                    className="input-3d w-full text-sm sm:text-base"
                                    placeholder="3"
                                />
                            </div>

                            {/* Grade */}
                            <div>
                                <label htmlFor="grade" className="block text-xs sm:text-sm font-medium text-blue-900 mb-2">
                                    Grade (Optional)
                                </label>
                                <input
                                    type="text"
                                    id="grade"
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleChange}
                                    autoComplete="off"
                                    className="input-3d w-full text-sm sm:text-base"
                                    placeholder="e.g., A, A+, 95, 4.0 (leave blank if unknown)"
                                />
                                <p className="mt-1 text-xs text-blue-300">
                                    Enter letter grade (A, B+, etc.) or percentage (95) or GPA points (4.0). Leave blank if you don't have a grade yet.
                                </p>
                            </div>

                            {/* Semester */}
                            <div>
                                <label htmlFor="semester" className="block text-xs sm:text-sm font-medium text-blue-900 mb-2">
                                    Semester
                                </label>
                                <select
                                    id="semester"
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    className="select-3d-native w-full text-sm sm:text-base"
                                >
                                    {semesters.map(semester => (
                                        <option key={semester} value={semester}>{semester}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Year */}
                            <div>
                                <label htmlFor="year" className="block text-xs sm:text-sm font-medium text-blue-900 mb-2">
                                    Year
                                </label>
                                <select
                                    id="year"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    className="select-3d-native w-full text-sm sm:text-base"
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category */}
                            <div>
                                <label htmlFor="category" className="block text-xs sm:text-sm font-medium text-blue-900 mb-2">
                                    Category
                                </label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="select-3d-native w-full text-sm sm:text-base"
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>

                            {/* GPA Scale */}
                            <div>
                                <label htmlFor="gpaScale" className="block text-xs sm:text-sm font-medium text-blue-900 mb-2">
                                    GPA Scale
                                </label>
                                <select
                                    id="gpaScale"
                                    name="gpaScale"
                                    value={formData.gpaScale}
                                    onChange={handleChange}
                                    className="select-3d-native w-full text-sm sm:text-base"
                                >
                                    <option value="4.0">4.0 Scale</option>
                                    <option value="4.3">4.3 Scale</option>
                                    <option value="percentage">Percentage (100%)</option>
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-white/40">
                            <button
                                type="button"
                                onClick={() => navigate('/courses')}
                                className="btn-3d-secondary"
                            >
                                <X className="h-4 w-4 mr-2 inline" />
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-3d-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
