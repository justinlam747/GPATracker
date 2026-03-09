/**
 * Syllabus Parser Service
 *
 * Extracts grading/marking scheme from syllabus text.
 * Looks for patterns like "Midterm Exam: 30%", "Assignments (20%)", etc.
 */

const ASSIGNMENT_TYPE_MAP = {
    'assignment': 'Assignment',
    'assignments': 'Assignment',
    'homework': 'Assignment',
    'homeworks': 'Assignment',
    'hw': 'Assignment',
    'problem set': 'Assignment',
    'problem sets': 'Assignment',
    'pset': 'Assignment',
    'quiz': 'Quiz',
    'quizzes': 'Quiz',
    'test': 'Exam',
    'tests': 'Exam',
    'exam': 'Exam',
    'exams': 'Exam',
    'midterm': 'Exam',
    'midterms': 'Exam',
    'mid-term': 'Exam',
    'final': 'Exam',
    'final exam': 'Exam',
    'final examination': 'Exam',
    'project': 'Project',
    'projects': 'Project',
    'term project': 'Project',
    'capstone': 'Project',
    'lab': 'Project',
    'labs': 'Project',
    'laboratory': 'Project',
    'participation': 'Participation',
    'attendance': 'Participation',
    'class participation': 'Participation',
    'discussion': 'Participation',
    'presentation': 'Other',
    'presentations': 'Other',
    'paper': 'Other',
    'essay': 'Other',
    'report': 'Other',
    'portfolio': 'Other',
    'peer review': 'Other'
};

/**
 * Parse syllabus text and extract grading breakdown.
 * Returns { markingScheme: [...], metadata: { ... } }
 */
function parseSyllabus(text) {
    if (!text || typeof text !== 'string') {
        return { markingScheme: [], metadata: { confidence: 0 } };
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Find the grading section
    const gradingSection = extractGradingSection(lines);

    // Try multiple extraction strategies
    const strategies = [
        extractPercentagePatterns,
        extractTablePatterns,
        extractBulletPatterns
    ];

    let bestResult = { items: [], confidence: 0 };

    for (const strategy of strategies) {
        const result = strategy(gradingSection.length > 0 ? gradingSection : lines);
        if (result.items.length > bestResult.items.length) {
            bestResult = result;
        }
    }

    // Normalize weights to sum to 100 if close
    const normalized = normalizeWeights(bestResult.items);

    return {
        markingScheme: normalized.map(item => ({
            name: item.name,
            type: inferAssignmentType(item.name),
            weight: item.weight
        })),
        metadata: {
            confidence: bestResult.confidence,
            totalWeight: normalized.reduce((s, i) => s + i.weight, 0),
            itemsFound: normalized.length
        }
    };
}

/**
 * Extract lines that belong to the grading/assessment section
 */
function extractGradingSection(lines) {
    const sectionHeaders = [
        /grading\s*(breakdown|scheme|criteria|policy|structure|scale)?/i,
        /grade\s*(breakdown|distribution|allocation|components)/i,
        /assessment\s*(breakdown|scheme|criteria|methods|components)?/i,
        /evaluation\s*(breakdown|scheme|criteria|methods)?/i,
        /course\s*(assessment|evaluation|grading|marks)/i,
        /marking\s*(scheme|breakdown|criteria)/i,
        /basis\s*for\s*grading/i,
        /how\s*(your|the)?\s*grade\s*is\s*(determined|calculated)/i,
        /weighting|weightage/i
    ];

    let startIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (sectionHeaders.some(p => p.test(lines[i]))) {
            startIdx = i;
            break;
        }
    }

    if (startIdx === -1) return [];

    // Capture lines until the next major section header or end
    const nextSectionPattern = /^(course\s*(description|objectives|schedule|policies|outline)|prerequisites|textbook|academic\s*integrity|late\s*policy|disability|important\s*dates|schedule|office\s*hours|contact)/i;

    const section = [];
    for (let i = startIdx + 1; i < lines.length && i < startIdx + 30; i++) {
        if (nextSectionPattern.test(lines[i]) && section.length > 2) break;
        section.push(lines[i]);
    }

    return section;
}

/**
 * Strategy 1: Look for "Component: X%" or "Component (X%)" patterns
 */
