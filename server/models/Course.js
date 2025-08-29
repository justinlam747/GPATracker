const mongoose = require('mongoose');

// Assignment schema for all courses
const assignmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
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
        default: 100
    },
    dueDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Calculate grade points from assignment grades
assignmentSchema.methods.calculateGradePoints = function (gpaScale = '4.0') {
    if (typeof this.grade === 'number') {
        // Percentage grade - convert to specified scale
        if (gpaScale === 'percentage') {
            return this.grade; // Return percentage as-is
        } else if (gpaScale === '4.3') {
            // Convert percentage to 4.3 scale
            if (this.grade >= 97) return 4.3;
            if (this.grade >= 93) return 4.0;
            if (this.grade >= 90) return 3.7;
            if (this.grade >= 87) return 3.3;
            if (this.grade >= 83) return 3.0;
            if (this.grade >= 80) return 2.7;
            if (this.grade >= 77) return 2.3;
            if (this.grade >= 73) return 2.0;
            if (this.grade >= 70) return 1.7;
            if (this.grade >= 67) return 1.3;
            if (this.grade >= 63) return 1.0;
            if (this.grade >= 60) return 0.7;
            return 0.0;
        } else {
            // Default 4.0 scale
            if (this.grade >= 93) return 4.0;
            if (this.grade >= 90) return 3.7;
            if (this.grade >= 87) return 3.3;
            if (this.grade >= 83) return 3.0;
            if (this.grade >= 80) return 2.7;
            if (this.grade >= 77) return 2.3;
            if (this.grade >= 73) return 2.0;
            if (this.grade >= 70) return 1.7;
            if (this.grade >= 67) return 1.3;
            if (this.grade >= 63) return 1.0;
            if (this.grade >= 60) return 0.7;
            return 0.0;
        }
    } else {
        // Letter grade - convert to specified scale
        if (gpaScale === '4.3') {
            const gradeMap = {
                'A+': 4.3, 'A': 4.0, 'A-': 3.7,
                'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                'D+': 1.3, 'D': 1.0, 'D-': 0.7,
                'F': 0.0, 'P': 0.0, 'NP': 0.0, 'W': 0.0, 'I': 0.0
            };
            return gradeMap[this.grade] || 0.0;
        } else if (gpaScale === 'percentage') {
            // Convert letter grade to percentage (approximate)
            const percentageMap = {
                'A+': 97, 'A': 93, 'A-': 90,
                'B+': 87, 'B': 83, 'B-': 80,
                'C+': 77, 'C': 73, 'C-': 70,
                'D+': 67, 'D': 63, 'D-': 60,
                'F': 50, 'P': 70, 'NP': 0, 'W': 0, 'I': 0
            };
            return percentageMap[this.grade] || 0;
        } else {
            // Default 4.0 scale
            const gradeMap = {
                'A+': 4.0, 'A': 4.0, 'A-': 3.7,
                'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                'D+': 1.3, 'D': 1.0, 'D-': 0.7,
                'F': 0.0, 'P': 0.0, 'NP': 0.0, 'W': 0.0, 'I': 0.0
            };
            return gradeMap[this.grade] || 0.0;
        }
    }
};

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
        trim: true
    },
    code: {
        type: String,
        trim: true
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
    // For simple courses - grade is now optional
    grade: {
        type: mongoose.Schema.Types.Mixed, // Can be string (A+) or number (95)
        required: false
    },
    // Assignments for any course
    assignments: [assignmentSchema],
    // User can override calculated grade
    gradeOverride: {
        type: mongoose.Schema.Types.Mixed
    },
    gradeOverridePoints: {
        type: Number
    },
    // Calculated grades
    calculatedGrade: {
        type: String
    },
    calculatedGradePoints: {
        type: Number
    },
    // Final grade (either calculated or overridden)
    finalGrade: {
        type: String
    },
    gradePoints: {
        type: Number
    },
    semester: {
        type: String,
        required: true,
        trim: true
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
        default: 'General'
    },
    notes: {
        type: String,
        trim: true
    },
    gpaScale: {
        type: String,
        enum: ['4.0', '4.3', 'percentage'],
        default: '4.0'
    },
    // New fields for enhanced dashboard features
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

// Index for efficient queries
courseSchema.index({ user: 1, semester: 1, year: 1 });
courseSchema.index({ user: 1, category: 1 });

// Calculate final grade from assignments for any course
courseSchema.methods.calculateFinalGrade = function () {
    if (this.assignments.length === 0) {
        return;
    }

    let totalWeightedGrade = 0;
    let totalWeight = 0;

    this.assignments.forEach(assignment => {
        // Handle both percentage and letter grades
        let gradeValue;
        if (typeof assignment.grade === 'number') {
            // If grade is already a number (percentage), use it directly
            gradeValue = assignment.grade;
        } else if (typeof assignment.grade === 'string') {
            // If grade is a letter, convert to percentage first
            if (assignment.grade.match(/^[A-Z][+-]?$/)) {
                // Letter grade - convert to percentage
                gradeValue = this.letterGradeToPercentage(assignment.grade);
            } else {
                // Try to parse as number
                gradeValue = parseFloat(assignment.grade) || 0;
            }
        } else {
            gradeValue = 0;
        }

        const weight = assignment.weight || 0;
        totalWeightedGrade += gradeValue * weight;
        totalWeight += weight;
    });

    if (totalWeight > 0) {
        const finalPercentage = totalWeightedGrade / totalWeight;
        this.calculatedGrade = Math.round(finalPercentage * 10) / 10; // Round to 1 decimal
        this.calculatedGradePoints = this.calculateGradePointsFromPercentage(finalPercentage, this.gpaScale);

        // Also set a letter grade version for display purposes
        this.calculatedGradeLetter = this.pointsToLetterGrade(this.calculatedGradePoints, this.gpaScale);
    }
};

// Pre-save middleware to calculate grades
courseSchema.pre('save', function (next) {
    // Always calculate final grade from assignments if they exist
    if (this.assignments.length > 0) {
        this.calculateFinalGrade();
    }

    // For simple courses, calculate grade points if grade is provided
    if (this.courseType === 'simple' && this.grade !== undefined) {
        // Calculate grade points for simple courses based on the course's GPA scale
        if (typeof this.grade === 'number') {
            // Check if this is actually GPA points (not percentage)
            if (this.gpaScale === '4.3' && this.grade <= 4.3 && this.grade > 0) {
                // This is likely GPA points on 4.3 scale
                this.gradePoints = this.grade;
            } else if (this.gpaScale === '4.0' && this.grade <= 4.0 && this.grade > 0) {
                // This is likely GPA points on 4.0 scale
                this.gradePoints = this.grade;
            } else {
                // This is a percentage grade - convert to the course's scale
                this.gradePoints = this.calculateGradePointsFromPercentage(this.grade, this.gpaScale);
            }
        } else if (typeof this.grade === 'string') {
            // Check if this is a numeric string that could be GPA points
            const numGrade = parseFloat(this.grade);
            if (!isNaN(numGrade)) {
                if (this.gpaScale === '4.3' && numGrade <= 4.3 && numGrade > 0) {
                    // This is likely GPA points on 4.3 scale
                    this.gradePoints = numGrade;
                } else if (this.gpaScale === '4.0' && numGrade <= 4.0 && numGrade > 0) {
                    // This is likely GPA points on 4.0 scale
                    this.gradePoints = numGrade;
                } else if (numGrade <= 100 && numGrade > 0) {
                    // This is a percentage grade - convert to the course's scale
                    this.gradePoints = this.calculateGradePointsFromPercentage(numGrade, this.gpaScale);
                } else {
                    // Letter grade - convert to the course's scale
                    this.gradePoints = this.calculateGradePointsFromLetter(this.grade, this.gpaScale);
                }
            } else {
                // Letter grade - convert to the course's scale
                this.gradePoints = this.calculateGradePointsFromLetter(this.grade, this.gpaScale);
            }
        } else {
            // Letter grade - convert to the course's scale
            this.gradePoints = this.calculateGradePointsFromLetter(this.grade, this.gpaScale);
        }
    } else if (this.courseType === 'simple' && this.grade === undefined) {
        // Course without grade - set default values
        this.gradePoints = 0.0;
    }
    next();
});

// Helper method to calculate grade points from percentage based on scale
courseSchema.methods.calculateGradePointsFromPercentage = function (percentage, scale = '4.0') {
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
    } else if (scale === 'percentage') {
        return percentage; // Return percentage as-is
    } else {
        // Default 4.0 scale
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
};

// Helper method to convert letter grade to percentage
courseSchema.methods.letterGradeToPercentage = function (letterGrade) {
    const gradeMap = {
        'A+': 97, 'A': 93, 'A-': 90,
        'B+': 87, 'B': 83, 'B-': 80,
        'C+': 77, 'C': 73, 'C-': 70,
        'D+': 67, 'D': 63, 'D-': 60,
        'F': 0
    };
    return gradeMap[letterGrade] || 0;
};

// Helper method to calculate grade points from letter grade based on scale
courseSchema.methods.calculateGradePointsFromLetter = function (letter, scale = '4.0') {
    if (scale === '4.3') {
        const gradeMap = {
            'A+': 4.3, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'D-': 0.7,
            'F': 0.0, 'P': 0.0, 'NP': 0.0, 'W': 0.0, 'I': 0.0
        };
        return gradeMap[letter] || 0.0;
    } else if (scale === 'percentage') {
        const percentageMap = {
            'A+': 97, 'A': 93, 'A-': 90,
            'B+': 87, 'B': 83, 'B-': 80,
            'C+': 77, 'C': 73, 'C-': 70,
            'D+': 67, 'D': 63, 'D-': 60,
            'F': 50, 'P': 70, 'NP': 0, 'W': 0, 'I': 0
        };
        return percentageMap[letter] || 0;
    } else {
        // Default 4.0 scale
        const gradeMap = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0, 'D-': 0.7,
            'F': 0.0, 'P': 0.0, 'NP': 0.0, 'W': 0.0, 'I': 0.0
        };
        return gradeMap[letter] || 0.0;
    }
};

