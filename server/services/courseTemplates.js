/**
 * Course Template Suggestions Service
 *
 * Provides common marking scheme templates based on course type/department.
 * These are curated from typical North American university course structures.
 */

const TEMPLATES = [
    // ── Computer Science / Engineering ──────────────────────────────────────
    {
        id: 'cs-intro',
        name: 'Intro Computer Science',
        department: 'Computer Science',
        keywords: ['cs', 'csc', 'comp', 'cpsc', 'intro', 'programming', 'computer science'],
        markingScheme: [
            { name: 'Assignments', type: 'Assignment', weight: 30 },
            { name: 'Midterm Exam', type: 'Exam', weight: 25 },
            { name: 'Final Exam', type: 'Exam', weight: 35 },
            { name: 'Participation', type: 'Participation', weight: 10 }
        ]
    },
    {
        id: 'cs-advanced',
        name: 'Advanced CS (Project-Based)',
        department: 'Computer Science',
        keywords: ['software', 'systems', 'database', 'networks', 'os', 'operating', 'distributed'],
        markingScheme: [
            { name: 'Assignments', type: 'Assignment', weight: 20 },
            { name: 'Project', type: 'Project', weight: 30 },
            { name: 'Midterm Exam', type: 'Exam', weight: 20 },
            { name: 'Final Exam', type: 'Exam', weight: 25 },
            { name: 'Participation', type: 'Participation', weight: 5 }
        ]
    },
    {
        id: 'cs-lab',
        name: 'CS with Lab Component',
        department: 'Computer Science',
        keywords: ['lab', 'laboratory', 'data structures', 'algorithms'],
        markingScheme: [
            { name: 'Labs', type: 'Project', weight: 25 },
            { name: 'Assignments', type: 'Assignment', weight: 15 },
            { name: 'Midterm Exam', type: 'Exam', weight: 25 },
            { name: 'Final Exam', type: 'Exam', weight: 30 },
            { name: 'Quizzes', type: 'Quiz', weight: 5 }
        ]
    },
    {
        id: 'engineering',
        name: 'Engineering',
        department: 'Engineering',
        keywords: ['eng', 'ece', 'mech', 'civil', 'elec', 'engineering', 'engg'],
        markingScheme: [
            { name: 'Assignments', type: 'Assignment', weight: 15 },
            { name: 'Labs', type: 'Project', weight: 15 },
            { name: 'Midterm Exam', type: 'Exam', weight: 30 },
            { name: 'Final Exam', type: 'Exam', weight: 40 }
        ]
    },

    // ── Mathematics / Statistics ────────────────────────────────────────────
    {
        id: 'math-standard',
        name: 'Mathematics',
        department: 'Mathematics',
        keywords: ['math', 'calculus', 'algebra', 'analysis', 'mth', 'mat'],
        markingScheme: [
            { name: 'Homework', type: 'Assignment', weight: 20 },
            { name: 'Quizzes', type: 'Quiz', weight: 10 },
            { name: 'Midterm Exam', type: 'Exam', weight: 30 },
            { name: 'Final Exam', type: 'Exam', weight: 40 }
        ]
    },
    {
        id: 'stats',
        name: 'Statistics',
        department: 'Mathematics',
        keywords: ['stat', 'statistics', 'probability', 'data analysis'],
        markingScheme: [
            { name: 'Assignments', type: 'Assignment', weight: 20 },
            { name: 'Labs / Data Projects', type: 'Project', weight: 15 },
            { name: 'Midterm Exam', type: 'Exam', weight: 25 },
            { name: 'Final Exam', type: 'Exam', weight: 35 },
            { name: 'Participation', type: 'Participation', weight: 5 }
        ]
    },

    // ── Sciences ────────────────────────────────────────────────────────────
    {
        id: 'science-lab',
        name: 'Science with Lab',
        department: 'Sciences',
        keywords: ['bio', 'chem', 'phys', 'biology', 'chemistry', 'physics', 'science'],
        markingScheme: [
            { name: 'Lab Reports', type: 'Project', weight: 25 },
            { name: 'Assignments', type: 'Assignment', weight: 10 },
            { name: 'Midterm Exam', type: 'Exam', weight: 25 },
            { name: 'Final Exam', type: 'Exam', weight: 35 },
            { name: 'Lab Participation', type: 'Participation', weight: 5 }
        ]
    },
    {
        id: 'science-nolab',
        name: 'Science (Lecture Only)',
        department: 'Sciences',
        keywords: ['ecology', 'genetics', 'organic', 'anatomy'],
        markingScheme: [
            { name: 'Assignments', type: 'Assignment', weight: 20 },
            { name: 'Quizzes', type: 'Quiz', weight: 10 },
            { name: 'Midterm Exam', type: 'Exam', weight: 30 },
            { name: 'Final Exam', type: 'Exam', weight: 40 }
        ]
    },

    // ── Business / Economics ────────────────────────────────────────────────
    {
        id: 'business',
        name: 'Business / Management',
        department: 'Business',
        keywords: ['bus', 'business', 'mgmt', 'management', 'marketing', 'finance', 'accounting', 'mba'],
        markingScheme: [
            { name: 'Case Studies', type: 'Assignment', weight: 20 },
            { name: 'Group Project', type: 'Project', weight: 25 },
            { name: 'Midterm Exam', type: 'Exam', weight: 20 },
            { name: 'Final Exam', type: 'Exam', weight: 25 },
            { name: 'Participation', type: 'Participation', weight: 10 }
        ]
    },
    {
        id: 'economics',
        name: 'Economics',
        department: 'Business',
        keywords: ['econ', 'economics', 'macro', 'micro'],
        markingScheme: [
            { name: 'Problem Sets', type: 'Assignment', weight: 25 },
            { name: 'Midterm Exam', type: 'Exam', weight: 30 },
            { name: 'Final Exam', type: 'Exam', weight: 40 },
            { name: 'Participation', type: 'Participation', weight: 5 }
        ]
    },

    // ── Humanities / Social Sciences ────────────────────────────────────────
    {
        id: 'humanities-essay',
        name: 'Humanities (Essay-Based)',
        department: 'Humanities',
        keywords: ['english', 'history', 'philosophy', 'literature', 'humanities', 'arts', 'hist', 'phil', 'engl'],
        markingScheme: [
            { name: 'Essays', type: 'Assignment', weight: 40 },
            { name: 'Research Paper', type: 'Project', weight: 25 },
            { name: 'Midterm Exam', type: 'Exam', weight: 15 },
            { name: 'Participation & Discussion', type: 'Participation', weight: 20 }
        ]
    },
    {
        id: 'social-science',
        name: 'Social Sciences',
        department: 'Social Sciences',
        keywords: ['psych', 'soc', 'poli', 'psychology', 'sociology', 'political', 'anthropology'],
        markingScheme: [
            { name: 'Written Assignments', type: 'Assignment', weight: 25 },
            { name: 'Research Project', type: 'Project', weight: 20 },
            { name: 'Midterm Exam', type: 'Exam', weight: 20 },
            { name: 'Final Exam', type: 'Exam', weight: 25 },
            { name: 'Participation', type: 'Participation', weight: 10 }
        ]
    },

    // ── Languages ───────────────────────────────────────────────────────────
    {
        id: 'language',
        name: 'Language Course',
        department: 'Languages',
        keywords: ['french', 'spanish', 'german', 'chinese', 'japanese', 'italian', 'language', 'esl'],
        markingScheme: [
            { name: 'Quizzes', type: 'Quiz', weight: 15 },
            { name: 'Written Assignments', type: 'Assignment', weight: 20 },
            { name: 'Oral Presentations', type: 'Other', weight: 15 },
            { name: 'Midterm Exam', type: 'Exam', weight: 20 },
            { name: 'Final Exam', type: 'Exam', weight: 20 },
            { name: 'Participation', type: 'Participation', weight: 10 }
        ]
    },

    // ── Health Sciences / Nursing ───────────────────────────────────────────
    {
        id: 'health-science',
        name: 'Health Sciences / Nursing',
        department: 'Health Sciences',
        keywords: ['nursing', 'health', 'kinesiology', 'nutrition', 'public health', 'nurs'],
        markingScheme: [
            { name: 'Clinical Practicum', type: 'Project', weight: 30 },
            { name: 'Exams', type: 'Exam', weight: 30 },
            { name: 'Assignments', type: 'Assignment', weight: 20 },
            { name: 'Quizzes', type: 'Quiz', weight: 10 },
            { name: 'Participation', type: 'Participation', weight: 10 }
        ]
    },

    // ── Generic / Default ──────────────────────────────────────────────────
    {
        id: 'generic-balanced',
        name: 'Balanced (Generic)',
        department: 'General',
        keywords: [],
        markingScheme: [
            { name: 'Assignments', type: 'Assignment', weight: 25 },
            { name: 'Midterm Exam', type: 'Exam', weight: 25 },
            { name: 'Final Exam', type: 'Exam', weight: 35 },
            { name: 'Participation', type: 'Participation', weight: 15 }
        ]
    },
    {
        id: 'generic-project',
        name: 'Project-Heavy (Generic)',
        department: 'General',
        keywords: [],
        markingScheme: [
            { name: 'Project', type: 'Project', weight: 35 },
            { name: 'Assignments', type: 'Assignment', weight: 20 },
            { name: 'Midterm Exam', type: 'Exam', weight: 20 },
            { name: 'Final Exam', type: 'Exam', weight: 25 }
        ]
    },
    {
        id: 'generic-exam',
        name: 'Exam-Heavy (Generic)',
        department: 'General',
        keywords: [],
        markingScheme: [
            { name: 'Homework', type: 'Assignment', weight: 15 },
            { name: 'Midterm Exam', type: 'Exam', weight: 35 },
            { name: 'Final Exam', type: 'Exam', weight: 45 },
            { name: 'Participation', type: 'Participation', weight: 5 }
        ]
    }
];

