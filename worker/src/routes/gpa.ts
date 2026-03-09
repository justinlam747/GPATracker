import { Hono } from 'hono';
import type { Env, AuthUser, CourseRow, AssignmentRow, StudyLogRow } from '../types';
import {
  resolveGradePoints,
  calculateCourseGradeFromAssignments,
  calculateGPA,
  percentageToGradePoints,
  letterToGradePoints,
  type AssignmentGradeInput,
} from '../lib/grade-utils';

type GpaEnv = { Bindings: Env; Variables: { user: AuthUser } };

const gpa = new Hono<GpaEnv>();

// ============================================================
// Helpers
// ============================================================

function courseToResponse(c: CourseRow, assignments: AssignmentRow[] = []) {
  // Resolve grade field for backwards compat (string or number)
  let grade: string | number | undefined;
  if (c.grade_letter) grade = c.grade_letter;
  else if (c.grade_numeric !== null) grade = c.grade_numeric;

  let gradeOverride: string | number | undefined;
  if (c.grade_override !== null) {
    const num = parseFloat(c.grade_override);
    gradeOverride = isNaN(num) ? c.grade_override : num;
  }

  return {
    id: c.id,
    name: c.name,
    code: c.code,
    credits: c.credits,
    courseType: c.course_type,
    grade,
    gradePoints: c.grade_points,
    calculatedGrade: c.calculated_grade,
    calculatedGradePoints: c.calculated_grade_points,
    gradeOverride,
    gradeOverridePoints: c.grade_override_points,
    semester: c.semester,
    year: c.year,
    category: c.category,
    notes: c.notes,
    gpaScale: c.gpa_scale,
    studyHours: c.study_hours,
    difficultyRating: c.difficulty_rating,
    personalNotes: c.personal_notes,
    targetGrade: c.target_grade,
    isCompleted: c.is_completed === 1,
    assignments: assignments.map(assignmentToResponse),
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    // Keep _id as alias for migration transition
    _id: c.id,
  };
}

