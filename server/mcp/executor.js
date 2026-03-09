/**
 * MCP Tool Executor
 *
 * Executes tool calls by dispatching to the actual platform functions.
 * Used by both the MCP server and the LangChain agent.
 * All functions require a userId for authorization.
 */

const Course = require('../models/Course');
const StudyLog = require('../models/StudyLog');
const { parseTranscript } = require('../services/transcriptParser');
const { parseSyllabus } = require('../services/syllabusParser');
const { searchTemplates, getById: getTemplateById } = require('../services/courseTemplates');
const {
    resolveGrade,
    isLetterGrade,
    percentageToPoints,
    percentageToLetter,
    calculateWeightedGPA
} = require('../utils/gradeConversion');

/**
 * Execute a tool by name with given arguments and user context.
 * Returns { success: boolean, data?: any, error?: string }
 */
async function executeTool(toolName, args, userId) {
    try {
        switch (toolName) {
            // ── Course Operations ──────────────────────────────────────
            case 'list_courses': {
                const filters = {};
                if (args.semester) filters.semester = args.semester;
                if (args.year) filters.year = args.year;
                if (args.category) filters.category = args.category;
                const courses = await Course.findByUser(userId, filters);
                return {
                    success: true,
                    data: {
                        courses: courses.map(c => ({
                            id: c.id,
                            name: c.name,
                            code: c.code,
                            credits: c.credits,
                            grade: c.getFinalGrade(),
                            semester: c.semester,
                            year: c.year,
                            category: c.category,
                            isCompleted: c.isCompleted,
                            assignmentCount: c.assignments?.length || 0
                        })),
                        count: courses.length
                    }
                };
            }

            case 'get_course': {
                const course = await Course.findById(args.courseId, userId);
                if (!course) return { success: false, error: 'Course not found' };
                return {
                    success: true,
                    data: {
                        ...course,
                        finalGrade: course.getFinalGrade(),
                        includesInGPA: course.shouldIncludeInGPA()
                    }
                };
            }

            case 'create_course': {
                const courseData = {
                    userId,
                    name: args.name,
                    code: args.code || '',
                    credits: args.credits,
                    grade: args.grade || null,
                    semester: args.semester,
                    year: args.year,
                    category: args.category || 'General',
                    courseType: args.courseType || 'simple',
                    gpaScale: args.gpaScale || '4.0',
                    isCompleted: args.isCompleted || false
                };

                // Resolve grade points
                if (courseData.grade) {
                    const resolved = resolveGrade(courseData.grade, courseData.gpaScale);
                    if (resolved) {
                        courseData.gradePoints = resolved.gradePoints;
                        courseData.gradeInputType = isLetterGrade(courseData.grade) ? 'letter' : 'percentage';
                    }
                }

                const course = await Course.createCourse(courseData);
                return {
                    success: true,
                    data: { message: `Created course "${course.name}"`, courseId: course.id, course }
                };
            }

            case 'update_course': {
                const { courseId, ...updates } = args;
                const course = await Course.updateCourse(courseId, userId, updates);
                if (!course) return { success: false, error: 'Course not found' };
                return {
                    success: true,
                    data: { message: `Updated course "${course.name}"`, course }
                };
            }

            case 'delete_course': {
                const deleted = await Course.deleteCourse(args.courseId, userId);
                if (!deleted) return { success: false, error: 'Course not found' };
                return {
                    success: true,
                    data: { message: `Deleted course "${deleted.name}"` }
                };
            }

            // ── Assignment Operations ─────────────────────────────────
            case 'add_assignment': {
                const result = await Course.addAssignment(args.courseId, userId, {
                    name: args.name,
                    type: args.type || 'Assignment',
                    weight: args.weight,
                    grade: args.grade || '0',
                    maxGrade: args.maxGrade || 100
                });
                if (!result) return { success: false, error: 'Course not found' };
                return {
                    success: true,
                    data: {
                        message: `Added "${args.name}" (${args.weight}%) to course`,
                        assignment: result.assignment,
                        updatedCourse: result.course
                    }
                };
            }

            case 'update_assignment': {
                const { courseId, assignmentId, ...assignmentData } = args;
                const result = await Course.updateAssignment(courseId, assignmentId, userId, assignmentData);
                if (!result) return { success: false, error: 'Course or assignment not found' };
                return {
                    success: true,
                    data: { message: 'Assignment updated', assignment: result.assignment }
                };
            }

            case 'delete_assignment': {
                const result = await Course.deleteAssignment(args.courseId, args.assignmentId, userId);
                if (!result) return { success: false, error: 'Course or assignment not found' };
                return {
                    success: true,
                    data: { message: 'Assignment deleted' }
                };
            }

            // ── GPA & Analytics ───────────────────────────────────────
            case 'get_gpa_summary': {
                const courses = await Course.findByUser(userId);
                const overallEntries = [];
                const semesterBuckets = {};
                const categoryBuckets = {};

                for (const c of courses) {
                    if (!c.shouldIncludeInGPA()) continue;
                    const fg = c.getFinalGrade();
                    if (!fg || fg.grade === 'N/A' || typeof fg.gradePoints !== 'number') continue;

                    const entry = { gradePoints: fg.gradePoints, credits: c.credits };
                    overallEntries.push(entry);

                    const semKey = `${c.semester} ${c.year}`;
                    (semesterBuckets[semKey] ||= []).push(entry);

                    const catKey = c.category || 'General';
                    (categoryBuckets[catKey] ||= []).push(entry);
                }

                const calcGPA = (entries) => {
                    if (entries.length === 0) return null;
                    let totalPoints = 0, totalCredits = 0;
                    for (const e of entries) {
                        totalPoints += e.gradePoints * e.credits;
                        totalCredits += e.credits;
                    }
                    return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 1000) / 1000 : null;
                };

                return {
                    success: true,
                    data: {
                        overallGPA: calcGPA(overallEntries),
                        totalCredits: overallEntries.reduce((s, e) => s + e.credits, 0),
                        totalCourses: courses.length,
                        completedCourses: overallEntries.length,
                        bySemester: Object.fromEntries(
                            Object.entries(semesterBuckets).map(([k, v]) => [k, { gpa: calcGPA(v), courses: v.length }])
                        ),
                        byCategory: Object.fromEntries(
                            Object.entries(categoryBuckets).map(([k, v]) => [k, { gpa: calcGPA(v), courses: v.length }])
                        )
                    }
                };
            }

            case 'get_dashboard_analytics': {
                const courses = await Course.findByUser(userId);
                let totalCredits = 0, completedCredits = 0, totalStudyHours = 0;
                const gradeDistribution = {};

                for (const c of courses) {
                    totalCredits += c.credits;
                    if (c.isCompleted) {
                        completedCredits += c.credits;
                        const fg = c.getFinalGrade();
                        if (fg && fg.grade !== 'N/A') {
                            gradeDistribution[fg.grade] = (gradeDistribution[fg.grade] || 0) + 1;
                        }
                    }
                    totalStudyHours += c.studyHours || 0;
                }

                return {
                    success: true,
                    data: {
                        totalCourses: courses.length,
                        totalCredits,
                        completedCredits,
                        completionRate: totalCredits > 0 ? Math.round((completedCredits / totalCredits) * 100) : 0,
                        totalStudyHours,
                        gradeDistribution
                    }
                };
            }

            // ── Import Operations ─────────────────────────────────────
            case 'parse_transcript': {
                const result = parseTranscript(args.text);
                return {
                    success: true,
                    data: {
                        courses: result.courses,
                        metadata: result.metadata,
                        message: `Found ${result.courses.length} courses`
                    }
                };
            }

            case 'parse_syllabus': {
                const result = parseSyllabus(args.text);
                return {
                    success: true,
                    data: {
                        markingScheme: result.markingScheme,
                        metadata: result.metadata,
                        message: `Detected ${result.markingScheme.length} grading components (${result.metadata.totalWeight}% total weight)`
                    }
                };
            }

            case 'search_templates': {
                const results = searchTemplates(args.query || '');
                return {
                    success: true,
                    data: {
                        templates: results.map(t => ({
                            id: t.id,
                            name: t.name,
                            department: t.department,
                            markingScheme: t.markingScheme
                        })),
                        count: results.length
                    }
                };
            }

            case 'apply_template': {
                const template = getTemplateById(args.templateId);
                if (!template) return { success: false, error: 'Template not found' };

                const existing = await Course.courseExists(args.courseId, userId);
                if (!existing) return { success: false, error: 'Course not found' };

                for (const item of template.markingScheme) {
                    await Course.addAssignment(args.courseId, userId, {
                        name: item.name,
                        type: item.type,
                        weight: item.weight,
                        grade: '0',
                        maxGrade: 100
                    });
                }

                const course = await Course.findById(args.courseId, userId);
                return {
                    success: true,
                    data: {
                        message: `Applied "${template.name}" template (${template.markingScheme.length} components)`,
                        course
                    }
                };
            }

            case 'bulk_import_courses': {
                const results = [];
                const errors = [];

                for (let i = 0; i < args.courses.length; i++) {
                    try {
                        const c = args.courses[i];
                        const courseData = {
                            userId,
                            name: c.name,
                            code: c.code || '',
                            credits: c.credits,
                            grade: c.grade || null,
                            semester: c.semester,
                            year: c.year,
                            category: 'General',
                            courseType: 'simple',
                            gpaScale: '4.0',
                            isCompleted: !!c.grade
                        };

                        if (courseData.grade) {
                            const resolved = resolveGrade(courseData.grade, courseData.gpaScale);
                            if (resolved) {
                                courseData.gradePoints = resolved.gradePoints;
                                courseData.gradeInputType = isLetterGrade(courseData.grade) ? 'letter' : 'percentage';
                            }
                        }

                        const course = await Course.createCourse(courseData);
                        results.push(course);
                    } catch (err) {
                        errors.push({ index: i, name: args.courses[i].name, error: err.message });
                    }
                }

                return {
                    success: true,
                    data: {
                        message: `Imported ${results.length}/${args.courses.length} courses`,
                        imported: results.length,
                        errors
                    }
                };
            }

            // ── Grade Operations ──────────────────────────────────────
            case 'set_grade_override': {
                const course = await Course.findById(args.courseId, userId);
                if (!course) return { success: false, error: 'Course not found' };

                const resolved = resolveGrade(args.grade, course.gpaScale || '4.0');
                const updates = {
                    gradeOverride: args.grade,
                    gradeOverridePoints: resolved?.gradePoints || null
                };

                const updated = await Course.updateCourse(args.courseId, userId, updates);
                return {
                    success: true,
                    data: { message: `Grade override set to "${args.grade}"`, course: updated }
                };
            }

            case 'revert_grade_override': {
                const updated = await Course.updateCourse(args.courseId, userId, {
                    gradeOverride: null,
                    gradeOverridePoints: null
                });
                if (!updated) return { success: false, error: 'Course not found' };
                return {
                    success: true,
                    data: { message: 'Grade override reverted', course: updated }
                };
            }

            default:
                return { success: false, error: `Unknown tool: ${toolName}` };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = { executeTool };