function extractPercentagePatterns(lines) {
    const items = [];
    // Matches: "Midterm Exam: 30%", "Assignments (20%)", "Final - 40%", "Labs 10 %"
    const pattern = /^[•\-*·▪]?\s*(.+?)\s*[:–\-=(\s]\s*(\d+(?:\.\d+)?)\s*%/;

    for (const line of lines) {
        const match = line.match(pattern);
        if (match) {
            const name = match[1]
                .replace(/[:\-–=]+$/, '')
                .replace(/^\d+[.)]\s*/, '') // remove leading numbering
                .trim();
            const weight = parseFloat(match[2]);

            if (name.length > 0 && name.length < 80 && weight > 0 && weight <= 100) {
                items.push({ name, weight });
            }
        }
    }

    // Also check for "X% Component" format
    const reversePattern = /^[•\-*·▪]?\s*(\d+(?:\.\d+)?)\s*%\s*[-–:]?\s*(.+)/;
    if (items.length === 0) {
        for (const line of lines) {
            const match = line.match(reversePattern);
            if (match) {
                const weight = parseFloat(match[1]);
                const name = match[2].trim();
                if (name.length > 0 && name.length < 80 && weight > 0 && weight <= 100) {
                    items.push({ name, weight });
                }
            }
        }
    }

    const total = items.reduce((s, i) => s + i.weight, 0);
    const confidence = total >= 95 && total <= 105 ? 0.9 : total > 50 ? 0.6 : 0.3;

    return { items, confidence };
}

/**
 * Strategy 2: Table-like format with aligned columns
 */
function extractTablePatterns(lines) {
    const items = [];
    // Match table rows like: "Midterm Exam    30"  or  "Assignments | 20%"
    const pattern = /^[|│]?\s*(.+?)\s*[|│]\s*(\d+(?:\.\d+)?)\s*%?\s*[|│]?\s*$/;

    for (const line of lines) {
        const match = line.match(pattern);
        if (match) {
            const name = match[1].trim();
            const weight = parseFloat(match[2]);
            if (name.length > 0 && name.length < 80 && weight > 0 && weight <= 100 && !/^[-=_|]+$/.test(name)) {
                items.push({ name, weight });
            }
        }
    }

    const total = items.reduce((s, i) => s + i.weight, 0);
    const confidence = total >= 95 && total <= 105 ? 0.85 : 0.4;

    return { items, confidence };
}

/**
 * Strategy 3: Bullet-point style with percentages embedded
 */
function extractBulletPatterns(lines) {
    const items = [];

    for (const line of lines) {
        // Match: "• Assignments worth 20% of final grade"
        // or: "1. Midterm (25% of total)"
        const match = line.match(/^[\d.)\-•*·▪]\s*(.+?)\s+(?:worth\s+|=\s*|is\s+)?(\d+(?:\.\d+)?)\s*%/i);
        if (match) {
            const name = match[1].replace(/[:–\-]+$/, '').trim();
            const weight = parseFloat(match[2]);
            if (name.length > 0 && name.length < 80 && weight > 0 && weight <= 100) {
                items.push({ name, weight });
            }
        }
    }

    const total = items.reduce((s, i) => s + i.weight, 0);
    const confidence = total >= 95 && total <= 105 ? 0.8 : 0.3;

    return { items, confidence };
}

/**
 * Infer assignment type from name
 */
function inferAssignmentType(name) {
    const lower = name.toLowerCase();

    // Check exact and partial matches
    for (const [keyword, type] of Object.entries(ASSIGNMENT_TYPE_MAP)) {
        if (lower === keyword || lower.includes(keyword)) {
            return type;
        }
    }

    return 'Other';
}

/**
 * Normalize weights to sum to exactly 100 if they're close
 */
function normalizeWeights(items) {
    if (items.length === 0) return items;

    const total = items.reduce((s, i) => s + i.weight, 0);

    // If already 100 or close, leave as-is or scale slightly
    if (total >= 99 && total <= 101) {
        return items;
    }

    // If within reasonable range, scale to 100
    if (total >= 80 && total <= 120) {
        const factor = 100 / total;
        return items.map(i => ({
            ...i,
            weight: Math.round(i.weight * factor * 10) / 10
        }));
    }

    // Otherwise return as-is — user will need to adjust
    return items;
}

module.exports = { parseSyllabus };