function assignmentToResponse(a: AssignmentRow) {
  let grade: string | number = '';
  if (a.grade_numeric !== null) grade = a.grade_numeric;
  else if (a.grade_letter) grade = a.grade_letter;

  return {
    id: a.id,
    _id: a.id, // alias
    courseId: a.course_id,
    name: a.name,
    type: a.type,
    weight: a.weight,
    grade,
    maxGrade: a.max_grade,
    dueDate: a.due_date,
    notes: a.notes,
    isCompleted: a.is_completed === 1,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

function studyLogToResponse(s: StudyLogRow) {
  return {
    id: s.id,
    _id: s.id,
    userId: s.user_id,
    courseId: s.course_id,
    course: s.course_id,
    hours: s.hours,
    date: s.date,
    notes: s.notes,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

// Parse mixed grade input into letter/numeric columns
function parseGrade(grade: unknown): { grade_letter: string | null; grade_numeric: number | null } {
  if (grade === undefined || grade === null || grade === '') {
    return { grade_letter: null, grade_numeric: null };
  }
  if (typeof grade === 'number') {
    return { grade_letter: null, grade_numeric: grade };
  }
  const num = parseFloat(grade as string);
  if (!isNaN(num) && /^\d/.test(grade as string)) {
    return { grade_letter: null, grade_numeric: num };
  }
  return { grade_letter: grade as string, grade_numeric: null };
}

// Recalculate course grades from its assignments and update the row
async function recalculateCourseGrade(db: D1Database, courseId: number) {
  const course = await db.prepare('SELECT * FROM courses WHERE id = ?')
    .bind(courseId).first<CourseRow>();
  if (!course) return;

  const assignments = (await db.prepare('SELECT * FROM assignments WHERE course_id = ?')
    .bind(courseId).all()).results as AssignmentRow[];

  const inputs: AssignmentGradeInput[] = assignments.map(a => ({
    grade_letter: a.grade_letter,
    grade_numeric: a.grade_numeric,
    weight: a.weight,
  }));

  const result = calculateCourseGradeFromAssignments(inputs, course.gpa_scale as '4.0' | '4.3' | 'percentage');

  if (result) {
    await db.prepare(
      `UPDATE courses SET calculated_grade = ?, calculated_grade_points = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(result.calculatedGrade, result.calculatedGradePoints, courseId).run();
  } else {
    await db.prepare(
      `UPDATE courses SET calculated_grade = NULL, calculated_grade_points = NULL, updated_at = datetime('now') WHERE id = ?`
    ).bind(courseId).run();
  }
}

// Fetch a course with its assignments
async function getCourseWithAssignments(db: D1Database, courseId: number, userId: string) {
  const course = await db.prepare('SELECT * FROM courses WHERE id = ? AND user_id = ?')
    .bind(courseId, userId).first<CourseRow>();
  if (!course) return null;

  const assignments = (await db.prepare(
    'SELECT * FROM assignments WHERE course_id = ? ORDER BY created_at ASC'
  ).bind(courseId).all()).results as AssignmentRow[];

  return { course, assignments };
}

// ============================================================
// Routes
// ============================================================

// ---- POST /courses ----
gpa.post('/courses', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<Record<string, unknown>>();

    const { grade_letter, grade_numeric } = parseGrade(body.grade);
    const scale = (body.gpaScale as string) || '4.0';
    const gradePoints = resolveGradePoints(body.grade as string | number | undefined, scale as '4.0' | '4.3' | 'percentage');

    const result = await c.env.DB.prepare(
      `INSERT INTO courses (user_id, name, code, credits, course_type, grade_letter, grade_numeric, grade_points, semester, year, category, notes, gpa_scale, is_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user.id,
      body.name || '',
      body.code || '',
      body.credits || 3,
      body.courseType || 'simple',
      grade_letter,
      grade_numeric,
      gradePoints,
      body.semester || 'Fall',
      body.year || new Date().getFullYear(),
      body.category || 'General',
      body.notes || '',
      scale,
      body.isCompleted ? 1 : 0,
    ).run();

    const courseId = result.meta.last_row_id;

    // Insert assignments if provided
    const assignments = body.assignments as Array<Record<string, unknown>> | undefined;
    if (assignments && assignments.length > 0) {
      const stmts = assignments.map((a) => {
        const { grade_letter: al, grade_numeric: an } = parseGrade(a.grade);
        return c.env.DB.prepare(
          `INSERT INTO assignments (course_id, name, type, weight, grade_letter, grade_numeric, max_grade, due_date, notes, is_completed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          courseId,
          a.name || '',
          a.type || 'Assignment',
          a.weight || 0,
          al, an,
          a.maxGrade || 100,
          a.dueDate || null,
          a.notes || '',
          a.isCompleted ? 1 : 0,
        );
      });
      await c.env.DB.batch(stmts);
      await recalculateCourseGrade(c.env.DB, courseId as number);
    }

    // Handle grade override
    if (body.gradeOverride !== undefined) {
      const { grade_letter: ol } = parseGrade(body.gradeOverride);
      const overridePoints = resolveGradePoints(
        body.gradeOverride as string | number, scale as '4.0' | '4.3' | 'percentage'
      );
      await c.env.DB.prepare(
        `UPDATE courses SET grade_override = ?, grade_override_points = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(String(body.gradeOverride), overridePoints, courseId).run();
    }

    const data = await getCourseWithAssignments(c.env.DB, courseId as number, user.id);
    if (!data) return c.json({ message: 'Course not found after creation', code: 'ADD_COURSE_ERROR' }, 500);

    return c.json({
      message: 'Course added successfully',
      course: courseToResponse(data.course, data.assignments),
      code: 'COURSE_ADDED',
    }, 201);
  } catch (err) {
    console.error('Add course error:', err);
    return c.json({ message: 'Server error while adding course', code: 'ADD_COURSE_ERROR' }, 500);
  }
});

// ---- GET /courses ----
gpa.get('/courses', async (c) => {
  try {
    const user = c.get('user');
    const { semester, year, category } = c.req.query();

    let query = 'SELECT * FROM courses WHERE user_id = ?';
    const binds: unknown[] = [user.id];

    if (semester) { query += ' AND semester = ?'; binds.push(semester); }
    if (year) { query += ' AND year = ?'; binds.push(parseInt(year)); }
    if (category) { query += ' AND category = ?'; binds.push(category); }

    query += ' ORDER BY year DESC, semester ASC, name ASC';

    const courses = (await c.env.DB.prepare(query).bind(...binds).all()).results as CourseRow[];

    // Fetch all assignments for these courses in one query
    let allAssignments: AssignmentRow[] = [];
    if (courses.length > 0) {
      const ids = courses.map(cc => cc.id);
      const placeholders = ids.map(() => '?').join(',');
      const aResult = await c.env.DB.prepare(
        `SELECT * FROM assignments WHERE course_id IN (${placeholders}) ORDER BY created_at ASC`
      ).bind(...ids).all();
      allAssignments = (aResult.results || []) as AssignmentRow[];
    }

    // Group assignments by course_id
    const assignmentMap = new Map<number, AssignmentRow[]>();
    for (const a of allAssignments) {
      const list = assignmentMap.get(a.course_id) || [];
      list.push(a);
      assignmentMap.set(a.course_id, list);
    }

    const result = courses.map(cc => courseToResponse(cc, assignmentMap.get(cc.id) || []));

    return c.json({ courses: result, count: result.length, code: 'COURSES_RETRIEVED' });
  } catch (err) {
    console.error('Get courses error:', err);
    return c.json({ message: 'Server error while retrieving courses', code: 'GET_COURSES_ERROR' }, 500);
  }
});

// ---- GET /courses/:id ----
gpa.get('/courses/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    const data = await getCourseWithAssignments(c.env.DB, id, user.id);

    if (!data) {
      return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);
    }

    return c.json({ course: courseToResponse(data.course, data.assignments), code: 'COURSE_RETRIEVED' });
  } catch (err) {
    return c.json({ message: 'Server error while retrieving course', code: 'GET_COURSE_ERROR' }, 500);
  }
});

// ---- PUT /courses/:id ----
gpa.put('/courses/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));
    const body = await c.req.json<Record<string, unknown>>();

    // Verify ownership
    const existing = await c.env.DB.prepare('SELECT * FROM courses WHERE id = ? AND user_id = ?')
      .bind(id, user.id).first<CourseRow>();
    if (!existing) {
      return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);
    }

    const fieldMap: Record<string, string> = {
      name: 'name', code: 'code', credits: 'credits', courseType: 'course_type',
      semester: 'semester', year: 'year', category: 'category', notes: 'notes',
      gpaScale: 'gpa_scale', isCompleted: 'is_completed',
    };

    const sets: string[] = [];
    const values: unknown[] = [];

    for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
      if (body[jsKey] !== undefined) {
        if (jsKey === 'isCompleted') {
          sets.push(`${dbCol} = ?`);
          values.push(body[jsKey] ? 1 : 0);
        } else {
          sets.push(`${dbCol} = ?`);
          values.push(body[jsKey]);
        }
      }
    }

    // Handle grade update
    if (body.grade !== undefined) {
      const { grade_letter, grade_numeric } = parseGrade(body.grade);
      sets.push('grade_letter = ?', 'grade_numeric = ?');
      values.push(grade_letter, grade_numeric);
      const scale = (body.gpaScale as string) || existing.gpa_scale;
      const gp = resolveGradePoints(body.grade as string | number, scale as '4.0' | '4.3' | 'percentage');
      sets.push('grade_points = ?');
      values.push(gp);
    }

    if (sets.length > 0) {
      sets.push("updated_at = datetime('now')");
      values.push(id);
      await c.env.DB.prepare(`UPDATE courses SET ${sets.join(', ')} WHERE id = ?`)
        .bind(...values).run();
    }

    const data = await getCourseWithAssignments(c.env.DB, id, user.id);
    return c.json({
      message: 'Course updated successfully',
      course: data ? courseToResponse(data.course, data.assignments) : null,
      code: 'COURSE_UPDATED',
    });
  } catch (err) {
    console.error('Update course error:', err);
    return c.json({ message: 'Server error while updating course', code: 'UPDATE_COURSE_ERROR' }, 500);
  }
});

