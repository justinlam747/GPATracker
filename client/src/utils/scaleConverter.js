/**
 * Client-side Grade Scale Conversion Utility
 *
 * Mirrors the server-side gradeConversion.js logic.
 * Assignments are always in percentage, then converted to user's chosen scale.
 */

export const GRADE_SCALES = {
    '4.0': '4.0',
    '4.3': '4.3',
    'letter': 'letter',
    'percentage': 'percentage'
};

// Valid letter grades
export const VALID_LETTER_GRADES = [
    'A+', 'A', 'A-',
    'B+', 'B', 'B-',
    'C+', 'C', 'C-',
    'D+', 'D', 'D-',
    'F', 'P', 'NP', 'W', 'I'
];

// Grades excluded from GPA calculation
export const EXCLUDED_GRADES = ['P', 'NP', 'W', 'I'];

/**
 * Clamp a percentage value to 0-100.
 */
const clampPercentage = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(100, num));
};

/**
 * Convert percentage (0-100) to GPA based on target scale.
 * Input is clamped to 0-100.
 */
export const percentageToGPA = (percentage, targetScale) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) return 0;

    const numPercentage = clampPercentage(percentage);

    if (targetScale === 'percentage') {
        return numPercentage;
    }

    if (targetScale === 'letter') {
        return percentageToLetter(numPercentage);
    }

    // For 4.0 and 4.3 scales
    const thresholds = targetScale === '4.3'
        ? [
            { min: 97, points: 4.3 },
            { min: 93, points: 4.0 },
            { min: 90, points: 3.7 },
            { min: 87, points: 3.3 },
            { min: 83, points: 3.0 },
            { min: 80, points: 2.7 },
            { min: 77, points: 2.3 },
            { min: 73, points: 2.0 },
            { min: 70, points: 1.7 },
            { min: 67, points: 1.3 },
            { min: 63, points: 1.0 },
            { min: 60, points: 0.7 },
            { min: 0, points: 0.0 }
        ]
        : [
            { min: 93, points: 4.0 },
            { min: 90, points: 3.7 },
            { min: 87, points: 3.3 },
            { min: 83, points: 3.0 },
            { min: 80, points: 2.7 },
            { min: 77, points: 2.3 },
            { min: 73, points: 2.0 },
            { min: 70, points: 1.7 },
            { min: 67, points: 1.3 },
            { min: 63, points: 1.0 },
            { min: 60, points: 0.7 },
            { min: 0, points: 0.0 }
        ];

    for (const { min, points } of thresholds) {
        if (numPercentage >= min) return points;
    }
    return 0.0;
};

/**
 * Convert percentage to letter grade.
 */
const percentageToLetter = (percentage) => {
    const pct = clampPercentage(percentage);
    if (pct >= 97) return 'A+';
    if (pct >= 93) return 'A';
    if (pct >= 90) return 'A-';
    if (pct >= 87) return 'B+';
    if (pct >= 83) return 'B';
    if (pct >= 80) return 'B-';
    if (pct >= 77) return 'C+';
    if (pct >= 73) return 'C';
    if (pct >= 70) return 'C-';
    if (pct >= 67) return 'D+';
    if (pct >= 63) return 'D';
    if (pct >= 60) return 'D-';
    return 'F';
};

/**
 * Get letter grade from percentage (for display purposes).
 */
export const getLetterGrade = (percentage) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) return 'N/A';
    return percentageToLetter(percentage);
};

/**
 * Check if a grade should be excluded from GPA.
 */
export const isExcludedGrade = (grade) => {
    if (typeof grade === 'string') {
        return EXCLUDED_GRADES.includes(grade.trim());
    }
    return false;
};

/**
 * Format GPA for display based on scale.
 */
export const formatGPA = (value, scale) => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    if (typeof value === 'number' && isNaN(value)) return 'N/A';

    if (scale === 'percentage') {
        return `${parseFloat(value).toFixed(1)}%`;
    }

    if (scale === 'letter') {
        return String(value);
    }

    // For 4.0 and 4.3 scales
    return parseFloat(value).toFixed(2);
};

/**
 * Get grade color based on percentage.
 */
export const getGradeColor = (percentage) => {
    if (percentage === null || percentage === undefined || isNaN(percentage)) {
        return 'bg-gray-100 text-gray-800';
    }

    const numPercentage = parseFloat(percentage);
    if (isNaN(numPercentage)) return 'bg-gray-100 text-gray-800';
    if (numPercentage >= 90) return 'bg-green-100 text-green-800';
    if (numPercentage >= 80) return 'bg-blue-100 text-blue-800';
    if (numPercentage >= 70) return 'bg-yellow-100 text-yellow-800';
    if (numPercentage >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
};
