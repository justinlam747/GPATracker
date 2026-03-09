/**
 * Centralized Grade Conversion Module
 *
 * Single source of truth for all grade ↔ points ↔ percentage conversions.
 * All grade logic in the app (model, routes, client) should derive from these tables.
 */

// ── Letter grade → GPA points lookup tables ─────────────────────────────────

const GRADE_POINTS_4_0 = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
};

const GRADE_POINTS_4_3 = {
    'A+': 4.3, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
};

// Letter grades that should be excluded from GPA (non-numeric grades)
const EXCLUDED_GRADES = ['P', 'NP', 'W', 'I'];

// Letter grade → approximate percentage midpoints (for converting letter → %)
const LETTER_TO_PERCENTAGE = {
    'A+': 97, 'A': 95, 'A-': 92,
    'B+': 89, 'B': 85, 'B-': 82,
    'C+': 79, 'C': 75, 'C-': 72,
    'D+': 69, 'D': 65, 'D-': 62,
    'F': 50
};

// All valid letter grades (for input validation)
const VALID_LETTER_GRADES = [
    'A+', 'A', 'A-',
    'B+', 'B', 'B-',
    'C+', 'C', 'C-',
    'D+', 'D', 'D-',
    'F', 'P', 'NP', 'W', 'I'
];

// ── Percentage thresholds → GPA points ───────────────────────────────────────

const PERCENTAGE_THRESHOLDS_4_0 = [
    { min: 93, points: 4.0, letter: 'A' },
    { min: 90, points: 3.7, letter: 'A-' },
    { min: 87, points: 3.3, letter: 'B+' },
    { min: 83, points: 3.0, letter: 'B' },
    { min: 80, points: 2.7, letter: 'B-' },
    { min: 77, points: 2.3, letter: 'C+' },
    { min: 73, points: 2.0, letter: 'C' },
    { min: 70, points: 1.7, letter: 'C-' },
    { min: 67, points: 1.3, letter: 'D+' },
    { min: 63, points: 1.0, letter: 'D' },
    { min: 60, points: 0.7, letter: 'D-' },
    { min: 0, points: 0.0, letter: 'F' }
];

const PERCENTAGE_THRESHOLDS_4_3 = [
    { min: 97, points: 4.3, letter: 'A+' },
    { min: 93, points: 4.0, letter: 'A' },
    { min: 90, points: 3.7, letter: 'A-' },
    { min: 87, points: 3.3, letter: 'B+' },
    { min: 83, points: 3.0, letter: 'B' },
    { min: 80, points: 2.7, letter: 'B-' },
    { min: 77, points: 2.3, letter: 'C+' },
    { min: 73, points: 2.0, letter: 'C' },
    { min: 70, points: 1.7, letter: 'C-' },
    { min: 67, points: 1.3, letter: 'D+' },
    { min: 63, points: 1.0, letter: 'D' },
    { min: 60, points: 0.7, letter: 'D-' },
    { min: 0, points: 0.0, letter: 'F' }
];

// ── Core conversion functions ────────────────────────────────────────────────

/**
 * Check if a string is a valid letter grade
 */
function isLetterGrade(value) {
    if (typeof value !== 'string') return false;
    return VALID_LETTER_GRADES.includes(value.trim());
}

/**
 * Check if a grade should be excluded from GPA calculation (W, I, P, NP)
 */
function isExcludedGrade(grade) {
    if (typeof grade === 'string') {
        return EXCLUDED_GRADES.includes(grade.trim());
    }
    return false;
}

/**
 * Convert a percentage (0-100) to GPA points for the given scale.
 * Returns a number. Clamps input to 0-100.
 */
function percentageToPoints(percentage, scale = '4.0') {
    const pct = clampPercentage(percentage);

    if (scale === 'percentage') {
        return pct;
    }

    const thresholds = scale === '4.3'
        ? PERCENTAGE_THRESHOLDS_4_3
        : PERCENTAGE_THRESHOLDS_4_0;

    for (const { min, points } of thresholds) {
        if (pct >= min) return points;
    }
    return 0.0;
}

/**
 * Convert a percentage (0-100) to a letter grade string.
 */
function percentageToLetter(percentage) {
    const pct = clampPercentage(percentage);

    // Use 4.3 thresholds since they include A+
    for (const { min, letter } of PERCENTAGE_THRESHOLDS_4_3) {
        if (pct >= min) return letter;
    }
    return 'F';
}

/**
 * Convert a letter grade to GPA points for the given scale.
 * Returns 0 for excluded grades (W, I, P, NP).
 */
function letterToPoints(letter, scale = '4.0') {
    if (typeof letter !== 'string') return 0.0;
    const grade = letter.trim();

    if (isExcludedGrade(grade)) return 0.0;

    if (scale === 'percentage') {
        return LETTER_TO_PERCENTAGE[grade] || 0;
    }

    const map = scale === '4.3' ? GRADE_POINTS_4_3 : GRADE_POINTS_4_0;
    const points = map[grade];
    return points !== undefined ? points : 0.0;
}

/**
 * Convert a letter grade to an approximate percentage.
 */