// ---- DELETE /courses/:id ----
gpa.delete('/courses/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'));

    const existing = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?')
      .bind(id, user.id).first();
    if (!existing) {
      return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);
    }

    // CASCADE handles assignments
    await c.env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(id).run();

    return c.json({ message: 'Course removed successfully', code: 'COURSE_REMOVED' });
  } catch (err) {
    return c.json({ message: 'Server error while deleting course', code: 'DELETE_COURSE_ERROR' }, 500);
  }
});

// ---- POST /courses/bulk ----
gpa.post('/courses/bulk', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<{ courses: Array<Record<string, unknown>> }>();

    if (!Array.isArray(body.courses) || body.courses.length === 0) {
      return c.json({ message: 'Courses array is required and must not be empty', code: 'INVALID_COURSES_ARRAY' }, 400);
    }

    const importedCourses: unknown[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < body.courses.length; i++) {
      try {
        const cd = body.courses[i];
        if (!cd.name || !cd.credits || cd.grade === undefined) {
          errors.push({ index: i, error: 'Missing required fields: name, credits, and grade are required' });
          continue;
        }

        const { grade_letter, grade_numeric } = parseGrade(cd.grade);
        const scale = '4.0';
        const gp = resolveGradePoints(cd.grade as string | number, scale);

        const result = await c.env.DB.prepare(
          `INSERT INTO courses (user_id, name, code, credits, course_type, grade_letter, grade_numeric, grade_points, semester, year, category, notes, gpa_scale)
           VALUES (?, ?, ?, ?, 'simple', ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          user.id, cd.name, cd.code || '', cd.credits,
          grade_letter, grade_numeric, gp,
          cd.semester || 'Fall', cd.year || new Date().getFullYear(),
          cd.category || 'General', cd.notes || '', scale,
        ).run();

        const data = await getCourseWithAssignments(c.env.DB, result.meta.last_row_id as number, user.id);
        if (data) importedCourses.push(courseToResponse(data.course, data.assignments));
      } catch (err: unknown) {
        errors.push({ index: i, error: (err as Error).message });
      }
    }

    return c.json({
      message: `Successfully imported ${importedCourses.length} courses`,
      importedCourses,
      errors,
      code: 'BULK_IMPORT_SUCCESS',
    });
  } catch (err) {
    return c.json({ message: 'Server error during bulk import', code: 'BULK_IMPORT_ERROR' }, 500);
  }
});

// ---- POST /courses/:id/assignments ----
gpa.post('/courses/:id/assignments', async (c) => {
  try {
    const user = c.get('user');
    const courseId = parseInt(c.req.param('id'));
    const body = await c.req.json<Record<string, unknown>>();

    const existing = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?')
      .bind(courseId, user.id).first();
    if (!existing) {
      return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);
    }

    const { grade_letter, grade_numeric } = parseGrade(body.grade);

    await c.env.DB.prepare(
      `INSERT INTO assignments (course_id, name, type, weight, grade_letter, grade_numeric, max_grade, due_date, notes, is_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      courseId,
      body.name || '',
      body.type || 'Assignment',
      body.weight || 0,
      grade_letter, grade_numeric,
      body.maxGrade || 100,
      body.dueDate || null,
      body.notes || '',
      body.isCompleted ? 1 : 0,
    ).run();

    await recalculateCourseGrade(c.env.DB, courseId);

    const data = await getCourseWithAssignments(c.env.DB, courseId, user.id);
    if (!data) return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);

    const lastAssignment = data.assignments[data.assignments.length - 1];

    return c.json({
      message: 'Assignment added successfully',
      assignment: lastAssignment ? assignmentToResponse(lastAssignment) : null,
      course: courseToResponse(data.course, data.assignments),
      code: 'ASSIGNMENT_ADDED',
    }, 201);
  } catch (err) {
    console.error('Add assignment error:', err);
    return c.json({ message: 'Server error while adding assignment', code: 'ADD_ASSIGNMENT_ERROR' }, 500);
  }
});

