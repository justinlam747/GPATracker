# Course Model & N+1 Elimination

**File:** `server/models/Course.js`

## The N+1 Problem (Before)

The original implementation fetched courses then looped to fetch assignments:

```
SELECT * FROM courses WHERE user_id = $1        -- 1 query
SELECT * FROM assignments WHERE course_id = $1   -- N queries (one per course)
```

For 10 courses, this was 11 queries. For 50 courses, 51 queries. Each round-trip to Postgres adds ~1-5ms of latency, so 50 courses = 50-250ms of pure network overhead.

## The JOIN Solution (After)

Single query fetches everything:

```sql
SELECT c.*, a.*
FROM courses c
LEFT JOIN assignments a ON a.course_id = c.id
WHERE c.user_id = $1
ORDER BY c.year DESC, c.semester ASC, c.name ASC, a.created_at ASC
```

One round-trip regardless of course count. The trade-off is more data transfer (course fields repeated per assignment row), but for typical academic loads (5-15 courses, 3-8 assignments each) this is negligible.

## Row Grouping with `groupJoinRows()`

The JOIN returns flat rows where course data repeats per assignment. `groupJoinRows()` rebuilds the tree structure:

```javascript
function groupJoinRows(rows) {
    const courseMap = new Map();
    for (const row of rows) {
        if (!courseMap.has(row.id)) {
            courseMap.set(row.id, { courseRow: row, assignmentRows: [] });
        }
        if (row.a_id) {
            courseMap.get(row.id).assignmentRows.push({ ... });
        }
    }
    return courseMap;
}
```

**Why `Map` over plain object?** `Map` preserves insertion order and has O(1) lookup. For grouped results where you iterate once, this is the fastest approach.

**Why not use a nested subquery or JSON aggregation?** Postgres supports `json_agg()` which could return assignments as a JSON array per course. This was considered but rejected because:
- `json_agg` requires `GROUP BY` on every course column (verbose)
- The JSON parse step adds overhead
- The flat JOIN approach is more portable across Postgres versions

## Lightweight Existence Checks

Many operations (grade override, study log creation, assignment CRUD) only need to verify course ownership. Loading the full course with assignments is wasteful.

```javascript
async function courseExists(id, userId) {
    const { rows } = await query(
        'SELECT id, gpa_scale FROM courses WHERE id = $1 AND user_id = $2',
        [id, userId]
    );
    return rows[0] || null;
}
```

This fetches 2 columns vs. 26 columns + assignments. Used in `addAssignment()`, `updateAssignment()`, `deleteAssignment()`, and grade override routes.

## Grade Resolution Chain

Grades can come from three sources. Resolution follows priority order:

```
gradeOverride (manual override) → calculatedGrade (from assignments) → grade (direct input) → 'N/A'
```

**Why this order?** A student might:
1. Enter a direct grade when adding a course (`grade`)
2. Later add weighted assignments, producing a `calculatedGrade`
3. Later override with the official transcript grade (`gradeOverride`)

The override always wins because it represents the final, authoritative grade.

## `attachMethods()` Pattern

```javascript
function attachMethods(course) {
    course.getFinalGrade = () => resolveCourseFinalGrade(course);
    course.shouldIncludeInGPA = () => shouldIncludeInGPA(course);
    return course;
}
```

**Why attach methods to plain objects?** The original Mongoose models had instance methods (`.getFinalGrade()`, `.shouldIncludeInGPA()`). After migrating from Mongoose to raw SQL, we needed backward compatibility — routes call `course.getFinalGrade()` without knowing the data layer changed. This is a bridge pattern that avoids rewriting all consuming code.

**Why not a class?** Classes add ceremony (`new Course(row)`) for no benefit when the object is short-lived (created per request, garbage collected immediately). Plain objects with attached functions are simpler.

## Grade Calculation

```javascript
function calculateFinalGradeFromAssignments(assignments, gpaScale) {
    let totalWeightedGrade = 0;
    let totalWeight = 0;
    for (const assignment of assignments) {
        const normalizedGrade = (gradeValue / maxGrade) * 100;
        totalWeightedGrade += normalizedGrade * weight;
        totalWeight += weight;
    }
    return totalWeightedGrade / totalWeight;
}
```

**Why normalize by `maxGrade`?** Different assignments can have different max scores (exam out of 200, quiz out of 10). Normalizing to 0-100 before weighting ensures consistent calculation.

**Why store calculated grades in the DB?** Avoids recalculating on every read. Grades only change when assignments change, so we recalculate on write (via `recalcAndReturnCourse()`) and store the result.

## Alternatives Considered

| Option | Why Rejected |
|--------|-------------|
| **Separate queries per course** | N+1 problem, 5-50x more latency |
| **Postgres `json_agg()`** | Verbose GROUP BY, JSON parse overhead |
| **GraphQL DataLoader** | Over-engineered for a REST API with 6 tables |
| **Mongoose populate** | ORM dependency, still N+1 under the hood |
| **View or materialized view** | Premature — JOIN is fast enough at current scale |
