# Google Workspace MCP

MCP server that provides secure, standards-compliant access to Google Workspace resources for AI agents, including Gmail, Calendar, Drive, Docs, Sheets, Slides and Tasks.

## Overview

This project implements a Model Context Protocol server that exposes Google Workspace APIs to AI agents. It enables agents to read and write Gmail messages, manage Calendar events, access Drive files, read and edit Docs/Sheets/Slides, and interact with Tasks — all through a unified MCP interface.

## Supabase Project Link

- Project ref: `xyqcevskreoethzwszko`
- Name: Agybot
- Region: eu-central-1
- Status: ACTIVE_HEALTHY
- Database host: db.xyqcevskreoethzwszko.supabase.co
- Postgres: 17.6.1.166

## Current Supabase Schema Snapshot

Public tables:
- public.google_tokens — rls_enabled: true, rows: 1
- public.mcp_call_log — rls_enabled: true, rows: 77

## Getting Started

1. Clone the repo
2. Configure Google OAuth credentials
3. Set up Supabase project variables
4. Run the MCP server

## License

Private