// ---- PUT /courses/:id/assignments/:assignmentId ----
gpa.put('/courses/:id/assignments/:assignmentId', async (c) => {
  try {
    const user = c.get('user');
    const courseId = parseInt(c.req.param('id'));
    const assignmentId = parseInt(c.req.param('assignmentId'));
    const body = await c.req.json<Record<string, unknown>>();

    // Verify course ownership
    const courseExists = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?')
      .bind(courseId, user.id).first();
    if (!courseExists) {
      return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);
    }

    // Verify assignment exists
    const assignmentExists = await c.env.DB.prepare('SELECT id FROM assignments WHERE id = ? AND course_id = ?')
      .bind(assignmentId, courseId).first();
    if (!assignmentExists) {
      return c.json({ message: 'Assignment not found', code: 'ASSIGNMENT_NOT_FOUND' }, 404);
    }

    const sets: string[] = [];
    const values: unknown[] = [];

    const simpleFields: Record<string, string> = {
      name: 'name', type: 'type', weight: 'weight',
      maxGrade: 'max_grade', dueDate: 'due_date', notes: 'notes',
    };

    for (const [jsKey, dbCol] of Object.entries(simpleFields)) {
      if (body[jsKey] !== undefined) {
        sets.push(`${dbCol} = ?`);
        values.push(body[jsKey]);
      }
    }

    if (body.isCompleted !== undefined) {
      sets.push('is_completed = ?');
      values.push(body.isCompleted ? 1 : 0);
    }

    if (body.grade !== undefined) {
      const { grade_letter, grade_numeric } = parseGrade(body.grade);
      sets.push('grade_letter = ?', 'grade_numeric = ?');
      values.push(grade_letter, grade_numeric);
    }

    if (sets.length > 0) {
      sets.push("updated_at = datetime('now')");
      values.push(assignmentId);
      await c.env.DB.prepare(`UPDATE assignments SET ${sets.join(', ')} WHERE id = ?`)
        .bind(...values).run();
    }

    await recalculateCourseGrade(c.env.DB, courseId);

    const data = await getCourseWithAssignments(c.env.DB, courseId, user.id);
    if (!data) return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);

    const updatedAssignment = data.assignments.find(a => a.id === assignmentId);

    return c.json({
      message: 'Assignment updated successfully',
      assignment: updatedAssignment ? assignmentToResponse(updatedAssignment) : null,
      course: courseToResponse(data.course, data.assignments),
      code: 'ASSIGNMENT_UPDATED',
    });
  } catch (err) {
    console.error('Update assignment error:', err);
    return c.json({ message: 'Server error while updating assignment', code: 'UPDATE_ASSIGNMENT_ERROR' }, 500);
  }
});

