# Import System: Transcript, Syllabus, Templates

**Files:** `server/services/transcriptParser.js`, `server/services/syllabusParser.js`, `server/services/courseTemplates.js`, `server/routes/import.js`

## Architecture: Strategy Pattern

All three parsers follow the same design: try multiple extraction strategies, pick the best result.

```
Input Text → [Strategy 1, Strategy 2, Strategy 3] → Best Result (most items found)
```

**Why multiple strategies?** University documents have no standard format. A transcript from MIT looks nothing like one from a community college. Instead of building one fragile regex, we try three approaches and let the results speak.

**Why "most items found" as the selection criteria?** A false-positive parser (finds courses that don't exist) is worse than a false-negative parser (misses some courses), but in practice, the strategy that finds the most valid course patterns is correct. Users can review and deselect false positives in the preview step.

## Transcript Parser

### Three Strategies

1. **Tabular** — Aligned columns: `CS101    Intro to CS    3.0    A`
   - Best for PDF transcripts that preserve column alignment
   - Regex: `/^([A-Z]{2,5}\s*\d{3,4}[A-Z]?)\s{2,}(.+?)\s{2,}(\d+\.?\d*)\s{2,}([A-F][+-]?|...)\s*$/`

2. **Inline** — Delimited fields: `CS101 - Intro to CS - 3 credits - Grade: A`
   - Best for hand-typed or reformatted transcripts
   - Handles various separators: `-`, `–`, `:`

3. **Space-separated** — Flexible parsing: `CS101 Intro to CS 3 A`
   - Most resilient fallback
   - Scans tokens for course code pattern, then identifies grade (letter) and credits (number 0.5-10)
   - Accumulates remaining tokens as the course name

### Semester Context Enrichment

Transcripts typically have section headers like "Fall 2024" followed by courses for that term. The parser scans for these headers and applies the most recent semester/year context to subsequent courses.

```
Fall 2024              ← detected as semester context
CS101  Intro  3.0  A   ← tagged as Fall 2024
MATH201  LA  3.0  B+   ← tagged as Fall 2024

Spring 2025            ← context updates
CS201  DS  3.0  A      ← tagged as Spring 2025
```

**Why not require semester in each line?** Most transcripts don't repeat the semester for every course. The section-header pattern is universal.

### Deduplication

```javascript
const key = `${c.code}-${c.semester}-${c.year}`;
```

Same course code + semester + year = duplicate. This handles the case where multiple parsing strategies find the same course, or where the transcript repeats a course (e.g., grade change notation).

## Syllabus Parser

### Grading Section Detection

Before parsing percentages, the parser finds the grading section:

```javascript
const sectionHeaders = [
    /grading\s*(breakdown|scheme|criteria|policy)?/i,
    /assessment\s*(breakdown|scheme|criteria)?/i,
    /evaluation\s*(breakdown|scheme|criteria)?/i,
    /marking\s*(scheme|breakdown)/i,
    // ...
];
```

Scans up to 30 lines after the header, stopping at the next major section. This prevents false matches from unrelated percentages (e.g., "95% of students pass this course").

**Why 30 lines?** Most grading breakdowns fit in 5-15 lines. 30 lines provides margin for verbose syllabi with descriptions per component.

### Three Extraction Strategies

1. **Percentage patterns**: `Assignments: 30%`, `Midterm (25%)`, `Final - 40%`
2. **Table patterns**: `| Midterm | 30 |` (pipe-delimited)
3. **Bullet patterns**: `• Assignments worth 20% of final grade`

### Confidence Scoring

```javascript
const total = items.reduce((s, i) => s + i.weight, 0);
const confidence = total >= 95 && total <= 105 ? 0.9 : total > 50 ? 0.6 : 0.3;
```

**Why score confidence?** Tells the user how much to trust the parsed result. If weights sum to 100%, the parser probably found the correct grading section. If weights sum to 40%, something was missed — user should review carefully.

### Assignment Type Inference

```javascript
const ASSIGNMENT_TYPE_MAP = {
    'homework': 'Assignment',
    'midterm': 'Exam',
    'lab': 'Project',
    'participation': 'Participation',
    // 25+ mappings
};
```

**Why keyword mapping over ML classification?** A static map handles 95% of cases, has zero latency, and requires no model training or API calls. The 5% edge cases are handled by the user in the preview editor.

### Weight Normalization

If weights sum to 80-120%, scale proportionally to 100%. This handles rounding errors in syllabi (e.g., "Assignments: 33%", "Midterm: 33%", "Final: 33%" = 99%).

**Why not always normalize?** If weights sum to 40%, something is genuinely wrong (missing components). Normalizing would inflate each weight incorrectly. Only normalize within a reasonable tolerance.

## Course Templates

### 16 Curated Templates

Organized by department: Computer Science (3), Engineering (1), Mathematics (2), Sciences (2), Business (2), Humanities (1), Social Sciences (1), Languages (1), Health Sciences (1), Generic (3).

**Why curated over crowdsourced/scraped?**
- Scraped syllabi have copyright concerns
- Crowdsourced data needs moderation
- 16 templates cover the majority of use cases
- Users can customize weights before applying

### Search Scoring

```javascript
// Exact name match: +10
// Department match: +8
// Keyword match: +5
// Partial token match: +3
```

**Why scored ranking over exact match?** A search for "cs" should return CS templates first, but also show generic templates. Scored ranking provides a relevance-ordered list instead of binary match/no-match.

**Why not full-text search?** With 16 templates, a weighted keyword scan is instant. Full-text search (tsvector) would be over-engineered.

## File Upload Handling

```javascript
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'text/plain', 'text/csv'];
        ...
    }
});
```

**Why memory storage over disk?** Files are processed immediately and discarded. Writing to disk then reading back adds I/O latency. 5MB in memory is negligible.

**Why 5MB limit?** A typical transcript PDF is 50-200KB. A syllabus PDF is 100-500KB. 5MB provides generous headroom while preventing abuse (uploading large files to exhaust server memory).

**Why whitelist MIME types?** Defense in depth. Even though `pdf-parse` only processes PDFs, validating at the upload layer prevents processing malicious files.

## PDF Text Extraction

```javascript
const pdf = require('pdf-parse');
async function extractText(file) {
    if (file.mimetype === 'application/pdf') {
        const data = await pdf(file.buffer);
        return data.text;
    }
    return file.buffer.toString('utf-8');
}
```

**Why `pdf-parse`?** Lightweight (no native dependencies), works in memory, extracts text reliably from standard PDFs. Doesn't handle scanned/image PDFs — those would need OCR (Tesseract), which is out of scope.

**Known limitation:** Scanned transcripts (image-based PDFs) won't parse. The user should paste text manually in that case. Adding OCR would require a 50MB+ Tesseract dependency.

## Alternatives Considered

| Option | Why Rejected |
|--------|-------------|
| **AI/LLM-based parsing** | Adds API cost, latency, and external dependency for a deterministic task |
| **OCR for scanned PDFs** | Tesseract is 50MB+, complex to deploy, and slow |
| **Scraping university sites** | Copyright issues, fragile selectors, rate limiting |
| **Community-submitted templates** | Needs moderation infrastructure, abuse potential |
| **Single parsing strategy** | Too fragile — no single regex handles all transcript formats |
| **Disk-based file storage** | Files are transient; memory is simpler and faster |
