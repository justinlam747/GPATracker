// Grade Scale Conversion Utility - NO CROSS-SCALE CONVERSION
// Assignments are ALWAYS in percentage, then converted to user's chosen scale for GPA display

export const GRADE_SCALES = {
    '4.0': '4.0',
    '4.3': '4.3',
    'letter': 'letter',
    'percentage': 'percentage'
};

// Convert percentage (0-100) to GPA based on target scale
// This is the ONLY conversion function - percentage → chosen scale
export const percentageToGPA = (percentage, targetScale) => {
    if (!percentage || isNaN(percentage)) return 0;

    const numPercentage = parseFloat(percentage);

    if (targetScale === 'percentage') {
        return numPercentage;
    }

    if (targetScale === 'letter') {
        if (numPercentage >= 97) return 'A+';
        if (numPercentage >= 93) return 'A';
        if (numPercentage >= 90) return 'A-';
        if (numPercentage >= 87) return 'B+';
        if (numPercentage >= 83) return 'B';
        if (numPercentage >= 80) return 'B-';
        if (numPercentage >= 77) return 'C+';
        if (numPercentage >= 73) return 'C';
        if (numPercentage >= 70) return 'C-';
        if (numPercentage >= 67) return 'D+';
        if (numPercentage >= 63) return 'D';
        if (numPercentage >= 60) return 'D-';
        return 'F';
    }

    // For 4.0 and 4.3 scales
    const maxScale = targetScale === '4.3' ? 4.3 : 4.0;

    // Standard conversion: 90-100 = max, 80-89 = 3.0-3.9, etc.
    if (numPercentage >= 97) return maxScale; // A+
    if (numPercentage >= 93) return maxScale === 4.3 ? 4.0 : 4.0; // A
    if (numPercentage >= 90) return 3.7; // A-
    if (numPercentage >= 87) return 3.3; // B+
    if (numPercentage >= 83) return 3.0; // B
    if (numPercentage >= 80) return 2.7; // B-
    if (numPercentage >= 77) return 2.3; // C+
    if (numPercentage >= 73) return 2.0; // C
    if (numPercentage >= 70) return 1.7; // C-
    if (numPercentage >= 67) return 1.3; // D+
    if (numPercentage >= 63) return 1.0; // D
    if (numPercentage >= 60) return 0.7; // D-
    return 0.0; // F
};

// Get letter grade from percentage (for display purposes)
export const getLetterGrade = (percentage) => {
    if (!percentage || isNaN(percentage)) return 'N/A';

    const numPercentage = parseFloat(percentage);
    if (numPercentage >= 97) return 'A+';
    if (numPercentage >= 93) return 'A';
    if (numPercentage >= 90) return 'A-';
    if (numPercentage >= 87) return 'B+';
    if (numPercentage >= 83) return 'B';
    if (numPercentage >= 80) return 'B-';
    if (numPercentage >= 77) return 'C+';
    if (numPercentage >= 73) return 'C';
    if (numPercentage >= 70) return 'C-';
    if (numPercentage >= 67) return 'D+';
    if (numPercentage >= 63) return 'D';
    if (numPercentage >= 60) return 'D-';
    return 'F';
};

// Format GPA for display based on scale
export const formatGPA = (value, scale) => {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';

    if (scale === 'percentage') {
        return `${parseFloat(value).toFixed(1)}%`;
    }

    if (scale === 'letter') {
        return value; // Already a letter grade
    }

    // For 4.0 and 4.3 scales
    return parseFloat(value).toFixed(2);
};

// Get grade color based on percentage
export const getGradeColor = (percentage) => {
    if (!percentage || isNaN(percentage)) return 'bg-gray-100 text-gray-800';

    const numPercentage = parseFloat(percentage);
    if (numPercentage >= 90) return 'bg-green-100 text-green-800';
    if (numPercentage >= 80) return 'bg-blue-100 text-blue-800';
    if (numPercentage >= 70) return 'bg-yellow-100 text-yellow-800';
    if (numPercentage >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
};
