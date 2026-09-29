import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logCall } from './services/supabase.js';
import {
  gmailSearch, gmailGetMessage, gmailSend, gmailCreateDraft,
  calendarListEvents, calendarCreateEvent, calendarUpdateEvent, calendarDeleteEvent,
  driveSearchFiles, driveGetFileMetadata, driveReadFileContent, driveCreateFile,
  docsGetContent, docsAppendText,
  sheetsGetValues, sheetsUpdateValues, sheetsAppendRow,
  slidesCreate, slidesAddSlide,
  tasksList, tasksCreate, tasksComplete,
} from './services/google.js';

const server = new Server(
  { name: 'google-workspace-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const TOOLS = [
  {
    name: 'gmail_search',
    description: "Search Gmail messages by query string (e.g., 'from:user@example.com is:unread').",
    inputSchema: { type: 'object', properties: { q: { type: 'string', description: 'Search query string' }, maxResults: { type: 'number', description: 'Maximum messages to return (default: 20)' } } },
  },
  {
    name: 'gmail_get_message',
    description: 'Fetch full message content and headers by Gmail message ID.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Gmail message ID' } }, required: ['id'] },
  },
  {
    name: 'gmail_send',
    description: 'Send an email message via Gmail.',
    inputSchema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' }, cc: { type: 'string' }, bcc: { type: 'string' } }, required: ['to', 'subject', 'body'] },
  },
  {
    name: 'gmail_create_draft',
    description: 'Create an email draft in Gmail without sending.',
    inputSchema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] },
  },
  {
    name: 'calendar_list_events',
    description: 'List Google Calendar events in a specified date range.',
    inputSchema: { type: 'object', properties: { calendarId: { type: 'string', default: 'primary' }, timeMin: { type: 'string' }, timeMax: { type: 'string' }, q: { type: 'string' }, maxResults: { type: 'number' } } },
  },
  {
    name: 'calendar_create_event',
    description: 'Create a new event in Google Calendar.',
    inputSchema: { type: 'object', properties: { summary: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' }, description: { type: 'string' }, location: { type: 'string' }, calendarId: { type: 'string' }, attendees: { type: 'array', items: { type: 'string' } } }, required: ['summary', 'start', 'end'] },
  },
  {
    name: 'calendar_update_event',
    description: 'Update an existing Google Calendar event.',
    inputSchema: { type: 'object', properties: { eventId: { type: 'string' }, calendarId: { type: 'string' }, summary: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' }, description: { type: 'string' }, location: { type: 'string' } }, required: ['eventId'] },
  },
  {
    name: 'calendar_delete_event',
    description: 'Delete an event from Google Calendar.',
    inputSchema: { type: 'object', properties: { eventId: { type: 'string' }, calendarId: { type: 'string' } }, required: ['eventId'] },
  },
  {
    name: 'drive_search_files',
    description: 'Search Google Drive files by name or query string.',
    inputSchema: { type: 'object', properties: { q: { type: 'string' }, pageSize: { type: 'number' } } },
  },
  {
    name: 'drive_get_file_metadata',
    description: 'Fetch metadata (name, mimeType, size, webViewLink, etc.) for a Drive file.',
    inputSchema: { type: 'object', properties: { fileId: { type: 'string', description: 'Google Drive File ID' } }, required: ['fileId'] },
  },
  {
    name: 'drive_read_file_content',
    description: 'Read text content of a Drive file (exports Docs as plain text, Sheets as CSV).',
    inputSchema: { type: 'object', properties: { fileId: { type: 'string', description: 'Google Drive File ID' } }, required: ['fileId'] },
  },
  {
    name: 'drive_create_file',
    description: 'Upload or create a new file in Google Drive.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, content: { type: 'string' }, mimeType: { type: 'string', description: "MIME type (default: 'text/plain')" }, folderId: { type: 'string' } }, required: ['name', 'content'] },
  },
  {
    name: 'docs_get_content',
    description: 'Get full plain text content of a Google Doc.',
    inputSchema: { type: 'object', properties: { documentId: { type: 'string', description: 'Google Document ID' } }, required: ['documentId'] },
  },
  {
    name: 'docs_append_text',
    description: 'Append text to the end of a Google Doc.',
    inputSchema: { type: 'object', properties: { documentId: { type: 'string' }, text: { type: 'string' } }, required: ['documentId', 'text'] },
  },
  {
    name: 'sheets_get_values',
    description: 'Read cell values from a range in a Google Sheet.',
    inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, range: { type: 'string', description: "Cell range (e.g. 'Sheet1!A1:D10')" } }, required: ['spreadsheetId', 'range'] },
  },
  {
    name: 'sheets_update_values',
    description: 'Overwrite cell values in a range of a Google Sheet.',
    inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, range: { type: 'string' }, values: { type: 'array', items: { type: 'array' } }, valueInputOption: { type: 'string', description: 'USER_ENTERED or RAW (default: USER_ENTERED)' } }, required: ['spreadsheetId', 'range', 'values'] },
  },
  {
    name: 'sheets_append_row',
    description: 'Append new rows of data to a Google Sheet.',
    inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, values: { type: 'array' }, range: { type: 'string' }, valueInputOption: { type: 'string' } }, required: ['spreadsheetId', 'values'] },
  },
  {
    name: 'slides_create',
    description: 'Create a new empty Google Slides presentation.',
    inputSchema: { type: 'object', properties: { title: { type: 'string', description: 'Title of the presentation' } }, required: ['title'] },
  },
  {
    name: 'slides_add_slide',
    description: 'Add a new slide with title and content bullets to a Google Slides presentation.',
    inputSchema: { type: 'object', properties: { presentationId: { type: 'string' }, title: { type: 'string' }, bullets: { type: 'array', items: { type: 'string' } }, body: { type: 'string' }, layout: { type: 'string', description: "Slide layout (default: 'TITLE_AND_BODY')" } }, required: ['presentationId', 'title'] },
  },
  {
    name: 'tasks_list',
    description: 'List tasks in a Google Tasks list.',
    inputSchema: { type: 'object', properties: { tasklistId: { type: 'string', default: '@default' }, maxResults: { type: 'number' }, showCompleted: { type: 'boolean' } } },
  },
  {
    name: 'tasks_create',
    description: 'Create a new task in Google Tasks.',
    inputSchema: { type: 'object', properties: { title: { type: 'string' }, tasklistId: { type: 'string' }, notes: { type: 'string' }, due: { type: 'string', description: 'Optional due date (ISO timestamp)' } }, required: ['title'] },
  },
  {
    name: 'tasks_complete',
    description: 'Mark a task as completed in Google Tasks.',
    inputSchema: { type: 'object', properties: { taskId: { type: 'string' }, tasklistId: { type: 'string', default: '@default' } }, required: ['taskId'] },
  },
];

