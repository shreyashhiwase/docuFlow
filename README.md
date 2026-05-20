# DocuFlow

A lightweight collaborative document editor built for the Ajaia LLC Remote Project Manager assessment.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Fast DX, component model fits editor UI well |
| Editor | TipTap (ProseMirror) | Battle-tested rich-text, extensible, good React integration |
| Backend | Express.js | Minimal, fast to set up REST API |
| Database | SQLite (better-sqlite3) | Zero-config persistence, perfect for this scope |
| Styling | Plain CSS with design tokens | No build overhead, full control |

## Features

- **Document creation & editing** — rich-text with bold, italic, underline, headings (H1–H3), bullet lists, ordered lists
- **Rename documents** — click the title in the editor to rename inline
- **File import** — upload `.txt` or `.md` files to create new documents
- **Sharing** — share with any seeded user by email, set view/edit permissions, manage/revoke access
- **Persistence** — SQLite database, survives server restarts
- **Autosave** — content saves 1.5s after you stop typing

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Backend

```bash
cd backend
npm install
npm start
# Runs on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Open http://localhost:5173 in your browser.

## Seeded Accounts

All accounts use password: `password123`

| Name | Email |
|---|---|
| Alice Johnson | alice@docuflow.dev |
| Bob Smith | bob@docuflow.dev |
| Carol White | carol@docuflow.dev |

Alice has a sample "Welcome to DocuFlow" document pre-created.

## Testing the Sharing Flow

1. Log in as **Alice**
2. Open a document → click **Share**
3. Enter `bob@docuflow.dev`, choose **Edit** permission → Share
4. Log out → log in as **Bob**
5. Bob sees the shared document with "Can edit" badge
6. Bob can edit — changes are saved back
7. Log back in as Alice, revoke Bob's access from the Share modal

## Running Tests

```bash
# Start the backend first, then:
cd backend
npm test
```

Runs integration tests against the live API. All 10 tests should pass.

## File Upload

- Supported formats: `.txt`, `.md`, `.markdown`
- Max size: 5MB
- Paragraphs are split on double newlines
- Unsupported formats (docx, pdf) are rejected with a clear error

## Deployment

For production deployment, set environment variables:
- `PORT` — backend port (default: 3001)
- `FRONTEND_URL` — frontend origin for CORS (default: http://localhost:5173)

The frontend's `vite.config.js` proxies `/api` to the backend during development. In production, configure a reverse proxy (nginx/Caddy) to route `/api` to the backend and serve the frontend build.
# docuFlow
