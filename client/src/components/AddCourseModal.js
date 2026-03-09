import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, BookOpen, Plus } from 'lucide-react';
import api from '../utils/api';

const AddCourseModal = ({ isOpen, onClose, onCourseAdded }) => {
    const { user } = useAuth();
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Client-side validation
        if (!formData.name.trim()) {
            setError('Course name is required');
            setLoading(false);
            return;
        }
        if (!formData.semester) {
            setError('Semester is required');
            setLoading(false);
            return;
        }
        if (!formData.credits || formData.credits <= 0) {
            setError('Credits must be greater than 0');
            setLoading(false);
            return;
        }

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
                onCourseAdded(response.data.course);
                onClose();
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to add course');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay-3d">
            <div className="card-3d-static rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/40">
                    <div className="flex items-center space-x-3">
                        <div className="icon-3d w-10 h-10 rounded-xl flex items-center justify-center">
                            <Plus className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-blue-900">Add New Course</h2>
                            <p className="text-sm text-blue-400">Enter course details</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-blue-400 hover:text-blue-600 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="alert-error-3d px-4 py-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Course Name */}
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                                Course Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="input-3d w-full"
                                placeholder="e.g., Introduction to Computer Science"
                            />
                        </div>

                        {/* Course Code */}
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                                Course Code
                            </label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                className="input-3d w-full"
                                placeholder="e.g., CS101"
                            />
                        </div>

                        {/* Credits */}
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                                Credits *
                            </label>
                            <input
                                type="number"
                                name="credits"
                                value={formData.credits}
                                onChange={handleChange}
                                required
                                min="0.5"
                                step="0.5"
                                className="input-3d w-full"
                                placeholder="e.g., 3"
                            />
                        </div>

                        {/* Grade (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                                Grade
                            </label>
                            <input
                                type="text"
                                name="grade"
                                value={formData.grade}
                                onChange={handleChange}
                                className="input-3d w-full"
                                placeholder="e.g., A, A+, 95, 4.0 (leave blank if unknown)"
                            />

                        </div>

                        {/* Semester */}
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                                Semester *
                            </label>
                            <select
                                name="semester"
                                value={formData.semester}
                                onChange={handleChange}
                                required
                                className="select-3d-native w-full"
                            >
                                <option value="Fall">Fall</option>
                                <option value="Spring">Spring</option>
                                <option value="Summer">Summer</option>
                            </select>
                        </div>

                        {/* Year */}
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                                Year
                            </label>
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className="select-3d-native w-full"
                            >
                                {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        {/* Category */}



                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            className="input-3d w-full"
                            placeholder="Optional course notes..."
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-3d-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-3d-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