const HANDLERS = {
  gmail_search: gmailSearch,
  gmail_get_message: gmailGetMessage,
  gmail_send: gmailSend,
  gmail_create_draft: gmailCreateDraft,
  calendar_list_events: calendarListEvents,
  calendar_create_event: calendarCreateEvent,
  calendar_update_event: calendarUpdateEvent,
  calendar_delete_event: calendarDeleteEvent,
  drive_search_files: driveSearchFiles,
  drive_get_file_metadata: driveGetFileMetadata,
  drive_read_file_content: driveReadFileContent,
  drive_create_file: driveCreateFile,
  docs_get_content: docsGetContent,
  docs_append_text: docsAppendText,
  sheets_get_values: sheetsGetValues,
  sheets_update_values: sheetsUpdateValues,
  sheets_append_row: sheetsAppendRow,
  slides_create: slidesCreate,
  slides_add_slide: slidesAddSlide,
  tasks_list: tasksList,
  tasks_create: tasksCreate,
  tasks_complete: tasksComplete,
};

server.setRequestHandler('tools/list', async () => ({ tools: TOOLS }));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  const handler = HANDLERS[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);

  const start = Date.now();
  let result, status = 'success', errorMessage;

  try {
    result = await handler(args || {});
  } catch (err) {
    status = 'error';
    errorMessage = err.message;
    result = { error: err.message };
  }

  await logCall({
    toolName: name,
    args,
    response: result,
    status,
    errorMessage,
    executionTimeMs: Date.now() - start,
  });

  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[google-workspace-mcp] server running on stdio');
}

main().catch(console.error);
