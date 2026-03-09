import { Hono } from 'hono';
import type { Env, AuthUser, ProfileRow } from '../types';

type UserEnv = { Bindings: Env; Variables: { user: AuthUser } };

const user = new Hono<UserEnv>();

// ---------- helpers ----------

function profileToResponse(p: ProfileRow) {
  return {
    id: p.id,
    email: p.email,
    firstName: p.first_name,
    lastName: p.last_name,
    institution: p.institution,
    graduationYear: p.graduation_year,
    gpaScale: p.gpa_scale,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

// ---------- GET /profile ----------

user.get('/profile', async (c) => {
  try {
    const authUser = c.get('user');
    const row = await c.env.DB.prepare('SELECT * FROM profiles WHERE id = ?')
      .bind(authUser.id)
      .first<ProfileRow>();

    if (!row) {
      return c.json({ message: 'Profile not found', code: 'PROFILE_NOT_FOUND' }, 404);
    }

    return c.json({ user: profileToResponse(row), code: 'PROFILE_RETRIEVED' });
  } catch (err) {
    return c.json({ message: 'Server error while fetching profile', code: 'GET_PROFILE_ERROR' }, 500);
  }
});

// ---------- PUT /profile ----------

user.put('/profile', async (c) => {
  try {
    const authUser = c.get('user');
    const body = await c.req.json<Record<string, unknown>>();

    const allowed = ['firstName', 'lastName', 'institution', 'graduationYear', 'gpaScale'];
    const fieldMap: Record<string, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      institution: 'institution',
      graduationYear: 'graduation_year',
      gpaScale: 'gpa_scale',
    };

    const sets: string[] = [];
    const values: unknown[] = [];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        sets.push(`${fieldMap[key]} = ?`);
        values.push(body[key]);
      }
    }

    if (sets.length === 0) {
      return c.json({ message: 'No fields to update', code: 'NO_FIELDS' }, 400);
    }

    sets.push("updated_at = datetime('now')");
    values.push(authUser.id);

    await c.env.DB.prepare(`UPDATE profiles SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    const updated = await c.env.DB.prepare('SELECT * FROM profiles WHERE id = ?')
      .bind(authUser.id)
      .first<ProfileRow>();

    return c.json({
      message: 'Profile updated successfully',
      user: updated ? profileToResponse(updated) : null,
      code: 'PROFILE_UPDATED',
    });
  } catch (err) {
    return c.json({ message: 'Server error while updating profile', code: 'UPDATE_PROFILE_ERROR' }, 500);
  }
});

// ---------- DELETE /account ----------

user.delete('/account', async (c) => {
  try {
    const authUser = c.get('user');

    // CASCADE will delete courses, assignments, study_logs
    await c.env.DB.prepare('DELETE FROM profiles WHERE id = ?')
      .bind(authUser.id)
      .run();

    return c.json({ message: 'Account deleted successfully', code: 'ACCOUNT_DELETED' });
  } catch (err) {
    return c.json({ message: 'Server error while deleting account', code: 'DELETE_ACCOUNT_ERROR' }, 500);
  }
});

// ---------- GET /export-data ----------

user.get('/export-data', async (c) => {
  try {
    const authUser = c.get('user');

    const profile = await c.env.DB.prepare('SELECT * FROM profiles WHERE id = ?')
      .bind(authUser.id)
      .first<ProfileRow>();

    const courses = await c.env.DB.prepare('SELECT * FROM courses WHERE user_id = ?')
      .bind(authUser.id)
      .all();

    const studyLogs = await c.env.DB.prepare('SELECT * FROM study_logs WHERE user_id = ?')
      .bind(authUser.id)
      .all();

    // Fetch assignments for each course
    const courseIds = (courses.results || []).map((r: Record<string, unknown>) => r.id);
    let allAssignments: Record<string, unknown>[] = [];
    if (courseIds.length > 0) {
      const placeholders = courseIds.map(() => '?').join(',');
      const aResult = await c.env.DB.prepare(
        `SELECT * FROM assignments WHERE course_id IN (${placeholders})`
      ).bind(...courseIds).all();
      allAssignments = aResult.results || [];
    }

    const exportData = {
      user: profile ? profileToResponse(profile) : null,
      courses: courses.results || [],
      assignments: allAssignments,
      studyLogs: studyLogs.results || [],
      exportDate: new Date().toISOString(),
    };

    c.header('Content-Type', 'application/json');
    c.header('Content-Disposition', `attachment; filename="gpa-tracker-data-${Date.now()}.json"`);
    return c.json(exportData);
  } catch (err) {
    return c.json({ message: 'Server error while exporting data', code: 'EXPORT_DATA_ERROR' }, 500);
  }
});

export default user;
