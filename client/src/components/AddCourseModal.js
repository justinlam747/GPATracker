import React, { useState } from 'react';
import { X, BookOpen, Plus } from 'lucide-react';
import api from '../utils/api';
import { addCourseSchema, validate } from '../lib/validators';

const AddCourseModal = ({ isOpen, onClose, onCourseAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        credits: '3',
        grade: '',
        semester: 'Fall',
        year: new Date().getFullYear(),
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        const result = validate(addCourseSchema, formData);
        if (!result.success) {
            setFieldErrors(result.errors);
            return;
        }

        setLoading(true);
        try {
            const courseData = {
                ...formData,
                courseType: 'simple',
                credits: parseFloat(formData.credits),
                year: parseInt(formData.year)
            };

            const response = await api.post('/gpa/courses', courseData);
            if (response.data) {
                setFormData({
                    name: '',
                    code: '',
                    credits: '3',
                    grade: '',
                    semester: 'Fall',
                    year: new Date().getFullYear(),
                    notes: ''
                });
                setFieldErrors({});
                onCourseAdded(response.data.course);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add course');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const fieldClass = (field) =>
        `w-full px-3 py-2 border ${fieldErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-300">
                            <Plus className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Add New Course</h2>
                            <p className="text-sm text-gray-600">Enter course details</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Course Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={fieldClass('name')}
                                placeholder="e.g., Introduction to Computer Science"
                            />
                            {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className={fieldClass('code')}
                                placeholder="e.g., CS101"
                            />
                            {fieldErrors.code && <p className="mt-1 text-sm text-red-600">{fieldErrors.code}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Credits *</label>
                            <input
                                type="number"
                                name="credits"
                                value={formData.credits}
                                onChange={handleChange}
                                min="0.5"
                                step="0.5"
                                className={fieldClass('credits')}
                                placeholder="e.g., 3"
                            />
                            {fieldErrors.credits && <p className="mt-1 text-sm text-red-600">{fieldErrors.credits}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                            <input
                                type="text"
                                name="grade"
                                value={formData.grade}
                                onChange={handleChange}
                                className={fieldClass('grade')}
                                placeholder="e.g., A, A+, 95, 4.0 (leave blank if unknown)"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
                            <select
                                name="semester"
                                value={formData.semester}
                                onChange={handleChange}
                                className={fieldClass('semester')}
                            >
                                <option value="Fall">Fall</option>
                                <option value="Spring">Spring</option>
                                <option value="Summer">Summer</option>
                            </select>
                            {fieldErrors.semester && <p className="mt-1 text-sm text-red-600">{fieldErrors.semester}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className={fieldClass('year')}
                            >
                                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            {fieldErrors.year && <p className="mt-1 text-sm text-red-600">{fieldErrors.year}</p>}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Optional course notes..."
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 border border-gray-300"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                    Adding...
                                </div>
                            ) : (
                                <>
                                    <BookOpen className="h-4 w-4 mr-2 inline" />
                                    Add Course
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCourseModal;
