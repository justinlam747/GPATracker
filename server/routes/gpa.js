const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { validate, sanitizeInput } = require('../middleware/validation');
const { z } = require('zod');
const StudyLog = require('../models/StudyLog'); // Added StudyLog model

const router = express.Router();

// Grade point mapping (kept for backward compatibility)
const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0, 'P': 0.0, 'NP': 0.0, 'W': 0.0, 'I': 0.0
};

// Assignment validation schema
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
        z.number().min(0, 'Grade must be at least 0')
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

// Validation schemas
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
    ]).refine(val => val <= 10, 'Credits must be less than 10'),
    courseType: z.enum(['simple', 'detailed'])
        .default('simple'),
    // For simple courses - grade is now optional
    grade: z.union([
        z.string().min(1, 'Grade must not be empty if provided'),
        z.number().min(0, 'Grade must be at least 0 if provided')
    ]).optional(),
    // Assignments for any course
    assignments: z.array(assignmentSchema)
        .default([])
        .optional(),
    // User can override calculated grade
    gradeOverride: z.union([
        z.string().min(1),
        z.number().min(0)
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
        .default('4.0')
}).refine((data) => {
    // Remove the requirement for simple courses to have a grade
    // Both course types can now be created without grades
    return true;
}, {
    message: 'Course validation passed',
    path: ['courseType']
});

// Create update schema by making all fields optional
const courseUpdateSchema = z.object({
    name: z.string().min(1).max(100).trim().optional(),
    code: z.string().max(20).trim().optional(),
    credits: z.union([
        z.string().min(1).transform(val => parseFloat(val)),
        z.number().min(0.5)
    ]).refine(val => val <= 10).optional(),
    courseType: z.enum(['simple', 'detailed']).optional(),
    grade: z.union([z.string().min(1), z.number().min(0)]).optional(),
    assignments: z.array(assignmentSchema).optional(),
    semester: z.string().min(1).max(20).trim().optional(),
    year: z.number().int().min(2000).max(2030).optional(),
    category: z.string().max(50).trim().optional(),
    notes: z.string().max(500).trim().optional(),
    gpaScale: z.enum(['4.0', '4.3', 'percentage']).optional()
});

// Calculate GPA for a set of courses
const calculateGPA = (courses) => {
    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
        if (course.isCompleted && course.grade !== 'W' && course.grade !== 'I') {
            const finalGrade = course.getFinalGrade();
            if (finalGrade) {
                totalPoints += finalGrade.gradePoints * course.credits;
                totalCredits += course.credits;
            }
        }
    });

    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
};

