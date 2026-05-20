# SUBMISSION.md

## What's Included

| File/Folder | Description |
|---|---|
| `backend/` | Express.js REST API + SQLite database |
| `backend/index.js` | Server entry point |
| `backend/db.js` | Database setup & seeding |
| `backend/routes/auth.js` | Login & user listing |
| `backend/routes/documents.js` | CRUD for documents |
| `backend/routes/share.js` | Document sharing logic |
| `backend/routes/upload.js` | File import (.txt, .md) |
| `backend/middleware/auth.js` | Auth middleware |
| `backend/tests/api.test.js` | Integration test suite (10 tests) |
| `frontend/` | React + Vite SPA |
| `frontend/src/pages/Login.jsx` | Login with seeded account quick-login |
| `frontend/src/pages/Dashboard.jsx` | Document list (owned + shared) |
| `frontend/src/pages/EditorPage.jsx` | TipTap rich-text editor |
| `frontend/src/components/EditorToolbar.jsx` | Formatting toolbar |
| `frontend/src/components/ShareModal.jsx` | Share & manage access |
| `frontend/src/components/Toast.jsx` | Notification toasts |
| `frontend/src/utils/api.js` | API client |
| `frontend/src/hooks/useAuth.jsx` | Auth context |
| `frontend/src/hooks/useToast.js` | Toast hook |
| `README.md` | Setup & run instructions |
| `ARCHITECTURE.md` | Architecture decisions & tradeoffs |
| `AI_WORKFLOW.md` | AI tool usage notes |
| `SUBMISSION.md` | This file |

## What's Working

- ✅ Create, rename, open, and delete documents
- ✅ Rich-text editing: bold, italic, underline, H1/H2/H3, bullet list, ordered list
- ✅ Autosave (1.5s debounce after typing stops)
- ✅ Import .txt and .md files as new documents
- ✅ Share documents by email with view or edit permission
- ✅ Update or revoke sharing access
- ✅ Owned vs. shared distinction (badges on document cards)
- ✅ Read-only mode for view-permission shares
- ✅ Persistence across server restarts (SQLite)
- ✅ Integration test suite

## What's Incomplete

- ⏳ **Docx import** — mammoth.js is installed, route not wired. Next 30 min task.
- ⏳ **Real-time collaboration** — last-write-wins; no live cursor/presence
- ⏳ **Password hashing** — passwords are plaintext for scope; bcrypt would be a 20-min add
- ⏳ **Deployed URL** — not deployed externally; runs locally per README

## What I'd Build Next (2–4 hours)

1. Real-time presence indicators via WebSocket (who's viewing/editing)
2. Docx import via mammoth.js
3. Export to Markdown / PDF
4. Version history (append-only snapshots table, point-in-time restore)
5. bcrypt + JWT for proper auth