function letterToPercentage(letter) {
    if (typeof letter !== 'string') return 0;
    return LETTER_TO_PERCENTAGE[letter.trim()] || 0;
}

/**
 * Convert GPA points back to a letter grade (for display).
 */
function pointsToLetter(points, scale = '4.0') {
    if (typeof points !== 'number' || isNaN(points)) return 'N/A';

    if (scale === 'percentage') {
        // Treat points as percentage
        return percentageToLetter(points);
    }

    // Build reverse lookup from points → letter
    const thresholds = scale === '4.3'
        ? PERCENTAGE_THRESHOLDS_4_3
        : PERCENTAGE_THRESHOLDS_4_0;

    // Sort thresholds by points descending for reverse lookup
    const pointThresholds = thresholds
        .map(t => ({ points: t.points, letter: t.letter }))
        .sort((a, b) => b.points - a.points);

    for (const { points: threshold, letter } of pointThresholds) {
        if (points >= threshold) return letter;
    }
    return 'F';
}

/**
 * Resolve a grade input to { gradePoints, percentage, letter } based on
 * an explicit input type. No guessing.
 *
 * @param {string|number} value     - The grade value
 * @param {'letter'|'percentage'} inputType - What the value represents
 * @param {string} scale           - '4.0', '4.3', or 'percentage'
 * @returns {{ gradePoints: number, percentage: number|null, letter: string|null }}
 */
function resolveGrade(value, inputType, scale = '4.0') {
    if (value === undefined || value === null || value === '') {
        return { gradePoints: 0, percentage: null, letter: null };
    }

    if (inputType === 'letter') {
        const letter = String(value).trim();
        if (!isLetterGrade(letter)) {
            return { gradePoints: 0, percentage: null, letter: null };
        }
        if (isExcludedGrade(letter)) {
            return { gradePoints: 0, percentage: null, letter };
        }
        return {
            gradePoints: letterToPoints(letter, scale),
            percentage: letterToPercentage(letter),
            letter
        };
    }

    if (inputType === 'percentage') {
        const pct = clampPercentage(parseFloat(value));
        if (isNaN(pct)) {
            return { gradePoints: 0, percentage: null, letter: null };
        }
        return {
            gradePoints: percentageToPoints(pct, scale),
            percentage: pct,
            letter: percentageToLetter(pct)
        };
    }

    // Fallback: try to detect (for backward compatibility only)
    return resolveGradeLegacy(value, scale);
}

/**
 * Legacy grade resolution for backward compatibility with existing data.
 * Tries to detect whether a value is a letter grade or percentage.
 * New code should always use resolveGrade() with an explicit inputType.
 */
function resolveGradeLegacy(value, scale = '4.0') {
    if (value === undefined || value === null || value === '') {
        return { gradePoints: 0, percentage: null, letter: null };
    }

    const strValue = String(value).trim();

    // Check if it's a recognized letter grade
    if (isLetterGrade(strValue)) {
        return resolveGrade(strValue, 'letter', scale);
    }

    // Try to parse as a number → treat as percentage
    const num = parseFloat(strValue);
    if (!isNaN(num)) {
        return resolveGrade(num, 'percentage', scale);
    }

    return { gradePoints: 0, percentage: null, letter: null };
}

/**
 * Calculate weighted GPA from an array of { gradePoints, credits } objects.
 * Skips entries with null/NaN gradePoints.
 * Returns 0 if no valid entries.
 */
function calculateWeightedGPA(entries) {
    let totalPoints = 0;
    let totalCredits = 0;

    for (const { gradePoints, credits } of entries) {
        if (typeof gradePoints === 'number' && !isNaN(gradePoints) &&
            typeof credits === 'number' && !isNaN(credits) && credits > 0) {
            totalPoints += gradePoints * credits;
            totalCredits += credits;
        }
    }

    return totalCredits > 0
        ? Math.round((totalPoints / totalCredits) * 100) / 100
        : 0;
}

/**
 * Clamp a percentage value to 0-100.
 */
function clampPercentage(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(100, num));
}

/**
 * Format a GPA value for display.
 */
function formatGPA(value, scale) {
    if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
        return 'N/A';
    }

    if (scale === 'percentage') {
        return `${parseFloat(value).toFixed(1)}%`;
    }

    if (scale === 'letter') {
        return String(value);
    }

    return parseFloat(value).toFixed(2);
}

module.exports = {
    // Lookup tables (for reference/testing)
    GRADE_POINTS_4_0,
    GRADE_POINTS_4_3,
    EXCLUDED_GRADES,
    VALID_LETTER_GRADES,
    LETTER_TO_PERCENTAGE,
    PERCENTAGE_THRESHOLDS_4_0,
    PERCENTAGE_THRESHOLDS_4_3,

    // Core functions
    isLetterGrade,
    isExcludedGrade,
    percentageToPoints,
    percentageToLetter,
    letterToPoints,
    letterToPercentage,
    pointsToLetter,
    resolveGrade,
    resolveGradeLegacy,
    calculateWeightedGPA,
    clampPercentage,
    formatGPA
};