// @route   POST /api/gpa/courses
// @desc    Add a new course
// @access  Private
router.post('/courses',
    auth,
    sanitizeInput,
    validate(courseSchema),
    async (req, res) => {
        try {
            const { name, code, credits, courseType, grade, assignments, semester, year, category, notes, gpaScale } = req.body;

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
                gpaScale: gpaScale || '4.0' // Default to 4.0 if not specified
            };

            // Handle assignments for any course type
            if (assignments && assignments.length > 0) {
                courseData.assignments = assignments;
            }

            // Handle grade override if provided
            if (req.body.gradeOverride !== undefined) {
                courseData.gradeOverride = req.body.gradeOverride;
                // Calculate grade points for override
                if (typeof req.body.gradeOverride === 'string') {
                    courseData.gradeOverridePoints = gradePoints[req.body.gradeOverride] || 0.0;
                } else if (typeof req.body.gradeOverride === 'number') {
                    // Percentage grade - convert to 4.0 scale
                    if (req.body.gradeOverride >= 93) courseData.gradeOverridePoints = 4.0;
                    else if (req.body.gradeOverride >= 90) courseData.gradeOverridePoints = 3.7;
                    else if (req.body.gradeOverride >= 87) courseData.gradeOverridePoints = 3.3;
                    else if (req.body.gradeOverride >= 83) courseData.gradeOverridePoints = 3.0;
                    else if (req.body.gradeOverride >= 80) courseData.gradeOverridePoints = 2.7;
                    else if (req.body.gradeOverride >= 77) courseData.gradeOverridePoints = 2.3;
                    else if (req.body.gradeOverride >= 73) courseData.gradeOverridePoints = 2.0;
                    else if (req.body.gradeOverride >= 70) courseData.gradeOverridePoints = 1.7;
                    else if (req.body.gradeOverride >= 67) courseData.gradeOverridePoints = 1.3;
                    else if (req.body.gradeOverride >= 63) courseData.gradeOverridePoints = 1.0;
                    else if (req.body.gradeOverride >= 60) courseData.gradeOverridePoints = 0.7;
                    else courseData.gradeOverridePoints = 0.0;
                }
            }

            // For simple courses, calculate grade points if grade is provided
            if (courseType === 'simple' && grade) {
                courseData.grade = grade;
                if (typeof grade === 'string') {
                    courseData.gradePoints = gradePoints[grade] || 0.0;
                } else if (typeof grade === 'number') {
                    // Percentage grade - convert to 4.0 scale
                    if (grade >= 93) courseData.gradePoints = 4.0;
                    else if (grade >= 90) courseData.gradePoints = 3.7;
                    else if (grade >= 87) courseData.gradePoints = 3.3;
                    else if (grade >= 83) courseData.gradePoints = 3.0;
                    else if (grade >= 80) courseData.gradePoints = 2.7;
                    else if (grade >= 77) courseData.gradePoints = 2.3;
                    else if (grade >= 73) courseData.gradePoints = 2.0;
                    else if (grade >= 70) courseData.gradePoints = 1.7;
                    else if (grade >= 67) courseData.gradePoints = 1.3;
                    else if (grade >= 63) courseData.gradePoints = 1.0;
                    else if (grade >= 60) courseData.gradePoints = 0.7;
                    else courseData.gradePoints = 0.0;
                }
            } else if (courseType === 'simple' && !grade) {
                // Course without grade - set default values
                courseData.grade = undefined;
                courseData.gradePoints = 0.0;
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

// @route   GET /api/gpa/courses
// @desc    Get all courses for a user
// @access  Private
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

// @route   GET /api/gpa/courses/:id
// @desc    Get a single course by ID
// @access  Private
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

// @route   GET /api/gpa/summary
// @desc    Get GPA summary for a user
// @access  Private
router.get('/summary', auth, async (req, res) => {
    try {
        const courses = await Course.find({ user: req.user._id });

        // Overall GPA
        const overallGPA = calculateGPA(courses);

        // GPA by semester
        const semesterGPAs = {};
        const semesters = [...new Set(courses.map(c => `${c.semester} ${c.year}`))];

        semesters.forEach(sem => {
            const [semester, year] = sem.split(' ');
            const semesterCourses = courses.filter(c => c.semester === semester && c.year === parseInt(year));
            semesterGPAs[sem] = calculateGPA(semesterCourses);
        });

        // GPA by category
        const categoryGPAs = {};
        const categories = [...new Set(courses.map(c => c.category))];

        categories.forEach(cat => {
            const categoryCourses = courses.filter(c => c.category === cat);
            categoryGPAs[cat] = calculateGPA(categoryCourses);
        });

        // Total credits
        const totalCredits = courses
            .filter(c => c.isCompleted && c.grade !== 'W' && c.grade !== 'I')
            .reduce((sum, c) => sum + c.credits, 0);

        res.json({
            overallGPA: parseFloat(overallGPA),
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

// @route   PUT /api/gpa/courses/:id
// @desc    Update a course
// @access  Private
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

            // Convert credits to number if it's a string
            if (req.body.credits && typeof req.body.credits === 'string') {
                req.body.credits = parseFloat(req.body.credits);
            }

            // Update grade points if grade changed
            if (req.body.grade && req.body.grade !== course.grade) {
                req.body.gradePoints = gradePoints[req.body.grade];
            }

            const updatedCourse = await Course.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            res.json({
                message: 'Course updated successfully',
                course: updatedCourse,
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

// @route   DELETE /api/gpa/courses/:id
// @desc    Delete a course
// @access  Private
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

// @route   POST /api/gpa/courses/bulk
// @desc    Import multiple courses at once
// @access  Private
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

                    // Validate required fields
                    if (!courseData.name || !courseData.credits || courseData.grade === undefined) {
                        errors.push({
                            index: i,
                            error: 'Missing required fields: name, credits, and grade are required'
                        });
                        continue;
                    }

                    // Set defaults
                    const course = new Course({
                        user: req.user._id,
                        name: courseData.name,
                        code: courseData.code || '',
                        credits: courseData.credits,
                        courseType: 'simple',
                        grade: courseData.grade,
                        semester: courseData.semester || 'Fall',
                        year: courseData.year || new Date().getFullYear(),
                        category: courseData.category || 'General',
                        notes: courseData.notes || ''
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

// @route   POST /api/gpa/courses/:id/assignments
// @desc    Add an assignment to a course
// @access  Private
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

            // Add assignment to course
            course.assignments.push(req.body);
            await course.save();

            res.status(201).json({
                message: 'Assignment added successfully',
                assignment: course.assignments[course.assignments.length - 1],
                course: course,
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

// @route   PUT /api/gpa/courses/:id/assignments/:assignmentId
// @desc    Update an assignment
// @access  Private
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

            // Update assignment
            Object.assign(assignment, req.body);
            await course.save();

            res.json({
                message: 'Assignment updated successfully',
                assignment: assignment,
                course: course,
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

// @route   DELETE /api/gpa/courses/:id/assignments/:assignmentId
// @desc    Delete an assignment
// @access  Private
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

            // Remove assignment
            assignment.remove();
            await course.save();

            res.json({
                message: 'Assignment removed successfully',
                course: course,
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

// @route   DELETE /api/gpa/courses/:id
// @desc    Delete a course
// @access  Private
router.delete('/courses/:id',
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

            await Course.deleteOne({ _id: req.params.id, user: req.user._id });

            res.json({
                message: 'Course deleted successfully',
                code: 'COURSE_DELETED'
            });
        } catch (error) {
            console.error('Delete course error:', error);
            res.status(500).json({
                message: 'Server error while deleting course',
                code: 'DELETE_COURSE_ERROR'
            });
        }
    }
);

// @route   PUT /api/gpa/courses/:id/grade-override
// @desc    Set or update grade override for a course
// @access  Private
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

            // Set grade override
            course.gradeOverride = gradeOverride;

            // Calculate grade points for override based on user's GPA scale
            const user = await User.findById(req.user._id);
            const userGpaScale = user?.gpaScale || '4.0';
            
            if (typeof gradeOverride === 'string') {
                // Letter grade - convert based on user's scale
                if (userGpaScale === '4.3') {
                    const gradeMap43 = {
                        'A+': 4.3, 'A': 4.0, 'A-': 3.7,
                        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                        'D+': 1.3, 'D': 1.0, 'D-': 0.7,
                        'F': 0.0
                    };
                    course.gradeOverridePoints = gradeMap43[gradeOverride] || 0.0;
                } else if (userGpaScale === 'percentage') {
                    // For percentage scale, convert letter to percentage first
                    const letterToPercentage = {
                        'A+': 97, 'A': 93, 'A-': 90,
                        'B+': 87, 'B': 83, 'B-': 80,
                        'C+': 77, 'C': 73, 'C-': 70,
                        'D+': 67, 'D': 63, 'D-': 60,
                        'F': 50
                    };
                    course.gradeOverridePoints = letterToPercentage[gradeOverride] || 0.0;
                } else {
                    // Default 4.0 scale
                    course.gradeOverridePoints = gradePoints[gradeOverride] || 0.0;
                }
            } else if (typeof gradeOverride === 'number') {
                if (userGpaScale === 'percentage') {
                    // Keep percentage as-is for percentage scale
                    course.gradeOverridePoints = gradeOverride;
                } else if (userGpaScale === '4.3') {
                    // Convert percentage to 4.3 scale
                    if (gradeOverride >= 97) course.gradeOverridePoints = 4.3;
                    else if (gradeOverride >= 93) course.gradeOverridePoints = 4.0;
                    else if (gradeOverride >= 90) course.gradeOverridePoints = 3.7;
                    else if (gradeOverride >= 87) course.gradeOverridePoints = 3.3;
                    else if (gradeOverride >= 83) course.gradeOverridePoints = 3.0;
                    else if (gradeOverride >= 80) course.gradeOverridePoints = 2.7;
                    else if (gradeOverride >= 77) course.gradeOverridePoints = 2.3;
                    else if (gradeOverride >= 73) course.gradeOverridePoints = 2.0;
                    else if (gradeOverride >= 70) course.gradeOverridePoints = 1.7;
                    else if (gradeOverride >= 67) course.gradeOverridePoints = 1.3;
                    else if (gradeOverride >= 63) course.gradeOverridePoints = 1.0;
                    else if (gradeOverride >= 60) course.gradeOverridePoints = 0.7;
                    else course.gradeOverridePoints = 0.0;
                } else {
                    // Convert percentage to 4.0 scale
                    if (gradeOverride >= 93) course.gradeOverridePoints = 4.0;
                    else if (gradeOverride >= 90) course.gradeOverridePoints = 3.7;
                    else if (gradeOverride >= 87) course.gradeOverridePoints = 3.3;
                    else if (gradeOverride >= 83) course.gradeOverridePoints = 3.0;
                    else if (gradeOverride >= 80) course.gradeOverridePoints = 2.7;
                    else if (gradeOverride >= 77) course.gradeOverridePoints = 2.3;
                    else if (gradeOverride >= 73) course.gradeOverridePoints = 2.0;
                    else if (gradeOverride >= 70) course.gradeOverridePoints = 1.7;
                    else if (gradeOverride >= 67) course.gradeOverridePoints = 1.3;
                    else if (gradeOverride >= 63) course.gradeOverridePoints = 1.0;
                    else if (gradeOverride >= 60) course.gradeOverridePoints = 0.7;
                    else course.gradeOverridePoints = 0.0;
                }
            }

            await course.save();

            res.json({
                message: 'Grade override set successfully',
                course: course,
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

// @route   POST /api/gpa/courses/:id/revert-override
// @desc    Revert grade override to calculated grade
// @access  Private
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

            // Remove grade override
            course.gradeOverride = undefined;
            course.gradeOverridePoints = undefined;

            await course.save();

            res.json({
                message: 'Grade override reverted successfully',
                course: course,
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

// Update course study hours, difficulty, and notes
router.put('/courses/:id/personal', auth, async (req, res) => {
    try {
        const { studyHours, difficultyRating, personalNotes, targetGrade } = req.body;

        const course = await Course.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
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

// Get dashboard analytics
router.get('/dashboard-analytics', auth, async (req, res) => {
    try {
        const courses = await Course.find({ user: req.user.id });

        // Calculate various analytics
        const analytics = {
            totalCourses: courses.length,
            totalCredits: courses.reduce((sum, course) => sum + (course.credits || 0), 0),
            averageGPA: courses.length > 0 ? courses.reduce((sum, course) => sum + (course.gradePoints || 0), 0) / courses.length : 0,
            semesterBreakdown: {},
            categoryBreakdown: {},
            studyHoursTotal: courses.reduce((sum, course) => sum + (course.studyHours || 0), 0),
            difficultyAverages: {}
        };

        // Semester breakdown
        courses.forEach(course => {
            const semester = course.semester;
            if (!analytics.semesterBreakdown[semester]) {
                analytics.semesterBreakdown[semester] = { courses: [], totalGPA: 0, count: 0 };
            }
            analytics.semesterBreakdown[semester].courses.push(course);
            analytics.semesterBreakdown[semester].totalGPA += course.gradePoints || 0;
            analytics.semesterBreakdown[semester].count += 1;
        });

        // Category breakdown
        courses.forEach(course => {
            const category = course.category || 'General';
            if (!analytics.categoryBreakdown[category]) {
                analytics.categoryBreakdown[category] = { courses: [], totalGPA: 0, count: 0 };
            }
            analytics.categoryBreakdown[category].courses.push(course);
            analytics.categoryBreakdown[category].totalGPA += course.gradePoints || 0;
            analytics.categoryBreakdown[category].count += 1;
        });

        // Calculate averages
        Object.keys(analytics.semesterBreakdown).forEach(semester => {
            analytics.semesterBreakdown[semester].averageGPA =
                analytics.semesterBreakdown[semester].totalGPA / analytics.semesterBreakdown[semester].count;
        });

        Object.keys(analytics.categoryBreakdown).forEach(category => {
            analytics.categoryBreakdown[category].averageGPA =
                analytics.categoryBreakdown[category].totalGPA / analytics.categoryBreakdown[category].count;
        });

        res.json({ success: true, analytics });
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Study Logs endpoints
router.post('/study-logs', auth, async (req, res) => {
    try {
        const { courseId, hours, date, notes } = req.body;

        // Validate required fields
        if (!courseId || !hours || !date) {
            return res.status(400).json({ error: 'Course ID, hours, and date are required' });
        }

        // Verify course belongs to user
        const course = await Course.findOne({ _id: courseId, user: req.user.id });
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Create study log
        const studyLog = new StudyLog({
            user: req.user.id,
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

router.get('/study-logs', auth, async (req, res) => {
    try {
        const studyLogs = await StudyLog.find({ user: req.user.id })
            .sort({ date: -1 })
            .limit(50);

        res.json({ success: true, studyLogs });
    } catch (error) {
        console.error('Error fetching study logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
