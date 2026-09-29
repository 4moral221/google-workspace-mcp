# Google Workspace MCP

MCP server that provides secure, standards-compliant access to Google Workspace resources for AI agents, including Gmail, Calendar, Drive, Docs, Sheets, Slides and Tasks.

## Overview

This project implements a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that exposes Google Workspace APIs to AI agents. It enables agents to:

- **Gmail** — search, read, send, and draft emails
- **Calendar** — list, create, update, and delete events
- **Drive** — search, read metadata, read content, and create files
- **Docs** — read content and append text
- **Sheets** — read, update, and append rows
- **Slides** — create presentations and add slides
- **Tasks** — list, create, and complete tasks

All tool calls are logged to a Supabase audit table (`mcp_call_log`) and OAuth tokens are stored in `google_tokens`.

## Architecture

```
AI Agent
  │  MCP stdio
  ▼
src/index.js                  ← MCP server (tools/list + tools/call)
  ├── src/services/google.js   ← Google API calls (googleapis)
  └── src/services/supabase.js ← Token store + audit log
        │
        ▼
  Supabase DB
    ├── google_tokens   (OAuth tokens, RLS enabled)
    └── mcp_call_log    (audit log, RLS enabled)
```

## Setup

### 1. Clone & install
```bash
git clone https://github.com/4moral221/google-workspace-mcp.git
cd google-workspace-mcp
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your Google OAuth credentials and Supabase keys
```

### 3. Set up Supabase
Run the migration against your Supabase project:
```bash
supabase db push
# or apply supabase/migrations/20250101_init_mcp.sql manually
```

### 4. Store a Google token
Insert a row into `google_tokens` with your OAuth credentials (access_token, refresh_token, expiry_date, account_email) via the Supabase dashboard or API.

### 5. Run
```bash
npm start
```

## Tools (21 total)

| Service | Tool | Description |
|---|---|---|
| Gmail | `gmail_search` | Search messages by query |
| Gmail | `gmail_get_message` | Fetch full message by ID |
| Gmail | `gmail_send` | Send an email |
| Gmail | `gmail_create_draft` | Save a draft |
| Calendar | `calendar_list_events` | List events in date range |
| Calendar | `calendar_create_event` | Create a new event |
| Calendar | `calendar_update_event` | Update an existing event |
| Calendar | `calendar_delete_event` | Delete an event |
| Drive | `drive_search_files` | Search files by name/query |
| Drive | `drive_get_file_metadata` | Get file metadata |
| Drive | `drive_read_file_content` | Read file content (plain text / CSV export) |
| Drive | `drive_create_file` | Upload a new file |
| Docs | `docs_get_content` | Get plain text of a Doc |
| Docs | `docs_append_text` | Append text to a Doc |
| Sheets | `sheets_get_values` | Read a cell range |
| Sheets | `sheets_update_values` | Overwrite a cell range |
| Sheets | `sheets_append_row` | Append rows |
| Slides | `slides_create` | Create a presentation |
| Slides | `slides_add_slide` | Add a slide |
| Tasks | `tasks_list` | List tasks |
| Tasks | `tasks_create` | Create a task |
| Tasks | `tasks_complete` | Mark task complete |

## Security

- Never commit real credentials. Use `.env` (listed in `.gitignore`).
- The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed publicly.
- Rotate any credentials if they were ever committed.
- All tables have RLS enabled. The MCP server uses the service role key to bypass RLS safely server-side.

## License

Private — UNLICENSED
