const { query, getClient } = require('../db/pool');
const {
    resolveGrade,
    resolveGradeLegacy,
    isExcludedGrade,
    isLetterGrade,
    percentageToPoints,
    percentageToLetter,
    letterToPercentage,
    clampPercentage,
    calculateWeightedGPA
} = require('../utils/gradeConversion');

// ── Row → course object ─────────────────────────────────────────────────────

function rowToCourse(row, assignments = []) {
    if (!row) return null;
    const course = {
        _id: row.id,
        id: row.id,
        user: row.user_id,
        name: row.name,
        code: row.code,
        credits: parseFloat(row.credits),
        courseType: row.course_type,
        grade: row.grade,
        gradeInputType: row.grade_input_type,
        gradeOverride: row.grade_override,
        gradeOverridePoints: row.grade_override_points != null ? parseFloat(row.grade_override_points) : null,
        calculatedGrade: row.calculated_grade != null ? parseFloat(row.calculated_grade) : null,
        calculatedGradePoints: row.calculated_grade_points != null ? parseFloat(row.calculated_grade_points) : null,
        calculatedGradeLetter: row.calculated_grade_letter,
        finalGrade: row.final_grade,
        gradePoints: row.grade_points != null ? parseFloat(row.grade_points) : null,
        semester: row.semester,
        year: row.year,
        category: row.category,
        notes: row.notes,
        gpaScale: row.gpa_scale,
        studyHours: row.study_hours != null ? parseFloat(row.study_hours) : 0,
        difficultyRating: row.difficulty_rating,
        personalNotes: row.personal_notes,
        targetGrade: row.target_grade,
        isCompleted: row.is_completed,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        assignments: assignments.map(rowToAssignment)
    };
    return course;
}

