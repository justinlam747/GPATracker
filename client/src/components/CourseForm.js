import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Save, ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const CourseForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        credits: '',
        grade: '',
        semester: '',
        year: new Date().getFullYear(),
        category: 'General',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'P', 'NP', 'W', 'I'];
    const semesters = ['Fall', 'Spring', 'Summer', 'Winter'];
    const categories = ['General', 'Mathematics', 'Science', 'Humanities', 'Social Sciences', 'Arts', 'Business', 'Engineering', 'Computer Science', 'Other'];

    const fetchCourse = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/gpa/courses/${id}`);
            const course = response.data;
            setFormData({
                name: course.name,
                code: course.code || '',
                credits: course.credits,
                grade: course.grade,
                semester: course.semester,
                year: course.year,
                category: course.category,
                notes: course.notes || ''
            });
        } catch (error) {
            console.error('Error fetching course:', error);
            setError('Failed to load course data');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (isEditing) {
            fetchCourse();
        }
    }, [isEditing, fetchCourse]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Course name is required');
            return false;
        }
        if (!formData.credits || formData.credits <= 0) {
            setError('Credits must be greater than 0');
            return false;
        }
        // Grade is optional - can be left blank
        if (!formData.semester) {
            setError('Semester is required');
            return false;
        }
        if (!formData.year || formData.year < 2000 || formData.year > 2030) {
            setError('Year must be between 2000 and 2030');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);

            // Prepare data for submission - handle empty grade field
            const submitData = {
                ...formData,
                courseType: 'simple',
                credits: parseFloat(formData.credits),
                year: parseInt(formData.year)
            };

            // Remove empty grade field if it's empty string
            if (submitData.grade === '') {
                delete submitData.grade;
            }

            if (isEditing) {
                await api.put(`/gpa/courses/${id}`, submitData);
            } else {
                await api.post('/gpa/courses', submitData);
            }

            navigate('/');
        } catch (error) {
            console.error('Error saving course:', error);
            setError(error.response?.data?.message || 'Failed to save course');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                </button>

                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEditing ? 'Edit Course' : 'Add New Course'}
                        </h1>
                        <p className="text-gray-600">
                            {isEditing ? 'Update your course information' : 'Enter the details of your new course'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Course Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Introduction to Computer Science"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                                Course Code
                            </label>
                            <input
                                type="text"
                                id="code"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., CS101"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="credits" className="block text-sm font-medium text-gray-700 mb-2">
                                Credits *
                            </label>
                            <input
                                type="number"
                                id="credits"
                                name="credits"
                                value={formData.credits}
                                onChange={handleChange}
                                min="0.5"
                                max="10"
                                step="0.5"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="3.0"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                                Grade (Optional)
                            </label>
                            <select
                                id="grade"
                                name="grade"
                                value={formData.grade}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select a grade (optional)</option>
                                {grades.map(grade => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                Leave blank if you don't have a grade yet
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                                Semester *
                            </label>
                            <select
                                id="semester"
                                name="semester"
                                value={formData.semester}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Select semester</option>
                                {semesters.map(semester => (
                                    <option key={semester} value={semester}>{semester}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                                Year *
                            </label>
                            <input
                                type="number"
                                id="year"
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                min="2000"
                                max="2030"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="2024"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Any additional notes about this course..."
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving...' : (isEditing ? 'Update Course' : 'Add Course')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseForm;