// ---- DELETE /courses/:id/assignments/:assignmentId ----
gpa.delete('/courses/:id/assignments/:assignmentId', async (c) => {
  try {
    const user = c.get('user');
    const courseId = parseInt(c.req.param('id'));
    const assignmentId = parseInt(c.req.param('assignmentId'));

    const courseExists = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?')
      .bind(courseId, user.id).first();
    if (!courseExists) {
      return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);
    }

    const assignmentExists = await c.env.DB.prepare('SELECT id FROM assignments WHERE id = ? AND course_id = ?')
      .bind(assignmentId, courseId).first();
    if (!assignmentExists) {
      return c.json({ message: 'Assignment not found', code: 'ASSIGNMENT_NOT_FOUND' }, 404);
    }

    await c.env.DB.prepare('DELETE FROM assignments WHERE id = ?').bind(assignmentId).run();

    await recalculateCourseGrade(c.env.DB, courseId);

    const data = await getCourseWithAssignments(c.env.DB, courseId, user.id);
    if (!data) return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);

    return c.json({
      message: 'Assignment removed successfully',
      course: courseToResponse(data.course, data.assignments),
      code: 'ASSIGNMENT_REMOVED',
    });
  } catch (err) {
    return c.json({ message: 'Server error while deleting assignment', code: 'DELETE_ASSIGNMENT_ERROR' }, 500);
  }
});

