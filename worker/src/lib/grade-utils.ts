// Grade calculation utilities ported from server/models/Course.js
// All functions are pure - no side effects.

type GpaScale = '4.0' | '4.3' | 'percentage';

// --------------- percentage -> grade points ---------------

export function percentageToGradePoints(percentage: number, scale: GpaScale = '4.0'): number {
  if (scale === 'percentage') return percentage;

  if (scale === '4.3') {
    if (percentage >= 97) return 4.3;
    if (percentage >= 93) return 4.0;
    if (percentage >= 90) return 3.7;
    if (percentage >= 87) return 3.3;
    if (percentage >= 83) return 3.0;
    if (percentage >= 80) return 2.7;
    if (percentage >= 77) return 2.3;
    if (percentage >= 73) return 2.0;
    if (percentage >= 70) return 1.7;
    if (percentage >= 67) return 1.3;
    if (percentage >= 63) return 1.0;
    if (percentage >= 60) return 0.7;
    return 0.0;
  }

  // default 4.0
  if (percentage >= 93) return 4.0;
  if (percentage >= 90) return 3.7;
  if (percentage >= 87) return 3.3;
  if (percentage >= 83) return 3.0;
  if (percentage >= 80) return 2.7;
  if (percentage >= 77) return 2.3;
  if (percentage >= 73) return 2.0;
  if (percentage >= 70) return 1.7;
  if (percentage >= 67) return 1.3;
  if (percentage >= 63) return 1.0;
  if (percentage >= 60) return 0.7;
  return 0.0;
}

// --------------- letter -> grade points ---------------

const LETTER_TO_43: Record<string, number> = {
  'A+': 4.3, A: 4.0, 'A-': 3.7,
  'B+': 3.3, B: 3.0, 'B-': 2.7,
  'C+': 2.3, C: 2.0, 'C-': 1.7,
  'D+': 1.3, D: 1.0, 'D-': 0.7,
  F: 0.0, P: 0.0, NP: 0.0, W: 0.0, I: 0.0,
};

const LETTER_TO_40: Record<string, number> = {
  'A+': 4.0, A: 4.0, 'A-': 3.7,
  'B+': 3.3, B: 3.0, 'B-': 2.7,
  'C+': 2.3, C: 2.0, 'C-': 1.7,
  'D+': 1.3, D: 1.0, 'D-': 0.7,
  F: 0.0, P: 0.0, NP: 0.0, W: 0.0, I: 0.0,
};

const LETTER_TO_PERCENTAGE: Record<string, number> = {
  'A+': 97, A: 93, 'A-': 90,
  'B+': 87, B: 83, 'B-': 80,
  'C+': 77, C: 73, 'C-': 70,
  'D+': 67, D: 63, 'D-': 60,
  F: 50, P: 70, NP: 0, W: 0, I: 0,
};

export function letterToGradePoints(letter: string, scale: GpaScale = '4.0'): number {
  if (scale === '4.3') return LETTER_TO_43[letter] ?? 0.0;
  if (scale === 'percentage') return LETTER_TO_PERCENTAGE[letter] ?? 0;
  return LETTER_TO_40[letter] ?? 0.0;
}

// --------------- letter -> percentage (for assignment calc) ---------------

export function letterToPercentage(letter: string): number {
  const map: Record<string, number> = {
    'A+': 97, A: 93, 'A-': 90,
    'B+': 87, B: 83, 'B-': 80,
    'C+': 77, C: 73, 'C-': 70,
    'D+': 67, D: 63, 'D-': 60,
    F: 0,
  };
  return map[letter] ?? 0;
}

// --------------- points -> letter grade ---------------

