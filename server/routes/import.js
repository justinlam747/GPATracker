const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const { auth } = require('../middleware/auth');
const { parseTranscript } = require('../services/transcriptParser');
const { parseSyllabus } = require('../services/syllabusParser');
const { searchTemplates, getDepartments, getByDepartment, getById } = require('../services/courseTemplates');

const router = express.Router();

// Multer config: memory storage, 5MB limit, PDF/text only
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'text/plain', 'text/csv'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and text files are allowed'));
        }
    }
});

/**
 * Extract text from uploaded file (PDF or plain text)
 */
async function extractText(file) {
    if (file.mimetype === 'application/pdf') {
        const data = await pdf(file.buffer);
        return data.text;
    }
    return file.buffer.toString('utf-8');
}

// ── Transcript Parsing ────────────────────────────────────────────────────

// POST /api/import/transcript/parse - Parse transcript file or text
router.post('/transcript/parse', auth, upload.single('file'), async (req, res) => {
    try {
        let text;

        if (req.file) {
            text = await extractText(req.file);
        } else if (req.body.text) {
            text = req.body.text;
        } else {
            return res.status(400).json({
                message: 'Provide a file upload or text field',
                code: 'NO_INPUT'
            });
        }

        const result = parseTranscript(text);

        res.json({
            courses: result.courses,
            metadata: result.metadata,
            code: 'TRANSCRIPT_PARSED'
        });
    } catch (error) {
        console.error('Transcript parse error:', error);

        if (error.message === 'Only PDF and text files are allowed') {
            return res.status(400).json({ message: error.message, code: 'INVALID_FILE_TYPE' });
        }

        res.status(500).json({
            message: 'Failed to parse transcript',
            code: 'TRANSCRIPT_PARSE_ERROR'
        });
    }
});

// ── Syllabus Parsing ──────────────────────────────────────────────────────

// POST /api/import/syllabus/parse - Parse syllabus file or text
router.post('/syllabus/parse', auth, upload.single('file'), async (req, res) => {
    try {
        let text;

        if (req.file) {
            text = await extractText(req.file);
        } else if (req.body.text) {
            text = req.body.text;
        } else {
            return res.status(400).json({
                message: 'Provide a file upload or text field',
                code: 'NO_INPUT'
            });
        }

        const result = parseSyllabus(text);

        res.json({
            markingScheme: result.markingScheme,
            metadata: result.metadata,
            code: 'SYLLABUS_PARSED'
        });
    } catch (error) {
        console.error('Syllabus parse error:', error);

        if (error.message === 'Only PDF and text files are allowed') {
            return res.status(400).json({ message: error.message, code: 'INVALID_FILE_TYPE' });
        }

        res.status(500).json({
            message: 'Failed to parse syllabus',
            code: 'SYLLABUS_PARSE_ERROR'
        });
    }
});

// ── Course Templates ──────────────────────────────────────────────────────

// GET /api/import/templates/search?q=computer+science
router.get('/templates/search', auth, (req, res) => {
    const { q } = req.query;
    const results = searchTemplates(q || '');

    res.json({
        templates: results,
        count: results.length,
        code: 'TEMPLATES_FOUND'
    });
});

// GET /api/import/templates/departments
router.get('/templates/departments', auth, (req, res) => {
    res.json({
        departments: getDepartments(),
        code: 'DEPARTMENTS_RETRIEVED'
    });
});

// GET /api/import/templates/department/:name
router.get('/templates/department/:name', auth, (req, res) => {
    const templates = getByDepartment(req.params.name);

    res.json({
        templates,
        count: templates.length,
        code: 'DEPARTMENT_TEMPLATES_RETRIEVED'
    });
});

// GET /api/import/templates/:id
router.get('/templates/:id', auth, (req, res) => {
    const template = getById(req.params.id);

    if (!template) {
        return res.status(404).json({
            message: 'Template not found',
            code: 'TEMPLATE_NOT_FOUND'
        });
    }

    res.json({
        template,
        code: 'TEMPLATE_RETRIEVED'
    });
});

// Handle multer errors
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum size is 5MB.',
                code: 'FILE_TOO_LARGE'
            });
        }
        return res.status(400).json({
            message: err.message,
            code: 'UPLOAD_ERROR'
        });
    }
    if (err.message === 'Only PDF and text files are allowed') {
        return res.status(400).json({
            message: err.message,
            code: 'INVALID_FILE_TYPE'
        });
    }
    next(err);
});

module.exports = router;