function rowToAssignment(row) {
    if (!row) return null;
    return {
        _id: row.id,
        id: row.id,
        name: row.name,
        type: row.type,
        weight: parseFloat(row.weight),
        grade: row.grade,
        maxGrade: row.max_grade != null ? parseFloat(row.max_grade) : 100,
        dueDate: row.due_date,
        notes: row.notes,
        isCompleted: row.is_completed,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

// ── Grade calculation helpers (ported from Mongoose pre-save) ────────────────

function calculateFinalGradeFromAssignments(assignments, gpaScale) {
    if (!assignments || assignments.length === 0) return {};

    let totalWeightedGrade = 0;
    let totalWeight = 0;

    for (const assignment of assignments) {
        let gradeValue;
        const gradeStr = String(assignment.grade);

        if (!isNaN(parseFloat(gradeStr))) {
            gradeValue = clampPercentage(parseFloat(gradeStr));
        } else if (isLetterGrade(gradeStr)) {
            gradeValue = letterToPercentage(gradeStr);
        } else {
            gradeValue = 0;
        }

        const maxGrade = (assignment.maxGrade || assignment.max_grade || 100);
        const normalizedGrade = (gradeValue / (maxGrade > 0 ? maxGrade : 100)) * 100;
        const weight = parseFloat(assignment.weight) || 0;
        totalWeightedGrade += normalizedGrade * weight;
        totalWeight += weight;
    }

    if (totalWeight > 0) {
        const finalPercentage = totalWeightedGrade / totalWeight;
        return {
            calculatedGrade: Math.round(finalPercentage * 10) / 10,
            calculatedGradePoints: percentageToPoints(finalPercentage, gpaScale),
            calculatedGradeLetter: percentageToLetter(finalPercentage)
        };
    }
    return {};
}

function resolveCourseFinalGrade(course) {
    if (course.gradeOverride != null && course.gradeOverride !== '') {
        return {
            grade: course.gradeOverride,
            gradePoints: typeof course.gradeOverridePoints === 'number' && !isNaN(course.gradeOverridePoints)
                ? course.gradeOverridePoints : 0,
            isOverridden: true
        };
    }

    if (course.calculatedGrade != null) {
        const displayGrade = course.calculatedGradeLetter || String(course.calculatedGrade);
        return {
            grade: displayGrade,
            gradePoints: typeof course.calculatedGradePoints === 'number' && !isNaN(course.calculatedGradePoints)
                ? course.calculatedGradePoints : 0,
            isOverridden: false
        };
    }

    if (course.grade != null && course.grade !== '') {
        return {
            grade: course.grade,
            gradePoints: typeof course.gradePoints === 'number' && !isNaN(course.gradePoints)
                ? course.gradePoints : 0,
            isOverridden: false
        };
    }

    return { grade: 'N/A', gradePoints: 0, isOverridden: false };
}

function shouldIncludeInGPA(course) {
    if (!course.isCompleted) return false;
    const finalGrade = resolveCourseFinalGrade(course);
    if (isExcludedGrade(finalGrade.grade)) return false;
    if (finalGrade.grade === 'N/A') return false;
    return true;
}

// Attach methods to course objects for backward compatibility
function attachMethods(course) {
    course.getFinalGrade = () => resolveCourseFinalGrade(course);
    course.shouldIncludeInGPA = () => shouldIncludeInGPA(course);
    return course;
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

async function getAssignmentsForCourse(courseId) {
    const { rows } = await query(
        'SELECT * FROM assignments WHERE course_id = $1 ORDER BY created_at ASC',
        [courseId]
    );
    return rows;
}

async function findById(id, userId) {
    const { rows } = await query('SELECT * FROM courses WHERE id = $1 AND user_id = $2', [id, userId]);
    if (rows.length === 0) return null;
    const assignments = await getAssignmentsForCourse(id);
    return attachMethods(rowToCourse(rows[0], assignments));
}

async function findByUser(userId, filters = {}) {
    let sql = 'SELECT * FROM courses WHERE user_id = $1';
    const params = [userId];
    let i = 2;

    if (filters.semester) {
        sql += ` AND semester = $${i++}`;
        params.push(filters.semester);
    }
    if (filters.year) {
        sql += ` AND year = $${i++}`;
        params.push(parseInt(filters.year));
    }
    if (filters.category) {
        sql += ` AND category = $${i++}`;
        params.push(filters.category);
    }

    sql += ' ORDER BY year DESC, semester ASC, name ASC';

    const { rows } = await query(sql, params);

    // Load assignments for all courses
    const courses = [];
    for (const row of rows) {
        const assignments = await getAssignmentsForCourse(row.id);
        courses.push(attachMethods(rowToCourse(row, assignments)));
    }
    return courses;
}

async function createCourse(courseData) {
    const {
        userId, name, code, credits, courseType = 'simple',
        grade, gradeInputType, gradeOverride, gradeOverridePoints,
        semester, year, category = 'General', notes,
        gpaScale = '4.0', isCompleted = false,
        gradePoints, calculatedGrade, calculatedGradePoints, calculatedGradeLetter
    } = courseData;

    const { rows } = await query(`
        INSERT INTO courses (
            user_id, name, code, credits, course_type,
            grade, grade_input_type, grade_override, grade_override_points,
            calculated_grade, calculated_grade_points, calculated_grade_letter,
            grade_points, semester, year, category, notes,
            gpa_scale, is_completed
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        RETURNING *
    `, [
        userId, name, code || null, credits, courseType,
        grade || null, gradeInputType || 'letter',
        gradeOverride || null, gradeOverridePoints || null,
        calculatedGrade || null, calculatedGradePoints || null, calculatedGradeLetter || null,
        gradePoints || null, semester, year, category, notes || null,
        gpaScale, isCompleted
    ]);

    // Insert assignments if provided
    const assignments = courseData.assignments || [];
    const insertedAssignments = [];
    for (const a of assignments) {
        const aResult = await query(`
            INSERT INTO assignments (course_id, name, type, weight, grade, max_grade, due_date, notes, is_completed)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
        `, [rows[0].id, a.name, a.type || 'Assignment', a.weight || 0, String(a.grade), a.maxGrade || 100, a.dueDate || null, a.notes || null, a.isCompleted || false]);
        insertedAssignments.push(aResult.rows[0]);
    }

    // If there are assignments, calculate grades and update the course
    if (insertedAssignments.length > 0) {
        const mapped = insertedAssignments.map(rowToAssignment);
        const calc = calculateFinalGradeFromAssignments(mapped, gpaScale);
        if (calc.calculatedGrade != null) {
            await query(`
                UPDATE courses SET
                    calculated_grade = $1,
                    calculated_grade_points = $2,
                    calculated_grade_letter = $3,
                    updated_at = NOW()
                WHERE id = $4
            `, [calc.calculatedGrade, calc.calculatedGradePoints, calc.calculatedGradeLetter, rows[0].id]);
        }
    }

    const allAssignments = await getAssignmentsForCourse(rows[0].id);
    // Re-fetch to get updated calculated fields
    const { rows: updated } = await query('SELECT * FROM courses WHERE id = $1', [rows[0].id]);
    return attachMethods(rowToCourse(updated[0], allAssignments));
}

async function updateCourse(id, userId, updates) {
    const course = await findById(id, userId);
    if (!course) return null;

    const fieldMap = {
        name: 'name', code: 'code', credits: 'credits',
        courseType: 'course_type', grade: 'grade',
        gradeInputType: 'grade_input_type',
        gradeOverride: 'grade_override', gradeOverridePoints: 'grade_override_points',
        calculatedGrade: 'calculated_grade', calculatedGradePoints: 'calculated_grade_points',
        calculatedGradeLetter: 'calculated_grade_letter',
        gradePoints: 'grade_points',
        semester: 'semester', year: 'year', category: 'category',
        notes: 'notes', gpaScale: 'gpa_scale',
        studyHours: 'study_hours', difficultyRating: 'difficulty_rating',
        personalNotes: 'personal_notes', targetGrade: 'target_grade',
        isCompleted: 'is_completed'
    };

    const setClauses = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(updates)) {
        const col = fieldMap[key];
        if (col && value !== undefined) {
            setClauses.push(`${col} = $${i}`);
            values.push(value);
            i++;
        }
    }

    // Handle assignments update
    if (updates.assignments !== undefined) {
        // Delete existing assignments and re-insert
        await query('DELETE FROM assignments WHERE course_id = $1', [id]);
        for (const a of updates.assignments) {
            await query(`
                INSERT INTO assignments (course_id, name, type, weight, grade, max_grade, due_date, notes, is_completed)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            `, [id, a.name, a.type || 'Assignment', a.weight || 0, String(a.grade), a.maxGrade || 100, a.dueDate || null, a.notes || null, a.isCompleted || false]);
        }

        // Recalculate
        const allAssignments = await getAssignmentsForCourse(id);
        const mapped = allAssignments.map(rowToAssignment);
        const calc = calculateFinalGradeFromAssignments(mapped, updates.gpaScale || course.gpaScale);
        if (calc.calculatedGrade != null) {
            setClauses.push(`calculated_grade = $${i}`); values.push(calc.calculatedGrade); i++;
            setClauses.push(`calculated_grade_points = $${i}`); values.push(calc.calculatedGradePoints); i++;
            setClauses.push(`calculated_grade_letter = $${i}`); values.push(calc.calculatedGradeLetter); i++;
        }
    }

    if (setClauses.length === 0) return course;

    setClauses.push('updated_at = NOW()');
    values.push(id);
    values.push(userId);

    const { rows } = await query(
        `UPDATE courses SET ${setClauses.join(', ')} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
        values
    );

    if (rows.length === 0) return null;
    const assignments = await getAssignmentsForCourse(id);
    return attachMethods(rowToCourse(rows[0], assignments));
}

async function deleteCourse(id, userId) {
    const { rows } = await query(
        'DELETE FROM courses WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
    );
    return rows.length > 0 ? rowToCourse(rows[0]) : null;
}

// ── Assignment CRUD ──────────────────────────────────────────────────────────

async function addAssignment(courseId, userId, assignmentData) {
    // Verify course belongs to user
    const { rows: courseRows } = await query('SELECT * FROM courses WHERE id = $1 AND user_id = $2', [courseId, userId]);
    if (courseRows.length === 0) return null;

    const { name, type = 'Assignment', weight = 0, grade, maxGrade = 100, dueDate, notes, isCompleted = false } = assignmentData;

    const { rows } = await query(`
        INSERT INTO assignments (course_id, name, type, weight, grade, max_grade, due_date, notes, is_completed)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [courseId, name, type, weight, String(grade), maxGrade, dueDate || null, notes || null, isCompleted]);

    // Recalculate course grades
    const allAssignments = await getAssignmentsForCourse(courseId);
    const mapped = allAssignments.map(rowToAssignment);
    const calc = calculateFinalGradeFromAssignments(mapped, courseRows[0].gpa_scale);
    if (calc.calculatedGrade != null) {
        await query(`
            UPDATE courses SET
                calculated_grade = $1, calculated_grade_points = $2,
                calculated_grade_letter = $3, updated_at = NOW()
            WHERE id = $4
        `, [calc.calculatedGrade, calc.calculatedGradePoints, calc.calculatedGradeLetter, courseId]);
    }

    const updatedCourse = await findById(courseId, userId);
    return { assignment: rowToAssignment(rows[0]), course: updatedCourse };
}

async function updateAssignment(courseId, assignmentId, userId, assignmentData) {
    const { rows: courseRows } = await query('SELECT * FROM courses WHERE id = $1 AND user_id = $2', [courseId, userId]);
    if (courseRows.length === 0) return null;

    const { rows: existing } = await query('SELECT * FROM assignments WHERE id = $1 AND course_id = $2', [assignmentId, courseId]);
    if (existing.length === 0) return null;

    const fieldMap = {
        name: 'name', type: 'type', weight: 'weight',
        grade: 'grade', maxGrade: 'max_grade', dueDate: 'due_date',
        notes: 'notes', isCompleted: 'is_completed'
    };

    const setClauses = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(assignmentData)) {
        const col = fieldMap[key];
        if (col && value !== undefined) {
            setClauses.push(`${col} = $${i}`);
            values.push(key === 'grade' ? String(value) : value);
            i++;
        }
    }

    if (setClauses.length === 0) {
        const course = await findById(courseId, userId);
        return { assignment: rowToAssignment(existing[0]), course };
    }

    setClauses.push('updated_at = NOW()');
    values.push(assignmentId);
    values.push(courseId);

    const { rows } = await query(
        `UPDATE assignments SET ${setClauses.join(', ')} WHERE id = $${i} AND course_id = $${i + 1} RETURNING *`,
        values
    );

    // Recalculate
    const allAssignments = await getAssignmentsForCourse(courseId);
    const mapped = allAssignments.map(rowToAssignment);
    const calc = calculateFinalGradeFromAssignments(mapped, courseRows[0].gpa_scale);
    if (calc.calculatedGrade != null) {
        await query(`
            UPDATE courses SET
                calculated_grade = $1, calculated_grade_points = $2,
                calculated_grade_letter = $3, updated_at = NOW()
            WHERE id = $4
        `, [calc.calculatedGrade, calc.calculatedGradePoints, calc.calculatedGradeLetter, courseId]);
    }

    const updatedCourse = await findById(courseId, userId);
    return { assignment: rowToAssignment(rows[0]), course: updatedCourse };
}

async function deleteAssignment(courseId, assignmentId, userId) {
    const { rows: courseRows } = await query('SELECT * FROM courses WHERE id = $1 AND user_id = $2', [courseId, userId]);
    if (courseRows.length === 0) return null;

    const { rows } = await query('DELETE FROM assignments WHERE id = $1 AND course_id = $2 RETURNING *', [assignmentId, courseId]);
    if (rows.length === 0) return null;

    // Recalculate
    const allAssignments = await getAssignmentsForCourse(courseId);
    const mapped = allAssignments.map(rowToAssignment);
    const calc = calculateFinalGradeFromAssignments(mapped, courseRows[0].gpa_scale);
    await query(`
        UPDATE courses SET
            calculated_grade = $1, calculated_grade_points = $2,
            calculated_grade_letter = $3, updated_at = NOW()
        WHERE id = $4
    `, [calc.calculatedGrade || null, calc.calculatedGradePoints || null, calc.calculatedGradeLetter || null, courseId]);

    const updatedCourse = await findById(courseId, userId);
    return { course: updatedCourse };
}

module.exports = {
    findById,
    findByUser,
    createCourse,
    updateCourse,
    deleteCourse,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentsForCourse,
    resolveCourseFinalGrade,
    shouldIncludeInGPA,
    calculateFinalGradeFromAssignments,
    attachMethods,
    rowToCourse,
    rowToAssignment
};