// Helper method to convert grade points to letter grade based on scale
courseSchema.methods.pointsToLetterGrade = function (points, scale = '4.0') {
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
    } else if (scale === 'percentage') {
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
    } else {
        // Default 4.0 scale
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
};

// Get the final grade (either overridden or calculated)
courseSchema.methods.getFinalGrade = function () {
    if (this.gradeOverride !== undefined) {
        return {
            grade: this.gradeOverride,
            gradePoints: this.gradeOverridePoints,
            isOverridden: true
        };
    } else if (this.calculatedGrade !== undefined) {
        // Prefer letter grade for display if available
        const displayGrade = this.calculatedGradeLetter || this.calculatedGrade;
        return {
            grade: displayGrade,
            gradePoints: this.calculatedGradePoints,
            isOverridden: false
        };
    } else if (this.grade !== undefined) {
        return {
            grade: this.grade,
            gradePoints: this.gradePoints,
            isOverridden: false
        };
    } else if (this.assignments && this.assignments.length > 0) {
        // Course has assignments but no calculated grade yet
        return {
            grade: 'N/A',
            gradePoints: 0.0,
            isOverridden: false
        };
    } else {
        // Course has no grade and no assignments
        return {
            grade: 'N/A',
            gradePoints: 0.0,
            isOverridden: false
        };
    }
};

module.exports = mongoose.model('Course', courseSchema);
