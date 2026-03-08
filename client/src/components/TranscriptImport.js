import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Check, X, AlertCircle, ArrowLeft, Trash2 } from 'lucide-react';
import api from '../utils/api';

const TranscriptImport = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('upload'); // 'upload' | 'preview' | 'importing' | 'done'
    const [file, setFile] = useState(null);
    const [pastedText, setPastedText] = useState('');
    const [inputMethod, setInputMethod] = useState('file'); // 'file' | 'text'
    const [parsedCourses, setParsedCourses] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState(new Set());
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [importResult, setImportResult] = useState(null);

    const handleFileDrop = useCallback((e) => {
        e.preventDefault();
        const dropped = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
        if (dropped) {
            const allowed = ['application/pdf', 'text/plain', 'text/csv'];
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
                response = await api.post('/import/transcript/parse', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else if (inputMethod === 'text' && pastedText.trim()) {
                response = await api.post('/import/transcript/parse', { text: pastedText });
            } else {
                setError(inputMethod === 'file' ? 'Please select a file' : 'Please paste transcript text');
                setLoading(false);
                return;
            }

            const { courses, metadata: meta } = response.data;
            setParsedCourses(courses);
            setMetadata(meta);
            setSelectedCourses(new Set(courses.map((_, i) => i)));

            if (courses.length === 0) {
                setError('No courses found in the transcript. Try pasting the text directly or check the format.');
            } else {
                setMode('preview');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to parse transcript');
        } finally {
            setLoading(false);
        }
    };

    const toggleCourse = (index) => {
        setSelectedCourses(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedCourses.size === parsedCourses.length) {
            setSelectedCourses(new Set());
        } else {
            setSelectedCourses(new Set(parsedCourses.map((_, i) => i)));
        }
    };

    const updateCourse = (index, field, value) => {
        setParsedCourses(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleImport = async () => {
        const toImport = parsedCourses
            .filter((_, i) => selectedCourses.has(i))
            .map(c => ({
                name: c.name,
                code: c.code || '',
                credits: parseFloat(c.credits) || 3,
                grade: c.grade || '',
                semester: c.semester || 'Fall',
                year: parseInt(c.year) || new Date().getFullYear(),
                isCompleted: !!c.grade
            }));

        if (toImport.length === 0) {
            setError('Select at least one course to import');
            return;
        }

        setMode('importing');
        setError('');

        try {
            const response = await api.post('/gpa/courses/bulk', { courses: toImport });
            setImportResult(response.data);
            setMode('done');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to import courses');
            setMode('preview');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <button onClick={() => navigate('/courses')} className="p-2 hover:bg-gray-200 rounded-lg">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Import Transcript</h1>
                        <p className="text-sm text-gray-600">Upload a transcript PDF or paste text to bulk-import courses</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6 flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Upload Mode */}
                {mode === 'upload' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        {/* Input method tabs */}
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setInputMethod('file')}
                                className={`flex-1 px-4 py-3 text-sm font-medium ${inputMethod === 'file' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Upload className="h-4 w-4 inline mr-2" />
                                Upload File
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
                                    onClick={() => document.getElementById('file-input').click()}
                                >
                                    <input
                                        id="file-input"
                                        type="file"
                                        accept=".pdf,.txt,.csv"
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
                                            <p className="text-sm text-gray-600">Drop your transcript here or click to browse</p>
                                            <p className="text-xs text-gray-400 mt-1">PDF or TXT, max 5MB</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Paste your transcript text
                                    </label>
                                    <textarea
                                        value={pastedText}
                                        onChange={(e) => setPastedText(e.target.value)}
                                        rows={12}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                        placeholder={`Paste transcript text here. Example formats:\n\nFall 2024\nCS101  Introduction to Computer Science  3.0  A\nMATH201  Linear Algebra  3.0  B+\nENG102  English Composition  3.0  A-\n\nSpring 2025\nCS201  Data Structures  3.0  A\nPHYS101  Physics I  4.0  B`}
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
                                    'Parse Transcript'
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
                                Found <strong>{parsedCourses.length}</strong> courses using <strong>{metadata.parseMethod}</strong> parser.
                                Select the ones you want to import.
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Table header */}
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={selectedCourses.size === parsedCourses.length}
                                        onChange={toggleAll}
                                        className="rounded border-gray-300"
                                    />
                                    <span>Select All ({selectedCourses.size}/{parsedCourses.length})</span>
                                </label>
                                <button
                                    onClick={() => { setMode('upload'); setParsedCourses([]); setError(''); }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Re-parse
                                </button>
                            </div>

                            {/* Course list */}
                            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                                {parsedCourses.map((course, i) => (
                                    <div key={i} className={`px-4 py-3 flex items-start space-x-3 ${selectedCourses.has(i) ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedCourses.has(i)}
                                            onChange={() => toggleCourse(i)}
                                            className="mt-1 rounded border-gray-300"
                                        />
                                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2">
                                            <input
                                                value={course.code || ''}
                                                onChange={(e) => updateCourse(i, 'code', e.target.value)}
                                                className="px-2 py-1 border border-gray-200 rounded text-sm"
                                                placeholder="Code"
                                            />
                                            <input
                                                value={course.name || ''}
                                                onChange={(e) => updateCourse(i, 'name', e.target.value)}
                                                className="px-2 py-1 border border-gray-200 rounded text-sm sm:col-span-2"
                                                placeholder="Course Name"
                                            />
                                            <input
                                                value={course.credits || ''}
                                                onChange={(e) => updateCourse(i, 'credits', e.target.value)}
                                                className="px-2 py-1 border border-gray-200 rounded text-sm"
                                                placeholder="Credits"
                                                type="number"
                                                step="0.5"
                                                min="0.5"
                                            />
                                            <input
                                                value={course.grade || ''}
                                                onChange={(e) => updateCourse(i, 'grade', e.target.value)}
                                                className="px-2 py-1 border border-gray-200 rounded text-sm"
                                                placeholder="Grade"
                                            />
                                        </div>
                                        <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-400 whitespace-nowrap">
                                            <span>{course.semester}</span>
                                            <span>{course.year}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => { setMode('upload'); setParsedCourses([]); }}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={selectedCourses.size === 0}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Import {selectedCourses.size} Course{selectedCourses.size !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                )}

                {/* Importing */}
                {mode === 'importing' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600">Importing courses...</p>
                    </div>
                )}

                {/* Done */}
                {mode === 'done' && importResult && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Import Complete</h2>
                        <p className="text-gray-600 mb-2">{importResult.message}</p>

                        {importResult.errors?.length > 0 && (
                            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
                                <p className="text-sm font-medium text-yellow-800 mb-1">Some courses had issues:</p>
                                {importResult.errors.map((err, i) => (
                                    <p key={i} className="text-xs text-yellow-700">Row {err.index + 1}: {err.error}</p>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex space-x-3 justify-center">
                            <button
                                onClick={() => { setMode('upload'); setParsedCourses([]); setFile(null); setPastedText(''); setImportResult(null); }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Import More
                            </button>
                            <button
                                onClick={() => navigate('/courses')}
                                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200"
                            >
                                View Courses
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TranscriptImport;
