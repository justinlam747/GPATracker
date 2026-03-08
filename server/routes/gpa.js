const express = require('express');
const Course = require('../models/Course');
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
    if (data.assignments && data.assignments.length > 0) {
        const totalWeight = data.assignments.reduce((sum, a) => sum + (a.weight || 0), 0);
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

// ── GPA Calculation ─────────────────────────────────────────────────────────

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

function inferGradeInputType(grade) {
    if (grade === undefined || grade === null || grade === '') return 'letter';
    if (typeof grade === 'number') return 'percentage';
    if (typeof grade === 'string') {
        if (isLetterGrade(grade.trim())) return 'letter';
        const num = parseFloat(grade);
        if (!isNaN(num)) return 'percentage';
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
                userId: req.user.id,
                name,
                code,
                credits,
                courseType,
                semester,
                year,
                category,
                notes,
                gpaScale: gpaScale || '4.0',
                isCompleted: isCompleted || false,
                assignments: assignments || []
            };

            // Determine input type explicitly
            if (courseType === 'simple' && grade !== undefined && grade !== '') {
                courseData.grade = String(grade);
                courseData.gradeInputType = gradeInputType || inferGradeInputType(grade);

                const resolved = resolveGrade(grade, courseData.gradeInputType, courseData.gpaScale);
                courseData.gradePoints = resolved.gradePoints;
            }

            // Handle grade override
            if (req.body.gradeOverride !== undefined) {
                courseData.gradeOverride = String(req.body.gradeOverride);
                const overrideResolved = resolveGradeLegacy(req.body.gradeOverride, courseData.gpaScale);
                courseData.gradeOverridePoints = overrideResolved.gradePoints;
            }

            const course = await Course.createCourse(courseData);

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
        const courses = await Course.findByUser(req.user.id, { semester, year, category });

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
        const course = await Course.findById(req.params.id, req.user.id);
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

// GET /api/gpa/summary - GPA summary for a user (single-pass)
router.get('/summary', auth, async (req, res) => {
    try {
        const courses = await Course.findByUser(req.user.id);

        // Single pass: accumulate overall, semester, and category entries
        const overallEntries = [];
        const semesterBuckets = {};
        const categoryBuckets = {};
        let totalCredits = 0;

        for (const c of courses) {
            const eligible = c.shouldIncludeInGPA();
            const finalGrade = eligible ? c.getFinalGrade() : null;

            if (eligible && finalGrade && typeof finalGrade.gradePoints === 'number' && !isNaN(finalGrade.gradePoints)) {
                const entry = { gradePoints: finalGrade.gradePoints, credits: c.credits };
                overallEntries.push(entry);
                totalCredits += c.credits;

                const semKey = `${c.semester} ${c.year}`;
                (semesterBuckets[semKey] ||= []).push(entry);

                const catKey = c.category || 'General';
                (categoryBuckets[catKey] ||= []).push(entry);
            }
        }

        const semesterGPAs = {};
        for (const [key, entries] of Object.entries(semesterBuckets)) {
            semesterGPAs[key] = calculateWeightedGPA(entries);
        }

        const categoryGPAs = {};
        for (const [key, entries] of Object.entries(categoryBuckets)) {
            categoryGPAs[key] = calculateWeightedGPA(entries);
        }

        res.json({
            overallGPA: calculateWeightedGPA(overallEntries),
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
            // If grade is being updated, resolve gradeInputType
            if (req.body.grade !== undefined) {
                const inputType = req.body.gradeInputType || inferGradeInputType(req.body.grade);
                req.body.gradeInputType = inputType;

                // Lightweight check to get gpaScale without loading assignments
                const existing = await Course.courseExists(req.params.id, req.user.id);
                if (!existing) {
                    return res.status(404).json({
                        message: 'Course not found',
                        code: 'COURSE_NOT_FOUND'
                    });
                }
                const resolved = resolveGrade(req.body.grade, inputType, req.body.gpaScale || existing.gpa_scale);
                req.body.gradePoints = resolved.gradePoints;
                req.body.grade = String(req.body.grade);
            }

            const course = await Course.updateCourse(req.params.id, req.user.id, req.body);
            if (!course) {
                return res.status(404).json({
                    message: 'Course not found',
                    code: 'COURSE_NOT_FOUND'
                });
            }

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
        const course = await Course.deleteCourse(req.params.id, req.user.id);
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
                        errors.push({ index: i, error: 'Missing required fields: name and credits are required' });
                        continue;
                    }

                    const inputType = courseData.gradeInputType || inferGradeInputType(courseData.grade);
                    let gradePoints = null;
                    if (courseData.grade !== undefined && courseData.grade !== '') {
                        const resolved = resolveGrade(courseData.grade, inputType, courseData.gpaScale || '4.0');
                        gradePoints = resolved.gradePoints;
                    }

                    const course = await Course.createCourse({
                        userId: req.user.id,
                        name: courseData.name,
                        code: courseData.code || '',
                        credits: courseData.credits,
                        courseType: 'simple',
                        grade: courseData.grade != null ? String(courseData.grade) : null,
                        gradeInputType: inputType,
                        gradePoints,
                        semester: courseData.semester || 'Fall',
                        year: courseData.year || new Date().getFullYear(),
                        category: courseData.category || 'General',
                        notes: courseData.notes || '',
                        gpaScale: courseData.gpaScale || '4.0',
                        isCompleted: courseData.isCompleted || false
                    });

                    importedCourses.push(course);
                } catch (error) {
                    errors.push({ index: i, error: error.message });
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
            // Check total weight before adding
            const existing = await Course.findById(req.params.id, req.user.id);
            if (!existing) {
                return res.status(404).json({
                    message: 'Course not found',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            const currentWeight = (existing.assignments || []).reduce((sum, a) => sum + (a.weight || 0), 0);
            const newWeight = currentWeight + (req.body.weight || 0);
            if (newWeight > 100.01) {
                return res.status(400).json({
                    message: `Total assignment weight would be ${newWeight.toFixed(1)}%, which exceeds 100%`,
                    code: 'WEIGHT_EXCEEDS_100'
                });
            }

            const result = await Course.addAssignment(req.params.id, req.user.id, req.body);
            if (!result) {
                return res.status(404).json({
                    message: 'Course not found',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            res.status(201).json({
                message: 'Assignment added successfully',
                assignment: result.assignment,
                course: result.course,
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
            const result = await Course.updateAssignment(req.params.id, req.params.assignmentId, req.user.id, req.body);
            if (!result) {
                return res.status(404).json({
                    message: 'Course or assignment not found',
                    code: 'NOT_FOUND'
                });
            }

            // Check total weight after update
            const totalWeight = (result.course.assignments || []).reduce((sum, a) => sum + (a.weight || 0), 0);
            if (totalWeight > 100.01) {
                return res.status(400).json({
                    message: `Total assignment weight would be ${totalWeight.toFixed(1)}%, which exceeds 100%`,
                    code: 'WEIGHT_EXCEEDS_100'
                });
            }

            res.json({
                message: 'Assignment updated successfully',
                assignment: result.assignment,
                course: result.course,
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
            const result = await Course.deleteAssignment(req.params.id, req.params.assignmentId, req.user.id);
            if (!result) {
                return res.status(404).json({
                    message: 'Course or assignment not found',
                    code: 'NOT_FOUND'
                });
            }

            res.json({
                message: 'Assignment removed successfully',
                course: result.course,
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

            const existing = await Course.courseExists(req.params.id, req.user.id);
            if (!existing) {
                return res.status(404).json({
                    message: 'Course not found',
                    code: 'COURSE_NOT_FOUND'
                });
            }

            const resolved = resolveGradeLegacy(gradeOverride, existing.gpa_scale);
            const course = await Course.updateCourse(req.params.id, req.user.id, {
                gradeOverride: String(gradeOverride),
                gradeOverridePoints: resolved.gradePoints
            });

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
            const course = await Course.updateCourse(req.params.id, req.user.id, {
                gradeOverride: null,
                gradeOverridePoints: null
            });
            if (!course) {
                return res.status(404).json({
                    message: 'Course not found',
                    code: 'COURSE_NOT_FOUND'
                });
            }

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

        const updates = {};
        if (studyHours !== undefined) updates.studyHours = studyHours;
        if (difficultyRating !== undefined) updates.difficultyRating = difficultyRating;
        if (personalNotes !== undefined) updates.personalNotes = personalNotes;
        if (targetGrade !== undefined) updates.targetGrade = targetGrade;

        const course = await Course.updateCourse(req.params.id, req.user.id, updates);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json({ success: true, course });
    } catch (error) {
        console.error('Error updating course personal data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/gpa/dashboard-analytics (single-pass)
router.get('/dashboard-analytics', auth, async (req, res) => {
    try {
        const courses = await Course.findByUser(req.user.id);

        // Single pass through courses — accumulate everything at once
        const gpaEntries = [];
        const semesterBreakdown = {};
        const categoryBreakdown = {};
        let totalCredits = 0;
        let studyHoursTotal = 0;

        for (const course of courses) {
            totalCredits += course.credits || 0;
            studyHoursTotal += course.studyHours || 0;

            const semKey = `${course.semester} ${course.year}`;
            const catKey = course.category || 'General';

            if (!semesterBreakdown[semKey]) semesterBreakdown[semKey] = { courses: [], entries: [], count: 0 };
            if (!categoryBreakdown[catKey]) categoryBreakdown[catKey] = { courses: [], entries: [], count: 0 };

            semesterBreakdown[semKey].courses.push(course);
            semesterBreakdown[semKey].count += 1;
            categoryBreakdown[catKey].courses.push(course);
            categoryBreakdown[catKey].count += 1;

            if (course.shouldIncludeInGPA()) {
                const fg = course.getFinalGrade();
                const entry = { gradePoints: fg.gradePoints, credits: course.credits };
                gpaEntries.push(entry);
                semesterBreakdown[semKey].entries.push(entry);
                categoryBreakdown[catKey].entries.push(entry);
            }
        }

        // Resolve GPAs from accumulated entries
        for (const bd of Object.values(semesterBreakdown)) {
            bd.averageGPA = calculateWeightedGPA(bd.entries);
            delete bd.entries;
        }
        for (const bd of Object.values(categoryBreakdown)) {
            bd.averageGPA = calculateWeightedGPA(bd.entries);
            delete bd.entries;
        }

        res.json({
            success: true,
            analytics: {
                totalCourses: courses.length,
                totalCredits,
                averageGPA: calculateWeightedGPA(gpaEntries),
                semesterBreakdown,
                categoryBreakdown,
                studyHoursTotal
            }
        });
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

        const courseCheck = await Course.courseExists(courseId, req.user.id);
        if (!courseCheck) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const studyLog = await StudyLog.create({
            userId: req.user.id,
            courseId,
            hours: parseFloat(hours),
            date: new Date(date),
            notes: notes || ''
        });

        res.status(201).json({ success: true, studyLog });
    } catch (error) {
        console.error('Error creating study log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/gpa/study-logs
router.get('/study-logs', auth, async (req, res) => {
    try {
        const studyLogs = await StudyLog.findByUser(req.user.id, 50);
        res.json({ success: true, studyLogs });
    } catch (error) {
        console.error('Error fetching study logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