/**
 * Search templates by query string (course code, name, or department).
 * Returns top matches sorted by relevance.
 */
function searchTemplates(queryStr) {
    if (!queryStr || typeof queryStr !== 'string') {
        return TEMPLATES;
    }

    const q = queryStr.toLowerCase().trim();
    if (q.length === 0) return TEMPLATES;

    const scored = TEMPLATES.map(t => {
        let score = 0;

        // Exact name match
        if (t.name.toLowerCase().includes(q)) score += 10;

        // Department match
        if (t.department.toLowerCase().includes(q)) score += 8;

        // Keyword match
        for (const kw of t.keywords) {
            if (q.includes(kw) || kw.includes(q)) score += 5;
        }

        // Partial match on any keyword
        const qTokens = q.split(/\s+/);
        for (const token of qTokens) {
            if (token.length < 2) continue;
            for (const kw of t.keywords) {
                if (kw.startsWith(token) || token.startsWith(kw)) score += 3;
            }
            if (t.name.toLowerCase().includes(token)) score += 2;
            if (t.department.toLowerCase().includes(token)) score += 2;
        }

        return { ...t, score };
    });

    return scored
        .filter(t => t.score > 0)
        .sort((a, b) => b.score - a.score);
}

/**
 * Get all unique departments
 */
function getDepartments() {
    const depts = new Set(TEMPLATES.map(t => t.department));
    return [...depts].sort();
}

/**
 * Get templates by department
 */
function getByDepartment(department) {
    return TEMPLATES.filter(t => t.department.toLowerCase() === department.toLowerCase());
}

/**
 * Get a template by ID
 */
function getById(id) {
    return TEMPLATES.find(t => t.id === id) || null;
}

module.exports = { searchTemplates, getDepartments, getByDepartment, getById, TEMPLATES };
