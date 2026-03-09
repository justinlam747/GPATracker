/**
 * Transcript Parser Service
 *
 * Extracts courses from academic transcript text (PDF or pasted text).
 * Handles common transcript formats from North American universities.
 */

const SEMESTER_PATTERNS = {
    fall: /\b(fall|autumn)\b/i,
    spring: /\b(spring)\b/i,
    summer: /\b(summer)\b/i,
    winter: /\b(winter)\b/i
};

const YEAR_PATTERN = /\b(20\d{2})\b/;

const LETTER_GRADES = new Set([
    'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-',
    'D+', 'D', 'D-', 'F', 'P', 'NP', 'W', 'WD', 'WF',
    'I', 'IP', 'CR', 'NC', 'AU', 'S', 'U', 'TR'
]);

/**
 * Parse transcript text and extract courses.
 * Returns { courses: [...], metadata: { ... } }
 */
function parseTranscript(text) {
    if (!text || typeof text !== 'string') {
        return { courses: [], metadata: { lines: 0, parseMethod: 'none' } };
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Try multiple parsing strategies and pick the one that yields best results
    const strategies = [
        parseTabularFormat,
        parseInlineFormat,
        parseSpaceSeparatedFormat
    ];

    let bestResult = { courses: [], metadata: { parseMethod: 'none' } };

    for (const strategy of strategies) {
        const result = strategy(lines);
        if (result.courses.length > bestResult.courses.length) {
            bestResult = result;
        }
    }

    // Enrich courses with semester context from section headers
    const enriched = enrichWithSemesterContext(lines, bestResult.courses);

    return {
        courses: deduplicateCourses(enriched),
        metadata: {
            lines: lines.length,
            parseMethod: bestResult.metadata.parseMethod,
            coursesFound: enriched.length
        }
    };
}

/**
 * Strategy 1: Tabular format
 * COURSE_CODE    COURSE_NAME    CREDITS    GRADE
 */
function parseTabularFormat(lines) {
    const courses = [];
    // Match lines like: CS101    Introduction to CS    3.0    A
    // or: CS 101    Introduction to CS    3    A-
    const pattern = /^([A-Z]{2,5}\s*\d{3,4}[A-Z]?)\s{2,}(.+?)\s{2,}(\d+\.?\d*)\s{2,}([A-F][+-]?|[PWNICS][A-Z]?)\s*$/;

    for (const line of lines) {
        const match = line.match(pattern);
        if (match) {
            courses.push({
                code: match[1].trim(),
                name: match[2].trim(),
                credits: parseFloat(match[3]),
                grade: match[4].trim()
            });
        }
    }

    return { courses, metadata: { parseMethod: 'tabular' } };
}

/**
 * Strategy 2: Inline format with various delimiters
 * CS101 - Introduction to Computer Science - 3 credits - Grade: A
 */
function parseInlineFormat(lines) {
    const courses = [];

    for (const line of lines) {
        // Pattern: CODE - NAME - CREDITS - GRADE (with various separators)
        const match = line.match(
            /([A-Z]{2,5}\s*\d{3,4}[A-Z]?)\s*[-–:]\s*(.+?)\s*[-–:]\s*(\d+\.?\d*)\s*(?:credits?\s*[-–:]?\s*)?(?:grade:?\s*)?([A-F][+-]?|[PWNICS][A-Z]?)\s*$/i
        );
        if (match) {
            courses.push({
                code: match[1].trim(),
                name: match[2].trim(),
                credits: parseFloat(match[3]),
                grade: match[4].trim().toUpperCase()
            });
        }
    }

    return { courses, metadata: { parseMethod: 'inline' } };
}

/**
 * Strategy 3: Space-separated columns (most common in PDF-extracted text)
 * Tries to identify course code, then scans for a grade and credit value
 */
function parseSpaceSeparatedFormat(lines) {
    const courses = [];
    const courseCodePattern = /^([A-Z]{2,5}\s?\d{3,4}[A-Z]?)\b/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const codeMatch = line.match(courseCodePattern);
        if (!codeMatch) continue;

        const code = codeMatch[1].trim();
        const rest = line.slice(codeMatch[0].length).trim();

        // Extract tokens from rest of line
        const tokens = rest.split(/\s+/);

        let grade = null;
        let credits = null;
        let nameTokens = [];

        for (const token of tokens) {
            const upper = token.toUpperCase();
            if (LETTER_GRADES.has(upper) && !grade) {
                grade = upper;
            } else if (/^\d+\.?\d*$/.test(token) && parseFloat(token) >= 0.5 && parseFloat(token) <= 10) {
                credits = parseFloat(token);
            } else if (!grade) {
                // Accumulate name tokens until we hit grade/credits
                nameTokens.push(token);
            }
        }

        // Need at least a grade OR credits to consider this a valid course line
        if (grade || credits) {
            courses.push({
                code,
                name: nameTokens.join(' ') || code,
                credits: credits || 3, // default 3 credits if not found
                grade: grade || null
            });
        }
    }

    return { courses, metadata: { parseMethod: 'space-separated' } };
}

/**
 * Scan for semester/year headers and apply them to courses
 */
function enrichWithSemesterContext(lines, courses) {
    if (courses.length === 0) return courses;

    // Build a map of line indices to semester/year context
    const contexts = [];
    let currentSemester = 'Fall';
    let currentYear = new Date().getFullYear();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for semester headers like "Fall 2023", "Spring Semester 2024", "2023 Fall"
        let foundSemester = null;
        let foundYear = null;

        for (const [sem, pattern] of Object.entries(SEMESTER_PATTERNS)) {
            if (pattern.test(line)) {
                foundSemester = sem.charAt(0).toUpperCase() + sem.slice(1);
            }
        }

        const yearMatch = line.match(YEAR_PATTERN);
        if (yearMatch) {
            foundYear = parseInt(yearMatch[1]);
        }

        if (foundSemester || foundYear) {
            if (foundSemester) currentSemester = foundSemester;
            if (foundYear) currentYear = foundYear;
        }

        contexts.push({ semester: currentSemester, year: currentYear });
    }

    // Try to match each course to a line index and apply context
    for (const course of courses) {
        if (!course.semester) {
            // Find which line this course code appears on
            const lineIdx = lines.findIndex(l => l.includes(course.code));
            if (lineIdx >= 0 && contexts[lineIdx]) {
                course.semester = contexts[lineIdx].semester;
                course.year = contexts[lineIdx].year;
            } else {
                course.semester = currentSemester;
                course.year = currentYear;
            }
        }
    }

    return courses;
}

/**
 * Remove duplicate courses (same code + semester + year)
 */
function deduplicateCourses(courses) {
    const seen = new Set();
    return courses.filter(c => {
        const key = `${c.code}-${c.semester}-${c.year}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

module.exports = { parseTranscript };
