const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
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
    formatGPA,
    VALID_LETTER_GRADES
} = require('../utils/gradeConversion');

// ── isLetterGrade ───────────────────────────────────────────────────────────

describe('isLetterGrade', () => {
    it('recognizes all valid letter grades', () => {
        for (const grade of VALID_LETTER_GRADES) {
            assert.equal(isLetterGrade(grade), true, `${grade} should be valid`);
        }
    });

    it('rejects invalid strings', () => {
        assert.equal(isLetterGrade('X'), false);
        assert.equal(isLetterGrade('AB'), false);
        assert.equal(isLetterGrade('95'), false);
        assert.equal(isLetterGrade(''), false);
    });

    it('rejects non-string values', () => {
        assert.equal(isLetterGrade(95), false);
        assert.equal(isLetterGrade(null), false);
        assert.equal(isLetterGrade(undefined), false);
    });
});

// ── isExcludedGrade ─────────────────────────────────────────────────────────

describe('isExcludedGrade', () => {
    it('identifies excluded grades', () => {
        assert.equal(isExcludedGrade('W'), true);
        assert.equal(isExcludedGrade('I'), true);
        assert.equal(isExcludedGrade('P'), true);
        assert.equal(isExcludedGrade('NP'), true);
    });

    it('does not exclude regular grades', () => {
        assert.equal(isExcludedGrade('A'), false);
        assert.equal(isExcludedGrade('F'), false);
        assert.equal(isExcludedGrade('B+'), false);
    });
});

// ── clampPercentage ─────────────────────────────────────────────────────────

describe('clampPercentage', () => {
    it('clamps values to 0-100', () => {
        assert.equal(clampPercentage(150), 100);
        assert.equal(clampPercentage(-10), 0);
        assert.equal(clampPercentage(85), 85);
        assert.equal(clampPercentage(0), 0);
        assert.equal(clampPercentage(100), 100);
    });

    it('handles NaN/invalid input', () => {
        assert.equal(clampPercentage('abc'), 0);
        assert.equal(clampPercentage(NaN), 0);
        assert.equal(clampPercentage(null), 0);
    });

    it('parses string numbers', () => {
        assert.equal(clampPercentage('85'), 85);
        assert.equal(clampPercentage('150'), 100);
    });
});

// ── percentageToPoints ──────────────────────────────────────────────────────

describe('percentageToPoints', () => {
    it('converts percentages on 4.0 scale', () => {
        assert.equal(percentageToPoints(95, '4.0'), 4.0);
        assert.equal(percentageToPoints(91, '4.0'), 3.7);
        assert.equal(percentageToPoints(88, '4.0'), 3.3);
        assert.equal(percentageToPoints(85, '4.0'), 3.0);
        assert.equal(percentageToPoints(75, '4.0'), 2.0);
        assert.equal(percentageToPoints(55, '4.0'), 0.0);
    });

    it('converts percentages on 4.3 scale', () => {
        assert.equal(percentageToPoints(98, '4.3'), 4.3);
        assert.equal(percentageToPoints(95, '4.3'), 4.0);
        assert.equal(percentageToPoints(91, '4.3'), 3.7);
    });

    it('returns percentage as-is for percentage scale', () => {
        assert.equal(percentageToPoints(85, 'percentage'), 85);
    });

    it('clamps out-of-range values', () => {
        assert.equal(percentageToPoints(150, '4.0'), 4.0);  // clamped to 100
        assert.equal(percentageToPoints(-10, '4.0'), 0.0);  // clamped to 0
    });
});

// ── percentageToLetter ──────────────────────────────────────────────────────

describe('percentageToLetter', () => {
    it('converts percentages to letter grades', () => {
        assert.equal(percentageToLetter(98), 'A+');
        assert.equal(percentageToLetter(95), 'A');
        assert.equal(percentageToLetter(91), 'A-');
        assert.equal(percentageToLetter(88), 'B+');
        assert.equal(percentageToLetter(85), 'B');
        assert.equal(percentageToLetter(55), 'F');
    });
});

// ── letterToPoints ──────────────────────────────────────────────────────────

describe('letterToPoints', () => {
    it('converts letter grades on 4.0 scale', () => {
        assert.equal(letterToPoints('A+', '4.0'), 4.0);
        assert.equal(letterToPoints('A', '4.0'), 4.0);
        assert.equal(letterToPoints('A-', '4.0'), 3.7);
        assert.equal(letterToPoints('B+', '4.0'), 3.3);
        assert.equal(letterToPoints('F', '4.0'), 0.0);
    });

    it('converts letter grades on 4.3 scale', () => {
        assert.equal(letterToPoints('A+', '4.3'), 4.3);
        assert.equal(letterToPoints('A', '4.3'), 4.0);
    });

    it('returns 0 for excluded grades', () => {
        assert.equal(letterToPoints('W', '4.0'), 0);
        assert.equal(letterToPoints('I', '4.0'), 0);
        assert.equal(letterToPoints('P', '4.0'), 0);
        assert.equal(letterToPoints('NP', '4.0'), 0);
    });

    it('returns 0 for invalid grades', () => {
        assert.equal(letterToPoints('X', '4.0'), 0);
        assert.equal(letterToPoints('', '4.0'), 0);
    });
});

