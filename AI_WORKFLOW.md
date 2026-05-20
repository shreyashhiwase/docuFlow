# AI Workflow Note

## Tools Used

- **GitHub Copilot** — inline completions during editing

---

## Where AI Materially Sped Up Work

### 1. TipTap integration boilerplate
Getting TipTap initialized with the right extensions, editorProps, and content serialization took a prompt rather than digging through docs. AI got the extension imports and `setContent` / `getJSON` pattern right on the first try.

### 2. SQLite schema + seeding
The CREATE TABLE statements with proper foreign keys, ON CONFLICT handling for upserts, and the seeding logic were generated and correct. I adjusted the cascade delete behavior and the junction table UNIQUE constraint.

### 3. Express middleware pattern
Auth middleware (`requireAuth`) and the error handler were scaffolded quickly. I reviewed and simplified — AI initially added session logic I didn't need.

### 4. CSS design system
The CSS variables and base component styles (buttons, inputs, modal, toast, badge) were generated from a design direction prompt. I adjusted color values and added the `DM Serif Display` / `DM Sans` pairing.

---

## What I Changed or Rejected

| AI Output | My Decision |
|---|---|
| Used JWT + bcrypt for auth | **Replaced** with simple header-based user ID — right scope for this timebox, simpler to test |
| Added Redux for state management | **Rejected** — React state + prop drilling is sufficient at this component depth |
| Used `multer.memoryStorage()` | **Changed** to `diskStorage` then immediate delete after parsing — more explicit about lifecycle |
| Styled components suggestion | **Rejected** — plain CSS with variables is faster and requires no build config |
| Generated 20+ tests | **Scoped down** to 10 integration tests covering the full flow — coverage over quantity |
| Generic sans-serif typography | **Replaced** with `DM Serif Display` / `DM Sans` pairing for personality |

---

## How I Verified Correctness

- **Backend**: Ran integration test suite (`npm test`) end-to-end; manually tested each API route with curl
- **Sharing logic**: Tested all 4 states — owner access, edit share, view share, no share — by switching users in the browser
- **Editor persistence**: Hard-refreshed the browser after editing to confirm SQLite round-trip
- **File upload**: Tested with a real `.md` file and a `.txt` file; confirmed rejection of `.docx`
- **UI quality**: Reviewed at 100% zoom in Chrome and Firefox; checked the editor on a narrower viewport

The bar for "AI-generated code I'd ship" was: does it do what I'd write by hand, with no hidden assumptions or edge cases I haven't thought through? If not, I rewrote it.
