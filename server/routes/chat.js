const express = require('express');
const { auth } = require('../middleware/auth');
const { chat, clearHistory } = require('../services/agentService');

const router = express.Router();

// POST /api/chat - Send a message to the AI agent
router.post('/', auth, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                message: 'Message is required',
                code: 'MISSING_MESSAGE'
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                message: 'Message too long (max 2000 characters)',
                code: 'MESSAGE_TOO_LONG'
            });
        }

        const result = await chat(req.user.id, message.trim());

        res.json({
            response: result.response,
            toolCalls: result.toolCalls,
            code: 'CHAT_SUCCESS'
        });
    } catch (error) {
        console.error('Chat error:', error);

        if (error.message?.includes('ANTHROPIC_API_KEY')) {
            return res.status(503).json({
                message: 'AI agent is not configured. Please set ANTHROPIC_API_KEY.',
                code: 'AGENT_NOT_CONFIGURED'
            });
        }

        res.status(500).json({
            message: 'Failed to process message',
            code: 'CHAT_ERROR'
        });
    }
});

// DELETE /api/chat/history - Clear conversation history
router.delete('/history', auth, (req, res) => {
    clearHistory(req.user.id);
    res.json({
        message: 'Conversation history cleared',
        code: 'HISTORY_CLEARED'
    });
});

module.exports = router;
