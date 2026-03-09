import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, ArrowLeft, Check, BookOpen, ChevronRight, AlertCircle, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';

const CourseSchemaSearch = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [query, setQuery] = useState('');
    const [templates, setTemplates] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [editableScheme, setEditableScheme] = useState([]);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Course selector if no courseId
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState(courseId || '');

    useEffect(() => {
        loadInitialData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [templatesRes, deptsRes] = await Promise.all([
                api.get('/import/templates/search'),
                api.get('/import/templates/departments')
            ]);
            setTemplates(templatesRes.data.templates || []);
            setDepartments(deptsRes.data.departments || []);

            if (!courseId) {
                const coursesRes = await api.get('/gpa/courses');
                setCourses(coursesRes.data.courses || []);
            }
        } catch {
            setError('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = useCallback(async (q) => {
        setQuery(q);
        try {
            const response = await api.get(`/import/templates/search?q=${encodeURIComponent(q)}`);
            setTemplates(response.data.templates || []);
        } catch {
            // Silently handle
        }
    }, []);

    const handleFilterByDepartment = async (dept) => {
        setQuery(dept);
        try {
            const response = await api.get(`/import/templates/department/${encodeURIComponent(dept)}`);
            setTemplates(response.data.templates || []);
        } catch {
            setError('Failed to filter templates');
        }
    };

    const selectTemplate = (template) => {
        setSelectedTemplate(template);
        setEditableScheme(template.markingScheme.map(item => ({ ...item })));
    };

    const updateItem = (index, field, value) => {
        setEditableScheme(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: field === 'weight' ? parseFloat(value) || 0 : value };
            return updated;
        });
    };

    const removeItem = (index) => {
        setEditableScheme(prev => prev.filter((_, i) => i !== index));
    };

    const addItem = () => {
        setEditableScheme(prev => [...prev, { name: '', type: 'Assignment', weight: 0 }]);
    };

    const totalWeight = editableScheme.reduce((sum, item) => sum + (item.weight || 0), 0);

    const handleApply = async () => {
        const targetId = courseId || selectedCourseId;
        if (!targetId) {
            setError('Please select a course');
            return;
        }

        if (Math.abs(totalWeight - 100) > 0.5) {
            setError(`Weights must sum to 100% (currently ${totalWeight.toFixed(1)}%)`);
            return;
        }

        setApplying(true);
        setError('');

        try {
            for (const item of editableScheme) {
                await api.post(`/gpa/courses/${targetId}/assignments`, {
                    name: item.name,
                    type: item.type,
                    weight: item.weight,
                    grade: '0',
                    maxGrade: 100
                });
            }

            setSuccess(`Applied "${selectedTemplate.name}" template (${editableScheme.length} components)`);
            setTimeout(() => navigate(`/course/${targetId}`), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply template');
        } finally {
            setApplying(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <button onClick={() => navigate(courseId ? `/course/${courseId}` : '/courses')} className="p-2 hover:bg-gray-200 rounded-lg">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Course Schema Templates</h1>
                        <p className="text-sm text-gray-600">Browse suggested marking schemes by course type</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-start space-x-2">
                        <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Course selector */}
                {!courseId && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Apply to Course
                        </label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select a course...</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.code ? `${c.code} - ` : ''}{c.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Search & Browse */}
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    value={query}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Search by course name, code, or department..."
                                />
                            </div>

                            {/* Department chips */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                {departments.map(dept => (
                                    <button
                                        key={dept}
                                        onClick={() => handleFilterByDepartment(dept)}
                                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                            query === dept
                                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {dept}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Template list */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto" />
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No templates match your search
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 max-h-[50vh] overflow-y-auto">
                                    {templates.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => selectTemplate(template)}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                                                selectedTemplate?.id === template.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                                            }`}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{template.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {template.department} &middot; {template.markingScheme.length} components
                                                </p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {template.markingScheme.map((item, i) => (
                                                        <span key={i} className="text-xs text-gray-400">
                                                            {item.name} ({item.weight}%){i < template.markingScheme.length - 1 ? ',' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Selected template editor */}
                    <div>
                        {selectedTemplate ? (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-4">
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">{selectedTemplate.name}</h3>
                                        <p className="text-xs text-gray-500">{selectedTemplate.department}</p>
                                    </div>
                                    <span className={`text-sm font-medium ${Math.abs(totalWeight - 100) < 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                                        {totalWeight.toFixed(1)}%
                                    </span>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {editableScheme.map((item, i) => (
                                        <div key={i} className="px-4 py-2.5 flex items-center space-x-2">
                                            <input
                                                value={item.name}
                                                onChange={(e) => updateItem(i, 'name', e.target.value)}
                                                className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm"
                                            />
                                            <select
                                                value={item.type}
                                                onChange={(e) => updateItem(i, 'type', e.target.value)}
                                                className="px-2 py-1.5 border border-gray-200 rounded text-xs"
                                            >
                                                <option value="Assignment">Assignment</option>
                                                <option value="Quiz">Quiz</option>
                                                <option value="Exam">Exam</option>
                                                <option value="Project">Project</option>
                                                <option value="Participation">Participation</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <div className="flex items-center space-x-1">
                                                <input
                                                    value={item.weight}
                                                    onChange={(e) => updateItem(i, 'weight', e.target.value)}
                                                    className="w-14 px-2 py-1.5 border border-gray-200 rounded text-sm text-right"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.5"
                                                />
                                                <span className="text-xs text-gray-500">%</span>
                                            </div>
                                            <button onClick={() => removeItem(i)} className="p-1 text-red-400 hover:text-red-600">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-4 py-2 border-t border-gray-100">
                                    <button onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                                        <Plus className="h-3 w-3" />
                                        <span>Add component</span>
                                    </button>
                                </div>

                                <div className="px-4 py-3 border-t border-gray-200">
                                    <button
                                        onClick={handleApply}
                                        disabled={applying || editableScheme.length === 0 || Math.abs(totalWeight - 100) > 0.5 || (!courseId && !selectedCourseId)}
                                        className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                    >
                                        {applying ? (
                                            <span className="flex items-center justify-center">
                                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                                                Applying...
                                            </span>
                                        ) : (
                                            'Apply Template to Course'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                                <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">Select a template to preview and customize</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseSchemaSearch;
