import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, FileText, Check, AlertCircle, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '../utils/api';

const SyllabusImport = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [mode, setMode] = useState('upload'); // 'upload' | 'preview' | 'applying'
    const [file, setFile] = useState(null);
    const [pastedText, setPastedText] = useState('');
    const [inputMethod, setInputMethod] = useState('file');
    const [markingScheme, setMarkingScheme] = useState([]);
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // If no courseId, show a course selector
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState(courseId || '');
    const [coursesLoaded, setCoursesLoaded] = useState(!!courseId);

    const loadCourses = useCallback(async () => {
        if (coursesLoaded && courseId) return;
        try {
            const response = await api.get('/gpa/courses');
            setCourses(response.data.courses || []);
            setCoursesLoaded(true);
        } catch {
            setError('Failed to load courses');
        }
    }, [courseId, coursesLoaded]);

    React.useEffect(() => {
        if (!courseId) loadCourses();
    }, [courseId, loadCourses]);

    const handleFileDrop = useCallback((e) => {
        e.preventDefault();
        const dropped = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
        if (dropped) {
            const allowed = ['application/pdf', 'text/plain'];
            if (!allowed.includes(dropped.type)) {
                setError('Only PDF and text files are supported');
                return;
            }
            setFile(dropped);
            setError('');
        }
    }, []);

    const handleParse = async () => {
        setLoading(true);
        setError('');

        try {
            let response;

            if (inputMethod === 'file' && file) {
                const formData = new FormData();
                formData.append('file', file);
                response = await api.post('/import/syllabus/parse', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else if (inputMethod === 'text' && pastedText.trim()) {
                response = await api.post('/import/syllabus/parse', { text: pastedText });
            } else {
                setError(inputMethod === 'file' ? 'Please select a file' : 'Please paste syllabus text');
                setLoading(false);
                return;
            }

            const { markingScheme: scheme, metadata: meta } = response.data;
            setMarkingScheme(scheme);
            setMetadata(meta);

            if (scheme.length === 0) {
                setError('No grading scheme found. Try pasting the grading section directly.');
            } else {
                setMode('preview');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to parse syllabus');
        } finally {
            setLoading(false);
        }
    };

    const updateItem = (index, field, value) => {
        setMarkingScheme(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: field === 'weight' ? parseFloat(value) || 0 : value };
            return updated;
        });
    };

    const removeItem = (index) => {
        setMarkingScheme(prev => prev.filter((_, i) => i !== index));
    };

    const addItem = () => {
        setMarkingScheme(prev => [...prev, { name: '', type: 'Assignment', weight: 0 }]);
    };

    const totalWeight = markingScheme.reduce((sum, item) => sum + (item.weight || 0), 0);

    const handleApply = async () => {
        const targetId = courseId || selectedCourseId;
        if (!targetId) {
            setError('Please select a course to apply the marking scheme to');
            return;
        }

        if (Math.abs(totalWeight - 100) > 0.5) {
            setError(`Weights must sum to 100% (currently ${totalWeight.toFixed(1)}%)`);
            return;
        }

        setMode('applying');
        setError('');

        try {
            // Add each marking scheme item as an assignment to the course
            for (const item of markingScheme) {
                await api.post(`/gpa/courses/${targetId}/assignments`, {
                    name: item.name,
                    type: item.type,
                    weight: item.weight,
                    grade: '0',
                    maxGrade: 100
                });
            }

            setSuccess(`Applied ${markingScheme.length} assignment categories to course`);
            setMode('upload');
            setMarkingScheme([]);

            // Navigate to course detail after short delay
            setTimeout(() => navigate(`/course/${targetId}`), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply marking scheme');
            setMode('preview');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <button onClick={() => navigate(courseId ? `/course/${courseId}` : '/courses')} className="p-2 hover:bg-gray-200 rounded-lg">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Import Syllabus</h1>
                        <p className="text-sm text-gray-600">Upload a syllabus to auto-detect the grading breakdown</p>
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

                {/* Course selector (if no courseId in URL) */}
                {!courseId && mode !== 'applying' && (
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

                {/* Upload Mode */}
                {mode === 'upload' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setInputMethod('file')}
                                className={`flex-1 px-4 py-3 text-sm font-medium ${inputMethod === 'file' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Upload className="h-4 w-4 inline mr-2" />
                                Upload PDF
                            </button>
                            <button
                                onClick={() => setInputMethod('text')}
                                className={`flex-1 px-4 py-3 text-sm font-medium ${inputMethod === 'text' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <FileText className="h-4 w-4 inline mr-2" />
                                Paste Text
                            </button>
                        </div>

                        <div className="p-6">
                            {inputMethod === 'file' ? (
                                <div
                                    onDrop={handleFileDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('syllabus-file').click()}
                                >
                                    <input
                                        id="syllabus-file"
                                        type="file"
                                        accept=".pdf,.txt"
                                        onChange={handleFileDrop}
                                        className="hidden"
                                    />
                                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                                    {file ? (
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                className="mt-2 text-xs text-red-600 hover:text-red-800"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-sm text-gray-600">Drop syllabus PDF here or click to browse</p>
                                            <p className="text-xs text-gray-400 mt-1">PDF or TXT, max 5MB</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Paste grading breakdown section
                                    </label>
                                    <textarea
                                        value={pastedText}
                                        onChange={(e) => setPastedText(e.target.value)}
                                        rows={10}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                        placeholder={`Paste the grading section from your syllabus. Example:\n\nGrading Breakdown:\n- Assignments: 30%\n- Midterm Exam: 25%\n- Final Exam: 35%\n- Participation: 10%`}
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleParse}
                                disabled={loading || (inputMethod === 'file' ? !file : !pastedText.trim())}
                                className="mt-6 w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                                        Parsing...
                                    </span>
                                ) : (
                                    'Parse Syllabus'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Preview Mode */}
                {mode === 'preview' && (
                    <div className="space-y-4">
                        {metadata && (
                            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                                Detected <strong>{markingScheme.length}</strong> grading components
                                (confidence: {Math.round((metadata.confidence || 0) * 100)}%).
                                Adjust as needed before applying.
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-700">Marking Scheme</h3>
                                <span className={`text-sm font-medium ${Math.abs(totalWeight - 100) < 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                                    Total: {totalWeight.toFixed(1)}%
                                </span>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {markingScheme.map((item, i) => (
                                    <div key={i} className="px-4 py-3 flex items-center space-x-3">
                                        <input
                                            value={item.name}
                                            onChange={(e) => updateItem(i, 'name', e.target.value)}
                                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm"
                                            placeholder="Component name"
                                        />
                                        <select
                                            value={item.type}
                                            onChange={(e) => updateItem(i, 'type', e.target.value)}
                                            className="px-2 py-1.5 border border-gray-200 rounded text-sm"
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
                                                className="w-16 px-2 py-1.5 border border-gray-200 rounded text-sm text-right"
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                            />
                                            <span className="text-sm text-gray-500">%</span>
                                        </div>
                                        <button
                                            onClick={() => removeItem(i)}
                                            className="p-1 text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="px-4 py-3 border-t border-gray-100">
                                <button
                                    onClick={addItem}
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                >
                                    <Plus className="h-3 w-3" />
                                    <span>Add component</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => { setMode('upload'); setMarkingScheme([]); setError(''); }}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={markingScheme.length === 0 || Math.abs(totalWeight - 100) > 0.5}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Apply to Course
                            </button>
                        </div>
                    </div>
                )}

                {/* Applying */}
                {mode === 'applying' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600">Applying marking scheme...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SyllabusImport;
