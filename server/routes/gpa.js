const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const StudyLog = require('../models/StudyLog');
const { auth } = require('../middleware/auth');
const { validate, sanitizeInput } = require('../middleware/validation');
const { z } = require('zod');
const {
    resolveGrade,
    resolveGradeLegacy,
    isLetterGrade,
    calculateWeightedGPA,
    VALID_LETTER_GRADES
} = require('../utils/gradeConversion');

const router = express.Router();

// ── Zod Validation Schemas ──────────────────────────────────────────────────

const assignmentSchema = z.object({
    name: z.string()
        .min(1, 'Assignment name is required')
        .max(100, 'Assignment name must be less than 100 characters')
        .trim(),
    type: z.enum(['Assignment', 'Quiz', 'Exam', 'Project', 'Participation', 'Other'])
        .default('Assignment'),
    weight: z.union([
        z.string().min(1, 'Weight is required').transform(val => parseFloat(val)),
        z.number().min(0, 'Weight must be at least 0')
    ]).refine(val => val >= 0 && val <= 100, 'Weight must be between 0 and 100')
        .default(0),
    grade: z.union([
        z.string().min(1, 'Grade is required'),
        z.number().min(0, 'Grade must be at least 0').max(100, 'Grade must be at most 100')
    ]),
    maxGrade: z.union([
        z.string().min(1, 'Max grade is required').transform(val => parseFloat(val)),
        z.number().min(1, 'Max grade must be at least 1')
    ]).refine(val => val >= 1, 'Max grade must be at least 1')
        .default(100),
    dueDate: z.string().optional(),
    notes: z.string()
        .max(500, 'Notes must be less than 500 characters')
        .trim()
        .optional()
});

const courseSchema = z.object({
    name: z.string()
        .min(1, 'Course name is required')
        .max(100, 'Course name must be less than 100 characters')
        .trim(),
    code: z.string()
        .max(20, 'Course code must be less than 20 characters')
        .trim()
        .optional(),
    credits: z.union([
        z.string().min(1, 'Credits is required').transform(val => parseFloat(val)),
        z.number().min(0.5, 'Credits must be at least 0.5')
    ]).refine(val => val >= 0.5 && val <= 10, 'Credits must be between 0.5 and 10'),
    courseType: z.enum(['simple', 'detailed'])
        .default('simple'),
    grade: z.union([
        z.string().min(1, 'Grade must not be empty if provided'),
        z.number().min(0, 'Grade must be at least 0').max(100, 'Grade must be at most 100')
    ]).optional(),
    gradeInputType: z.enum(['letter', 'percentage'])
        .optional(),
    assignments: z.array(assignmentSchema)
        .default([])
        .optional(),
    gradeOverride: z.union([
        z.string().min(1),
        z.number().min(0).max(100)
    ]).optional(),
    semester: z.string()
        .min(1, 'Semester is required')
        .max(20, 'Semester must be less than 20 characters')
        .trim(),
    year: z.number()
        .int()
        .min(2000, 'Year must be 2000 or later')
        .max(2030, 'Year must be 2030 or earlier'),
    category: z.string()
        .max(50, 'Category must be less than 50 characters')
        .trim()
        .default('General'),
    notes: z.string()
        .max(500, 'Notes must be less than 500 characters')
        .trim()
        .optional(),
    gpaScale: z.enum(['4.0', '4.3', 'percentage'])
        .default('4.0'),
    isCompleted: z.boolean().optional()
}).refine((data) => {
    // Validate assignment weights sum if detailed course has assignments
    if (data.assignments && data.assignments.length > 0) {
        const totalWeight = data.assignments.reduce((sum, a) => sum + (a.weight || 0), 0);
        // Allow a small floating point tolerance
        if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01) {
            return false;
        }
    }
    return true;
}, {
    message: 'Assignment weights must sum to 100%',
    path: ['assignments']
});

