# Media Manager

## Purpose

This application is a searchable catalog of physical event-media folder locations.

Actual photos/videos remain on local computers, SSDs, HDDs, or other storage.

The application must never upload, move, copy, or scan media files.

## Core hierarchy

Event
→ Day
→ Room
→ Session
→ Media Location

## Agenda

Agenda/session data comes from the external agenda API.

The API is the source of truth for:
- sessions
- dates
- times
- rooms
- session types
- tracks

## Media Location

MediaLocation stores:
- event
- session
- storage
- folder path
- media type
- description
- notes
- tags

## Development rules

- Do not rewrite existing architecture unnecessarily.
- Do not install packages without a technical reason.
- Use TypeScript.
- Use Prisma/PostgreSQL.
- Keep server-side and client-side responsibilities clear.
- Validate all user input.
- Preserve existing Media Locations when syncing agenda data.
- Never automatically delete historical sessions during sync.
- Keep the MVP simple.