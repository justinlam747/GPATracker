/**
 * MCP Server
 *
 * Exposes all platform operations as MCP (Model Context Protocol) tools.
 * Can be run as a standalone stdio server for external MCP clients,
 * or imported for in-process use.
 *
 * Usage (stdio):  node server/mcp/server.js
 * Usage (import): const { mcpServer } = require('./mcp/server');
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { tools } = require('./tools');
const { executeTool } = require('./executor');

function createMcpServer(userId) {
    const server = new McpServer({
        name: 'gpa-tracker',
        version: '1.0.0'
    });

    // Register each tool with the MCP server
    for (const tool of tools) {
        const paramSchema = {};
        if (tool.parameters?.properties) {
            for (const [key, prop] of Object.entries(tool.parameters.properties)) {
                const zodType = {
                    type: prop.type === 'number' ? 'number' : prop.type === 'boolean' ? 'boolean' : 'string',
                    description: prop.description || key
                };
                paramSchema[key] = zodType;
            }
        }

        server.tool(
            tool.name,
            tool.description,
            tool.parameters?.properties || {},
            async (args) => {
                const result = await executeTool(tool.name, args, userId);
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(result.data || { error: result.error }, null, 2)
                    }]
                };
            }
        );
    }

    return server;
}

// Run as standalone stdio server if executed directly
if (require.main === module) {
    const userId = process.env.MCP_USER_ID;
    if (!userId) {
        console.error('MCP_USER_ID environment variable is required');
        process.exit(1);
    }

    // Load environment
    require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

    const server = createMcpServer(userId);
    const transport = new StdioServerTransport();
    server.connect(transport).then(() => {
        console.error('GPA Tracker MCP server running on stdio');
    });
}

module.exports = { createMcpServer };
