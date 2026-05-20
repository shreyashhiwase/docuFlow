# Architecture Note

## What I Prioritized

### 1. Core editing experience first
TipTap was chosen over a textarea or contenteditable from scratch because it gives ProseMirror's document model (structured, serializable JSON) without the complexity of building from scratch. This directly enables reliable persistence and future extensibility (comments, collaboration) without rearchitecting.

### 2. Simple, honest auth
Given the scope, I used a header-based user ID (`x-user-id`) instead of JWT/sessions. This is clearly scoped and easy to upgrade. The seeded accounts let reviewers test sharing flows immediately without registration friction.

### 3. SQLite for zero-friction persistence
SQLite with `better-sqlite3` is synchronous, requires no external service, and survives restarts. For a team productivity tool at early scale, it's the right call. The schema is straightforward — documents, users, document_shares — with proper foreign keys and cascade deletes.

### 4. Autosave over manual save
Documents save 1.5 seconds after the user stops typing. This is the right UX default for a doc editor — it matches user mental models from Google Docs and removes a class of "I forgot to save" bugs. Save status is shown in the header.

### 5. Share model with clear intent
Owner/shared distinction is visible in the document list (badges). Sharing is by email (more discoverable than user ID). Permissions are `view` or `edit`, enforced on both frontend (read-only editor) and backend (PUT document validates permission).

## What I Deprioritized

- **Real-time collaboration** — WebSocket-based CRDT sync (e.g. Yjs) is the right next step but requires significant infra. The current model is last-write-wins with autosave.
- **Authentication hardening** — No password hashing, no JWT expiry. Would add bcrypt + JWT or use an auth provider (Clerk, Supabase Auth) in production.
- **Docx import** — mammoth.js is installed but file import is scoped to .txt/.md to keep the parsing logic clean and testable. Docx import would be the next file type to add.
- **Real-time presence indicators** — Nice to have but not core to the editing value prop.

## Data Model

```
users           (id, email, name, password, created_at)
documents       (id, title, content, owner_id, created_at, updated_at)
document_shares (id, document_id, shared_with_id, permission, shared_at)
```

Content is stored as TipTap JSON (stringified). This preserves structure and is portable to other ProseMirror-based editors.

## API Surface

```
POST   /api/auth/login
GET    /api/auth/users

GET    /api/documents
POST   /api/documents
GET    /api/documents/:id
PUT    /api/documents/:id
DELETE /api/documents/:id

GET    /api/share/:documentId
POST   /api/share
PUT    /api/share/:documentId/:userId
DELETE /api/share/:documentId/:userId

POST   /api/upload/import
```

## With 2–4 More Hours

1. **Real-time awareness** — Show who else is viewing/editing (WebSocket ping loop, no CRDT needed for indicators)
2. **Docx import** — mammoth.js is already installed, just needs the route wired
3. **Version history** — Append-only `document_versions` table, point-in-time restore
4. **Export** — TipTap's Markdown extension → download as .md; html → PDF via print
5. **Password hashing + JWT** — bcrypt + jsonwebtoken, 30 min work