// ── resolveGrade (explicit inputType) ───────────────────────────────────────

describe('resolveGrade', () => {
    it('resolves letter grades explicitly', () => {
        const result = resolveGrade('A', 'letter', '4.0');
        assert.equal(result.gradePoints, 4.0);
        assert.equal(result.letter, 'A');
        assert.equal(result.percentage, 95);
    });

    it('resolves percentage grades explicitly', () => {
        const result = resolveGrade(85, 'percentage', '4.0');
        assert.equal(result.gradePoints, 3.0);
        assert.equal(result.percentage, 85);
        assert.equal(result.letter, 'B');
    });

    it('handles the ambiguous value 3.5 as percentage when told it is percentage', () => {
        const result = resolveGrade(3.5, 'percentage', '4.0');
        // 3.5% → clamped to 3.5 → F → 0.0 GPA
        assert.equal(result.gradePoints, 0.0);
        assert.equal(result.percentage, 3.5);
    });

    it('resolves excluded grades correctly', () => {
        const result = resolveGrade('W', 'letter', '4.0');
        assert.equal(result.gradePoints, 0);
        assert.equal(result.letter, 'W');
        assert.equal(result.percentage, null);
    });

    it('handles empty/null/undefined values', () => {
        assert.equal(resolveGrade('', 'letter', '4.0').gradePoints, 0);
        assert.equal(resolveGrade(null, 'letter', '4.0').gradePoints, 0);
        assert.equal(resolveGrade(undefined, 'letter', '4.0').gradePoints, 0);
    });

    it('clamps percentage to 0-100', () => {
        const result = resolveGrade(150, 'percentage', '4.0');
        assert.equal(result.percentage, 100);
        assert.equal(result.gradePoints, 4.0);
    });
});

// ── resolveGradeLegacy ──────────────────────────────────────────────────────

describe('resolveGradeLegacy', () => {
    it('detects letter grades', () => {
        const result = resolveGradeLegacy('A+', '4.0');
        assert.equal(result.gradePoints, 4.0);
    });

    it('detects numeric strings as percentages', () => {
        const result = resolveGradeLegacy('85', '4.0');
        assert.equal(result.gradePoints, 3.0);
    });

    it('handles numbers directly', () => {
        const result = resolveGradeLegacy(92, '4.0');
        assert.equal(result.gradePoints, 3.7);
    });
});

// ── calculateWeightedGPA ────────────────────────────────────────────────────

describe('calculateWeightedGPA', () => {
    it('calculates weighted average correctly', () => {
        const entries = [
            { gradePoints: 4.0, credits: 3 },  // 12.0
            { gradePoints: 3.0, credits: 4 },  // 12.0
            { gradePoints: 3.7, credits: 3 },  // 11.1
        ];
        // Total points: 35.1, Total credits: 10
        // GPA: 3.51
        assert.equal(calculateWeightedGPA(entries), 3.51);
    });

    it('returns 0 for empty array', () => {
        assert.equal(calculateWeightedGPA([]), 0);
    });

    it('skips entries with NaN gradePoints', () => {
        const entries = [
            { gradePoints: 4.0, credits: 3 },
            { gradePoints: NaN, credits: 3 },
            { gradePoints: 3.0, credits: 3 },
        ];
        // Should only use first and last: (12 + 9) / 6 = 3.5
        assert.equal(calculateWeightedGPA(entries), 3.5);
    });

    it('skips entries with null/undefined gradePoints', () => {
        const entries = [
            { gradePoints: 4.0, credits: 3 },
            { gradePoints: null, credits: 3 },
            { gradePoints: undefined, credits: 3 },
        ];
        assert.equal(calculateWeightedGPA(entries), 4.0);
    });
});

// ── formatGPA ───────────────────────────────────────────────────────────────

describe('formatGPA', () => {
    it('formats 4.0 scale', () => {
        assert.equal(formatGPA(3.75, '4.0'), '3.75');
    });

    it('formats percentage scale', () => {
        assert.equal(formatGPA(85, 'percentage'), '85.0%');
    });

    it('formats letter scale', () => {
        assert.equal(formatGPA('A', 'letter'), 'A');
    });

    it('handles N/A values', () => {
        assert.equal(formatGPA(null, '4.0'), 'N/A');
        assert.equal(formatGPA(undefined, '4.0'), 'N/A');
        assert.equal(formatGPA(NaN, '4.0'), 'N/A');
    });
});

// ── pointsToLetter ──────────────────────────────────────────────────────────

describe('pointsToLetter', () => {
    it('converts GPA points to letter grades on 4.0 scale', () => {
        assert.equal(pointsToLetter(4.0, '4.0'), 'A');
        assert.equal(pointsToLetter(3.7, '4.0'), 'A-');
        assert.equal(pointsToLetter(3.3, '4.0'), 'B+');
        assert.equal(pointsToLetter(3.0, '4.0'), 'B');
        assert.equal(pointsToLetter(0.0, '4.0'), 'F');
    });

    it('handles NaN/invalid', () => {
        assert.equal(pointsToLetter(NaN, '4.0'), 'N/A');
        assert.equal(pointsToLetter('abc', '4.0'), 'N/A');
    });
});
