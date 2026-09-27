# Architecture

## Overview

Google Workspace MCP provides secure access to Gmail, Calendar, Drive, Docs, Sheets, Slides, and Tasks for AI agents.

## Components

- src/index.js: MCP server entrypoint
- src/config.js: environment config loader
- src/services/google.js: Google Workspace API wrappers
- docs/SUPABASE_PROJECT.md: Supabase metadata

## Data Flow

Agent -> MCP Server -> Google OAuth -> Google APIs
         
Optional persistence via Supabase project <YOUR_SUPABASE_PROJECT_REF>.
