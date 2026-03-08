/**
 * LangChain Agent Service
 *
 * Creates a conversational agent powered by Claude (or configurable LLM)
 * with tools that map to platform MCP operations.
 * Handles multi-turn conversations with tool calling.
 */

const { ChatAnthropic } = require('@langchain/anthropic');
const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const { tools: toolDefinitions } = require('../mcp/tools');
const { executeTool } = require('../mcp/executor');

// In-memory conversation store (per user)
const conversationStore = new Map();

const SYSTEM_PROMPT = `You are GPA Buddy, an AI assistant for the GPA Tracker platform. You help students manage their academic courses, grades, and GPA.

You have access to tools that let you:
- List, create, update, and delete courses
- Add and manage assignments with weighted grading schemes
- Calculate and display GPA summaries (overall, by semester, by category)
- Parse transcripts to bulk-import courses
- Parse syllabi to auto-detect grading breakdowns
- Search and apply course marking scheme templates
- Override grades and view analytics

When helping students:
1. Be concise and friendly. Students are busy.
2. When creating courses, always confirm the details before proceeding.
3. When importing transcripts or syllabi, show what was detected and ask for confirmation.
4. Proactively suggest useful actions (e.g., "Want me to set up the marking scheme for this course?").
5. When discussing GPA, be encouraging but honest.
6. Use the tools to take real actions — don't just describe what could be done.

If asked about something outside of academic/GPA tracking, politely redirect to how you can help with their courses and grades.`;

/**
 * Convert our tool definitions to LangChain tool format
 */
function buildLangChainTools(userId) {
    return toolDefinitions.map(def => {
        // Build a Zod schema from the tool parameters
        const schemaShape = {};
        const props = def.parameters?.properties || {};

        for (const [key, prop] of Object.entries(props)) {
            let zodField;
            if (prop.type === 'number') {
                zodField = z.number().optional().describe(prop.description || key);
            } else if (prop.type === 'boolean') {
                zodField = z.boolean().optional().describe(prop.description || key);
            } else if (prop.type === 'array') {
                zodField = z.array(z.any()).optional().describe(prop.description || key);
            } else {
                zodField = z.string().optional().describe(prop.description || key);
            }

            // Make required fields non-optional
            if (def.parameters?.required?.includes(key)) {
                if (prop.type === 'number') {
                    zodField = z.number().describe(prop.description || key);
                } else if (prop.type === 'boolean') {
                    zodField = z.boolean().describe(prop.description || key);
                } else if (prop.type === 'array') {
                    zodField = z.array(z.any()).describe(prop.description || key);
                } else {
                    zodField = z.string().describe(prop.description || key);
                }
            }

            schemaShape[key] = zodField;
        }

        const schema = Object.keys(schemaShape).length > 0
            ? z.object(schemaShape)
            : z.object({});

        return tool(
            async (args) => {
                const result = await executeTool(def.name, args, userId);
                return JSON.stringify(result, null, 2);
            },
            {
                name: def.name,
                description: def.description,
                schema
            }
        );
    });
}

/**
 * Create or retrieve an agent for a user session.
 */
function getOrCreateAgent(userId) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required for the AI agent');
    }

    const llm = new ChatAnthropic({
        model: 'claude-sonnet-4-20250514',
        anthropicApiKey: apiKey,
        temperature: 0.3,
        maxTokens: 4096
    });

    const langchainTools = buildLangChainTools(userId);
    const agent = createReactAgent({
        llm,
        tools: langchainTools
    });

    return agent;
}

/**
 * Send a message to the agent and get a response.
 * Maintains conversation history per user.
 */
async function chat(userId, message) {
    const agent = getOrCreateAgent(userId);

    // Get or initialize conversation history
    if (!conversationStore.has(userId)) {
        conversationStore.set(userId, []);
    }
    const history = conversationStore.get(userId);

    // Build messages
    const messages = [
        new SystemMessage(SYSTEM_PROMPT),
        ...history,
        new HumanMessage(message)
    ];

    // Invoke agent
    const result = await agent.invoke({ messages });

    // Extract the final AI response
    const responseMessages = result.messages;
    const lastMessage = responseMessages[responseMessages.length - 1];
    const responseText = typeof lastMessage.content === 'string'
        ? lastMessage.content
        : lastMessage.content.map(c => c.type === 'text' ? c.text : '').join('');

    // Collect tool calls made during this turn
    const toolCalls = responseMessages
        .filter(m => m.tool_calls?.length > 0)
        .flatMap(m => m.tool_calls.map(tc => ({
            tool: tc.name,
            args: tc.args
        })));

    // Update conversation history (keep last 20 messages to prevent unbounded growth)
    history.push(new HumanMessage(message));
    history.push(new AIMessage(responseText));
    if (history.length > 40) {
        history.splice(0, history.length - 40);
    }

    return {
        response: responseText,
        toolCalls
    };
}

/**
 * Clear conversation history for a user.
 */
function clearHistory(userId) {
    conversationStore.delete(userId);
}

module.exports = { chat, clearHistory };
