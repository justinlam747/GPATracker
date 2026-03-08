const { query } = require('../db/pool');

function rowToStudyLog(row) {
    if (!row) return null;
    return {
        _id: row.id,
        id: row.id,
        user: row.user_id,
        course: row.course_id,
        hours: parseFloat(row.hours),
        date: row.date,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

async function create({ userId, courseId, hours, date, notes }) {
    const { rows } = await query(`
        INSERT INTO study_logs (user_id, course_id, hours, date, notes)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [userId, courseId, hours, date, notes || '']);
    return rowToStudyLog(rows[0]);
}

async function findByUser(userId, limit = 50) {
    const { rows } = await query(
        'SELECT * FROM study_logs WHERE user_id = $1 ORDER BY date DESC LIMIT $2',
        [userId, limit]
    );
    return rows.map(rowToStudyLog);
}

module.exports = { create, findByUser, rowToStudyLog };
