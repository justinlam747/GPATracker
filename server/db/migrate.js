const { query } = require('./pool');

/**
 * Run schema migrations. Safe to call on every startup (uses IF NOT EXISTS).
 */
async function migrate() {
    await query(`
        CREATE TABLE IF NOT EXISTS users (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email           TEXT NOT NULL UNIQUE,
            password        TEXT NOT NULL,
            first_name      TEXT NOT NULL,
            last_name       TEXT,
            institution     TEXT,
            graduation_year INTEGER,
            gpa_scale       TEXT NOT NULL DEFAULT '4.0',
            is_active       BOOLEAN NOT NULL DEFAULT true,
            is_email_verified BOOLEAN NOT NULL DEFAULT false,
            email_verification_token   TEXT,
            email_verification_expires TIMESTAMPTZ,
            password_reset_token       TEXT,
            password_reset_expires     TIMESTAMPTZ,
            failed_login_count         INTEGER NOT NULL DEFAULT 0,
            failed_login_last_attempt  TIMESTAMPTZ,
            failed_login_locked_until  TIMESTAMPTZ,
            last_login                 TIMESTAMPTZ,
            last_password_change       TIMESTAMPTZ DEFAULT NOW(),
            max_sessions               INTEGER NOT NULL DEFAULT 5,
            created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS password_history (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            password   TEXT NOT NULL,
            changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token      TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked    BOOLEAN NOT NULL DEFAULT false,
            revoked_at TIMESTAMPTZ,
            user_agent TEXT,
            ip_address TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS courses (
            id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name                  TEXT NOT NULL,
            code                  TEXT,
            credits               NUMERIC(4,2) NOT NULL,
            course_type           TEXT NOT NULL DEFAULT 'simple',
            grade                 TEXT,
            grade_input_type      TEXT DEFAULT 'letter',
            grade_override        TEXT,
            grade_override_points NUMERIC(6,3),
            calculated_grade      NUMERIC(6,2),
            calculated_grade_points NUMERIC(6,3),
            calculated_grade_letter TEXT,
            final_grade           TEXT,
            grade_points          NUMERIC(6,3),
            semester              TEXT NOT NULL,
            year                  INTEGER NOT NULL,
            category              TEXT DEFAULT 'General',
            notes                 TEXT,
            gpa_scale             TEXT NOT NULL DEFAULT '4.0',
            study_hours           NUMERIC(6,1) DEFAULT 0,
            difficulty_rating     INTEGER DEFAULT 3,
            personal_notes        TEXT,
            target_grade          TEXT,
            is_completed          BOOLEAN NOT NULL DEFAULT false,
            created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS assignments (
            id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            name         TEXT NOT NULL,
            type         TEXT NOT NULL DEFAULT 'Assignment',
            weight       NUMERIC(6,2) NOT NULL DEFAULT 0,
            grade        TEXT NOT NULL,
            max_grade    NUMERIC(6,2) DEFAULT 100,
            due_date     TIMESTAMPTZ,
            notes        TEXT,
            is_completed BOOLEAN NOT NULL DEFAULT false,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS study_logs (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            hours      NUMERIC(4,2) NOT NULL,
            date       DATE NOT NULL DEFAULT CURRENT_DATE,
            notes      TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    // Indexes
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token)',
        'CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token)',
        'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)',
        'CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_courses_user_semester ON courses(user_id, semester, year)',
        'CREATE INDEX IF NOT EXISTS idx_courses_user_category ON courses(user_id, category)',
        'CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id)',
        'CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, date DESC)',
        'CREATE INDEX IF NOT EXISTS idx_study_logs_user_course ON study_logs(user_id, course_id)',
    ];

    for (const idx of indexes) {
        await query(idx);
    }

    console.log('✅ Database schema migration complete');
}

module.exports = { migrate };
