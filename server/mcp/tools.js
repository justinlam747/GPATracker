/**
 * MCP Tool Definitions
 *
 * Defines all platform operations as tool schemas that can be consumed by
 * both the MCP server (for external clients) and the LangChain agent (internal).
 * Each tool maps to an existing platform function.
 */

const tools = [
    // ── Course Operations ─────────────────────────────────────────────────
    {
        name: 'list_courses',
        description: 'List all courses for the current user. Can filter by semester, year, or category.',
        parameters: {
            type: 'object',
            properties: {
                semester: { type: 'string', description: 'Filter by semester (Fall, Spring, Summer, Winter)', enum: ['Fall', 'Spring', 'Summer', 'Winter'] },
                year: { type: 'number', description: 'Filter by academic year (e.g. 2024)' },
                category: { type: 'string', description: 'Filter by course category' }
            }
        }
    },
    {
        name: 'get_course',
        description: 'Get detailed information about a specific course including all assignments.',
        parameters: {
            type: 'object',
            properties: {
                courseId: { type: 'string', description: 'The UUID of the course to retrieve' }
            },
            required: ['courseId']
        }
    },
    {
        name: 'create_course',
        description: 'Create a new course. Requires name, credits, semester, and year. Grade and other fields are optional.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', description: 'Course name (e.g. "Introduction to Computer Science")' },
                code: { type: 'string', description: 'Course code (e.g. "CS101")' },
                credits: { type: 'number', description: 'Number of credits (0.5-10)' },
                grade: { type: 'string', description: 'Letter grade or percentage (e.g. "A", "85")' },
                semester: { type: 'string', description: 'Semester', enum: ['Fall', 'Spring', 'Summer', 'Winter'] },
                year: { type: 'number', description: 'Academic year' },
                category: { type: 'string', description: 'Course category (default: "General")' },
                courseType: { type: 'string', description: 'simple (single grade) or detailed (weighted assignments)', enum: ['simple', 'detailed'] },
                gpaScale: { type: 'string', description: 'GPA scale', enum: ['4.0', '4.3', 'percentage'] },
                isCompleted: { type: 'boolean', description: 'Whether the course is completed' }
            },
            required: ['name', 'credits', 'semester', 'year']
        }
    },
    {
        name: 'update_course',
        description: 'Update an existing course. Only provide fields you want to change.',
        parameters: {
            type: 'object',
            properties: {
                courseId: { type: 'string', description: 'The UUID of the course to update' },
                name: { type: 'string' },
                code: { type: 'string' },
                credits: { type: 'number' },
                grade: { type: 'string' },
                semester: { type: 'string' },
                year: { type: 'number' },
                category: { type: 'string' },
                isCompleted: { type: 'boolean' }
            },
            required: ['courseId']
        }
    },
    {
        name: 'delete_course',
        description: 'Delete a course and all its assignments permanently.',
        parameters: {
            type: 'object',
            properties: {
                courseId: { type: 'string', description: 'The UUID of the course to delete' }
            },
            required: ['courseId']
        }
    },

    // ── Assignment Operations ─────────────────────────────────────────────
    {
        name: 'add_assignment',
        description: 'Add an assignment/component to a course with a name, type, weight percentage, and optional grade.',
        parameters: {
            type: 'object',
            properties: {
                courseId: { type: 'string', description: 'The UUID of the course' },
                name: { type: 'string', description: 'Assignment name (e.g. "Midterm Exam")' },
                type: { type: 'string', description: 'Assignment type', enum: ['Assignment', 'Quiz', 'Exam', 'Project', 'Participation', 'Other'] },
                weight: { type: 'number', description: 'Weight as percentage (0-100)' },
                grade: { type: 'string', description: 'Grade achieved (letter or number)' },
                maxGrade: { type: 'number', description: 'Maximum possible grade (default 100)' }
            },
            required: ['courseId', 'name', 'type', 'weight']
        }
    },
    {
        name: 'update_assignment',
        description: 'Update an existing assignment. Only provide fields to change.',
        parameters: {
            type: 'object',
            properties: {
                courseId: { type: 'string' },
                assignmentId: { type: 'string' },
                name: { type: 'string' },
                type: { type: 'string' },
                weight: { type: 'number' },
                grade: { type: 'string' },
                maxGrade: { type: 'number' }
            },
            required: ['courseId', 'assignmentId']
        }
    },
    {
        name: 'delete_assignment',
        description: 'Delete an assignment from a course.',
        parameters: {
            type: 'object',
            properties: {
                courseId: { type: 'string' },
                assignmentId: { type: 'string' }
            },
            required: ['courseId', 'assignmentId']
        }
    },

    // ── GPA & Analytics ───────────────────────────────────────────────────
    {
        name: 'get_gpa_summary',
        description: 'Get the user\'s overall GPA, semester-by-semester GPA, and category GPA breakdown.',
        parameters: {
            type: 'object',
            properties: {}
        }
    },
    {
        name: 'get_dashboard_analytics',
        description: 'Get comprehensive dashboard analytics including GPA trends, credit totals, grade distribution, and study hours.',
        parameters: {
            type: 'object',
            properties: {}
        }
    },

    // ── Import Operations ─────────────────────────────────────────────────
    {
        name: 'parse_transcript',
        description: 'Parse transcript text to extract courses. Returns a list of detected courses with code, name, credits, grade, semester, and year.',
        parameters: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'The transcript text to parse' }
            },
            required: ['text']
        }
    },
    {
        name: 'parse_syllabus',
        description: 'Parse syllabus text to extract the grading/marking scheme. Returns assignment categories with names, types, and weight percentages.',
        parameters: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'The syllabus text to parse' }
            },
            required: ['text']
        }
    },
    {
        name: 'search_templates',
        description: 'Search for course marking scheme templates by course name, code, or department. Returns curated templates with suggested assignment weights.',
        parameters: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'Search query (e.g. "computer science", "CS101", "engineering")' }
            }
        }
    },
    {
        name: 'apply_template',
        description: 'Apply a marking scheme template to a course. Creates assignments based on the template\'s weight breakdown.',
        parameters: {
            type: 'object',
            properties: {
                courseId: { type: 'string', description: 'The UUID of the course to apply the template to' },
                templateId: { type: 'string', description: 'The template ID to apply' }
            },
            required: ['courseId', 'templateId']
        }
    },
    {
        name: 'bulk_import_courses',
        description: 'Import multiple courses at once from parsed transcript data.',
        parameters: {
            type: 'object',
            properties: {
                courses: {
                    type: 'array',
                    description: 'Array of courses to import',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            code: { type: 'string' },
                            credits: { type: 'number' },
                            grade: { type: 'string' },
                            semester: { type: 'string' },
                            year: { type: 'number' }
                        },
                        required: ['name', 'credits', 'semester', 'year']
                    }
                }
            },
            required: ['courses']
        }
    },

    // ── Grade Operations ──────────────────────────────────────────────────
    {
        name: 'set_grade_override',
        description: 'Override a course\'s calculated grade with a manual grade (e.g. from official transcript).',
        parameters: {
            type: 'object',
            properties: {
                courseId: { type: 'string' },
                grade: { type: 'string', description: 'The override grade (letter or percentage)' }
            },
            required: ['courseId', 'grade']
        }
    },
    {
        name: 'revert_grade_override',
        description: 'Remove a grade override and revert to the calculated or original grade.',
        parameters: {
            type: 'object',
            properties: {
                courseId: { type: 'string' }
            },
            required: ['courseId']
        }
    }
];

module.exports = { tools };