const courseUpdateSchema = z.object({
    name: z.string().min(1).max(100).trim().optional(),
    code: z.string().max(20).trim().optional(),
    credits: z.union([
        z.string().min(1).transform(val => parseFloat(val)),
        z.number().min(0.5)
    ]).refine(val => val >= 0.5 && val <= 10).optional(),
    courseType: z.enum(['simple', 'detailed']).optional(),
    grade: z.union([z.string().min(1), z.number().min(0).max(100)]).optional(),
    gradeInputType: z.enum(['letter', 'percentage']).optional(),
    assignments: z.array(assignmentSchema).optional(),
    semester: z.string().min(1).max(20).trim().optional(),
    year: z.number().int().min(2000).max(2030).optional(),
    category: z.string().max(50).trim().optional(),
    notes: z.string().max(500).trim().optional(),
    gpaScale: z.enum(['4.0', '4.3', 'percentage']).optional(),
    isCompleted: z.boolean().optional()
});

// ── GPA Calculation (uses model's shouldIncludeInGPA) ───────────────────────

const calculateGPA = (courses) => {
    const entries = [];

    for (const course of courses) {
        if (!course.shouldIncludeInGPA()) continue;

        const finalGrade = course.getFinalGrade();
        if (finalGrade && typeof finalGrade.gradePoints === 'number' && !isNaN(finalGrade.gradePoints)) {
            entries.push({
                gradePoints: finalGrade.gradePoints,
                credits: course.credits
            });
        }
    }

    return calculateWeightedGPA(entries);
};

/**
 * Auto-detect gradeInputType from the grade value if not explicitly provided.
 */
function inferGradeInputType(grade) {
    if (grade === undefined || grade === null || grade === '') {
        return 'letter';
    }
    if (typeof grade === 'number') {
        return 'percentage';
    }
    if (typeof grade === 'string') {
        if (isLetterGrade(grade.trim())) {
            return 'letter';
        }
        // If it parses as a number, it's a percentage
        const num = parseFloat(grade);
        if (!isNaN(num)) {
            return 'percentage';
        }
    }
    return 'letter';
}

// ── Routes ──────────────────────────────────────────────────────────────────

// POST /api/gpa/courses - Add a new course
router.post('/courses',
    auth,
    sanitizeInput,
    validate(courseSchema),
    async (req, res) => {
        try {
            const { name, code, credits, courseType, grade, gradeInputType, assignments, semester, year, category, notes, gpaScale, isCompleted } = req.body;

            const courseData = {
                user: req.user._id,
                name,
                code,
                credits,
                courseType,
                semester,
                year,
                category,
                notes,
                gpaScale: gpaScale || '4.0',
                isCompleted: isCompleted || false
            };

            // Determine input type explicitly
            if (courseType === 'simple' && grade !== undefined && grade !== '') {
                courseData.grade = grade;
                courseData.gradeInputType = gradeInputType || inferGradeInputType(grade);

                // Pre-resolve grade points
                const resolved = resolveGrade(grade, courseData.gradeInputType, courseData.gpaScale);
                courseData.gradePoints = resolved.gradePoints;
            }

            // Handle assignments
            if (assignments && assignments.length > 0) {
                courseData.assignments = assignments;
            }

            // Handle grade override
            if (req.body.gradeOverride !== undefined) {
                courseData.gradeOverride = req.body.gradeOverride;
                const overrideResolved = resolveGradeLegacy(req.body.gradeOverride, courseData.gpaScale);
                courseData.gradeOverridePoints = overrideResolved.gradePoints;
            }

            const course = new Course(courseData);
            await course.save();

            res.status(201).json({
                message: 'Course added successfully',
                course,
                code: 'COURSE_ADDED'
            });
        } catch (error) {
            console.error('Add course error:', error);
            res.status(500).json({
                message: 'Server error while adding course',
                code: 'ADD_COURSE_ERROR'
            });
        }
    }
);

