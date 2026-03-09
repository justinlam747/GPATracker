-- Profiles table (replaces User model profile fields; auth handled by Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,              -- Supabase auth UUID
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT DEFAULT '',
    institution TEXT DEFAULT '',
    graduation_year INTEGER,
    gpa_scale TEXT NOT NULL DEFAULT '4.0' CHECK(gpa_scale IN ('4.0','4.3','letter','percentage')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Courses table (replaces Course model)
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT DEFAULT '',
    credits REAL NOT NULL CHECK(credits >= 0.5 AND credits <= 10),
    course_type TEXT NOT NULL DEFAULT 'simple' CHECK(course_type IN ('simple','detailed')),
    grade_letter TEXT,                -- e.g. 'A+', 'B-'
    grade_numeric REAL,              -- e.g. 95.0
    grade_points REAL DEFAULT 0.0,
    calculated_grade TEXT,
    calculated_grade_points REAL,
    grade_override TEXT,
    grade_override_points REAL,
    semester TEXT NOT NULL,
    year INTEGER NOT NULL CHECK(year >= 2000 AND year <= 2030),
    category TEXT DEFAULT 'General',
    notes TEXT DEFAULT '',
    gpa_scale TEXT NOT NULL DEFAULT '4.0' CHECK(gpa_scale IN ('4.0','4.3','percentage')),
    study_hours REAL DEFAULT 0,
    difficulty_rating INTEGER DEFAULT 3 CHECK(difficulty_rating >= 1 AND difficulty_rating <= 5),
    personal_notes TEXT DEFAULT '',
    target_grade TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_courses_user_semester ON courses(user_id, semester, year);
CREATE INDEX IF NOT EXISTS idx_courses_user_category ON courses(user_id, category);

-- Assignments table (replaces embedded subdocuments)
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Assignment' CHECK(type IN ('Assignment','Quiz','Exam','Project','Participation','Other')),
    weight REAL NOT NULL DEFAULT 0 CHECK(weight >= 0 AND weight <= 100),
    grade_letter TEXT,
    grade_numeric REAL,
    max_grade REAL DEFAULT 100 CHECK(max_grade >= 1),
    due_date TEXT,
    notes TEXT DEFAULT '',
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);

-- Study logs table (replaces StudyLog model)
CREATE TABLE IF NOT EXISTS study_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    hours REAL NOT NULL CHECK(hours >= 0 AND hours <= 24),
    date TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_study_logs_user_date ON study_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_study_logs_user_course ON study_logs(user_id, course_id);
