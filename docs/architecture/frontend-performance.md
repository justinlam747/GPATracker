# Frontend Performance

**Files:** `client/src/App.js`, `client/src/components/Courses.js`, `client/src/utils/scaleConverter.js`

## Code Splitting with React.lazy

```javascript
const CourseDetail = lazy(() => import('./components/CourseDetail'));
const Courses = lazy(() => import('./components/Courses'));
// ... 11 route components lazy-loaded

<Suspense fallback={<PageLoader />}>
    <Routes>...</Routes>
</Suspense>
```

**The problem:** All 11 route components were eagerly imported. A user visiting `/login` downloaded code for `/courses`, `/calendar`, `/settings`, etc. — ~100KB+ of unused JavaScript.

**The fix:** `React.lazy` + dynamic `import()` splits each route into its own chunk. The browser only downloads the chunk when the user navigates to that route.

**Why not split at component level (e.g., every card, modal)?** Route-level splitting gives the best bang-for-buck. Sub-route splitting adds loading states inside pages, which feels janky. Route boundaries are natural loading points where a spinner is expected.

**Why `Suspense` with a spinner instead of skeleton screens?** Simpler to implement, and route transitions are fast enough (<200ms on most connections) that a spinner doesn't degrade UX. Skeleton screens are better for slow data fetches, not code loading.

## React.memo for List Items

```javascript
const StatCard = React.memo(({ label, value, Icon }) => (
    <div>...</div>
));

const CourseCard = React.memo(({ course, userScale, onView, onRevertOverride, onDelete }) => {
    // Computes GPA internally
    return <div>...</div>;
});
```

**The problem:** When any state changed in the Courses component (search query, filter, modal open), all CourseCards re-rendered. With 50 courses, this meant 50 unnecessary renders per keystroke.

**The fix:** `React.memo` does shallow prop comparison. If a CourseCard's `course` object reference hasn't changed, it skips rendering.

**Why not `React.memo` everything?** Memo has overhead (prop comparison cost). Only memo components that:
1. Render frequently (list items)
2. Have expensive render logic (GPA calculation inside CourseCard)
3. Are children of components with frequently-changing state

StatCard and CourseCard fit all three criteria. Small, rarely-changing components (Footer, Navbar) don't benefit.

### Why CourseCard computes its own GPA

```javascript
const CourseCard = React.memo(({ course, userScale, ... }) => {
    const gpaValue = percentageToGPA(percentage, userScale);
    const formattedGPA = formatGPA(gpaValue, userScale);
    return <div>...</div>;
});
```

**Original design:** Parent computed GPA for each course and passed it as a prop. This meant the parent's GPA callback changed on every render (new function reference), defeating `React.memo`.

**Current design:** CourseCard receives stable props (`course` object, `userScale` string) and computes GPA internally. Since `percentageToGPA` is a pure function, this is deterministic and fast.

## useCallback for Event Handlers

```javascript
const handleCourseAdded = useCallback((newCourse) => {
    setCourses(prev => [...prev, newCourse]);
}, []);

const handleDeleteCourse = useCallback(async (courseId) => {
    await api.delete(`/gpa/courses/${courseId}`);
    setCourses(prev => prev.filter(c => c.id !== courseId));
}, []);
```

**Why?** Without `useCallback`, these functions are recreated on every render. Since they're passed as props to memoized `CourseCard` components, new references would defeat `React.memo`.

**Why empty dependency arrays?** These handlers use functional state updates (`prev => ...`) instead of referencing `courses` directly. This means they don't depend on the current courses array and never need to be recreated.

## useMemo for Derived Data

```javascript
const filteredCourses = useMemo(() => {
    return courses.filter(c => {
        if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterSemester && c.semester !== filterSemester) return false;
        if (filterYear && c.year !== parseInt(filterYear)) return false;
        return true;
    });
}, [courses, searchTerm, filterSemester, filterYear]);

const stats = useMemo(() => {
    return {
        totalCourses: courses.length,
        totalCredits: courses.reduce((sum, c) => sum + c.credits, 0),
        // ...
    };
}, [courses]);
```

**Why?** Without `useMemo`, filtering and stats are recalculated on every render — even when unrelated state changes (like modal open/close). With 50 courses, filtering is cheap. With 200 courses from transcript import, it adds up.

**Rule:** Memoize when the computation result is passed to memoized children or involves iteration over a collection.

## Shared Utility: getGradeColorByLetter

```javascript
// client/src/utils/scaleConverter.js
export const getGradeColorByLetter = (grade) => {
    if (g.startsWith('A')) return 'bg-green-100 text-green-800';
    if (g.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (g.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    if (g.startsWith('D')) return 'bg-orange-100 text-orange-800';
    if (g === 'F')         return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
};
```

**The problem:** This function was copy-pasted in 3 components with slight variations (one used `bg-emerald`, another used `bg-green`, one returned hex colors). Inconsistent grade colors across pages.

**The fix:** Single source of truth in `scaleConverter.js`. All components import the same function.

**Why in scaleConverter.js?** It's the existing grade utility module. Adding a related function here is more discoverable than creating a new `gradeColors.js` file.

## Performance Optimization Checklist

When adding new features, check:

| Question | Action |
|----------|--------|
| New route component? | Add `React.lazy` import in App.js |
| Renders in a list? | Wrap with `React.memo` |
| Handler passed to memoized child? | Wrap with `useCallback` |
| Derived data from state? | Wrap with `useMemo` if passed to memoized children |
| Color/formatting function? | Check `scaleConverter.js` before creating new one |
| New API call on mount? | Consider if data can be batched with existing calls |

## What Was NOT Optimized (And Why)

| Component | Why Not |
|-----------|---------|
| **Navbar** | Renders once, no list items, minimal props |
| **Footer** | Static content, never re-renders |
| **Login/Register** | Visited once per session, small component |
| **Modal components** | Mounted/unmounted (not re-rendered), short-lived |

Over-memoizing wastes developer time and adds cognitive overhead. Only optimize components where profiling shows a problem or where the pattern is obvious (list items in a frequently-updating parent).

## Alternatives Considered

| Option | Why Rejected |
|--------|-------------|
| **Virtualization (react-window)** | Overkill for <200 courses; adds complexity for scrollable lists |
| **Server-side rendering** | This is a SPA with JWT auth; SSR adds infra complexity for no SEO benefit |
| **Service worker caching** | Premature; initial load is already fast with code splitting |
| **Zustand/Jotai over Context** | AuthContext is the only global state; a state library is overhead |
| **Component-level code splitting** | Route-level gives 90% of the benefit with none of the loading-state complexity |