// GET /api/gpa/courses - Get all courses for a user
router.get('/courses', auth, async (req, res) => {
    try {
        const { semester, year, category } = req.query;
        let query = { user: req.user._id };

        if (semester) query.semester = semester;
        if (year) query.year = parseInt(year);
        if (category) query.category = category;

        const courses = await Course.find(query).sort({ year: -1, semester: 1, name: 1 });
        res.json({
            courses,
            count: courses.length,
            code: 'COURSES_RETRIEVED'
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            message: 'Server error while retrieving courses',
            code: 'GET_COURSES_ERROR'
        });
    }
});

// GET /api/gpa/courses/:id - Get a single course
router.get('/courses/:id', auth, async (req, res) => {
    try {
        const course = await Course.findOne({ _id: req.params.id, user: req.user._id });
        if (!course) {
            return res.status(404).json({
                message: 'Course not found',
                code: 'COURSE_NOT_FOUND'
            });
        }

        res.json({
            course,
            code: 'COURSE_RETRIEVED'
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({
            message: 'Server error while retrieving course',
            code: 'GET_COURSE_ERROR'
        });
    }
});

// GET /api/gpa/summary - GPA summary for a user
router.get('/summary', auth, async (req, res) => {
    try {
        const courses = await Course.find({ user: req.user._id });

        // Overall GPA — uses shouldIncludeInGPA (checks isCompleted + excludes W/I/P/NP)
        const overallGPA = calculateGPA(courses);

        // GPA by semester
        const semesterGPAs = {};
        const semesters = [...new Set(courses.map(c => `${c.semester} ${c.year}`))];

        for (const sem of semesters) {
            const parts = sem.split(' ');
            const year = parseInt(parts.pop());
            const semester = parts.join(' ');
            const semesterCourses = courses.filter(c => c.semester === semester && c.year === year);
            semesterGPAs[sem] = calculateGPA(semesterCourses);
        }

        // GPA by category
        const categoryGPAs = {};
        const categories = [...new Set(courses.map(c => c.category || 'General'))];

        for (const cat of categories) {
            const categoryCourses = courses.filter(c => (c.category || 'General') === cat);
            categoryGPAs[cat] = calculateGPA(categoryCourses);
        }

        // Total credits (only from GPA-eligible courses)
        const totalCredits = courses
            .filter(c => c.shouldIncludeInGPA())
            .reduce((sum, c) => sum + c.credits, 0);

        res.json({
            overallGPA,
            semesterGPAs,
            categoryGPAs,
            totalCredits,
            totalCourses: courses.length,
            code: 'SUMMARY_RETRIEVED'
        });
    } catch (error) {
        console.error('Get GPA summary error:', error);
        res.status(500).json({
            message: 'Server error while retrieving GPA summary',
            code: 'GET_SUMMARY_ERROR'
        });
    }
});

// PUT /api/gpa/courses/:id - Update a course
router.put('/courses/:id',
    auth,
    sanitizeInput,
    validate(courseUpdateSchema),
    async (req, res) => {
        try {
            const course = await Course.findOne({ _id: req.params.id, user: req.user._id });
            if (!course) {
                return res.status(404).json({
                    message: 'Course not found',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            // If grade is being updated, resolve gradeInputType
            if (req.body.grade !== undefined) {
                const inputType = req.body.gradeInputType || inferGradeInputType(req.body.grade);
                req.body.gradeInputType = inputType;
                const resolved = resolveGrade(req.body.grade, inputType, req.body.gpaScale || course.gpaScale);
                req.body.gradePoints = resolved.gradePoints;
            }

            // Apply updates
            Object.assign(course, req.body);
            await course.save();

            res.json({
                message: 'Course updated successfully',
                course,
                code: 'COURSE_UPDATED'
            });
        } catch (error) {
            console.error('Update course error:', error);
            res.status(500).json({
                message: 'Server error while updating course',
                code: 'UPDATE_COURSE_ERROR'
            });
        }
    }
);

// DELETE /api/gpa/courses/:id - Delete a course
router.delete('/courses/:id', auth, async (req, res) => {
    try {
        const course = await Course.findOneAndDelete({ _id: req.params.id, user: req.user._id });

        if (!course) {
            return res.status(404).json({
                message: 'Course not found',
                code: 'COURSE_NOT_FOUND'
            });
        }

        res.json({
            message: 'Course removed successfully',
            code: 'COURSE_REMOVED'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            message: 'Server error while deleting course',
            code: 'DELETE_COURSE_ERROR'
        });
    }
});

// POST /api/gpa/courses/bulk - Import multiple courses
router.post('/courses/bulk',
    auth,
    sanitizeInput,
    async (req, res) => {
        try {
            const { courses } = req.body;

            if (!Array.isArray(courses) || courses.length === 0) {
                return res.status(400).json({
                    message: 'Courses array is required and must not be empty',
                    code: 'INVALID_COURSES_ARRAY'
                });
            }

            const importedCourses = [];
            const errors = [];

            for (let i = 0; i < courses.length; i++) {
                try {
                    const courseData = courses[i];

                    if (!courseData.name || !courseData.credits) {
                        errors.push({
                            index: i,
                            error: 'Missing required fields: name and credits are required'
                        });
                        continue;
                    }

                    const inputType = courseData.gradeInputType || inferGradeInputType(courseData.grade);

                    const course = new Course({
                        user: req.user._id,
                        name: courseData.name,
                        code: courseData.code || '',
                        credits: courseData.credits,
                        courseType: 'simple',
                        grade: courseData.grade,
                        gradeInputType: inputType,
                        semester: courseData.semester || 'Fall',
                        year: courseData.year || new Date().getFullYear(),
                        category: courseData.category || 'General',
                        notes: courseData.notes || '',
                        gpaScale: courseData.gpaScale || '4.0',
                        isCompleted: courseData.isCompleted || false
                    });

                    await course.save();
                    importedCourses.push(course);
                } catch (error) {
                    errors.push({
                        index: i,
                        error: error.message
                    });
                }
            }

            res.status(200).json({
                message: `Successfully imported ${importedCourses.length} courses`,
                importedCourses,
                errors,
                code: 'BULK_IMPORT_SUCCESS'
            });
        } catch (error) {
            console.error('Bulk import error:', error);
            res.status(500).json({
                message: 'Server error during bulk import',
                code: 'BULK_IMPORT_ERROR'
            });
        }
    }
);

// POST /api/gpa/courses/:id/assignments - Add assignment
router.post('/courses/:id/assignments',
    auth,
    sanitizeInput,
    validate(assignmentSchema),
    async (req, res) => {
        try {
            const course = await Course.findOne({ _id: req.params.id, user: req.user._id });
            if (!course) {
                return res.status(404).json({
                    message: 'Course not found',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            course.assignments.push(req.body);

            // Validate total weight doesn't exceed 100
            const totalWeight = course.assignments.reduce((sum, a) => sum + (a.weight || 0), 0);
            if (totalWeight > 100.01) {
                return res.status(400).json({
                    message: `Total assignment weight would be ${totalWeight.toFixed(1)}%, which exceeds 100%`,
                    code: 'WEIGHT_EXCEEDS_100'
                });
            }

            await course.save();

            res.status(201).json({
                message: 'Assignment added successfully',
                assignment: course.assignments[course.assignments.length - 1],
                course,
                code: 'ASSIGNMENT_ADDED'
            });
        } catch (error) {
            console.error('Add assignment error:', error);
            res.status(500).json({
                message: 'Server error while adding assignment',
                code: 'ADD_ASSIGNMENT_ERROR'
            });
        }
    }
);

// PUT /api/gpa/courses/:id/assignments/:assignmentId - Update assignment
router.put('/courses/:id/assignments/:assignmentId',
    auth,
    sanitizeInput,
    validate(assignmentSchema),
    async (req, res) => {
        try {
            const course = await Course.findOne({ _id: req.params.id, user: req.user._id });
            if (!course) {
                return res.status(404).json({
                    message: 'Course not found',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            const assignment = course.assignments.id(req.params.assignmentId);
            if (!assignment) {
                return res.status(404).json({
                    message: 'Assignment not found',
                    code: 'ASSIGNMENT_NOT_FOUND'
                });
            }

            Object.assign(assignment, req.body);

            // Validate total weight
            const totalWeight = course.assignments.reduce((sum, a) => sum + (a.weight || 0), 0);
            if (totalWeight > 100.01) {
                return res.status(400).json({
                    message: `Total assignment weight would be ${totalWeight.toFixed(1)}%, which exceeds 100%`,
                    code: 'WEIGHT_EXCEEDS_100'
                });
            }

            await course.save();

            res.json({
                message: 'Assignment updated successfully',
                assignment,
                course,
                code: 'ASSIGNMENT_UPDATED'
            });
        } catch (error) {
            console.error('Update assignment error:', error);
            res.status(500).json({
                message: 'Server error while updating assignment',
                code: 'UPDATE_ASSIGNMENT_ERROR'
            });
        }
    }
);

// DELETE /api/gpa/courses/:id/assignments/:assignmentId
router.delete('/courses/:id/assignments/:assignmentId',
    auth,
    async (req, res) => {
        try {
            const course = await Course.findOne({ _id: req.params.id, user: req.user._id });
            if (!course) {
                return res.status(404).json({
                    message: 'Course not found',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            const assignment = course.assignments.id(req.params.assignmentId);
            if (!assignment) {
                return res.status(404).json({
                    message: 'Assignment not found',
                    code: 'ASSIGNMENT_NOT_FOUND'
                });
            }

            assignment.deleteOne();
            await course.save();

            res.json({
                message: 'Assignment removed successfully',
                course,
                code: 'ASSIGNMENT_REMOVED'
            });
        } catch (error) {
            console.error('Delete assignment error:', error);
            res.status(500).json({
                message: 'Server error while deleting assignment',
                code: 'DELETE_ASSIGNMENT_ERROR'
            });
        }
    }
);

// PUT /api/gpa/courses/:id/grade-override
router.put('/courses/:id/grade-override',
    auth,
    sanitizeInput,
    async (req, res) => {
        try {
            const { gradeOverride } = req.body;
            if (gradeOverride === undefined) {
                return res.status(400).json({
                    message: 'Grade override is required',
                    code: 'GRADE_OVERRIDE_REQUIRED'
                });
            }

            const course = await Course.findOne({ _id: req.params.id, user: req.user._id });
            if (!course) {
                return res.status(404).json({
                    message: 'Course not found',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            // Resolve override using centralized conversion
            course.gradeOverride = gradeOverride;
            const resolved = resolveGradeLegacy(gradeOverride, course.gpaScale);
            course.gradeOverridePoints = resolved.gradePoints;

            await course.save();

            res.json({
                message: 'Grade override set successfully',
                course,
                code: 'GRADE_OVERRIDE_SET'
            });
        } catch (error) {
            console.error('Set grade override error:', error);
            res.status(500).json({
                message: 'Server error while setting grade override',
                code: 'SET_GRADE_OVERRIDE_ERROR'
            });
        }
    }
);

// POST /api/gpa/courses/:id/revert-override
router.post('/courses/:id/revert-override',
    auth,
    sanitizeInput,
    async (req, res) => {
        try {
            const course = await Course.findOne({ _id: req.params.id, user: req.user._id });
            if (!course) {
                return res.status(404).json({
                    message: 'Course not found',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            course.gradeOverride = undefined;
            course.gradeOverridePoints = undefined;

            await course.save();

            res.json({
                message: 'Grade override reverted successfully',
                course,
                code: 'GRADE_OVERRIDE_REVERTED'
            });
        } catch (error) {
            console.error('Revert grade override error:', error);
            res.status(500).json({
                message: 'Server error while reverting grade override',
                code: 'REVERT_GRADE_OVERRIDE_ERROR'
            });
        }
    }
);

// PUT /api/gpa/courses/:id/personal - Update study data
router.put('/courses/:id/personal', auth, async (req, res) => {
    try {
        const { studyHours, difficultyRating, personalNotes, targetGrade } = req.body;

        const course = await Course.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            {
                $set: {
                    ...(studyHours !== undefined && { studyHours }),
                    ...(difficultyRating !== undefined && { difficultyRating }),
                    ...(personalNotes !== undefined && { personalNotes }),
                    ...(targetGrade !== undefined && { targetGrade })
                }
            },
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ success: true, course });
    } catch (error) {
        console.error('Error updating course personal data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/gpa/dashboard-analytics
router.get('/dashboard-analytics', auth, async (req, res) => {
    try {
        const courses = await Course.find({ user: req.user._id });

        // Use proper weighted GPA calculation
        const gpaEntries = [];
        for (const course of courses) {
            if (course.shouldIncludeInGPA()) {
                const finalGrade = course.getFinalGrade();
                gpaEntries.push({
                    gradePoints: finalGrade.gradePoints,
                    credits: course.credits
                });
            }
        }

        const analytics = {
            totalCourses: courses.length,
            totalCredits: courses.reduce((sum, course) => sum + (course.credits || 0), 0),
            averageGPA: calculateWeightedGPA(gpaEntries),
            semesterBreakdown: {},
            categoryBreakdown: {},
            studyHoursTotal: courses.reduce((sum, course) => sum + (course.studyHours || 0), 0)
        };

        // Semester breakdown with proper weighted GPA
        for (const course of courses) {
            const semester = `${course.semester} ${course.year}`;
            if (!analytics.semesterBreakdown[semester]) {
                analytics.semesterBreakdown[semester] = { courses: [], entries: [], count: 0 };
            }
            analytics.semesterBreakdown[semester].courses.push(course);
            analytics.semesterBreakdown[semester].count += 1;

            if (course.shouldIncludeInGPA()) {
                const fg = course.getFinalGrade();
                analytics.semesterBreakdown[semester].entries.push({
                    gradePoints: fg.gradePoints,
                    credits: course.credits
                });
            }
        }

        for (const key of Object.keys(analytics.semesterBreakdown)) {
            const bd = analytics.semesterBreakdown[key];
            bd.averageGPA = calculateWeightedGPA(bd.entries);
            delete bd.entries; // Don't send raw entries to client
        }

        // Category breakdown with proper weighted GPA
        for (const course of courses) {
            const category = course.category || 'General';
            if (!analytics.categoryBreakdown[category]) {
                analytics.categoryBreakdown[category] = { courses: [], entries: [], count: 0 };
            }
            analytics.categoryBreakdown[category].courses.push(course);
            analytics.categoryBreakdown[category].count += 1;

            if (course.shouldIncludeInGPA()) {
                const fg = course.getFinalGrade();
                analytics.categoryBreakdown[category].entries.push({
                    gradePoints: fg.gradePoints,
                    credits: course.credits
                });
            }
        }

        for (const key of Object.keys(analytics.categoryBreakdown)) {
            const bd = analytics.categoryBreakdown[key];
            bd.averageGPA = calculateWeightedGPA(bd.entries);
            delete bd.entries;
        }

        res.json({ success: true, analytics });
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/gpa/study-logs
router.post('/study-logs', auth, async (req, res) => {
    try {
        const { courseId, hours, date, notes } = req.body;

        if (!courseId || !hours || !date) {
            return res.status(400).json({ error: 'Course ID, hours, and date are required' });
        }

        const course = await Course.findOne({ _id: courseId, user: req.user._id });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const studyLog = new StudyLog({
            user: req.user._id,
            course: courseId,
            hours: parseFloat(hours),
            date: new Date(date),
            notes: notes || ''
        });

        await studyLog.save();
        res.status(201).json({ success: true, studyLog });
    } catch (error) {
        console.error('Error creating study log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/gpa/study-logs
router.get('/study-logs', auth, async (req, res) => {
    try {
        const studyLogs = await StudyLog.find({ user: req.user._id })
            .sort({ date: -1 })
            .limit(50);

        res.json({ success: true, studyLogs });
    } catch (error) {
        console.error('Error fetching study logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
