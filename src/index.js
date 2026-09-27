const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const server = new Server({ name: 'google-workspace-mcp', version: '0.1.0' }, { capabilities: { tools: {} } });

server.setRequestHandler('tools/list', async () => ({
  tools: [
    { name: 'gmail_list', description: 'List Gmail messages' },
    { name: 'calendar_list', description: 'List Calendar events' },
    { name: 'drive_list', description: 'List Drive files' }
  ]
}));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Google Workspace MCP server running');
}
main().catch(console.error);