// ---- PUT /courses/:id/grade-override ----
gpa.put('/courses/:id/grade-override', async (c) => {
  try {
    const user = c.get('user');
    const courseId = parseInt(c.req.param('id'));
    const body = await c.req.json<{ gradeOverride: string | number }>();

    if (body.gradeOverride === undefined) {
      return c.json({ message: 'Grade override is required', code: 'GRADE_OVERRIDE_REQUIRED' }, 400);
    }

    const course = await c.env.DB.prepare('SELECT * FROM courses WHERE id = ? AND user_id = ?')
      .bind(courseId, user.id).first<CourseRow>();
    if (!course) {
      return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);
    }

    // Get user's gpa scale for override calculation
    const profile = await c.env.DB.prepare('SELECT gpa_scale FROM profiles WHERE id = ?')
      .bind(user.id).first<{ gpa_scale: string }>();
    const userScale = (profile?.gpa_scale || '4.0') as '4.0' | '4.3' | 'percentage';

    let overridePoints: number;
    if (typeof body.gradeOverride === 'string') {
      overridePoints = letterToGradePoints(body.gradeOverride, userScale);
    } else {
      if (userScale === 'percentage') {
        overridePoints = body.gradeOverride;
      } else {
        overridePoints = percentageToGradePoints(body.gradeOverride, userScale);
      }
    }

    await c.env.DB.prepare(
      `UPDATE courses SET grade_override = ?, grade_override_points = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(String(body.gradeOverride), overridePoints, courseId).run();

    const data = await getCourseWithAssignments(c.env.DB, courseId, user.id);
    if (!data) return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);

    return c.json({
      message: 'Grade override set successfully',
      course: courseToResponse(data.course, data.assignments),
      code: 'GRADE_OVERRIDE_SET',
    });
  } catch (err) {
    return c.json({ message: 'Server error while setting grade override', code: 'SET_GRADE_OVERRIDE_ERROR' }, 500);
  }
});

// ---- POST /courses/:id/revert-override ----
gpa.post('/courses/:id/revert-override', async (c) => {
  try {
    const user = c.get('user');
    const courseId = parseInt(c.req.param('id'));

    const existing = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?')
      .bind(courseId, user.id).first();
    if (!existing) {
      return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);
    }

    await c.env.DB.prepare(
      `UPDATE courses SET grade_override = NULL, grade_override_points = NULL, updated_at = datetime('now') WHERE id = ?`
    ).bind(courseId).run();

    const data = await getCourseWithAssignments(c.env.DB, courseId, user.id);
    if (!data) return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);

    return c.json({
      message: 'Grade override reverted successfully',
      course: courseToResponse(data.course, data.assignments),
      code: 'GRADE_OVERRIDE_REVERTED',
    });
  } catch (err) {
    return c.json({ message: 'Server error while reverting grade override', code: 'REVERT_GRADE_OVERRIDE_ERROR' }, 500);
  }
});

// Also support PUT for backward compat (client uses PUT for revert)
gpa.put('/courses/:id/revert-override', async (c) => {
  // Delegate to the POST handler
  const user = c.get('user');
  const courseId = parseInt(c.req.param('id'));

  const existing = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?')
    .bind(courseId, user.id).first();
  if (!existing) {
    return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);
  }

  await c.env.DB.prepare(
    `UPDATE courses SET grade_override = NULL, grade_override_points = NULL, updated_at = datetime('now') WHERE id = ?`
  ).bind(courseId).run();

  const data = await getCourseWithAssignments(c.env.DB, courseId, user.id);
  if (!data) return c.json({ message: 'Course not found', code: 'COURSE_NOT_FOUND' }, 404);

  return c.json({
    message: 'Grade override reverted successfully',
    course: courseToResponse(data.course, data.assignments),
    code: 'GRADE_OVERRIDE_REVERTED',
  });
});

// ---- PUT /courses/:id/personal ----
gpa.put('/courses/:id/personal', async (c) => {
  try {
    const user = c.get('user');
    const courseId = parseInt(c.req.param('id'));
    const body = await c.req.json<Record<string, unknown>>();

    const existing = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?')
      .bind(courseId, user.id).first();
    if (!existing) {
      return c.json({ error: 'Course not found' }, 404);
    }

    const sets: string[] = [];
    const values: unknown[] = [];

    if (body.studyHours !== undefined) { sets.push('study_hours = ?'); values.push(body.studyHours); }
    if (body.difficultyRating !== undefined) { sets.push('difficulty_rating = ?'); values.push(body.difficultyRating); }
    if (body.personalNotes !== undefined) { sets.push('personal_notes = ?'); values.push(body.personalNotes); }
    if (body.targetGrade !== undefined) { sets.push('target_grade = ?'); values.push(body.targetGrade); }

    if (sets.length > 0) {
      sets.push("updated_at = datetime('now')");
      values.push(courseId);
      await c.env.DB.prepare(`UPDATE courses SET ${sets.join(', ')} WHERE id = ?`)
        .bind(...values).run();
    }

    const data = await getCourseWithAssignments(c.env.DB, courseId, user.id);
    if (!data) return c.json({ error: 'Course not found' }, 404);

    return c.json({ success: true, course: courseToResponse(data.course, data.assignments) });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ---- GET /summary ----
gpa.get('/summary', async (c) => {
  try {
    const user = c.get('user');
    const courses = (await c.env.DB.prepare('SELECT * FROM courses WHERE user_id = ?')
      .bind(user.id).all()).results as CourseRow[];

    // Overall GPA
    const gpaInputs = courses.map(cc => {
      let gradePoints = cc.grade_points;
      if (cc.grade_override_points !== null) gradePoints = cc.grade_override_points;
      else if (cc.calculated_grade_points !== null) gradePoints = cc.calculated_grade_points;

      return {
        credits: cc.credits,
        gradePoints,
        isCompleted: cc.is_completed === 1,
        gradeLetter: cc.grade_letter,
        gradeOverride: cc.grade_override,
      };
    });

    const overallGPA = calculateGPA(gpaInputs);

    // GPA by semester
    const semesterGPAs: Record<string, number> = {};
    const semesters = [...new Set(courses.map(cc => `${cc.semester} ${cc.year}`))];

    for (const sem of semesters) {
      const [semester, yearStr] = sem.split(' ');
      const year = parseInt(yearStr);
      const semCourses = courses.filter(cc => cc.semester === semester && cc.year === year);
      const semInputs = semCourses.map(cc => {
        let gradePoints = cc.grade_points;
        if (cc.grade_override_points !== null) gradePoints = cc.grade_override_points;
        else if (cc.calculated_grade_points !== null) gradePoints = cc.calculated_grade_points;
        return {
          credits: cc.credits, gradePoints,
          isCompleted: cc.is_completed === 1,
          gradeLetter: cc.grade_letter, gradeOverride: cc.grade_override,
        };
      });
      semesterGPAs[sem] = calculateGPA(semInputs);
    }

    // GPA by category
    const categoryGPAs: Record<string, number> = {};
    const categories = [...new Set(courses.map(cc => cc.category))];

    for (const cat of categories) {
      const catCourses = courses.filter(cc => cc.category === cat);
      const catInputs = catCourses.map(cc => {
        let gradePoints = cc.grade_points;
        if (cc.grade_override_points !== null) gradePoints = cc.grade_override_points;
        else if (cc.calculated_grade_points !== null) gradePoints = cc.calculated_grade_points;
        return {
          credits: cc.credits, gradePoints,
          isCompleted: cc.is_completed === 1,
          gradeLetter: cc.grade_letter, gradeOverride: cc.grade_override,
        };
      });
      categoryGPAs[cat] = calculateGPA(catInputs);
    }

    const totalCredits = courses
      .filter(cc => cc.is_completed === 1 && cc.grade_letter !== 'W' && cc.grade_letter !== 'I')
      .reduce((sum, cc) => sum + cc.credits, 0);

    return c.json({
      overallGPA,
      semesterGPAs,
      categoryGPAs,
      totalCredits,
      totalCourses: courses.length,
      code: 'SUMMARY_RETRIEVED',
    });
  } catch (err) {
    return c.json({ message: 'Server error while retrieving GPA summary', code: 'GET_SUMMARY_ERROR' }, 500);
  }
});

// ---- GET /dashboard-analytics ----
gpa.get('/dashboard-analytics', async (c) => {
  try {
    const user = c.get('user');
    const courses = (await c.env.DB.prepare('SELECT * FROM courses WHERE user_id = ?')
      .bind(user.id).all()).results as CourseRow[];

    const analytics = {
      totalCourses: courses.length,
      totalCredits: courses.reduce((sum, cc) => sum + (cc.credits || 0), 0),
      averageGPA: courses.length > 0
        ? courses.reduce((sum, cc) => sum + (cc.grade_points || 0), 0) / courses.length
        : 0,
      semesterBreakdown: {} as Record<string, { totalGPA: number; count: number; averageGPA: number }>,
      categoryBreakdown: {} as Record<string, { totalGPA: number; count: number; averageGPA: number }>,
      studyHoursTotal: courses.reduce((sum, cc) => sum + (cc.study_hours || 0), 0),
    };

    for (const cc of courses) {
      const sem = cc.semester;
      if (!analytics.semesterBreakdown[sem]) {
        analytics.semesterBreakdown[sem] = { totalGPA: 0, count: 0, averageGPA: 0 };
      }
      analytics.semesterBreakdown[sem].totalGPA += cc.grade_points || 0;
      analytics.semesterBreakdown[sem].count += 1;

      const cat = cc.category || 'General';
      if (!analytics.categoryBreakdown[cat]) {
        analytics.categoryBreakdown[cat] = { totalGPA: 0, count: 0, averageGPA: 0 };
      }
      analytics.categoryBreakdown[cat].totalGPA += cc.grade_points || 0;
      analytics.categoryBreakdown[cat].count += 1;
    }

    for (const key of Object.keys(analytics.semesterBreakdown)) {
      const s = analytics.semesterBreakdown[key];
      s.averageGPA = s.count > 0 ? s.totalGPA / s.count : 0;
    }
    for (const key of Object.keys(analytics.categoryBreakdown)) {
      const cat = analytics.categoryBreakdown[key];
      cat.averageGPA = cat.count > 0 ? cat.totalGPA / cat.count : 0;
    }

    return c.json({ success: true, analytics });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ---- POST /study-logs ----
gpa.post('/study-logs', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json<Record<string, unknown>>();
    const { courseId, hours, date, notes } = body;

    if (!courseId || !hours || !date) {
      return c.json({ error: 'Course ID, hours, and date are required' }, 400);
    }

    // Verify course belongs to user
    const courseExists = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?')
      .bind(courseId, user.id).first();
    if (!courseExists) {
      return c.json({ error: 'Course not found' }, 404);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO study_logs (user_id, course_id, hours, date, notes) VALUES (?, ?, ?, ?, ?)`
    ).bind(user.id, courseId, parseFloat(hours as string), date, (notes as string) || '').run();

    const log = await c.env.DB.prepare('SELECT * FROM study_logs WHERE id = ?')
      .bind(result.meta.last_row_id).first<StudyLogRow>();

    return c.json({ success: true, studyLog: log ? studyLogToResponse(log) : null }, 201);
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ---- GET /study-logs ----
gpa.get('/study-logs', async (c) => {
  try {
    const user = c.get('user');
    const logs = (await c.env.DB.prepare(
      'SELECT * FROM study_logs WHERE user_id = ? ORDER BY date DESC LIMIT 50'
    ).bind(user.id).all()).results as StudyLogRow[];

    return c.json({ success: true, studyLogs: logs.map(studyLogToResponse) });
  } catch (err) {
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default gpa;
