// Grade Scale Conversion Utility
export const GRADE_SCALES = {
    '4.0': '4.0',
    '4.3': '4.3',
    'percentage': 'percentage'
};

// Letter grade to GPA mappings
const LETTER_TO_4_0 = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
};

const LETTER_TO_4_3 = {
    'A+': 4.3, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
};

const LETTER_TO_PERCENTAGE = {
    'A+': 97, 'A': 93, 'A-': 90,
    'B+': 87, 'B': 83, 'B-': 80,
    'C+': 77, 'C': 73, 'C-': 70,
    'D+': 67, 'D': 63, 'F': 0
};

// Convert GPA to different scales
export const convertGPA = (gpa, fromScale, toScale) => {
    if (fromScale === toScale) return gpa;

    // First convert to 4.0 scale as intermediate
    let gpa4_0 = gpa;
    if (fromScale === '4.3') {
        gpa4_0 = (gpa / 4.3) * 4.0;
    } else if (fromScale === 'percentage') {
        gpa4_0 = (gpa / 100) * 4.0;
    }

    // Then convert to target scale
    if (toScale === '4.3') {
        return (gpa4_0 / 4.0) * 4.3;
    } else if (toScale === 'percentage') {
        return (gpa4_0 / 4.0) * 100;
    }

    return gpa4_0; // 4.0 scale
};

// Convert letter grade to different scales
export const convertLetterGrade = (letterGrade, toScale) => {
    if (toScale === '4.0') {
        return LETTER_TO_4_0[letterGrade] || 0;
    } else if (toScale === '4.3') {
        return LETTER_TO_4_3[letterGrade] || 0;
    } else if (toScale === 'percentage') {
        return LETTER_TO_PERCENTAGE[letterGrade] || 0;
    }
    return 0;
};

// Get letter grade from GPA
export const getLetterGrade = (gpa, scale = '4.0') => {
    if (scale === 'percentage') {
        if (gpa >= 97) return 'A+';
        if (gpa >= 93) return 'A';
        if (gpa >= 90) return 'A-';
        if (gpa >= 87) return 'B+';
        if (gpa >= 83) return 'B';
        if (gpa >= 80) return 'B-';
        if (gpa >= 77) return 'C+';
        if (gpa >= 73) return 'C';
        if (gpa >= 70) return 'C-';
        if (gpa >= 67) return 'D+';
        if (gpa >= 63) return 'D';
        return 'F';
    } else {
        const gpa4_0 = scale === '4.3' ? (gpa / 4.3) * 4.0 : gpa;
        if (gpa4_0 >= 3.7) return 'A';
        if (gpa4_0 >= 3.3) return 'B+';
        if (gpa4_0 >= 3.0) return 'B';
        if (gpa4_0 >= 2.7) return 'B-';
        if (gpa4_0 >= 2.3) return 'C+';
        if (gpa4_0 >= 2.0) return 'C';
        if (gpa4_0 >= 1.7) return 'C-';
        if (gpa4_0 >= 1.3) return 'D+';
        if (gpa4_0 >= 1.0) return 'D';
        return 'F';
    }
};

// Format GPA for display based on scale
export const formatGPA = (gpa, scale) => {
    if (scale === 'percentage') {
        return `${gpa.toFixed(1)}%`;
    }
    return gpa.toFixed(2);
};

// Get grade color based on scale
export const getGradeColor = (grade, scale) => {
    if (scale === 'percentage') {
        if (grade >= 90) return 'bg-green-100 text-green-800';
        if (grade >= 80) return 'bg-blue-100 text-blue-800';
        if (grade >= 70) return 'bg-yellow-100 text-yellow-800';
        if (grade >= 60) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    } else {
        const letterGrade = getLetterGrade(grade, scale);
        if (letterGrade.includes('A')) return 'bg-green-100 text-green-800';
        if (letterGrade.includes('B')) return 'bg-blue-100 text-blue-800';
        if (letterGrade.includes('C')) return 'bg-yellow-100 text-yellow-800';
        if (letterGrade.includes('D')) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    }
};
