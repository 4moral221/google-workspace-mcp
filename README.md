# Google Workspace MCP

MCP server that provides secure, standards-compliant access to Google Workspace resources for AI agents, including Gmail, Calendar, Drive, Docs, Sheets, Slides and Tasks.

## Overview

This project implements a Model Context Protocol server that exposes Google Workspace APIs to AI agents. It enables agents to read and write Gmail messages, manage Calendar events, access Drive files, read and edit Docs/Sheets/Slides, and interact with Tasks — all through a unified MCP interface.

## Supabase Project Link

- Project ref: `<YOUR_SUPABASE_PROJECT_REF>`
- Name: `<YOUR_PROJECT_NAME>`
- Region: `<YOUR_REGION>`
- Status: `ACTIVE_HEALTHY`
- Database host: `<YOUR_DB_HOST>`
- Postgres: `<YOUR_POSTGRES_VERSION>`

## Current Supabase Schema Snapshot

Public tables:
- public.google_tokens — rls_enabled: true
- public.mcp_call_log — rls_enabled: true

## Getting Started

1. Clone the repo
2. Configure Google OAuth credentials
3. Set up Supabase project variables
4. Run the MCP server

## Security

Never commit real credentials. This repository is a template. Use environment variables for all secrets. The service role key must never be exposed publicly. Keep `.env` in `.gitignore`. Rotate any credentials if they were ever committed.

## License

Private