export function pointsToLetterGrade(points: number, scale: GpaScale = '4.0'): string {
  if (scale === '4.3') {
    if (points >= 4.0) return 'A+';
    if (points >= 3.7) return 'A';
    if (points >= 3.3) return 'A-';
    if (points >= 3.0) return 'B+';
    if (points >= 2.7) return 'B';
    if (points >= 2.3) return 'B-';
    if (points >= 2.0) return 'C+';
    if (points >= 1.7) return 'C';
    if (points >= 1.3) return 'C-';
    if (points >= 1.0) return 'D+';
    if (points >= 0.7) return 'D';
    if (points >= 0.3) return 'D-';
    return 'F';
  }
  if (scale === 'percentage') {
    if (points >= 93) return 'A';
    if (points >= 90) return 'A-';
    if (points >= 87) return 'B+';
    if (points >= 83) return 'B';
    if (points >= 80) return 'B-';
    if (points >= 77) return 'C+';
    if (points >= 73) return 'C';
    if (points >= 70) return 'C-';
    if (points >= 67) return 'D+';
    if (points >= 63) return 'D';
    if (points >= 60) return 'D-';
    return 'F';
  }
  // 4.0
  if (points >= 3.7) return 'A';
  if (points >= 3.3) return 'B+';
  if (points >= 3.0) return 'B';
  if (points >= 2.7) return 'B-';
  if (points >= 2.3) return 'C+';
  if (points >= 2.0) return 'C';
  if (points >= 1.7) return 'C-';
  if (points >= 1.3) return 'D+';
  if (points >= 1.0) return 'D';
  if (points >= 0.7) return 'D-';
  return 'F';
}

// --------------- resolve grade -> grade points ---------------
// Handles the Mixed grade field (string letter OR number percentage/gpa-points)

export function resolveGradePoints(
  grade: string | number | null | undefined,
  scale: GpaScale = '4.0'
): number {
  if (grade === null || grade === undefined) return 0.0;

  if (typeof grade === 'number') {
    // Check if this is already GPA points (not percentage)
    if (scale === '4.3' && grade <= 4.3 && grade > 0) return grade;
    if (scale === '4.0' && grade <= 4.0 && grade > 0) return grade;
    // Treat as percentage
    return percentageToGradePoints(grade, scale);
  }

  // String grade
  const numGrade = parseFloat(grade);
  if (!isNaN(numGrade)) {
    if (scale === '4.3' && numGrade <= 4.3 && numGrade > 0) return numGrade;
    if (scale === '4.0' && numGrade <= 4.0 && numGrade > 0) return numGrade;
    if (numGrade <= 100 && numGrade > 0) return percentageToGradePoints(numGrade, scale);
    return letterToGradePoints(grade, scale);
  }

  return letterToGradePoints(grade, scale);
}

// --------------- resolve assignment grade to number for weighted calc ---------------

function assignmentGradeToNumber(gradeLetter: string | null, gradeNumeric: number | null): number {
  if (gradeNumeric !== null && gradeNumeric !== undefined) return gradeNumeric;
  if (gradeLetter !== null && gradeLetter !== undefined) {
    // Check if it's a numeric string first
    const parsed = parseFloat(gradeLetter);
    if (!isNaN(parsed)) return parsed;
    // Letter grade → approximate percentage
    if (/^[A-Z][+-]?$/.test(gradeLetter)) return letterToPercentage(gradeLetter);
    return 0;
  }
  return 0;
}

// --------------- calculate course grade from assignments ---------------

export interface AssignmentGradeInput {
  grade_letter: string | null;
  grade_numeric: number | null;
  weight: number;
}

export interface CalculatedGrade {
  calculatedGrade: string;        // rounded percentage as string
  calculatedGradePoints: number;
}

export function calculateCourseGradeFromAssignments(
  assignments: AssignmentGradeInput[],
  scale: GpaScale = '4.0'
): CalculatedGrade | null {
  if (assignments.length === 0) return null;

  let totalWeightedGrade = 0;
  let totalWeight = 0;

  for (const a of assignments) {
    const gradeValue = assignmentGradeToNumber(a.grade_letter, a.grade_numeric);
    const weight = a.weight || 0;
    totalWeightedGrade += gradeValue * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) return null;

  const finalPercentage = totalWeightedGrade / totalWeight;
  const rounded = Math.round(finalPercentage * 10) / 10;
  const gradePoints = percentageToGradePoints(finalPercentage, scale);

  return {
    calculatedGrade: String(rounded),
    calculatedGradePoints: gradePoints,
  };
}

// --------------- GPA across courses ---------------

export interface CourseGradeInput {
  credits: number;
  gradePoints: number;
  isCompleted: boolean;
  gradeLetter?: string | null;
  gradeOverride?: string | number | null;
}

export function calculateGPA(courses: CourseGradeInput[]): number {
  let totalPoints = 0;
  let totalCredits = 0;

  for (const c of courses) {
    if (!c.isCompleted) continue;
    // Skip W and I grades
    if (c.gradeLetter === 'W' || c.gradeLetter === 'I') continue;
    if (c.gradeOverride === 'W' || c.gradeOverride === 'I') continue;

    totalPoints += c.gradePoints * c.credits;
    totalCredits += c.credits;
  }

  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
}
