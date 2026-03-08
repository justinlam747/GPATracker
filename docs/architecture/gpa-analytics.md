# GPA Analytics & Grade Conversion

**Files:** `server/routes/gpa.js`, `server/utils/gradeConversion.js`, `client/src/utils/scaleConverter.js`

## Single-Pass Analytics (Before vs After)

### Before: O(n²) Multi-Loop

```javascript
// Overall GPA
const overall = courses.filter(c => c.shouldIncludeInGPA()).map(c => ...);
// Semester GPA — re-iterates all courses per semester
for (const sem of semesters) {
    const semCourses = courses.filter(c => c.semester === sem && c.shouldIncludeInGPA());
}
// Category GPA — re-iterates all courses per category
for (const cat of categories) {
    const catCourses = courses.filter(c => c.category === cat && c.shouldIncludeInGPA());
}
```

3 full passes over courses, plus inner filter operations = O(n × m) where m is number of unique semesters/categories.

### After: Single-Pass Accumulation

```javascript
for (const c of courses) {
    const eligible = c.shouldIncludeInGPA();
    const finalGrade = eligible ? c.getFinalGrade() : null;
    if (eligible && finalGrade && ...) {
        const entry = { gradePoints: finalGrade.gradePoints, credits: c.credits };
        overallEntries.push(entry);
        (semesterBuckets[semKey] ||= []).push(entry);
        (categoryBuckets[catKey] ||= []).push(entry);
    }
}
```

One loop. Each course is visited once. Entries are pushed into the appropriate buckets as encountered.

**Why this matters:** For a student with 40 courses across 8 semesters and 5 categories, the old approach did ~40 + (40×8) + (40×5) = 560 iterations. The new approach does 40. At scale (transcript import with 100+ courses), this difference is measurable.

## The Bucket Pattern

```javascript
const semesterBuckets = {};
const categoryBuckets = {};

// During iteration:
(semesterBuckets[semKey] ||= []).push(entry);
```

**Why `||=` over `if (!bucket[key]) bucket[key] = []`?** Shorter, same semantics, no branch. The logical OR assignment operator creates the array on first access.

**Why not `Map`?** For string keys with <50 entries, plain objects and Maps have identical performance. Objects are more readable in this context.

## Grade Conversion Architecture

Two conversion modules exist — one server-side, one client-side:

| Module | Location | Purpose |
|--------|----------|---------|
| `gradeConversion.js` | Server | Authoritative conversion during course create/update |
| `scaleConverter.js` | Client | Display-only conversion for UI (GPA badges, colors) |

**Why duplicate?** The server is the source of truth for stored grades. The client needs instant conversion for UI feedback (preview GPA while typing a grade) without a round-trip. The logic is intentionally kept simple enough that duplication is cheaper than a shared package.

## GPA Scale Support

Three scales, chosen because they cover >95% of North American universities:

### 4.0 Scale (Standard)
```
A  = 4.0 (93-100%)
A- = 3.7 (90-93%)
B+ = 3.3 (87-90%)
B  = 3.0 (83-87%)
...
F  = 0.0 (<60%)
```

### 4.3 Scale (Cornell/Extended)
```
A+ = 4.3 (97-100%)
A  = 4.0 (93-97%)
...
```

### Percentage Scale
Direct 0-100, no letter conversion.

**Why not support other scales (10-point, 5-point, UK classification)?** Scope creep. The three supported scales cover the target market. International scale support can be added later by extending the threshold tables without changing the calculation engine.

## Grade Color Mapping

```javascript
export const getGradeColorByLetter = (grade) => {
    if (g.startsWith('A')) return 'bg-green-100 text-green-800';
    if (g.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (g.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (g.startsWith('D')) return 'bg-orange-100 text-orange-800';
    if (g === 'F')         return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
};
```

**Why extract to shared utility?** This function was duplicated in 3 components (Courses.js, CourseDetail.js, Dashboard.js). Each had slightly different color mappings. Centralizing ensures consistent grade colors across the entire UI.

**Why Tailwind classes as return values?** The app uses Tailwind. Returning class strings instead of hex values keeps the function composable with existing components (`className={getGradeColorByLetter(grade)}`).

## Excluded Grades

```javascript
const EXCLUDED_GRADES = new Set(['P', 'NP', 'W', 'WD', 'WF', 'I', 'IP', 'CR', 'NC', 'AU', 'S', 'U']);
```

Pass/fail, withdrawal, incomplete, audit — none contribute to GPA. This matches how registrars calculate GPA.

**Why a `Set`?** O(1) lookup vs. O(n) array `includes()`. With 12 excluded grades, the difference is negligible, but it expresses intent: "this is a membership check."

## Zod Validation

```javascript
const courseSchema = z.object({
    name: z.string().min(1).max(100),
    credits: z.union([z.number(), z.string()]).transform(v => parseFloat(v)),
    year: z.number().int().min(2000).max(2030),
    gpaScale: z.enum(['4.0', '4.3', 'percentage']),
    // ...
});
```

**Why Zod over Joi/Yup?** Zod is TypeScript-first (better inference), smaller bundle, and supports `.transform()` for type coercion. The `credits` field accepts both strings and numbers because HTML forms submit strings — Zod transforms them at the validation boundary.

**Why validate on the server?** Client validation is for UX (instant feedback). Server validation is for security (never trust the client). Both exist but server validation is the authority.

## Dashboard Analytics: Single-Pass

The `/dashboard-analytics` endpoint computes 8 metrics in one loop:

1. Overall GPA
2. Semester-by-semester GPA trend
3. Category breakdown
4. Credits completed vs. total
5. Highest/lowest grades
6. Average difficulty rating
7. Total study hours
8. Course completion rate

**Why not separate endpoints?** The dashboard loads all 8 metrics at once. 8 separate API calls would add 8× latency. One endpoint, one database query (via `findByUser`), one loop.

## Alternatives Considered

| Option | Why Rejected |
|--------|-------------|
| **Separate analytics endpoint per metric** | 8× round-trip latency for dashboard load |
| **Database-level GPA calculation** | SQL `CASE WHEN` for grade conversion is fragile and hard to maintain |
| **Materialized views for analytics** | Over-engineered; single-pass in-memory is fast enough for <1000 courses |
| **Shared npm package for grade conversion** | Monorepo tooling overhead; duplication is acceptable for <200 lines |
| **GraphQL** | Dashboard needs all fields — no benefit from selective field queries |
