const mongoose = require('mongoose');
const {
    resolveGrade,
    resolveGradeLegacy,
    isExcludedGrade,
    isLetterGrade,
    percentageToPoints,
    percentageToLetter,
    letterToPercentage,
    letterToPoints,
    pointsToLetter,
    clampPercentage
} = require('../utils/gradeConversion');

// Assignment schema for all courses
const assignmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    type: {
        type: String,
        enum: ['Assignment', 'Quiz', 'Exam', 'Project', 'Participation', 'Other'],
        default: 'Assignment'
    },
    weight: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },
    grade: {
        type: mongoose.Schema.Types.Mixed, // Can be string (A+) or number (95)
        required: true
    },
    maxGrade: {
        type: Number,
        default: 100,
        min: 1
    },
    dueDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Course schema
const courseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    code: {
        type: String,
        trim: true,
        maxlength: 20
    },
    credits: {
        type: Number,
        required: true,
        min: 0.5,
        max: 10
    },
    courseType: {
        type: String,
        enum: ['simple', 'detailed'],
        default: 'simple'
    },
    // For simple courses - grade is optional
    grade: {
        type: mongoose.Schema.Types.Mixed // Can be string (A+) or number (95)
    },
    // NEW: Explicit input type — removes ambiguity
    gradeInputType: {
        type: String,
        enum: ['letter', 'percentage'],
        default: 'letter'
    },
    // Assignments for detailed courses
    assignments: [assignmentSchema],
    // User can override calculated grade
    gradeOverride: {
        type: mongoose.Schema.Types.Mixed
    },
    gradeOverridePoints: {
        type: Number
    },
    // Calculated grades (from assignments)
    calculatedGrade: {
        type: Number
    },
    calculatedGradePoints: {
        type: Number
    },
    calculatedGradeLetter: {
        type: String
    },
    // Final resolved values
    finalGrade: {
        type: String
    },
    gradePoints: {
        type: Number
    },
    semester: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
    },
    year: {
        type: Number,
        required: true,
        min: 2000,
        max: 2030
    },
    category: {
        type: String,
        trim: true,
        default: 'General',
        maxlength: 50
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    gpaScale: {
        type: String,
        enum: ['4.0', '4.3', 'percentage'],
        default: '4.0'
    },
    studyHours: {
        type: Number,
        min: 0,
        default: 0
    },
    difficultyRating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    personalNotes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    targetGrade: {
        type: String
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes
courseSchema.index({ user: 1, semester: 1, year: 1 });
courseSchema.index({ user: 1, category: 1 });

// ── Calculate final grade from weighted assignments ─────────────────────────

courseSchema.methods.calculateFinalGrade = function () {
    if (!this.assignments || this.assignments.length === 0) {
        return;
    }

    let totalWeightedGrade = 0;
    let totalWeight = 0;

    for (const assignment of this.assignments) {
        let gradeValue;

        if (typeof assignment.grade === 'number') {
            gradeValue = clampPercentage(assignment.grade);
        } else if (typeof assignment.grade === 'string') {
            if (isLetterGrade(assignment.grade)) {
                gradeValue = letterToPercentage(assignment.grade);
            } else {
                const parsed = parseFloat(assignment.grade);
                gradeValue = isNaN(parsed) ? 0 : clampPercentage(parsed);
            }
        } else {
            gradeValue = 0;
        }

        // Normalize by maxGrade (e.g., scored 45 out of 50 → 90%)
        const maxGrade = assignment.maxGrade > 0 ? assignment.maxGrade : 100;
        const normalizedGrade = (gradeValue / maxGrade) * 100;

        const weight = assignment.weight || 0;
        totalWeightedGrade += normalizedGrade * weight;
        totalWeight += weight;
    }

    if (totalWeight > 0) {
        const finalPercentage = totalWeightedGrade / totalWeight;
        this.calculatedGrade = Math.round(finalPercentage * 10) / 10;
        this.calculatedGradePoints = percentageToPoints(finalPercentage, this.gpaScale);
        this.calculatedGradeLetter = percentageToLetter(finalPercentage);
    }
};

// ── Pre-save middleware ─────────────────────────────────────────────────────

courseSchema.pre('save', function (next) {
    // Calculate from assignments if they exist
    if (this.assignments && this.assignments.length > 0) {
        this.calculateFinalGrade();
    }

    // For simple courses, resolve grade using explicit inputType
    if (this.courseType === 'simple' && this.grade !== undefined && this.grade !== null && this.grade !== '') {
        let resolved;

        if (this.gradeInputType) {
            // New explicit path — no guessing
            resolved = resolveGrade(this.grade, this.gradeInputType, this.gpaScale);
        } else {
            // Legacy fallback for old data without gradeInputType
            resolved = resolveGradeLegacy(this.grade, this.gpaScale);
        }

        this.gradePoints = resolved.gradePoints;
    } else if (this.courseType === 'simple' && (this.grade === undefined || this.grade === null || this.grade === '')) {
        this.gradePoints = 0;
    }

    // Resolve grade override if present
    if (this.gradeOverride !== undefined && this.gradeOverride !== null && this.gradeOverride !== '') {
        const overrideResolved = resolveGradeLegacy(this.gradeOverride, this.gpaScale);
        this.gradeOverridePoints = overrideResolved.gradePoints;
    }

    next();
});

// ── Get the final grade (override > calculated > simple) ────────────────────

courseSchema.methods.getFinalGrade = function () {
    if (this.gradeOverride !== undefined && this.gradeOverride !== null) {
        return {
            grade: this.gradeOverride,
            gradePoints: typeof this.gradeOverridePoints === 'number' && !isNaN(this.gradeOverridePoints)
                ? this.gradeOverridePoints : 0,
            isOverridden: true
        };
    }

    if (this.calculatedGrade !== undefined && this.calculatedGrade !== null) {
        const displayGrade = this.calculatedGradeLetter || String(this.calculatedGrade);
        return {
            grade: displayGrade,
            gradePoints: typeof this.calculatedGradePoints === 'number' && !isNaN(this.calculatedGradePoints)
                ? this.calculatedGradePoints : 0,
            isOverridden: false
        };
    }

    if (this.grade !== undefined && this.grade !== null && this.grade !== '') {
        return {
            grade: this.grade,
            gradePoints: typeof this.gradePoints === 'number' && !isNaN(this.gradePoints)
                ? this.gradePoints : 0,
            isOverridden: false
        };
    }

    return {
        grade: 'N/A',
        gradePoints: 0,
        isOverridden: false
    };
};

/**
 * Check if this course should be included in GPA calculations.
 * Excludes: incomplete courses, withdrawn, incomplete status, pass/no-pass.
 */
courseSchema.methods.shouldIncludeInGPA = function () {
    if (!this.isCompleted) return false;

    const finalGrade = this.getFinalGrade();
    if (isExcludedGrade(finalGrade.grade)) return false;
    if (finalGrade.grade === 'N/A') return false;

    return true;
};

module.exports = mongoose.model('Course', courseSchema);
