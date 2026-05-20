const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = ['.txt', '.md', '.markdown', '.docx', '.pdf'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type "${ext}". Allowed: .txt, .md, .docx, .pdf`));
    }
  }
});

// ── Converters ────────────────────────────────────────────────────────────────

/** Plain text / markdown → TipTap JSON (split on double newlines) */
function textToTiptap(rawText) {
  const blocks = [];
  const lines = rawText.split(/\n/);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Markdown headings
    const h3 = line.match(/^###\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h1 = line.match(/^#\s+(.*)/);

    if (h1) {
      blocks.push({ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: h1[1] }] });
      i++; continue;
    }
    if (h2) {
      blocks.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: h2[1] }] });
      i++; continue;
    }
    if (h3) {
      blocks.push({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: h3[1] }] });
      i++; continue;
    }

    // Blank line → skip
    if (line.trim() === '') { i++; continue; }

    // Bullet list item
    const bullet = line.match(/^[-*+]\s+(.*)/);
    if (bullet) {
      const items = [];
      while (i < lines.length) {
        const bl = lines[i].match(/^[-*+]\s+(.*)/);
        if (!bl) break;
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: bl[1] }] }]
        });
        i++;
      }
      blocks.push({ type: 'bulletList', content: items });
      continue;
    }

    // Numbered list item
    const num = line.match(/^\d+\.\s+(.*)/);
    if (num) {
      const items = [];
      while (i < lines.length) {
        const nl = lines[i].match(/^\d+\.\s+(.*)/);
        if (!nl) break;
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: nl[1] }] }]
        });
        i++;
      }
      blocks.push({ type: 'orderedList', content: items });
      continue;
    }

    // Regular paragraph — collect consecutive non-blank lines
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^[#\-*+]/) && !lines[i].match(/^\d+\./)) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length) {
      blocks.push({
        type: 'paragraph',
        content: [{ type: 'text', text: paraLines.join(' ') }]
      });
    }
  }

  return { type: 'doc', content: blocks.length ? blocks : [{ type: 'paragraph' }] };
}

/** docx → TipTap JSON via mammoth (extracts HTML then converts) */
async function docxToTiptap(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value;
  return textToTiptap(text);
}

/** PDF → TipTap JSON via pdf-parse */
async function pdfToTiptap(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return textToTiptap(data.text);
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post('/import', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  const title = path.basename(req.file.originalname, ext);

  try {
    let tiptapDoc;

    if (ext === '.txt' || ext === '.md' || ext === '.markdown') {
      const rawText = fs.readFileSync(filePath, 'utf8');
      tiptapDoc = textToTiptap(rawText);
    } else if (ext === '.docx') {
      tiptapDoc = await docxToTiptap(filePath);
    } else if (ext === '.pdf') {
      tiptapDoc = await pdfToTiptap(filePath);
    } else {
      throw new Error(`Unsupported extension: ${ext}`);
    }

    const docId = uuidv4();
    db.prepare('INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)')
      .run(docId, title, JSON.stringify(tiptapDoc), req.user.id);

    fs.unlinkSync(filePath);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    res.status(201).json({
      document: doc,
      message: `Imported "${title}" successfully`
    });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: `Failed to process file: ${err.message}` });
  }
});

module.exports = router;
