export interface Env {
  DB: D1Database;
  SUPABASE_JWT_SECRET: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface ProfileRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  institution: string;
  graduation_year: number | null;
  gpa_scale: string;
  created_at: string;
  updated_at: string;
}

export interface CourseRow {
  id: number;
  user_id: string;
  name: string;
  code: string;
  credits: number;
  course_type: string;
  grade_letter: string | null;
  grade_numeric: number | null;
  grade_points: number;
  calculated_grade: string | null;
  calculated_grade_points: number | null;
  grade_override: string | null;
  grade_override_points: number | null;
  semester: string;
  year: number;
  category: string;
  notes: string;
  gpa_scale: string;
  study_hours: number;
  difficulty_rating: number;
  personal_notes: string;
  target_grade: string | null;
  is_completed: number;
  created_at: string;
  updated_at: string;
}

export interface AssignmentRow {
  id: number;
  course_id: number;
  name: string;
  type: string;
  weight: number;
  grade_letter: string | null;
  grade_numeric: number | null;
  max_grade: number;
  due_date: string | null;
  notes: string;
  is_completed: number;
  created_at: string;
  updated_at: string;
}

export interface StudyLogRow {
  id: number;
  user_id: string;
  course_id: number;
  hours: number;
  date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// camelCase response types for API output

export interface CourseResponse {
  id: number;
  name: string;
  code: string;
  credits: number;
  courseType: string;
  grade: string | number | undefined;
  gradePoints: number;
  calculatedGrade: string | null;
  calculatedGradePoints: number | null;
  gradeOverride: string | number | undefined;
  gradeOverridePoints: number | null;
  semester: string;
  year: number;
  category: string;
  notes: string;
  gpaScale: string;
  studyHours: number;
  difficultyRating: number;
  personalNotes: string;
  targetGrade: string | null;
  isCompleted: boolean;
  assignments: AssignmentResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentResponse {
  id: number;
  courseId: number;
  name: string;
  type: string;
  weight: number;
  grade: string | number;
  maxGrade: number;
  dueDate: string | null;
  notes: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyLogResponse {
  id: number;
  userId: string;
  courseId: number;
  hours: number;
  date: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
